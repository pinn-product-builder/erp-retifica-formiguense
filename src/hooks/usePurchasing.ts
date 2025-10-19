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
  requisition_id?: string;
  status: string;
  order_date: string;
  expected_delivery?: string;
  actual_delivery?: string;
  subtotal: number;
  taxes: number;
  freight: number;
  discount: number;
  total_value: number;
  terms?: string;
  notes?: string;
  delivery_address?: string;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  confirmed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
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

  const fetchSuppliers = useCallback(async () => {
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
  }, [currentOrganization?.id]);

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

  const fetchPurchaseOrders = useCallback(async () => {
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
  }, [currentOrganization?.id]);

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

  const generatePONumber = async (): Promise<string | null> => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('generate_po_number', { p_org_id: currentOrganization.id });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating PO number:', error);
      return null;
    }
  };

  const createPurchaseOrder = async (
    order: Omit<PurchaseOrder, 'id' | 'po_number' | 'supplier' | 'items' | 'created_at' | 'updated_at'>,
    items: Omit<PurchaseOrderItem, 'id'>[]
  ) => {
    if (!currentOrganization?.id) return null;

    try {
      // Generate PO number
      const poNumber = await generatePONumber();
      if (!poNumber) throw new Error('Failed to generate PO number');

      // Get current user
      const { data: userData } = await supabase.auth.getUser();

      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id: order.supplier_id,
          requisition_id: order.requisition_id,
          status: order.status || 'draft',
          order_date: order.order_date || new Date().toISOString().split('T')[0],
          expected_delivery: order.expected_delivery,
          subtotal: order.subtotal || 0,
          taxes: order.taxes || 0,
          freight: order.freight || 0,
          discount: order.discount || 0,
          total_value: order.total_value || 0,
          terms: order.terms,
          notes: order.notes,
          delivery_address: order.delivery_address,
          created_by: userData.user?.id,
          org_id: currentOrganization.id,
        })
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
        description: `Pedido de compra ${poNumber} criado com sucesso`,
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

  const approvePurchaseOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'approved',
          approved_by: userData.user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await fetchPurchaseOrders();
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra aprovado com sucesso',
      });

      return true;
    } catch (error) {
      console.error('Error approving purchase order:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao aprovar pedido de compra',
        variant: 'destructive',
      });
      return false;
    }
  };

  const sendPurchaseOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await fetchPurchaseOrders();
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra enviado ao fornecedor',
      });

      return true;
    } catch (error) {
      console.error('Error sending purchase order:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar pedido de compra',
        variant: 'destructive',
      });
      return false;
    }
  };

  const confirmPurchaseOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await fetchPurchaseOrders();
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra confirmado pelo fornecedor',
      });

      return true;
    } catch (error) {
      console.error('Error confirming purchase order:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao confirmar pedido de compra',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelPurchaseOrder = async (orderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'cancelled',
        })
        .eq('id', orderId);

      if (error) throw error;

      await fetchPurchaseOrders();
      toast({
        title: 'Sucesso',
        description: 'Pedido de compra cancelado',
      });

      return true;
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar pedido de compra',
        variant: 'destructive',
      });
      return false;
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
    generatePONumber,
    createPurchaseOrder,
    approvePurchaseOrder,
    sendPurchaseOrder,
    confirmPurchaseOrder,
    cancelPurchaseOrder,
    fetchSuppliers,
    fetchRequisitions,
    fetchPurchaseOrders,
  };
};