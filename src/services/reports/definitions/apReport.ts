import { supabase } from '@/integrations/supabase/client';
import type {
  ReportDefinition,
  ReportExecuteParams,
  ReportExecuteResult,
  ReportRow,
} from '../types';
import { ReportEngine } from '../reportEngine';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const apReportDefinition: ReportDefinition = {
  id: 'ap-list',
  name: 'Contas a Pagar',
  description: 'Lista de títulos a pagar com fornecedor, vencimento, status, previsão vs realizado.',
  category: 'ap',
  fields: [
    { key: 'supplier_name', label: 'Fornecedor', type: 'text', defaultVisible: true, groupable: true, width: 32 },
    { key: 'invoice_number', label: 'Nº NF', type: 'text', defaultVisible: true, width: 14 },
    { key: 'description', label: 'Descrição', type: 'text', defaultVisible: true, width: 30 },
    { key: 'amount', label: 'Valor', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 16 },
    { key: 'forecast_original_amount', label: 'Previsto original', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 16 },
    { key: 'variance', label: 'Variância', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 14 },
    { key: 'due_date', label: 'Vencimento', type: 'date', defaultVisible: true, groupable: true, width: 14 },
    { key: 'payment_date', label: 'Data pagamento', type: 'date', defaultVisible: false, width: 14 },
    { key: 'days_overdue', label: 'Dias em atraso', type: 'number', defaultVisible: false, width: 12 },
    { key: 'status_label', label: 'Status', type: 'text', defaultVisible: true, groupable: true, width: 14 },
    { key: 'payment_method', label: 'Forma pagamento', type: 'text', defaultVisible: false, width: 16 },
    { key: 'is_forecast', label: 'Previsão recorrente', type: 'boolean', defaultVisible: false, width: 16 },
    { key: 'category_name', label: 'Categoria', type: 'text', defaultVisible: false, groupable: true, width: 20 },
    { key: 'cost_center_name', label: 'Centro de custo', type: 'text', defaultVisible: false, groupable: true, width: 20 },
    { key: 'org_name', label: 'Empresa', type: 'text', defaultVisible: false, groupable: true, width: 24 },
  ],
  filters: [
    { key: 'org_scope', label: 'Empresa(s)', type: 'org-scope' },
    { key: 'date_range', label: 'Período (vencimento)', type: 'date-range', required: true },
    { key: 'statuses', label: 'Status', type: 'multi-select', options: STATUS_OPTIONS },
    { key: 'supplier_id', label: 'Fornecedor', type: 'supplier' },
    { key: 'cost_center_id', label: 'Centro de custo', type: 'cost-center' },
    { key: 'is_forecast', label: 'Tipo', type: 'select', options: [
      { value: '', label: 'Todos' },
      { value: 'true', label: 'Apenas previsões' },
      { value: 'false', label: 'Apenas realizados' },
    ] },
  ],
  groupings: [
    { key: 'supplier_name', label: 'Por fornecedor', extract: (r) => String(r.supplier_name ?? 'Sem fornecedor') },
    { key: 'status_label', label: 'Por status', extract: (r) => String(r.status_label ?? 'Sem status') },
    { key: 'category_name', label: 'Por categoria', extract: (r) => String(r.category_name ?? 'Sem categoria') },
    { key: 'cost_center_name', label: 'Por centro de custo', extract: (r) => String(r.cost_center_name ?? 'Sem CC') },
    { key: 'org_name', label: 'Por empresa', extract: (r) => String(r.org_name ?? 'Sem empresa') },
    {
      key: 'due_month',
      label: 'Por mês de vencimento',
      extract: (r) => {
        const d = r.due_date instanceof Date ? r.due_date : new Date(String(r.due_date));
        return isNaN(d.getTime()) ? 'Sem vencimento' : d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
      },
    },
  ],
  defaultOrderBy: { field: 'due_date', direction: 'asc' },
  async execute(params: ReportExecuteParams): Promise<ReportExecuteResult> {
    const { orgScope, filters } = params;
    const orgIds = orgScope.orgIds;
    if (orgIds.length === 0) throw new Error('Selecione ao menos uma empresa.');

    const dateRange = filters.date_range as { from?: string; to?: string } | undefined;
    const statuses = (filters.statuses as string[] | undefined) ?? [];
    const supplierId = filters.supplier_id as string | undefined;
    const costCenterId = filters.cost_center_id as string | undefined;
    const isForecast = filters.is_forecast as string | undefined;

    let q = supabase
      .from('accounts_payable')
      .select(
        `id, amount, forecast_original_amount, due_date, payment_date, status, payment_method,
         invoice_number, description, supplier_id, supplier_name, org_id, is_forecast,
         cost_center_id, expense_category_id,
         expense_categories(name), cost_centers(name), organizations!inner(name)`
      )
      .in('org_id', orgIds);

    if (dateRange?.from) q = q.gte('due_date', dateRange.from);
    if (dateRange?.to) q = q.lte('due_date', dateRange.to);
    if (statuses.length > 0) q = q.in('status', statuses);
    if (supplierId) q = q.eq('supplier_id', supplierId);
    if (costCenterId) q = q.eq('cost_center_id', costCenterId);
    if (isForecast === 'true') q = q.eq('is_forecast', true);
    else if (isForecast === 'false') q = q.eq('is_forecast', false);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows: ReportRow[] = (data ?? []).map((r) => {
      const amount = Number(r.amount);
      const forecastOriginal = r.forecast_original_amount !== null ? Number(r.forecast_original_amount) : 0;
      const variance = forecastOriginal ? amount - forecastOriginal : 0;
      const due = new Date(String(r.due_date));
      const daysOverdue = r.status !== 'paid' && due < today
        ? Math.floor((today.getTime() - due.getTime()) / 86400000)
        : 0;
      return {
        id: r.id,
        supplier_name: r.supplier_name ?? '',
        org_name: (r.organizations as { name?: string } | null)?.name ?? '',
        invoice_number: r.invoice_number ?? '',
        description: r.description ?? '',
        amount,
        forecast_original_amount: forecastOriginal || null,
        variance,
        due_date: r.due_date,
        payment_date: r.payment_date,
        days_overdue: daysOverdue,
        status_label: STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? (r.status ?? ''),
        payment_method: r.payment_method ?? '',
        is_forecast: r.is_forecast,
        category_name: (r.expense_categories as { name?: string } | null)?.name ?? '',
        cost_center_name: (r.cost_centers as { name?: string } | null)?.name ?? '',
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
