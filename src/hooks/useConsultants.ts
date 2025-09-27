import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface Consultant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  commission_rate: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  org_id?: string;
}

export interface CreateConsultantData {
  name: string;
  email?: string;
  phone?: string;
  commission_rate?: number;
  active?: boolean;
}

export function useConsultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchConsultants = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('name');

      if (error) throw error;

      setConsultants(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar consultores';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConsultant = async (consultantData: CreateConsultantData) => {
    if (!currentOrganization?.id) return false;

    try {
      const { data, error } = await supabase
        .from('consultants')
        .insert({
          ...consultantData,
          org_id: currentOrganization.id,
          commission_rate: consultantData.commission_rate || 0,
          active: consultantData.active ?? true
        })
        .select()
        .single();

      if (error) throw error;

      setConsultants(prev => [...prev, data]);
      
      toast({
        title: "Sucesso",
        description: "Consultor criado com sucesso.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar consultor';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateConsultant = async (id: string, updates: Partial<CreateConsultantData>) => {
    if (!currentOrganization?.id) return false;

    try {
      const { data, error } = await supabase
        .from('consultants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('org_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;

      setConsultants(prev => 
        prev.map(consultant => 
          consultant.id === id ? { ...consultant, ...data } : consultant
        )
      );

      toast({
        title: "Sucesso",
        description: "Consultor atualizado com sucesso.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar consultor';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteConsultant = async (id: string) => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await supabase
        .from('consultants')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      setConsultants(prev => prev.filter(consultant => consultant.id !== id));

      toast({
        title: "Sucesso",
        description: "Consultor removido com sucesso.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover consultor';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleConsultantStatus = async (id: string) => {
    const consultant = consultants.find(c => c.id === id);
    if (!consultant) return false;

    return await updateConsultant(id, { active: !consultant.active });
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchConsultants();
    }
  }, [currentOrganization?.id]);

  return {
    consultants,
    loading,
    error,
    fetchConsultants,
    createConsultant,
    updateConsultant,
    deleteConsultant,
    toggleConsultantStatus
  };
}
