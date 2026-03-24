import { supabase } from '@/integrations/supabase/client';
import { BankReconciliationService } from '@/services/financial/bankReconciliationService';

function sameAmount(a: number, b: number, eps = 0.02): boolean {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

function daysDiff(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.abs(da - db) / (24 * 3600 * 1000);
}

export class ReconciliationMatchingService {
  static async autoMatchImport(
    orgId: string,
    importId: string,
    bankAccountId: string,
    toleranceDays = 4
  ): Promise<{ matched: number; error: Error | null }> {
    const lines = await BankReconciliationService.listLines(importId);
    const pending = lines.filter((l) => !l.matched_cash_flow_id);
    if (pending.length === 0) return { matched: 0, error: null };

    const { data: cfs, error: cErr } = await supabase
      .from('cash_flow')
      .select('id, amount, transaction_date, bank_account_id, reconciled, transaction_type')
      .eq('org_id', orgId)
      .eq('bank_account_id', bankAccountId)
      .eq('reconciled', false);

    if (cErr) return { matched: 0, error: new Error(cErr.message) };
    const pool = [...(cfs ?? [])];
    let matched = 0;

    const signedCf = (cf: { amount: number; transaction_type: string }) => {
      const a = Number(cf.amount);
      return cf.transaction_type === 'expense' ? -a : a;
    };

    for (const line of pending) {
      const idx = pool.findIndex(
        (cf) =>
          sameAmount(signedCf(cf as { amount: number; transaction_type: string }), Number(line.amount)) &&
          daysDiff(String(cf.transaction_date), String(line.transaction_date)) <= toleranceDays
      );
      if (idx === -1) continue;
      const cf = pool[idx];
      pool.splice(idx, 1);
      const { error } = await BankReconciliationService.matchLineToCashFlow(line.id, cf.id as string);
      if (!error) matched += 1;
    }

    return { matched, error: null };
  }
}
