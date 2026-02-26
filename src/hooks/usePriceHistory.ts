import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import {
  PriceHistoryService,
  type PriceHistoryData,
  type PriceHistoryPeriod,
} from '@/services/PriceHistoryService';

export function usePriceHistory() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [allItems, setAllItems] = useState<string[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [period, setPeriodState] = useState<PriceHistoryPeriod>('12m');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<PriceHistoryData | null>(null);

  const loadAllItems = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setIsLoadingItems(true);
    try {
      const items = await PriceHistoryService.fetchAllItems(currentOrganization.id);
      setAllItems(items);
    } catch {
      toast({ title: 'Erro ao carregar itens', variant: 'destructive' });
    } finally {
      setIsLoadingItems(false);
    }
  }, [currentOrganization?.id, toast]);

  useEffect(() => {
    loadAllItems();
  }, [loadAllItems]);

  const fetchHistory = useCallback(
    async (itemName: string, activePeriod: PriceHistoryPeriod) => {
      if (!currentOrganization?.id) return;
      setIsLoading(true);
      try {
        const result = await PriceHistoryService.fetchPriceHistory(
          currentOrganization.id,
          itemName,
          activePeriod,
        );
        setData(result);
      } catch {
        toast({ title: 'Erro ao carregar histórico de preços', variant: 'destructive' });
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [currentOrganization?.id, toast],
  );

  const selectItem = useCallback(
    (itemName: string) => {
      setSelectedItem(itemName);
      fetchHistory(itemName, period);
    },
    [fetchHistory, period],
  );

  const changePeriod = useCallback(
    (newPeriod: PriceHistoryPeriod) => {
      setPeriodState(newPeriod);
      if (selectedItem) {
        fetchHistory(selectedItem, newPeriod);
      }
    },
    [fetchHistory, selectedItem],
  );

  const clearSelection = useCallback(() => {
    setSelectedItem(null);
    setData(null);
  }, []);

  return {
    allItems,
    isLoadingItems,
    selectedItem,
    period,
    isLoading,
    data,
    selectItem,
    changePeriod,
    clearSelection,
  };
}
