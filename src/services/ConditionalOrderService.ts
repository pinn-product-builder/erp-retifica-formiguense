import { supabase } from '@/integrations/supabase/client';

export interface ConditionalOrderItem {
  id: string;
  conditional_order_id: string;
  part_code?: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  quantity_received?: number;
  received_at?: string;
  received_by?: string;
  receiving_notes?: string;
  decision?: 'approve' | 'return' | null;
  decision_notes?: string;
  created_at: string;
}

export interface ConditionalExtension {
  id: string;
  conditional_order_id: string;
  previous_deadline: string;
  new_deadline: string;
  days_added: number;
  justification: string;
  extension_number: number;
  requested_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ConditionalOrder {
  id: string;
  org_id: string;
  conditional_number: string;
  supplier_id: string;
  analysis_days: number;
  reference_doc?: string;
  expiry_date: string;
  notes?: string;
  status: 'pending' | 'in_analysis' | 'approved' | 'partial_return' | 'returned' | 'purchased' | 'overdue';
  total_amount: number;
  received_at?: string;
  decided_at?: string;
  decided_by?: string;
  justification?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  supplier?: { name: string; document?: string };
  items?: ConditionalOrderItem[];
  extensions?: ConditionalExtension[];
}

export interface CreateConditionalOrderData {
  supplier_id: string;
  analysis_days: number;
  reference_doc?: string;
  notes?: string;
  items: Array<{
    part_code?: string;
    part_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface ItemDecision {
  item_id: string;
  decision: 'approve' | 'return';
  decision_notes?: string;
}

export interface PaginatedConditionals {
  data: ConditionalOrder[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ConditionalOrderService = {
  async generateNumber(orgId: string): Promise<string> {
    const { data, error } = await supabase.rpc('generate_conditional_number', {
      p_org_id: orgId,
    });
    if (error) throw error;
    return data as string;
  },

  async list(
    orgId: string,
    params: {
      page?: number;
      pageSize?: number;
      status?: string;
      search?: string;
    } = {}
  ): Promise<PaginatedConditionals> {
    const { page = 1, pageSize = 10, status, search } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('conditional_orders')
      .select(
        `*, supplier:suppliers(name, document), items:conditional_order_items(*)`,
        { count: 'exact' }
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `conditional_number.ilike.%${search}%,reference_doc.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data ?? []) as unknown as ConditionalOrder[],
      count: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  async getById(id: string, orgId: string): Promise<ConditionalOrder | null> {
    const { data, error } = await supabase
      .from('conditional_orders')
      .select(`*, supplier:suppliers(name, document), items:conditional_order_items(*)`)
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw error;
    return data as unknown as ConditionalOrder;
  },

  async create(orgId: string, userId: string, payload: CreateConditionalOrderData): Promise<ConditionalOrder> {
    const number = await ConditionalOrderService.generateNumber(orgId);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + payload.analysis_days);

    const { data: order, error: orderError } = await supabase
      .from('conditional_orders')
      .insert({
        org_id: orgId,
        conditional_number: number,
        supplier_id: payload.supplier_id,
        analysis_days: payload.analysis_days,
        reference_doc: payload.reference_doc ?? null,
        expiry_date: expiryDate.toISOString().split('T')[0],
        notes: payload.notes ?? null,
        status: 'pending',
        total_amount: 0,
        created_by: userId,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    if (payload.items.length > 0) {
      const items = payload.items.map((item) => ({
        conditional_order_id: order.id,
        part_code: item.part_code ?? null,
        part_name: item.part_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('conditional_order_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return order as unknown as ConditionalOrder;
  },

  async updateStatus(
    id: string,
    orgId: string,
    status: ConditionalOrder['status'],
    extra?: { justification?: string; decided_by?: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('conditional_orders')
      .update({
        status,
        ...(extra?.justification ? { justification: extra.justification } : {}),
        ...(extra?.decided_by
          ? { decided_by: extra.decided_by, decided_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  },

  async applyDecisions(
    conditionalId: string,
    orgId: string,
    userId: string,
    decisions: ItemDecision[],
    justification?: string
  ): Promise<void> {
    for (const d of decisions) {
      const { error } = await supabase
        .from('conditional_order_items')
        .update({ decision: d.decision, decision_notes: d.decision_notes ?? null })
        .eq('id', d.item_id);

      if (error) throw error;
    }

    const allApproved = decisions.every((d) => d.decision === 'approve');
    const allReturned = decisions.every((d) => d.decision === 'return');
    const newStatus: ConditionalOrder['status'] = allApproved
      ? 'purchased'
      : allReturned
      ? 'returned'
      : 'partial_return';

    await ConditionalOrderService.updateStatus(conditionalId, orgId, newStatus, {
      justification,
      decided_by: userId,
    });
  },

  async registerReceipt(
    conditionalId: string,
    orgId: string,
    userId: string,
    items: Array<{ item_id: string; quantity_received: number; receiving_notes?: string }>,
    notes?: string
  ): Promise<void> {
    for (const item of items) {
      const { error } = await supabase
        .from('conditional_order_items')
        .update({
          quantity_received: item.quantity_received,
          received_at: new Date().toISOString(),
          received_by: userId,
          receiving_notes: item.receiving_notes ?? null,
        })
        .eq('id', item.item_id);
      if (error) throw error;
    }

    const { error } = await supabase
      .from('conditional_orders')
      .update({
        status: 'in_analysis',
        received_at: new Date().toISOString(),
        ...(notes ? { notes } : {}),
      })
      .eq('id', conditionalId)
      .eq('org_id', orgId);
    if (error) throw error;
  },

  async extendDeadline(
    conditionalId: string,
    orgId: string,
    userId: string,
    input: { days_added: number; justification: string }
  ): Promise<void> {
    const { data: co, error: coErr } = await supabase
      .from('conditional_orders')
      .select('expiry_date, id')
      .eq('id', conditionalId)
      .eq('org_id', orgId)
      .single();
    if (coErr) throw coErr;

    const { data: exts, error: extErr } = await supabase
      .from('conditional_extensions')
      .select('id')
      .eq('conditional_order_id', conditionalId);
    if (extErr) throw extErr;

    const extensionNumber = (exts?.length ?? 0) + 1;
    if (extensionNumber > 2) throw new Error('Número máximo de prorrogações atingido');

    const prev = new Date(co.expiry_date);
    const next = new Date(prev);
    next.setDate(next.getDate() + input.days_added);

    const { error: insErr } = await supabase
      .from('conditional_extensions')
      .insert({
        conditional_order_id: conditionalId,
        previous_deadline: prev.toISOString().split('T')[0],
        new_deadline: next.toISOString().split('T')[0],
        days_added: input.days_added,
        justification: input.justification,
        extension_number: extensionNumber,
        requested_by: userId,
        status: 'approved',
      });
    if (insErr) throw insErr;

    const { error: updErr } = await supabase
      .from('conditional_orders')
      .update({
        expiry_date: next.toISOString().split('T')[0],
        status: 'in_analysis',
      })
      .eq('id', conditionalId)
      .eq('org_id', orgId);
    if (updErr) throw updErr;
  },

  async getExtensions(conditionalId: string): Promise<ConditionalExtension[]> {
    const { data, error } = await supabase
      .from('conditional_extensions')
      .select('*')
      .eq('conditional_order_id', conditionalId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ConditionalExtension[];
  },

  async markOverdue(orgId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('conditional_orders')
      .update({ status: 'overdue' })
      .eq('org_id', orgId)
      .in('status', ['pending', 'in_analysis'])
      .lt('expiry_date', today);

    if (error) throw error;
  },
};
