import { supabase } from '@/integrations/supabase/client';
import { BankReconciliationService } from '@/services/financial/bankReconciliationService';
import { CashFlowService } from '@/services/financial/cashFlowService';

export class ReconciliationReportService {
  static async buildFormalSnapshot(params: {
    orgId: string;
    reconciliationId: string;
    importId?: string | null;
  }): Promise<Record<string, unknown>> {
    const br = await BankReconciliationService.getById(params.orgId, params.reconciliationId);
    if (!br) throw new Error('Conciliação não encontrada');
    const end = String(br.statement_end_date);
    const bankBal = Number(br.statement_balance);
    const bankScope = { includeIntercompany: true } as const;
    const erpNet = await CashFlowService.netBalanceForBankAccountThrough(
      params.orgId,
      br.bank_account_id,
      end,
      bankScope
    );
    const pendingErp = await CashFlowService.countUnreconciledForBankAccountThrough(
      params.orgId,
      br.bank_account_id,
      end,
      bankScope
    );
    let importLinesTotal = 0;
    let importLinesMatched = 0;
    let importLinesPending = 0;
    if (params.importId) {
      const lines = await BankReconciliationService.listLines(params.importId);
      importLinesTotal = lines.length;
      for (const ln of lines) {
        if (ln.matched_cash_flow_id) importLinesMatched += 1;
        else importLinesPending += 1;
      }
    }
    const difference = erpNet - bankBal;
    return {
      generatedAt: new Date().toISOString(),
      reconciliationId: br.id,
      bankAccountId: br.bank_account_id,
      periodEnd: end,
      status: br.status,
      erpNetBalanceThrough: erpNet,
      bankStatementBalance: bankBal,
      difference,
      pendingErpCashFlowCount: pendingErp,
      importId: params.importId ?? null,
      importLinesTotal,
      importLinesMatched,
      importLinesPending,
    };
  }

  static async createSnapshot(
    orgId: string,
    reconciliationId: string,
    userId: string | null,
    snapshot: Record<string, unknown>
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('bank_reconciliation_reports')
      .insert({
        org_id: orgId,
        reconciliation_id: reconciliationId,
        snapshot,
        generated_by: userId,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return (data as { id: string })?.id ?? null;
  }

  static downloadSnapshot(snapshot: Record<string, unknown>): void {
    const text = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conciliacao-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static openPrintableReport(snapshot: Record<string, unknown>): void {
    const esc = (v: unknown) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n)
        ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : '—';
    };
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Conciliação bancária</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;max-width:720px;margin:0 auto;color:#111}
h1{font-size:1.25rem}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ccc;padding:8px;text-align:left}
td.num{text-align:right;font-variant-numeric:tabular-nums}.muted{color:#555;font-size:0.875rem}</style></head><body>
<h1>Relatório de conciliação bancária</h1>
<p class="muted">Gerado em ${esc(snapshot.generatedAt)} · Fim de período (extrato): ${esc(snapshot.periodEnd)} · Status: ${esc(snapshot.status)}</p>
<table>
<tr><th>Saldo ERP (fluxo de caixa até a data)</th><td class="num">${num(snapshot.erpNetBalanceThrough)}</td></tr>
<tr><th>Saldo informado (extrato)</th><td class="num">${num(snapshot.bankStatementBalance)}</td></tr>
<tr><th>Diferença (ERP − extrato)</th><td class="num">${num(snapshot.difference)}</td></tr>
<tr><th>Lançamentos ERP não conciliados (até a data)</th><td class="num">${esc(snapshot.pendingErpCashFlowCount)}</td></tr>
${
  snapshot.importLinesTotal
    ? `<tr><th>Linhas do extrato (importação)</th><td>${esc(snapshot.importLinesTotal)} total · ${esc(snapshot.importLinesMatched)} vinculadas · ${esc(snapshot.importLinesPending)} pendentes</td></tr>`
    : ''
}
</table>
<p><button type="button" onclick="window.print()" style="padding:8px 16px;font-size:1rem;cursor:pointer">Imprimir / salvar como PDF</button></p>
<p class="muted">No diálogo de impressão, escolha &quot;Salvar como PDF&quot; como destino.</p>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }
}
