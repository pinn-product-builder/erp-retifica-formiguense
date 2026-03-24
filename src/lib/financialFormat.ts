import { parseISO, isValid } from 'date-fns';

export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = parseISO(String(iso).slice(0, 10));
  if (!isValid(d)) return String(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const PAYMENT_METHOD_PT: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão crédito',
  debit_card: 'Cartão débito',
  bank_transfer: 'Transferência',
  check: 'Cheque',
  boleto: 'Boleto',
};

export const EXPENSE_CATEGORY_PT: Record<string, string> = {
  fixed: 'Fixa',
  variable: 'Variável',
  tax: 'Imposto',
  supplier: 'Fornecedor',
  salary: 'Salário',
  equipment: 'Equipamento',
  maintenance: 'Manutenção',
};

export function paymentMethodLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return PAYMENT_METHOD_PT[code] ?? code;
}

export function expenseCategoryLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return EXPENSE_CATEGORY_PT[code] ?? code;
}
