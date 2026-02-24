import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  PurchaseOrderService,
  PurchaseOrderRow,
  PaginatedPOs,
  POFilters,
  POUpdateData,
  POStats,
} from '@/services/PurchaseOrderService';

const PAGE_SIZE = 10;

export function usePurchaseOrders() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const [result, setResult]     = useState<PaginatedPOs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage]         = useState(1);
  const [filters, setFiltersState] = useState<POFilters>({});
  const [stats, setStats]       = useState<POStats | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    try {
      const data = await PurchaseOrderService.list(currentOrganization.id, filters, page, PAGE_SIZE);
      setResult(data);
    } catch {
      toast({ title: 'Erro ao carregar pedidos de compra', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, filters, page, toast]);

  const fetchStats = useCallback(async () => {
    if (!currentOrganization?.id) return;
    try {
      const s = await PurchaseOrderService.getStats(currentOrganization.id);
      setStats(s);
    } catch {
      // stats failure is non-blocking
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  const setFilters = (f: POFilters) => {
    setFiltersState(f);
    setPage(1);
  };

  const update = async (id: string, data: POUpdateData): Promise<boolean> => {
    try {
      await PurchaseOrderService.update(id, data);
      toast({ title: 'Pedido atualizado com sucesso' });
      refresh();
      return true;
    } catch (err) {
      toast({ title: 'Erro ao atualizar pedido', description: String(err), variant: 'destructive' });
      return false;
    }
  };

  const approve = async (id: string): Promise<boolean> => {
    try {
      await PurchaseOrderService.approve(id, user?.id ?? '');
      toast({ title: 'Pedido aprovado' });
      refresh();
      return true;
    } catch (err) {
      toast({ title: 'Erro ao aprovar pedido', description: String(err), variant: 'destructive' });
      return false;
    }
  };

  const send = async (id: string): Promise<boolean> => {
    try {
      await PurchaseOrderService.send(id);
      toast({ title: 'Pedido enviado ao fornecedor' });
      refresh();
      return true;
    } catch (err) {
      toast({ title: 'Erro ao enviar pedido', description: String(err), variant: 'destructive' });
      return false;
    }
  };

  const confirm = async (id: string): Promise<boolean> => {
    try {
      await PurchaseOrderService.confirm(id);
      toast({ title: 'Pedido confirmado pelo fornecedor' });
      refresh();
      return true;
    } catch (err) {
      toast({ title: 'Erro ao confirmar pedido', description: String(err), variant: 'destructive' });
      return false;
    }
  };

  const cancel = async (id: string): Promise<boolean> => {
    try {
      await PurchaseOrderService.cancel(id);
      toast({ title: 'Pedido cancelado' });
      refresh();
      return true;
    } catch (err) {
      toast({ title: 'Erro ao cancelar pedido', description: String(err), variant: 'destructive' });
      return false;
    }
  };

  return {
    orders:     result?.data ?? [],
    count:      result?.count ?? 0,
    totalPages: result?.totalPages ?? 1,
    page,
    pageSize:   PAGE_SIZE,
    isLoading,
    filters,
    stats,
    setFilters,
    setPage,
    refresh,
    update,
    approve,
    send,
    confirm,
    cancel,
  };
}

export function usePurchaseOrderDetails(id: string | null) {
  const { toast } = useToast();
  const [order, setOrder]       = useState<PurchaseOrderRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) { setOrder(null); return; }
    setIsLoading(true);
    try {
      const data = await PurchaseOrderService.getById(id);
      setOrder(data);
    } catch {
      toast({ title: 'Erro ao carregar pedido', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  return { order, isLoading, refresh: fetchOrder };
}
