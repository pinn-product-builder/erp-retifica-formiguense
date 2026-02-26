import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import {
  reservationService,
  type PartReservation,
  type ReservationResult,
  type ReservationFilters,
  type ReservationStats,
  type PaginatedReservations,
} from '@/services/ReservationService';

export type { PartReservation, ReservationResult, ReservationFilters, ReservationStats };

export interface ReservationPagination {
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<PartReservation[]>([]);
  const [pagination, setPagination] = useState<ReservationPagination>({
    count: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const applyPagination = (result: PaginatedReservations) => {
    setReservations(result.data);
    setPagination({
      count: result.count,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  };

  const fetchReservations = useCallback(
    async (filters?: ReservationFilters, page = 1) => {
      if (!currentOrganization?.id) return [];
      try {
        setLoading(true);
        const result = await reservationService.listReservations(currentOrganization.id, filters, page);
        applyPagination(result);
        return result.data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível carregar as reservas';
        toast({ variant: 'destructive', title: 'Erro ao carregar reservas', description: msg });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, toast]
  );

  const reservePartsFromBudget = useCallback(
    async (budgetId: string): Promise<ReservationResult | null> => {
      if (!currentOrganization?.id) return null;
      try {
        setLoading(true);
        const result = await reservationService.reservePartsFromBudget(budgetId);
        if (result.success) {
          const msg = `${result.reservations.length} peças reservadas com sucesso${
            result.needs.length > 0 ? `. ${result.needs.length} necessidades de compra criadas` : ''
          }`;
          toast({ title: 'Reservas processadas', description: msg });
        }
        await fetchReservations();
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível processar as reservas';
        toast({ variant: 'destructive', title: 'Erro ao reservar peças', description: msg });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchReservations, toast]
  );

  const consumeReservedParts = useCallback(
    async (orderId: string, parts: Array<{ part_code: string; quantity: number }>): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const result = await reservationService.consumeReservedParts(orderId, parts);
        if (result.success) {
          const consumed = (result.consumed as unknown[]).length;
          const errors = (result.errors as unknown[]).length;
          toast({
            title: 'Peças consumidas',
            description: `${consumed} peças consumidas com sucesso${errors > 0 ? `. ${errors} itens com erro.` : ''}`,
          });
          await fetchReservations();
          return consumed > 0;
        }
        return false;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível consumir as peças reservadas';
        toast({ variant: 'destructive', title: 'Erro ao consumir peças', description: msg });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchReservations, toast]
  );

  const cancelReservation = useCallback(
    async (reservationId: string, reason?: string): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const result = await reservationService.cancelReservation(reservationId, reason);
        if (!result.success) {
          toast({ variant: 'destructive', title: 'Erro ao cancelar reserva', description: result.error ?? 'Não foi possível cancelar' });
          return false;
        }
        toast({ title: 'Reserva cancelada', description: `${result.quantity_released ?? 0} unidades liberadas para o estoque` });
        await fetchReservations();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível cancelar a reserva';
        toast({ variant: 'destructive', title: 'Erro ao cancelar reserva', description: msg });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchReservations, toast]
  );

  const extendReservation = useCallback(
    async (reservationId: string, additionalDays: number): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const result = await reservationService.extendReservation(reservationId, additionalDays);
        if (!result.success) {
          toast({ variant: 'destructive', title: 'Erro ao estender reserva', description: result.error ?? 'Não foi possível estender' });
          return false;
        }
        const newDate = result.new_expires_at ? new Date(result.new_expires_at).toLocaleDateString('pt-BR') : '';
        toast({ title: 'Reserva estendida', description: `Prazo estendido por ${additionalDays} dias${newDate ? `. Nova validade: ${newDate}` : ''}` });
        await fetchReservations();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível estender o prazo';
        toast({ variant: 'destructive', title: 'Erro ao estender reserva', description: msg });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchReservations, toast]
  );

  const separateReservedParts = useCallback(
    async (reservationId: string, quantityToSeparate: number): Promise<boolean> => {
      if (!currentOrganization?.id) return false;
      try {
        setLoading(true);
        const result = await reservationService.separateReservedParts(reservationId, quantityToSeparate);
        if (!result.success) {
          toast({ variant: 'destructive', title: 'Erro ao separar peças', description: result.error ?? 'Não foi possível separar' });
          return false;
        }
        toast({ title: 'Peças separadas', description: `${result.quantity_separated} unidades separadas com sucesso` });
        await fetchReservations();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Não foi possível separar as peças';
        toast({ variant: 'destructive', title: 'Erro ao separar peças', description: msg });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchReservations, toast]
  );

  const getExpiringReservations = useCallback(
    async (daysAhead = 7): Promise<PartReservation[]> => {
      if (!currentOrganization?.id) return [];
      try {
        return await reservationService.getExpiringReservations(currentOrganization.id, daysAhead);
      } catch {
        return [];
      }
    },
    [currentOrganization?.id]
  );

  const getReservationStats = useCallback(
    async (): Promise<ReservationStats | null> => {
      if (!currentOrganization?.id) return null;
      try {
        return await reservationService.getStats(currentOrganization.id);
      } catch {
        return null;
      }
    },
    [currentOrganization?.id]
  );

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchReservations();
    }
  }, [currentOrganization?.id, fetchReservations]);

  return {
    reservations,
    pagination,
    loading,
    fetchReservations,
    reservePartsFromBudget,
    consumeReservedParts,
    separateReservedParts,
    cancelReservation,
    extendReservation,
    getExpiringReservations,
    getReservationStats,
  };
};
