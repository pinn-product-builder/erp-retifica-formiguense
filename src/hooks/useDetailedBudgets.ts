import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useQueryClient } from '@tanstack/react-query';
import WorkflowService from '@/services/WorkflowService';

export interface DetailedBudget {
  id: string;
  order_id: string;
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  diagnostic_response_id?: string;
  budget_number?: string;
  services: Array<Record<string, unknown>>;
  parts: Array<Record<string, unknown>>;
  labor_hours: number;
  labor_rate: number;
  labor_total: number;
  parts_total: number;
  discount: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  original_total_amount?: number;
  warranty_months: number;
  estimated_delivery_days: number;
  labor_description?: string;
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
  approved_services: Array<Record<string, unknown>>;
  approved_parts: Array<Record<string, unknown>>;
  approved_amount?: number;
  approval_method: 'signature' | 'whatsapp' | 'email' | 'verbal';
  approval_document?: unknown;
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
  const queryClient = useQueryClient();

  const handleError = (error: unknown, message: string) => {
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
        query = query.eq('component', filters.component as Database['public']['Enums']['engine_component']);
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

  // Verificar se já existe orçamento para o componente
  const checkBudgetExists = async (orderId: string, component: string) => {
    try {
      const { data, error } = await supabase
        .from('detailed_budgets')
        .select('id, budget_number, status')
        .eq('order_id', orderId)
        .eq('component', component as Database['public']['Enums']['engine_component'])
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data; // Retorna o orçamento existente ou null
    } catch (error) {
      console.error('Erro ao verificar orçamento existente:', error);
      return null;
    }
  };

  // Criar orçamento detalhado
  const createDetailedBudget = async (budgetData: Partial<DetailedBudget>) => {
    if (!orgId) {
      handleError(null, 'Organização não encontrada.');
      return null;
    }

    // Validar se já existe orçamento para este componente
    if (budgetData.order_id && budgetData.component) {
      const existingBudget = await checkBudgetExists(budgetData.order_id, budgetData.component);
      
      if (existingBudget) {
        handleError(null, `Já existe um orçamento para o componente "${budgetData.component}" nesta ordem de serviço. Orçamento: ${existingBudget.budget_number} (Status: ${existingBudget.status})`);
        return null;
      }
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
      
      // Buscar orçamento atual para verificar se tem aprovações anteriores
      const { data: currentBudget } = await supabase
        .from('detailed_budgets')
        .select('status, budget_approvals(id)')
        .eq('id', id)
        .single();
      
      // Garantir que total_amount seja um número válido
      const updateData = {
        ...updates,
        total_amount: updates.total_amount !== undefined && updates.total_amount !== null 
          ? Number(updates.total_amount) 
          : undefined,
        updated_at: new Date().toISOString(),
      };
      
      // Remover campos undefined para evitar problemas
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });
      
      const { data, error } = await supabase
        .from('detailed_budgets')
        .update(updateData as any)
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

      if (error) {
        console.error('Erro ao atualizar orçamento:', error);
        throw error;
      }
      
      // Se tinha status 'reopened' e ainda está 'reopened', informar que pode enviar ao cliente
      const wasReopened = currentBudget?.status === 'reopened';
      const isStillReopened = updates.status === 'reopened';
      
      if (wasReopened && isStillReopened) {
        handleSuccess('Orçamento atualizado com sucesso! Você pode enviar para aprovação do cliente quando estiver pronto.');
      } else {
        handleSuccess('Orçamento atualizado com sucesso!');
      }
      
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
      
      if (!approvalData.budget_id || !approvalData.approval_type || !approvalData.approved_amount) {
        throw new Error('Dados incompletos para aprovação');
      }

      const { data: result, error: functionError } = await supabase.functions.invoke('process-budget-approval', {
        body: {
          budget_id: approvalData.budget_id,
          approval_type: approvalData.approval_type,
          approved_amount: approvalData.approved_amount || 0,
          registered_by: approvalData.registered_by || undefined,
          approval_notes: approvalData.approval_notes || undefined,
          approval_method: approvalData.approval_method || 'manual',
          approved_by_customer: approvalData.approved_by_customer || undefined,
          approval_document: approvalData.approval_document || undefined,
          approved_services: approvalData.approved_services || [],
          approved_parts: approvalData.approved_parts || []
        }
      });

      if (functionError) {
        console.error('Erro na Edge Function:', functionError);
        throw functionError;
      }

      if (!result || !result.success) {
        throw new Error(result?.error || 'Erro ao processar aprovação');
      }

      const { data: approval, error: approvalError } = await supabase
        .from('budget_approvals')
        .select('*')
        .eq('budget_id', approvalData.budget_id)
        .order('approved_at', { ascending: false })
        .limit(1)
        .single();

      if (approvalError) {
        console.warn('Aviso: Não foi possível buscar registro de aprovação:', approvalError);
      }

      const successMessage = approvalData.approval_type === 'total' ? 'Orçamento aprovado totalmente!' :
                             approvalData.approval_type === 'partial' ? 'Orçamento aprovado parcialmente!' :
                             'Orçamento rejeitado!';
      
      handleSuccess(successMessage);
      
      // Avançar workflows automaticamente após aprovação usando o service
      if (result.order_id) {
        const workflowResult = await WorkflowService.advanceOrderWorkflowsAfterApproval(result.order_id);
        
        if (workflowResult.success && workflowResult.nextStatus) {
          // Invalidar queries do workflow para atualizar o kanban
          queryClient.invalidateQueries({ queryKey: ['order-workflow'] });
          queryClient.invalidateQueries({ queryKey: ['workflow-status-history'] });
        }
      }
      
      return {
        ...approval,
        ...result,
        order_id: result.order_id,
        order_status: result.order_status
      };
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

  // Enviar orçamento para aprovação do cliente
  const sendToCustomer = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('detailed_budgets')
        .update({ 
          status: 'pending_customer',
          updated_at: new Date().toISOString()
        })
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
      
      handleSuccess('Orçamento enviado para aprovação do cliente com sucesso!');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao enviar orçamento para cliente');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Reabrir orçamento aprovado
  const reopenBudget = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('detailed_budgets')
        .update({ 
          status: 'reopened',
          updated_at: new Date().toISOString()
        })
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
      
      handleSuccess('Orçamento reaberto com sucesso! Agora você pode editá-lo.');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao reabrir orçamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Excluir orçamento
  const deleteDetailedBudget = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('detailed_budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      handleSuccess('Orçamento excluído com sucesso!');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao excluir orçamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getDetailedBudgets,
    createDetailedBudget,
    updateDetailedBudget,
    approveBudget,
    getPendingBudgets,
    duplicateBudget,
    checkBudgetExists,
    deleteDetailedBudget,
    reopenBudget,
    sendToCustomer
  };
}