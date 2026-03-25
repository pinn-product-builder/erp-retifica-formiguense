function csvCell(v: string | number): string {
  const s = String(v).replace(/"/g, '""');
  return `"${s}"`;
}

export class DreExportService {
  static downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const line0 = headers.map(csvCell).join(';');
    const rest = rows.map((r) => r.map(csvCell).join(';'));
    const body = `\ufeff${[line0, ...rest].join('\n')}`;
    const blob = new Blob([body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static openPrintableHtml(title: string, innerHtml: string): void {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.write(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>${title}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:16px;font-size:12px;}
        h1{font-size:18px;margin-bottom:12px;}
        table{border-collapse:collapse;width:100%;}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;}
        th{background:#f4f4f4;}
        .num{text-align:right;font-variant-numeric:tabular-nums;}
      </style></head><body>${innerHtml}</body></html>`
    );
    w.document.close();
    w.focus();
    w.print();
  }
}
