import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { accountsPayableCreateSchema, type AccountsPayableCreateInput } from '@/services/financial/schemas';
import type { PaginatedResult } from '@/services/financial/types';
import { ApprovalApService } from '@/services/financial/approvalApService';
import { CashFlowService } from '@/services/financial/cashFlowService';
import { CostCenterService } from '@/services/financial/costCenterService';

type ApRow = Database['public']['Tables']['accounts_payable']['Row'];

export interface AccountsPayableListFilters {
  supplierId?: string;
  status?: Database['public']['Enums']['payment_status'];
  dueFrom?: string;
  dueTo?: string;
  dueOnDates?: string[];
  search?: string;
}

export interface AccountsPayableOrgSummary {
  all: number;
  pending: number;
  overdue: number;
  paid: number;
  pendingAmount: number;
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
    if (filters.dueOnDates?.length) q = q.in('due_date', filters.dueOnDates);
    else {
      if (filters.dueFrom) q = q.gte('due_date', filters.dueFrom);
      if (filters.dueTo) q = q.lte('due_date', filters.dueTo);
    }

    const rawSearch = filters.search?.trim();
    if (rawSearch) {
      const inner = rawSearch.replace(/\*/g, '').replace(/,/g, ' ').trim();
      if (inner.length > 0) {
        const wrapped = `*%${inner}%*`;
        q = q.or(`description.ilike.${wrapped},supplier_name.ilike.${wrapped}`);
      }
    }

    q = q.order('due_date', { ascending: true }).range(from, to);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as (ApRow & Record<string, unknown>)[];

    const total = count ?? 0;
    return {
      data: rows,
      count: total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  static async getOrgSummary(orgId: string): Promise<AccountsPayableOrgSummary> {
    const { data, error } = await supabase.rpc('accounts_payable_org_summary', {
      p_org_id: orgId,
    });
    if (error) throw new Error(error.message);
    const j = data as Record<string, unknown> | null;
    return {
      all: Number(j?.all ?? 0),
      pending: Number(j?.pending ?? 0),
      overdue: Number(j?.overdue ?? 0),
      paid: Number(j?.paid ?? 0),
      pendingAmount: Number(j?.pending_amount ?? 0),
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
    let inferredCostCenterId = v.cost_center_id ?? null;
    if (v.supplier_id) {
      const { data: sup } = await supabase
        .from('suppliers')
        .select('name, document, trade_name, default_cost_center_id')
        .eq('id', v.supplier_id)
        .eq('org_id', orgId)
        .maybeSingle();
      if (sup) {
        supplierName = sup.trade_name || sup.name;
        supplierDocument = sup.document ?? supplierDocument;
        if (!inferredCostCenterId && sup.default_cost_center_id) {
          inferredCostCenterId = sup.default_cost_center_id;
        }
      }
    }

    const needCc = await CostCenterService.hasAnyActive(orgId);
    if (needCc && !inferredCostCenterId) {
      return {
        data: null,
        error: new Error('Centro de custo obrigatório. Selecione ou configure o padrão no fornecedor.'),
      };
    }

    let approvalStatus = v.approval_status;
    if (approvalStatus === undefined || approvalStatus === null || approvalStatus === '') {
      approvalStatus = await ApprovalApService.computeInitialApprovalStatus(orgId, v.amount);
    }

    const comp = v.competence_date?.trim() || v.due_date;
    const row: Database['public']['Tables']['accounts_payable']['Insert'] = {
      org_id: orgId,
      supplier_id: v.supplier_id ?? null,
      supplier_name: supplierName,
      supplier_document: supplierDocument,
      expense_category_id: v.expense_category_id ?? null,
      description: v.description,
      amount: v.amount,
      due_date: v.due_date,
      competence_date: comp,
      payment_method: v.payment_method ?? null,
      invoice_number: v.invoice_number ?? null,
      notes: v.notes ?? null,
      cost_center_id: inferredCostCenterId,
      purchase_order_id: v.purchase_order_id ?? null,
      approval_status: approvalStatus,
      status: 'pending',
      invoice_file_url: v.invoice_file_url?.trim() || null,
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
    if (error) return { data: null, error: new Error(error.message) };
    const row = data as ApRow;
    if (patch.status === 'paid' && row) {
      const { data: existingCf } = await supabase
        .from('cash_flow')
        .select('id')
        .eq('org_id', orgId)
        .eq('accounts_payable_id', id)
        .limit(1);
      if (!existingCf?.length) {
        const payDate =
          (patch.payment_date as string) ||
          (row as { payment_date?: string }).payment_date ||
          new Date().toISOString().slice(0, 10);
        const cf = await CashFlowService.create(orgId, {
          transaction_type: 'expense',
          amount: Number(row.amount),
          description: `Pagamento: ${row.supplier_name} — ${row.description}`,
          transaction_date: payDate,
          payment_method: row.payment_method ?? null,
          bank_account_id: null,
          accounts_receivable_id: null,
          accounts_payable_id: id,
          order_id: null,
          category_id: row.expense_category_id ?? null,
          cost_center_id: row.cost_center_id ?? null,
          notes: 'Gerado ao marcar conta a pagar como paga',
          reconciled: false,
        });
        if (cf.error) return { data: row, error: cf.error };
      }
    }
    return { data: row, error: null };
  }
}
