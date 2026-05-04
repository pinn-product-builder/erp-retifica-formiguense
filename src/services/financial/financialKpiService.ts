import { supabase } from '@/integrations/supabase/client';
import type { FinancialKpis } from '@/services/financial/types';

export class FinancialKpiService {
  static async getKpis(orgId: string): Promise<FinancialKpis> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;

    const [cashFlowRes, receivableRes, payableRes] = await Promise.all([
      supabase
        .from('cash_flow')
        .select('transaction_type, amount')
        .eq('org_id', orgId)
        .eq('is_intercompany', false)
        .gte('transaction_date', monthStart),
      supabase.from('accounts_receivable').select('status, amount, due_date').eq('org_id', orgId),
      supabase.from('accounts_payable').select('status, amount, due_date').eq('org_id', orgId),
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
