import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PmRow = Database['public']['Tables']['payment_methods']['Row'];
type EcRow = Database['public']['Tables']['expense_categories']['Row'];
type BaRow = Database['public']['Tables']['bank_accounts']['Row'];

export class FinancialConfigService {
  static async listPaymentMethods(): Promise<PmRow[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw new Error(error.message);
    return (data as PmRow[]) ?? [];
  }

  static async createPaymentMethod(
    row: Database['public']['Tables']['payment_methods']['Insert']
  ): Promise<{ data: PmRow | null; error: Error | null }> {
    const { data, error } = await supabase.from('payment_methods').insert(row).select().single();
    return {
      data: (data as PmRow | null) ?? null,
      error: error ? new Error(error.message) : null,
    };
  }

  static async upsertPaymentMethod(
    row: Database['public']['Tables']['payment_methods']['Insert']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('payment_methods').upsert(row, { onConflict: 'id' });
    return { error: error ? new Error(error.message) : null };
  }

  static async listExpenseCategories(orgId: string): Promise<EcRow[]> {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .or(`org_id.eq.${orgId},org_id.is.null`)
      .eq('is_active', true)
      .order('name');
    if (error) throw new Error(error.message);
    return (data as EcRow[]) ?? [];
  }

  static async createExpenseCategory(
    row: Database['public']['Tables']['expense_categories']['Insert']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('expense_categories').insert(row);
    return { error: error ? new Error(error.message) : null };
  }

  static async listBankAccounts(orgId: string): Promise<BaRow[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('bank_name');
    if (error) throw new Error(error.message);
    return (data as BaRow[]) ?? [];
  }
}
