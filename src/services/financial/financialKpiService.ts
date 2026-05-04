import { supabase } from '@/integrations/supabase/client';
import type { FinancialKpis } from '@/services/financial/types';
import { applyOrgIdFilter } from '@/services/financial/orgScope';

export class FinancialKpiService {
  static async getKpis(orgIds: string[]): Promise<FinancialKpis> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

    const [cashFlowRes, receivableRes, payableRes] = await Promise.all([
      applyOrgIdFilter(
        supabase.from('cash_flow').select('transaction_type, amount'),
        'org_id',
        orgIds
      )
        .eq('is_intercompany', false)
        .gte('transaction_date', monthStart),
      applyOrgIdFilter(
        supabase.from('accounts_receivable').select('status, amount, due_date'),
        'org_id',
        orgIds
      ),
      applyOrgIdFilter(supabase.from('accounts_payable').select('status, amount, due_date'), 'org_id', orgIds),
    ]);

    const income =
      cashFlowRes.data?.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0) ??
      0;
    const expenses =
      cashFlowRes.data?.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ??
      0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalReceivable =
      receivableRes.data
        ?.filter((r) => r.status === 'pending' || r.status === 'overdue' || r.status === 'renegotiated')
        .reduce((s, r) => s + Number(r.amount), 0) ?? 0;

    const overdueCount =
      receivableRes.data?.filter(
        (r) =>
          (r.status === 'pending' || r.status === 'overdue') && new Date(r.due_date as string) < today
      ).length ?? 0;

    const totalPayable =
      payableRes.data?.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0) ?? 0;

    return {
      monthlyRevenue: income,
      monthlyExpenses: expenses,
      netProfit: income - expenses,
      totalReceivable,
      totalPayable,
      overdueCount,
      cashBalance: income - expenses,
    };
  }
}
