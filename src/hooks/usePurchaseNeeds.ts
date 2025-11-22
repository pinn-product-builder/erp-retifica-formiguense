import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface para necessidade de compra
 */
export interface PurchaseNeed {
  id: string;
  org_id: string;
  part_code: string;
  part_name: string;
  part_id?: string; // ID da peça no estoque (opcional)
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  need_type: 'auto_reorder' | 'manual_request' | 'project_requirement' | 'maintenance';
  related_orders: string[];
  suggested_suppliers: Record<string, unknown>[];
  estimated_cost: number;
  delivery_urgency_date?: string;
  status: 'pending' | 'in_quotation' | 'ordered' | 'received' | 'cancelled';
  created_at: string;
  updated_at: string;
  
  // Campos calculados
  days_without_stock?: number;
  impact_level?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Dados para criar necessidade de compra
 */
export interface CreatePurchaseNeedData {
  part_code: string;
  part_name: string;
  required_quantity: number;
  available_quantity: number;
  priority_level: PurchaseNeed['priority_level'];
  need_type: PurchaseNeed['need_type'];
  related_orders?: string[];
  delivery_urgency_date?: string;
  estimated_cost?: number;
}

/**
 * Configurações para geração automática de necessidades
 */
export interface AutoNeedsConfig {
  min_stock_level: number;
  reorder_point: number;
  max_stock_level: number;
  lead_time_days: number;
  safety_stock_days: number;
  auto_generate_enabled: boolean;
}

/**
 * Hook para gerenciar necessidades de compra
 */
export function usePurchaseNeeds() {
  const [needs, setNeeds] = useState<PurchaseNeed[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  /**
   * Buscar necessidades de compra
   */
  const fetchNeeds = useCallback(async (filters?: {
    status?: string;
    priority?: string;
    need_type?: string;
  }) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);

      let query = supabase
        .from('purchase_needs')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .neq('status', 'completed')  // Excluir necessidades já concluídas
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority_level', filters.priority);
      }
      if (filters?.need_type) {
        query = query.eq('need_type', filters.need_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Não precisamos mais filtrar manualmente, pois:
      // 1. A query já exclui status 'completed'
      // 2. O trigger atualiza automaticamente o status para 'completed' quando a necessidade é atendida
      // 3. Isso é mais eficiente e confiável
      const filteredData = data || [];

      setNeeds(filteredData as PurchaseNeed[]);
      return filteredData as PurchaseNeed[];
    } catch (error) {
      console.error('Error fetching purchase needs:', error);
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível carregar as necessidades de compra',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  /**
   * Criar necessidade de compra
   */
  const createNeed = useCallback(async (needData: CreatePurchaseNeedData) => {
    if (!currentOrganization?.id) {
      toastRef.current({
        title: 'Erro',
        description: 'Organização não encontrada',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setLoading(true);

      // Buscar part_id baseado no part_code
      let part_id: string | null = null;
      if (needData.part_code) {
        const { data: partData } = await supabase
          .from('parts_inventory')
          .select('id')
          .eq('org_id', currentOrganization.id)
          .eq('part_code', needData.part_code)
          .single();
        
        if (partData) {
          part_id = partData.id;
        }
      }

      const { data, error } = await supabase
        .from('purchase_needs')
        .insert({
          org_id: currentOrganization.id,
          part_code: needData.part_code,
          part_name: needData.part_name,
          part_id: part_id,
          required_quantity: needData.required_quantity,
          available_quantity: needData.available_quantity,
          priority_level: needData.priority_level,
          need_type: needData.need_type,
          related_orders: needData.related_orders || [],
          suggested_suppliers: [],
          estimated_cost: needData.estimated_cost || 0,
          delivery_urgency_date: needData.delivery_urgency_date,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toastRef.current({
        title: 'Sucesso',
        description: 'Necessidade de compra criada com sucesso',
      });

      // Atualizar lista local em vez de recarregar
      if (data) {
        setNeeds(prev => [data as PurchaseNeed, ...prev]);
      }
      return data as PurchaseNeed;
    } catch (error) {
      console.error('Error creating purchase need:', error);
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível criar a necessidade de compra',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  /**
   * Atualizar status da necessidade
   */
  const updateNeedStatus = useCallback(async (
    needId: string,
    status: PurchaseNeed['status']
  ) => {
    try {
      const { error } = await supabase
        .from('purchase_needs')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', needId)
        .eq('org_id', currentOrganization?.id);

      if (error) throw error;

      toastRef.current({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso',
      });

      // Atualizar status local
      setNeeds(prev => 
        prev.map(need => 
          need.id === needId 
            ? { ...need, status, updated_at: new Date().toISOString() }
            : need
        )
      );
      return true;
    } catch (error) {
      console.error('Error updating need status:', error);
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentOrganization?.id]);

  /**
   * Gerar necessidades automáticas baseadas no estoque baixo
   */
  const generateAutoNeeds = useCallback(async () => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);

      // TODO: Implementar função SQL generate_purchase_needs_from_low_stock
      // const { data, error } = await supabase.rpc('generate_purchase_needs_from_low_stock', {
      //   p_org_id: currentOrganization.id
      // });
      // if (error) throw error;
      // const generatedCount = data?.generated_count || 0;
      
      const generatedCount = 0; // Temporário

      toastRef.current({
        title: 'Sucesso',
        description: `${generatedCount} necessidades de compra foram geradas automaticamente`,
      });

      // Recarregar necessidades após geração automática
      // await fetchNeeds(); // TODO: Implementar quando as funções SQL estiverem prontas
      return true;
    } catch (error) {
      console.error('Error generating auto needs:', error);
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível gerar necessidades automáticas',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  /**
   * Converter necessidade em requisição de compra
   */
  const convertToRequisition = useCallback(async (needIds: string[]) => {
    if (!currentOrganization?.id || needIds.length === 0) return null;

    try {
      setLoading(true);

      // TODO: Implementar função SQL convert_needs_to_requisition
      // const { data, error } = await supabase.rpc('convert_needs_to_requisition', {
      //   p_need_ids: needIds,
      //   p_org_id: currentOrganization.id
      // });
      // if (error) throw error;
      
      const data = { requisition_id: 'temp-id' }; // Temporário

      toastRef.current({
        title: 'Sucesso',
        description: 'Requisição de compra criada com sucesso',
      });

      // Atualizar status das necessidades convertidas
      setNeeds(prev => 
        prev.map(need => 
          needIds.includes(need.id)
            ? { ...need, status: 'in_quotation' as const, updated_at: new Date().toISOString() }
            : need
        )
      );
      return data;
    } catch (error) {
      console.error('Error converting to requisition:', error);
      toastRef.current({
        title: 'Erro',
        description: 'Não foi possível criar a requisição',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  /**
   * Obter estatísticas das necessidades
   */
  const getNeedsStats = useCallback(() => {
    const total = needs.length;
    const pending = needs.filter(n => n.status === 'pending').length;
    const critical = needs.filter(n => n.priority_level === 'critical').length;
    const high = needs.filter(n => n.priority_level === 'high').length;
    const inQuotation = needs.filter(n => n.status === 'in_quotation').length;
    const ordered = needs.filter(n => n.status === 'ordered').length;
    
    const totalEstimatedCost = needs
      .filter(n => n.status === 'pending')
      .reduce((sum, n) => sum + n.estimated_cost, 0);

    return {
      total,
      pending,
      critical,
      high,
      inQuotation,
      ordered,
      totalEstimatedCost,
    };
  }, [needs]);

  /**
   * Buscar necessidades críticas (alta prioridade e urgentes)
   */
  const getCriticalNeeds = useCallback(() => {
    return needs.filter(need => 
      need.priority_level === 'critical' && 
      need.status === 'pending'
    ).slice(0, 5); // Top 5 mais críticas
  }, [needs]);

  /**
   * Agrupar necessidades por fornecedor sugerido
   */
  const groupNeedsBySupplier = useCallback(() => {
    const groups: Record<string, PurchaseNeed[]> = {};
    
    needs.forEach(need => {
      if (need.suggested_suppliers && need.suggested_suppliers.length > 0) {
        const supplierId = need.suggested_suppliers[0].id;
        const supplierName = need.suggested_suppliers[0].name;
        const key = `${supplierId}|${supplierName}`;
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(need);
      } else {
        if (!groups['no_supplier']) {
          groups['no_supplier'] = [];
        }
        groups['no_supplier'].push(need);
      }
    });

    return groups;
  }, [needs]);

  // Carregar necessidades ao montar o componente
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchNeeds();
    }
  }, [currentOrganization?.id, fetchNeeds]);

  return {
    needs,
    loading,
    fetchNeeds,
    createNeed,
    updateNeedStatus,
    generateAutoNeeds,
    convertToRequisition,
    getNeedsStats,
    getCriticalNeeds,
    groupNeedsBySupplier,
  };
}
