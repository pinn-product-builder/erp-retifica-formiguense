import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CashFlowService } from '@/services/financial/cashFlowService';
import { applyOrgIdFilter } from '@/services/financial/orgScope';
import { paymentMethodLabel } from '@/lib/financialFormat';

type Row = Database['public']['Tables']['cash_flow_projection']['Row'];
type ArRow = Database['public']['Tables']['accounts_receivable']['Row'];
type ApRow = Database['public']['Tables']['accounts_payable']['Row'];

export type OrganizationRef = { id: string; name: string };

export type ProjectionDayEntry = {
  id: string;
  partyName: string;
  amount: number;
  paymentMethodLabel: string;
  organizationName: string;
  invoiceNumber: string | null;
  description: string | null;
  dueDate: string;
  overdueFromBucketed: boolean;
};

export type ProjectionDayBreakdown = {
  dateYmd: string;
  receivables: ProjectionDayEntry[];
  payables: ProjectionDayEntry[];
  totalIncome: number;
  totalExpense: number;
};

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

export type ProjectionScenarioConfig = {
  optimistic_income_factor: number;
  optimistic_expense_factor: number;
  pessimistic_income_factor: number;
  pessimistic_expense_factor: number;
};

const DEFAULT_SCENARIO_CONFIG: ProjectionScenarioConfig = {
  optimistic_income_factor: 1.2,
  optimistic_expense_factor: 0.98,
  pessimistic_income_factor: 0.8,
  pessimistic_expense_factor: 1.05,
};

function scenarioFactors(
  s: ProjectionScenarioKey,
  config: ProjectionScenarioConfig
): { incomeFactor: number; expenseFactor: number } {
  if (s === 'optimistic')
    return { incomeFactor: config.optimistic_income_factor, expenseFactor: config.optimistic_expense_factor };
  if (s === 'pessimistic')
    return { incomeFactor: config.pessimistic_income_factor, expenseFactor: config.pessimistic_expense_factor };
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

  /**
   * Carrega config de cenários de uma org (com fallback default).
   * Em modo consolidado (múltiplas orgs), usa a config da primeira org como referência.
   */
  static async getScenarioConfig(orgIds: string[]): Promise<ProjectionScenarioConfig> {
    if (orgIds.length === 0) return DEFAULT_SCENARIO_CONFIG;
    const { data, error } = await supabase
      .from('cash_flow_projection_config')
      .select('optimistic_income_factor, optimistic_expense_factor, pessimistic_income_factor, pessimistic_expense_factor')
      .in('org_id', orgIds)
      .limit(1)
      .maybeSingle();
    if (error || !data) return DEFAULT_SCENARIO_CONFIG;
    const row = data as Record<string, number | string | null>;
    return {
      optimistic_income_factor: Number(row.optimistic_income_factor ?? DEFAULT_SCENARIO_CONFIG.optimistic_income_factor),
      optimistic_expense_factor: Number(row.optimistic_expense_factor ?? DEFAULT_SCENARIO_CONFIG.optimistic_expense_factor),
      pessimistic_income_factor: Number(row.pessimistic_income_factor ?? DEFAULT_SCENARIO_CONFIG.pessimistic_income_factor),
      pessimistic_expense_factor: Number(row.pessimistic_expense_factor ?? DEFAULT_SCENARIO_CONFIG.pessimistic_expense_factor),
    };
  }

  static async upsertScenarioConfig(
    orgId: string,
    config: ProjectionScenarioConfig,
    userId: string | null
  ): Promise<void> {
    const payload = { org_id: orgId, ...config, updated_by: userId } as Record<string, unknown>;
    const { error } = await supabase
      .from('cash_flow_projection_config')
      .upsert(payload, { onConflict: 'org_id' });
    if (error) throw new Error(error.message);
  }

  static async computeScenario90dFromArAp(
    orgIds: string[],
    scenario: ProjectionScenarioKey,
    recommendedMinimum = 10000
  ): Promise<ScenarioProjectionResult> {
    const horizonDays = 90;
    const [base, config] = await Promise.all([
      ProjectionService.computeOnDemandFromArAp(orgIds, horizonDays),
      ProjectionService.getScenarioConfig(orgIds),
    ]);
    const f = scenarioFactors(scenario, config);

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

  /**
   * Breakdown de um dia projetado: AR e AP que caem (ou foram empurrados) para a data informada.
   *
   * Regra alinhada com `computeOnDemandFromArAp`: títulos AR/AP vencidos ainda em aberto são
   * empurrados para "hoje" — então `dateYmd === hoje` inclui os atrasados.
   */
  static async listDayBreakdownFromArAp(
    orgs: OrganizationRef[],
    dateYmd: string
  ): Promise<ProjectionDayBreakdown> {
    const orgIds = orgs.map((o) => o.id);
    if (orgIds.length === 0 || !dateYmd) {
      return { dateYmd, receivables: [], payables: [], totalIncome: 0, totalExpense: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = formatLocalYmd(today);
    const isToday = dateYmd === todayIso;
    const orgNameById = new Map(orgs.map((o) => [o.id, o.name]));

    const arQuery = applyOrgIdFilter(
      supabase
        .from('accounts_receivable')
        .select('id, amount, due_date, status, payment_method, invoice_number, description, customer_id, org_id'),
      'org_id',
      orgIds
    ).in('status', ['pending', 'overdue', 'renegotiated']);

    const apQuery = applyOrgIdFilter(
      supabase
        .from('accounts_payable')
        .select(
          'id, amount, due_date, status, payment_method, invoice_number, description, supplier_name, org_id'
        ),
      'org_id',
      orgIds
    ).eq('status', 'pending');

    if (isToday) {
      arQuery.lte('due_date', dateYmd);
      apQuery.lte('due_date', dateYmd);
    } else {
      arQuery.eq('due_date', dateYmd);
      apQuery.eq('due_date', dateYmd);
    }

    const [{ data: arData, error: arErr }, { data: apData, error: apErr }] = await Promise.all([arQuery, apQuery]);
    if (arErr) throw new Error(arErr.message);
    if (apErr) throw new Error(apErr.message);

    const customerIds = Array.from(
      new Set(((arData ?? []) as Pick<ArRow, 'customer_id'>[]).map((r) => r.customer_id).filter(Boolean))
    );
    const customerNameById = new Map<string, string>();
    if (customerIds.length > 0) {
      const { data: custData, error: cErr } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds);
      if (cErr) throw new Error(cErr.message);
      for (const c of (custData ?? []) as { id: string; name: string }[]) {
        customerNameById.set(c.id, c.name);
      }
    }

    const receivables: ProjectionDayEntry[] = ((arData ?? []) as Array<
      Pick<ArRow, 'id' | 'amount' | 'due_date' | 'payment_method' | 'invoice_number' | 'description' | 'customer_id' | 'org_id'>
    >).map((r) => ({
      id: r.id,
      partyName: customerNameById.get(r.customer_id) ?? '—',
      amount: Number(r.amount),
      paymentMethodLabel: paymentMethodLabel(r.payment_method),
      organizationName: orgNameById.get(r.org_id ?? '') ?? '—',
      invoiceNumber: r.invoice_number,
      description: r.description ?? null,
      dueDate: String(r.due_date).slice(0, 10),
      overdueFromBucketed: isToday && String(r.due_date).slice(0, 10) < todayIso,
    }));

    const payables: ProjectionDayEntry[] = ((apData ?? []) as Array<
      Pick<ApRow, 'id' | 'amount' | 'due_date' | 'payment_method' | 'invoice_number' | 'description' | 'supplier_name' | 'org_id'>
    >).map((p) => ({
      id: p.id,
      partyName: p.supplier_name ?? '—',
      amount: Number(p.amount),
      paymentMethodLabel: paymentMethodLabel(p.payment_method),
      organizationName: orgNameById.get(p.org_id ?? '') ?? '—',
      invoiceNumber: p.invoice_number,
      description: p.description ?? null,
      dueDate: String(p.due_date).slice(0, 10),
      overdueFromBucketed: isToday && String(p.due_date).slice(0, 10) < todayIso,
    }));

    receivables.sort((a, b) => b.amount - a.amount);
    payables.sort((a, b) => b.amount - a.amount);

    const totalIncome = receivables.reduce((s, r) => s + r.amount, 0);
    const totalExpense = payables.reduce((s, p) => s + p.amount, 0);

    return { dateYmd, receivables, payables, totalIncome, totalExpense };
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
