import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  QuotationService,
  EDITABLE_STATUSES,
  type Quotation,
  type QuotationItem,
  type QuotationFilters,
  type QuotationHeaderFormData,
  type QuotationItemFormData,
  type ProposalFormData,
  type QuotationStatus,
  type PaginatedQuotations,
} from '@/services/QuotationService';

const ITEMS_PER_PAGE = 10;

export function useQuotations(initialFilters: QuotationFilters = {}) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const [result, setResult] = useState<PaginatedQuotations>({
    data: [], count: 0, page: 1, pageSize: ITEMS_PER_PAGE, totalPages: 0,
  });
  const [isLoading, setIsLoading]   = useState(false);
  const [filters,    setFiltersState] = useState<QuotationFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchQuotations = useCallback(async (page = currentPage, f = filters) => {
    if (!currentOrganization?.id) return;
    try {
      setIsLoading(true);
      const data = await QuotationService.getQuotations(currentOrganization.id, f, page, ITEMS_PER_PAGE);
      setResult(data);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar cotações', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, currentPage, filters, toast]);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const setFilters = (newFilters: QuotationFilters) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchQuotations(page);
  };

  const createQuotation = async (data: QuotationHeaderFormData): Promise<Quotation | null> => {
    if (!currentOrganization?.id || !user?.id) return null;
    try {
      const quotation = await QuotationService.create(currentOrganization.id, user.id, data);
      toast({ title: 'Cotação criada', description: `${quotation.quotation_number} salva como rascunho.` });
      await fetchQuotations();
      return quotation;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível criar a cotação', variant: 'destructive' });
      return null;
    }
  };

  const updateQuotation = async (id: string, data: Partial<QuotationHeaderFormData>): Promise<boolean> => {
    try {
      await QuotationService.update(id, data);
      toast({ title: 'Cotação atualizada' });
      await fetchQuotations();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar', variant: 'destructive' });
      return false;
    }
  };

  const updateStatus = async (id: string, status: QuotationStatus): Promise<boolean> => {
    try {
      await QuotationService.updateStatus(id, status);
      toast({ title: 'Status atualizado' });
      await fetchQuotations();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status', variant: 'destructive' });
      return false;
    }
  };

  const deleteQuotation = async (id: string): Promise<boolean> => {
    try {
      await QuotationService.delete(id);
      toast({ title: 'Cotação excluída' });
      await fetchQuotations();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir a cotação', variant: 'destructive' });
      return false;
    }
  };

  const reopenQuotation = async (
    id: string,
    newDueDate: string,
    reason: string,
    notes?: string,
  ): Promise<Quotation | null> => {
    try {
      const updated = await QuotationService.reopenQuotation(id, newDueDate, reason, notes);
      toast({ title: 'Cotação reaberta', description: 'Status atualizado para Aguardando Propostas.' });
      await fetchQuotations();
      return updated;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível reabrir a cotação', variant: 'destructive' });
      return null;
    }
  };

  const copyQuotation = async (
    originalId: string,
    newDueDate: string,
    newTitle?: string,
  ): Promise<Quotation | null> => {
    if (!currentOrganization?.id || !user?.id) return null;
    try {
      const copy = await QuotationService.copyQuotation(
        originalId,
        currentOrganization.id,
        user.id,
        newDueDate,
        newTitle,
      );
      toast({ title: 'Cotação copiada', description: `${copy.quotation_number} criada como rascunho.` });
      await fetchQuotations();
      return copy;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível copiar a cotação', variant: 'destructive' });
      return null;
    }
  };

  return {
    quotations: result.data,
    count:      result.count,
    totalPages: result.totalPages,
    currentPage,
    isLoading,
    filters,
    setFilters,
    handlePageChange,
    refresh: fetchQuotations,
    actions: { createQuotation, updateQuotation, updateStatus, deleteQuotation, reopenQuotation, copyQuotation },
  };
}

// ── Hook para detalhes de uma cotação ─────────────────────────────────────────
export function useQuotationDetails(quotationId: string | null) {
  const { toast } = useToast();

  const [quotation,        setQuotation]        = useState<Quotation | null>(null);
  const [items,            setItems]            = useState<QuotationItem[]>([]);
  const [isLoading,        setIsLoading]        = useState(false);
  const [hasPurchaseOrder, setHasPurchaseOrder] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!quotationId) return;
    try {
      setIsLoading(true);
      const [result, poExists] = await Promise.all([
        QuotationService.getById(quotationId),
        QuotationService.hasPurchaseOrder(quotationId),
      ]);
      setQuotation(result.quotation);
      setItems(result.items);
      setHasPurchaseOrder(poExists);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar detalhes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [quotationId, toast]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const canEdit = quotation ? EDITABLE_STATUSES.includes(quotation.status) : false;

  const addItem = async (data: QuotationItemFormData): Promise<boolean> => {
    if (!quotationId) return false;
    try {
      await QuotationService.addItem(quotationId, data, items.length);
      toast({ title: 'Item adicionado' });
      await fetchDetails();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível adicionar o item', variant: 'destructive' });
      return false;
    }
  };

  const updateItem = async (itemId: string, data: Partial<QuotationItemFormData>): Promise<boolean> => {
    try {
      await QuotationService.updateItem(itemId, data);
      toast({ title: 'Item atualizado' });
      await fetchDetails();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o item', variant: 'destructive' });
      return false;
    }
  };

  const deleteItem = async (itemId: string): Promise<boolean> => {
    try {
      await QuotationService.deleteItem(itemId);
      toast({ title: 'Item removido' });
      await fetchDetails();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível remover o item', variant: 'destructive' });
      return false;
    }
  };

  const addProposal = async (
    itemId: string,
    supplierId: string,
    data: ProposalFormData,
    quantity: number
  ): Promise<boolean> => {
    try {
      await QuotationService.addProposal(itemId, supplierId, data, quantity);
      // Se status é sent/waiting, atualiza para responded
      if (quotation && ['sent', 'waiting_proposals'].includes(quotation.status)) {
        await QuotationService.updateStatus(quotationId!, 'responded');
      }
      toast({ title: 'Proposta registrada' });
      await fetchDetails();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível registrar a proposta', variant: 'destructive' });
      return false;
    }
  };

  const updateProposal = async (
    proposalId: string,
    data: Partial<ProposalFormData>,
    quantity: number
  ): Promise<boolean> => {
    try {
      await QuotationService.updateProposal(proposalId, data, quantity);
      toast({ title: 'Proposta atualizada' });
      await fetchDetails();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar a proposta', variant: 'destructive' });
      return false;
    }
  };

  const selectProposal = async (proposalId: string, itemId: string): Promise<boolean> => {
    try {
      await QuotationService.selectProposal(proposalId, itemId);
      toast({ title: 'Proposta selecionada como vencedora' });
      await fetchDetails();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível selecionar a proposta', variant: 'destructive' });
      return false;
    }
  };

  const deleteProposal = async (proposalId: string): Promise<boolean> => {
    try {
      await QuotationService.deleteProposal(proposalId);
      toast({ title: 'Proposta removida' });
      await fetchDetails();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível remover a proposta', variant: 'destructive' });
      return false;
    }
  };

  return {
    quotation,
    items,
    isLoading,
    canEdit,
    hasPurchaseOrder,
    refresh: fetchDetails,
    actions: { addItem, updateItem, deleteItem, addProposal, updateProposal, selectProposal, deleteProposal },
  };
}
