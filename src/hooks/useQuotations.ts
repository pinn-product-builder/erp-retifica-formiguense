import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface para cotação
 */
export interface Quotation {
  id: string;
  requisition_id: string;
  supplier_id: string;
  quote_number?: string;
  quote_date: string;
  validity_date?: string;
  total_value: number;
  delivery_time?: number; // dias
  terms?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  org_id: string;
  
  // Relacionamentos
  supplier?: {
    name: string;
    delivery_days: number;
    rating: number;
  };
  items?: QuotationItem[];
}

/**
 * Interface para item de cotação
 */
export interface QuotationItem {
  id: string;
  quotation_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

/**
 * Dados para criar cotação
 */
export interface CreateQuotationData {
  requisition_id: string;
  supplier_id: string;
  quote_date: string;
  validity_date?: string;
  delivery_time?: number;
  terms?: string;
  items: Omit<QuotationItem, 'id' | 'quotation_id'>[];
}

/**
 * Hook para gerenciar cotações de compras
 */
export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  /**
   * Buscar cotações
   */
  const fetchQuotations = useCallback(async (requisitionId?: string) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);

      let query = supabase
        .from('quotations')
        .select(`
          *,
          supplier:suppliers(*),
          items:quotation_items(*)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (requisitionId) {
        query = query.eq('requisition_id', requisitionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setQuotations((data || []) as Quotation[]);
      return data as Quotation[];
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as cotações',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  /**
   * Criar cotação
   */
  const createQuotation = useCallback(async (quotationData: CreateQuotationData) => {
    if (!currentOrganization?.id) {
      toast({
        title: 'Erro',
        description: 'Organização não encontrada',
        variant: 'destructive',
      });
      return null;
    }

    try {
      setLoading(true);

      // Calcular valor total
      const totalValue = quotationData.items.reduce(
        (sum, item) => sum + item.total_price,
        0
      );

      // Criar cotação
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          requisition_id: quotationData.requisition_id,
          supplier_id: quotationData.supplier_id,
          quote_date: quotationData.quote_date,
          validity_date: quotationData.validity_date,
          total_value: totalValue,
          delivery_time: quotationData.delivery_time,
          terms: quotationData.terms,
          status: 'pending',
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Criar itens da cotação
      if (quotationData.items.length > 0) {
        const items = quotationData.items.map(item => ({
          ...item,
          quotation_id: quotation.id,
        }));

        const { error: itemsError } = await supabase
          .from('quotation_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast({
        title: 'Sucesso',
        description: 'Cotação criada com sucesso',
      });

      await fetchQuotations(quotationData.requisition_id);
      return quotation as Quotation;
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a cotação',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast, fetchQuotations]);

  /**
   * Atualizar status da cotação
   */
  const updateQuotationStatus = useCallback(async (
    quotationId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      const { error } = await supabase
        .from('quotations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', quotationId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Cotação ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`,
      });

      await fetchQuotations();
      return true;
    } catch (error) {
      console.error('Error updating quotation status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a cotação',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchQuotations]);

  /**
   * Comparar cotações de uma requisição
   */
  const compareQuotations = useCallback((quotes: Quotation[]) => {
    if (quotes.length === 0) return null;

    const comparison = quotes.map(quote => ({
      id: quote.id,
      supplier: quote.supplier?.name || 'N/A',
      total: quote.total_value,
      delivery: quote.delivery_time || quote.supplier?.delivery_days || 0,
      rating: quote.supplier?.rating || 0,
      status: quote.status,
    }));

    // Encontrar melhor cotação (menor preço)
    const bestPrice = comparison.reduce((best, current) => 
      current.total < best.total ? current : best
    );

    // Encontrar entrega mais rápida
    const fastestDelivery = comparison.reduce((best, current) => 
      current.delivery < best.delivery ? current : best
    );

    // Fornecedor com melhor avaliação
    const bestRated = comparison.reduce((best, current) => 
      current.rating > best.rating ? current : best
    );

    return {
      quotations: comparison,
      bestPrice,
      fastestDelivery,
      bestRated,
    };
  }, []);

  return {
    quotations,
    loading,
    fetchQuotations,
    createQuotation,
    updateQuotationStatus,
    compareQuotations,
  };
}

