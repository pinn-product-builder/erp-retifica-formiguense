import { CsvExporter } from './csvExporter';
import { XlsxExporter } from './xlsxExporter';
import { PdfExporter } from './pdfExporter';
import type { ReportExporter, ReportExportFormat } from '../types';

const exporters: Record<ReportExportFormat, ReportExporter> = {
  csv: CsvExporter,
  xlsx: XlsxExporter,
  pdf: PdfExporter,
};

export function getExporter(format: ReportExportFormat): ReportExporter {
  return exporters[format];
}

export { CsvExporter, XlsxExporter, PdfExporter };
