import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import {
  WorkshopOsPartsService,
  type WorkshopOrderContext,
  type PaginatedCatalogResult,
  type OrderSuggestion,
} from '@/services/workshopOsParts/WorkshopOsPartsService';
import type {
  AddExtraLineInput,
  CancelPartialInput,
  NoteLineInput,
  ReleaseStockInput,
  SubstituteLineInput,
} from '@/services/workshopOsParts/schemas';

interface UseWorkshopOsPartsResult {
  data: WorkshopOrderContext | null;
  isLoading: boolean;
  error: string | null;
  catalog: PaginatedCatalogResult | null;
  orderSuggestions: OrderSuggestion[];
  actions: {
    searchOrderByNumber: (orderNumber: string) => Promise<void>;
    searchOrderSuggestions: (term: string) => Promise<void>;
    reload: () => Promise<void>;
    searchCatalog: (query: string, page?: number, pageSize?: number) => Promise<void>;
    addExtraLine: (input: AddExtraLineInput) => Promise<void>;
    noteLine: (input: NoteLineInput) => Promise<void>;
    releaseStock: (input: ReleaseStockInput) => Promise<void>;
    substituteLine: (input: SubstituteLineInput) => Promise<void>;
    cancelPartial: (input: CancelPartialInput) => Promise<string | null>;
    removeLines: (lineIds: string[]) => Promise<void>;
    clearError: () => void;
  };
}

export function useWorkshopOsParts(): UseWorkshopOsPartsResult {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [data, setData] = useState<WorkshopOrderContext | null>(null);
  const [catalog, setCatalog] = useState<PaginatedCatalogResult | null>(null);
  const [orderSuggestions, setOrderSuggestions] = useState<OrderSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardContext = useCallback(() => {
    if (!currentOrganization?.id) {
      throw new Error('Organização não selecionada');
    }
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }
    return { orgId: currentOrganization.id, userId: user.id };
  }, [currentOrganization?.id, user?.id]);

  const reload = useCallback(async () => {
    if (!currentOrderId || !currentOrganization?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const context = await WorkshopOsPartsService.getOrderContext(currentOrganization.id, currentOrderId);
      setData(context);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao recarregar dados da OS');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrderId, currentOrganization?.id]);

  const searchOrderByNumber = useCallback(async (orderNumber: string) => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    setError(null);
    setData(null);
    setCurrentOrderId(null);
    try {
      const order = await WorkshopOsPartsService.getOrderByNumber(currentOrganization.id, orderNumber);
      const context = await WorkshopOsPartsService.getOrderContext(currentOrganization.id, order.id);
      setCurrentOrderId(order.id);
      setData(context);
    } catch (err) {
      setData(null);
      setCurrentOrderId(null);
      setError(err instanceof Error ? err.message : 'Erro ao buscar OS');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  const searchOrderSuggestions = useCallback(async (term: string) => {
    if (!currentOrganization?.id) return;

    if (!term.trim()) {
      setOrderSuggestions([]);
      return;
    }

    try {
      const suggestions = await WorkshopOsPartsService.searchOrderSuggestions(currentOrganization.id, term);
      setOrderSuggestions(suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar sugestões de OS');
    }
  }, [currentOrganization?.id]);

  const searchCatalog = useCallback(async (query: string, page = 1, pageSize = 10) => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await WorkshopOsPartsService.searchCatalogParts(currentOrganization.id, { query, page, pageSize });
      setCatalog(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao pesquisar peças no catálogo');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  const addExtraLine = useCallback(async (input: AddExtraLineInput) => {
    const { orgId, userId } = guardContext();
    setIsLoading(true);
    setError(null);
    try {
      await WorkshopOsPartsService.addExtraLine(orgId, userId, input);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao incluir peça extra');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guardContext, reload]);

  const noteLine = useCallback(async (input: NoteLineInput) => {
    const { orgId, userId } = guardContext();
    setIsLoading(true);
    setError(null);
    try {
      await WorkshopOsPartsService.noteLine(orgId, userId, input);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao anotar linha de peça');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guardContext, reload]);

  const releaseStock = useCallback(async (input: ReleaseStockInput) => {
    const { orgId, userId } = guardContext();
    setIsLoading(true);
    setError(null);
    try {
      await WorkshopOsPartsService.releaseStock(orgId, userId, input);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar peça');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guardContext, reload]);

  const substituteLine = useCallback(async (input: SubstituteLineInput) => {
    const { orgId, userId } = guardContext();
    setIsLoading(true);
    setError(null);
    try {
      await WorkshopOsPartsService.substituteLine(orgId, userId, input);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao substituir peça');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guardContext, reload]);

  const cancelPartial = useCallback(async (input: CancelPartialInput) => {
    const { orgId, userId } = guardContext();
    setIsLoading(true);
    setError(null);
    try {
      const result = await WorkshopOsPartsService.cancelPartial(orgId, userId, input);
      await reload();
      return result.receipt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar parcialmente');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guardContext, reload]);

  const removeLines = useCallback(async (lineIds: string[]) => {
    const { orgId, userId } = guardContext();
    setIsLoading(true);
    setError(null);
    try {
      await WorkshopOsPartsService.removeLines(orgId, userId, lineIds);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover peças da OS');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [guardContext, reload]);

  const actions = useMemo(
    () => ({
      searchOrderByNumber,
      searchOrderSuggestions,
      reload,
      searchCatalog,
      addExtraLine,
      noteLine,
      releaseStock,
      substituteLine,
      cancelPartial,
      removeLines,
      clearError: () => setError(null),
    }),
    [
      searchOrderByNumber,
      searchOrderSuggestions,
      reload,
      searchCatalog,
      addExtraLine,
      noteLine,
      releaseStock,
      substituteLine,
      cancelPartial,
      removeLines,
    ]
  );

  return { data, isLoading, error, catalog, orderSuggestions, actions };
}
