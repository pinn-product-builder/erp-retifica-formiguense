import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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
  static async computeMonth(
    orgId: string,
    year: number,
    month: number,
    costCenterId?: string | null
  ): Promise<DreCategorizedMonth> {
    const { start, end } = monthRange(year, month);

    let arQ = supabase
      .from('accounts_receivable')
      .select('amount')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .gte('payment_date', start)
      .lte('payment_date', end);
    if (costCenterId) arQ = arQ.eq('cost_center_id', costCenterId);
    const { data: ars, error: arErr } = await arQ;
    if (arErr) throw new Error(arErr.message);
    const total_revenue = (ars ?? []).reduce((s, r) => s + Number(r.amount), 0);

    let apQ = supabase
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
    if (costCenterId) apQ = apQ.eq('cost_center_id', costCenterId);
    const { data: aps, error: apErr } = await apQ;
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

    let partner_withdrawals = 0;
    if (!costCenterId) {
      const { data: pws, error: pwErr } = await supabase
        .from('partner_withdrawals')
        .select('amount')
        .eq('org_id', orgId)
        .gte('withdrawal_date', start)
        .lte('withdrawal_date', end);
      if (pwErr) throw new Error(pwErr.message);
      partner_withdrawals = (pws ?? []).reduce((s, r) => s + Number(r.amount), 0);
    }

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

  static async computeYear(
    orgId: string,
    year: number,
    costCenterId?: string | null
  ): Promise<DreCategorizedMonth[]> {
    const out: DreCategorizedMonth[] = [];
    for (let m = 1; m <= 12; m++) {
      out.push(await this.computeMonth(orgId, year, m, costCenterId));
    }
    return out;
  }

  static async compareThreeMonths(
    orgId: string,
    year: number,
    month: number,
    costCenterId?: string | null
  ): Promise<{
    current: DreCategorizedMonth;
    prevMonth: DreCategorizedMonth;
    prevYearSame: DreCategorizedMonth;
  }> {
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    const [current, prevMonth, prevYearSame] = await Promise.all([
      this.computeMonth(orgId, year, month, costCenterId),
      this.computeMonth(orgId, py, pm, costCenterId),
      this.computeMonth(orgId, year - 1, month, costCenterId),
    ]);
    return { current, prevMonth, prevYearSame };
  }

  static async persistMonthSnapshot(
    orgId: string,
    year: number,
    month: number
  ): Promise<{ error: Error | null }> {
    const m = await this.computeMonth(orgId, year, month);
    const { data: existing } = await supabase
      .from('monthly_dre')
      .select('id')
      .eq('org_id', orgId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();
    const payload: Database['public']['Tables']['monthly_dre']['Insert'] = {
      org_id: orgId,
      year,
      month,
      total_revenue: m.total_revenue,
      direct_costs: m.direct_costs,
      taxes: m.tax_expenses,
      operational_expenses: m.operational_expenses,
      partners_withdrawals: m.partner_withdrawals,
      gross_profit: m.gross_profit,
      net_profit: m.net_profit,
      profit_margin: m.profit_margin,
      net_revenue: m.total_revenue,
      operational_result: m.gross_profit - m.operational_expenses,
      admin_expenses: 0,
      commercial_expenses: 0,
      financial_expenses: 0,
      deductions: 0,
    };
    const row = existing as { id: string } | null;
    if (row?.id) {
      const patch: Database['public']['Tables']['monthly_dre']['Update'] = {
        total_revenue: m.total_revenue,
        direct_costs: m.direct_costs,
        taxes: m.tax_expenses,
        operational_expenses: m.operational_expenses,
        partners_withdrawals: m.partner_withdrawals,
        gross_profit: m.gross_profit,
        net_profit: m.net_profit,
        profit_margin: m.profit_margin,
        net_revenue: m.total_revenue,
        operational_result: m.gross_profit - m.operational_expenses,
        admin_expenses: 0,
        commercial_expenses: 0,
        financial_expenses: 0,
        deductions: 0,
      };
      const { error } = await supabase.from('monthly_dre').update(patch).eq('id', row.id);
      return { error: error ? new Error(error.message) : null };
    }
    const { error } = await supabase.from('monthly_dre').insert(payload);
    return { error: error ? new Error(error.message) : null };
  }
}
