import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

/**
 * Status das contagens de inventário
 */
export type CountStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Interface para contagem de inventário (cabeçalho)
 */
export interface InventoryCount {
  id: string;
  org_id: string;
  count_number: string;
  count_type: CountType;
  count_date: string;
  status: CountStatus;
  category_filter?: string;
  location_filter?: string;
  high_rotation_only: boolean;
  counted_by?: string;
  reviewed_by?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
  updated_at: string;
  
  // Relacionamentos
  counted_by_user?: {
    name: string;
  };
  items?: InventoryCountItem[];
}

/**
 * Interface para item de contagem
 */
export interface InventoryCountItem {
  id: string;
  count_id: string;
  part_id: string;
  expected_quantity: number;
  counted_quantity?: number;
  difference?: number;
  unit_cost?: number;
  notes?: string;
  counted_by?: string;
  counted_at?: string;
  
  // Relacionamentos
  part?: {
    part_code: string;
    part_name: string;
    quantity: number;
  };
}

/**
 * Tipos de contagem de inventário
 */
export type CountType = 'total' | 'partial' | 'cyclic';

/**
 * Interface para criar contagem
 */
export interface CreateCountData {
  count_type: CountType;
  count_date: string;
  notes?: string;
  include_all_parts?: boolean; // Se true, inclui todas as peças do estoque
  part_ids?: string[]; // Ou lista específica de peças
  category_filter?: string; // Para contagem parcial por categoria
  location_filter?: string; // Para contagem parcial por localização
  high_rotation_only?: boolean; // Para contagem cíclica
}

/**
 * Interface para atualizar item contado
 */
export interface UpdateCountItemData {
  item_id: string;
  counted_quantity: number;
  notes?: string;
}

/**
 * Hook para gerenciar contagens de inventário físico
 */
export function useInventoryCounts() {
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [currentCount, setCurrentCount] = useState<InventoryCount | null>(null);
  const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  /**
   * Buscar todas as contagens
   */
  const fetchCounts = useCallback(async (status?: CountStatus) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);

      let query = supabase
        .from('inventory_counts')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCounts((data || []) as InventoryCount[]);
      return data as InventoryCount[];
    } catch (error) {
      console.error('Error fetching counts:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as contagens',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  /**
   * Buscar uma contagem específica com seus itens
   */
  const fetchCountById = useCallback(async (countId: string) => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);

      // Buscar contagem
      const { data: countData, error: countError } = await supabase
        .from('inventory_counts')
        .select('*')
        .eq('id', countId)
        .eq('org_id', currentOrganization.id)
        .single();

      if (countError) throw countError;

      // Buscar itens da contagem
      const { data: itemsData, error: itemsError } = await supabase
        .from('inventory_count_items')
        .select(`
          *,
          part:parts_inventory(part_code, part_name, quantity)
        `)
        .eq('count_id', countId)
        .order('part(part_name)');

      if (itemsError) throw itemsError;

      setCurrentCount(countData as InventoryCount);
      setCountItems((itemsData || []) as InventoryCountItem[]);

      return { count: countData, items: itemsData };
    } catch (error) {
      console.error('Error fetching count:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a contagem',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  /**
   * Criar nova contagem
   */
  const createCount = useCallback(async (countData: CreateCountData) => {
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setLoading(true);

      // 1. Gerar número da contagem
      const { data: countNumber, error: numberError } = await supabase
        .rpc('generate_inventory_count_number', { p_org_id: currentOrganization.id });

      if (numberError) throw numberError;

      // 2. Buscar usuário atual
      const { data: userData } = await supabase.auth.getUser();

      // 3. Criar contagem
      const { data: count, error: countError } = await supabase
        .from('inventory_counts')
        .insert({
          org_id: currentOrganization.id,
          count_number: countNumber,
          count_type: countData.count_type,
          count_date: countData.count_date,
          status: 'draft',
          category_filter: countData.category_filter,
          location_filter: countData.location_filter,
          high_rotation_only: countData.high_rotation_only || false,
          notes: countData.notes,
          created_by: userData.user?.id,
          counted_by: userData.user?.id,
        })
        .select()
        .single();

      if (countError) throw countError;

      // 4. Buscar peças a serem contadas baseado no tipo de contagem
      let partsQuery = supabase
        .from('parts_inventory')
        .select('id, part_code, part_name, quantity, unit_cost, component')
        .eq('org_id', currentOrganization.id);

      // Aplicar filtros baseados no tipo de contagem
      switch (countData.count_type) {
        case 'total':
          // Incluir todas as peças (sem filtros adicionais)
          break;
          
        case 'partial':
          if (countData.category_filter) {
            // @ts-expect-error - component type narrowing issue
            partsQuery = partsQuery.eq('component', countData.category_filter);
          }
          if (countData.part_ids && countData.part_ids.length > 0) {
            partsQuery = partsQuery.in('id', countData.part_ids);
          }
          break;
          
        case 'cyclic':
          // Para contagem cíclica, buscar peças com alta rotatividade
          // Isso seria baseado em movimentações recentes, mas por simplicidade
          // vamos filtrar peças com quantidade > 0 e que tenham tido movimentações
          if (countData.high_rotation_only) {
            partsQuery = partsQuery.gt('quantity', 0);
            // Aqui poderíamos adicionar um join com inventory_movements para filtrar
            // peças com alta rotatividade, mas por simplicidade vamos manter assim
          }
          break;
      }

      const { data: parts, error: partsError } = await partsQuery;
      if (partsError) throw partsError;

      // 5. Criar itens da contagem
      if (parts && parts.length > 0) {
        const items = parts.map(part => ({
          count_id: count.id,
          part_id: part.id,
          expected_quantity: part.quantity,
          unit_cost: part.unit_cost,
        }));

        const { error: itemsError } = await supabase
          .from('inventory_count_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast({
        title: 'Sucesso',
        description: `Contagem ${countData.count_type.toUpperCase()} ${countNumber} criada com ${parts?.length || 0} itens`,
      });

      await fetchCounts();
      return count as InventoryCount;
    } catch (error) {
      console.error('Error creating count:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a contagem',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast, fetchCounts]);

  /**
   * Iniciar contagem (mudar status para in_progress)
   */
  const startCount = useCallback(async (countId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_counts')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', countId);

      if (error) throw error;

      toast({
        title: 'Contagem Iniciada',
        description: 'A contagem está agora em andamento',
      });

      await fetchCounts();
      if (currentCount?.id === countId) {
        await fetchCountById(countId);
      }
    } catch (error) {
      console.error('Error starting count:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a contagem',
        variant: 'destructive',
      });
    }
  }, [toast, fetchCounts, fetchCountById, currentCount?.id]);

  /**
   * Atualizar quantidade contada de um item
   */
  const updateCountItem = useCallback(async (updateData: UpdateCountItemData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('inventory_count_items')
        .update({
          counted_quantity: updateData.counted_quantity,
          notes: updateData.notes,
          counted_by: userData.user?.id,
          counted_at: new Date().toISOString(),
        })
        .eq('id', updateData.item_id);

      if (error) throw error;

      // Atualizar lista local
      if (currentCount) {
        await fetchCountById(currentCount.id);
      }

      return true;
    } catch (error) {
      console.error('Error updating count item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o item',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, currentCount, fetchCountById]);

  /**
   * Processar contagem e criar ajustes automáticos
   */
  const processCount = useCallback(async (countId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .rpc('process_inventory_count_adjustments', { p_count_id: countId });

      if (error) throw error;

      toast({
        title: 'Contagem Processada',
        description: 'Ajustes de inventário foram criados automaticamente',
      });

      await fetchCounts();
      return true;
    } catch (error: any) {
      console.error('Error processing count:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar a contagem',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchCounts]);

  /**
   * Cancelar contagem
   */
  const cancelCount = useCallback(async (countId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_counts')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', countId);

      if (error) throw error;

      toast({
        title: 'Contagem Cancelada',
        description: 'A contagem foi cancelada',
      });

      await fetchCounts();
    } catch (error) {
      console.error('Error cancelling count:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a contagem',
        variant: 'destructive',
      });
    }
  }, [toast, fetchCounts]);

  /**
   * Gerar relatório de divergências
   */
  const getDivergenceReport = useCallback((items: InventoryCountItem[]) => {
    const divergences = items.filter(
      item => item.counted_quantity !== undefined && item.difference !== 0
    );

    const totalDivergences = divergences.length;
    const totalIncrease = divergences
      .filter(item => (item.difference || 0) > 0)
      .reduce((sum, item) => sum + (item.difference || 0), 0);
    const totalDecrease = divergences
      .filter(item => (item.difference || 0) < 0)
      .reduce((sum, item) => sum + Math.abs(item.difference || 0), 0);
    
    const financialImpact = divergences.reduce(
      (sum, item) => sum + ((item.difference || 0) * (item.unit_cost || 0)),
      0
    );

    return {
      totalItems: items.length,
      totalCounted: items.filter(item => item.counted_quantity !== undefined).length,
      totalDivergences,
      totalIncrease,
      totalDecrease,
      financialImpact,
      divergences,
    };
  }, []);

  /**
   * Buscar nome do usuário por ID (função auxiliar)
   */
  const getUserName = useCallback(async (userId: string | null | undefined): Promise<string> => {
    if (!userId) return 'N/A';
    
    try {
      const { data } = await supabase
        .from('user_basic_info')
        .select('name')
        .eq('user_id', userId)
        .single();
      
      return data?.name || 'Usuário';
    } catch {
      return 'Usuário';
    }
  }, []);

  return {
    counts,
    currentCount,
    countItems,
    loading,
    fetchCounts,
    fetchCountById,
    createCount,
    startCount,
    updateCountItem,
    processCount,
    cancelCount,
    getDivergenceReport,
    getUserName,
  };
}

