import { useState, useCallback } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  SupplierReturnService,
  type SupplierReturn,
  type ReceiptForReturn,
  type CreateReturnInput,
  type ReturnStatus,
} from '@/services/SupplierReturnService';

export function useSupplierReturns() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const fetchReturns = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    try {
      const data = await SupplierReturnService.list(currentOrganization.id);
      setReturns(data);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao carregar devoluções', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  const createReturn = useCallback(async (input: CreateReturnInput): Promise<SupplierReturn | null> => {
    if (!currentOrganization?.id) return null;
    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? '';
      const ret = await SupplierReturnService.create(currentOrganization.id, userId, input);
      await fetchReturns();
      toast({ title: `Devolução ${ret.return_number} registrada com sucesso` });
      return ret;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar devolução';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [currentOrganization?.id, fetchReturns, toast]);

  const updateStatus = useCallback(async (
    id: string,
    status: ReturnStatus,
    creditNoteNumber?: string,
    creditNoteDate?: string,
  ): Promise<boolean> => {
    try {
      await SupplierReturnService.updateStatus(id, status, creditNoteNumber, creditNoteDate);
      await fetchReturns();
      toast({ title: 'Status atualizado com sucesso' });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar status';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
      return false;
    }
  }, [fetchReturns, toast]);

  const fetchReceiptForReturn = useCallback(async (receiptId: string): Promise<ReceiptForReturn | null> => {
    setIsLoadingReceipt(true);
    try {
      return await SupplierReturnService.getReceiptForReturn(receiptId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar recebimento';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setIsLoadingReceipt(false);
    }
  }, [toast]);

  return { returns, isLoading, isSaving, isLoadingReceipt, fetchReturns, createReturn, updateStatus, fetchReceiptForReturn };
}
