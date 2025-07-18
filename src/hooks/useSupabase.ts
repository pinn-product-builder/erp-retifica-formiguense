import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id?: string;
  type: 'oficina' | 'direto';
  name: string;
  document: string;
  phone: string;
  email?: string;
  address?: string;
  workshop_name?: string;
  workshop_cnpj?: string;
  workshop_contact?: string;
}

export interface Engine {
  id?: string;
  type: string;
  brand: string;
  model: string;
  fuel_type: string;
  serial_number?: string;
  is_complete?: boolean;
  assembly_state?: string;
  has_block?: boolean;
  has_head?: boolean;
  has_crankshaft?: boolean;
  has_piston?: boolean;
  has_connecting_rod?: boolean;
  turns_manually?: boolean;
}

export interface Order {
  customer_id: string;
  consultant_id: string;
  engine_id: string;
  collection_date: string;
  collection_time: string;
  collection_location: string;
  driver_name: string;
  failure_reason?: string;
  initial_observations?: string;
}

export function useSupabase() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleError = (error: any, message: string) => {
    console.error(message, error);
    toast({
      title: "Erro",
      description: message,
      variant: "destructive"
    });
  };

  const getConsultants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao carregar consultores');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customer: Customer) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar cliente');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createEngine = async (engine: Engine) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('engines')
        .insert(engine)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar motor');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (order: Order) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .insert(order as any)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Sucesso!",
        description: `Ordem de serviço ${data.order_number} criada com sucesso!`
      });
      
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar ordem de serviço');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File, orderId: string, photoType: string, component?: string, workflowStep?: string) => {
    try {
      setLoading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}/${photoType}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save photo record in database
      const { data, error } = await supabase
        .from('order_photos')
        .insert({
          order_id: orderId,
          component: component as any,
          workflow_step: workflowStep as any,
          photo_type: photoType,
          file_path: uploadData.path,
          file_name: file.name,
          uploaded_by: 'Sistema' // TODO: usar usuário logado
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao fazer upload da foto');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          consultant:consultants(*),
          engine:engines(*),
          order_workflow(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao carregar ordens de serviço');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowsByComponent = async (component: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order_workflow')
        .select(`
          *,
          order:orders(
            *,
            customer:customers(*),
            consultant:consultants(*),
            engine:engines(*)
          )
        `)
        .eq('component', component)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao carregar workflows');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getConsultants,
    createCustomer,
    createEngine,
    createOrder,
    uploadPhoto,
    getOrders,
    getWorkflowsByComponent
  };
}
