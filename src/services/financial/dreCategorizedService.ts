import { supabase } from '@/integrations/supabase/client';

export type DreCategorizedMonth = {
  month: number;
  year: number;
  total_revenue: number;
  direct_costs: number;
  tax_expenses: number;
  operational_expenses: number;
  partner_withdrawals: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
};

function monthRange(year: number, month: number): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const last = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(last)}`;
  return { start, end };
}

export class DreCategorizedService {
  static async computeMonth(orgId: string, year: number, month: number): Promise<DreCategorizedMonth> {
    const { start, end } = monthRange(year, month);

    const { data: ars, error: arErr } = await supabase
      .from('accounts_receivable')
      .select('amount')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lte('payment_date', end);
    if (arErr) throw new Error(arErr.message);
    const total_revenue = (ars ?? []).reduce((s, r) => s + Number(r.amount), 0);

    const { data: aps, error: apErr } = await supabase
      .from('accounts_payable')
      .select(
        `
        amount,
        expense_categories ( category )
      `
      )
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lte('payment_date', end);
    if (apErr) throw new Error(apErr.message);

    let direct_costs = 0;
    let tax_expenses = 0;
    let operational_expenses = 0;

    for (const row of aps ?? []) {
      const ec = row.expense_categories as { category?: string } | null;
      const cat = ec?.category ?? '';
      const amt = Number((row as { amount: number }).amount);
      if (cat === 'variable' || cat === 'supplier') {
        direct_costs += amt;
      } else if (cat === 'tax') {
        tax_expenses += amt;
      } else if (
        cat === 'fixed' ||
        cat === 'salary' ||
        cat === 'equipment' ||
        cat === 'maintenance'
      ) {
        operational_expenses += amt;
      } else {
        operational_expenses += amt;
      }
    }

    const { data: pws, error: pwErr } = await supabase
      .from('partner_withdrawals')
      .select('amount')
      .eq('org_id', orgId)
      .gte('withdrawal_date', start)
      .lte('withdrawal_date', end);
    if (pwErr) throw new Error(pwErr.message);
    const partner_withdrawals = (pws ?? []).reduce((s, r) => s + Number(r.amount), 0);

    const gross_profit = total_revenue - direct_costs - tax_expenses;
    const net_profit = gross_profit - operational_expenses - partner_withdrawals;
    const profit_margin = total_revenue > 0 ? (net_profit / total_revenue) * 100 : 0;

    return {
      month,
      year,
      total_revenue,
      direct_costs,
      tax_expenses,
      operational_expenses,
      partner_withdrawals,
      gross_profit,
      net_profit,
      profit_margin,
    };
  }

  static async computeYear(orgId: string, year: number): Promise<DreCategorizedMonth[]> {
    const out: DreCategorizedMonth[] = [];
    for (let m = 1; m <= 12; m++) {
      out.push(await this.computeMonth(orgId, year, m));
    }
    return out;
  }
}
