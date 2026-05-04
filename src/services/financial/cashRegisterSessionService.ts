import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { CashFlowService } from '@/services/financial/cashFlowService';

type SessionRow = Database['public']['Tables']['cash_register_sessions']['Row'];

export class CashRegisterSessionService {
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
