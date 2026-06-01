import ExcelJS from 'exceljs';
import type { ReportExportOptions, ReportExporter, ReportField } from '../types';
import { rawNumber, rawString } from './formatValue';

function numFmtForField(field: ReportField): string {
  switch (field.type) {
    case 'currency':
      return 'R$ #,##0.00';
    case 'number':
      return '#,##0.00';
    case 'percent':
      return '0.0%';
    case 'date':
      return 'dd/mm/yyyy';
    case 'datetime':
      return 'dd/mm/yyyy hh:mm';
    default:
      return '@';
  }
}

function cellValue(value: unknown, field: ReportField): string | number | Date | null {
  if (value === null || value === undefined || value === '') return null;
  switch (field.type) {
    case 'currency':
    case 'number':
    case 'percent':
      return rawNumber(value as never);
    case 'date':
    case 'datetime':
      return value instanceof Date ? value : new Date(rawString(value as never));
    case 'boolean':
      return value ? 'Sim' : 'Não';
    default:
      return rawString(value as never);
  }
}

function autoColumnWidths(worksheet: ExcelJS.Worksheet, fields: ReportField[]) {
  worksheet.columns = fields.map((f) => ({
    header: f.label,
    key: f.key,
    width: f.width ?? Math.max(12, Math.min(40, f.label.length + 4)),
    style: { numFmt: numFmtForField(f) },
  }));
}

export const XlsxExporter: ReportExporter = {
  format: 'xlsx',
  async export({ filename, title, subtitle, result, definition, selectedFields }: ReportExportOptions) {
    const fields = definition.fields.filter((f) => selectedFields.includes(f.key));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ERP Retífica Formiguense';
    workbook.created = result.meta.generatedAt;

    const ws = workbook.addWorksheet('Relatório', {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    autoColumnWidths(ws, fields);

    ws.insertRow(1, []);
    const titleRow = ws.insertRow(1, [title]);
    titleRow.font = { size: 14, bold: true };
    ws.mergeCells(1, 1, 1, fields.length);

    if (subtitle) {
      const subRow = ws.insertRow(2, [subtitle]);
      subRow.font = { size: 10, color: { argb: 'FF666666' } };
      ws.mergeCells(2, 1, 2, fields.length);
    }

    const metaRow = ws.insertRow(subtitle ? 3 : 2, [
      `Gerado em: ${result.meta.generatedAt.toLocaleString('pt-BR')}`,
    ]);
    metaRow.font = { size: 9, italic: true, color: { argb: 'FF888888' } };
    ws.mergeCells(metaRow.number, 1, metaRow.number, fields.length);

    const headerRow = ws.getRow(metaRow.number + 2);
    fields.forEach((f, i) => {
      headerRow.getCell(i + 1).value = f.label;
    });
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0E7490' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 22;

    let cursor = headerRow.number + 1;

    if (result.groups && result.groups.length > 0) {
      for (const group of result.groups) {
        const groupRow = ws.getRow(cursor++);
        groupRow.getCell(1).value = `▼ ${group.groupLabel}`;
        groupRow.font = { bold: true, color: { argb: 'FF0E7490' } };
        groupRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCFFAFE' },
        };
        ws.mergeCells(groupRow.number, 1, groupRow.number, fields.length);

        for (const row of group.rows) {
          const r = ws.getRow(cursor++);
          fields.forEach((f, i) => {
            r.getCell(i + 1).value = cellValue(row[f.key], f);
          });
        }

        const subtotal = ws.getRow(cursor++);
        subtotal.getCell(1).value = 'Subtotal';
        subtotal.font = { italic: true, bold: true };
        fields.forEach((f, i) => {
          const v = group.subtotals[f.key];
          if (v !== undefined && i > 0) subtotal.getCell(i + 1).value = v;
        });
        cursor++;
      }
    } else {
      for (const row of result.rows) {
        const r = ws.getRow(cursor++);
        fields.forEach((f, i) => {
          r.getCell(i + 1).value = cellValue(row[f.key], f);
        });
      }
    }

    if (Object.keys(result.totals).length > 0) {
      cursor++;
      const totalRow = ws.getRow(cursor++);
      totalRow.getCell(1).value = 'TOTAL';
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
      fields.forEach((f, i) => {
        const v = result.totals[f.key];
        if (v !== undefined && i > 0) totalRow.getCell(i + 1).value = v;
      });
    }

    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRow.number }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
