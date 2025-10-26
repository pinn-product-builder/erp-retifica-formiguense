import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

/**
 * Tipos de movimentação de estoque
 */
export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'reserva' | 'baixa';

/**
 * Status de aprovação de movimentações
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Interface para movimentação de inventário
 */
export interface InventoryMovement {
  id: string;
  org_id: string;
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost?: number;
  order_id?: string;
  budget_id?: string;
  reason: string;
  notes?: string;
  requires_approval: boolean;
  approval_status?: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_by: string;
  created_at: string;
  metadata?: Record<string, any>;
  
  // Campos da view inventory_movements_with_users
  created_by_name?: string;
  approved_by_name?: string;
  part_name?: string;
  part_code?: string;
  current_stock?: number;
  order_number?: string;
}

/**
 * Interface para criar uma movimentação
 */
export interface CreateMovementData {
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  order_id?: string;
  budget_id?: string;
  reason: string;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Filtros para buscar movimentações
 */
export interface MovementFilters {
  part_id?: string;
  movement_type?: MovementType;
  start_date?: string;
  end_date?: string;
  order_id?: string;
  budget_id?: string;
}

/**
 * Hook para gerenciar movimentações de inventário
 * 
 * Funcionalidades:
 * - Buscar movimentações com filtros
 * - Criar movimentações (entrada, saída, ajuste)
 * - Validação de estoque negativo
 * - Auditoria completa
 */
export function useInventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  /**
   * Buscar movimentações com filtros opcionais
   */
  const fetchMovements = useCallback(async (filters?: MovementFilters) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);

      let query = supabase
        .from('inventory_movements_with_users' as any)
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.part_id) {
        query = query.eq('part_id', filters.part_id);
      }

      if (filters?.movement_type) {
        query = query.eq('movement_type', filters.movement_type);
      }

      if (filters?.start_date && filters?.end_date) {
        query = query
          .gte('created_at', filters.start_date)
          .lte('created_at', filters.end_date);
      }

      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id);
      }

      if (filters?.budget_id) {
        query = query.eq('budget_id', filters.budget_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as unknown as InventoryMovement[];
      setMovements(typedData);
      return typedData;
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as movimentações',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  /**
   * Criar uma movimentação de inventário
   */
  const createMovement = useCallback(async (movementData: CreateMovementData) => {
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

      // 1. Buscar quantidade atual da peça
      const { data: part, error: partError } = await supabase
        .from('parts_inventory')
        .select('quantity, part_name')
        .eq('id', movementData.part_id)
        .eq('org_id', currentOrganization.id)
        .single();

      if (partError) throw partError;
      if (!part) throw new Error('Peça não encontrada');

      // 2. Calcular nova quantidade
      let newQuantity = part.quantity;
      const quantityChange = movementData.quantity;

      switch (movementData.movement_type) {
        case 'entrada':
          newQuantity += quantityChange;
          break;
        case 'saida':
        case 'baixa':
        case 'reserva':
          newQuantity -= quantityChange;
          break;
        case 'ajuste':
          // Para ajuste, a quantidade pode ser positiva ou negativa
          newQuantity += quantityChange;
          break;
        case 'transferencia':
          // Transferência reduz do local atual
          newQuantity -= quantityChange;
          break;
      }

      // 3. Validar estoque negativo
      if (newQuantity < 0) {
        toast({
          title: 'Estoque Insuficiente',
          description: `Estoque disponível: ${part.quantity}. Tentativa de ${movementData.movement_type}: ${quantityChange}`,
          variant: 'destructive',
        });
        return null;
      }

      // 4. Criar movimentação
      const { data: userData } = await supabase.auth.getUser();

      const { data: movement, error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          org_id: currentOrganization.id,
          part_id: movementData.part_id,
          movement_type: movementData.movement_type,
          quantity: Math.abs(movementData.quantity), // Sempre positivo
          previous_quantity: part.quantity,
          new_quantity: newQuantity,
          unit_cost: movementData.unit_cost,
          order_id: movementData.order_id,
          budget_id: movementData.budget_id,
          reason: movementData.reason,
          notes: movementData.notes,
          metadata: movementData.metadata,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (movementError) throw movementError;

      toast({
        title: 'Sucesso',
        description: `Movimentação de ${part.part_name} registrada com sucesso`,
      });

      // Recarregar lista
      await fetchMovements();

      return movement as InventoryMovement;
    } catch (error: any) {
      console.error('Error creating movement:', error);
      
      // Mensagens de erro específicas
      if (error.message?.includes('Estoque não pode ficar negativo')) {
        toast({
          title: 'Estoque Insuficiente',
          description: error.message,
          variant: 'destructive',
        });
      } else if (error.message?.includes('Conflito de concorrência')) {
        toast({
          title: 'Conflito Detectado',
          description: 'O estoque foi alterado por outro usuário. Tente novamente.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível registrar a movimentação',
          variant: 'destructive',
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast, fetchMovements]);

  /**
   * Entrada manual de peças (compra, devolução, etc)
   */
  const registerEntry = useCallback(async (
    partId: string,
    quantity: number,
    unitCost: number,
    reason: string,
    notes?: string
  ) => {
    return createMovement({
      part_id: partId,
      movement_type: 'entrada',
      quantity,
      unit_cost: unitCost,
      reason,
      notes,
    });
  }, [createMovement]);

  /**
   * Saída manual (baixa por uso, venda, etc)
   */
  const registerExit = useCallback(async (
    partId: string,
    quantity: number,
    orderId: string | undefined,
    reason: string,
    notes?: string
  ) => {
    return createMovement({
      part_id: partId,
      movement_type: 'saida',
      quantity,
      order_id: orderId,
      reason,
      notes,
    });
  }, [createMovement]);

  /**
   * Ajuste de inventário (correção)
   * @param quantityDifference - Diferença (positiva = aumentar, negativa = diminuir)
   */
  const registerAdjustment = useCallback(async (
    partId: string,
    quantityDifference: number,
    reason: string,
    notes?: string
  ) => {
    return createMovement({
      part_id: partId,
      movement_type: 'ajuste',
      quantity: quantityDifference, // Pode ser positivo ou negativo
      reason,
      notes,
      metadata: { 
        adjustment_type: quantityDifference > 0 ? 'increase' : 'decrease' 
      },
    });
  }, [createMovement]);

  /**
   * Baixa de peça (descarte, perda, etc)
   */
  const registerWriteOff = useCallback(async (
    partId: string,
    quantity: number,
    reason: string,
    notes?: string
  ) => {
    return createMovement({
      part_id: partId,
      movement_type: 'baixa',
      quantity,
      reason,
      notes,
    });
  }, [createMovement]);

  /**
   * Buscar movimentações de uma peça específica
   */
  const fetchPartMovements = useCallback(async (partId: string) => {
    return fetchMovements({ part_id: partId });
  }, [fetchMovements]);

  /**
   * Buscar movimentações de uma ordem específica
   */
  const fetchOrderMovements = useCallback(async (orderId: string) => {
    return fetchMovements({ order_id: orderId });
  }, [fetchMovements]);

  /**
   * Buscar movimentações pendentes de aprovação
   */
  const fetchPendingApprovals = useCallback(async () => {
    if (!currentOrganization?.id) return [];

    try {
      const { data, error } = await supabase
        .from('inventory_movements' as any)
        .select(`
          *,
          part:parts_inventory(part_name, part_code, quantity)
        `)
        .eq('org_id', currentOrganization.id)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data as unknown as InventoryMovement[];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }, [currentOrganization?.id]);

  /**
   * Aprovar movimentação
   */
  const approveMovement = useCallback(async (movementId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('inventory_movements' as any)
        .update({
          approval_status: 'approved',
          approved_by: userData.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', movementId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Movimentação aprovada com sucesso',
      });

      // Recarregar movimentações
      await fetchMovements();

      return true;
    } catch (error) {
      console.error('Error approving movement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a movimentação',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchMovements]);

  /**
   * Rejeitar movimentação
   */
  const rejectMovement = useCallback(async (movementId: string, rejectionReason: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('inventory_movements' as any)
        .update({
          approval_status: 'rejected',
          approved_by: userData.user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', movementId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Movimentação rejeitada',
      });

      // Recarregar movimentações
      await fetchMovements();

      return true;
    } catch (error) {
      console.error('Error rejecting movement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a movimentação',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchMovements]);

  /**
   * Buscar alertas de estoque
   */
  const fetchStockAlerts = useCallback(async () => {
    if (!currentOrganization?.id) return [];

    try {
      // @ts-expect-error - Supabase type inference issue with deep instantiation
      const { data, error } = await supabase
        .from('stock_alerts')
        .select(`
          *,
          part:parts_inventory(part_name, part_code)
        `)
        .eq('org_id', currentOrganization.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      return [];
    }
  }, [currentOrganization?.id]);

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
    movements,
    loading,
    fetchMovements,
    createMovement,
    registerEntry,
    registerExit,
    registerAdjustment,
    registerWriteOff,
    fetchPartMovements,
    fetchOrderMovements,
    fetchPendingApprovals,
    approveMovement,
    rejectMovement,
    fetchStockAlerts,
    getUserName,
  };
}

