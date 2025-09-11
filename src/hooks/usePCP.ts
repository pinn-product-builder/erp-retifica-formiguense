import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface ProductionSchedule {
  id: string;
  order_id: string;
  component: string;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  estimated_hours: number;
  actual_hours?: number;
  priority: number;
  status: string;
  assigned_to?: string;
  notes?: string;
  order?: {
    order_number: string;
    customer?: {
      name: string;
    };
  };
}

export interface ResourceCapacity {
  id: string;
  resource_name: string;
  resource_type: string;
  daily_capacity_hours: number;
  is_active: boolean;
}

export interface ProductionAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export const usePCP = () => {
  const [schedules, setSchedules] = useState<ProductionSchedule[]>([]);
  const [resources, setResources] = useState<ResourceCapacity[]>([]);
  const [alerts, setAlerts] = useState<ProductionAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchSchedules = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('production_schedules')
        .select(`
          *,
          order:orders(
            order_number,
            customer:customers(name)
          )
        `)
        .eq('org_id', currentOrganization.id)
        .order('planned_start_date');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar cronogramas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('resource_capacity')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('resource_name');

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchAlerts = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('production_alerts')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const createSchedule = async (schedule: Omit<ProductionSchedule, 'id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('production_schedules')
        .insert({
          ...schedule,
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSchedules();
      toast({
        title: 'Sucesso',
        description: 'Cronograma criado com sucesso',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar cronograma',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSchedule = async (id: string, updates: Partial<ProductionSchedule>) => {
    try {
      const { error } = await supabase
        .from('production_schedules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchSchedules();
      toast({
        title: 'Sucesso',
        description: 'Cronograma atualizado com sucesso',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar cronograma',
        variant: 'destructive',
      });
      return false;
    }
  };

  const createResource = async (resource: Omit<ResourceCapacity, 'id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('resource_capacity')
        .insert({
          ...resource,
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchResources();
      toast({
        title: 'Sucesso',
        description: 'Recurso criado com sucesso',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar recurso',
        variant: 'destructive',
      });
      return null;
    }
  };

  const markAlertRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('production_alerts')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      await fetchAlerts();
    } catch (error) {
      console.error('Error marking alert read:', error);
    }
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchSchedules();
      fetchResources();
      fetchAlerts();
    }
  }, [currentOrganization?.id]);

  return {
    schedules,
    resources,
    alerts,
    loading,
    createSchedule,
    updateSchedule,
    createResource,
    markAlertRead,
    fetchSchedules,
    fetchResources,
    fetchAlerts,
  };
};