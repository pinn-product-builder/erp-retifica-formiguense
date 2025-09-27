import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface Consultant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  commission_rate: number;
  is_active: boolean;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export function useConsultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  // Buscar consultores
  const fetchConsultants = useCallback(async (searchTerm?: string) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);
      let query = supabase
        .from('consultants')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const consultantsData = data as Consultant[];
      setConsultants(consultantsData);
      return consultantsData;
    } catch (error) {
      console.error('Erro ao buscar consultores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar consultores",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Buscar consultor por ID
  const getConsultantById = useCallback(async (consultantId: string) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('id', consultantId)
        .eq('org_id', currentOrganization.id)
        .single();

      if (error) throw error;
      return data as Consultant;
    } catch (error) {
      console.error('Erro ao buscar consultor:', error);
      return null;
    }
  }, [currentOrganization?.id]);

  // Criar consultor
  const createConsultant = useCallback(async (consultantData: Omit<Consultant, 'id' | 'org_id' | 'created_at' | 'updated_at'>) => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultants')
        .insert({
          ...consultantData,
          org_id: currentOrganization.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Consultor cadastrado com sucesso"
      });

      // Atualizar lista local
      setConsultants(prev => [data as Consultant, ...prev]);
      return data as Consultant;
    } catch (error) {
      console.error('Erro ao criar consultor:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar consultor",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Atualizar consultor
  const updateConsultant = useCallback(async (consultantId: string, updates: Partial<Consultant>) => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultants')
        .update(updates)
        .eq('id', consultantId)
        .eq('org_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Consultor atualizado com sucesso"
      });

      // Atualizar lista local
      setConsultants(prev => prev.map(c => c.id === consultantId ? data as Consultant : c));
      return data as Consultant;
    } catch (error) {
      console.error('Erro ao atualizar consultor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar consultor",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Deletar consultor
  const deleteConsultant = useCallback(async (consultantId: string) => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('consultants')
        .delete()
        .eq('id', consultantId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Consultor excluído com sucesso"
      });

      // Atualizar lista local
      setConsultants(prev => prev.filter(c => c.id !== consultantId));
      return true;
    } catch (error) {
      console.error('Erro ao excluir consultor:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir consultor",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Alternar status ativo/inativo
  const toggleConsultantStatus = useCallback(async (consultantId: string, isActive: boolean) => {
    return await updateConsultant(consultantId, { is_active: isActive });
  }, [updateConsultant]);

  return {
    consultants,
    loading,
    fetchConsultants,
    getConsultantById,
    createConsultant,
    updateConsultant,
    deleteConsultant,
    toggleConsultantStatus
  };
}
