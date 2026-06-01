import { describe, it, expect, vi, beforeEach } from 'vitest';
import { costMethodService } from './CostMethodService';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

function chainWith<T>(response: { data: T | null; error: { message: string } | null }) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),
    then: undefined as unknown,
  };
  Object.assign(c, {
    then: (resolve: (v: typeof response) => unknown) => resolve(response),
  });
  return c;
}

describe('CostMethodService.getCostLayerSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calcula média ponderada e identifica próxima camada FIFO', async () => {
    mockFrom.mockReturnValue(
      chainWith({
        data: [
          { quantity_remaining: 10, unit_cost: 100, entry_date: '2026-04-01' },
          { quantity_remaining: 5, unit_cost: 120, entry_date: '2026-04-15' },
          { quantity_remaining: 8, unit_cost: 110, entry_date: '2026-05-01' },
        ],
        error: null,
      })
    );

    const summary = await costMethodService.getCostLayerSummary('org-1', 'part-1');

    expect(summary.total_layers).toBe(3);
    expect(summary.total_quantity).toBe(23);
    expect(summary.total_cost).toBe(10 * 100 + 5 * 120 + 8 * 110);
    expect(summary.avg_cost).toBeCloseTo(summary.total_cost / 23);
    expect(summary.next_layer_cost).toBe(100);
  });

  it('retorna avg_cost zero quando não há camadas', async () => {
    mockFrom.mockReturnValue(chainWith({ data: [], error: null }));
    const summary = await costMethodService.getCostLayerSummary('org-1', 'part-1');
    expect(summary.total_layers).toBe(0);
    expect(summary.total_quantity).toBe(0);
    expect(summary.total_cost).toBe(0);
    expect(summary.avg_cost).toBe(0);
    expect(summary.next_layer_cost).toBeNull();
  });

  it('lida com camada única', async () => {
    mockFrom.mockReturnValue(
      chainWith({
        data: [{ quantity_remaining: 7, unit_cost: 42.5, entry_date: '2026-05-15' }],
        error: null,
      })
    );

    const summary = await costMethodService.getCostLayerSummary('org-1', 'part-1');
    expect(summary.total_layers).toBe(1);
    expect(summary.total_quantity).toBe(7);
    expect(summary.total_cost).toBe(7 * 42.5);
    expect(summary.avg_cost).toBeCloseTo(42.5);
    expect(summary.next_layer_cost).toBe(42.5);
  });

  it('propaga erro do Supabase', async () => {
    mockFrom.mockReturnValue(chainWith({ data: null, error: { message: 'RLS denied' } }));
    await expect(costMethodService.getCostLayerSummary('org-1', 'part-1')).rejects.toMatchObject({
      message: 'RLS denied',
    });
  });
});

describe('CostMethodService.requestMethodChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('insere registro de mudança com status pending', async () => {
    const insertedRow = {
      id: 'change-1',
      org_id: 'org-1',
      part_id: 'part-1',
      old_method: 'moving_avg',
      new_method: 'fifo',
      justification: 'Padronização contábil',
      requested_by: 'user-1',
      status: 'pending',
      approved_by: null,
      created_at: '2026-06-01',
      resolved_at: null,
    };
    mockFrom.mockReturnValue(chainWith({ data: insertedRow, error: null }));

    const result = await costMethodService.requestMethodChange(
      'org-1',
      'part-1',
      'moving_avg',
      'fifo',
      'Padronização contábil',
      'user-1'
    );

    expect(result.status).toBe('pending');
    expect(result.old_method).toBe('moving_avg');
    expect(result.new_method).toBe('fifo');
    expect(mockFrom).toHaveBeenCalledWith('cost_method_changes');
  });
});

describe('CostMethodService.approveMethodChange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aprova mudança e atualiza método na peça', async () => {
    const callOrder: string[] = [];

    const changeRow = {
      id: 'change-1',
      org_id: 'org-1',
      part_id: 'part-1',
      old_method: 'moving_avg',
      new_method: 'fifo',
      status: 'pending',
    };

    mockFrom.mockImplementation((table: string) => {
      callOrder.push(table);
      if (table === 'cost_method_changes') {
        return {
          ...chainWith({ data: changeRow, error: null }),
        };
      }
      return chainWith({ data: null, error: null });
    });

    await costMethodService.approveMethodChange('change-1', 'admin-1');

    expect(callOrder.filter((t) => t === 'cost_method_changes').length).toBeGreaterThanOrEqual(2);
    expect(callOrder).toContain('parts_inventory');
  });
});
