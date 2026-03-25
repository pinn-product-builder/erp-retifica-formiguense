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
    horizonDays: number,
    costCenterId?: string | null
  ): Promise<{
    series: { date: string; receivables: number; payables: number }[];
    buckets: { label: string; receivables: number; payables: number }[];
    overdue: { receivables: number; payables: number };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + Math.max(0, horizonDays));
    const todayStr = today.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    let arQ = supabase
      .from('accounts_receivable')
      .select('due_date, amount, status, cost_center_id')
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated'])
      .lte('due_date', endStr);
    if (costCenterId) arQ = arQ.eq('cost_center_id', costCenterId);
    const { data: ar, error: arErr } = await arQ;
    if (arErr) throw new Error(arErr.message);

    let apQ = supabase
      .from('accounts_payable')
      .select('due_date, amount, status, cost_center_id')
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated'])
      .lte('due_date', endStr);
    if (costCenterId) apQ = apQ.eq('cost_center_id', costCenterId);
    const { data: ap, error: apErr } = await apQ;
    if (apErr) throw new Error(apErr.message);

    const dayKeys: string[] = [];
    for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
      dayKeys.push(d.toISOString().slice(0, 10));
    }
    const byDay = new Map<string, { receivables: number; payables: number }>();
    for (const k of dayKeys) byDay.set(k, { receivables: 0, payables: 0 });

    const bucketDefs = [
      { label: 'Vencidos', min: -Infinity, max: -1 },
      { label: 'Hoje', min: 0, max: 0 },
      { label: '1–30 dias', min: 1, max: 30 },
      { label: '31–60 dias', min: 31, max: 60 },
      { label: '61–90 dias', min: 61, max: 90 },
      { label: 'Acima de 90 dias', min: 91, max: Infinity },
    ];
    const buckets = bucketDefs.map((b) => ({
      label: b.label,
      receivables: 0,
      payables: 0,
    }));

    let overdueR = 0;
    let overdueP = 0;

    const addAr = (dueYmd: string, amt: number) => {
      const due = new Date(dueYmd + 'T12:00:00');
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
      if (dueYmd < todayStr) {
        overdueR += amt;
        buckets[0].receivables += amt;
        return;
      }
      if (dueYmd <= endStr) {
        const cur = byDay.get(dueYmd) ?? { receivables: 0, payables: 0 };
        cur.receivables += amt;
        byDay.set(dueYmd, cur);
      }
      for (let i = 1; i < bucketDefs.length; i++) {
        const b = bucketDefs[i];
        if (diff >= b.min && diff <= b.max) {
          buckets[i].receivables += amt;
          break;
        }
      }
    };

    const addAp = (dueYmd: string, amt: number) => {
      const due = new Date(dueYmd + 'T12:00:00');
      const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
      if (dueYmd < todayStr) {
        overdueP += amt;
        buckets[0].payables += amt;
        return;
      }
      if (dueYmd <= endStr) {
        const cur = byDay.get(dueYmd) ?? { receivables: 0, payables: 0 };
        cur.payables += amt;
        byDay.set(dueYmd, cur);
      }
      for (let i = 1; i < bucketDefs.length; i++) {
        const b = bucketDefs[i];
        if (diff >= b.min && diff <= b.max) {
          buckets[i].payables += amt;
          break;
        }
      }
    };

    for (const r of ar ?? []) {
      if (r.status === 'paid' || r.status === 'cancelled') continue;
      addAr(r.due_date as string, Number(r.amount));
    }
    for (const p of ap ?? []) {
      if (p.status === 'paid' || p.status === 'cancelled') continue;
      addAp(p.due_date as string, Number(p.amount));
    }

    const series = dayKeys.map((date) => {
      const v = byDay.get(date) ?? { receivables: 0, payables: 0 };
      return { date, receivables: v.receivables, payables: v.payables };
    });

    return { series, buckets, overdue: { receivables: overdueR, payables: overdueP } };
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
