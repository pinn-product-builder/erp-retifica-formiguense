import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export const FIXED_WORKFLOW_STATUSES = ['entrada', 'entregue'] as const;

export interface WorkflowStatusConfig {
  id: string;
  org_id?: string;
  entity_type: string;
  status_key: string;
  status_label: string;
  badge_variant: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  display_order: number;
  estimated_hours: number;
  allow_component_split?: boolean;
  allowed_components?: string[] | null;
  visual_config?: Json;
  notification_config?: Json;
  sla_config?: Json;
  automation_rules?: Json;
}

export interface StatusPrerequisite {
  id: string;
  from_status_key: string;
  to_status_key: string;
  entity_type: string;
  component?: string;
  transition_type: 'automatic' | 'manual' | 'approval_required' | 'conditional';
  is_active: boolean;
  org_id?: string | null;
  created_at?: string;
}

export function useWorkflowStatusConfig() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatusConfig[]>([]);
  const [prerequisites, setPrerequisites] = useState<StatusPrerequisite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkflowStatuses = useCallback(async () => {
    console.log('fetchWorkflowStatuses called - currentOrganization:', currentOrganization);
    
    if (!currentOrganization) {
      console.log('No current organization, skipping fetch');
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching workflow statuses for org:', currentOrganization.id);
      
      const { data, error } = await supabase
        .from('status_config')
        .select('*')
        .eq('entity_type', 'workflow')
        .or(`org_id.is.null,org_id.eq.${currentOrganization.id}`)
        .order('display_order, status_key');

      console.log('Fetch result:', { data, error });

      if (error) throw error;
      setWorkflowStatuses((data as WorkflowStatusConfig[]) || []);
      console.log('Workflow statuses set:', data?.length || 0, 'items');
    } catch (error) {
      console.error('Error fetching workflow statuses:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de status de workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, toast]);

  const fetchPrerequisites = useCallback(async () => {
    if (!currentOrganization) {
      console.log('No current organization, skipping fetch prerequisites');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_prerequisites')
        .select('*')
        .eq('entity_type', 'workflow')
        .or(`org_id.is.null,org_id.eq.${currentOrganization.id}`)
        .order('from_status_key');

      if (error) throw error;
      setPrerequisites(data || []);
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pré-requisitos de status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, toast]);

  const createStatusConfig = async (statusData: Omit<WorkflowStatusConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Creating status config with data:', statusData);
      console.log('Current organization:', currentOrganization);
      
      const insertData = {
        ...statusData,
        org_id: currentOrganization?.id,
        entity_type: 'workflow'
      };
      
      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('status_config')
        .insert(insertData)
        .select();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configuração de status criada com sucesso",
      });

      // Criar pré-requisitos automaticamente para o novo status
      if (data && data[0]) {
        await createDefaultPrerequisitesForStatus(data[0].status_key);
      }

      fetchWorkflowStatuses();
      return true;
    } catch (error) {
      console.error('Error creating status config:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar configuração de status: ${error.message || error}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStatusConfig = async (statusId: string, updates: Partial<WorkflowStatusConfig>) => {
    try {
      const { error } = await supabase
        .from('status_config')
        .update(updates)
        .eq('id', statusId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração de status atualizada com sucesso",
      });

      fetchWorkflowStatuses();
      return true;
    } catch (error) {
      console.error('Error updating status config:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração de status",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteStatusConfig = async (statusId: string) => {
    try {
      // Primeiro, buscar o status que será excluído para obter a chave
      const statusToDelete = workflowStatuses.find(status => status.id === statusId);
      if (!statusToDelete) {
        toast({
          title: "Erro",
          description: "Status não encontrado",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se existem ordens de serviço usando este status
      const { data: ordersUsingStatus, error: checkError } = await supabase
        .from('order_workflow')
        .select('id, order_id, component, status')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('status', statusToDelete.status_key as any)
        .limit(1);

      if (checkError) {
        console.error('Error checking status usage:', checkError);
        toast({
          title: "Erro",
          description: "Erro ao verificar uso do status",
          variant: "destructive",
        });
        return false;
      }

      // Se existem ordens usando este status, não permitir exclusão
      if (ordersUsingStatus && ordersUsingStatus.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: `O status "${statusToDelete.status_label}" não pode ser excluído pois existem ordens de serviço utilizando este status. Mova as ordens para outro status antes de excluir.`,
          variant: "destructive",
        });
        return false;
      }

      // Se não há ordens usando o status, proceder com a exclusão
      const { error } = await supabase
        .from('status_config')
        .delete()
        .eq('id', statusId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status de workflow excluído com sucesso",
      });

      fetchWorkflowStatuses();
      return true;
    } catch (error) {
      console.error('Error deleting status config:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir configuração de status",
        variant: "destructive",
      });
      return false;
    }
  };

  const createPrerequisite = async (prerequisiteData: Omit<StatusPrerequisite, 'id'>) => {
    try {
      console.log('Creating prerequisite with data:', prerequisiteData);
      console.log('Current organization:', currentOrganization);
      
      const insertData = {
        ...prerequisiteData,
        entity_type: 'workflow',
        org_id: currentOrganization?.id || null
      };
      
      console.log('Insert data:', insertData);

      const { error } = await supabase
        .from('status_prerequisites')
        .insert(insertData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Pré-requisito criado com sucesso",
      });

      fetchPrerequisites();
      return true;
    } catch (error) {
      console.error('Error creating prerequisite:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar pré-requisito: ${(error as Error).message || error}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePrerequisite = async (prerequisiteId: string, updates: Partial<StatusPrerequisite>) => {
    try {
      const { error } = await supabase
        .from('status_prerequisites')
        .update(updates)
        .eq('id', prerequisiteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pré-requisito atualizado com sucesso",
      });

      fetchPrerequisites();
      return true;
    } catch (error) {
      console.error('Error updating prerequisite:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pré-requisito",
        variant: "destructive",
      });
      return false;
    }
  };

  const createDefaultPrerequisitesForStatus = async (newStatusKey: string) => {
    try {
      if (!currentOrganization) return;

      // Buscar todos os status ativos ordenados
      const { data: allStatuses, error: fetchError } = await supabase
        .from('status_config')
        .select('status_key, display_order')
        .eq('org_id', currentOrganization.id)
        .eq('entity_type', 'workflow')
        .eq('is_active', true)
        .order('display_order');

      if (fetchError || !allStatuses) {
        console.error('Error fetching statuses for prerequisites:', fetchError);
        return;
      }

      const statusKeys = allStatuses.map(s => s.status_key);
      const newStatusIndex = statusKeys.indexOf(newStatusKey);

      if (newStatusIndex === -1) return;

      const prerequisitesToCreate = [];

      // Criar pré-requisito do status anterior para o novo status
      if (newStatusIndex > 0) {
        const previousStatusKey = statusKeys[newStatusIndex - 1];
        prerequisitesToCreate.push({
          org_id: currentOrganization.id,
          entity_type: 'workflow',
          from_status_key: previousStatusKey,
          to_status_key: newStatusKey,
          transition_type: 'manual',
          is_active: true
        });
      }

      // Criar pré-requisito do novo status para o próximo status
      if (newStatusIndex < statusKeys.length - 1) {
        const nextStatusKey = statusKeys[newStatusIndex + 1];
        prerequisitesToCreate.push({
          org_id: currentOrganization.id,
          entity_type: 'workflow',
          from_status_key: newStatusKey,
          to_status_key: nextStatusKey,
          transition_type: 'manual',
          is_active: true
        });
      }

      // Inserir pré-requisitos se houver algum para criar
      if (prerequisitesToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('status_prerequisites')
          .insert(prerequisitesToCreate);

        if (insertError) {
          console.error('Error creating default prerequisites:', insertError);
        } else {
          console.log('Default prerequisites created successfully');
          fetchPrerequisites();
        }
      }
    } catch (error) {
      console.error('Error in createDefaultPrerequisitesForStatus:', error);
    }
  };

  const deletePrerequisite = async (prerequisiteId: string) => {
    try {
      // Primeiro, buscar o pré-requisito que será excluído
      const prerequisiteToDelete = prerequisites.find(prereq => prereq.id === prerequisiteId);
      if (!prerequisiteToDelete) {
        toast({
          title: "Erro",
          description: "Pré-requisito não encontrado",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se existem ordens de serviço que podem estar usando esta transição
      // Verificamos se há ordens no status de origem que poderiam usar esta transição
      const { data: ordersInFromStatus, error: checkError } = await supabase
        .from('order_workflow')
        .select('id, order_id, component, status')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('status', prerequisiteToDelete.from_status_key as any)
        .limit(1);

      if (checkError) {
        console.error('Error checking prerequisite usage:', checkError);
        toast({
          title: "Erro",
          description: "Erro ao verificar uso do pré-requisito",
          variant: "destructive",
        });
        return false;
      }

      // Se existem ordens no status de origem, avisar sobre possível impacto
      if (ordersInFromStatus && ordersInFromStatus.length > 0) {
        toast({
          title: "Atenção",
          description: `Existem ordens de serviço no status "${prerequisiteToDelete.from_status_key}" que podem ser afetadas pela remoção desta transição. Certifique-se de que não há dependências ativas.`,
          variant: "destructive",
        });
        // Não bloqueamos a exclusão, apenas avisamos
      }

      // Proceder com a exclusão do pré-requisito
      const { error } = await supabase
        .from('status_prerequisites')
        .delete()
        .eq('id', prerequisiteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pré-requisito excluído com sucesso",
      });

      fetchPrerequisites();
      return true;
    } catch (error) {
      console.error('Error deleting prerequisite:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pré-requisito",
        variant: "destructive",
      });
      return false;
    }
  };

  const getNextAllowedStatuses = (currentStatus: string, component?: string) => {
    const allowedTransitions = prerequisites.filter(
      prereq => prereq.from_status_key === currentStatus &&
                 (!component || !prereq.component || prereq.component === component)
    );

    return allowedTransitions.map(transition => {
      const statusConfig = workflowStatuses.find(
        status => status.status_key === transition.to_status_key
      );
      return {
        ...transition,
        statusConfig
      };
    });
  };

  const getStatusConfig = (statusKey: string) => {
    return workflowStatuses.find(status => status.status_key === statusKey);
  };

  const getStatusColors = () => {
    const colors: Record<string, { bgColor: string; textColor: string }> = {};
    
    workflowStatuses.forEach(status => {
      if (status.visual_config && typeof status.visual_config === 'object') {
        const visualConfig = status.visual_config as { bgColor?: string; textColor?: string };
        colors[status.status_key] = {
          bgColor: visualConfig.bgColor || '#f3f4f6',
          textColor: visualConfig.textColor || '#374151'
        };
      } else {
        // Cores padrão baseadas no status
        const defaultColors: Record<string, { bgColor: string; textColor: string }> = {
          entrada: { bgColor: '#fef2f2', textColor: '#dc2626' },
          metrologia: { bgColor: '#fff7ed', textColor: '#ea580c' },
          usinagem: { bgColor: '#fefce8', textColor: '#ca8a04' },
          montagem: { bgColor: '#f0fdf4', textColor: '#16a34a' },
          pronto: { bgColor: '#ecfeff', textColor: '#0891b2' },
          garantia: { bgColor: '#faf5ff', textColor: '#7c3aed' },
          entregue: { bgColor: '#ecfdf5', textColor: '#059669' }
        };
        colors[status.status_key] = defaultColors[status.status_key] || 
          { bgColor: '#f3f4f6', textColor: '#374151' };
      }
    });

    return colors;
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchWorkflowStatuses();
      fetchPrerequisites();
    }
  }, [currentOrganization, fetchWorkflowStatuses, fetchPrerequisites]);

  return {
    workflowStatuses,
    prerequisites,
    loading,
    fetchWorkflowStatuses,
    fetchPrerequisites,
    createStatusConfig,
    updateStatusConfig,
    deleteStatusConfig,
    createPrerequisite,
    updatePrerequisite,
    deletePrerequisite,
    getNextAllowedStatuses,
    getStatusConfig,
    getStatusColors
  };
}
