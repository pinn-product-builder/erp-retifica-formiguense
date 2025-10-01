import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface DetailedBudget {
  id: string;
  order_id: string;
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  diagnostic_response_id?: string;
  budget_number?: string;
  services: any[];
  parts: any[];
  labor_hours: number;
  labor_rate: number;
  labor_total: number;
  parts_total: number;
  discount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  warranty_months: number;
  estimated_delivery_days: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  order?: {
    order_number: string;
    customer: {
      name: string;
      document: string;
      phone: string;
      email?: string;
    };
  };
  approvals?: BudgetApproval[];
}

export interface BudgetApproval {
  id: string;
  budget_id: string;
  approval_type: 'total' | 'partial' | 'rejected';
  approved_services: any[];
  approved_parts: any[];
  approved_amount?: number;
  approval_method: 'signature' | 'whatsapp' | 'email' | 'verbal';
  approval_document?: any;
  customer_signature?: string;
  approval_notes?: string;
  approved_by_customer?: string;
  approved_at: string;
  registered_by?: string;
}

export function useDetailedBudgets() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const handleError = (error: any, message: string) => {
    console.error(message, error);
    toast({
      title: "Erro",
      description: message,
      variant: "destructive"
    });
  };

  const handleSuccess = (message: string) => {
    toast({
      title: "Sucesso",
      description: message,
    });
  };

  // Buscar orçamentos detalhados
  const getDetailedBudgets = async (filters?: {
    status?: string;
    orderId?: string;
    component?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    if (!orgId) return [];
    
    try {
      setLoading(true);
      let query = supabase
        .from('detailed_budgets')
        .select(`
          *,
          orders!inner(
            order_number,
            org_id,
            customers!inner(name, document, phone, email)
          ),
          budget_approvals(*)
        `)
        .order('created_at', { ascending: false });

      // Filtrar por organização através da relação com orders
      query = query.eq('orders.org_id', orgId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.orderId) {
        query = query.eq('order_id', filters.orderId);
      }
      if (filters?.component && filters.component !== 'todos') {
        query = query.eq('component', filters.component as any);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Mapear o resultado do Supabase para o tipo correto
      const mappedData = (data || []).map((budget: any) => ({
        ...budget,
        order: budget.orders ? {
          order_number: budget.orders.order_number,
          customer: budget.orders.customers ? {
            name: budget.orders.customers.name,
            document: budget.orders.customers.document,
            phone: budget.orders.customers.phone,
            email: budget.orders.customers.email,
          } : undefined
        } : undefined,
        approvals: budget.budget_approvals || []
      }));

      return mappedData as DetailedBudget[];
    } catch (error) {
      handleError(error, 'Erro ao carregar orçamentos detalhados');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Criar orçamento detalhado
  const createDetailedBudget = async (budgetData: Partial<DetailedBudget>) => {
    if (!orgId) {
      handleError(null, 'Organização não encontrada.');
      return null;
    }

    try {
      setLoading(true);
      const { created_by, ...insertData } = budgetData;
      const { data, error } = await supabase
        .from('detailed_budgets')
        .insert(insertData as any)
        .select(`
          *,
          orders(
            order_number,
            customers(name, document, phone, email)
          )
        `)
        .single();

      if (error) throw error;
      
      handleSuccess('Orçamento detalhado criado com sucesso!');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar orçamento detalhado');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar orçamento detalhado
  const updateDetailedBudget = async (id: string, updates: Partial<DetailedBudget>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('detailed_budgets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          orders(
            order_number,
            customers(name, document, phone, email)
          ),
          budget_approvals(*)
        `)
        .single();

      if (error) throw error;
      
      handleSuccess('Orçamento atualizado com sucesso!');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar orçamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Aprovar orçamento
  const approveBudget = async (approvalData: Partial<BudgetApproval>) => {
    try {
      setLoading(true);
      
      // Criar registro de aprovação
      const { data: approval, error: approvalError } = await supabase
        .from('budget_approvals')
        .insert(approvalData as any)
        .select()
        .single();

      if (approvalError) throw approvalError;

      // Atualizar status do orçamento baseado no tipo de aprovação
      const newStatus = approvalData.approval_type === 'total' ? 'approved' : 
                       approvalData.approval_type === 'partial' ? 'partially_approved' : 
                       'rejected';

      const { error: updateError } = await supabase
        .from('detailed_budgets')
        .update({ status: newStatus })
        .eq('id', approvalData.budget_id);

      if (updateError) throw updateError;

      const successMessage = approvalData.approval_type === 'total' ? 'Orçamento aprovado totalmente!' :
                             approvalData.approval_type === 'partial' ? 'Orçamento aprovado parcialmente!' :
                             'Orçamento rejeitado!';
      
      handleSuccess(successMessage);
      return approval;
    } catch (error) {
      handleError(error, 'Erro ao processar aprovação do orçamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar orçamentos pendentes de aprovação
  const getPendingBudgets = async () => {
    if (!orgId) return [];
    
    try {
      const { data, error } = await supabase
        .from('detailed_budgets')
        .select(`
          *,
          orders!inner(
            order_number,
            org_id,
            customers!inner(name, document, phone, email)
          )
        `)
        .eq('orders.org_id', orgId)
        .eq('status', 'draft')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as DetailedBudget[];
    } catch (error) {
      handleError(error, 'Erro ao carregar orçamentos pendentes');
      return [];
    }
  };

  // Duplicar orçamento (apenas retorna dados para o formulário)
  const getBudgetDataForDuplication = async (budgetId: string) => {
    try {
      setLoading(true);
      
      // Buscar orçamento original
      const { data: originalBudget, error: fetchError } = await supabase
        .from('detailed_budgets')
        .select('*')
        .eq('id', budgetId)
        .single();

      if (fetchError) throw fetchError;

      // Retornar apenas os dados (sem criar no banco)
      // Remove campos que não devem ser copiados
      const { 
        id, 
        created_at, 
        updated_at, 
        budget_number, 
        order_id,
        component,
        diagnostic_response_id,
        ...budgetData 
      } = originalBudget;
      
      return budgetData;
    } catch (error) {
      handleError(error, 'Erro ao buscar dados do orçamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Alias para manter compatibilidade
  const duplicateBudget = getBudgetDataForDuplication;

  return {
    loading,
    getDetailedBudgets,
    createDetailedBudget,
    updateDetailedBudget,
    approveBudget,
    getPendingBudgets,
    duplicateBudget,
  };
}