import { useState, useCallback } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AccountsReceivableService,
  AccountsPayableService,
  CashFlowService,
  FinancialKpiService,
  FinancialConfigService,
  CustomerLookupService,
  DreService,
  ReceiptHistoryService,
  type AccountsReceivableListFilters,
  type AccountsPayableListFilters,
  type ReceiptRecordInput,
  type AccountsReceivableInstallmentsInput,
} from '@/services/financial';
import type { Database } from '@/integrations/supabase/types';

export type AccountsReceivableInsert =
  Database['public']['Tables']['accounts_receivable']['Insert'];
export type AccountsPayableInsert = Database['public']['Tables']['accounts_payable']['Insert'];
export type CashFlowInsert = Database['public']['Tables']['cash_flow']['Insert'];

export type AccountsReceivable = AccountsReceivableInsert;
export type AccountsPayable = AccountsPayableInsert;
export type CashFlow = CashFlowInsert;

export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
export type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row'];
export type BankAccount = Database['public']['Tables']['bank_accounts']['Row'];
export type MonthlyDRE = Database['public']['Tables']['monthly_dre']['Row'];

export const useFinancial = () => {
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? null;
  const userId = user?.id ?? null;

  const handleError = useCallback((error: unknown, message: string) => {
    const detail = error instanceof Error && error.message ? error.message : message;
    toast.error(detail);
    setLoading(false);
  }, []);

  const getAccountsReceivable = useCallback(
    async (page = 1, pageSize = 20, filters: AccountsReceivableListFilters = {}) => {
      if (!orgId) return { data: [], count: 0, page, pageSize, totalPages: 1 };
      try {
        setLoading(true);
        return await AccountsReceivableService.listPaginated(orgId, page, pageSize, filters);
      } catch (error) {
        handleError(error, 'Erro ao carregar contas a receber');
        return { data: [], count: 0, page, pageSize, totalPages: 1 };
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const getReceivableTotals = useCallback(
    async (filters: AccountsReceivableListFilters = {}) => {
      if (!orgId) return { open: 0, overdue: 0, received: 0 };
      try {
        setLoading(true);
        return await AccountsReceivableService.aggregateTotals(orgId, filters);
      } catch (error) {
        handleError(error, 'Erro ao calcular totais');
        return { open: 0, overdue: 0, received: 0 };
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const createAccountsReceivable = useCallback(
    async (receivable: Omit<AccountsReceivable, 'org_id' | 'status'>) => {
      if (!orgId) return null;
      try {
        setLoading(true);
        const { data, error } = await AccountsReceivableService.create(
          orgId,
          {
            customer_id: receivable.customer_id as string,
            order_id: receivable.order_id,
            budget_id: receivable.budget_id,
            amount: receivable.amount as number,
            due_date: receivable.due_date as string,
            competence_date: (receivable as { competence_date?: string }).competence_date ??
              receivable.due_date,
            payment_method: receivable.payment_method,
            notes: receivable.notes,
            invoice_number: receivable.invoice_number,
            installment_number: receivable.installment_number ?? 1,
            total_installments: receivable.total_installments ?? 1,
            cost_center_id: (receivable as { cost_center_id?: string | null }).cost_center_id,
          },
          userId
        );
        if (error) throw error;
        toast.success('Conta a receber criada com sucesso');
        return data;
      } catch (error) {
        handleError(error, 'Erro ao criar conta a receber');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId, userId, handleError]
  );

  const updateAccountsReceivable = useCallback(
    async (id: string, updates: Partial<AccountsReceivable>) => {
      if (!orgId) return null;
      try {
        setLoading(true);
        const { data, error } = await AccountsReceivableService.update(orgId, id, updates, userId);
        if (error) throw error;
        toast.success('Conta a receber atualizada com sucesso');
        return data;
      } catch (error) {
        handleError(error, 'Erro ao atualizar conta a receber');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId, userId, handleError]
  );

  const getAccountsPayable = useCallback(
    async (page = 1, pageSize = 20, filters: AccountsPayableListFilters = {}) => {
      if (!orgId) return { data: [], count: 0, page, pageSize, totalPages: 1 };
      try {
        setLoading(true);
        return await AccountsPayableService.listPaginated(orgId, page, pageSize, filters);
      } catch (error) {
        handleError(error, 'Erro ao carregar contas a pagar');
        return { data: [], count: 0, page, pageSize, totalPages: 1 };
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const createAccountsPayable = useCallback(
    async (payable: AccountsPayable) => {
      if (!orgId) return null;
      try {
        setLoading(true);
        const { data, error } = await AccountsPayableService.create(orgId, {
          supplier_id: (payable as { supplier_id?: string | null }).supplier_id,
          supplier_name: payable.supplier_name,
          supplier_document: payable.supplier_document,
          expense_category_id: payable.expense_category_id,
          description: payable.description,
          amount: payable.amount,
          due_date: payable.due_date,
          payment_method: payable.payment_method,
          invoice_number: payable.invoice_number,
          notes: payable.notes,
          cost_center_id: (payable as { cost_center_id?: string | null }).cost_center_id,
          purchase_order_id: (payable as { purchase_order_id?: string | null }).purchase_order_id,
          approval_status: (payable as { approval_status?: string }).approval_status,
        });
        if (error) throw error;
        toast.success('Conta a pagar criada com sucesso');
        return data;
      } catch (error) {
        handleError(error, 'Erro ao criar conta a pagar');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const updateAccountsPayable = useCallback(
    async (id: string, updates: Partial<AccountsPayable>) => {
      if (!orgId) return null;
      try {
        setLoading(true);
        const { data, error } = await AccountsPayableService.update(orgId, id, updates);
        if (error) throw error;
        toast.success('Conta a pagar atualizada com sucesso');
        return data;
      } catch (error) {
        handleError(error, 'Erro ao atualizar conta a pagar');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const getCashFlow = useCallback(
    async (startDate?: string, endDate?: string, page = 1, pageSize = 50) => {
      if (!orgId) return { data: [], count: 0, page, pageSize, totalPages: 1 };
      try {
        setLoading(true);
        return await CashFlowService.listPaginated(orgId, page, pageSize, startDate, endDate);
      } catch (error) {
        handleError(error, 'Erro ao carregar fluxo de caixa');
        return { data: [], count: 0, page, pageSize, totalPages: 1 };
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const createCashFlow = useCallback(
    async (cashFlow: Omit<CashFlow, 'org_id'>) => {
      if (!orgId) return null;
      try {
        setLoading(true);
        const { data, error } = await CashFlowService.create(orgId, {
          transaction_type: cashFlow.transaction_type as 'income' | 'expense',
          amount: cashFlow.amount as number,
          description: cashFlow.description as string,
          transaction_date: cashFlow.transaction_date as string,
          payment_method: cashFlow.payment_method,
          bank_account_id: cashFlow.bank_account_id,
          accounts_receivable_id: cashFlow.accounts_receivable_id,
          accounts_payable_id: cashFlow.accounts_payable_id,
          order_id: cashFlow.order_id,
          category_id: cashFlow.category_id,
          cost_center_id: cashFlow.cost_center_id,
          notes: cashFlow.notes,
          reconciled: cashFlow.reconciled ?? false,
        });
        if (error) throw error;
        toast.success('Movimentação registrada com sucesso');
        return data;
      } catch (error) {
        handleError(error, 'Erro ao registrar movimentação');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const getPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      return await FinancialConfigService.listPaymentMethods();
    } catch (error) {
      handleError(error, 'Erro ao carregar formas de pagamento');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getExpenseCategories = useCallback(async () => {
    if (!orgId) return [];
    try {
      setLoading(true);
      return await FinancialConfigService.listExpenseCategories(orgId);
    } catch (error) {
      handleError(error, 'Erro ao carregar categorias de despesas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [orgId, handleError]);

  const getBankAccounts = useCallback(async () => {
    if (!orgId) return [];
    try {
      setLoading(true);
      return await FinancialConfigService.listBankAccounts(orgId);
    } catch (error) {
      handleError(error, 'Erro ao carregar contas bancárias');
      return [];
    } finally {
      setLoading(false);
    }
  }, [orgId, handleError]);

  const getMonthlyDRE = useCallback(
    async (year?: number) => {
      if (!orgId) return [];
      try {
        setLoading(true);
        return await DreService.list(orgId, year);
      } catch (error) {
        handleError(error, 'Erro ao carregar DRE mensal');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const getFinancialKPIs = useCallback(async () => {
    if (!orgId) return null;
    try {
      setLoading(true);
      return await FinancialKpiService.getKpis(orgId);
    } catch (error) {
      handleError(error, 'Erro ao carregar indicadores financeiros');
      return null;
    } finally {
      setLoading(false);
    }
  }, [orgId, handleError]);

  const getCustomers = useCallback(
    async (search = '', page = 1, pageSize = 100) => {
      if (!orgId) return [];
      try {
        setLoading(true);
        const res = await CustomerLookupService.search(orgId, search, page, pageSize);
        return res.data;
      } catch (error) {
        handleError(error, 'Erro ao carregar clientes');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [orgId, handleError]
  );

  const listReceiptHistory = useCallback(
    async (receivableId: string) => {
      if (!orgId) return [];
      const { data, error } = await ReceiptHistoryService.listByReceivable(orgId, receivableId);
      if (error) {
        toast.error(error.message);
        return [];
      }
      return data;
    },
    [orgId]
  );

  const createInstallmentPlan = useCallback(
    async (input: AccountsReceivableInstallmentsInput) => {
      if (!orgId) return null;
      try {
        setLoading(true);
        const { data, error } = await AccountsReceivableService.createInstallmentPlan(
          orgId,
          input,
          userId
        );
        if (error) throw error;
        toast.success('Parcelamento criado');
        return data;
      } catch (error) {
        handleError(error, 'Erro ao criar parcelamento');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [orgId, userId, handleError]
  );

  const recordReceiptPayment = useCallback(
    async (input: ReceiptRecordInput) => {
      if (!orgId) return false;
      try {
        setLoading(true);
        const { error } = await ReceiptHistoryService.recordPayment(orgId, input, userId);
        if (error) throw error;
        toast.success('Recebimento registrado');
        return true;
      } catch (error) {
        handleError(error, 'Erro ao registrar recebimento');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [orgId, userId, handleError]
  );

  return {
    loading,
    getAccountsReceivable,
    getReceivableTotals,
    createAccountsReceivable,
    updateAccountsReceivable,
    getAccountsPayable,
    createAccountsPayable,
    updateAccountsPayable,
    getCashFlow,
    createCashFlow,
    getPaymentMethods,
    getExpenseCategories,
    getBankAccounts,
    getMonthlyDRE,
    getFinancialKPIs,
    getCustomers,
    listReceiptHistory,
    recordReceiptPayment,
    createInstallmentPlan,
  };
};
