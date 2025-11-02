import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  type: 'direto' | 'oficina';
  name: string;
  document: string;
  phone: string;
  email?: string;
  address?: string;
  workshop_name?: string;
  workshop_cnpj?: string;
  workshop_contact?: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  // Buscar clientes
  const fetchCustomers = useCallback(async (searchTerm?: string) => {
    if (!currentOrganization?.id) return [];

    try {
      setLoading(true);
      let query = supabase
        .from('customers')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('name', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,document.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const customersData = data as Customer[];

      setCustomers(customersData);
      return customersData;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Buscar cliente por ID
  const getCustomerById = useCallback(async (customerId: string) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('org_id', currentOrganization.id)
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return null;
    }
  }, [currentOrganization?.id]);

  // Criar cliente
  const createCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'org_id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customerData,
          org_id: currentOrganization.id,
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso"
      });

      // Atualizar lista local
      setCustomers(prev => [data as Customer, ...prev]);
      return data as Customer;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar cliente",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Atualizar cliente
  const updateCustomer = useCallback(async (customerId: string, updates: Partial<Customer>) => {
    if (!currentOrganization?.id) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)
        .eq('org_id', currentOrganization.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso"
      });

      // Atualizar lista local
      setCustomers(prev => prev.map(c => c.id === customerId ? data as Customer : c));
      return data as Customer;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar cliente",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  // Deletar cliente
  const deleteCustomer = useCallback(async (customerId: string) => {
    if (!currentOrganization?.id) return false;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso"
      });

      // Atualizar lista local
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  return {
    customers,
    loading,
    fetchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}
