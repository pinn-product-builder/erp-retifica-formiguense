import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';

export interface DiagnosticChecklist {
  id: string;
  org_id: string;
  engine_type_id?: string;
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  name: string;
  description?: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  items?: DiagnosticChecklistItem[];
}

export interface DiagnosticChecklistItem {
  id: string;
  checklist_id: string;
  item_name: string;
  item_description?: string;
  item_type: 'checkbox' | 'measurement' | 'photo' | 'text' | 'select';
  item_options?: any[];
  is_required: boolean;
  triggers_service?: any[];
  expected_values?: any;
  display_order: number;
  help_text?: string;
}

export interface DiagnosticChecklistResponse {
  id: string;
  order_id: string;
  checklist_id: string;
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  responses: Record<string, any>;
  photos: any[];
  generated_services: any[];
  diagnosed_by: string;
  diagnosed_at: string;
  status: 'pending' | 'completed' | 'approved';
  approved_by?: string;
  approved_at?: string;
}

export function useDiagnosticChecklists() {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Buscar checklists por tipo de motor e componente
  const getChecklists = async (engineTypeId?: string, component?: string) => {
    try {
      // Primeiro, tentar buscar com organização atual
      let query = supabase
        .from('diagnostic_checklists')
        .select(`
          *,
          items:diagnostic_checklist_items(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Se há organização atual, filtrar por ela
      if (currentOrganization?.id) {
        query = query.eq('org_id', currentOrganization.id);
        console.log('Buscando checklists para organização:', currentOrganization.id);
      } else {
        // Se não há organização, buscar para o usuário logado através das organizações que ele pertence
        const { data: userOrgs } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('is_active', true);
          
        if (userOrgs && userOrgs.length > 0) {
          const orgIds = userOrgs.map(org => org.organization_id);
          query = query.in('org_id', orgIds);
          console.log('Buscando checklists para organizações do usuário:', orgIds);
        } else {
          // Como último recurso, buscar todos os checklists (apenas para debug/admin)
          console.warn('Nenhuma organização encontrada, buscando todos os checklists');
        }
      }

      if (engineTypeId) {
        query = query.eq('engine_type_id', engineTypeId);
      }

      if (component) {
        query = query.eq('component', component as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro na query checklists:', error);
        throw error;
      }
      
      console.log('Checklists encontrados:', data?.length || 0);
      return data as DiagnosticChecklist[];
    } catch (error) {
      console.error('Erro ao buscar checklists:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar checklists de diagnóstico",
        variant: "destructive"
      });
      return [];
    }
  };

  // Buscar checklist específico
  const getChecklist = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_checklists')
        .select(`
          *,
          items:diagnostic_checklist_items(*)
        `)
        .eq('id', id)
        .eq('org_id', currentOrganization?.id)
        .single();

      if (error) throw error;
      return data as DiagnosticChecklist;
    } catch (error) {
      console.error('Erro ao buscar checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar checklist",
        variant: "destructive"
      });
      return null;
    }
  };

  // Criar checklist
  const createChecklist = async (checklist: Omit<DiagnosticChecklist, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      let orgId = currentOrganization?.id;
      
      // Se não há organização no contexto, buscar a primeira organização do usuário
      if (!orgId) {
        const { data: userOrgs } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('is_active', true)
          .limit(1);
          
        if (userOrgs && userOrgs.length > 0) {
          orgId = userOrgs[0].organization_id;
        }
      }
      
      if (!orgId) {
        toast({
          title: "Erro",
          description: "Nenhuma organização encontrada para o usuário",
          variant: "destructive"
        });
        return null;
      }
      
      console.log('Criando checklist para org:', orgId);
      const { data, error } = await supabase
        .from('diagnostic_checklists')
        .insert({
          ...checklist,
          org_id: orgId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar checklist:', error);
        throw error;
      }

      console.log('Checklist criado:', data);
      toast({
        title: "Sucesso",
        description: "Checklist criado com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['diagnostic-checklists'] });
      return data as DiagnosticChecklist;
    } catch (error) {
      console.error('Erro ao criar checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar checklist",
        variant: "destructive"
      });
      return null;
    }
  };

  // Atualizar checklist
  const updateChecklist = async (id: string, updates: Partial<DiagnosticChecklist>) => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_checklists')
        .update(updates)
        .eq('id', id)
        .eq('org_id', currentOrganization?.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Checklist atualizado com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['diagnostic-checklists'] });
      return data as DiagnosticChecklist;
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar checklist",
        variant: "destructive"
      });
      return null;
    }
  };

  // Deletar checklist
  const deleteChecklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('diagnostic_checklists')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrganization?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Checklist removido com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['diagnostic-checklists'] });
    } catch (error) {
      console.error('Erro ao deletar checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover checklist",
        variant: "destructive"
      });
    }
  };

  // Criar item do checklist
  const createChecklistItem = async (item: Omit<DiagnosticChecklistItem, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_checklist_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item adicionado ao checklist"
      });

      queryClient.invalidateQueries({ queryKey: ['diagnostic-checklists'] });
      return data as DiagnosticChecklistItem;
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive"
      });
      return null;
    }
  };

  // Atualizar item do checklist
  const updateChecklistItem = async (id: string, updates: Partial<DiagnosticChecklistItem>) => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['diagnostic-checklists'] });
      return data as DiagnosticChecklistItem;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar item",
        variant: "destructive"
      });
      return null;
    }
  };

  // Deletar item do checklist
  const deleteChecklistItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('diagnostic_checklist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Item removido com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['diagnostic-checklists'] });
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive"
      });
    }
  };

  // Salvar resposta do checklist
  const saveChecklistResponse = async (response: Omit<DiagnosticChecklistResponse, 'id' | 'diagnosed_at'>) => {
    try {
      const { data, error } = await supabase
        .from('diagnostic_checklist_responses')
        .insert({
          ...response,
          diagnosed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Diagnóstico salvo com sucesso"
      });

      queryClient.invalidateQueries({ queryKey: ['diagnostic-responses'] });
      return data as DiagnosticChecklistResponse;
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar diagnóstico",
        variant: "destructive"
      });
      return null;
    }
  };

  // Buscar respostas de checklist
  const getChecklistResponses = async (orderId?: string) => {
    try {
      // Buscar respostas com join nas orders para filtrar por organização
      let query = supabase
        .from('diagnostic_checklist_responses')
        .select(`
          *,
          checklist:diagnostic_checklists(*),
          order:orders!inner(id, org_id)
        `)
        .order('diagnosed_at', { ascending: false });

      // Filtrar por organização atual
      if (currentOrganization?.id) {
        query = query.eq('order.org_id', currentOrganization.id);
      }

      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Buscar nomes dos usuários separadamente
      const userIds = [...new Set(data?.map(r => r.diagnosed_by).filter(Boolean))] as string[];
      let userNames: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('user_basic_info')
          .select('user_id, name')
          .in('user_id', userIds);
          
        userNames = users?.reduce((acc, user) => ({
          ...acc,
          [user.user_id]: user.name
        }), {}) || {};
      }
      
      // Mapear os dados para incluir o nome do usuário
      const mappedData = data?.map(response => ({
        ...response,
        diagnosed_by_name: userNames[response.diagnosed_by] || response.diagnosed_by || 'Usuário não identificado'
      })) || [];
      
      return mappedData as (DiagnosticChecklistResponse & { diagnosed_by_name: string })[];
    } catch (error) {
      console.error('Erro ao buscar respostas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar diagnósticos",
        variant: "destructive"
      });
      return [];
    }
  };

  // Upload de foto para item do checklist
  const uploadChecklistPhoto = async (file: File, responseId: string, itemId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `checklist-photos/${responseId}/${itemId}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diagnostic-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return {
        url: uploadData.path,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    getChecklists,
    getChecklist,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    saveChecklistResponse,
    getChecklistResponses,
    uploadChecklistPhoto
  };
}

// Hook para usar com React Query
export function useDiagnosticChecklistsQuery(engineTypeId?: string, component?: string) {
  const { getChecklists } = useDiagnosticChecklists();
  
  return useQuery({
    queryKey: ['diagnostic-checklists', engineTypeId, component],
    queryFn: () => getChecklists(engineTypeId, component),
    enabled: true // Sempre habilitar - deixar os filtros opcionais
  });
}

export function useDiagnosticChecklistQuery(id: string) {
  const { getChecklist } = useDiagnosticChecklists();
  
  return useQuery({
    queryKey: ['diagnostic-checklist', id],
    queryFn: () => getChecklist(id),
    enabled: !!id
  });
}

export function useDiagnosticChecklistMutations() {
  const {
    createChecklist,
    updateChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    saveChecklistResponse,
    uploadChecklistPhoto
  } = useDiagnosticChecklists();

  const createChecklistMutation = useMutation({
    mutationFn: createChecklist
  });

  const updateChecklistMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DiagnosticChecklist> }) =>
      updateChecklist(id, updates)
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: deleteChecklist
  });

  const createItemMutation = useMutation({
    mutationFn: createChecklistItem
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DiagnosticChecklistItem> }) =>
      updateChecklistItem(id, updates)
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteChecklistItem
  });

  const saveResponseMutation = useMutation({
    mutationFn: saveChecklistResponse
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ file, responseId, itemId }: { file: File; responseId: string; itemId: string }) =>
      uploadChecklistPhoto(file, responseId, itemId)
  });

  return {
    createChecklist: createChecklistMutation,
    updateChecklist: updateChecklistMutation,
    deleteChecklist: deleteChecklistMutation,
    createItem: createItemMutation,
    updateItem: updateItemMutation,
    deleteItem: deleteItemMutation,
    saveResponse: saveResponseMutation,
    uploadPhoto: uploadPhotoMutation
  };
}
