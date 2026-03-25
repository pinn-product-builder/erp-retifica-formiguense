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
  search?: string;
  costCenterId?: string;
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
