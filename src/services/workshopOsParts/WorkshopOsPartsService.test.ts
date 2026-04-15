import { describe, expect, it, vi, beforeEach } from 'vitest';
import { addExtraLineSchema } from './schemas';
import { WorkshopOsPartsService } from './WorkshopOsPartsService';

const { mockQuery, mockSupabase } = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };

  return {
    mockQuery: query,
    mockSupabase: {
      from: vi.fn(() => query),
    },
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('WorkshopOsPartsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.select.mockReturnValue(mockQuery);
    mockQuery.eq.mockReturnValue(mockQuery);
  });

  it('valida quantidade positiva para peça extra', () => {
    expect(() =>
      addExtraLineSchema.parse({
        orderId: crypto.randomUUID(),
        partCode: 'ABC',
        partName: 'Peça teste',
        sectionName: 'Montagem',
        quantity: 0,
        unitPriceApplied: 10,
      })
    ).toThrow();
  });

  it('busca OS por número com sucesso', async () => {
    mockQuery.maybeSingle.mockResolvedValue({
      data: { id: 'order-1', order_number: 'S12786' },
      error: null,
    });

    const result = await WorkshopOsPartsService.getOrderByNumber('org-1', 'S12786');

    expect(mockSupabase.from).toHaveBeenCalledWith('orders');
    expect(result.order_number).toBe('S12786');
  });

  it('lança erro quando OS não existe', async () => {
    mockQuery.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(WorkshopOsPartsService.getOrderByNumber('org-1', 'S00000')).rejects.toThrow(
      'OS não encontrada ou sem permissão de acesso'
    );
  });
});
