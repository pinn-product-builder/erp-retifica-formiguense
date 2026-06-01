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
  { value: 'renegotiated', label: 'Renegociado' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const arReportDefinition: ReportDefinition = {
  id: 'ar-list',
  name: 'Contas a Receber',
  description: 'Lista detalhada de títulos a receber com pagamentos, status, vencimento e negociações.',
  category: 'ar',
  fields: [
    { key: 'customer_name', label: 'Cliente', type: 'text', defaultVisible: true, groupable: true, width: 32 },
    { key: 'invoice_number', label: 'Nº NF/Doc', type: 'text', defaultVisible: true, width: 14 },
    { key: 'description', label: 'Descrição', type: 'text', defaultVisible: false, width: 30 },
    { key: 'amount', label: 'Valor original', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 16 },
    { key: 'late_fee', label: 'Juros/Multa', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 14 },
    { key: 'discount', label: 'Desconto', type: 'currency', defaultVisible: false, aggregatable: 'sum', width: 14 },
    { key: 'total_received', label: 'Pago', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 14 },
    { key: 'remaining_amount', label: 'Pendente', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 14 },
    { key: 'due_date', label: 'Vencimento', type: 'date', defaultVisible: true, groupable: true, width: 14 },
    { key: 'payment_date', label: 'Data pagamento', type: 'date', defaultVisible: false, width: 14 },
    { key: 'days_overdue', label: 'Dias em atraso', type: 'number', defaultVisible: false, width: 12 },
    { key: 'status_label', label: 'Status', type: 'text', defaultVisible: true, groupable: true, width: 14 },
    { key: 'payment_method', label: 'Forma pagamento', type: 'text', defaultVisible: false, width: 16 },
    { key: 'installment_label', label: 'Parcela', type: 'text', defaultVisible: false, width: 10 },
    { key: 'in_negotiation', label: 'Em negociação', type: 'boolean', defaultVisible: false, width: 14 },
    { key: 'negotiation_promised_date', label: 'Promessa', type: 'date', defaultVisible: false, width: 14 },
    { key: 'org_name', label: 'Empresa', type: 'text', defaultVisible: false, groupable: true, width: 24 },
  ],
  filters: [
    {
      key: 'org_scope',
      label: 'Empresa(s)',
      type: 'org-scope',
      description: 'Empresa única ou consolidação de múltiplas.',
    },
    { key: 'date_range', label: 'Período (vencimento)', type: 'date-range', required: true },
    { key: 'statuses', label: 'Status', type: 'multi-select', options: STATUS_OPTIONS },
    { key: 'customer_id', label: 'Cliente', type: 'customer' },
    { key: 'only_overdue', label: 'Apenas vencidos', type: 'select', options: [
      { value: 'false', label: 'Todos' },
      { value: 'true', label: 'Sim' },
    ] },
  ],
  groupings: [
    { key: 'customer_name', label: 'Por cliente', extract: (r) => String(r.customer_name ?? 'Sem cliente') },
    { key: 'status_label', label: 'Por status', extract: (r) => String(r.status_label ?? 'Sem status') },
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
    if (orgIds.length === 0) {
      throw new Error('Selecione ao menos uma empresa.');
    }

    const dateRange = filters.date_range as { from?: string; to?: string } | undefined;
    const statuses = (filters.statuses as string[] | undefined) ?? [];
    const customerId = filters.customer_id as string | undefined;
    const onlyOverdue = filters.only_overdue === 'true';

    let q = supabase
      .from('accounts_receivable')
      .select(
        `id, amount, late_fee, discount, due_date, payment_date, status, payment_method,
         invoice_number, installment_number, total_installments, customer_id, org_id,
         negotiation_promised_date, negotiation_paused_at, negotiation_resolved_at,
         customers!inner(name), organizations!inner(name)`
      )
      .in('org_id', orgIds);

    if (dateRange?.from) q = q.gte('due_date', dateRange.from);
    if (dateRange?.to) q = q.lte('due_date', dateRange.to);
    if (statuses.length > 0) q = q.in('status', statuses);
    if (customerId) q = q.eq('customer_id', customerId);
    if (onlyOverdue) q = q.in('status', ['overdue', 'pending', 'renegotiated']).lt('due_date', new Date().toISOString().slice(0, 10));

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((r) => r.id);
    const totalsMap = new Map<string, number>();
    if (ids.length > 0) {
      const { data: receipts } = await supabase
        .from('receipt_history')
        .select('receivable_account_id, amount_received')
        .in('receivable_account_id', ids);
      for (const r of receipts ?? []) {
        const cur = totalsMap.get(r.receivable_account_id as string) ?? 0;
        totalsMap.set(r.receivable_account_id as string, cur + Number(r.amount_received));
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rows: ReportRow[] = (data ?? []).map((r) => {
      const amount = Number(r.amount);
      const lateFee = Number(r.late_fee ?? 0);
      const discount = Number(r.discount ?? 0);
      const received = totalsMap.get(r.id) ?? 0;
      const remaining = Math.max(0, Math.round((amount + lateFee - discount - received) * 100) / 100);
      const due = new Date(String(r.due_date));
      const daysOverdue = r.status !== 'paid' && due < today
        ? Math.floor((today.getTime() - due.getTime()) / 86400000)
        : 0;
      const installmentLabel =
        r.installment_number && r.total_installments
          ? `${r.installment_number}/${r.total_installments}`
          : '';
      const inNegotiation =
        Boolean(r.negotiation_paused_at) && !r.negotiation_resolved_at;
      return {
        id: r.id,
        customer_name: (r.customers as { name?: string } | null)?.name ?? '',
        org_name: (r.organizations as { name?: string } | null)?.name ?? '',
        invoice_number: r.invoice_number ?? '',
        description: '',
        amount,
        late_fee: lateFee,
        discount,
        total_received: received,
        remaining_amount: remaining,
        due_date: r.due_date,
        payment_date: r.payment_date,
        days_overdue: daysOverdue,
        status_label:
          STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? (r.status ?? ''),
        payment_method: r.payment_method ?? '',
        installment_label: installmentLabel,
        in_negotiation: inNegotiation,
        negotiation_promised_date: r.negotiation_promised_date,
      };
    });

    const orderBy = params.orderBy ?? this.defaultOrderBy;
    const sorted = orderBy ? ReportEngine.sortRows(rows, orderBy) : rows;

    const fields = this.fields;
    const totals = ReportEngine.aggregate(sorted, fields);

    let groups;
    if (params.groupBy && params.groupBy.length > 0) {
      const groupKey = params.groupBy[0];
      const groupDef = this.groupings?.find((g) => g.key === groupKey);
      if (groupDef) {
        groups = ReportEngine.groupRows(sorted, groupDef.extract, fields);
      }
    }

    return {
      rows: sorted,
      groups,
      totals,
      totalRows: sorted.length,
      meta: {
        generatedAt: new Date(),
        filters: params.filters,
        selectedFields: params.selectedFields,
      },
    };
  },
};
