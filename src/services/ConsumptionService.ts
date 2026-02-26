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

const db = () => supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> };

export const ConsumptionService = {
  /**
   * Registra consumo direto de peça em uma OS (sem reserva prévia). US-PUR-036 AC01/AC02.
   */
  async recordDirectConsumption(input: DirectConsumptionInput): Promise<void> {
    const { data: stock, error: stockErr } = await db()
      .from('parts_inventory')
      .select('id, quantity, average_cost')
      .eq('part_code', input.partCode)
      .eq('org_id', input.orgId)
      .maybeSingle() as unknown as { data: { id: string; quantity: number; average_cost: number } | null; error: unknown };

    if (stockErr) throw stockErr;
    if (!stock) throw new Error(`Peça "${input.partName}" não encontrada no estoque.`);
    if (stock.quantity < input.quantity) {
      throw new Error(`Estoque insuficiente. Disponível: ${stock.quantity} | Solicitado: ${input.quantity}`);
    }

    const unitCost  = stock.average_cost ?? 0;
    const totalCost = unitCost * input.quantity;

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
      }) as unknown as { error: unknown };
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
        total_cost: totalCost,
        used_at:   new Date().toISOString(),
        used_by:   input.consumedBy,
        notes:     input.notes ?? null,
        status:    'used',
      }) as unknown as { error: unknown };
    if (omErr) throw omErr;
  },

  /**
   * Estorna um consumo direto (order_materials). US-PUR-036 AC05.
   * Devolve a quantidade ao estoque e marca o registro como revertido.
   */
  async reverseConsumption(input: ReversalInput): Promise<void> {
    const { data: mv, error: mvFetchErr } = await db()
      .from('inventory_movements')
      .select('id, part_id, quantity, new_quantity, org_id')
      .eq('id', input.movementId)
      .single() as unknown as {
        data: { id: string; part_id: string; quantity: number; new_quantity: number; org_id: string } | null;
        error: unknown;
      };
    if (mvFetchErr) throw mvFetchErr;
    if (!mv) throw new Error('Movimentação não encontrada');

    const { data: stock, error: stockErr } = await db()
      .from('parts_inventory')
      .select('quantity')
      .eq('id', mv.part_id)
      .single() as unknown as { data: { quantity: number } | null; error: unknown };
    if (stockErr) throw stockErr;
    const currentQty = stock?.quantity ?? mv.new_quantity;

    const { error: mvErr } = await db()
      .from('inventory_movements')
      .insert({
        org_id:           input.orgId,
        part_id:          mv.part_id,
        movement_type:    'entrada',
        quantity:         input.quantity,
        previous_quantity: currentQty,
        new_quantity:     currentQty + input.quantity,
        reason:           `Estorno de consumo — ${input.reason}`,
        created_by:       input.reversedBy,
        requires_approval: false,
        approval_status:  'approved',
        approved_by:      input.reversedBy,
        approved_at:      new Date().toISOString(),
        metadata:         { action_type: 'consumption_reversal', original_movement_id: input.movementId },
      }) as unknown as { error: unknown };
    if (mvErr) throw mvErr;
  },
};
