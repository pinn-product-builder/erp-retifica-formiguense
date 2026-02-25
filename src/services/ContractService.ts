import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

export const contractFormSchema = z.object({
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
  start_date: z.string().min(1, 'Data de início obrigatória'),
  end_date: z.string().min(1, 'Data de término obrigatória'),
  payment_days: z.number().int().min(1),
  discount_percentage: z.number().min(0).max(100).optional().nullable(),
  renewal_notice_days: z.number().int().min(1).default(30),
  auto_renew: z.boolean().default(false),
  minimum_order: z.number().min(0).optional().nullable(),
  maximum_order: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ContractFormData = z.infer<typeof contractFormSchema>;

export interface ContractItem {
  id: string;
  contract_id: string;
  part_code?: string | null;
  part_name: string;
  agreed_price: number;
  min_quantity?: number | null;
  max_quantity?: number | null;
  created_at: string;
}

export type ContractStatus = 'draft' | 'active' | 'expiring' | 'expired' | 'cancelled';

export interface ContractRow {
  id: string;
  org_id: string;
  contract_number: string;
  supplier_id: string;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  auto_renew: boolean;
  renewal_notice_days: number;
  payment_days: number;
  discount_percentage?: number | null;
  minimum_order?: number | null;
  maximum_order?: number | null;
  total_value: number;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { name: string; cnpj?: string | null } | null;
  items: ContractItem[];
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft:     'Rascunho',
  active:    'Ativo',
  expiring:  'A Vencer',
  expired:   'Expirado',
  cancelled: 'Cancelado',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft:     'bg-gray-100 text-gray-700 border-gray-200',
  active:    'bg-green-100 text-green-700 border-green-200',
  expiring:  'bg-amber-100 text-amber-700 border-amber-200',
  expired:   'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

function computeStatus(row: { status: ContractStatus; end_date: string; renewal_notice_days: number }): ContractStatus {
  if (['cancelled', 'draft'].includes(row.status)) return row.status;
  const daysLeft = differenceInDays(new Date(row.end_date), new Date());
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= row.renewal_notice_days) return 'expiring';
  return 'active';
}

export interface PaginatedContracts {
  data: ContractRow[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ContractService = {
  async list(
    orgId: string,
    opts: { page?: number; pageSize?: number; search?: string; status?: string } = {},
  ): Promise<PaginatedContracts> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('supplier_contracts')
      .select(
        'id, org_id, contract_number, supplier_id, start_date, end_date, status, auto_renew, renewal_notice_days, payment_days, discount_percentage, minimum_order, maximum_order, total_value, notes, created_by, created_at, updated_at, supplier:suppliers(name, cnpj), items:supplier_contract_items(id, contract_id, part_code, part_name, agreed_price, min_quantity, max_quantity, created_at)',
        { count: 'exact' },
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (opts.search) {
      query = query.or(`contract_number.ilike.%${opts.search}%`);
    }
    if (opts.status && opts.status !== 'all') {
      query = query.eq('status', opts.status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = (data ?? []).map((r) => ({
      ...r,
      status: computeStatus(r as ContractRow),
      items: (r.items as ContractItem[]) ?? [],
      supplier: r.supplier as { name: string; cnpj?: string | null } | null,
    })) as ContractRow[];

    return {
      data: rows,
      count: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  async generateNumber(orgId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_contract_number', { p_org_id: orgId });
    if (error) throw error;
    return data as string;
  },

  async create(
    orgId: string,
    userId: string,
    payload: ContractFormData & { items?: Array<{ part_code?: string; part_name: string; agreed_price: number; min_quantity?: number; max_quantity?: number }> },
  ): Promise<ContractRow> {
    const contractNumber = await this.generateNumber(orgId);

    const { data: contract, error } = await supabase
      .from('supplier_contracts')
      .insert({
        org_id: orgId,
        contract_number: contractNumber,
        supplier_id: payload.supplier_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        payment_days: payload.payment_days,
        discount_percentage: payload.discount_percentage ?? null,
        renewal_notice_days: payload.renewal_notice_days,
        auto_renew: payload.auto_renew,
        minimum_order: payload.minimum_order ?? null,
        maximum_order: payload.maximum_order ?? null,
        notes: payload.notes ?? null,
        created_by: userId,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) throw error;

    if ((payload.items ?? []).length > 0) {
      const itemsToInsert = (payload.items ?? []).map((item) => ({
        contract_id: contract.id,
        part_code: item.part_code ?? null,
        part_name: item.part_name,
        agreed_price: item.agreed_price,
        min_quantity: item.min_quantity ?? null,
        max_quantity: item.max_quantity ?? null,
      }));

      const { error: itemsError } = await supabase
        .from('supplier_contract_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    const result = await this.getById(contract.id);
    if (!result) throw new Error('Contrato criado mas não encontrado');
    return result;
  },

  async update(
    contractId: string,
    payload: Partial<ContractFormData> & { status?: ContractStatus },
  ): Promise<void> {
    const { error } = await supabase
      .from('supplier_contracts')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', contractId);

    if (error) throw error;
  },

  async renew(
    contractId: string,
    userId: string,
    orgId: string,
    payload: {
      new_start_date: string;
      new_end_date: string;
      price_adjustment_pct?: number;
      new_discount?: number | null;
      notes?: string;
    },
  ): Promise<ContractRow> {
    const original = await this.getById(contractId);
    if (!original) throw new Error('Contrato não encontrado');

    const adjustment = payload.price_adjustment_pct ?? 0;
    const newItems = original.items.map((item) => ({
      part_code: item.part_code ?? undefined,
      part_name: item.part_name,
      agreed_price: parseFloat((item.agreed_price * (1 + adjustment / 100)).toFixed(2)),
      min_quantity: item.min_quantity ?? undefined,
      max_quantity: item.max_quantity ?? undefined,
    }));

    const newContract = await this.create(orgId, userId, {
      supplier_id: original.supplier_id,
      start_date: payload.new_start_date,
      end_date: payload.new_end_date,
      payment_days: original.payment_days,
      discount_percentage: payload.new_discount ?? original.discount_percentage,
      renewal_notice_days: original.renewal_notice_days,
      auto_renew: original.auto_renew,
      minimum_order: original.minimum_order,
      maximum_order: original.maximum_order,
      notes: payload.notes ?? null,
      items: newItems,
    });

    await this.update(contractId, { status: 'cancelled' });
    return newContract;
  },

  async getById(contractId: string): Promise<ContractRow | null> {
    const { data, error } = await supabase
      .from('supplier_contracts')
      .select(
        'id, org_id, contract_number, supplier_id, start_date, end_date, status, auto_renew, renewal_notice_days, payment_days, discount_percentage, minimum_order, maximum_order, total_value, notes, created_by, created_at, updated_at, supplier:suppliers(name, cnpj), items:supplier_contract_items(id, contract_id, part_code, part_name, agreed_price, min_quantity, max_quantity, created_at)',
      )
      .eq('id', contractId)
      .single();

    if (error) return null;
    return {
      ...data,
      status: computeStatus(data as ContractRow),
      items: (data.items as ContractItem[]) ?? [],
      supplier: data.supplier as { name: string; cnpj?: string | null } | null,
    } as ContractRow;
  },

  async cancel(contractId: string): Promise<void> {
    await this.update(contractId, { status: 'cancelled' });
  },
};
