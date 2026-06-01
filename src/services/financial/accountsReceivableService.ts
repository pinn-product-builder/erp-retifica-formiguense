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
import { applyOrgIdFilter } from '@/services/financial/orgScope';
import { escapeIlikePattern } from '@/lib/ilikeEscape';

type ArRow = Database['public']['Tables']['accounts_receivable']['Row'];

async function attachReceiptTotals(
  rows: (ArRow & Record<string, unknown>)[]
): Promise<(ArRow & Record<string, unknown>)[]> {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id as string);
  const { data, error } = await supabase
    .from('receipt_history')
    .select('receivable_account_id, amount_received')
    .in('receivable_account_id', ids);
  if (error || !data) {
    return rows.map((r) => ({ ...r, total_received: 0, remaining_amount: Number(r.amount) + Number((r as { late_fee?: number | null }).late_fee ?? 0) }));
  }
  const totals = new Map<string, number>();
  for (const h of data as { receivable_account_id: string; amount_received: number }[]) {
    totals.set(h.receivable_account_id, (totals.get(h.receivable_account_id) ?? 0) + Number(h.amount_received));
  }
  return rows.map((r) => {
    const received = totals.get(r.id as string) ?? 0;
    const totalDue = Number(r.amount) + Number((r as { late_fee?: number | null }).late_fee ?? 0);
    const remaining = Math.max(0, Math.round((totalDue - received) * 100) / 100);
    return { ...r, total_received: received, remaining_amount: remaining };
  });
}

async function attachAuditUserNames(
  rows: (ArRow & Record<string, unknown>)[]
): Promise<(ArRow & Record<string, unknown>)[]> {
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.created_by) ids.add(r.created_by as string);
    if (r.updated_by) ids.add(r.updated_by as string);
  }
  const emptyAudit = () =>
    rows.map((r) => ({
      ...r,
      audit_created_by_name: null as string | null,
      audit_updated_by_name: null as string | null,
    }));
  if (ids.size === 0) {
    return emptyAudit();
  }
  const { data: basicRows, error } = await supabase
    .from('user_basic_info')
    .select('user_id, name')
    .in('user_id', [...ids]);
  if (error || !basicRows?.length) {
    return emptyAudit();
  }
  const map = new Map(
    basicRows
      .filter((p): p is { user_id: string; name: string | null } => p.user_id != null)
      .map((p) => [p.user_id, p.name?.trim() || null])
  );
  return rows.map((r) => {
    const createdName = r.created_by ? (map.get(r.created_by as string) ?? null) : null;
    const updatedName = r.updated_by ? (map.get(r.updated_by as string) ?? null) : null;
    return { ...r, audit_created_by_name: createdName, audit_updated_by_name: updatedName };
  });
}

export class AccountsReceivableService {
  private static async resolveCustomerIdsMatchingText(orgIds: string[], raw: string): Promise<string[]> {
    const s = raw.trim();
    if (!s || orgIds.length === 0) return [];
    const esc = escapeIlikePattern(s);
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .in('org_id', orgIds)
      .or(`name.ilike.%${esc}%,document.ilike.%${esc}%`);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.id as string);
  }

  /**
   * Aplica filtros de lista/totais em uma query já restrita por `org_id` (`applyOrgIdFilter`).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- encadeamento do client Supabase
  private static async applyAccountsReceivableFilters(query: any, orgIds: string[], filters: AccountsReceivableListFilters): Promise<any> {
    let q = query;
    const mergedSearch = (filters.customerText ?? filters.search ?? '').trim();

    if (filters.customerId) {
      q = q.eq('customer_id', filters.customerId);
      if (mergedSearch) {
        const esc = escapeIlikePattern(mergedSearch);
        q = q.ilike('invoice_number', `%${esc}%`);
      }
    } else if (mergedSearch) {
      const ids = await AccountsReceivableService.resolveCustomerIdsMatchingText(orgIds, mergedSearch);
      const esc = escapeIlikePattern(mergedSearch);
      const parts: string[] = [`invoice_number.ilike.%${esc}%`];
      if (ids.length > 0) parts.push(`customer_id.in.(${ids.join(',')})`);
      q = q.or(parts.join(','));
    }

    if (filters.amountEquals != null && Number.isFinite(filters.amountEquals)) {
      q = q.eq('amount', filters.amountEquals);
    }

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

    return q;
  }

  static async refreshOverdue(orgId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.rpc('refresh_accounts_receivable_overdue', {
      p_org_id: orgId,
    });
    return { error: error ? new Error(error.message) : null };
  }

  static async listPaginated(
    orgIds: string[],
    page: number,
    pageSize: number,
    filters: AccountsReceivableListFilters = {}
  ): Promise<PaginatedResult<ArRow & Record<string, unknown>>> {
    await Promise.all(orgIds.map((id) => this.refreshOverdue(id)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = applyOrgIdFilter(
      supabase
        .from('accounts_receivable')
        .select(
          `*,
          customers (id, name, document),
          orders (id, order_number)`,
          { count: 'exact' }
        ),
      'org_id',
      orgIds
    );

    q = await AccountsReceivableService.applyAccountsReceivableFilters(q, orgIds, filters);

    q = q
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    let rows = (data ?? []) as (ArRow & Record<string, unknown>)[];

    rows = await attachAuditUserNames(rows);
    rows = await attachReceiptTotals(rows);

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
    orgIds: string[],
    filters: AccountsReceivableListFilters = {}
  ): Promise<{ open: number; overdue: number; received: number }> {
    await Promise.all(orgIds.map((id) => this.refreshOverdue(id)));
    let q = applyOrgIdFilter(
      supabase.from('accounts_receivable').select('status, amount, due_date'),
      'org_id',
      orgIds
    );
    q = await AccountsReceivableService.applyAccountsReceivableFilters(q, orgIds, filters);

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
      if (
        r.status === 'overdue' ||
        (r.status === 'pending' && new Date(r.due_date) < today)
      ) {
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
    const remainder = v.total_amount - per * (v.installments - 1);
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
