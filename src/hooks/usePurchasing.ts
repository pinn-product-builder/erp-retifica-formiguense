import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  payment_terms?: string;
  delivery_days: number;
  rating: number;
  is_active: boolean;
}

export interface PurchaseRequisition {
  id: string;
  requisition_number: string;
  requested_by?: string;
  department?: string;
  priority: string;
  justification?: string;
  status: string;
  total_estimated_value: number;
  created_at: string;
  items?: PurchaseRequisitionItem[];
}

export interface PurchaseRequisitionItem {
  id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  urgency_date?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  expected_delivery?: string;
  total_value: number;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
}

export interface Quotation {
  id: string;
  requisition_id: string;
  supplier_id: string;
  total_value: number;
  delivery_time?: number;
  status: string;
  supplier?: Supplier;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const usePurchasing = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchRequisitions = useCallback(async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_requisitions')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequisitions(data || []);
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  const fetchPurchaseOrders = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const createSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplier,
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSuppliers();
      toast({
        title: 'Sucesso',
        description: 'Fornecedor criado com sucesso',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar fornecedor',
        variant: 'destructive',
      });
      return null;
    }
  };

  const createRequisition = async (
    requisition: Omit<PurchaseRequisition, 'id' | 'requisition_number' | 'created_at' | 'items'>,
    items: Omit<PurchaseRequisitionItem, 'id'>[]
  ) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data: reqData, error: reqError } = await supabase
        .from('purchase_requisitions')
        .insert({
          department: requisition.department || null,
          priority: requisition.priority || 'medium',
          justification: requisition.justification || null,
          status: requisition.status || 'pending',
          total_estimated_value: requisition.total_estimated_value || 0,
          org_id: currentOrganization.id,
        } as any)
        .select()
        .single();

      if (reqError) throw reqError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_requisition_items')
          .insert(
            items.map(item => ({
              ...item,
              requisition_id: reqData.id,
            }))
          );

        if (itemsError) throw itemsError;
      }
      
      await fetchRequisitions();
      toast({
        title: 'Sucesso',
        description: 'Requisição criada com sucesso',
      });
      
      return reqData;
    } catch (error) {
      console.error('Error creating requisition:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar requisição',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateRequisitionStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      await fetchRequisitions();
      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating requisition status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const createPurchaseOrder = async (
    order: Omit<PurchaseOrder, 'id' | 'po_number' | 'supplier' | 'items'>,
    items: Omit<PurchaseOrderItem, 'id'>[]
  ) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: order.supplier_id,
          status: order.status || 'pending',
          order_date: order.order_date || new Date().toISOString().split('T')[0],
          expected_delivery: order.expected_delivery || null,
          total_value: order.total_value || 0,
          org_id: currentOrganization.id,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(
            items.map(item => ({
              ...item,
              po_id: orderData.id,
            }))
          );

        if (itemsError) throw itemsError;
      }
      
      await fetchPurchaseOrders();
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra criado com sucesso',
      });
      
      return orderData;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar pedido de compra',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchSuppliers();
      fetchRequisitions();
      fetchPurchaseOrders();
    }
  }, [currentOrganization?.id]);

  return {
    suppliers,
    requisitions,
    purchaseOrders,
    quotations,
    loading,
    createSupplier,
    createRequisition,
    updateRequisitionStatus,
    createPurchaseOrder,
    fetchSuppliers,
    fetchRequisitions,
    fetchPurchaseOrders,
  };
};