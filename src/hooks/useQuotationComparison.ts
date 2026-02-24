import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ComparisonService,
  type ComparisonItem,
} from '@/services/ComparisonService';

export function useQuotationComparison(quotationId: string | null) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const [items,     setItems]     = useState<ComparisonItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComparison = useCallback(async () => {
    if (!quotationId) { setItems([]); return; }
    try {
      setIsLoading(true);
      const data = await ComparisonService.getComparison(quotationId);
      setItems(data);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar o comparativo', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [quotationId, toast]);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  const selectProposal = async (
    itemId: string,
    proposalId: string,
    justification?: string
  ): Promise<boolean> => {
    if (!quotationId || !user?.id) return false;
    try {
      await ComparisonService.selectProposal(quotationId, itemId, proposalId, user.id, justification);
      toast({ title: 'Proposta selecionada como vencedora' });
      await fetchComparison();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível selecionar a proposta', variant: 'destructive' });
      return false;
    }
  };

  const generatePurchaseOrders = async (deliveryAddress?: string): Promise<string[] | null> => {
    if (!quotationId || !currentOrganization?.id || !user?.id) return null;
    try {
      const poNumbers = await ComparisonService.generatePurchaseOrders(
        quotationId,
        currentOrganization.id,
        user.id,
        deliveryAddress
      );
      toast({
        title: `${poNumbers.length} Pedido(s) de Compra gerado(s)`,
        description: poNumbers.join(', '),
      });
      await fetchComparison();
      return poNumbers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar pedidos';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      return null;
    }
  };

  const allSelected = items.length > 0 && items.every(item => item.proposals.some(p => p.is_selected));

  return {
    items,
    isLoading,
    allSelected,
    refresh: fetchComparison,
    selectProposal,
    generatePurchaseOrders,
  };
}
