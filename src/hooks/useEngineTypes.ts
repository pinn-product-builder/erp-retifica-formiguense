import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Database } from '@/integrations/supabase/types';

export type EngineType = Database['public']['Tables']['engine_types']['Row'];
export type EngineTypeInsert = Database['public']['Tables']['engine_types']['Insert'];
export type EngineTypeUpdate = Database['public']['Tables']['engine_types']['Update'];

export type WorkflowStep = Database['public']['Tables']['workflow_steps']['Row'];
export type WorkflowStepInsert = Database['public']['Tables']['workflow_steps']['Insert'];
export type WorkflowStepUpdate = Database['public']['Tables']['workflow_steps']['Update'];

interface UseEngineTypesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useEngineTypes(options: UseEngineTypesOptions = {}) {
  const { page, pageSize, search = '' } = options;
  const usePagination = page !== undefined && pageSize !== undefined;
  const [engineTypes, setEngineTypes] = useState<EngineType[]>([]);
  const [total, setTotal] = useState(0);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  const fetchEngineTypes = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('engine_types')
        .select('*', { count: 'exact' })
        .eq('org_id', currentOrganization.id);

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (usePagination && page && pageSize) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query
        .order('name', { ascending: true });

      if (error) throw error;
      setEngineTypes(data || []);
      if (usePagination && count !== null) {
        setTotal(count);
      } else {
        setTotal(data?.length || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de motor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tipos de motor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, page, pageSize, search, toast]);

  const fetchWorkflowSteps = async (engineTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('engine_type_id', engineTypeId)
        .order('component', { ascending: true })
        .order('step_order', { ascending: true });

      if (error) throw error;
      setWorkflowSteps(data || []);
      return data || [];
    } catch (error) {
      console.error('Erro ao carregar etapas do workflow:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as etapas do workflow',
        variant: 'destructive'
      });
      return [];
    }
  };

  const createEngineType = async (engineType: Omit<EngineTypeInsert, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('engine_types')
        .insert({
          ...engineType,
          org_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tipo de motor criado com sucesso'
      });

      await fetchEngineTypes();
      return data;
    } catch (error) {
      console.error('Erro ao criar tipo de motor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o tipo de motor',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateEngineType = async (id: string, updates: EngineTypeUpdate) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('engine_types')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tipo de motor atualizado com sucesso'
      });

      await fetchEngineTypes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tipo de motor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o tipo de motor',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEngineType = async (id: string) => {
    try {
      setLoading(true);
      
      // Verificar se há motores usando este tipo
      const { data: engines, error: enginesError } = await supabase
        .from('engines')
        .select('id')
        .eq('engine_type_id', id)
        .limit(1);

      if (enginesError) throw enginesError;

      if (engines && engines.length > 0) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este tipo de motor está sendo usado por motores cadastrados',
          variant: 'destructive'
        });
        return false;
      }

      const { error } = await supabase
        .from('engine_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tipo de motor excluído com sucesso'
      });

      await fetchEngineTypes();
      return true;
    } catch (error) {
      console.error('Erro ao excluir tipo de motor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o tipo de motor',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createWorkflowStep = async (step: Omit<WorkflowStepInsert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflow_steps')
        .insert(step)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Etapa do workflow criada com sucesso'
      });

      if (step.engine_type_id) {
        await fetchWorkflowSteps(step.engine_type_id);
      }
      return data;
    } catch (error) {
      console.error('Erro ao criar etapa do workflow:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a etapa do workflow',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflowStep = async (id: string, updates: WorkflowStepUpdate) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflow_steps')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Etapa do workflow atualizada com sucesso'
      });

      if (data.engine_type_id) {
        await fetchWorkflowSteps(data.engine_type_id);
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar etapa do workflow:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a etapa do workflow',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflowStep = async (id: string, engineTypeId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('workflow_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Etapa do workflow excluída com sucesso'
      });

      await fetchWorkflowSteps(engineTypeId);
      return true;
    } catch (error) {
      console.error('Erro ao excluir etapa do workflow:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a etapa do workflow',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reorderWorkflowSteps = async (engineTypeId: string, component: string, steps: WorkflowStep[]) => {
    try {
      setLoading(true);
      
      // Atualizar a ordem das etapas
      const updates = steps.map((step, index) => ({
        id: step.id,
        step_order: index + 1,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('workflow_steps')
          .update({
            step_order: update.step_order,
            updated_at: update.updated_at
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem das etapas atualizada com sucesso'
      });

      await fetchWorkflowSteps(engineTypeId);
      return true;
    } catch (error) {
      console.error('Erro ao reordenar etapas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reordenar as etapas',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchEngineTypes();
    }
  }, [currentOrganization?.id, fetchEngineTypes]);

  const totalPages = page && pageSize ? Math.ceil(total / pageSize) : 1;

  return {
    engineTypes,
    total,
    page: page || 1,
    pageSize: pageSize || engineTypes.length,
    totalPages,
    workflowSteps,
    loading,
    fetchEngineTypes,
    fetchWorkflowSteps,
    createEngineType,
    updateEngineType,
    deleteEngineType,
    createWorkflowStep,
    updateWorkflowStep,
    deleteWorkflowStep,
    reorderWorkflowSteps
  };
}
