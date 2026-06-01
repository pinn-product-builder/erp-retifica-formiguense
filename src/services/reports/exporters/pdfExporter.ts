import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import type { ReportExportOptions, ReportExporter } from '../types';
import { formatCell } from './formatValue';

export const PdfExporter: ReportExporter = {
  format: 'pdf',
  export({ filename, title, subtitle, result, definition, selectedFields }: ReportExportOptions) {
    const fields = definition.fields.filter((f) => selectedFields.includes(f.key));

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 28;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, marginX, 36);

    let cursorY = 52;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(subtitle, marginX, cursorY);
      cursorY += 14;
    }
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `Gerado em ${result.meta.generatedAt.toLocaleString('pt-BR')} · ${result.totalRows} registro(s)`,
      marginX,
      cursorY
    );
    cursorY += 14;
    doc.setTextColor(0);

    const head = [fields.map((f) => f.label)];

    const numericAlign = (i: number): 'left' | 'right' => {
      const f = fields[i];
      return f.type === 'currency' || f.type === 'number' || f.type === 'percent'
        ? 'right'
        : 'left';
    };

    const columnStyles: Record<number, { halign: 'left' | 'right'; cellWidth?: number }> = {};
    fields.forEach((f, i) => {
      columnStyles[i] = { halign: numericAlign(i) };
      if (f.width) columnStyles[i].cellWidth = f.width;
    });

    const body: RowInput[] = [];

    if (result.groups && result.groups.length > 0) {
      for (const group of result.groups) {
        const groupRow: RowInput = [
          {
            content: `▼ ${group.groupLabel}`,
            colSpan: fields.length,
            styles: {
              fillColor: [207, 250, 254],
              textColor: [14, 116, 144],
              fontStyle: 'bold',
            },
          },
        ];
        body.push(groupRow);

        for (const row of group.rows) {
          body.push(fields.map((f) => formatCell(row[f.key], f)));
        }

        const subtotalRow: RowInput = fields.map((f, i) => {
          if (i === 0) return { content: 'Subtotal', styles: { fontStyle: 'italic' } };
          const v = group.subtotals[f.key];
          return {
            content: v !== undefined ? formatCell(v, f) : '',
            styles: { fontStyle: 'italic', halign: numericAlign(i) },
          };
        });
        body.push(subtotalRow);
      }
    } else {
      for (const row of result.rows) {
        body.push(fields.map((f) => formatCell(row[f.key], f)));
      }
    }

    if (Object.keys(result.totals).length > 0) {
      const totalRow: RowInput = fields.map((f, i) => {
        if (i === 0) return { content: 'TOTAL', styles: { fontStyle: 'bold' } };
        const v = result.totals[f.key];
        return {
          content: v !== undefined ? formatCell(v, f) : '',
          styles: { fontStyle: 'bold', halign: numericAlign(i) },
        };
      });
      body.push(totalRow);
    }

    autoTable(doc, {
      startY: cursorY + 8,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [14, 116, 144], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles,
      margin: { left: marginX, right: marginX },
      didDrawPage: (data) => {
        const str = `Página ${doc.getCurrentPageInfo().pageNumber}`;
        doc.setFontSize(8);
        doc.setTextColor(140);
        doc.text(str, pageWidth - marginX, doc.internal.pageSize.getHeight() - 14, {
          align: 'right',
        });
        doc.setTextColor(0);
      },
    });

    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  },
};
