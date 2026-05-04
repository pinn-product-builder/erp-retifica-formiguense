import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CashFlowService } from '@/services/financial/cashFlowService';

type SessionRow = Database['public']['Tables']['cash_register_sessions']['Row'];

export type CashRegisterOpenSessionEnriched = SessionRow & {
  bank_accounts: { id: string; name: string } | null;
  operator_name: string | null;
};

export class CashRegisterSessionService {
  /**
   * Sessões de caixa ainda abertas na organização (vários operadores podem ter caixa aberto ao mesmo tempo).
   * Útil no consolidado gerencial para ver quem ainda não fechou o dia.
   */
  static async listOpenSessionsForOrgEnriched(orgId: string): Promise<CashRegisterOpenSessionEnriched[]> {
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .select('*, bank_accounts (id, name)')
      .eq('org_id', orgId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as (SessionRow & { bank_accounts: { id: string; name: string } | null })[];
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    if (userIds.length === 0) return [];
    const { data: infos, error: infoErr } = await supabase
      .from('user_basic_info')
      .select('user_id, name, email')
      .in('user_id', userIds);
    if (infoErr) throw new Error(infoErr.message);
    const map = new Map(
      (infos ?? []).map((r) => [
        r.user_id as string,
        (r.name?.trim() || r.email || '').trim() || null,
      ])
    );
    return rows.map((r) => ({
      ...r,
      operator_name: map.get(r.user_id) ?? null,
    }));
  }

  static async getOpenForUser(orgId: string, userId: string): Promise<SessionRow | null> {
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as SessionRow | null) ?? null;
  }

  static async openSession(params: {
    orgId: string;
    userId: string;
    bankAccountId: string;
    businessDate: string;
    openingBalance: number;
    notes: string | null;
  }): Promise<{ data: SessionRow | null; error: Error | null }> {
    const existing = await this.getOpenForUser(params.orgId, params.userId);
    if (existing) {
      return { data: null, error: new Error('Já existe um caixa aberto para este usuário.') };
    }
    const row: Database['public']['Tables']['cash_register_sessions']['Insert'] = {
      org_id: params.orgId,
      user_id: params.userId,
      bank_account_id: params.bankAccountId,
      business_date: params.businessDate,
      status: 'open',
      opening_balance: params.openingBalance,
      notes: params.notes,
    };
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .insert(row)
      .select()
      .single();
    if (error) return { data: null, error: new Error(error.message) };
    if (params.openingBalance > 0) {
      const { error: cfErr } = await CashFlowService.create(params.orgId, {
        transaction_type: 'income',
        amount: params.openingBalance,
        description: 'Saldo de abertura de caixa',
        transaction_date: params.businessDate,
        bank_account_id: params.bankAccountId,
        reconciled: true,
      });
      if (cfErr) {
        return { data: data as SessionRow, error: cfErr };
      }
    }
    return { data: data as SessionRow, error: null };
  }

  /** Após fechamento contábil do dia, encerra sessões abertas dessa conta/data. */
  static async closeOpenSessionsForBankOnDate(
    orgId: string,
    bankAccountId: string,
    businessDate: string
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('cash_register_sessions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('bank_account_id', bankAccountId)
      .eq('business_date', businessDate)
      .eq('status', 'open');
    return { error: error ? new Error(error.message) : null };
  }
}
