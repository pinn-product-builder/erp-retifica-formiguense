import { supabase } from '@/integrations/supabase/client';

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

export class FinancialReportService {
  static async agingReceivables(orgId: string): Promise<AgingBucket[]> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('amount, due_date, status')
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated']);
    if (error) throw new Error(error.message);
    const today = new Date();
    const buckets: AgingBucket[] = [
      { label: '0-30', amount: 0, count: 0 },
      { label: '31-60', amount: 0, count: 0 },
      { label: '61-90', amount: 0, count: 0 },
      { label: '90+', amount: 0, count: 0 },
    ];
    for (const r of data ?? []) {
      const due = new Date(r.due_date as string);
      const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const amt = Number(r.amount);
      let idx = 3;
      if (days <= 30) idx = 0;
      else if (days <= 60) idx = 1;
      else if (days <= 90) idx = 2;
      buckets[idx].amount += amt;
      buckets[idx].count += 1;
    }
    return buckets;
  }

  static async dueCurve(
    orgId: string,
    days: number
  ): Promise<{ date: string; receivables: number; payables: number }[]> {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const { data: ar } = await supabase
      .from('accounts_receivable')
      .select('due_date, amount, status')
      .eq('org_id', orgId)
      .gte('due_date', start.toISOString().slice(0, 10))
      .lte('due_date', end.toISOString().slice(0, 10));
    const { data: ap } = await supabase
      .from('accounts_payable')
      .select('due_date, amount, status')
      .eq('org_id', orgId)
      .gte('due_date', start.toISOString().slice(0, 10))
      .lte('due_date', end.toISOString().slice(0, 10));

    const map = new Map<string, { receivables: number; payables: number }>();
    for (const r of ar ?? []) {
      if (r.status === 'paid' || r.status === 'cancelled') continue;
      const d = r.due_date as string;
      const cur = map.get(d) ?? { receivables: 0, payables: 0 };
      cur.receivables += Number(r.amount);
      map.set(d, cur);
    }
    for (const p of ap ?? []) {
      if (p.status === 'paid' || p.status === 'cancelled') continue;
      const d = p.due_date as string;
      const cur = map.get(d) ?? { receivables: 0, payables: 0 };
      cur.payables += Number(p.amount);
      map.set(d, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, receivables: v.receivables, payables: v.payables }));
  }

  static async upcomingAlerts(
    orgId: string,
    horizonDays: number
  ): Promise<{ type: 'ar' | 'ap'; id: string; due_date: string; amount: number; label: string }[]> {
    const end = new Date();
    end.setDate(end.getDate() + horizonDays);
    const todayStr = new Date().toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const { data: ar } = await supabase
      .from('accounts_receivable')
      .select('id, due_date, amount, customers(name)')
      .eq('org_id', orgId)
      .gte('due_date', todayStr)
      .lte('due_date', endStr)
      .in('status', ['pending', 'overdue', 'renegotiated']);

    const { data: ap } = await supabase
      .from('accounts_payable')
      .select('id, due_date, amount, supplier_name')
      .eq('org_id', orgId)
      .gte('due_date', todayStr)
      .lte('due_date', endStr)
      .eq('status', 'pending');

    const out: { type: 'ar' | 'ap'; id: string; due_date: string; amount: number; label: string }[] = [];
    for (const r of ar ?? []) {
      const c = r.customers as { name?: string } | null;
      out.push({
        type: 'ar',
        id: r.id as string,
        due_date: r.due_date as string,
        amount: Number(r.amount),
        label: c?.name ?? 'Cliente',
      });
    }
    for (const p of ap ?? []) {
      out.push({
        type: 'ap',
        id: p.id as string,
        due_date: p.due_date as string,
        amount: Number(p.amount),
        label: p.supplier_name as string,
      });
    }
    return out.sort((a, b) => a.due_date.localeCompare(b.due_date));
  }
}
