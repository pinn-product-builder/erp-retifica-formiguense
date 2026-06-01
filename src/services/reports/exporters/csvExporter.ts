import type { ReportExportOptions, ReportExporter } from '../types';
import { formatCell } from './formatValue';

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const CsvExporter: ReportExporter = {
  format: 'csv',
  export({ filename, title, result, definition, selectedFields }: ReportExportOptions) {
    const fields = definition.fields.filter((f) => selectedFields.includes(f.key));
    const lines: string[] = [];

    lines.push(csvCell(title));
    lines.push(csvCell(`Gerado em: ${result.meta.generatedAt.toLocaleString('pt-BR')}`));
    lines.push('');

    const headers = fields.map((f) => csvCell(f.label)).join(';');
    lines.push(headers);

    if (result.groups && result.groups.length > 0) {
      for (const group of result.groups) {
        lines.push(csvCell(`▼ ${group.groupLabel}`));
        for (const row of group.rows) {
          lines.push(fields.map((f) => csvCell(formatCell(row[f.key], f))).join(';'));
        }
        const subtotalLine = fields.map((f) => {
          const v = group.subtotals[f.key];
          return csvCell(v !== undefined ? formatCell(v, f) : '');
        });
        lines.push(`${csvCell('Subtotal')};${subtotalLine.slice(1).join(';')}`);
        lines.push('');
      }
    } else {
      for (const row of result.rows) {
        lines.push(fields.map((f) => csvCell(formatCell(row[f.key], f))).join(';'));
      }
    }

    if (Object.keys(result.totals).length > 0) {
      lines.push('');
      const totalLine = fields.map((f) => {
        const v = result.totals[f.key];
        return csvCell(v !== undefined ? formatCell(v, f) : '');
      });
      lines.push(`${csvCell('TOTAL')};${totalLine.slice(1).join(';')}`);
    }

    const csv = `﻿${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
  },
};
