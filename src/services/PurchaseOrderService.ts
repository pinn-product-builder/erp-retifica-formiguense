import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// ── Status ────────────────────────────────────────────────────────────────────
export const PO_STATUS_LABELS: Record<string, string> = {
  draft:            'Rascunho',
  pending:          'Pendente',
  pending_approval: 'Aguardando Aprovação',
  approved:         'Aprovado',
  sent:             'Enviado',
  confirmed:        'Confirmado',
  in_transit:       'Em Trânsito',
  delivered:        'Entregue',
  cancelled:        'Cancelado',
};

export const PO_STATUS_COLORS: Record<string, string> = {
  draft:            'bg-gray-100 text-gray-700 border-gray-200',
  pending:          'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending_approval: 'bg-amber-100 text-amber-700 border-amber-200',
  approved:         'bg-blue-100 text-blue-700 border-blue-200',
  sent:             'bg-purple-100 text-purple-700 border-purple-200',
  confirmed:        'bg-green-100 text-green-700 border-green-200',
  in_transit:       'bg-orange-100 text-orange-700 border-orange-200',
  delivered:        'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled:        'bg-red-100 text-red-700 border-red-200',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface POItem {
  id:                string;
  po_id:             string;
  item_name:         string;
  description?:      string;
  quantity:          number;
  unit_price:        number;
  total_price:       number;
  received_quantity: number;
  part_id?:          string;
  created_at:        string;
}

export interface POSupplier {
  id:              string;
  name:            string;
  cnpj?:           string;
  email?:          string;
  phone?:          string;
  contact_person?: string;
}

export interface PurchaseOrderRow {
  id:               string;
  po_number:        string;
  org_id:           string;
  supplier_id:      string;
  quotation_id?:    string;
  status:           string;
  order_date:       string;
  expected_delivery?: string;
  actual_delivery?:   string;
  subtotal:         number;
  discount:         number;
  freight:          number;
  taxes:            number;
  total_value:      number;
  terms?:           string;
  notes?:           string;
  delivery_address?: string;
  requires_approval: boolean;
  approved_by?:     string;
  approved_at?:     string;
  sent_at?:         string;
  confirmed_at?:    string;
  created_by?:      string;
  created_at:       string;
  updated_at:       string;
  supplier:         POSupplier;
  items:            POItem[];
}

export interface PaginatedPOs {
  data:       PurchaseOrderRow[];
  count:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface POFilters {
  search?:      string;
  status?:      string;
  supplier_id?: string;
  dateFrom?:    string;
  dateTo?:      string;
}

export interface POStats {
  total:      number;
  draft:      number;
  pending:    number;
  sent:       number;
  totalSpend: number;
}

// ── Schema de Edição ──────────────────────────────────────────────────────────
export const purchaseOrderUpdateSchema = z.object({
  expected_delivery: z.string().optional(),
  terms:             z.string().optional(),
  notes:             z.string().optional(),
  delivery_address:  z.string().optional(),
  subtotal:          z.number().min(0),
  discount:          z.number().min(0),
  freight:           z.number().min(0),
  taxes:             z.number().min(0),
  total_value:       z.number().min(0),
});

export type POUpdateData = z.infer<typeof purchaseOrderUpdateSchema>;

// ── Service ───────────────────────────────────────────────────────────────────
export const PurchaseOrderService = {

  async list(
    orgId: string,
    filters: POFilters = {},
    page     = 1,
    pageSize = 10,
  ): Promise<PaginatedPOs> {
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    let query = supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(id, name, cnpj, email, phone, contact_person)', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.supplier_id && filters.supplier_id !== 'all') {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.search) {
      query = query.ilike('po_number', `%${filters.search}%`);
    }
    if (filters.dateFrom) {
      query = query.gte('order_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('order_date', filters.dateTo);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data:       (data ?? []) as unknown as PurchaseOrderRow[],
      count:      count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  async getById(id: string): Promise<PurchaseOrderRow> {
    const { data: order, error } = await supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(id, name, cnpj, email, phone, contact_person)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const { data: items, error: itemsErr } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('po_id', id)
      .order('created_at');

    if (itemsErr) throw itemsErr;

    return { ...order, items: items ?? [] } as unknown as PurchaseOrderRow;
  },

  async update(id: string, data: POUpdateData): Promise<void> {
    const payload = purchaseOrderUpdateSchema.parse(data);
    const { error } = await supabase
      .from('purchase_orders')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async approve(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status:      'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async send(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status:     'sent',
        sent_at:    new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async confirm(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status:       'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async cancel(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getStats(orgId: string): Promise<POStats> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('status, total_value')
      .eq('org_id', orgId);

    if (error) throw error;
    const rows = data ?? [];

    return {
      total:      rows.length,
      draft:      rows.filter(r => r.status === 'draft').length,
      pending:    rows.filter(r => ['pending', 'pending_approval'].includes(r.status)).length,
      sent:       rows.filter(r => r.status === 'sent').length,
      totalSpend: rows
        .filter(r => !['cancelled'].includes(r.status))
        .reduce((s, r) => s + (r.total_value ?? 0), 0),
    };
  },
};
