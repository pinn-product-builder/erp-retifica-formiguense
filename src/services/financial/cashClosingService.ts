import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CashFlowService } from '@/services/financial/cashFlowService';
import { CashRegisterSessionService } from '@/services/financial/cashRegisterSessionService';

type Row = Database['public']['Tables']['cash_closings']['Row'];
type BaRow = Database['public']['Tables']['bank_accounts']['Row'];

export type CashClosingConsolidatedLine = Row & {
  bank_accounts: Pick<BaRow, 'id' | 'name' | 'kind' | 'owner_user_id'> | null;
};

export type CashClosingConsolidatedEnrichedLine = CashClosingConsolidatedLine & {
  operator_name: string | null;
};

function prevDayYmd(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export class CashClosingService {
  static async list(orgId: string, limit = 30, bankAccountId?: string): Promise<Row[]> {
    let q = supabase
      .from('cash_closings')
      .select('*')
      .eq('org_id', orgId)
      .order('closing_date', { ascending: false })
      .limit(limit);
    if (bankAccountId) q = q.eq('bank_account_id', bankAccountId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as Row[]) ?? [];
  }

  static async listForConsolidatedDate(
    orgId: string,
    closingDate: string
  ): Promise<CashClosingConsolidatedLine[]> {
    const { data, error } = await supabase
      .from('cash_closings')
      .select(
        `*,
        bank_accounts (id, name, kind, owner_user_id)`
      )
      .eq('org_id', orgId)
      .eq('closing_date', closingDate)
      .order('bank_account_id');
    if (error) throw new Error(error.message);
    return (data as CashClosingConsolidatedLine[]) ?? [];
  }

  /** Mesmo que `listForConsolidatedDate`, com nome do operador (`user_basic_info`). */
  static async listForConsolidatedDateEnriched(
    orgId: string,
    closingDate: string
  ): Promise<CashClosingConsolidatedEnrichedLine[]> {
    const lines = await this.listForConsolidatedDate(orgId, closingDate);
    const ownerIds = [
      ...new Set(
        lines
          .map((l) => l.bank_accounts?.owner_user_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    if (ownerIds.length === 0) {
      return lines.map((l) => ({ ...l, operator_name: null }));
    }
    const { data: infos, error } = await supabase
      .from('user_basic_info')
      .select('user_id, name, email')
      .in('user_id', ownerIds);
    if (error) throw new Error(error.message);
    const map = new Map(
      (infos ?? []).map((r) => [
        r.user_id as string,
        (r.name?.trim() || r.email || '').trim() || null,
      ])
    );
    return lines.map((l) => {
      const uid = l.bank_accounts?.owner_user_id;
      return {
        ...l,
        operator_name: uid ? map.get(uid) ?? null : null,
      };
    });
  }

  static async getByDateAndAccount(
    orgId: string,
    closingDate: string,
    bankAccountId: string
  ): Promise<Row | null> {
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .eq('org_id', orgId)
      .eq('closing_date', closingDate)
      .eq('bank_account_id', bankAccountId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Row | null) ?? null;
  }

  static async computePreview(
    orgId: string,
    closingDate: string,
    bankAccountId: string
  ): Promise<{
    opening_balance: number;
    total_income: number;
    total_expenses: number;
    system_balance: number;
  }> {
    const prev = prevDayYmd(closingDate);
    const icScope = { includeIntercompany: true } as const;
    const [opening, metrics, systemEnd] = await Promise.all([
      CashFlowService.netBalanceForBankAccountThrough(orgId, bankAccountId, prev, icScope),
      CashFlowService.sumPeriodMetricsForBankAccount(
        orgId,
        bankAccountId,
        closingDate,
        closingDate,
        icScope
      ),
      CashFlowService.netBalanceForBankAccountThrough(orgId, bankAccountId, closingDate, icScope),
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
      bank_account_id: string;
      closing_date: string;
      physical_cash: number;
      bank_balance: number;
      notes: string | null;
    }
  ): Promise<{ data: Row | null; error: Error | null }> {
    const preview = await this.computePreview(orgId, input.closing_date, input.bank_account_id);
    const total_verified = input.physical_cash + input.bank_balance;
    const expected = preview.system_balance;
    const difference_amount = total_verified - expected;
    const status = Math.abs(difference_amount) < 0.02 ? 'closed' : 'divergent';

    const payload: Database['public']['Tables']['cash_closings']['Insert'] = {
      org_id: orgId,
      bank_account_id: input.bank_account_id,
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

    const existing = await this.getByDateAndAccount(orgId, input.closing_date, input.bank_account_id);
    let result: { data: Row | null; error: Error | null };
    if (existing) {
      const { data, error } = await supabase
        .from('cash_closings')
        .update(payload)
        .eq('id', existing.id)
        .eq('org_id', orgId)
        .select()
        .single();
      result = { data: data as Row | null, error: error ? new Error(error.message) : null };
    } else {
      const { data, error } = await supabase.from('cash_closings').insert(payload).select().single();
      result = { data: data as Row | null, error: error ? new Error(error.message) : null };
    }

    if (!result.error && result.data) {
      await CashRegisterSessionService.closeOpenSessionsForBankOnDate(
        orgId,
        input.bank_account_id,
        input.closing_date
      );
    }

    return result;
  }
}
