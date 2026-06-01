import { supabase } from '@/integrations/supabase/client';
import type {
  ReportDefinition,
  ReportExecuteParams,
  ReportExecuteResult,
  ReportRow,
} from '../types';
import { ReportEngine } from '../reportEngine';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponível' },
  { value: 'reserved', label: 'Reservado' },
  { value: 'applied', label: 'Aplicado' },
  { value: 'separated', label: 'Separado' },
  { value: 'low_stock', label: 'Estoque baixo' },
];

export const inventoryReportDefinition: ReportDefinition = {
  id: 'inventory-stock',
  name: 'Estoque',
  description: 'Posição de estoque de peças com custo, localização, status e curva ABC.',
  category: 'inventory',
  fields: [
    { key: 'part_code', label: 'Código', type: 'text', defaultVisible: true, width: 14 },
    { key: 'part_name', label: 'Nome da peça', type: 'text', defaultVisible: true, groupable: true, width: 32 },
    { key: 'component_label', label: 'Componente', type: 'text', defaultVisible: true, groupable: true, width: 16 },
    { key: 'supplier', label: 'Fornecedor', type: 'text', defaultVisible: false, groupable: true, width: 24 },
    { key: 'quantity', label: 'Qtd', type: 'number', defaultVisible: true, aggregatable: 'sum', width: 10 },
    { key: 'unit_cost', label: 'Custo unit.', type: 'currency', defaultVisible: true, width: 14 },
    { key: 'total_cost', label: 'Custo total', type: 'currency', defaultVisible: true, aggregatable: 'sum', width: 14 },
    { key: 'status_label', label: 'Status', type: 'text', defaultVisible: true, groupable: true, width: 14 },
    { key: 'warehouse_name', label: 'Depósito', type: 'text', defaultVisible: false, groupable: true, width: 18 },
    { key: 'location_name', label: 'Localização', type: 'text', defaultVisible: false, width: 18 },
    { key: 'inventory_section', label: 'Seção', type: 'text', defaultVisible: false, width: 14 },
    { key: 'cost_method', label: 'Método de custo', type: 'text', defaultVisible: false, width: 14 },
    { key: 'ncm', label: 'NCM', type: 'text', defaultVisible: false, width: 12 },
    { key: 'requires_batch', label: 'Lote', type: 'boolean', defaultVisible: false, width: 10 },
    { key: 'requires_serial', label: 'Série', type: 'boolean', defaultVisible: false, width: 10 },
    { key: 'org_name', label: 'Empresa', type: 'text', defaultVisible: false, groupable: true, width: 24 },
  ],
  filters: [
    { key: 'org_scope', label: 'Empresa(s)', type: 'org-scope' },
    { key: 'statuses', label: 'Status', type: 'multi-select', options: STATUS_OPTIONS },
    {
      key: 'only_low_stock',
      label: 'Apenas estoque baixo',
      type: 'select',
      options: [
        { value: 'false', label: 'Todos' },
        { value: 'true', label: 'Apenas com qtd ≤ 5' },
      ],
    },
    {
      key: 'has_cost',
      label: 'Apenas com custo',
      type: 'select',
      options: [
        { value: 'false', label: 'Todas' },
        { value: 'true', label: 'Apenas com custo > 0' },
      ],
    },
  ],
  groupings: [
    { key: 'component_label', label: 'Por componente', extract: (r) => String(r.component_label ?? 'Sem componente') },
    { key: 'supplier', label: 'Por fornecedor', extract: (r) => String(r.supplier ?? 'Sem fornecedor') },
    { key: 'warehouse_name', label: 'Por depósito', extract: (r) => String(r.warehouse_name ?? 'Sem depósito') },
    { key: 'status_label', label: 'Por status', extract: (r) => String(r.status_label ?? '') },
    { key: 'org_name', label: 'Por empresa', extract: (r) => String(r.org_name ?? '') },
  ],
  defaultOrderBy: { field: 'part_name', direction: 'asc' },
  async execute(params: ReportExecuteParams): Promise<ReportExecuteResult> {
    const { orgScope, filters } = params;
    const orgIds = orgScope.orgIds;
    if (orgIds.length === 0) throw new Error('Selecione ao menos uma empresa.');

    const statuses = (filters.statuses as string[] | undefined) ?? [];
    const onlyLowStock = filters.only_low_stock === 'true';
    const onlyWithCost = filters.has_cost === 'true';

    let q = supabase
      .from('parts_inventory')
      .select(
        `id, part_code, part_name, component, supplier, quantity, unit_cost, status,
         warehouse_id, location_id, inventory_section, cost_method, ncm,
         requires_batch, requires_serial, org_id,
         warehouses(name), inventory_locations(name), organizations!inner(name)`
      )
      .in('org_id', orgIds);

    if (statuses.length > 0) q = q.in('status', statuses);
    if (onlyLowStock) q = q.lte('quantity', 5);
    if (onlyWithCost) q = q.gt('unit_cost', 0);

    const { data, error } = await q;
    if (error) throw new Error(error.message);

    const rows: ReportRow[] = (data ?? []).map((r) => {
      const qty = Number(r.quantity);
      const unitCost = Number(r.unit_cost ?? 0);
      return {
        id: r.id,
        part_code: r.part_code ?? '',
        part_name: r.part_name,
        component_label: r.component ?? '',
        supplier: r.supplier ?? '',
        quantity: qty,
        unit_cost: unitCost,
        total_cost: Math.round(qty * unitCost * 100) / 100,
        status_label: STATUS_OPTIONS.find((s) => s.value === r.status)?.label ?? (r.status ?? ''),
        warehouse_name: (r.warehouses as { name?: string } | null)?.name ?? '',
        location_name: (r.inventory_locations as { name?: string } | null)?.name ?? '',
        inventory_section: r.inventory_section ?? '',
        cost_method: r.cost_method ?? '',
        ncm: r.ncm ?? '',
        requires_batch: r.requires_batch,
        requires_serial: r.requires_serial,
        org_name: (r.organizations as { name?: string } | null)?.name ?? '',
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
