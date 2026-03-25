import { differenceInCalendarDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { formatBRL } from '@/lib/financialFormat';
import { formatLocalYmd } from '@/lib/dueAlertDates';

type Row = Database['public']['Tables']['financial_notifications']['Row'];
type Insert = Database['public']['Tables']['financial_notifications']['Insert'];

const WINDOWS = [7, 3, 0] as const;

export type DueWindowSummary = {
  receivable: { count: number; totalAmount: number };
  payable: { count: number; totalAmount: number };
};

function diffDaysFromToday(dueIso: string, today: Date): number {
  const due = parseISO(dueIso.slice(0, 10));
  return differenceInCalendarDays(due, today);
}

export class FinancialNotificationService {
  static async listUnread(orgId: string, limit = 50): Promise<Row[]> {
    const { data, error } = await supabase
      .from('financial_notifications')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async countUnread(orgId: string): Promise<number> {
    const { count, error } = await supabase
      .from('financial_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async markRead(orgId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_notifications')
      .update({ is_read: true })
      .eq('org_id', orgId)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async markAllRead(orgId: string): Promise<void> {
    const { error } = await supabase
      .from('financial_notifications')
      .update({ is_read: true })
      .eq('org_id', orgId)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
  }

  static async getDueWindowSummary(orgId: string): Promise<DueWindowSummary> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = [0, 3, 7].map((d) => {
      const x = new Date(today);
      x.setDate(x.getDate() + d);
      return formatLocalYmd(x);
    });

    const { data: ar, error: arErr } = await supabase
      .from('accounts_receivable')
      .select('amount, due_date')
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated'])
      .in('due_date', dates);

    const { data: ap, error: apErr } = await supabase
      .from('accounts_payable')
      .select('amount, due_date')
      .eq('org_id', orgId)
      .eq('status', 'pending')
      .in('due_date', dates);

    if (arErr) throw new Error(arErr.message);
    if (apErr) throw new Error(apErr.message);

    let arCount = 0;
    let arSum = 0;
    for (const r of ar ?? []) {
      arCount += 1;
      arSum += Number((r as { amount: number }).amount);
    }

    let apCount = 0;
    let apSum = 0;
    for (const p of ap ?? []) {
      apCount += 1;
      apSum += Number((p as { amount: number }).amount);
    }

    return {
      receivable: { count: arCount, totalAmount: arSum },
      payable: { count: apCount, totalAmount: apSum },
    };
  }

  static async syncDueNotifications(orgId: string, runDate: string): Promise<void> {
    const today = parseISO(runDate.slice(0, 10));
    today.setHours(0, 0, 0, 0);

    const [{ data: arList, error: arErr }, { data: apList, error: apErr }] = await Promise.all([
      supabase
        .from('accounts_receivable')
        .select('id, amount, due_date, customers (name)')
        .eq('org_id', orgId)
        .in('status', ['pending', 'overdue', 'renegotiated']),
      supabase
        .from('accounts_payable')
        .select('id, amount, due_date, supplier_name, description')
        .eq('org_id', orgId)
        .eq('status', 'pending'),
    ]);

    if (arErr) throw new Error(arErr.message);
    if (apErr) throw new Error(apErr.message);

    const inserts: Insert[] = [];

    for (const raw of arList ?? []) {
      const ar = raw as {
        id: string;
        amount: number;
        due_date: string;
        customers: { name?: string } | null;
      };
      const diff = diffDaysFromToday(ar.due_date, today);
      if (!WINDOWS.includes(diff as (typeof WINDOWS)[number])) continue;
      const kind =
        diff === 7 ? 'receivable_due_7' : diff === 3 ? 'receivable_due_3' : 'receivable_due_0';
      const label =
        diff === 7 ? 'em 7 dias' : diff === 3 ? 'em 3 dias' : diff === 0 ? 'hoje' : '';
      const cust = ar.customers?.name ?? 'Cliente';
      const title = `Conta a receber ${label}`;
      const message = `${cust} — ${formatBRL(ar.amount)} (venc. ${ar.due_date.slice(0, 10)})`;
      const dedupe_key = `${kind}_${ar.id}_${runDate}`;
      inserts.push({
        org_id: orgId,
        type: kind,
        title,
        message,
        reference_id: ar.id,
        reference_type: 'accounts_receivable',
        dedupe_key,
        is_read: false,
      });
    }

    for (const raw of apList ?? []) {
      const ap = raw as {
        id: string;
        amount: number;
        due_date: string;
        supplier_name: string | null;
        description: string | null;
      };
      const diff = diffDaysFromToday(ap.due_date, today);
      if (!WINDOWS.includes(diff as (typeof WINDOWS)[number])) continue;
      const kind =
        diff === 7 ? 'payable_due_7' : diff === 3 ? 'payable_due_3' : 'payable_due_0';
      const label =
        diff === 7 ? 'em 7 dias' : diff === 3 ? 'em 3 dias' : diff === 0 ? 'hoje' : '';
      const sup = ap.supplier_name ?? ap.description ?? 'Fornecedor';
      const title = `Conta a pagar ${label}`;
      const message = `${sup} — ${formatBRL(ap.amount)} (venc. ${ap.due_date.slice(0, 10)})`;
      const dedupe_key = `${kind}_${ap.id}_${runDate}`;
      inserts.push({
        org_id: orgId,
        type: kind,
        title,
        message,
        reference_id: ap.id,
        reference_type: 'accounts_payable',
        dedupe_key,
        is_read: false,
      });
    }

    for (const row of inserts) {
      const { error } = await supabase.from('financial_notifications').insert(row);
      if (error && error.code !== '23505') {
        throw new Error(error.message);
      }
    }
  }

  static async upsertDueAlerts(
    orgId: string,
    items: Array<{
      type: string;
      title: string;
      message: string;
      reference_id: string | null;
      reference_type: string | null;
    }>
  ): Promise<void> {
    for (const it of items) {
      const row: Insert = {
        org_id: orgId,
        type: it.type,
        title: it.title,
        message: it.message,
        reference_id: it.reference_id,
        reference_type: it.reference_type,
        is_read: false,
      };
      const { error } = await supabase.from('financial_notifications').insert(row);
      if (error && error.code !== '23505') {
        throw new Error(error.message);
      }
    }
  }
}
