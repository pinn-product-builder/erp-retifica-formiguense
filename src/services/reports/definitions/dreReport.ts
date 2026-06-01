import { supabase } from '@/integrations/supabase/client';
import type {
  ReportDefinition,
  ReportExecuteParams,
  ReportExecuteResult,
  ReportRow,
} from '../types';
import { ReportEngine } from '../reportEngine';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const dreReportDefinition: ReportDefinition = {
  id: 'dre-monthly',
  name: 'DRE Mensal',
  description: 'Demonstrativo de Resultado por mês: receita, deduções, custos, despesas, margem.',
  category: 'dre',
  fields: [
    { key: 'period_label', label: 'Período', type: 'text', defaultVisible: true, groupable: true, width: 18 },
    { key: 'org_name', label: 'Empresa', type: 'text', defaultVisible: true, groupable: true, width: 28 },
    { key: 'total_revenue', label: 'Receita bruta', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 16 },
    { key: 'deductions', label: 'Deduções', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 14 },
    { key: 'net_revenue', label: 'Receita líquida', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 16 },
    { key: 'direct_costs', label: 'Custos diretos', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 16 },
    { key: 'gross_profit', label: 'Lucro bruto', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 16 },
    { key: 'operational_expenses', label: 'Despesas operacionais', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 18 },
    { key: 'commercial_expenses', label: 'Despesas comerciais', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 18 },
    { key: 'admin_expenses', label: 'Despesas administrativas', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 18 },
    { key: 'financial_expenses', label: 'Despesas financeiras', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 18 },
    { key: 'taxes', label: 'Impostos', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 14 },
    { key: 'partners_withdrawals', label: 'Pró-labore', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 14 },
    { key: 'operational_result', label: 'Resultado operacional', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 18 },
    { key: 'net_profit', label: 'Lucro líquido', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 16 },
    { key: 'profit_margin', label: 'Margem líquida', type: 'percent', defaultVisible: true, aggregatable: 'avg', width: 14 },
  ],
  filters: [
    { key: 'org_scope', label: 'Empresa(s)', type: 'org-scope' },
    {
      key: 'year',
      label: 'Ano',
      type: 'select',
      required: true,
      options: (() => {
        const cy = new Date().getFullYear();
        return [cy + 1, cy, cy - 1, cy - 2, cy - 3].map((y) => ({
          value: String(y),
          label: String(y),
        }));
      })(),
      defaultValue: String(new Date().getFullYear()),
    },
    {
      key: 'month_range',
      label: 'Faixa de meses',
      type: 'select',
      options: [
        { value: '1-12', label: 'Ano completo' },
        { value: '1-3', label: '1º Trimestre' },
        { value: '4-6', label: '2º Trimestre' },
        { value: '7-9', label: '3º Trimestre' },
        { value: '10-12', label: '4º Trimestre' },
        { value: '1-6', label: '1º Semestre' },
        { value: '7-12', label: '2º Semestre' },
      ],
      defaultValue: '1-12',
    },
  ],
  groupings: [
    { key: 'org_name', label: 'Por empresa', extract: (r) => String(r.org_name ?? 'Sem empresa') },
    { key: 'quarter', label: 'Por trimestre', extract: (r) => String(r.quarter ?? '') },
  ],
  defaultOrderBy: { field: 'period_sort', direction: 'asc' },
  async execute(params: ReportExecuteParams): Promise<ReportExecuteResult> {
    const { orgScope, filters } = params;
    const orgIds = orgScope.orgIds;
    if (orgIds.length === 0) throw new Error('Selecione ao menos uma empresa.');

    const year = Number(filters.year);
    if (!year) throw new Error('Selecione o ano.');
    const monthRange = (filters.month_range as string) ?? '1-12';
    const [mStart, mEnd] = monthRange.split('-').map(Number);

    const { data, error } = await supabase
      .from('monthly_dre')
      .select(
        `month, year, total_revenue, deductions, net_revenue, direct_costs, gross_profit,
         operational_expenses, commercial_expenses, admin_expenses, financial_expenses,
         taxes, partners_withdrawals, operational_result, net_profit, profit_margin,
         org_id, organizations!inner(name)`
      )
      .in('org_id', orgIds)
      .eq('year', year)
      .gte('month', mStart)
      .lte('month', mEnd);

    if (error) throw new Error(error.message);

    const rows: ReportRow[] = (data ?? []).map((r) => {
      const q = Math.ceil(r.month / 3);
      return {
        period_label: `${MONTHS[r.month - 1]}/${r.year}`,
        period_sort: r.year * 100 + r.month,
        org_name: (r.organizations as { name?: string } | null)?.name ?? '',
        quarter: `${q}º Trim/${r.year}`,
        total_revenue: r.total_revenue,
        deductions: r.deductions,
        net_revenue: r.net_revenue,
        direct_costs: r.direct_costs,
        gross_profit: r.gross_profit,
        operational_expenses: r.operational_expenses,
        commercial_expenses: r.commercial_expenses,
        admin_expenses: r.admin_expenses,
        financial_expenses: r.financial_expenses,
        taxes: r.taxes,
        partners_withdrawals: r.partners_withdrawals,
        operational_result: r.operational_result,
        net_profit: r.net_profit,
        profit_margin: r.profit_margin !== null ? Number(r.profit_margin) / 100 : null,
      };
    });

    const orderBy = params.orderBy ?? this.defaultOrderBy;
    const sorted = orderBy ? ReportEngine.sortRows(rows, orderBy) : rows;

    const totals = ReportEngine.aggregate(sorted, this.fields);

    let groups;
    if (params.groupBy && params.groupBy.length > 0) {
      const groupDef = this.groupings?.find((g) => g.key === params.groupBy?.[0]);
      if (groupDef) groups = ReportEngine.groupRows(sorted, groupDef.extract, this.fields);
    }

    return {
      rows: sorted,
      groups,
      totals,
      totalRows: sorted.length,
      meta: { generatedAt: new Date(), filters: params.filters, selectedFields: params.selectedFields },
    };
  },
};
