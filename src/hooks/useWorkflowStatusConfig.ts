import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

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
  visual_config?: any;
  notification_config?: any;
  sla_config?: any;
  automation_rules?: any[];
}

export interface StatusPrerequisite {
  id: string;
  from_status_key: string;
  to_status_key: string;
  entity_type: string;
  component?: string;
  transition_type: 'automatic' | 'manual' | 'approval_required' | 'conditional';
  is_active: boolean;
}

export function useWorkflowStatusConfig() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatusConfig[]>([]);
  const [prerequisites, setPrerequisites] = useState<StatusPrerequisite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkflowStatuses = async () => {
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
      setWorkflowStatuses((data as any) || []);
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
  };

  const fetchPrerequisites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_prerequisites')
        .select('*')
        .eq('entity_type', 'workflow')
        .eq('is_active', true)
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
  };

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
      const { error } = await supabase
        .from('status_prerequisites')
        .insert({
          ...prerequisiteData,
          entity_type: 'workflow'
        });

      if (error) throw error;

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
        description: "Erro ao criar pré-requisito",
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

  const deletePrerequisite = async (prerequisiteId: string) => {
    try {
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
        colors[status.status_key] = {
          bgColor: status.visual_config.bgColor || '#f3f4f6',
          textColor: status.visual_config.textColor || '#374151'
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
  }, [currentOrganization]);

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
