export type PaymentMethodEnum =
  | 'cash'
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'check'
  | 'boleto';

export type PaymentStatusEnum =
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'renegotiated';

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AccountsReceivableListFilters {
  customerId?: string;
  status?: PaymentStatusEnum;
  paymentMethod?: PaymentMethodEnum;
  orderId?: string;
  budgetId?: string;
  dueFrom?: string;
  dueTo?: string;
  dueOnDates?: string[];
  /** Texto em cliente (nome, documento) ou NF; combinável com valor e status */
  customerText?: string;
  /** Igualdade com `accounts_receivable.amount` (valor da parcela) */
  amountEquals?: number;
  /** @deprecated preferir `customerText`; mantido para compatibilidade */
  search?: string;
  costCenterId?: string;
  /** Faixa de data de competência (competence_date) */
  competenceFrom?: string;
  competenceTo?: string;
  /** Filtro por categoria do plano de contas (expense_category_id) */
  expenseCategoryId?: string;
}

export interface FinancialKpis {
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  totalReceivable: number;
  totalPayable: number;
  overdueCount: number;
  cashBalance: number;
}
