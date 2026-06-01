import type { ReportField, ReportRow } from '../types';

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const num = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const dateBR = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('pt-BR');
};

const datetimeBR = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleString('pt-BR');
};

export function formatCell(value: ReportRow[string], field: ReportField): string {
  if (value === null || value === undefined || value === '') return '';
  switch (field.type) {
    case 'currency':
      return brl.format(Number(value));
    case 'number':
      return num.format(Number(value));
    case 'percent':
      return percent.format(Number(value));
    case 'date':
      return dateBR(value as Date | string);
    case 'datetime':
      return datetimeBR(value as Date | string);
    case 'boolean':
      return value ? 'Sim' : 'Não';
    case 'text':
    default:
      return String(value);
  }
}

export function rawNumber(value: ReportRow[string]): number {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
}

export function rawString(value: ReportRow[string]): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
