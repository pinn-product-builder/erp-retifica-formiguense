import { supabase } from '@/integrations/supabase/client';

export interface AdvancedFinancialIndicators {
  inadimplenciaPercent: number;
  pmrDays: number | null;
  pmpDays: number | null;
  ticketMedio: number | null;
  giroCaixaDias: number | null;
}

export class AdvancedIndicatorsService {
  static async compute(orgId: string, year: number, month: number): Promise<AdvancedFinancialIndicators> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextM = month === 12 ? 1 : month + 1;
    const nextY = month === 12 ? year + 1 : year;
    const end = `${nextY}-${String(nextM).padStart(2, '0')}-01`;

    const { data: arOpen } = await supabase
      .from('accounts_receivable')
      .select('amount, status, due_date')
      .eq('org_id', orgId)
      .in('status', ['pending', 'overdue', 'renegotiated']);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let totalOpen = 0;
    let overdueOpen = 0;
    for (const r of arOpen ?? []) {
      const row = r as { amount: number; status: string; due_date: string };
      const amt = Number(row.amount);
      totalOpen += amt;
      if (row.status === 'overdue' || new Date(row.due_date) < today) overdueOpen += amt;
    }
    const inadimplenciaPercent = totalOpen > 0 ? (overdueOpen / totalOpen) * 100 : 0;

    const { data: arPaid } = await supabase
      .from('accounts_receivable')
      .select('due_date, payment_date')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .not('payment_date', 'is', null)
      .gte('payment_date', start)
      .lt('payment_date', end);
    let pmrSum = 0;
    let pmrN = 0;
    for (const r of arPaid ?? []) {
      const row = r as { due_date: string; payment_date: string };
      const d1 = new Date(row.due_date).getTime();
      const d2 = new Date(row.payment_date).getTime();
      pmrSum += (d2 - d1) / 86400000;
      pmrN += 1;
    }
    const pmrDays = pmrN > 0 ? Math.round(pmrSum / pmrN) : null;

    const { data: apPaid } = await supabase
      .from('accounts_payable')
      .select('created_at, payment_date')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .not('payment_date', 'is', null)
      .gte('payment_date', start)
      .lt('payment_date', end);
    let pmpSum = 0;
    let pmpN = 0;
    for (const r of apPaid ?? []) {
      const row = r as { created_at: string | null; payment_date: string };
      const c = row.created_at ? new Date(row.created_at).getTime() : null;
      const p = new Date(row.payment_date).getTime();
      if (c != null) {
        pmpSum += (p - c) / 86400000;
        pmpN += 1;
      }
    }
    const pmpDays = pmpN > 0 ? Math.round(pmpSum / pmpN) : null;

    const { count: ordersDone } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('updated_at', start)
      .lt('updated_at', end);
    const { data: rev } = await supabase
      .from('accounts_receivable')
      .select('amount')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lt('payment_date', end);
    const totalRev = (rev ?? []).reduce((s, x) => s + Number((x as { amount: number }).amount), 0);
    const ticketMedio =
      ordersDone && ordersDone > 0 ? Math.round((totalRev / ordersDone) * 100) / 100 : null;

    const { data: cf } = await supabase
      .from('cash_flow')
      .select('amount, transaction_type')
      .eq('org_id', orgId)
      .eq('is_intercompany', false)
      .gte('transaction_date', start)
      .lt('transaction_date', end);
    let expenses = 0;
    for (const r of cf ?? []) {
      const row = r as { amount: number; transaction_type: string };
      if (row.transaction_type === 'expense') expenses += Number(row.amount);
    }
    const dailyExp = expenses / 30;
    const { data: balRows } = await supabase
      .from('cash_flow')
      .select('amount, transaction_type, transaction_date')
      .eq('org_id', orgId)
      .eq('is_intercompany', false)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: true });
    let balance = 0;
    for (const r of balRows ?? []) {
      const row = r as { amount: number; transaction_type: string };
      if (row.transaction_type === 'income') balance += Number(row.amount);
      else balance -= Number(row.amount);
    }
    const giroCaixaDias =
      dailyExp > 0 && balance > 0 ? Math.round(balance / dailyExp) : null;

    return {
      inadimplenciaPercent: Math.round(inadimplenciaPercent * 100) / 100,
      pmrDays,
      pmpDays,
      ticketMedio,
      giroCaixaDias,
    };
  }
}
