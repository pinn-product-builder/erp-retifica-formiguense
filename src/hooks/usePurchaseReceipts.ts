import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface para recebimento
 */
export interface PurchaseReceipt {
  id: string;
  org_id: string;
  purchase_order_id: string;
  receipt_number: string;
  receipt_date: string;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  received_by?: string;
  notes?: string;
  has_divergence: boolean;
  divergence_notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  items?: PurchaseReceiptItem[];
}

/**
 * Interface para item recebido
 */
export interface PurchaseReceiptItem {
  id: string;
  receipt_id: string;
  purchase_order_item_id: string;
  part_id?: string;
  ordered_quantity: number;
  received_quantity: number;
  has_divergence?: boolean;
  divergence_reason?: string;
  unit_cost?: number;
  total_cost?: number;
  quality_status: 'approved' | 'rejected' | 'under_review';
  quality_notes?: string;
}

/**
 * Dados para criar recebimento
 */
export interface CreateReceiptData {
  purchase_order_id: string;
  receipt_date: string;
  notes?: string;
  items: {
    purchase_order_item_id: string;
    part_id?: string;
    ordered_quantity: number;
    received_quantity: number;
    unit_cost: number;
    divergence_reason?: string;
    quality_status?: 'approved' | 'rejected' | 'under_review';
    quality_notes?: string;
  }[];
}

/**
 * Hook para gerenciar recebimentos de compras
 */
export function usePurchaseReceipts() {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  /**
   * Buscar recebimentos
   */
  const fetchReceipts = useCallback(async (purchaseOrderId?: string) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);

      let query = supabase
        .from('purchase_receipts')
        .select(`
          *,
          items:purchase_receipt_items(*)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (purchaseOrderId) {
        query = query.eq('purchase_order_id', purchaseOrderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReceipts((data || []) as PurchaseReceipt[]);
      return data as PurchaseReceipt[];
    } catch (error) {
      console.error('Error fetching receipts:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os recebimentos',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  /**
   * Criar recebimento
   */
  const createReceipt = useCallback(async (receiptData: CreateReceiptData) => {
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

      // 1. Gerar número do recebimento
      const { data: receiptNumber, error: numberError } = await supabase
        .rpc('generate_receipt_number', { p_org_id: currentOrganization.id });

      if (numberError) throw numberError;

      // 2. Buscar usuário atual
      const { data: userData } = await supabase.auth.getUser();

      // 3. Verificar se há divergências
      const hasDivergence = receiptData.items.some(
        item => item.received_quantity !== item.ordered_quantity
      );

      // 4. Criar recebimento
      const { data: receipt, error: receiptError } = await supabase
        .from('purchase_receipts')
        .insert({
          org_id: currentOrganization.id,
          purchase_order_id: receiptData.purchase_order_id,
          receipt_number: receiptNumber,
          receipt_date: receiptData.receipt_date,
          status: 'pending',
          received_by: userData.user?.id,
          notes: receiptData.notes,
          has_divergence: hasDivergence,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // 5. Criar itens do recebimento
      if (receiptData.items.length > 0) {
        const items = receiptData.items.map(item => ({
          receipt_id: receipt.id,
          purchase_order_item_id: item.purchase_order_item_id,
          part_id: item.part_id,
          ordered_quantity: item.ordered_quantity,
          received_quantity: item.received_quantity,
          unit_cost: item.unit_cost,
          divergence_reason: item.divergence_reason,
          quality_status: item.quality_status || 'approved',
          quality_notes: item.quality_notes,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_receipt_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast({
        title: 'Sucesso',
        description: `Recebimento ${receiptNumber} registrado com sucesso`,
      });

      await fetchReceipts(receiptData.purchase_order_id);
      return receipt as PurchaseReceipt;
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o recebimento',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast, fetchReceipts]);

  /**
   * Completar recebimento (confirmar entrada no estoque)
   */
  const completeReceipt = useCallback(async (receiptId: string) => {
    try {
      const { error } = await supabase
        .from('purchase_receipts')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', receiptId);

      if (error) throw error;

      toast({
        title: 'Recebimento Concluído',
        description: 'Entrada no estoque registrada automaticamente',
      });

      await fetchReceipts();
      return true;
    } catch (error) {
      console.error('Error completing receipt:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir o recebimento',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchReceipts]);

  return {
    receipts,
    loading,
    fetchReceipts,
    createReceipt,
    completeReceipt,
  };
}

