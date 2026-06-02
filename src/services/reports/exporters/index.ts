import type { ReportExporter, ReportExportFormat } from '../types';

const loaders: Record<ReportExportFormat, () => Promise<ReportExporter>> = {
  csv: () => import('./csvExporter').then((m) => m.CsvExporter),
  xlsx: () => import('./xlsxExporter').then((m) => m.XlsxExporter),
  pdf: () => import('./pdfExporter').then((m) => m.PdfExporter),
};

export function getExporter(format: ReportExportFormat): Promise<ReportExporter> {
  return loaders[format]();
}
