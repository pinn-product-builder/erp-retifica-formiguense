import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface PurchaseReceipt {
  id: string;
  org_id: string;
  purchase_order_id: string;
  receipt_number: string;
  receipt_date: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_url?: string;
  total_value: number;
  status: string;
  has_divergence: boolean; // Esta coluna não é gerada na tabela purchase_receipts
  notes?: string;
  received_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  purchase_order?: {
    po_number: string;
    supplier?: {
      name: string;
    };
  };
  items?: PurchaseReceiptItem[];
}

export interface PurchaseReceiptItem {
  id: string;
  receipt_id: string;
  purchase_order_item_id: string;
  part_id?: string;
  ordered_quantity: number;
  received_quantity: number;
  approved_quantity: number;
  rejected_quantity: number;
  has_divergence?: boolean; // Coluna gerada automaticamente (received_quantity <> ordered_quantity)
  divergence_reason?: string;
  rejection_reason?: string;
  unit_cost?: number;
  total_cost?: number;
  quality_status: string;
  quality_notes?: string;
  lot_number?: string;
  expiry_date?: string;
  warehouse_location?: string;
  created_at: string;
  
  // Relacionamentos
  purchase_order_item?: {
    item_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
  };
}

export interface CreateReceiptData {
  purchase_order_id: string;
  receipt_date: string;
  invoice_number?: string;
  invoice_date?: string;
  invoice_url?: string;
  notes?: string;
  items: Array<{
    purchase_order_item_id: string;
    part_id?: string;
    received_quantity: number;
    approved_quantity: number;
    rejected_quantity: number;
    divergence_reason?: string;
    rejection_reason?: string;
    unit_cost?: number;
    quality_status: string;
    quality_notes?: string;
    lot_number?: string;
    expiry_date?: string;
    warehouse_location?: string;
  }>;
}

export interface SupplierEvaluationData {
  supplier_id: string;
  purchase_order_id: string;
  delivery_rating: number;
  quality_rating: number;
  price_rating: number;
  service_rating: number;
  delivered_on_time: boolean;
  had_quality_issues: boolean;
  comments?: string;
}

export function usePurchaseReceipts() {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  /**
   * Buscar recebimentos
   */
  const fetchReceipts = useCallback(async (filters?: {
    purchase_order_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);

      let query = supabase
        .from('purchase_receipts')
        .select(`
          *,
          purchase_order:purchase_orders(
            po_number,
            supplier:suppliers(name)
          )
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.purchase_order_id) {
        query = query.eq('purchase_order_id', filters.purchase_order_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.start_date && filters?.end_date) {
        query = query
          .gte('receipt_date', filters.start_date)
          .lte('receipt_date', filters.end_date);
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
   * Buscar POs pendentes de recebimento
   */
  const fetchPendingPOs = useCallback(async () => {
    if (!currentOrganization?.id) return [];

    try {
      // Buscar POs pendentes
      const { data: posData, error: posError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name)
        `)
        .eq('org_id', currentOrganization.id)
        .in('status', ['confirmed', 'in_transit'])
        .order('expected_delivery', { ascending: true });

      if (posError) throw posError;

      if (!posData || posData.length === 0) return [];

      // Buscar itens dos POs com quantidades recebidas
      const poIds = posData.map(po => po.id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select(`
          id,
          po_id,
          item_name,
          description,
          quantity
        `)
        .in('po_id', poIds);

      if (itemsError) throw itemsError;

      // Buscar quantidades recebidas por item
      if (itemsData && itemsData.length > 0) {
        const itemIds = itemsData.map(item => item.id);
        
        const { data: receivedData, error: receivedError } = await supabase
          .from('purchase_receipt_items')
          .select(`
            purchase_order_item_id,
            received_quantity
          `)
          .in('purchase_order_item_id', itemIds);

        if (receivedError) throw receivedError;

        // Calcular quantidades recebidas por item
        const receivedQuantities = (receivedData || []).reduce((acc, item) => {
          acc[item.purchase_order_item_id] = (acc[item.purchase_order_item_id] || 0) + item.received_quantity;
          return acc;
        }, {} as Record<string, number>);

        // Agrupar itens por PO e adicionar quantidades recebidas
        const itemsByPO = itemsData.reduce((acc, item) => {
          if (!acc[item.po_id]) acc[item.po_id] = [];
          acc[item.po_id].push({
            ...item,
            received_quantity: receivedQuantities[item.id] || 0
          });
          return acc;
        }, {} as Record<string, Array<{
          id: string;
          po_id: string;
          item_name: string;
          description?: string;
          quantity: number;
          received_quantity: number;
        }>>);

        // Combinar POs com seus itens
        return posData.map(po => ({
          ...po,
          items: itemsByPO[po.id] || []
        }));
      }

      // Se não há itens, retornar POs sem itens
      return posData.map(po => ({
        ...po,
        items: []
      }));

    } catch (error) {
      console.error('Error fetching pending POs:', error);
      return [];
    }
  }, [currentOrganization?.id]);

  /**
   * Gerar número de recebimento
   */
  const generateReceiptNumber = useCallback(async (): Promise<string | null> => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('generate_receipt_number', { p_org_id: currentOrganization.id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating receipt number:', error);
      return null;
    }
  }, [currentOrganization?.id]);

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

      // Gerar número do recebimento
      const receiptNumber = await generateReceiptNumber();
      if (!receiptNumber) throw new Error('Failed to generate receipt number');

      // Obter usuário atual
      const { data: userData } = await supabase.auth.getUser();

      // Calcular valor total
      const totalValue = receiptData.items.reduce(
        (sum, item) => sum + ((item.unit_cost || 0) * item.received_quantity),
        0
      );

      // Verificar se há divergências
      const hasDivergence = receiptData.items.some(
        item => item.received_quantity !== item.approved_quantity + item.rejected_quantity ||
                item.rejected_quantity > 0
      );

      // Criar recebimento
      const { data: receipt, error: receiptError } = await supabase
        .from('purchase_receipts')
        .insert({
          org_id: currentOrganization.id,
          purchase_order_id: receiptData.purchase_order_id,
          receipt_number: receiptNumber,
          receipt_date: receiptData.receipt_date,
          invoice_number: receiptData.invoice_number,
          invoice_date: receiptData.invoice_date,
          invoice_url: receiptData.invoice_url,
          total_value: totalValue,
          status: hasDivergence ? 'partial' : 'completed',
          has_divergence: hasDivergence,
          notes: receiptData.notes,
          received_by: userData.user?.id,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Criar itens do recebimento
      if (receiptData.items.length > 0) {
        const items = receiptData.items.map(item => ({
          receipt_id: receipt.id,
          purchase_order_item_id: item.purchase_order_item_id,
          part_id: item.part_id,
          ordered_quantity: 0, // Will be updated by trigger
          received_quantity: item.received_quantity,
          approved_quantity: item.approved_quantity,
          rejected_quantity: item.rejected_quantity,
          // has_divergence é uma coluna gerada (received_quantity <> ordered_quantity), não deve ser inserida manualmente
          divergence_reason: item.divergence_reason || null,
          rejection_reason: item.rejection_reason,
          unit_cost: item.unit_cost,
          // total_cost é uma coluna gerada ((received_quantity)::numeric * unit_cost), não deve ser inserida manualmente
          quality_status: item.quality_status,
          quality_notes: item.quality_notes,
          lot_number: item.lot_number,
          expiry_date: item.expiry_date,
          warehouse_location: item.warehouse_location,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_receipt_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      await fetchReceipts();
      toast({
        title: 'Sucesso',
        description: `Recebimento ${receiptNumber} registrado com sucesso`,
      });

      return receipt as PurchaseReceipt;
    } catch (error: unknown) {
      console.error('Error creating receipt:', error);
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível registrar o recebimento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast, fetchReceipts, generateReceiptNumber]);

  /**
   * Avaliar fornecedor após recebimento
   */
  const evaluateSupplier = useCallback(async (evaluationData: SupplierEvaluationData) => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      // overall_rating é uma coluna gerada automaticamente (média simples dos 4 ratings)
      // Não deve ser inserida manualmente

      const { error } = await (supabase as unknown)
        .from('supplier_evaluations')
        .insert({
          org_id: currentOrganization?.id,
          supplier_id: evaluationData.supplier_id,
          purchase_order_id: evaluationData.purchase_order_id,
          delivery_rating: evaluationData.delivery_rating,
          quality_rating: evaluationData.quality_rating,
          price_rating: evaluationData.price_rating,
          service_rating: evaluationData.service_rating,
          // overall_rating é calculado automaticamente como (delivery + quality + price + service) / 4
          delivered_on_time: evaluationData.delivered_on_time,
          had_quality_issues: evaluationData.had_quality_issues,
          comments: evaluationData.comments,
          evaluated_by: userData.user?.id,
          evaluated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Avaliação do fornecedor registrada com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Error evaluating supplier:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar a avaliação',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentOrganization?.id, toast]);

  /**
   * Buscar detalhes de um recebimento específico
   */
  const fetchReceiptById = useCallback(async (receiptId: string) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('purchase_receipts')
        .select(`
          *,
          purchase_order:purchase_orders(
            po_number,
            supplier:suppliers(name)
          ),
          items:purchase_receipt_items(
            *,
            purchase_order_item:purchase_order_items(
              item_name,
              description,
              quantity,
              unit_price
            )
          )
        `)
        .eq('id', receiptId)
        .eq('org_id', currentOrganization.id)
        .single();

      if (error) throw error;

      return data as PurchaseReceipt;
    } catch (error) {
      console.error('Error fetching receipt:', error);
      return null;
    }
  }, [currentOrganization?.id]);

  return {
    receipts,
    loading,
    fetchReceipts,
    fetchPendingPOs,
    createReceipt,
    evaluateSupplier,
    fetchReceiptById,
    generateReceiptNumber,
  };
}