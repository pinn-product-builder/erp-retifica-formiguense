import type {
  ReportDefinition,
  ReportExecuteParams,
  ReportExecuteResult,
  ReportField,
  ReportGroupedRow,
  ReportRow,
} from './types';

export class ReportEngine {
  static async run(
    definition: ReportDefinition,
    params: ReportExecuteParams
  ): Promise<ReportExecuteResult> {
    if (params.selectedFields.length === 0) {
      throw new Error('Selecione ao menos um campo para o relatório.');
    }
    const missingRequired = definition.filters
      .filter((f) => f.required)
      .filter((f) => {
        const v = params.filters[f.key];
        return v === undefined || v === null || v === '';
      });
    if (missingRequired.length > 0) {
      throw new Error(
        `Filtros obrigatórios não preenchidos: ${missingRequired.map((f) => f.label).join(', ')}`
      );
    }
    return definition.execute(params);
  }

  static groupRows(
    rows: ReportRow[],
    groupingExtract: (row: ReportRow) => string,
    fields: ReportField[]
  ): ReportGroupedRow[] {
    const groups = new Map<string, ReportRow[]>();
    for (const row of rows) {
      const key = groupingExtract(row);
      const arr = groups.get(key) ?? [];
      arr.push(row);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).map(([key, groupRows]) => ({
      groupKey: key,
      groupLabel: key,
      rows: groupRows,
      subtotals: this.aggregate(groupRows, fields),
    }));
  }

  static aggregate(rows: ReportRow[], fields: ReportField[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const field of fields) {
      if (!field.aggregatable || field.aggregatable === 'none') continue;
      const values = rows
        .map((r) => r[field.key])
        .filter((v): v is number => typeof v === 'number');
      if (values.length === 0) continue;
      if (field.aggregatable === 'sum') {
        result[field.key] = values.reduce((s, v) => s + v, 0);
      } else if (field.aggregatable === 'count') {
        result[field.key] = values.length;
      } else if (field.aggregatable === 'avg') {
        result[field.key] = values.reduce((s, v) => s + v, 0) / values.length;
      }
    }
    return result;
  }

  static sortRows(
    rows: ReportRow[],
    orderBy: { field: string; direction: 'asc' | 'desc' }
  ): ReportRow[] {
    const sorted = [...rows];
    sorted.sort((a, b) => {
      const av = a[orderBy.field];
      const bv = b[orderBy.field];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
      else if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else cmp = String(av).localeCompare(String(bv), 'pt-BR');
      return orderBy.direction === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }
}
