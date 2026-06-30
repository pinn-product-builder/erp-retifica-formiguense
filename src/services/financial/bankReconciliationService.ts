import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BrRow = Database['public']['Tables']['bank_reconciliations']['Row'];
type BslRow = Database['public']['Tables']['bank_statement_lines']['Row'];
type BriRow = Database['public']['Tables']['bank_reconciliation_items']['Row'];

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

  static async updateStatus(
    orgId: string,
    id: string,
    status: string
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('bank_reconciliations')
      .update({ status })
      .eq('org_id', orgId)
      .eq('id', id);
    return { error: error ? new Error(error.message) : null };
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

  static async unmatchLine(lineId: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('bank_statement_lines')
      .update({ matched_cash_flow_id: null })
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

  static async listItems(reconciliationId: string): Promise<BriRow[]> {
    const { data, error } = await supabase
      .from('bank_reconciliation_items')
      .select('*')
      .eq('reconciliation_id', reconciliationId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as BriRow[]) ?? [];
  }

  static async confirmMatch(params: {
    reconciliationId: string;
    statementLineId: string;
    cashFlowId: string;
    matchedAmount: number;
    userId: string | null;
    chartOfAccountId?: string | null;
  }): Promise<{ error: Error | null }> {
    const {
      reconciliationId,
      statementLineId,
      cashFlowId,
      matchedAmount,
      userId,
      chartOfAccountId,
    } = params;

    const { error: iErr } = await supabase.from('bank_reconciliation_items').insert({
      reconciliation_id: reconciliationId,
      statement_line_id: statementLineId,
      cash_flow_id: cashFlowId,
      matched_amount: matchedAmount,
      status: 'matched',
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
    });
    if (iErr) return { error: new Error(iErr.message) };

    const { error: lErr } = await this.matchLineToCashFlow(statementLineId, cashFlowId);
    if (lErr) return { error: lErr };

    const cfPatch: { reconciled: boolean; chart_of_account_id?: string | null } = {
      reconciled: true,
    };
    if (chartOfAccountId !== undefined) cfPatch.chart_of_account_id = chartOfAccountId;
    const { error: cErr } = await supabase.from('cash_flow').update(cfPatch).eq('id', cashFlowId);
    return { error: cErr ? new Error(cErr.message) : null };
  }

  /**
   * Concilia N linhas de extrato com 1 único cash_flow (ex: 2 pagamentos cobrem 1 título).
   * Task ClickUp 86agymxzt.
   */
  static async confirmGroupedMatch(params: {
    reconciliationId: string;
    statementLineIds: string[];
    cashFlowId: string;
    matchedAmounts: number[];
    userId: string | null;
  }): Promise<{ error: Error | null }> {
    const { reconciliationId, statementLineIds, cashFlowId, matchedAmounts, userId } = params;
    if (statementLineIds.length === 0) {
      return { error: new Error('Selecione ao menos uma linha de extrato') };
    }
    if (statementLineIds.length !== matchedAmounts.length) {
      return { error: new Error('Quantidade de linhas e valores inconsistente') };
    }

    const items = statementLineIds.map((slId, idx) => ({
      reconciliation_id: reconciliationId,
      statement_line_id: slId,
      cash_flow_id: cashFlowId,
      matched_amount: matchedAmounts[idx],
      status: 'matched' as const,
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
    }));

    const { error: iErr } = await supabase.from('bank_reconciliation_items').insert(items);
    if (iErr) return { error: new Error(iErr.message) };

    for (const slId of statementLineIds) {
      const { error: lErr } = await this.matchLineToCashFlow(slId, cashFlowId);
      if (lErr) return { error: lErr };
    }

    const { error: cErr } = await supabase
      .from('cash_flow')
      .update({ reconciled: true })
      .eq('id', cashFlowId);
    return { error: cErr ? new Error(cErr.message) : null };
  }

  static async markAdjusted(params: {
    reconciliationId: string;
    statementLineId: string;
    matchedAmount: number;
    reason: string;
    userId: string | null;
  }): Promise<{ error: Error | null }> {
    const { reconciliationId, statementLineId, matchedAmount, reason, userId } = params;
    const { error } = await supabase.from('bank_reconciliation_items').insert({
      reconciliation_id: reconciliationId,
      statement_line_id: statementLineId,
      matched_amount: matchedAmount,
      status: 'adjusted',
      adjustment_reason: reason,
      confirmed_by: userId,
      confirmed_at: new Date().toISOString(),
    });
    return { error: error ? new Error(error.message) : null };
  }
}
