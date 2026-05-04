import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CashFlowService } from '@/services/financial/cashFlowService';
import { applyOrgIdFilter } from '@/services/financial/orgScope';

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

export type ProjectionScenarioKey = 'optimistic' | 'realistic' | 'pessimistic';

export type ScenarioProjectionResult = {
  scenario: ProjectionScenarioKey;
  days: OnDemandProjectionDay[];
  hasNegativeDay: boolean;
  minBalance: number;
  openingBalance: number;
  recommendedMinimum: number;
  belowRecommended: boolean;
  monthly: { month: string; income: number; expense: number; endBalance: number }[];
};

function scenarioFactors(s: ProjectionScenarioKey): { incomeFactor: number; expenseFactor: number } {
  if (s === 'optimistic') return { incomeFactor: 1.05, expenseFactor: 0.98 };
  if (s === 'pessimistic') return { incomeFactor: 0.95, expenseFactor: 1.05 };
  return { incomeFactor: 1.0, expenseFactor: 1.0 };
}

export class ProjectionService {
  static async computeOnDemandFromArAp(
    orgIds: string[],
    horizonDays = 30
  ): Promise<OnDemandProjectionResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = formatLocalYmd(today);
    const end = new Date(today);
    end.setDate(end.getDate() + horizonDays - 1);
    const endIso = formatLocalYmd(end);

    const openingBalance = await CashFlowService.netBalanceThrough(orgIds, todayIso);

    const [{ data: arData, error: arErr }, { data: apData, error: apErr }] = await Promise.all([
      applyOrgIdFilter(
        supabase.from('accounts_receivable').select('amount, due_date, status'),
        'org_id',
        orgIds
      ).in('status', ['pending', 'overdue', 'renegotiated']),
      applyOrgIdFilter(supabase.from('accounts_payable').select('amount, due_date, status'), 'org_id', orgIds).eq(
        'status',
        'pending'
      ),
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

  static async computeScenario90dFromArAp(
    orgIds: string[],
    scenario: ProjectionScenarioKey,
    recommendedMinimum = 10000
  ): Promise<ScenarioProjectionResult> {
    const horizonDays = 90;
    const base = await ProjectionService.computeOnDemandFromArAp(orgIds, horizonDays);
    const f = scenarioFactors(scenario);

    const days: OnDemandProjectionDay[] = [];
    let running = base.openingBalance;
    let hasNegativeDay = false;
    let minBalance = running;
    const monthAgg = new Map<string, { income: number; expense: number; endBalance: number }>();

    for (const d of base.days) {
      const inc = Math.round(Number(d.projected_income) * f.incomeFactor * 100) / 100;
      const exp = Math.round(Number(d.projected_expenses) * f.expenseFactor * 100) / 100;
      running += inc - exp;
      if (running < 0) hasNegativeDay = true;
      if (running < minBalance) minBalance = running;
      const month = String(d.projection_date).slice(0, 7);
      const cur = monthAgg.get(month) ?? { income: 0, expense: 0, endBalance: running };
      cur.income += inc;
      cur.expense += exp;
      cur.endBalance = running;
      monthAgg.set(month, cur);
      days.push({
        projection_date: d.projection_date,
        projected_income: inc,
        projected_expenses: exp,
        projected_balance: running,
      });
    }

    const monthly = [...monthAgg.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, income: v.income, expense: v.expense, endBalance: v.endBalance }));

    return {
      scenario,
      days,
      hasNegativeDay,
      minBalance,
      openingBalance: base.openingBalance,
      recommendedMinimum,
      belowRecommended: minBalance < recommendedMinimum,
      monthly,
    };
  }

  static async listByOrg(orgIds: string[], days = 90): Promise<Row[]> {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    const { data, error } = await applyOrgIdFilter(
      supabase.from('cash_flow_projection').select('*'),
      'org_id',
      orgIds
    )
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
