import { supabase } from '@/integrations/supabase/client';

export interface DirectConsumptionInput {
  orgId:        string;
  orderId:      string;
  partId:       string;
  partCode:     string;
  partName:     string;
  quantity:     number;
  consumedBy:   string;
  notes?:       string;
}

export interface ReversalInput {
  orgId:          string;
  movementId:     string;
  reservationId?: string;
  quantity:       number;
  reversedBy:     string;
  reason:         string;
}

type MovementRow = {
  id: string;
  part_id: string;
  quantity: number;
  new_quantity: number;
  org_id: string;
  order_id: string | null;
};

const db = () => supabase as any;

async function resolveOriginalMovement(orgId: string, referenceId: string): Promise<MovementRow | null> {
  const { data: byId, error: errById } = await db()
    .from('inventory_movements')
    .select('id, part_id, quantity, new_quantity, org_id, order_id')
    .eq('id', referenceId)
    .eq('org_id', orgId)
    .maybeSingle();
  if (!errById && byId) return byId as MovementRow;

  const { data: om } = await db()
    .from('order_materials')
    .select('id, order_id, part_id, quantity, org_id')
    .eq('id', referenceId)
    .maybeSingle();
  if (om?.part_id && om.org_id === orgId) {
    const { data: list } = await db()
      .from('inventory_movements')
      .select('id, part_id, quantity, new_quantity, org_id, order_id, metadata, created_at')
      .eq('org_id', orgId)
      .eq('order_id', om.order_id)
      .eq('part_id', om.part_id)
      .eq('movement_type', 'saida')
      .order('created_at', { ascending: false });
    const rows = (list ?? []) as Array<MovementRow & { metadata?: { action_type?: string } | null }>;
    const direct = rows.find((m) => m.metadata?.action_type === 'direct_consumption');
    const match =
      direct ?? rows.find((m) => Number(m.quantity) === Number(om.quantity)) ?? rows[0];
    if (match) {
      return {
        id: match.id,
        part_id: match.part_id,
        quantity: match.quantity,
        new_quantity: match.new_quantity,
        org_id: match.org_id,
        order_id: match.order_id,
      };
    }
  }

  const { data: res } = await db()
    .from('parts_reservations')
    .select('id, order_id, part_id, org_id, quantity_applied, quantity_separated')
    .eq('id', referenceId)
    .maybeSingle();
  if (res?.part_id && res.org_id === orgId) {
    const { data: list } = await db()
      .from('inventory_movements')
      .select('id, part_id, quantity, new_quantity, org_id, order_id, metadata, created_at')
      .eq('org_id', orgId)
      .eq('order_id', res.order_id)
      .eq('part_id', res.part_id)
      .eq('movement_type', 'saida')
      .order('created_at', { ascending: false });
    const rows = (list ?? []) as Array<
      MovementRow & { metadata?: { reservation_id?: string; action_type?: string } | null }
    >;
    const withMeta = rows.find((m) => m.metadata?.reservation_id === referenceId);
    const qtyHint = res.quantity_applied ?? res.quantity_separated ?? 0;
    const match =
      withMeta ??
      rows.find((m) => Number(m.quantity) === Number(qtyHint)) ??
      rows[0];
    if (match) {
      return {
        id: match.id,
        part_id: match.part_id,
        quantity: match.quantity,
        new_quantity: match.new_quantity,
        org_id: match.org_id,
        order_id: match.order_id,
      };
    }
  }

  return null;
}

export const ConsumptionService = {
  async recordDirectConsumption(input: DirectConsumptionInput): Promise<void> {
    const { data: stock, error: stockErr } = await db()
      .from('parts_inventory')
      .select('id, quantity, unit_cost')
      .eq('part_code', input.partCode)
      .eq('org_id', input.orgId)
      .maybeSingle();

    if (stockErr) throw stockErr;
    if (!stock) throw new Error(`Peça "${input.partName}" não encontrada no estoque.`);
    if (stock.quantity < input.quantity) {
      throw new Error(`Estoque insuficiente. Disponível: ${stock.quantity} | Solicitado: ${input.quantity}`);
    }

    const unitCost = Number(stock.unit_cost ?? 0);

    const { error: mvErr } = await db()
      .from('inventory_movements')
      .insert({
        org_id:           input.orgId,
        part_id:          stock.id,
        movement_type:    'saida',
        quantity:         input.quantity,
        previous_quantity: stock.quantity,
        new_quantity:     stock.quantity - input.quantity,
        order_id:         input.orderId,
        reason:           `Apontamento de consumo — OS: ${input.partName}`,
        notes:            input.notes ?? null,
        created_by:       input.consumedBy,
        requires_approval: false,
        approval_status:  'approved',
        approved_by:      input.consumedBy,
        approved_at:      new Date().toISOString(),
        metadata:         { action_type: 'direct_consumption', part_code: input.partCode },
      });
    if (mvErr) throw mvErr;

    const { error: omErr } = await db()
      .from('order_materials')
      .insert({
        org_id:    input.orgId,
        order_id:  input.orderId,
        part_id:   stock.id,
        part_code: input.partCode,
        part_name: input.partName,
        quantity:  input.quantity,
        unit_cost: unitCost,
        used_at:   new Date().toISOString(),
        used_by:   input.consumedBy,
        notes:     input.notes ?? null,
      });
    if (omErr) throw omErr;
  },

  async reverseConsumption(input: ReversalInput): Promise<void> {
    const mv = await resolveOriginalMovement(input.orgId, input.movementId);
    if (!mv) {
      throw new Error('Movimentação de saída não encontrada para este item');
    }

    const qtyOriginal = Number(mv.quantity);
    const qtyToReverse =
      input.quantity > 0 ? Math.min(input.quantity, qtyOriginal) : qtyOriginal;
    if (qtyToReverse <= 0) {
      throw new Error('Quantidade de estorno inválida');
    }

    const { data: stock, error: stockErr } = await db()
      .from('parts_inventory')
      .select('quantity')
      .eq('id', mv.part_id)
      .single();
    if (stockErr) throw stockErr;
    const currentQty = stock?.quantity ?? mv.new_quantity;

    const { error: mvErr } = await db()
      .from('inventory_movements')
      .insert({
        org_id:           input.orgId,
        part_id:          mv.part_id,
        movement_type:    'entrada',
        quantity:         qtyToReverse,
        previous_quantity: currentQty,
        new_quantity:     currentQty + qtyToReverse,
        order_id:         mv.order_id,
        reason:           `Estorno de consumo — ${input.reason}`,
        notes:            null,
        created_by:       input.reversedBy,
        requires_approval: false,
        approval_status:  'approved',
        approved_by:      input.reversedBy,
        approved_at:      new Date().toISOString(),
        metadata:         {
          action_type: 'consumption_reversal',
          original_movement_id: mv.id,
          reference_id: input.movementId,
        },
      });
    if (mvErr) throw mvErr;
  },
};
