import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PartTraceabilityService } from './partTraceabilityService';

type SupaResponse<T> = { data: T | null; error: { message: string } | null };

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

function makeChain<T>(response: SupaResponse<T>) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(response),
    then: undefined as unknown,
  };
  Object.assign(chain, {
    then: (resolve: (v: SupaResponse<T>) => unknown) => resolve(response),
  });
  return chain;
}

describe('PartTraceabilityService.getTrace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna trace vazio quando orgId ou partId vazio', async () => {
    const trace = await PartTraceabilityService.getTrace('', 'part-1');
    expect(trace.part).toBeNull();
    expect(trace.movements).toEqual([]);
    expect(trace.appliedInOrders).toEqual([]);
    expect(trace.totals).toEqual({ totalIn: 0, totalOut: 0, appliedQty: 0, orderCount: 0 });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('agrega movimentações e aplicações em OS corretamente', async () => {
    const partResponse: SupaResponse<{
      id: string;
      part_code: string;
      part_name: string;
      quantity: number;
      unit_cost: number;
    }> = {
      data: { id: 'part-1', part_code: 'P001', part_name: 'Anel', quantity: 12, unit_cost: 25.5 },
      error: null,
    };
    const movementsResponse: SupaResponse<unknown[]> = {
      data: [
        {
          id: 'm1',
          movement_type: 'entrada',
          quantity: 10,
          reason: 'Compra',
          created_at: '2026-05-01',
          order_id: null,
          unit_cost: 25,
          total_cost: 250,
          orders: null,
        },
        {
          id: 'm2',
          movement_type: 'entrada',
          quantity: 5,
          reason: 'Devolução cliente',
          created_at: '2026-05-05',
          order_id: null,
          unit_cost: 26,
          total_cost: 130,
          orders: null,
        },
        {
          id: 'm3',
          movement_type: 'saida',
          quantity: 2,
          reason: 'Aplicação OS',
          created_at: '2026-05-10',
          order_id: 'order-A',
          unit_cost: 25.5,
          total_cost: 51,
          orders: { order_number: 'S1001' },
        },
        {
          id: 'm4',
          movement_type: 'baixa',
          quantity: 1,
          reason: 'Quebra',
          created_at: '2026-05-12',
          order_id: null,
          unit_cost: null,
          total_cost: null,
          orders: null,
        },
      ],
      error: null,
    };
    const workshopResponse: SupaResponse<unknown[]> = {
      data: [
        {
          id: 'w1',
          order_id: 'order-A',
          qty_noted: 2,
          qty_released: 2,
          qty_cancelled: 0,
          unit_price_applied: 80,
          is_extra: false,
          created_at: '2026-05-10',
          notes: null,
          orders: { order_number: 'S1001', customers: { name: 'Cliente A' } },
        },
        {
          id: 'w2',
          order_id: 'order-B',
          qty_noted: 1,
          qty_released: 1,
          qty_cancelled: 0,
          unit_price_applied: 85,
          is_extra: true,
          created_at: '2026-05-11',
          notes: 'Peça extra',
          orders: { order_number: 'S1002', customers: { name: 'Cliente B' } },
        },
        {
          id: 'w3',
          order_id: 'order-A',
          qty_noted: 3,
          qty_released: 0,
          qty_cancelled: 3,
          unit_price_applied: 80,
          is_extra: false,
          created_at: '2026-05-09',
          notes: null,
          orders: { order_number: 'S1001', customers: { name: 'Cliente A' } },
        },
      ],
      error: null,
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'parts_inventory') return makeChain(partResponse);
      if (table === 'inventory_movements') return makeChain(movementsResponse);
      if (table === 'workshop_os_part_lines') return makeChain(workshopResponse);
      throw new Error(`Unexpected table ${table}`);
    });

    const trace = await PartTraceabilityService.getTrace('org-1', 'part-1');

    expect(trace.part).toEqual({
      id: 'part-1',
      code: 'P001',
      name: 'Anel',
      currentQuantity: 12,
      unitCost: 25.5,
    });
    expect(trace.movements).toHaveLength(4);
    expect(trace.appliedInOrders).toHaveLength(3);

    expect(trace.totals.totalIn).toBe(15);
    expect(trace.totals.totalOut).toBe(3);

    expect(trace.totals.appliedQty).toBe(3);

    expect(trace.totals.orderCount).toBe(2);

    const firstMov = trace.movements[0];
    expect(firstMov.type).toBe('entrada');
    expect(firstMov.unitCost).toBe(25);
    expect(firstMov.totalCost).toBe(250);

    const extra = trace.appliedInOrders.find((a) => a.workshopLineId === 'w2');
    expect(extra?.isExtra).toBe(true);
    expect(extra?.customerName).toBe('Cliente B');
  });

  it('retorna part null quando peça não existe', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'parts_inventory') return makeChain({ data: null, error: null });
      return makeChain({ data: [], error: null });
    });

    const trace = await PartTraceabilityService.getTrace('org-1', 'part-zzz');
    expect(trace.part).toBeNull();
    expect(trace.totals.totalIn).toBe(0);
  });

  it('propaga erro do Supabase em parts_inventory', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'parts_inventory')
        return makeChain({ data: null, error: { message: 'permission denied' } });
      return makeChain({ data: [], error: null });
    });

    await expect(PartTraceabilityService.getTrace('org-1', 'part-1')).rejects.toThrow(
      'permission denied'
    );
  });

  it('lida com qty_released zero (não conta no orderCount)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'parts_inventory')
        return makeChain({
          data: { id: 'part-1', part_code: 'X', part_name: 'P', quantity: 0, unit_cost: 0 },
          error: null,
        });
      if (table === 'inventory_movements') return makeChain({ data: [], error: null });
      if (table === 'workshop_os_part_lines')
        return makeChain({
          data: [
            {
              id: 'w-cancelled',
              order_id: 'order-Z',
              qty_noted: 1,
              qty_released: 0,
              qty_cancelled: 1,
              unit_price_applied: 50,
              is_extra: false,
              created_at: '2026-05-01',
              notes: null,
              orders: { order_number: 'S9000', customers: { name: 'C' } },
            },
          ],
          error: null,
        });
      throw new Error('unexpected');
    });

    const trace = await PartTraceabilityService.getTrace('org-1', 'part-1');
    expect(trace.totals.appliedQty).toBe(0);
    expect(trace.totals.orderCount).toBe(0);
    expect(trace.appliedInOrders).toHaveLength(1);
  });
});
