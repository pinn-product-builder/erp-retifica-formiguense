import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// ── Status ────────────────────────────────────────────────────────────────────
export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'waiting_proposals'
  | 'responded'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export const EDITABLE_STATUSES: QuotationStatus[] = ['draft', 'sent', 'waiting_proposals'];

export const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft:             'Rascunho',
  sent:              'Enviada',
  waiting_proposals: 'Aguardando Propostas',
  responded:         'Respondida',
  approved:          'Aprovada',
  rejected:          'Rejeitada',
  cancelled:         'Cancelada',
};

export const STATUS_COLORS: Record<QuotationStatus, string> = {
  draft:             'bg-gray-100 text-gray-700 border-gray-200',
  sent:              'bg-blue-100 text-blue-700 border-blue-200',
  waiting_proposals: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  responded:         'bg-purple-100 text-purple-700 border-purple-200',
  approved:          'bg-green-100 text-green-700 border-green-200',
  rejected:          'bg-red-100 text-red-700 border-red-200',
  cancelled:         'bg-gray-100 text-gray-500 border-gray-200',
};

export type QuotationPurpose = 'stock' | 'budget';
export type QuotationUrgency = 'normal' | 'media' | 'alta' | 'urgente';

export const URGENCY_LABELS: Record<QuotationUrgency, string> = {
  normal:  'Normal',
  media:   'Média',
  alta:    'Alta',
  urgente: 'Urgente',
};

export const URGENCY_COLORS: Record<QuotationUrgency, string> = {
  normal:  'bg-gray-100 text-gray-700',
  media:   'bg-yellow-100 text-yellow-700',
  alta:    'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface Quotation {
  id: string;
  org_id: string;
  quotation_number: string;
  requested_by: string;
  requested_date: string;
  due_date: string;
  status: QuotationStatus;
  title?: string;
  urgency?: QuotationUrgency;
  purpose?: QuotationPurpose;
  order_reference?: string;
  budget_reference?: string;
  notes?: string;
  delivery_address?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // from view
  total_items?: number;
  total_proposals?: number;
  suppliers_responded?: number;
  days_until_due?: number;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  part_id?: string;
  part_code?: string;
  part_name: string;
  quantity: number;
  description: string;
  specifications?: string;
  suggested_supplier_ids: string[];
  selected_supplier_ids: string[];
  sort_order: number;
  created_at: string;
  proposals?: QuotationProposal[];
}

export interface QuotationProposal {
  id: string;
  quotation_item_id: string;
  supplier_id: string;
  unit_price: number;
  total_price: number;
  lead_time_days: number;
  payment_terms?: string;
  technical_specs?: string;
  notes?: string;
  is_selected: boolean;
  responded_at: string;
  responded_by?: string;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
  supplier_trade_name?: string;
}

export interface SupplierSuggestion {
  supplier_id: string;
  supplier_name: string;
  supplier_trade_name?: string;
  unit_price: number;
  lead_time_days?: number;
  is_preferred: boolean;
  last_purchase_date?: string;
  supplier_overall_rating?: number;
  supplier_delivery_performance?: number;
}

// ── Zod Schemas ───────────────────────────────────────────────────────────────
export const quotationHeaderSchema = z.object({
  title:            z.string().min(2, 'Título obrigatório (mín. 2 caracteres)'),
  due_date:         z
    .string()
    .min(1, 'Prazo obrigatório')
    .refine(v => new Date(v) >= new Date(new Date().toDateString()), 'Prazo deve ser hoje ou futuro'),
  urgency:          z.enum(['normal', 'media', 'alta', 'urgente']).default('normal'),
  purpose:          z.enum(['stock', 'budget']).default('stock'),
  order_reference:  z.string().optional(),
  budget_reference: z.string().optional(),
  notes:            z.string().optional(),
  delivery_address: z
    .object({
      street: z.string().optional(),
      city:   z.string().optional(),
      state:  z.string().optional(),
      zip:    z.string().optional(),
    })
    .optional(),
});
export type QuotationHeaderFormData = z.infer<typeof quotationHeaderSchema>;

export const quotationItemSchema = z.object({
  part_id:               z.string().uuid().optional(),
  part_code:             z.string().optional(),
  part_name:             z.string().min(2, 'Nome obrigatório'),
  quantity:              z.number().positive('Quantidade deve ser positiva'),
  description:           z.string().min(1, 'Descrição obrigatória'),
  specifications:        z.string().optional(),
  selected_supplier_ids: z
    .array(z.string().uuid())
    .min(1, 'Selecione ao menos 1 fornecedor'),
});
export type QuotationItemFormData = z.infer<typeof quotationItemSchema>;

export const proposalSchema = z.object({
  unit_price:      z.number().min(0, 'Preço deve ser ≥ 0'),
  lead_time_days:  z.number().int().min(0),
  payment_terms:   z.string().optional(),
  technical_specs: z.string().optional(),
  notes:           z.string().optional(),
  responded_by:    z.string().optional(),
});
export type ProposalFormData = z.infer<typeof proposalSchema>;

// ── Pagination ────────────────────────────────────────────────────────────────
export interface QuotationFilters {
  search?:   string;
  status?:   QuotationStatus | 'all';
  dueSoon?:  boolean;
}

export interface PaginatedQuotations {
  data:       Quotation[];
  count:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ── Quotation for PO ──────────────────────────────────────────────────────────
export interface QuotationForPO {
  id: string;
  quotation_number: string;
  status: QuotationStatus;
  due_date: string;
  total_items: number;
  supplier_id: string;
  supplier_name: string;
  total_value: number;
  lead_time_days: number;
  payment_terms: string;
  items: Array<{
    item_name: string;
    part_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    description?: string;
  }>;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const QuotationService = {

  async getQuotations(
    orgId: string,
    filters: QuotationFilters = {},
    page = 1,
    pageSize = 10
  ): Promise<PaginatedQuotations> {
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    let query = supabase
      .from('purchase_quotation_details')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.ilike('quotation_number', `%${filters.search}%`);
    }
    if (filters.dueSoon) {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      query = query
        .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
        .in('status', ['sent', 'waiting_proposals']);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data:       (data ?? []) as Quotation[],
      count:      count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  async getById(id: string): Promise<{ quotation: Quotation; items: QuotationItem[] }> {
    const [quotationRes, itemsRes] = await Promise.all([
      supabase
        .from('purchase_quotation_details')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('purchase_quotation_items')
        .select(`
          *,
          proposals:purchase_quotation_proposals(
            *,
            supplier:suppliers(id, name, trade_name)
          )
        `)
        .eq('quotation_id', id)
        .order('sort_order'),
    ]);

    if (quotationRes.error) throw quotationRes.error;
    if (itemsRes.error)     throw itemsRes.error;

    const items = (itemsRes.data ?? []).map(item => ({
      ...item,
      proposals: (item.proposals ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        supplier_name:       (p.supplier as { trade_name?: string; name: string } | null)?.trade_name
                          || (p.supplier as { name: string } | null)?.name
                          || '',
        supplier_trade_name: (p.supplier as { trade_name?: string } | null)?.trade_name,
      })),
    })) as QuotationItem[];

    return { quotation: quotationRes.data as Quotation, items };
  },

  async listReadyForPO(orgId: string): Promise<Quotation[]> {
    const { data, error } = await supabase
      .from('purchase_quotation_details')
      .select('*')
      .eq('org_id', orgId)
      .in('status', ['responded', 'approved'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Quotation[];
  },

  async getForPurchaseOrder(id: string): Promise<QuotationForPO | null> {
    const { quotation, items } = await QuotationService.getById(id);

    const allProposals = items.flatMap(item =>
      (item.proposals ?? []).map(p => ({ ...p, item }))
    );
    const selected = allProposals.filter(p => p.is_selected);

    const pool = selected.length > 0 ? selected : allProposals;
    if (pool.length === 0) return null;

    const firstSupplierId = pool[0].supplier_id;
    const supplierPool = pool.filter(p => p.supplier_id === firstSupplierId);

    const poItems = supplierPool.map(p => ({
      item_name: p.item.part_name,
      part_id: p.item.part_id,
      quantity: p.item.quantity,
      unit_price: p.unit_price,
      total_price: p.total_price,
      description: p.item.description,
    }));

    const totalValue = poItems.reduce((sum, i) => sum + i.total_price, 0);
    const maxLeadTime = Math.max(...supplierPool.map(p => p.lead_time_days ?? 0));
    const paymentTerms = supplierPool.find(p => p.payment_terms)?.payment_terms ?? '';
    const supplierName = supplierPool[0].supplier_name ?? '';

    return {
      id: quotation.id,
      quotation_number: quotation.quotation_number,
      status: quotation.status,
      due_date: quotation.due_date,
      total_items: poItems.length,
      supplier_id: firstSupplierId,
      supplier_name: supplierName,
      total_value: totalValue,
      lead_time_days: maxLeadTime,
      payment_terms: paymentTerms,
      items: poItems,
    };
  },

  async create(orgId: string, userId: string, data: QuotationHeaderFormData): Promise<Quotation> {
    const { data: quotation, error } = await supabase
      .from('purchase_quotations')
      .insert({
        org_id:           orgId,
        requested_by:     userId,
        due_date:         data.due_date,
        title:            data.title || null,
        urgency:          data.urgency || 'normal',
        purpose:          data.purpose || 'stock',
        order_reference:  data.order_reference || null,
        budget_reference: data.budget_reference || null,
        notes:            data.notes || null,
        delivery_address: data.delivery_address || null,
        quotation_number: '',
      })
      .select()
      .single();

    if (error) throw error;
    return quotation as Quotation;
  },

  async update(id: string, data: Partial<QuotationHeaderFormData>): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (data.due_date         !== undefined) updates.due_date         = data.due_date;
    if (data.title            !== undefined) updates.title            = data.title || null;
    if (data.urgency          !== undefined) updates.urgency          = data.urgency;
    if (data.purpose          !== undefined) updates.purpose          = data.purpose;
    if (data.order_reference  !== undefined) updates.order_reference  = data.order_reference || null;
    if (data.budget_reference !== undefined) updates.budget_reference = data.budget_reference || null;
    if (data.notes            !== undefined) updates.notes            = data.notes || null;
    if (data.delivery_address !== undefined) updates.delivery_address = data.delivery_address || null;

    const { error } = await supabase
      .from('purchase_quotations')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async updateStatus(id: string, status: QuotationStatus): Promise<void> {
    const { error } = await supabase
      .from('purchase_quotations')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_quotations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Items ──────────────────────────────────────────────────────────────────
  async addItem(quotationId: string, data: QuotationItemFormData, sortOrder = 0): Promise<QuotationItem> {
    const { data: item, error } = await supabase
      .from('purchase_quotation_items')
      .insert({
        quotation_id:          quotationId,
        part_id:               data.part_id || null,
        part_code:             data.part_code || null,
        part_name:             data.part_name,
        quantity:              data.quantity,
        description:           data.description,
        specifications:        data.specifications || null,
        suggested_supplier_ids: [],
        selected_supplier_ids: data.selected_supplier_ids,
        sort_order:            sortOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return item as QuotationItem;
  },

  async updateItem(itemId: string, data: Partial<QuotationItemFormData>): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (data.part_id               !== undefined) updates.part_id               = data.part_id || null;
    if (data.part_code             !== undefined) updates.part_code             = data.part_code || null;
    if (data.part_name             !== undefined) updates.part_name             = data.part_name;
    if (data.quantity              !== undefined) updates.quantity              = data.quantity;
    if (data.description           !== undefined) updates.description           = data.description;
    if (data.specifications        !== undefined) updates.specifications        = data.specifications || null;
    if (data.selected_supplier_ids !== undefined) updates.selected_supplier_ids = data.selected_supplier_ids;
    const { error } = await supabase
      .from('purchase_quotation_items')
      .update(updates)
      .eq('id', itemId);
    if (error) throw error;
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_quotation_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  // ── Proposals ──────────────────────────────────────────────────────────────
  async addProposal(
    itemId: string,
    supplierId: string,
    data: ProposalFormData,
    quantity: number
  ): Promise<QuotationProposal> {
    const { data: proposal, error } = await supabase
      .from('purchase_quotation_proposals')
      .insert({
        quotation_item_id: itemId,
        supplier_id:       supplierId,
        unit_price:        data.unit_price,
        total_price:       data.unit_price * quantity,
        lead_time_days:    data.lead_time_days,
        payment_terms:     data.payment_terms || null,
        technical_specs:   data.technical_specs || null,
        notes:             data.notes || null,
        responded_by:      data.responded_by || null,
        is_selected:       false,
      })
      .select()
      .single();

    if (error) throw error;
    return proposal as QuotationProposal;
  },

  async updateProposal(proposalId: string, data: Partial<ProposalFormData>, quantity: number): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (data.unit_price      !== undefined) { updates.unit_price  = data.unit_price; updates.total_price = data.unit_price * quantity; }
    if (data.lead_time_days  !== undefined) updates.lead_time_days  = data.lead_time_days;
    if (data.payment_terms   !== undefined) updates.payment_terms   = data.payment_terms || null;
    if (data.technical_specs !== undefined) updates.technical_specs = data.technical_specs || null;
    if (data.notes           !== undefined) updates.notes           = data.notes || null;
    if (data.responded_by    !== undefined) updates.responded_by    = data.responded_by || null;
    const { error } = await supabase
      .from('purchase_quotation_proposals')
      .update(updates)
      .eq('id', proposalId);
    if (error) throw error;
  },

  async selectProposal(proposalId: string, quotationItemId: string): Promise<void> {
    await supabase
      .from('purchase_quotation_proposals')
      .update({ is_selected: false })
      .eq('quotation_item_id', quotationItemId);

    const { error } = await supabase
      .from('purchase_quotation_proposals')
      .update({ is_selected: true })
      .eq('id', proposalId);
    if (error) throw error;
  },

  async deleteProposal(proposalId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_quotation_proposals')
      .delete()
      .eq('id', proposalId);
    if (error) throw error;
  },

  // ── Sugestão de fornecedores ───────────────────────────────────────────────
  async suggestSuppliersForPart(
    partId?: string,
    partCode?: string,
    orgId?: string
  ): Promise<SupplierSuggestion[]> {
    if (!partId && !partCode) return [];

    let query = supabase
      .from('valid_supplier_prices')
      .select([
        'supplier_id', 'supplier_name', 'supplier_trade_name',
        'unit_price', 'lead_time_days', 'is_preferred',
        'last_purchase_date', 'supplier_overall_rating', 'supplier_delivery_performance',
      ].join(','))
      .order('is_preferred',              { ascending: false })
      .order('supplier_overall_rating',   { ascending: false, nullsFirst: false })
      .limit(10);

    if (orgId)     query = query.eq('org_id', orgId);
    if (partId)    query = query.eq('part_id', partId);
    else if (partCode) query = query.ilike('part_code', partCode);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SupplierSuggestion[];
  },

  // ── Verificar se já existe PC para esta cotação ───────────────────────────
  async hasPurchaseOrder(quotationId: string): Promise<boolean> {
    const { count } = await supabase
      .from('purchase_orders')
      .select('id', { count: 'exact', head: true })
      .eq('quotation_id', quotationId)
      .not('status', 'eq', 'cancelled');
    return (count ?? 0) > 0;
  },

  // ── Reabrir Cotação (US-PUR-025) ──────────────────────────────────────────
  REOPEN_REASONS: {
    insufficient_proposals: 'Propostas insuficientes',
    prices_too_high:        'Preços muito altos',
    specification_change:   'Mudança de especificação',
    deadline_extension:     'Extensão de prazo para fornecedores',
    other:                  'Outro',
  } as const,

  canReopen(status: QuotationStatus): boolean {
    return ['rejected', 'cancelled'].includes(status);
  },

  async reopenQuotation(
    id: string,
    newDueDate: string,
    reason: string,
    additionalNotes?: string
  ): Promise<Quotation> {
    const reasonLabel =
      (QuotationService.REOPEN_REASONS as Record<string, string>)[reason] ?? reason;
    const notesEntry = `[Reaberta — motivo: ${reasonLabel}]${additionalNotes ? ` ${additionalNotes}` : ''}`;

    const { data: current } = await supabase
      .from('purchase_quotations')
      .select('notes')
      .eq('id', id)
      .single();

    const existingNotes = (current as { notes?: string } | null)?.notes ?? '';
    const mergedNotes   = existingNotes ? `${existingNotes}\n${notesEntry}` : notesEntry;

    const { data, error } = await supabase
      .from('purchase_quotations')
      .update({ status: 'waiting_proposals', due_date: newDueDate, notes: mergedNotes })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Quotation;
  },

  // ── Copiar Cotação (US-PUR-026) ────────────────────────────────────────────
  async copyQuotation(
    originalId: string,
    orgId: string,
    userId: string,
    newDueDate: string,
    newTitle?: string,
  ): Promise<Quotation> {
    const { quotation: original, items } = await QuotationService.getById(originalId);

    const copyNote = `Cópia de ${original.quotation_number}`;
    const combinedNotes = original.notes
      ? `${copyNote}\n${original.notes}`
      : copyNote;

    const { data: newQuotation, error: quotError } = await supabase
      .from('purchase_quotations')
      .insert({
        org_id:           orgId,
        requested_by:     userId,
        due_date:         newDueDate,
        title:            newTitle || original.title || null,
        urgency:          original.urgency || 'normal',
        purpose:          original.purpose || 'stock',
        order_reference:  original.order_reference || null,
        budget_reference: original.budget_reference || null,
        notes:            combinedNotes,
        delivery_address: original.delivery_address || null,
        quotation_number: '',
        status:           'draft',
      })
      .select()
      .single();

    if (quotError) throw quotError;

    const newId = (newQuotation as Quotation).id;

    if (items.length > 0) {
      const itemsToInsert = items.map((item, idx) => ({
        quotation_id:           newId,
        part_id:                item.part_id || null,
        part_code:              item.part_code || null,
        part_name:              item.part_name,
        quantity:               item.quantity,
        description:            item.description,
        specifications:         item.specifications || null,
        suggested_supplier_ids: item.suggested_supplier_ids ?? [],
        selected_supplier_ids:  item.selected_supplier_ids ?? [],
        sort_order:             idx,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_quotation_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }

    return newQuotation as Quotation;
  },

  // ── Exportação ────────────────────────────────────────────────────────────
  generateCsvContent(quotation: Quotation, items: QuotationItem[]): string {
    const bom = '\uFEFF';
    const header = 'Cotação;Prazo Resposta;Item;Código;Descrição;Qtd;Especificações;Preço Unitário (preencher);Prazo Entrega dias (preencher);Condições Pagamento (preencher);Observações (preencher)';
    const rows = items.map(item =>
      [
        quotation.quotation_number,
        new Date(quotation.due_date).toLocaleDateString('pt-BR'),
        item.part_name,
        item.part_code ?? '',
        item.description,
        item.quantity.toString().replace('.', ','),
        item.specifications ?? '',
        '', '', '', '',
      ].join(';')
    );
    return bom + [header, ...rows].join('\n');
  },

  generateWhatsAppMessage(quotation: Quotation, items: QuotationItem[]): string {
    const lines = [
      `*COTAÇÃO ${quotation.quotation_number}*`,
      `Prazo para resposta: ${new Date(quotation.due_date).toLocaleDateString('pt-BR')}`,
      '',
      '*ITENS SOLICITADOS:*',
      ...items.map((item, i) =>
        `${i + 1}. *${item.part_name}*${item.part_code ? ` (${item.part_code})` : ''} — Qtd: ${item.quantity}` +
        (item.specifications ? `\n   Esp.: ${item.specifications}` : '')
      ),
      '',
      ...(quotation.notes ? [`*Obs.:* ${quotation.notes}`, ''] : []),
      'Favor responder informando: preço unitário, prazo de entrega e condições de pagamento.',
    ];
    return lines.join('\n');
  },

  generateWhatsAppLink(phone: string, message: string): string {
    const clean = phone.replace(/\D/g, '');
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  },
};
