export type ReportCategory = 'dre' | 'ar' | 'ap' | 'cashflow' | 'inventory';

export type ReportFieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'percent'
  | 'boolean';

export interface ReportField {
  key: string;
  label: string;
  type: ReportFieldType;
  defaultVisible: boolean;
  groupable?: boolean;
  aggregatable?: 'sum' | 'count' | 'avg' | 'none';
  width?: number;
}

export type ReportFilterType =
  | 'date-range'
  | 'date-single'
  | 'select'
  | 'multi-select'
  | 'text'
  | 'number-range'
  | 'org-scope'
  | 'cost-center'
  | 'customer'
  | 'supplier'
  | 'status';

export interface ReportFilterOption {
  value: string;
  label: string;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: ReportFilterType;
  required?: boolean;
  defaultValue?: unknown;
  options?: ReportFilterOption[];
  loadOptions?: (orgId: string) => Promise<ReportFilterOption[]>;
  description?: string;
}

export interface ReportGrouping {
  key: string;
  label: string;
  extract: (row: ReportRow) => string;
}

export type ReportFilterValues = Record<string, unknown>;

export interface ReportExecuteParams {
  orgId: string;
  orgScope: { mode: 'single' | 'consolidated'; orgIds: string[] };
  selectedFields: string[];
  filters: ReportFilterValues;
  groupBy?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

export type ReportRow = Record<string, string | number | Date | boolean | null>;

export interface ReportGroupedRow {
  groupKey: string;
  groupLabel: string;
  rows: ReportRow[];
  subtotals: Record<string, number>;
}

export interface ReportExecuteResult {
  rows: ReportRow[];
  groups?: ReportGroupedRow[];
  totals: Record<string, number>;
  totalRows: number;
  meta: {
    generatedAt: Date;
    filters: ReportFilterValues;
    selectedFields: string[];
  };
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  category: ReportCategory;
  fields: ReportField[];
  filters: ReportFilter[];
  groupings?: ReportGrouping[];
  defaultOrderBy?: { field: string; direction: 'asc' | 'desc' };
  execute: (params: ReportExecuteParams) => Promise<ReportExecuteResult>;
}

export type ReportExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ReportExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  result: ReportExecuteResult;
  definition: ReportDefinition;
  selectedFields: string[];
}

export interface ReportExporter {
  format: ReportExportFormat;
  export(options: ReportExportOptions): Promise<void> | void;
}
