import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CashFlowService } from '@/services/financial/cashFlowService';

type Row = Database['public']['Tables']['cash_flow_projection']['Row'];

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type OnDemandProjectionDay = {
  projection_date: string;
  projected_income: number;
  projected_expenses: number;
  projected_balance: number;
};

export type OnDemandProjectionResult = {
  days: OnDemandProjectionDay[];
  hasNegativeDay: boolean;
  minBalance: number;
  openingBalance: number;
};

export class ProjectionService {
  static async computeOnDemandFromArAp(
    orgId: string,
    horizonDays = 30
  ): Promise<OnDemandProjectionResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = formatLocalYmd(today);
    const end = new Date(today);
    end.setDate(end.getDate() + horizonDays - 1);
    const endIso = formatLocalYmd(end);

    const openingBalance = await CashFlowService.netBalanceThrough(orgId, todayIso);

    const [{ data: arData, error: arErr }, { data: apData, error: apErr }] = await Promise.all([
      supabase
        .from('accounts_receivable')
        .select('amount, due_date, status')
        .eq('org_id', orgId)
        .in('status', ['pending', 'overdue', 'renegotiated']),
      supabase
        .from('accounts_payable')
        .select('amount, due_date, status')
        .eq('org_id', orgId)
        .eq('status', 'pending'),
    ]);
    if (arErr) throw new Error(arErr.message);
    if (apErr) throw new Error(apErr.message);

    const byDate = new Map<string, { income: number; expense: number }>();

    const bump = (dateKey: string, income: number, expense: number) => {
      const cur = byDate.get(dateKey) ?? { income: 0, expense: 0 };
      cur.income += income;
      cur.expense += expense;
      byDate.set(dateKey, cur);
    };

    const bucketDue = (dueRaw: string) => {
      const due = dueRaw.slice(0, 10);
      return due < todayIso ? todayIso : due;
    };

    for (const r of arData ?? []) {
      const d = bucketDue(String(r.due_date));
      if (d > endIso) continue;
      bump(d, Number(r.amount), 0);
    }

    for (const p of apData ?? []) {
      const d = bucketDue(String(p.due_date));
      if (d > endIso) continue;
      bump(d, 0, Number(p.amount));
    }

    const days: OnDemandProjectionDay[] = [];
    let running = openingBalance;
    let hasNegativeDay = false;
    let minBalance = openingBalance;
    const cursor = new Date(today);
    for (let i = 0; i < horizonDays; i++) {
      const key = formatLocalYmd(cursor);
      const cell = byDate.get(key) ?? { income: 0, expense: 0 };
      running += cell.income - cell.expense;
      if (running < 0) hasNegativeDay = true;
      if (running < minBalance) minBalance = running;
      days.push({
        projection_date: key,
        projected_income: cell.income,
        projected_expenses: cell.expense,
        projected_balance: running,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { days, hasNegativeDay, minBalance, openingBalance };
  }

  static async listByOrg(orgId: string, days = 90): Promise<Row[]> {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    const { data, error } = await supabase
      .from('cash_flow_projection')
      .select('*')
      .eq('org_id', orgId)
      .gte('projection_date', start.toISOString().slice(0, 10))
      .lte('projection_date', end.toISOString().slice(0, 10))
      .order('projection_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async upsert(
    rows: Database['public']['Tables']['cash_flow_projection']['Insert'][]
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('cash_flow_projection').upsert(rows);
    return { error: error ? new Error(error.message) : null };
  }
}
