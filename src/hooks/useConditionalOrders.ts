import { useState, useCallback } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ConditionalOrderService,
  type ConditionalOrder,
  type CreateConditionalOrderData,
  type ItemDecision,
  type PaginatedConditionals,
} from '@/services/ConditionalOrderService';

export function useConditionalOrders() {
  const [conditionals, setConditionals] = useState<ConditionalOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchConditionals = useCallback(
    async (params: { page?: number; status?: string; search?: string } = {}) => {
      if (!currentOrganization?.id) return;

      try {
        setLoading(true);
        const page = params.page ?? currentPage;

        await ConditionalOrderService.markOverdue(currentOrganization.id);

        const result: PaginatedConditionals = await ConditionalOrderService.list(
          currentOrganization.id,
          { page, pageSize: PAGE_SIZE, ...params }
        );

        setConditionals(result.data);
        setTotalCount(result.count);
        setCurrentPage(result.page);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('Error fetching conditionals:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os pedidos condicionais',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, currentPage, toast]
  );

  const createConditional = useCallback(
    async (data: CreateConditionalOrderData): Promise<ConditionalOrder | null> => {
      if (!currentOrganization?.id) return null;

      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? '';

        const created = await ConditionalOrderService.create(
          currentOrganization.id,
          userId,
          data
        );

        toast({ title: 'Sucesso', description: `Condicional ${created.conditional_number} criada com sucesso` });
        await fetchConditionals({ page: 1 });
        return created;
      } catch (error) {
        console.error('Error creating conditional:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o pedido condicional',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchConditionals, toast]
  );

  const applyDecisions = useCallback(
    async (
      conditionalId: string,
      decisions: ItemDecision[],
      justification?: string
    ): Promise<boolean> => {
      if (!currentOrganization?.id) return false;

      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id ?? '';

        await ConditionalOrderService.applyDecisions(
          conditionalId,
          currentOrganization.id,
          userId,
          decisions,
          justification
        );

        toast({ title: 'Sucesso', description: 'Decisão registrada com sucesso' });
        await fetchConditionals();
        return true;
      } catch (error) {
        console.error('Error applying decisions:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível registrar a decisão',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchConditionals, toast]
  );

  const cancelConditional = useCallback(
    async (conditionalId: string): Promise<boolean> => {
      if (!currentOrganization?.id) return false;

      try {
        setLoading(true);
        await ConditionalOrderService.updateStatus(conditionalId, currentOrganization.id, 'returned');
        toast({ title: 'Sucesso', description: 'Condicional cancelada com sucesso' });
        await fetchConditionals();
        return true;
      } catch (error) {
        console.error('Error cancelling conditional:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível cancelar a condicional',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [currentOrganization?.id, fetchConditionals, toast]
  );

  const stats = {
    pending: conditionals.filter((c) => c.status === 'pending').length,
    in_analysis: conditionals.filter((c) => c.status === 'in_analysis').length,
    overdue: conditionals.filter((c) => c.status === 'overdue').length,
    totalValue: conditionals.reduce((sum, c) => sum + c.total_amount, 0),
  };

  return {
    conditionals,
    loading,
    totalCount,
    currentPage,
    totalPages,
    PAGE_SIZE,
    stats,
    fetchConditionals,
    createConditional,
    applyDecisions,
    cancelConditional,
    setCurrentPage,
  };
}
