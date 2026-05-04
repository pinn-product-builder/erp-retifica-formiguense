import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

import { CashFlowService } from '@/services/financial/cashFlowService';

const validIncome = {
  transaction_type: 'income' as const,
  amount: 10,
  description: 'Teste',
  transaction_date: '2026-05-10',
  bank_account_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
};

describe('CashFlowService.create — bloqueio por fechamento na conta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna erro quando já existe cash_closings para org, data e conta', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'cash_closings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'fechamento-1' },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { error } = await CashFlowService.create('org-uuid', validIncome);
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/fechamento de caixa/i);
  });

  it('segue para insert quando não há fechamento para a conta na data', async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'cf-new', org_id: 'org-uuid', amount: 10 },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'cash_closings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === 'cash_flow') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: insertSingle,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { error, data } = await CashFlowService.create('org-uuid', validIncome);
    expect(error).toBeNull();
    expect(data?.id).toBe('cf-new');
    expect(insertSingle).toHaveBeenCalled();
  });
});
