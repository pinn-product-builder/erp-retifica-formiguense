import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

export interface AccountsReceivable {
  id?: string;
  order_id?: string;
  budget_id?: string;
  customer_id: string;
  invoice_number?: string;
  installment_number: number;
  total_installments: number;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check';
  late_fee?: number;
  discount?: number;
  notes?: string;
}

export interface AccountsPayable {
  id?: string;
  supplier_name: string;
  supplier_document?: string;
  expense_category_id?: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check';
  invoice_number?: string;
  notes?: string;
}

export interface CashFlow {
  id?: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
  payment_method?: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check';
  bank_account_id?: string;
  accounts_receivable_id?: string;
  accounts_payable_id?: string;
  order_id?: string;
  category_id?: string;
  notes?: string;
  reconciled: boolean;
}

export interface PaymentMethod {
  id?: string;
  name: string;
  method: string;
  fee_percentage: number;
  fee_fixed: number;
  is_active: boolean;
}

export interface ExpenseCategory {
  id?: string;
  name: string;
  category: string;
  description?: string;
  is_active: boolean;
}

export interface BankAccount {
  id?: string;
  bank_name: string;
  agency?: string;
  account_number: string;
  account_type: string;
  balance: number;
  is_active: boolean;
}

export interface MonthlyDRE {
  id?: string;
  month: number;
  year: number;
  total_revenue: number;
  direct_costs: number;
  operational_expenses: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
}

export const useFinancial = () => {
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();

  const handleError = (error: unknown, message: string) => {
    console.error(message, error);
    toast.error(message);
    setLoading(false);
  };

  // Contas a Receber
  const getAccountsReceivable = async () => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select(`
          *,
          customers (name, document),
          orders (order_number)
        `)
        .eq('org_id', currentOrganization.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar contas a receber');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAccountsReceivable = async (receivable: AccountsReceivable) => {
    if (!currentOrganization?.id) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert([{
          ...receivable,
          org_id: currentOrganization.id
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Conta a receber criada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar conta a receber');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsReceivable = async (id: string, updates: Partial<AccountsReceivable>) => {
    if (!currentOrganization?.id) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts_receivable')
        .update(updates)
        .eq('id', id)
        .eq('org_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Conta a receber atualizada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar conta a receber');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Contas a Pagar
  const getAccountsPayable = async () => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts_payable')
        .select(`
          *,
          expense_categories (name, category)
        `)
        .eq('org_id', currentOrganization.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar contas a pagar');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAccountsPayable = async (payable: AccountsPayable) => {
    if (!currentOrganization?.id) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert([{
          ...payable,
          org_id: currentOrganization.id
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Conta a pagar criada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar conta a pagar');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAccountsPayable = async (id: string, updates: Partial<AccountsPayable>) => {
    if (!currentOrganization?.id) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts_payable')
        .update(updates)
        .eq('id', id)
        .eq('org_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;
      toast.success('Conta a pagar atualizada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar conta a pagar');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fluxo de Caixa
  const getCashFlow = async (startDate?: string, endDate?: string) => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      const query = supabase
        .from('cash_flow')
        .select('id, transaction_date, transaction_type, description, amount, category_id, account_id, reference_id, reference_type, created_at, org_id')
        .eq('org_id', currentOrganization.id)
        .order('transaction_date', { ascending: false });

      if (startDate && endDate) {
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar fluxo de caixa');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCashFlow = async (cashFlow: CashFlow) => {
    if (!currentOrganization?.id) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_flow')
        .insert([{
          ...cashFlow,
          org_id: currentOrganization.id
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Movimentação registrada com sucesso');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao registrar movimentação');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Formas de Pagamento
  const getPaymentMethods = async () => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      // @ts-expect-error - Supabase generated types cause deep instantiation error
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar formas de pagamento');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Categorias de Despesas
  const getExpenseCategories = async () => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar categorias de despesas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Contas Bancárias
  const getBankAccounts = async () => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('bank_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar contas bancárias');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // DRE Mensal
  const getMonthlyDRE = async (year?: number) => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      let query = supabase
        .from('monthly_dre')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (year) {
        query = query.eq('year', year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar DRE mensal');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Clientes
  const getCustomers = async () => {
    if (!currentOrganization?.id) return [];
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'Erro ao carregar clientes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Indicadores Financeiros
  const getFinancialKPIs = async () => {
    if (!currentOrganization?.id) return null;
    
    try {
      setLoading(true);
      
      // Faturamento do mês atual
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const [cashFlowData, receivableData, payableData] = await Promise.all([
        // @ts-expect-error - Supabase generated types cause deep instantiation error
        supabase
          .from('cash_flow')
          .select('transaction_type, amount')
          .eq('org_id', currentOrganization.id)
          .gte('transaction_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`),
        supabase
          .from('accounts_receivable')
          .select('status, amount, due_date')
          .eq('org_id', currentOrganization.id),
        supabase
          .from('accounts_payable')
          .select('status, amount, due_date')
          .eq('org_id', currentOrganization.id)
      ]);

      const income = cashFlowData.data?.filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const expenses = cashFlowData.data?.filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const totalReceivable = receivableData.data?.filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      const overdue = receivableData.data?.filter(r => 
        r.status === 'pending' && new Date(r.due_date) < new Date()
      ).length || 0;

      const totalPayable = payableData.data?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        monthlyRevenue: income,
        monthlyExpenses: expenses,
        netProfit: income - expenses,
        totalReceivable,
        totalPayable,
        overdueCount: overdue,
        cashBalance: income - expenses
      };
    } catch (error) {
      handleError(error, 'Erro ao carregar indicadores financeiros');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    // Contas a Receber
    getAccountsReceivable,
    createAccountsReceivable,
    updateAccountsReceivable,
    // Contas a Pagar
    getAccountsPayable,
    createAccountsPayable,
    updateAccountsPayable,
    // Fluxo de Caixa
    getCashFlow,
    createCashFlow,
    // Configurações
    getPaymentMethods,
    getExpenseCategories,
    getBankAccounts,
    // Relatórios
    getMonthlyDRE,
    getFinancialKPIs,
    // Clientes
    getCustomers
  };
};