/**
 * Rastreio analítico de peça: dado um part_id, retorna onde a peça foi aplicada,
 * histórico de movimentações e referência à NF de compra (quando disponível).
 *
 * Task ClickUp 86agmy9m3 — análise/implementação.
 */
import { supabase } from '@/integrations/supabase/client';

export type PartTraceabilityMovement = {
  id: string;
  type: string;
  quantity: number;
  date: string;
  reason: string | null;
  orderNumber: string | null;
  unitCost: number | null;
  totalCost: number | null;
};

export type PartTraceabilityOrderApplication = {
  workshopLineId: string;
  orderId: string;
  orderNumber: string | null;
  customerName: string | null;
  qtyNoted: number;
  qtyReleased: number;
  qtyCancelled: number;
  unitPriceApplied: number;
  isExtra: boolean;
  appliedAt: string;
  notes: string | null;
};

export type PartTraceability = {
  part: {
    id: string;
    code: string;
    name: string;
    currentQuantity: number;
    unitCost: number;
  } | null;
  movements: PartTraceabilityMovement[];
  appliedInOrders: PartTraceabilityOrderApplication[];
  totals: {
    totalIn: number;
    totalOut: number;
    appliedQty: number;
    orderCount: number;
  };
};

export class PartTraceabilityService {
  static async getTrace(orgId: string, partId: string): Promise<PartTraceability> {
    if (!orgId || !partId) {
      return {
        part: null,
        movements: [],
        appliedInOrders: [],
        totals: { totalIn: 0, totalOut: 0, appliedQty: 0, orderCount: 0 },
      };
    }

    const { data: partData, error: partErr } = await supabase
      .from('parts_inventory')
      .select('id, part_code, part_name, quantity, unit_cost')
      .eq('org_id', orgId)
      .eq('id', partId)
      .maybeSingle();
    if (partErr) throw new Error(partErr.message);

    const { data: movData, error: movErr } = await supabase
      .from('inventory_movements')
      .select(
        'id, movement_type, quantity, reason, created_at, order_id, unit_cost, total_cost, orders(order_number)'
      )
      .eq('org_id', orgId)
      .eq('part_id', partId)
      .order('created_at', { ascending: false });
    if (movErr) throw new Error(movErr.message);

    const { data: workshopData, error: workshopErr } = await supabase
      .from('workshop_os_part_lines')
      .select(
        'id, order_id, qty_noted, qty_released, qty_cancelled, unit_price_applied, is_extra, created_at, notes, orders(order_number, customers(name))'
      )
      .eq('org_id', orgId)
      .eq('part_id', partId)
      .order('created_at', { ascending: false });
    if (workshopErr) throw new Error(workshopErr.message);

    const movements: PartTraceabilityMovement[] = ((movData ?? []) as Array<{
      id: string;
      movement_type: string;
      quantity: number;
      reason: string | null;
      created_at: string;
      order_id: string | null;
      unit_cost: number | null;
      total_cost: number | null;
      orders: { order_number?: string | null } | null;
    }>).map((m) => ({
      id: m.id,
      type: m.movement_type,
      quantity: Number(m.quantity),
      date: m.created_at,
      reason: m.reason ?? null,
      orderNumber: m.orders?.order_number ?? null,
      unitCost: m.unit_cost != null ? Number(m.unit_cost) : null,
      totalCost: m.total_cost != null ? Number(m.total_cost) : null,
    }));

    const appliedInOrders: PartTraceabilityOrderApplication[] = ((workshopData ?? []) as Array<{
      id: string;
      order_id: string;
      qty_noted: number;
      qty_released: number;
      qty_cancelled: number;
      unit_price_applied: number;
      is_extra: boolean;
      created_at: string;
      notes: string | null;
      orders: { order_number?: string | null; customers?: { name?: string | null } | null } | null;
    }>).map((w) => ({
      workshopLineId: w.id,
      orderId: w.order_id,
      orderNumber: w.orders?.order_number ?? null,
      customerName: w.orders?.customers?.name ?? null,
      qtyNoted: Number(w.qty_noted),
      qtyReleased: Number(w.qty_released),
      qtyCancelled: Number(w.qty_cancelled),
      unitPriceApplied: Number(w.unit_price_applied ?? 0),
      isExtra: Boolean(w.is_extra),
      appliedAt: w.created_at,
      notes: w.notes ?? null,
    }));

    const totalIn = movements
      .filter((m) => m.type === 'entrada')
      .reduce((s, m) => s + m.quantity, 0);
    const totalOut = movements
      .filter((m) => m.type === 'saida' || m.type === 'baixa')
      .reduce((s, m) => s + m.quantity, 0);
    const appliedQty = appliedInOrders.reduce((s, a) => s + a.qtyReleased, 0);
    const orderCount = new Set(
      appliedInOrders.filter((a) => a.qtyReleased > 0).map((a) => a.orderId)
    ).size;

    return {
      part: partData
        ? {
            id: (partData as { id: string }).id,
            code: (partData as { part_code: string }).part_code,
            name: (partData as { part_name: string }).part_name,
            currentQuantity: Number((partData as { quantity: number }).quantity ?? 0),
            unitCost: Number((partData as { unit_cost: number }).unit_cost ?? 0),
          }
        : null,
      movements,
      appliedInOrders,
      totals: { totalIn, totalOut, appliedQty, orderCount },
    };
  }
}
