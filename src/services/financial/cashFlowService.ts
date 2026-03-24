import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { cashFlowCreateSchema, type CashFlowCreateInput } from '@/services/financial/schemas';
import type { PaginatedResult } from '@/services/financial/types';

type CfRow = Database['public']['Tables']['cash_flow']['Row'];

export class CashFlowService {
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
}
