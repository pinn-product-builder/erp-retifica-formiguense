import { supabase } from '@/integrations/supabase/client';
import type {
  ReportDefinition,
  ReportExecuteParams,
  ReportExecuteResult,
  ReportRow,
} from '../types';
import { ReportEngine } from '../reportEngine';

export const cashFlowReportDefinition: ReportDefinition = {
  id: 'cash-flow-movements',
  name: 'Fluxo de Caixa',
  description: 'Movimentações de entrada e saída no período (CR pagos + AP pagos), com saldo acumulado.',
  category: 'cashflow',
  fields: [
    { key: 'date', label: 'Data', type: 'date', defaultVisible: true, groupable: true, width: 14 },
    { key: 'kind_label', label: 'Tipo', type: 'text', defaultVisible: true, groupable: true, width: 12 },
    { key: 'description', label: 'Descrição', type: 'text', defaultVisible: true, width: 36 },
    { key: 'counterparty', label: 'Cliente/Fornecedor', type: 'text', defaultVisible: true, groupable: true, width: 30 },
    { key: 'invoice_number', label: 'Nº NF/Doc', type: 'text', defaultVisible: false, width: 14 },
    { key: 'inflow', label: 'Entrada', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 14 },
    { key: 'outflow', label: 'Saída', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 14 },
    { key: 'running_balance', label: 'Saldo acumulado', type: 'currency', defaultVisible: true, width: 16 },
    { key: 'payment_method', label: 'Forma pagamento', type: 'text', defaultVisible: false, width: 16 },
    { key: 'bank_account_name', label: 'Conta/Caixa', type: 'text', defaultVisible: false, groupable: true, width: 18 },
    { key: 'org_name', label: 'Empresa', type: 'text', defaultVisible: false, groupable: true, width: 24 },
  ],
  filters: [
    { key: 'org_scope', label: 'Empresa(s)', type: 'org-scope' },
    { key: 'date_range', label: 'Período', type: 'date-range', required: true },
    {
      key: 'kind',
      label: 'Tipo de movimentação',
      type: 'select',
      options: [
        { value: '', label: 'Todas' },
        { value: 'inflow', label: 'Apenas entradas' },
        { value: 'outflow', label: 'Apenas saídas' },
      ],
    },
  ],
  groupings: [
    { key: 'kind_label', label: 'Por tipo (entrada/saída)', extract: (r) => String(r.kind_label ?? '') },
    {
      key: 'date_day',
      label: 'Por dia',
      extract: (r) => {
        const d = r.date instanceof Date ? r.date : new Date(String(r.date));
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
      },
    },
    {
      key: 'date_month',
      label: 'Por mês',
      extract: (r) => {
        const d = r.date instanceof Date ? r.date : new Date(String(r.date));
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
      },
    },
    { key: 'counterparty', label: 'Por cliente/fornecedor', extract: (r) => String(r.counterparty ?? '') },
    { key: 'bank_account_name', label: 'Por conta/caixa', extract: (r) => String(r.bank_account_name ?? 'Não vinculado') },
    { key: 'org_name', label: 'Por empresa', extract: (r) => String(r.org_name ?? '') },
  ],
  defaultOrderBy: { field: 'date', direction: 'asc' },
  async execute(params: ReportExecuteParams): Promise<ReportExecuteResult> {
    const { orgScope, filters } = params;
    const orgIds = orgScope.orgIds;
    if (orgIds.length === 0) throw new Error('Selecione ao menos uma empresa.');

    const dateRange = filters.date_range as { from?: string; to?: string } | undefined;
    if (!dateRange?.from || !dateRange?.to) throw new Error('Período é obrigatório.');
    const kind = (filters.kind as string) ?? '';

    const inflowRows: ReportRow[] = [];
    if (kind !== 'outflow') {
      const { data: receipts, error: rErr } = await supabase
        .from('receipt_history')
        .select(
          `amount_received, payment_date, notes, receivable_account_id, bank_account_id, org_id,
           accounts_receivable!inner(invoice_number, customer_id, customers(name)),
           bank_accounts(name),
           organizations!inner(name)`
        )
        .in('org_id', orgIds)
        .gte('payment_date', dateRange.from)
        .lte('payment_date', dateRange.to);
      if (rErr) throw new Error(rErr.message);
      for (const r of receipts ?? []) {
        const ar = r.accounts_receivable as { invoice_number?: string; customers?: { name?: string } | null } | null;
        inflowRows.push({
          date: r.payment_date,
          kind_label: 'Entrada',
          description: r.notes ?? 'Recebimento CR',
          counterparty: ar?.customers?.name ?? '',
          invoice_number: ar?.invoice_number ?? '',
          inflow: Number(r.amount_received),
          outflow: 0,
          payment_method: '',
          bank_account_name: (r.bank_accounts as { name?: string } | null)?.name ?? '',
          org_name: (r.organizations as { name?: string } | null)?.name ?? '',
          running_balance: 0,
        });
      }
    }

    const outflowRows: ReportRow[] = [];
    if (kind !== 'inflow') {
      const { data: payments, error: pErr } = await supabase
        .from('accounts_payable')
        .select(
          `amount, payment_date, description, supplier_name, invoice_number, payment_method, org_id,
           organizations!inner(name)`
        )
        .in('org_id', orgIds)
        .eq('status', 'paid')
        .gte('payment_date', dateRange.from)
        .lte('payment_date', dateRange.to);
      if (pErr) throw new Error(pErr.message);
      for (const p of payments ?? []) {
        outflowRows.push({
          date: p.payment_date,
          kind_label: 'Saída',
          description: p.description ?? '',
          counterparty: p.supplier_name ?? '',
          invoice_number: p.invoice_number ?? '',
          inflow: 0,
          outflow: Number(p.amount),
          payment_method: p.payment_method ?? '',
          bank_account_name: '',
          org_name: (p.organizations as { name?: string } | null)?.name ?? '',
          running_balance: 0,
        });
      }
    }

    const all = [...inflowRows, ...outflowRows];
    const orderBy = params.orderBy ?? this.defaultOrderBy;
    const sorted = orderBy ? ReportEngine.sortRows(all, orderBy) : all;

    let balance = 0;
    for (const row of sorted) {
      balance += Number(row.inflow ?? 0) - Number(row.outflow ?? 0);
      row.running_balance = Math.round(balance * 100) / 100;
    }

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
