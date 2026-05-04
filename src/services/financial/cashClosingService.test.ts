import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

function defaultTableChain() {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

const mockNet = vi.fn();
const mockSum = vi.fn();

vi.mock('@/services/financial/cashFlowService', () => ({
  CashFlowService: {
    netBalanceForBankAccountThrough: (...args: unknown[]) => mockNet(...args),
    sumPeriodMetricsForBankAccount: (...args: unknown[]) => mockSum(...args),
  },
}));

vi.mock('@/services/financial/cashRegisterSessionService', () => ({
  CashRegisterSessionService: {
    closeOpenSessionsForBankOnDate: vi.fn().mockResolvedValue({ error: null }),
  },
}));

import { CashClosingService } from '@/services/financial/cashClosingService';

describe('CashClosingService.computePreview (por conta)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => defaultTableChain());
    mockNet.mockImplementation(async (_org: string, _acc: string, date: string) => {
      if (date === '2026-05-03') return 100;
      if (date === '2026-05-04') return 250;
      return 0;
    });
    mockSum.mockResolvedValue({ income: 50, expense: 20 });
  });

  it('escopo por conta: abertura (dia anterior), entradas/saídas do dia e saldo no fim do dia', async () => {
    const p = await CashClosingService.computePreview('org1', '2026-05-04', 'ba1');
    expect(mockNet).toHaveBeenCalledWith('org1', 'ba1', '2026-05-03');
    expect(mockSum).toHaveBeenCalledWith('org1', 'ba1', '2026-05-04', '2026-05-04');
    expect(mockNet).toHaveBeenCalledWith('org1', 'ba1', '2026-05-04');
    expect(p.opening_balance).toBe(100);
    expect(p.total_income).toBe(50);
    expect(p.total_expenses).toBe(20);
    expect(p.system_balance).toBe(250);
  });
});

describe('CashClosingService.listForConsolidatedDateEnriched', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNet.mockReset();
    mockSum.mockReset();
  });

  it('junta fechamentos do dia, conta e nome do operador em user_basic_info', async () => {
    const closingRow = {
      id: 'cc1',
      org_id: 'org1',
      bank_account_id: 'ba1',
      closing_date: '2026-05-04',
      system_balance: 100,
      total_verified: 100,
      difference_amount: 0,
      status: 'closed',
      expected_balance: 100,
      counted_balance: 100,
      bank_accounts: {
        id: 'ba1',
        name: 'Caixa — Maria',
        kind: 'cash',
        owner_user_id: 'user-uuid-1',
      },
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'cash_closings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [closingRow], error: null }),
        };
      }
      if (table === 'user_basic_info') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [{ user_id: 'user-uuid-1', name: 'Maria Silva', email: 'm@ex.com' }],
            error: null,
          }),
        };
      }
      return defaultTableChain();
    });

    const rows = await CashClosingService.listForConsolidatedDateEnriched('org1', '2026-05-04');
    expect(rows).toHaveLength(1);
    expect(rows[0].operator_name).toBe('Maria Silva');
    expect(rows[0].bank_accounts?.name).toBe('Caixa — Maria');
  });

  it('operator_name null quando não há owner_user_id ou sem linha em user_basic_info', async () => {
    const closingRow = {
      id: 'cc2',
      org_id: 'org1',
      bank_account_id: 'ba2',
      closing_date: '2026-05-04',
      system_balance: 50,
      total_verified: 50,
      difference_amount: 0,
      status: 'closed',
      expected_balance: 50,
      counted_balance: 50,
      bank_accounts: {
        id: 'ba2',
        name: 'Caixa legado',
        kind: 'cash',
        owner_user_id: null,
      },
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'cash_closings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [closingRow], error: null }),
        };
      }
      return defaultTableChain();
    });

    const rows = await CashClosingService.listForConsolidatedDateEnriched('org1', '2026-05-04');
    expect(rows).toHaveLength(1);
    expect(rows[0].operator_name).toBeNull();
  });
});
