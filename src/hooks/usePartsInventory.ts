import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export type ComponentType = 'bloco' | 'cabecote' | 'virabrequim' | 'pistao' | 'biela' | 'comando' | 'eixo';
export type PartStatus = 'disponivel' | 'reservado' | 'usado' | 'pendente';

export interface PartInventory {
  id: string;
  order_id?: string | null;
  part_name: string;
  part_code?: string | null;
  quantity: number;
  unit_cost: number;
  supplier?: string | null;
  component?: ComponentType | null;
  status: PartStatus;
  separated_at?: string | null;
  applied_at?: string | null;
  notes?: string | null;
  created_at: string;
  org_id?: string | null;
}

export interface CreatePartData {
  part_name: string;
  part_code?: string;
  quantity: number;
  unit_cost: number;
  supplier?: string;
  component?: ComponentType;
  status?: PartStatus;
  notes?: string;
}

export function usePartsInventory() {
  const [parts, setParts] = useState<PartInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchParts = useCallback(async (filters?: {
    status?: string;
    component?: string;
    search?: string;
  }) => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      let query = supabase
        .from('parts_inventory')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.status && filters.status !== 'todos') {
        query = query.eq('status', filters.status);
      }

      if (filters?.component && filters.component !== 'todos') {
        query = query.eq('component', filters.component as any);
      }

      if (filters?.search) {
        query = query.or(`part_name.ilike.%${filters.search}%,part_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setParts((data || []) as PartInventory[]);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o estoque',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  const createPart = async (partData: CreatePartData): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('parts_inventory')
        .insert({
          ...partData,
          org_id: currentOrganization.id,
          status: partData.status || 'disponivel',
        });

      if (error) throw error;

      toast({
        title: 'Peça adicionada',
        description: `${partData.part_name} foi adicionada ao estoque`,
      });

      await fetchParts();
      return true;
    } catch (error) {
      console.error('Error creating part:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a peça',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePart = async (partId: string, partData: Partial<CreatePartData>): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('parts_inventory')
        .update(partData)
        .eq('id', partId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: 'Peça atualizada',
        description: 'As informações da peça foram atualizadas',
      });

      await fetchParts();
      return true;
    } catch (error) {
      console.error('Error updating part:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a peça',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePart = async (partId: string): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('parts_inventory')
        .delete()
        .eq('id', partId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: 'Peça removida',
        description: 'A peça foi removida do estoque',
      });

      await fetchParts();
      return true;
    } catch (error) {
      console.error('Error deleting part:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a peça',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (partId: string, newQuantity: number): Promise<boolean> => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('parts_inventory')
        .update({ quantity: newQuantity })
        .eq('id', partId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: 'Quantidade atualizada',
        description: `Quantidade alterada para ${newQuantity}`,
      });

      await fetchParts();
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a quantidade',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableParts = useCallback(async (component?: string): Promise<PartInventory[]> => {
    if (!currentOrganization?.id) return [];

    try {
      let query = supabase
        .from('parts_inventory')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('status', 'disponivel')
        .gt('quantity', 0)
        .order('part_name');

      if (component) {
        query = query.eq('component', component as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as PartInventory[];
    } catch (error) {
      console.error('Error fetching available parts:', error);
      return [];
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchParts();
    }
  }, [currentOrganization?.id, fetchParts]);

  return {
    parts,
    loading,
    fetchParts,
    createPart,
    updatePart,
    deletePart,
    updateQuantity,
    getAvailableParts,
  };
}

