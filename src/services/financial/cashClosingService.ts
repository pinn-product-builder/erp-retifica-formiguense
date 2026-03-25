import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CashFlowService } from '@/services/financial/cashFlowService';

type Row = Database['public']['Tables']['cash_closings']['Row'];

function prevDayYmd(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export class CashClosingService {
  static async list(orgId: string, limit = 30): Promise<Row[]> {
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .eq('org_id', orgId)
      .order('closing_date', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async getByDate(orgId: string, closingDate: string): Promise<Row | null> {
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .eq('org_id', orgId)
      .eq('closing_date', closingDate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Row | null) ?? null;
  }

  static async computePreview(orgId: string, closingDate: string): Promise<{
    opening_balance: number;
    total_income: number;
    total_expenses: number;
    system_balance: number;
  }> {
    const prev = prevDayYmd(closingDate);
    const [opening, metrics, systemEnd] = await Promise.all([
      CashFlowService.netBalanceThrough(orgId, prev),
      CashFlowService.sumPeriodMetrics(orgId, closingDate, closingDate),
      CashFlowService.netBalanceThrough(orgId, closingDate),
    ]);
    return {
      opening_balance: opening,
      total_income: metrics.income,
      total_expenses: metrics.expense,
      system_balance: systemEnd,
    };
  }

  static async create(
    row: Database['public']['Tables']['cash_closings']['Insert']
  ): Promise<{ data: Row | null; error: Error | null }> {
    const { data, error } = await supabase.from('cash_closings').insert(row).select().single();
    return { data: data as Row | null, error: error ? new Error(error.message) : null };
  }

  static async upsertFromCounts(
    orgId: string,
    closedBy: string | null,
    input: {
      closing_date: string;
      physical_cash: number;
      bank_balance: number;
      notes: string | null;
    }
  ): Promise<{ data: Row | null; error: Error | null }> {
    const preview = await this.computePreview(orgId, input.closing_date);
    const total_verified = input.physical_cash + input.bank_balance;
    const expected = preview.system_balance;
    const difference_amount = total_verified - expected;
    const status = Math.abs(difference_amount) < 0.02 ? 'closed' : 'divergent';

    const payload: Database['public']['Tables']['cash_closings']['Insert'] = {
      org_id: orgId,
      closing_date: input.closing_date,
      closed_by: closedBy,
      opening_balance: preview.opening_balance,
      total_income: preview.total_income,
      total_expenses: preview.total_expenses,
      system_balance: preview.system_balance,
      physical_cash: input.physical_cash,
      bank_balance: input.bank_balance,
      total_verified,
      expected_balance: expected,
      counted_balance: total_verified,
      difference_amount,
      notes: input.notes,
      status,
    };

    const existing = await this.getByDate(orgId, input.closing_date);
    if (existing) {
      const { data, error } = await supabase
        .from('cash_closings')
        .update(payload)
        .eq('id', existing.id)
        .eq('org_id', orgId)
        .select()
        .single();
      return { data: data as Row | null, error: error ? new Error(error.message) : null };
    }

    const { data, error } = await supabase.from('cash_closings').insert(payload).select().single();
    return { data: data as Row | null, error: error ? new Error(error.message) : null };
  }
}
