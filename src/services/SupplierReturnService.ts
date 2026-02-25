import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const RETURN_REASONS = [
  { value: 'defeito',               label: 'Produto com Defeito' },
  { value: 'erro_envio',            label: 'Erro no Envio' },
  { value: 'quantidade_errada',     label: 'Quantidade Incorreta' },
  { value: 'produto_errado',        label: 'Produto Diferente do Pedido' },
  { value: 'danificado_transporte', label: 'Danificado no Transporte' },
  { value: 'validade_vencida',      label: 'Validade Vencida' },
  { value: 'outro',                 label: 'Outro Motivo' },
] as const;

export type ReturnReason = typeof RETURN_REASONS[number]['value'];

export type ReturnStatus = 'pendente' | 'enviada' | 'aceita' | 'recusada';

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pendente:  'Pendente',
  enviada:   'Enviada ao Fornecedor',
  aceita:    'Aceita',
  recusada:  'Recusada',
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  pendente:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  enviada:   'bg-blue-100 text-blue-700 border-blue-200',
  aceita:    'bg-green-100 text-green-700 border-green-200',
  recusada:  'bg-red-100 text-red-700 border-red-200',
};

export interface SupplierReturnItem {
  id: string;
  return_id: string;
  receipt_item_id: string;
  part_id?: string;
  item_name: string;
  quantity: number;
  reason: ReturnReason;
  reason_details?: string;
  unit_cost: number;
  total_cost: number;
}

export interface SupplierReturn {
  id: string;
  org_id: string;
  return_number: string;
  receipt_id: string;
  purchase_order_id: string;
  supplier_id: string;
  return_date: string;
  returned_by: string;
  status: ReturnStatus;
  total_amount: number;
  credit_note_number?: string;
  credit_note_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: { name: string };
  receipt?: { receipt_number: string };
  items?: SupplierReturnItem[];
}

export interface CreateReturnItemInput {
  receipt_item_id: string;
  part_id?: string;
  item_name: string;
  quantity: number;
  reason: ReturnReason;
  reason_details?: string;
  unit_cost: number;
}

export interface CreateReturnInput {
  receipt_id: string;
  purchase_order_id: string;
  supplier_id: string;
  return_date: string;
  notes?: string;
  items: CreateReturnItemInput[];
}

export interface ReceiptItemForReturn {
  id: string;
  item_name: string;
  received_quantity: number;
  approved_quantity: number;
  unit_cost: number;
  part_id?: string;
  purchase_order_item_id?: string;
}

export interface ReceiptForReturn {
  id: string;
  receipt_number: string;
  purchase_order_id: string;
  supplier_id: string;
  supplier_name: string;
  po_number: string;
  items: ReceiptItemForReturn[];
}

export const SupplierReturnService = {
  async getReceiptForReturn(receiptId: string): Promise<ReceiptForReturn | null> {
    const [{ data: rcpt, error: rcptError }, { data: rcptItems, error: itemsError }] = await Promise.all([
      db
        .from('purchase_receipts')
        .select(`
          id, receipt_number, purchase_order_id,
          purchase_order:purchase_orders(
            po_number, supplier_id,
            supplier:suppliers(name)
          )
        `)
        .eq('id', receiptId)
        .single(),
      db
        .from('purchase_receipt_items')
        .select(`
          id, received_quantity, approved_quantity, unit_cost,
          part_id, purchase_order_item_id,
          order_item:purchase_order_items(item_name)
        `)
        .eq('receipt_id', receiptId),
    ]);

    if (rcptError) throw rcptError;
    if (itemsError) throw itemsError;
    if (!rcpt) return null;

    const po       = (rcpt as Record<string, unknown>).purchase_order as Record<string, unknown> | null;
    const supplier = po?.supplier as Record<string, unknown> | null;

    return {
      id:               rcpt.id,
      receipt_number:   rcpt.receipt_number,
      purchase_order_id: rcpt.purchase_order_id,
      supplier_id:      (po?.supplier_id as string) ?? '',
      supplier_name:    (supplier?.name as string) ?? '—',
      po_number:        (po?.po_number as string) ?? '—',
      items: (rcptItems ?? []).map((i: Record<string, unknown>) => {
        const orderItem = i.order_item as { item_name?: string } | null;
        return {
          id:                     i.id as string,
          item_name:              orderItem?.item_name ?? '(sem nome)',
          received_quantity:      i.received_quantity as number,
          approved_quantity:      i.approved_quantity as number,
          unit_cost:              i.unit_cost as number,
          part_id:                i.part_id as string | undefined,
          purchase_order_item_id: i.purchase_order_item_id as string | undefined,
        };
      }),
    };
  },

  async list(orgId: string): Promise<SupplierReturn[]> {
    const { data, error } = await db
      .from('supplier_returns')
      .select(`
        id, org_id, return_number, receipt_id, purchase_order_id,
        supplier_id, return_date, returned_by, status, total_amount,
        credit_note_number, credit_note_date, notes, created_at, updated_at,
        supplier:suppliers(name),
        receipt:purchase_receipts(receipt_number)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SupplierReturn[];
  },

  async getById(id: string): Promise<SupplierReturn | null> {
    const { data, error } = await db
      .from('supplier_returns')
      .select(`
        *,
        supplier:suppliers(name),
        receipt:purchase_receipts(receipt_number),
        items:supplier_return_items(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as SupplierReturn;
  },

  async create(orgId: string, userId: string, input: CreateReturnInput): Promise<SupplierReturn> {
    const totalAmount = input.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

    const { data: ret, error: retError } = await db
      .from('supplier_returns')
      .insert({
        org_id:            orgId,
        receipt_id:        input.receipt_id,
        purchase_order_id: input.purchase_order_id,
        supplier_id:       input.supplier_id,
        return_date:       input.return_date,
        returned_by:       userId,
        total_amount:      totalAmount,
        notes:             input.notes || null,
      })
      .select()
      .single();
    if (retError) throw retError;

    const itemRows = input.items.map(i => ({
      return_id:       ret.id,
      receipt_item_id: i.receipt_item_id,
      part_id:         i.part_id || null,
      item_name:       i.item_name,
      quantity:        Number(i.quantity),
      reason:          i.reason,
      reason_details:  i.reason_details || null,
      unit_cost:       Number(i.unit_cost),
    }));

    const { error: itemsError } = await db
      .from('supplier_return_items')
      .insert(itemRows);
    if (itemsError) throw itemsError;

    await SupplierReturnService.processInventory(ret.id, orgId, userId, input.items);

    return ret as SupplierReturn;
  },

  async processInventory(
    returnId: string,
    orgId: string,
    userId: string,
    items: CreateReturnItemInput[],
  ): Promise<void> {
    for (const item of items) {
      if (!item.part_id) continue;

      const { data: part } = await supabase
        .from('parts_inventory')
        .select('id, quantity')
        .eq('id', item.part_id)
        .eq('org_id', orgId)
        .maybeSingle();

      const qty     = Math.round(Number(item.quantity));
      const prevQty = Math.round(Number((part as { quantity?: unknown } | null)?.quantity ?? 0));
      const newQty  = Math.max(0, prevQty - qty);

      await supabase
        .from('inventory_movements')
        .insert({
          org_id:            orgId,
          part_id:           item.part_id,
          movement_type:     'saida',
          quantity:          -qty,
          previous_quantity: prevQty,
          new_quantity:      newQty,
          unit_cost:         Number(item.unit_cost),
          reason:            `Devolução ao fornecedor — ${RETURN_REASONS.find(r => r.value === item.reason)?.label ?? item.reason}`,
          notes:             item.reason_details || null,
          created_by:        userId,
          metadata:          { return_id: returnId, reference_type: 'devolucao_fornecedor' },
        });

      if (part) {
        await supabase
          .from('parts_inventory')
          .update({ quantity: newQty })
          .eq('id', item.part_id);
      }
    }
  },

  async updateStatus(
    id: string,
    status: ReturnStatus,
    creditNoteNumber?: string,
    creditNoteDate?: string,
  ): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (creditNoteNumber) updates.credit_note_number = creditNoteNumber;
    if (creditNoteDate)   updates.credit_note_date   = creditNoteDate;
    const { error } = await db.from('supplier_returns').update(updates).eq('id', id);
    if (error) throw error;
  },
};
