import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import {
  PurchaseInvoiceService,
  PurchaseInvoice,
  InvoiceFormData,
} from '@/services/PurchaseInvoiceService';

export function usePurchaseInvoices() {
  const { currentOrganization } = useOrganization();
  const [invoices,   setInvoices]   = useState<PurchaseInvoice[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setIsLoading(true);
    try {
      const data = await PurchaseInvoiceService.list(currentOrganization.id);
      setInvoices(data);
    } catch {
      toast.error('Erro ao carregar notas fiscais');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const createInvoice = useCallback(async (
    input: InvoiceFormData,
    orderTotalValue: number,
  ): Promise<PurchaseInvoice | null> => {
    if (!currentOrganization?.id) return null;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const invoice = await PurchaseInvoiceService.create(
        currentOrganization.id,
        user?.id ?? '',
        input,
        orderTotalValue,
      );
      if (invoice.status === 'divergent') {
        toast.warning('NF registrada com divergências — verifique as observações');
      } else {
        toast.success('Nota fiscal registrada e validada');
        // US-PUR-037: gerar contas a pagar automaticamente para NFs validadas
        if ((invoice.due_dates ?? []).length > 0) {
          const supplierName = invoice.purchase_order?.supplier?.name ?? 'Fornecedor';
          await PurchaseInvoiceService.generateAccountsPayable(
            currentOrganization.id,
            invoice,
            supplierName,
          );
        }
      }
      await fetchInvoices();
      return invoice;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar nota fiscal');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [currentOrganization?.id, fetchInvoices]);

  const getInvoicesByOrder = useCallback(async (orderId: string): Promise<PurchaseInvoice[]> => {
    try {
      return await PurchaseInvoiceService.getByOrder(orderId);
    } catch {
      return [];
    }
  }, []);

  return {
    invoices,
    isLoading,
    isSaving,
    fetchInvoices,
    createInvoice,
    getInvoicesByOrder,
  };
}
