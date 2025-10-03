import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { Database } from '@/integrations/supabase/types';

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
  const { currentOrganization } = useOrganization();

  const handleError = (error: unknown, message: string) => {
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
    if (!currentOrganization?.id) {
      handleError(new Error('Organização não encontrada'), 'Erro: organização não encontrada');
      return null;
    }

    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          org_id: currentOrganization.id,
          created_by: user.user?.id
        })
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
    if (!currentOrganization?.id) {
      handleError(new Error('Organização não encontrada'), 'Erro: organização não encontrada');
      return null;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...order,
          org_id: currentOrganization.id
        })
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

  const uploadPhoto = async (file: File, orderId: string, photoType: string, component?: string, workflowStep?: string): Promise<string | null> => {
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
      const photoData = {
        order_id: orderId,
        component: component || null,
        workflow_step: workflowStep || null,
        photo_type: photoType,
        file_path: uploadData.path,
        file_name: file.name,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || null
      };
      
      const { data, error } = await supabase
        .from('order_photos')
        .insert(photoData as any)
        .select()
        .single();

      if (error) throw error;
      return data?.file_path || null;
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
          customers!inner(id, name, phone, email),
          consultants!inner(id, name, email, phone),
          engines(id, type, brand, model),
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

  const getWorkflowsByComponent = async (component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote') => {
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
