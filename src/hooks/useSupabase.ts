import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
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
  removed_by_company?: boolean;
  removed_by_employee_name?: string;
  engine_type_id?: string;
  org_id?: string;
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
  const { user } = useAuth();

  const handleError = (error: unknown, message: string) => {
    toast({
      title: "Erro",
      description: message,
      variant: "destructive"
    });
  };

  const getConsultants = async () => {
    if (!currentOrganization?.id) {
      handleError(new Error('Organização não encontrada'), 'Erro: organização não encontrada');
      return [];
    }

    try {
      setLoading(true);
      // @ts-expect-error - Supabase generated types cause deep instantiation error
      const query = supabase
        .from('consultants')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('active', true)
        .order('name');
      
      const { data, error } = await query;

      if (error) throw error;
      return data || [];
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
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          org_id: currentOrganization.id,
          created_by: user?.id
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
    if (!currentOrganization?.id) {
      handleError(new Error('Organização não encontrada'), 'Erro: organização não encontrada');
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('engines')
        .insert({
          ...engine,
          org_id: currentOrganization.id
        })
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
      const orderData = {
        ...order,
        org_id: currentOrganization.id
      } as Database['public']['Tables']['orders']['Insert'];
      
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
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
        uploaded_by: user?.id || null
      } as Database['public']['Tables']['order_photos']['Insert'];
      
      const { data, error } = await supabase
        .from('order_photos')
        .insert(photoData)
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
    if (!currentOrganization?.id) {
      handleError(new Error('Organização não encontrada'), 'Erro: organização não encontrada');
      return [];
    }

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
        .eq('org_id', currentOrganization.id)
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
    if (!currentOrganization?.id) {
      handleError(new Error('Organização não encontrada'), 'Erro: organização não encontrada');
      return [];
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('order_workflow')
        .select(`
          *,
          order:orders!inner(
            *,
            customer:customers(*),
            consultant:consultants(*),
            engine:engines(*)
          )
        `)
        .eq('component', component)
        .eq('order.org_id', currentOrganization.id)
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
