import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { paymentMethodMatchesContext, type PaymentMethodContext } from '@/lib/paymentMethodApplies';

type PmRow = Database['public']['Tables']['payment_methods']['Row'];
type EcRow = Database['public']['Tables']['expense_categories']['Row'];
type BaRow = Database['public']['Tables']['bank_accounts']['Row'];

export class FinancialConfigService {
  static async listPaymentMethods(orgId: string): Promise<PmRow[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .or(`org_id.eq.${orgId},org_id.is.null`)
      .eq('is_active', true)
      .order('name');
    if (error) throw new Error(error.message);
    return (data as PmRow[]) ?? [];
  }

  static async listPaymentMethodsForContext(
    orgId: string,
    ctx: PaymentMethodContext
  ): Promise<PmRow[]> {
    const rows = await this.listPaymentMethods(orgId);
    return rows.filter((r) => paymentMethodMatchesContext(r.applies_to, ctx));
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

  static async updateExpenseCategory(
    id: string,
    orgId: string,
    patch: Database['public']['Tables']['expense_categories']['Update']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('expense_categories')
      .update(patch)
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }

  static async ensureDefaultExpenseCategories(orgId: string): Promise<void> {
    const { count, error: cErr } = await supabase
      .from('expense_categories')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId);
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) return;

    const seeds: Database['public']['Tables']['expense_categories']['Insert'][] = [
      { org_id: orgId, name: 'Materiais e insumos', category: 'variable', is_active: true },
      { org_id: orgId, name: 'Folha e encargos', category: 'salary', is_active: true },
      { org_id: orgId, name: 'Impostos e taxas', category: 'tax', is_active: true },
      { org_id: orgId, name: 'Fornecedores e serviços', category: 'supplier', is_active: true },
      { org_id: orgId, name: 'Despesas administrativas', category: 'fixed', is_active: true },
    ];
    const { error } = await supabase.from('expense_categories').insert(seeds);
    if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
      throw new Error(error.message);
    }
  }

  static async updatePaymentMethod(
    id: string,
    orgId: string,
    patch: Database['public']['Tables']['payment_methods']['Update']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('payment_methods')
      .update(patch)
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }

  static async listBankAccounts(orgId: string, activeOnly = true): Promise<BaRow[]> {
    let q = supabase.from('bank_accounts').select('*').eq('org_id', orgId).order('bank_name');
    if (activeOnly) q = q.eq('is_active', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as BaRow[]) ?? [];
  }

  static async createBankAccount(
    row: Database['public']['Tables']['bank_accounts']['Insert']
  ): Promise<{ data: BaRow | null; error: Error | null }> {
    const payload = {
      ...row,
      kind: row.kind ?? 'bank',
      bank_name:
        row.kind === 'cash'
          ? row.bank_name ?? ''
          : row.bank_name && row.bank_name.length > 0
            ? row.bank_name
            : 'Banco',
    };
    const { data, error } = await supabase.from('bank_accounts').insert(payload).select().single();
    return { data: (data as BaRow | null) ?? null, error: error ? new Error(error.message) : null };
  }

  static async updateBankAccount(
    id: string,
    orgId: string,
    patch: Database['public']['Tables']['bank_accounts']['Update']
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('bank_accounts')
      .update(patch)
      .eq('id', id)
      .eq('org_id', orgId);
    return { error: error ? new Error(error.message) : null };
  }
}
