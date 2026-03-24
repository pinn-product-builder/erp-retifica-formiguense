import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { accountsPayableCreateSchema, type AccountsPayableCreateInput } from '@/services/financial/schemas';
import type { PaginatedResult } from '@/services/financial/types';

type ApRow = Database['public']['Tables']['accounts_payable']['Row'];

export interface AccountsPayableListFilters {
  supplierId?: string;
  status?: Database['public']['Enums']['payment_status'];
  dueFrom?: string;
  dueTo?: string;
  search?: string;
}

export class AccountsPayableService {
  static async listPaginated(
    orgId: string,
    page: number,
    pageSize: number,
    filters: AccountsPayableListFilters = {}
  ): Promise<PaginatedResult<ApRow & Record<string, unknown>>> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from('accounts_payable')
      .select(`*, expense_categories (name, category), suppliers:supplier_id (id, name, document)`, {
        count: 'exact',
      })
      .eq('org_id', orgId);

    if (filters.supplierId) q = q.eq('supplier_id', filters.supplierId);
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.dueFrom) q = q.gte('due_date', filters.dueFrom);
    if (filters.dueTo) q = q.lte('due_date', filters.dueTo);

    q = q.order('due_date', { ascending: true }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    let rows = (data ?? []) as (ApRow & Record<string, unknown>)[];
    if (filters.search?.trim()) {
      const t = filters.search.trim().toLowerCase();
      rows = rows.filter((r) => {
        const sup = r.suppliers as { name?: string } | null;
        return (
          r.description.toLowerCase().includes(t) ||
          r.supplier_name.toLowerCase().includes(t) ||
          (sup?.name?.toLowerCase().includes(t) ?? false)
        );
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

  static async create(
    orgId: string,
    input: AccountsPayableCreateInput
  ): Promise<{ data: ApRow | null; error: Error | null }> {
    const parsed = accountsPayableCreateSchema.safeParse(input);
    if (!parsed.success) {
      return { data: null, error: new Error(parsed.error.errors.map((e) => e.message).join('; ')) };
    }
    const v = parsed.data;

    let supplierName = v.supplier_name;
    let supplierDocument = v.supplier_document ?? null;
    if (v.supplier_id) {
      const { data: sup } = await supabase
        .from('suppliers')
        .select('name, document, trade_name')
        .eq('id', v.supplier_id)
        .eq('org_id', orgId)
        .maybeSingle();
      if (sup) {
        supplierName = sup.trade_name || sup.name;
        supplierDocument = sup.document ?? supplierDocument;
      }
    }

    const row: Database['public']['Tables']['accounts_payable']['Insert'] = {
      org_id: orgId,
      supplier_id: v.supplier_id ?? null,
      supplier_name: supplierName,
      supplier_document: supplierDocument,
      expense_category_id: v.expense_category_id ?? null,
      description: v.description,
      amount: v.amount,
      due_date: v.due_date,
      payment_method: v.payment_method ?? null,
      invoice_number: v.invoice_number ?? null,
      notes: v.notes ?? null,
      cost_center_id: v.cost_center_id ?? null,
      purchase_order_id: v.purchase_order_id ?? null,
      approval_status: v.approval_status ?? 'approved',
      status: 'pending',
    };

    const { data, error } = await supabase.from('accounts_payable').insert(row).select().single();
    return { data: data as ApRow | null, error: error ? new Error(error.message) : null };
  }

  static async update(
    orgId: string,
    id: string,
    patch: Partial<Database['public']['Tables']['accounts_payable']['Update']>
  ): Promise<{ data: ApRow | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .update(patch)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();
    return { data: data as ApRow | null, error: error ? new Error(error.message) : null };
  }
}
