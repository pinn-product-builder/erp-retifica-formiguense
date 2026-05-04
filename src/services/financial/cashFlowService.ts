import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { cashFlowCreateSchema, type CashFlowCreateInput } from '@/services/financial/schemas';
import type { PaginatedResult } from '@/services/financial/types';
import { applyOrgIdFilter } from '@/services/financial/orgScope';

type CfRow = Database['public']['Tables']['cash_flow']['Row'];

/** Quando `includeIntercompany` é false (padrão), exclui movimentos intercompany do resultado. */
export type CashFlowQueryOptions = {
  includeIntercompany?: boolean;
};

async function dayHasCashClosingForAccount(
  orgId: string,
  ymd: string,
  bankAccountId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('cash_closings')
    .select('id')
    .eq('org_id', orgId)
    .eq('closing_date', ymd)
    .eq('bank_account_id', bankAccountId)
    .maybeSingle();
  return data != null;
}

const CLOSED_DAY_MSG =
  'Esta data já possui fechamento de caixa para esta conta. Inclusão ou alteração de lançamentos está bloqueada.';

async function resolveClosingBankAccountId(
  orgId: string,
  bankAccountId: string | null | undefined
): Promise<string | null> {
  if (bankAccountId) return bankAccountId;
  const { data } = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('org_id', orgId)
    .eq('account_number', 'LEGADO')
    .eq('kind', 'cash')
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export class CashFlowService {
  /** Conta "Caixa legado" (lançamentos sem operador / histórico). */
  static async getLegacyCashAccountId(orgId: string): Promise<string | null> {
    return resolveClosingBankAccountId(orgId, null);
  }

  static async sumPeriodMetrics(
    orgIds: string[],
    startDate?: string,
    endDate?: string,
    options?: CashFlowQueryOptions
  ): Promise<{ income: number; expense: number; reconciled: number; pending: number }> {
    const includeIc = options?.includeIntercompany === true;
    const pageSize = 1000;
    let page = 1;
    let income = 0;
    let expense = 0;
    let reconciled = 0;
    let pending = 0;
    for (;;) {
      let qb = applyOrgIdFilter(
        supabase.from('cash_flow').select('amount, transaction_type, reconciled'),
        'org_id',
        orgIds
      ).order('transaction_date', { ascending: false });
      if (!includeIc) qb = qb.eq('is_intercompany', false);
      if (startDate) qb = qb.gte('transaction_date', startDate);
      if (endDate) qb = qb.lte('transaction_date', endDate);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await qb.range(from, to);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as {
        amount: number;
        transaction_type: string;
        reconciled: boolean | null;
      }[];
      for (const r of rows) {
        const a = Number(r.amount);
        if (r.transaction_type === 'income') income += a;
        else expense += a;
        if (r.reconciled) reconciled += 1;
        else pending += 1;
      }
      if (rows.length < pageSize) break;
      page += 1;
    }
    return { income, expense, reconciled, pending };
  }

  static async sumPeriodMetricsForBankAccount(
    orgId: string,
    bankAccountId: string,
    startDate?: string,
    endDate?: string,
    options?: CashFlowQueryOptions
  ): Promise<{ income: number; expense: number; reconciled: number; pending: number }> {
    const includeIc = options?.includeIntercompany === true;
    const pageSize = 1000;
    let page = 1;
    let income = 0;
    let expense = 0;
    let reconciled = 0;
    let pending = 0;
    for (;;) {
      let qb = supabase
        .from('cash_flow')
        .select('amount, transaction_type, reconciled')
        .eq('org_id', orgId)
        .eq('bank_account_id', bankAccountId)
        .order('transaction_date', { ascending: false });
      if (!includeIc) qb = qb.eq('is_intercompany', false);
      if (startDate) qb = qb.gte('transaction_date', startDate);
      if (endDate) qb = qb.lte('transaction_date', endDate);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await qb.range(from, to);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as {
        amount: number;
        transaction_type: string;
        reconciled: boolean | null;
      }[];
      for (const r of rows) {
        const a = Number(r.amount);
        if (r.transaction_type === 'income') income += a;
        else expense += a;
        if (r.reconciled) reconciled += 1;
        else pending += 1;
      }
      if (rows.length < pageSize) break;
      page += 1;
    }
    return { income, expense, reconciled, pending };
  }

  static async netBalanceThrough(
    orgIds: string[],
    throughDateInclusive: string,
    options?: CashFlowQueryOptions
  ): Promise<number> {
    const includeIc = options?.includeIntercompany === true;
    const pageSize = 1000;
    let page = 1;
    let net = 0;
    for (;;) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let qb = applyOrgIdFilter(
        supabase.from('cash_flow').select('amount, transaction_type'),
        'org_id',
        orgIds
      )
        .lte('transaction_date', throughDateInclusive)
        .order('transaction_date', { ascending: true });
      if (!includeIc) qb = qb.eq('is_intercompany', false);
      const { data, error } = await qb.range(from, to);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as { amount: number; transaction_type: string }[];
      for (const r of rows) {
        const a = Number(r.amount);
        if (r.transaction_type === 'income') net += a;
        else net -= a;
      }
      if (rows.length < pageSize) break;
      page += 1;
    }
    return net;
  }

  static async netBalanceForBankAccountThrough(
    orgId: string,
    bankAccountId: string,
    throughDateInclusive: string,
    options?: CashFlowQueryOptions
  ): Promise<number> {
    const includeIc = options?.includeIntercompany === true;
    const pageSize = 1000;
    let page = 1;
    let net = 0;
    for (;;) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let qb = supabase
        .from('cash_flow')
        .select('amount, transaction_type')
        .eq('org_id', orgId)
        .eq('bank_account_id', bankAccountId)
        .lte('transaction_date', throughDateInclusive)
        .order('transaction_date', { ascending: true });
      if (!includeIc) qb = qb.eq('is_intercompany', false);
      const { data, error } = await qb.range(from, to);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as { amount: number; transaction_type: string }[];
      for (const r of rows) {
        const a = Number(r.amount);
        if (r.transaction_type === 'income') net += a;
        else net -= a;
      }
      if (rows.length < pageSize) break;
      page += 1;
    }
    return net;
  }

  static async countUnreconciledForBankAccountThrough(
    orgId: string,
    bankAccountId: string,
    throughDateInclusive: string,
    options?: CashFlowQueryOptions
  ): Promise<number> {
    const includeIc = options?.includeIntercompany === true;
    const pageSize = 1000;
    let page = 1;
    let n = 0;
    for (;;) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let qb = supabase
        .from('cash_flow')
        .select('id')
        .eq('org_id', orgId)
        .eq('bank_account_id', bankAccountId)
        .eq('reconciled', false)
        .lte('transaction_date', throughDateInclusive);
      if (!includeIc) qb = qb.eq('is_intercompany', false);
      const { data, error } = await qb.range(from, to);
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      n += rows.length;
      if (rows.length < pageSize) break;
      page += 1;
    }
    return n;
  }

  static async listPaginated(
    orgIds: string[],
    page: number,
    pageSize: number,
    startDate?: string,
    endDate?: string,
    options?: CashFlowQueryOptions
  ): Promise<PaginatedResult<CfRow & Record<string, unknown>>> {
    const includeIc = options?.includeIntercompany === true;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = applyOrgIdFilter(
      supabase
        .from('cash_flow')
        .select(
          `*,
        expense_categories (name),
        bank_accounts (*)`,
          { count: 'exact' }
        ),
      'org_id',
      orgIds
    ).order('transaction_date', { ascending: false });
    if (!includeIc) q = q.eq('is_intercompany', false);

    if (startDate) q = q.gte('transaction_date', startDate);
    if (endDate) q = q.lte('transaction_date', endDate);

    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    const total = count ?? 0;
    return {
      data: (data ?? []) as (CfRow & Record<string, unknown>)[],
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  static async create(
    orgId: string,
    input: CashFlowCreateInput
  ): Promise<{ data: CfRow | null; error: Error | null }> {
    const parsed = cashFlowCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: new Error(parsed.error.errors.map((e) => e.message).join('; ')) };
    }
    const v = parsed.data;
    const accId = await resolveClosingBankAccountId(orgId, v.bank_account_id);
    if (accId && (await dayHasCashClosingForAccount(orgId, v.transaction_date, accId))) {
      return { data: null, error: new Error(CLOSED_DAY_MSG) };
    }
    const row: Database['public']['Tables']['cash_flow']['Insert'] = {
      org_id: orgId,
      transaction_type: v.transaction_type,
      amount: v.amount,
      description: v.description,
      transaction_date: v.transaction_date,
      payment_method: v.payment_method ?? null,
      bank_account_id: v.bank_account_id ?? null,
      accounts_receivable_id: v.accounts_receivable_id ?? null,
      accounts_payable_id: v.accounts_payable_id ?? null,
      order_id: v.order_id ?? null,
      category_id: v.category_id ?? null,
      cost_center_id: v.cost_center_id ?? null,
      notes: v.notes ?? null,
      reconciled: v.reconciled ?? false,
      is_intercompany: v.is_intercompany ?? false,
    };
    const { data, error } = await supabase.from('cash_flow').insert(row).select().single();
    return { data: data as CfRow | null, error: error ? new Error(error.message) : null };
  }

  static async update(
    orgId: string,
    id: string,
    patch: Database['public']['Tables']['cash_flow']['Update']
  ): Promise<{ error: Error | null }> {
    const { data: cur, error: fetchErr } = await supabase
      .from('cash_flow')
      .select('transaction_date, bank_account_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .maybeSingle();
    if (fetchErr) return { error: new Error(fetchErr.message) };
    if (!cur) return { error: new Error('Lançamento não encontrado') };
    const curRow = cur as { transaction_date: string; bank_account_id: string | null };
    const effDate = patch.transaction_date ?? curRow.transaction_date;
    const effBank =
      patch.bank_account_id !== undefined ? patch.bank_account_id : curRow.bank_account_id;
    const effAcc = await resolveClosingBankAccountId(orgId, effBank);
    if (effAcc && (await dayHasCashClosingForAccount(orgId, effDate, effAcc))) {
      return { error: new Error(CLOSED_DAY_MSG) };
    }
    const { error } = await supabase
      .from('cash_flow')
      .update(patch)
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }

  static async remove(orgId: string, id: string): Promise<{ error: Error | null }> {
    const { data: cur, error: fetchErr } = await supabase
      .from('cash_flow')
      .select('transaction_date, bank_account_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .maybeSingle();
    if (fetchErr) return { error: new Error(fetchErr.message) };
    if (!cur) return { error: new Error('Lançamento não encontrado') };
    const curRow = cur as { transaction_date: string; bank_account_id: string | null };
    const accId = await resolveClosingBankAccountId(orgId, curRow.bank_account_id);
    if (accId && (await dayHasCashClosingForAccount(orgId, curRow.transaction_date, accId))) {
      return { error: new Error(CLOSED_DAY_MSG) };
    }
    const { error } = await supabase.from('cash_flow').delete().eq('id', id).eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }
}
