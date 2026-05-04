import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/services/financial/accountsReceivableService', () => ({
  AccountsReceivableService: {
    refreshOverdue: vi.fn().mockResolvedValue({ error: null }),
  },
}));

import { CustomerArPositionService, type CustomerArLine } from '@/services/financial/customerArPositionService';
import { customerArPositionSearchSchema } from '@/services/financial/customerArPositionSchemas';

function baseLine(
  overrides: Partial<CustomerArLine> & Pick<CustomerArLine, 'id' | 'dueDate' | 'statusRaw'>
): CustomerArLine {
  return {
    orgId: 'o1',
    organizationName: 'Org',
    customerId: 'c1',
    customerName: 'Cliente',
    issueDate: '2026-01-01',
    paymentDate: null,
    originalAmount: 100,
    pendingAmount: 100,
    paidAmount: 0,
    displayStatus: 'Pendente',
    paymentMethod: null,
    paymentMethodLabel: '—',
    invoiceNumber: null,
    receiptLines: [],
    ...overrides,
  };
}

describe('customerArPositionSearchSchema', () => {
  it('aceita documento curto para validação de formato mínimo', () => {
    expect(customerArPositionSearchSchema.safeParse({ document: 'ab' }).success).toBe(false);
    expect(customerArPositionSearchSchema.safeParse({ document: '123' }).success).toBe(true);
  });
});

describe('CustomerArPositionService.summarizeFilteredLines', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('agrega em dia vs atrasado para pendentes conforme vencimento local', () => {
    const lines: CustomerArLine[] = [
      baseLine({
        id: '1',
        dueDate: '2026-12-01',
        statusRaw: 'pending',
        pendingAmount: 40,
        paidAmount: 0,
      }),
      baseLine({
        id: '2',
        dueDate: '2026-01-01',
        statusRaw: 'pending',
        pendingAmount: 60,
        paidAmount: 0,
      }),
    ];
    const s = CustomerArPositionService.summarizeFilteredLines(lines);
    expect(s.pendingOnTime).toBe(40);
    expect(s.overdue).toBe(60);
    expect(s.totalReceived).toBe(0);
    expect(s.avgDelayDaysPaidLate).toBeNull();
    expect(s.countPaidLate).toBe(0);
  });

  it('soma totalReceived e média de atraso só para pagos após vencimento', () => {
    const lines: CustomerArLine[] = [
      baseLine({
        id: '1',
        dueDate: '2026-06-01',
        statusRaw: 'paid',
        pendingAmount: 0,
        paidAmount: 100,
        paymentDate: '2026-06-05',
      }),
      baseLine({
        id: '2',
        dueDate: '2026-06-01',
        statusRaw: 'paid',
        pendingAmount: 0,
        paidAmount: 50,
        paymentDate: '2026-05-28',
      }),
    ];
    const s = CustomerArPositionService.summarizeFilteredLines(lines);
    expect(s.totalReceived).toBe(150);
    expect(s.avgDelayDaysPaidLate).toBe(4);
    expect(s.countPaidLate).toBe(1);
  });

  it('ignora cancelados e renegociados no bucket de aberto', () => {
    const lines: CustomerArLine[] = [
      baseLine({
        id: '1',
        dueDate: '2030-01-01',
        statusRaw: 'cancelled',
        pendingAmount: 999,
        paidAmount: 0,
      }),
      baseLine({
        id: '2',
        dueDate: '2030-01-01',
        statusRaw: 'renegotiated',
        pendingAmount: 888,
        paidAmount: 0,
      }),
    ];
    const s = CustomerArPositionService.summarizeFilteredLines(lines);
    expect(s.pendingOnTime).toBe(0);
    expect(s.overdue).toBe(0);
  });
});

describe('CustomerArPositionService.normalizeDocument', () => {
  it('remove não dígitos', () => {
    expect(CustomerArPositionService.normalizeDocument('12.345.678/0001-90')).toBe('12345678000190');
    expect(CustomerArPositionService.normalizeDocument('123.456.789-01')).toBe('12345678901');
  });
});
