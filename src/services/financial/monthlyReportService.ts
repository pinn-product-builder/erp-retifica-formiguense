import { AdvancedIndicatorsService } from '@/services/financial/advancedIndicatorsService';
import { DreCategorizedService } from '@/services/financial/dreCategorizedService';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyReportPayload {
  month: number;
  year: number;
  dreLines: string;
  indicators: string;
  topCustomers: string;
  topExpenses: string;
  recommendations: string;
}

export class MonthlyReportService {
  static async buildPayload(orgId: string, month: number, year: number): Promise<MonthlyReportPayload> {
    const dre = await DreCategorizedService.computeMonth(orgId, year, month);
    const ind = await AdvancedIndicatorsService.compute(orgId, year, month);
    const startM = `${year}-${String(month).padStart(2, '0')}-01`;
    const endM =
      month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const { data: topC } = await supabase
      .from('accounts_receivable')
      .select('amount, customers(name)')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .gte('payment_date', startM)
      .lt('payment_date', endM);
    const custMap = new Map<string, number>();
    for (const r of topC ?? []) {
      const row = r as { amount: number; customers: { name?: string } | null };
      const name = row.customers?.name ?? 'Cliente';
      custMap.set(name, (custMap.get(name) ?? 0) + Number(row.amount));
    }
    const topCustomers = [...custMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, v], i) => `${i + 1}. ${k}: ${v}`)
      .join('\n');

    const { data: topE } = await supabase
      .from('accounts_payable')
      .select('description, amount, expense_category_id')
      .eq('org_id', orgId)
      .eq('status', 'paid')
      .gte('payment_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lt(
        'payment_date',
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, '0')}-01`
      );
    const topExpenses = (topE ?? [])
      .slice(0, 10)
      .map((r, i) => `${i + 1}. ${(r as { description: string }).description}: ${(r as { amount: number }).amount}`)
      .join('\n');

    const rec: string[] = [];
    if (ind.inadimplenciaPercent > 5) rec.push('Inadimplência acima de 5%: revisar cobrança e aging.');
    if (ind.giroCaixaDias != null && ind.giroCaixaDias < 10) rec.push('Giro de caixa baixo: revisar despesas e projeção.');
    if (!rec.length) rec.push('Indicadores dentro dos parâmetros observados.');

    return {
      month,
      year,
      dreLines: JSON.stringify(dre, null, 2),
      indicators: JSON.stringify(ind, null, 2),
      topCustomers,
      topExpenses,
      recommendations: rec.join(' '),
    };
  }

  static downloadTextReport(payload: MonthlyReportPayload): void {
    const text = [
      `Relatório ${payload.month}/${payload.year}`,
      '',
      'DRE (resumo JSON):',
      payload.dreLines,
      '',
      'Indicadores:',
      payload.indicators,
      '',
      'Top recebimentos (valores agregados por cliente):',
      payload.topCustomers,
      '',
      'Top despesas:',
      payload.topExpenses,
      '',
      'Recomendações:',
      payload.recommendations,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${payload.year}-${payload.month}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
