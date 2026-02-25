import { useState, useCallback, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  PurchaseOrderApprovalService,
  PendingApprovalRow,
  RejectionReason,
  AppRole,
} from '@/services/PurchaseOrderApprovalService';

export function usePurchaseOrderApprovals() {
  const { currentOrganization, userRole } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();

  const [pending, setPending] = useState<PendingApprovalRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    try {
      const data = await PurchaseOrderApprovalService.listPending(currentOrganization.id);
      setPending(data);
    } catch {
      toast({ title: 'Erro ao carregar pedidos pendentes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const approve = async (orderId: string, totalValue: number): Promise<boolean> => {
    setApprovingId(orderId);
    try {
      await PurchaseOrderApprovalService.approve(
        orderId,
        user?.id ?? '',
        (userRole as AppRole) ?? null,
        totalValue,
      );
      toast({ title: 'Pedido aprovado com sucesso' });
      await fetchPending();
      return true;
    } catch (err) {
      toast({
        title: 'Erro ao aprovar pedido',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
      return false;
    } finally {
      setApprovingId(null);
    }
  };

  const reject = async (orderId: string, totalValue: number, reason: RejectionReason): Promise<boolean> => {
    setRejectingId(orderId);
    try {
      await PurchaseOrderApprovalService.reject(
        orderId,
        user?.id ?? '',
        (userRole as AppRole) ?? null,
        totalValue,
        reason,
      );
      toast({ title: 'Pedido rejeitado' });
      await fetchPending();
      return true;
    } catch (err) {
      toast({
        title: 'Erro ao rejeitar pedido',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
      return false;
    } finally {
      setRejectingId(null);
    }
  };

  const sendForApproval = async (orderId: string, totalValue: number): Promise<'approved' | 'pending_approval' | null> => {
    try {
      const result = await PurchaseOrderApprovalService.sendForApproval(
        orderId,
        totalValue,
        user?.id ?? '',
      );
      if (result === 'approved') {
        toast({ title: 'Pedido aprovado automaticamente (valor < R$ 1.000)' });
      } else {
        toast({ title: 'Pedido enviado para aprovação' });
      }
      await fetchPending();
      return result;
    } catch (err) {
      toast({
        title: 'Erro ao enviar para aprovação',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    pending,
    isLoading,
    approvingId,
    rejectingId,
    refresh: fetchPending,
    approve,
    reject,
    sendForApproval,
  };
}
