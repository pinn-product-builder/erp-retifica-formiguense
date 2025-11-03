import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface OrderMaterial {
  id: string;
  order_id: string;
  part_id?: string;
  part_name: string;
  part_code?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  used_at: string;
  used_by?: string;
  notes?: string;
}

export interface OrderWarranty {
  id: string;
  order_id: string;
  warranty_type: string;
  start_date: string;
  end_date: string;
  terms?: string;
  is_active: boolean;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  changed_at: string;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  engine_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  priority: number;
  warranty_months: number;
  consultant_id?: string;
  org_id?: string;
  collection_date?: string;
  collection_time?: string;
  collection_location?: string;
  driver_name?: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;
  engine?: {
    id: string;
    type: string;
    brand: string;
    model: string;
  } | null;
  consultant?: {
    id: string;
    full_name: string;
  } | null;
  materials?: OrderMaterial[];
  warranties?: OrderWarranty[];
  status_history?: OrderStatusHistory[];
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers!inner(id, name, phone, email),
          engines(id, type, brand, model)
        `)
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch consultants separately if needed
      const ordersWithConsultants = await Promise.all(
        (data || []).map(async (order) => {
          let consultant = null;
          if (order.consultant_id) {
            const { data: consultantData } = await supabase
              .from('consultants')
              .select('id, name')
              .eq('id', order.consultant_id)
              .maybeSingle();
            consultant = consultantData ? {
              id: consultantData.id,
              full_name: consultantData.name
            } : null;
          }

          return {
            ...order,
            customer: order.customers || null,
            engine: order.engines || null,
            consultant
          };
        })
      );

      setOrders(ordersWithConsultants);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ordens de serviço';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  const fetchOrderDetails = useCallback(async (orderId: string) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers!inner(id, name, phone, email),
          engines(id, type, brand, model)
        `)
        .eq('id', orderId)
        .eq('org_id', currentOrganization.id)
        .single();

      if (orderError) throw orderError;

      // Fetch consultant separately if needed
      let consultant = null;
      if (orderData.consultant_id) {
        const { data: consultantData } = await supabase
          .from('consultants')
          .select('id, name')
          .eq('id', orderData.consultant_id)
          .maybeSingle();
        consultant = consultantData ? {
          id: consultantData.id,
          full_name: consultantData.name
        } : null;
      }

      // Fetch materials
      const { data: materials } = await supabase
        .from('order_materials')
        .select('*')
        .eq('order_id', orderId)
        .order('used_at', { ascending: false });

      // Fetch warranties
      const { data: warranties } = await supabase
        .from('order_warranties')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      // Fetch status history
      const { data: statusHistory } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false });

      return {
        ...orderData,
        customer: orderData.customers || null,
        engine: orderData.engines || null,
        consultant,
        materials: materials || [],
        warranties: warranties || [],
        status_history: statusHistory || []
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar detalhes da ordem';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [currentOrganization?.id, toast]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: 'ativa' | 'concluida' | 'cancelada' | 'entregue', notes?: string) => {
    if (!currentOrganization?.id) return false;

    try {
      const updateData: { status: string; actual_delivery?: string } = { status: newStatus };
      
      // Se está marcando como entregue, definir actual_delivery
      if (newStatus === 'entregue') {
        updateData.actual_delivery = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      // Add notes to status history if provided
      if (notes) {
        await supabase
          .from('order_status_history')
          .update({ notes })
          .eq('order_id', orderId)
          .eq('new_status', newStatus)
          .order('changed_at', { ascending: false })
          .limit(1);
      }

      toast({
        title: "Status atualizado",
        description: "Status da ordem de serviço atualizado com sucesso.",
      });

      fetchOrders(); // Refresh the list
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [currentOrganization?.id, toast, fetchOrders]);

  const markOrderAsDelivered = useCallback(async (orderId: string, deliveryNotes?: string) => {
    if (!currentOrganization?.id) return false;

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.warn('Erro ao obter usuário:', userError);
      }
      
      const userId = userData?.user?.id || null;

      // Atualizar ordem: status = 'entregue' e actual_delivery = agora
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'entregue',
          actual_delivery: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('org_id', currentOrganization.id);

      if (updateError) throw updateError;

      // Criar entrada no histórico de status
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          old_status: null, // Será preenchido pelo trigger
          new_status: 'entregue',
          changed_by: userId,
          notes: deliveryNotes || 'Ordem de serviço entregue ao cliente',
          org_id: currentOrganization.id
        });

      if (historyError) {
        console.warn('Erro ao criar histórico de status:', historyError);
        // Não falhar se apenas o histórico falhar
      }

      toast({
        title: "Ordem Entregue",
        description: "A ordem de serviço foi marcada como entregue com sucesso.",
      });

      fetchOrders(); // Refresh the list
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao marcar ordem como entregue';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [currentOrganization?.id, toast, fetchOrders]);

  const addOrderMaterial = useCallback(async (material: Omit<OrderMaterial, 'id' | 'total_cost'>) => {
    if (!currentOrganization?.id) return false;

    try {
      const { error } = await supabase
        .from('order_materials')
        .insert({
          ...material,
          org_id: currentOrganization.id
        });

      if (error) throw error;

      toast({
        title: "Material adicionado",
        description: "Material adicionado à ordem de serviço com sucesso.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar material';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [currentOrganization?.id, toast]);

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>) => {
    if (!currentOrganization?.id) return false;

    try {
      // Remove campos read-only antes de fazer update
      const { customer: _customer, engine: _engine, consultant: _consultant, materials: _materials, warranties: _warranties, status_history: _status_history, ...updateData } = updates as Record<string, unknown>;
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: "Ordem atualizada",
        description: "Ordem de serviço atualizada com sucesso.",
      });

      fetchOrders();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar ordem';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [currentOrganization?.id, toast, fetchOrders]);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchOrders();
    }
  }, [currentOrganization?.id, fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderDetails,
    updateOrderStatus,
    markOrderAsDelivered,
    addOrderMaterial,
    updateOrder
  };
}