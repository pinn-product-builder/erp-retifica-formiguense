import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface MacroComponent {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  org_id?: string;
}

export function useMacroComponents() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: macroComponents = [], isLoading: loading, refetch: fetchMacroComponents } = useQuery({
    queryKey: ['macro-components', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('macro_components')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar componentes macro:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const createMacroComponent = async (component: Omit<MacroComponent, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    if (!currentOrganization?.id) {
      toast.error('Organização não encontrada');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('macro_components')
        .insert({
          ...component,
          org_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['macro-components', currentOrganization.id] });
      toast.success('Componente macro criado com sucesso');
      return data;
    } catch (error: any) {
      console.error('Erro ao criar componente macro:', error);
      toast.error(error.message || 'Erro ao criar componente macro');
      return null;
    }
  };

  const updateMacroComponent = async (id: string, component: Partial<Omit<MacroComponent, 'id' | 'created_at' | 'updated_at' | 'org_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('macro_components')
        .update(component)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['macro-components', currentOrganization?.id] });
      toast.success('Componente macro atualizado com sucesso');
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar componente macro:', error);
      toast.error(error.message || 'Erro ao atualizar componente macro');
      return null;
    }
  };

  const deleteMacroComponent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('macro_components')
        .delete()
        .eq('id', id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['macro-components', currentOrganization?.id] });
      toast.success('Componente macro excluído com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir componente macro:', error);
      toast.error(error.message || 'Erro ao excluir componente macro');
    }
  };

  return {
    macroComponents,
    loading,
    fetchMacroComponents,
    createMacroComponent,
    updateMacroComponent,
    deleteMacroComponent
  };
}

