import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BrRow = Database['public']['Tables']['bank_reconciliations']['Row'];
type BslRow = Database['public']['Tables']['bank_statement_lines']['Row'];

export class BankReconciliationService {
  static async getById(orgId: string, id: string): Promise<BrRow | null> {
    const { data, error } = await supabase
      .from('bank_reconciliations')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as BrRow) ?? null;
  }

  static async list(orgId: string): Promise<BrRow[]> {
    const { data, error } = await supabase
      .from('bank_reconciliations')
      .select('*')
      .eq('org_id', orgId)
      .order('statement_end_date', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as BrRow[]) ?? [];
  }

  static async create(
    row: Database['public']['Tables']['bank_reconciliations']['Insert']
  ): Promise<{ data: BrRow | null; error: Error | null }> {
    const { data, error } = await supabase.from('bank_reconciliations').insert(row).select().single();
    return { data: data as BrRow | null, error: error ? new Error(error.message) : null };
  }

  static async addStatementLines(
    lines: Database['public']['Tables']['bank_statement_lines']['Insert'][]
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.from('bank_statement_lines').insert(lines);
    return { error: error ? new Error(error.message) : null };
  }

  static async matchLineToCashFlow(
    lineId: string,
    cashFlowId: string
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('bank_statement_lines')
      .update({ matched_cash_flow_id: cashFlowId })
      .eq('id', lineId);
    return { error: error ? new Error(error.message) : null };
  }

  static async listLines(importId: string): Promise<BslRow[]> {
    const { data, error } = await supabase
      .from('bank_statement_lines')
      .select('*')
      .eq('import_id', importId)
      .order('transaction_date', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as BslRow[]) ?? [];
  }
}
