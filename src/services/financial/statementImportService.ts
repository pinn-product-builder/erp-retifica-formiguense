import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { parseBankStatementFile } from '@/services/financial/bankStatementParsers';
import { BankReconciliationService } from '@/services/financial/bankReconciliationService';

type ImportRow = Database['public']['Tables']['bank_statement_imports']['Row'];

export class StatementImportService {
  static async listByOrg(orgId: string): Promise<ImportRow[]> {
    const { data, error } = await supabase
      .from('bank_statement_imports')
      .select('*')
      .eq('org_id', orgId)
      .order('imported_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ImportRow[]) ?? [];
  }

  static async importFromText(params: {
    orgId: string;
    bankAccountId: string;
    fileName: string;
    text: string;
    userId: string | null;
  }): Promise<{ importId: string; lineCount: number; error: Error | null }> {
    try {
      const { format, lines } = parseBankStatementFile(params.fileName, params.text);
      if (lines.length === 0) {
        return { importId: '', lineCount: 0, error: new Error('Nenhuma linha para importar') };
      }

      const { data: existing } = await supabase
        .from('bank_statement_imports')
        .select('id')
        .eq('org_id', params.orgId)
        .eq('bank_account_id', params.bankAccountId)
        .eq('file_name', params.fileName)
        .limit(1);

      if (existing && existing.length > 0) {
        return {
          importId: '',
          lineCount: 0,
          error: new Error('Importação com o mesmo nome de arquivo já existe para esta conta'),
        };
      }

      const { data: imp, error: iErr } = await supabase
        .from('bank_statement_imports')
        .insert({
          org_id: params.orgId,
          bank_account_id: params.bankAccountId,
          file_name: params.fileName,
          file_format: format,
          created_by: params.userId,
        })
        .select()
        .single();

      if (iErr || !imp) {
        return { importId: '', lineCount: 0, error: new Error(iErr?.message ?? 'Falha ao registrar importação') };
      }

      const importId = imp.id as string;
      const inserts: Database['public']['Tables']['bank_statement_lines']['Insert'][] = lines.map(
        (l) => ({
          import_id: importId,
          transaction_date: l.transaction_date,
          amount: l.amount,
          description: l.description,
          balance_after: l.balance_after,
        })
      );

      const { error: lErr } = await BankReconciliationService.addStatementLines(inserts);
      if (lErr) {
        return { importId, lineCount: 0, error: lErr };
      }

      return { importId, lineCount: lines.length, error: null };
    } catch (e) {
      return {
        importId: '',
        lineCount: 0,
        error: e instanceof Error ? e : new Error('Falha ao processar arquivo'),
      };
    }
  }
}
