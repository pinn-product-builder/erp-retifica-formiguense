import { useState, useCallback } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  stockMovementService,
  type InventoryMovement,
  type CreateMovementInput,
  type MovementFilters,
  type MovementType,
  type ApprovalStatus,
} from '@/services/StockMovementService';
import { stockAlertService } from '@/services/StockAlertService';
import type { PaginatedResult } from '@/services/InventoryService';

const PAGE_SIZE = 20;

export type { MovementType, ApprovalStatus, InventoryMovement, CreateMovementInput, MovementFilters };

export function useInventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResult<InventoryMovement>, 'data'>>({
    count: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchMovements = useCallback(
    async (filters?: MovementFilters, page = 1) => {
      if (!currentOrganization?.id) return [];
      try {
        setLoading(true);
        const result = await stockMovementService.listMovements(
          currentOrganization.id,
          filters,
          page,
          PAGE_SIZE
        );
        setMovements(result.data);
        setPagination({
          count: result.count,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        });
        return result.data;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível carregar as movimentações', variant: 'destructive' });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const createMovement = useCallback(
    async (movementData: CreateMovementInput) => {
      if (!currentOrganization?.id) {
        toast({ title: 'Erro', description: 'Organização não encontrada', variant: 'destructive' });
        return null;
      }
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const movement = await stockMovementService.createMovement(
          currentOrganization.id,
          userData.user?.id ?? '',
          movementData
        );
        toast({ title: 'Sucesso', description: 'Movimentação registrada com sucesso' });
        await fetchMovements();
        return movement;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Não foi possível registrar a movimentação';
        if (msg.includes('Estoque insuficiente') || msg.includes('Estoque não pode ficar negativo')) {
          toast({ title: 'Estoque Insuficiente', description: msg, variant: 'destructive' });
        } else if (msg.includes('Conflito')) {
          toast({ title: 'Conflito Detectado', description: 'O estoque foi alterado por outro usuário. Tente novamente.', variant: 'destructive' });
        } else {
          toast({ title: 'Erro', description: msg, variant: 'destructive' });
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchMovements, toast]
  );

  const registerEntry = useCallback(
    async (partId: string, quantity: number, unitCost: number, reason: string, notes?: string) =>
      createMovement({ part_id: partId, movement_type: 'entrada', quantity, unit_cost: unitCost, reason, notes }),
    [createMovement]
  );

  const registerExit = useCallback(
    async (partId: string, quantity: number, orderId: string | undefined, reason: string, notes?: string) =>
      createMovement({ part_id: partId, movement_type: 'saida', quantity, order_id: orderId, reason, notes }),
    [createMovement]
  );

  const registerAdjustment = useCallback(
    async (partId: string, quantityDifference: number, reason: string, notes?: string) =>
      createMovement({
        part_id: partId,
        movement_type: 'ajuste',
        quantity: quantityDifference,
        reason,
        notes,
        metadata: { adjustment_type: quantityDifference > 0 ? 'increase' : 'decrease' },
      }),
    [createMovement]
  );

  const registerWriteOff = useCallback(
    async (partId: string, quantity: number, reason: string, notes?: string) =>
      createMovement({ part_id: partId, movement_type: 'baixa', quantity, reason, notes }),
    [createMovement]
  );

  const fetchPartMovements = useCallback(
    async (partId: string) => fetchMovements({ part_id: partId }),
    [fetchMovements]
  );

  const fetchOrderMovements = useCallback(
    async (orderId: string) => fetchMovements({ order_id: orderId }),
    [fetchMovements]
  );

  const fetchPendingApprovals = useCallback(async () => {
    if (!currentOrganization?.id) return [];
    try {
      return await stockMovementService.fetchPendingApprovals(currentOrganization.id);
    } catch {
      return [];
    }
  }, [currentOrganization?.id]);

  const approveMovement = useCallback(
    async (movementId: string) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        await stockMovementService.approveMovement(movementId, userData.user?.id ?? '');
        toast({ title: 'Sucesso', description: 'Movimentação aprovada com sucesso' });
        await fetchMovements();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível aprovar a movimentação', variant: 'destructive' });
        return false;
      }
    },
    [fetchMovements, toast]
  );

  const rejectMovement = useCallback(
    async (movementId: string, rejectionReason: string) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        await stockMovementService.rejectMovement(movementId, userData.user?.id ?? '', rejectionReason);
        toast({ title: 'Sucesso', description: 'Movimentação rejeitada' });
        await fetchMovements();
        return true;
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível rejeitar a movimentação', variant: 'destructive' });
        return false;
      }
    },
    [fetchMovements, toast]
  );

  const fetchStockAlerts = useCallback(async () => {
    if (!currentOrganization?.id) return [];
    try {
      return await stockAlertService.getActiveAlerts(currentOrganization.id);
    } catch {
      return [];
    }
  }, [currentOrganization?.id]);

  const getUserName = useCallback(async (userId: string | null | undefined): Promise<string> => {
    if (!userId) return 'N/A';
    try {
      const { data } = await supabase
        .from('user_basic_info')
        .select('name')
        .eq('user_id', userId)
        .single();
      return data?.name ?? 'Usuário';
    } catch {
      return 'Usuário';
    }
  }, []);

  return {
    movements,
    pagination,
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
