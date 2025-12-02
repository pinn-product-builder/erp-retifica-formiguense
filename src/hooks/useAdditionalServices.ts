import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';
import { MacroComponent } from './useMacroComponents';

export interface AdditionalService {
  id: string;
  description: string;
  value: number;
  macro_component_id?: string;
  macro_component?: MacroComponent;
  engine_type_id?: string;
  engine_type?: {
    id: string;
    name: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  org_id?: string;
}

export function useAdditionalServices() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: additionalServices = [], isLoading: loading, refetch: fetchAdditionalServices } = useQuery({
    queryKey: ['additional-services', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('additional_services')
        .select(`
          *,
          macro_component:macro_components(*),
          engine_type:engine_types(id, name)
        `)
        .eq('org_id', currentOrganization.id)
        .order('description', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const createAdditionalService = async (service: Omit<AdditionalService, 'id' | 'created_at' | 'updated_at' | 'org_id' | 'macro_component' | 'engine_type'>) => {
    if (!currentOrganization?.id) {
      toast.error('Organização não encontrada');
      return null;
    }

    try {
      const insertData = {
        ...service,
        org_id: currentOrganization.id,
        macro_component_id: service.macro_component_id || null,
        engine_type_id: service.engine_type_id || null
      };

      console.log('Inserindo serviço adicional:', insertData);

      const { data, error } = await supabase
        .from('additional_services')
        .insert(insertData)
        .select(`
          *,
          macro_component:macro_components(*),
          engine_type:engine_types(id, name)
        `)
        .single();

      if (error) {
        console.error('Erro detalhado ao criar serviço adicional:', error);
        throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['additional-services', currentOrganization.id] });
      toast.success('Serviço adicional criado com sucesso');
      return data;
    } catch (error: any) {
      console.error('Erro ao criar serviço adicional:', error);
      toast.error(error.message || 'Erro ao criar serviço adicional');
      return null;
    }
  };

  const updateAdditionalService = async (id: string, service: Partial<Omit<AdditionalService, 'id' | 'created_at' | 'updated_at' | 'org_id' | 'macro_component' | 'engine_type'>>) => {
    try {
      const { data, error } = await supabase
        .from('additional_services')
        .update(service)
        .eq('id', id)
        .select(`
          *,
          macro_component:macro_components(*),
          engine_type:engine_types(id, name)
        `)
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['additional-services', currentOrganization?.id] });
      toast.success('Serviço adicional atualizado com sucesso');
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar serviço adicional:', error);
      toast.error(error.message || 'Erro ao atualizar serviço adicional');
      return null;
    }
  };

  const deleteAdditionalService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('additional_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['additional-services', currentOrganization?.id] });
      toast.success('Serviço adicional excluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir serviço adicional:', error);
      toast.error(error.message || 'Erro ao excluir serviço adicional');
    }
  };

  const getServicesByComponent = (macroComponentId?: string, engineTypeId?: string) => {
    return additionalServices.filter(s => {
      if (!s.is_active) return false;
      
      if (macroComponentId) {
        if (s.macro_component_id && s.macro_component_id !== macroComponentId) {
          return false;
        }
      }
      
      if (engineTypeId) {
        if (s.engine_type_id && s.engine_type_id !== engineTypeId) {
          return false;
        }
      }
      
      return true;
    });
  };

  return {
    additionalServices,
    loading,
    fetchAdditionalServices,
    createAdditionalService,
    updateAdditionalService,
    deleteAdditionalService,
    getServicesByComponent
  };
}

