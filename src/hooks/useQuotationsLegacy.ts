/**
 * Hook legado que trabalha com a tabela `quotations` (sistema antigo).
 * Mantido para compatibilidade com QuotationManager e QuotationComparison.
 * Novas funcionalidades devem usar `useQuotations` (purchase_quotations).
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export interface LegacyQuotationItem {
  id: string;
  quotation_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  part_id?: string;
  created_at: string;
}

export interface Quotation {
  id: string;
  org_id?: string;
  requisition_id?: string;
  supplier_id: string;
  quote_number?: string;
  quote_date?: string;
  validity_date?: string;
  total_value: number;
  delivery_time?: number;
  terms?: string;
  status: string;
  created_at: string;
  updated_at: string;
  supplier?: { id: string; name: string; trade_name?: string; delivery_days?: number; rating?: number };
  items?: LegacyQuotationItem[];
}

export function useQuotations() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading,    setLoading]    = useState(false);

  const fetchQuotations = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select(`*, supplier:suppliers(id, name, trade_name)`)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setQuotations((data ?? []) as Quotation[]);
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível carregar cotações', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  const updateQuotationStatus = async (id: string, status: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      await fetchQuotations();
      return true;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar status', variant: 'destructive' });
      return false;
    }
  };

  const compareQuotations = (ids: string[]): Quotation[] => {
    return quotations.filter(q => ids.includes(q.id));
  };

  return { quotations, loading, fetchQuotations, updateQuotationStatus, compareQuotations };
}
