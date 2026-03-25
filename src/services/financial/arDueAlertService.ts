import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AlertRow = Database['public']['Tables']['ar_due_alerts']['Row'];

export type ArDueAlertType = 'due_in_7_days' | 'due_in_3_days' | 'due_today';

export type ArDueAlertStatus = 'unread' | 'read' | 'in_negotiation';

export type ArDueAlertWithDetails = AlertRow & {
  accounts_receivable: {
    id: string;
    amount: number;
    due_date: string;
    status: string | null;
    customers: { name: string; trade_name: string | null } | null;
  } | null;
};

export class ArDueAlertService {
  static alertTypeLabel(t: string): string {
    if (t === 'due_today') return 'Vence hoje';
    if (t === 'due_in_3_days') return 'Vence em 3 dias';
    if (t === 'due_in_7_days') return 'Vence em 7 dias';
    return t;
  }

  static async syncForOrg(orgId: string, referenceDate: string): Promise<void> {
    const { data: pending, error } = await supabase
      .from('accounts_receivable')
      .select('id, due_date, customer_id')
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated']);
    if (error) throw new Error(error.message);
    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);
    for (const ar of pending ?? []) {
      const due = new Date((ar as { due_date: string }).due_date);
      due.setHours(0, 0, 0, 0);
      const diff = Math.round((due.getTime() - ref.getTime()) / 86400000);
      const types: ArDueAlertType[] = [];
      if (diff === 7) types.push('due_in_7_days');
      if (diff === 3) types.push('due_in_3_days');
      if (diff === 0) types.push('due_today');
      for (const alertType of types) {
        const arId = (ar as { id: string }).id;
        const { data: existing } = await supabase
          .from('ar_due_alerts')
          .select('id')
          .eq('org_id', orgId)
          .eq('receivable_account_id', arId)
          .eq('alert_type', alertType)
          .eq('reference_date', referenceDate)
          .maybeSingle();
        if (existing) continue;
        await supabase.from('ar_due_alerts').insert({
          org_id: orgId,
          receivable_account_id: arId,
          alert_type: alertType,
          reference_date: referenceDate,
          is_read: false,
          status: 'unread',
        });
      }
    }
  }

  static async listWithDetails(orgId: string, limit = 50): Promise<ArDueAlertWithDetails[]> {
    const { data, error } = await supabase
      .from('ar_due_alerts')
      .select(
        `
        *,
        accounts_receivable (
          id,
          amount,
          due_date,
          status,
          customers ( name, trade_name )
        )
      `
      )
      .eq('org_id', orgId)
      .in('status', ['unread', 'in_negotiation'])
      .order('reference_date', { ascending: true })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as ArDueAlertWithDetails[]) ?? [];
  }

  static async countActive(orgId: string): Promise<number> {
    const { count, error } = await supabase
      .from('ar_due_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['unread', 'in_negotiation']);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  static async markRead(orgId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('ar_due_alerts')
      .update({ is_read: true, status: 'read' })
      .eq('org_id', orgId)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async markAllRead(orgId: string): Promise<void> {
    const { error } = await supabase
      .from('ar_due_alerts')
      .update({ is_read: true, status: 'read' })
      .eq('org_id', orgId)
      .in('status', ['unread', 'in_negotiation']);
    if (error) throw new Error(error.message);
  }

  static async setInNegotiation(orgId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('ar_due_alerts')
      .update({ status: 'in_negotiation', is_read: false })
      .eq('org_id', orgId)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async listOpen(orgId: string): Promise<AlertRow[]> {
    const { data, error } = await supabase
      .from('ar_due_alerts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_read', false)
      .order('reference_date', { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data as AlertRow[]) ?? [];
  }
}
