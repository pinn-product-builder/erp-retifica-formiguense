import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { cashFlowCreateSchema, type CashFlowCreateInput } from '@/services/financial/schemas';
import type { PaginatedResult } from '@/services/financial/types';

type CfRow = Database['public']['Tables']['cash_flow']['Row'];

async function dayHasCashClosing(orgId: string, ymd: string): Promise<boolean> {
  const { data } = await supabase
    .from('cash_closings')
    .select('id')
    .eq('org_id', orgId)
    .eq('closing_date', ymd)
    .maybeSingle();
  return data != null;
}

const CLOSED_DAY_MSG =
  'Esta data já possui fechamento de caixa. Inclusão ou alteração de lançamentos está bloqueada.';

export class CashFlowService {
  static async sumPeriodMetrics(
    orgId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ income: number; expense: number; reconciled: number; pending: number }> {
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
        .order('transaction_date', { ascending: false });
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

  static async netBalanceThrough(orgId: string, throughDateInclusive: string): Promise<number> {
    const pageSize = 1000;
    let page = 1;
    let net = 0;
    for (;;) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('cash_flow')
        .select('amount, transaction_type')
        .eq('org_id', orgId)
        .lte('transaction_date', throughDateInclusive)
        .order('transaction_date', { ascending: true })
        .range(from, to);
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
    throughDateInclusive: string
  ): Promise<number> {
    const pageSize = 1000;
    let page = 1;
    let net = 0;
    for (;;) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('cash_flow')
        .select('amount, transaction_type')
        .eq('org_id', orgId)
        .eq('bank_account_id', bankAccountId)
        .lte('transaction_date', throughDateInclusive)
        .order('transaction_date', { ascending: true })
        .range(from, to);
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
    throughDateInclusive: string
  ): Promise<number> {
    const pageSize = 1000;
    let page = 1;
    let n = 0;
    for (;;) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('cash_flow')
        .select('id')
        .eq('org_id', orgId)
        .eq('bank_account_id', bankAccountId)
        .eq('reconciled', false)
        .lte('transaction_date', throughDateInclusive)
        .range(from, to);
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      n += rows.length;
      if (rows.length < pageSize) break;
      page += 1;
    }
    return n;
  }

  static async listPaginated(
    orgId: string,
    page: number,
    pageSize: number,
    startDate?: string,
    endDate?: string
  ): Promise<PaginatedResult<CfRow & Record<string, unknown>>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from('cash_flow')
      .select(
        `*,
        expense_categories (name),
        bank_accounts (*)`,
        { count: 'exact' }
      )
      .eq('org_id', orgId)
      .order('transaction_date', { ascending: false });

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
    if (await dayHasCashClosing(orgId, v.transaction_date)) {
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
      .select('transaction_date')
      .eq('id', id)
      .eq('org_id', orgId)
      .maybeSingle();
    if (fetchErr) return { error: new Error(fetchErr.message) };
    if (!cur) return { error: new Error('Lançamento não encontrado') };
    const curRow = cur as { transaction_date: string };
    if (await dayHasCashClosing(orgId, curRow.transaction_date)) {
      return { error: new Error(CLOSED_DAY_MSG) };
    }
    const nextDate = patch.transaction_date ?? curRow.transaction_date;
    if (
      nextDate !== curRow.transaction_date &&
      (await dayHasCashClosing(orgId, nextDate))
    ) {
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
      .select('transaction_date')
      .eq('id', id)
      .eq('org_id', orgId)
      .maybeSingle();
    if (fetchErr) return { error: new Error(fetchErr.message) };
    if (!cur) return { error: new Error('Lançamento não encontrado') };
    const curRow = cur as { transaction_date: string };
    if (await dayHasCashClosing(orgId, curRow.transaction_date)) {
      return { error: new Error(CLOSED_DAY_MSG) };
    }
    const { error } = await supabase.from('cash_flow').delete().eq('id', id).eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }
}
