import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  accountsReceivableCreateSchema,
  accountsReceivableInstallmentsSchema,
  type AccountsReceivableCreateInput,
  type AccountsReceivableInstallmentsInput,
} from '@/services/financial/schemas';
import type { AccountsReceivableListFilters, PaginatedResult } from '@/services/financial/types';
import { CostCenterService } from '@/services/financial/costCenterService';

type ArRow = Database['public']['Tables']['accounts_receivable']['Row'];

export class AccountsReceivableService {
  static async refreshOverdue(orgId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.rpc('refresh_accounts_receivable_overdue', {
      p_org_id: orgId,
    });
    return { error: error ? new Error(error.message) : null };
  }

  static async listPaginated(
    orgId: string,
    page: number,
    pageSize: number,
    filters: AccountsReceivableListFilters = {}
  ): Promise<PaginatedResult<ArRow & Record<string, unknown>>> {
    await this.refreshOverdue(orgId);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from('accounts_receivable')
      .select(
        `*,
          customers (id, name, document),
          orders (id, order_number)`,
        { count: 'exact' }
      )
      .eq('org_id', orgId);

    if (filters.customerId) q = q.eq('customer_id', filters.customerId);
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.paymentMethod) q = q.eq('payment_method', filters.paymentMethod);
    if (filters.orderId) q = q.eq('order_id', filters.orderId);
    if (filters.budgetId) q = q.eq('budget_id', filters.budgetId);
    if (filters.costCenterId) q = q.eq('cost_center_id', filters.costCenterId);
    if (filters.dueOnDates?.length) q = q.in('due_date', filters.dueOnDates);
    else {
      if (filters.dueFrom) q = q.gte('due_date', filters.dueFrom);
      if (filters.dueTo) q = q.lte('due_date', filters.dueTo);
    }

    q = q.order('due_date', { ascending: true }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    let rows = (data ?? []) as (ArRow & Record<string, unknown>)[];
    if (filters.search?.trim()) {
      const t = filters.search.trim().toLowerCase();
      rows = rows.filter((r) => {
        const c = r.customers as { name?: string } | null;
        const inv = (r.invoice_number as string | null) ?? '';
        return (c?.name?.toLowerCase().includes(t) ?? false) || inv.toLowerCase().includes(t);
      });
    }

    const total = count ?? 0;
    return {
      data: rows,
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  static async aggregateTotals(
    orgId: string,
    filters: AccountsReceivableListFilters = {}
  ): Promise<{ open: number; overdue: number; received: number }> {
    await this.refreshOverdue(orgId);
    let q = supabase.from('accounts_receivable').select('status, amount').eq('org_id', orgId);
    if (filters.customerId) q = q.eq('customer_id', filters.customerId);
    if (filters.paymentMethod) q = q.eq('payment_method', filters.paymentMethod);
    if (filters.orderId) q = q.eq('order_id', filters.orderId);
    if (filters.budgetId) q = q.eq('budget_id', filters.budgetId);
    if (filters.costCenterId) q = q.eq('cost_center_id', filters.costCenterId);
    if (filters.dueOnDates?.length) q = q.in('due_date', filters.dueOnDates);
    else {
      if (filters.dueFrom) q = q.gte('due_date', filters.dueFrom);
      if (filters.dueTo) q = q.lte('due_date', filters.dueTo);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let open = 0;
    let overdue = 0;
    let received = 0;
    for (const r of rows) {
      const amt = Number(r.amount);
      if (r.status === 'paid' || r.status === 'cancelled') {
        if (r.status === 'paid') received += amt;
        continue;
      }
      if (r.status === 'renegotiated') {
        continue;
      }
      if (r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date as string) < today)) {
        overdue += amt;
      } else if (r.status === 'pending' || r.status === 'renegotiated') {
        open += amt;
      }
    }
    return { open, overdue, received };
  }

  static async create(
    orgId: string,
    input: AccountsReceivableCreateInput,
    userId: string | null
  ): Promise<{ data: ArRow | null; error: Error | null }> {
    const parsed = accountsReceivableCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: new Error(parsed.error.errors.map((e) => e.message).join('; ')) };
    }
    const v = parsed.data;
    const needCc = await CostCenterService.hasAnyActive(orgId);
    if (needCc && !v.cost_center_id) {
      return {
        data: null,
        error: new Error('Centro de custo obrigatório para esta organização.'),
      };
    }
    const row: Database['public']['Tables']['accounts_receivable']['Insert'] = {
      org_id: orgId,
      customer_id: v.customer_id,
      order_id: v.order_id ?? null,
      budget_id: v.budget_id ?? null,
      amount: v.amount,
      due_date: v.due_date,
      competence_date: v.competence_date,
      payment_method: v.payment_method ?? null,
      notes: v.notes ?? null,
      invoice_number: v.invoice_number ?? null,
      installment_number: v.installment_number ?? 1,
      total_installments: v.total_installments ?? 1,
      cost_center_id: v.cost_center_id ?? null,
      source: v.source ?? null,
      source_id: v.source_id ?? null,
      status: 'pending',
      created_by: userId,
      updated_by: userId,
    };

    const { data, error } = await supabase.from('accounts_receivable').insert(row).select().single();
    return { data: data as ArRow | null, error: error ? new Error(error.message) : null };
  }

  static async update(
    orgId: string,
    id: string,
    patch: Partial<Database['public']['Tables']['accounts_receivable']['Update']>,
    userId: string | null
  ): Promise<{ data: ArRow | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({ ...patch, updated_by: userId ?? undefined })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();
    return { data: data as ArRow | null, error: error ? new Error(error.message) : null };
  }

  static async createInstallmentPlan(
    orgId: string,
    input: AccountsReceivableInstallmentsInput,
    userId: string | null
  ): Promise<{ data: ArRow[] | null; error: Error | null }> {
    const parsed = accountsReceivableInstallmentsSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: new Error(parsed.error.errors.map((e) => e.message).join('; ')) };
    }
    const v = parsed.data;
    const needCc = await CostCenterService.hasAnyActive(orgId);
    if (needCc && !v.cost_center_id) {
      return {
        data: null,
        error: new Error('Centro de custo obrigatório para esta organização.'),
      };
    }
    const base = new Date(v.first_due_date);
    const per = Math.round((v.total_amount / v.installments) * 100) / 100;
    let remainder = v.total_amount - per * (v.installments - 1);
    const src = v.source ?? null;
    const srcId = v.source_id ?? null;
    const rows: Database['public']['Tables']['accounts_receivable']['Insert'][] = [];
    for (let i = 0; i < v.installments; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      const amt = i === v.installments - 1 ? remainder : per;
      rows.push({
        org_id: orgId,
        customer_id: v.customer_id,
        order_id: v.order_id ?? null,
        budget_id: v.budget_id ?? null,
        amount: amt,
        due_date: d.toISOString().slice(0, 10),
        competence_date: v.competence_date,
        payment_method: v.payment_method ?? null,
        notes: v.notes ?? null,
        installment_number: i + 1,
        total_installments: v.installments,
        source: src,
        source_id: srcId,
        cost_center_id: v.cost_center_id ?? null,
        status: 'pending',
        created_by: userId,
        updated_by: userId,
      });
    }
    const { data, error } = await supabase.from('accounts_receivable').insert(rows).select();
    return { data: (data as ArRow[]) ?? null, error: error ? new Error(error.message) : null };
  }
}
