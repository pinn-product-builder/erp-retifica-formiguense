// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { EngineComponent } from '@/hooks/useEngineComponents';

export interface ProductionSchedule {
  id: string;
  order_id: string;
  component: EngineComponent;
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
  const [totalCount, setTotalCount] = useState(0);
  const [currentPageState, setCurrentPageState] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(10);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchSchedules = useCallback(async (page: number = currentPageState, pageSize: number = pageSizeState) => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    setCurrentPageState(page);
    setPageSizeState(pageSize);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('production_schedules')
        .select(`
          *,
          order:orders(
            order_number,
            customer:customers(name)
          )
        `, { count: 'exact' })
        .eq('org_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setSchedules(data || []);
      setTotalCount(count || 0);
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
  }, [currentOrganization?.id, toast]);

  const fetchResources = useCallback(async () => {
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
  }, [currentOrganization?.id]);

  const fetchAlerts = useCallback(async () => {
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
  }, [currentOrganization?.id]);

  const createSchedule = async (schedule: Omit<ProductionSchedule, 'id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('production_schedules')
        .insert({
          order_id: schedule.order_id,
          component: schedule.component,
          planned_start_date: schedule.planned_start_date,
          planned_end_date: schedule.planned_end_date,
          estimated_hours: schedule.estimated_hours,
          priority: schedule.priority,
          status: schedule.status,
          assigned_to: schedule.assigned_to,
          notes: schedule.notes,
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchSchedules(currentPageState, pageSizeState);
      
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
      const updateData: unknown = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.actual_start_date) updateData.actual_start_date = updates.actual_start_date;
      if (updates.actual_end_date) updateData.actual_end_date = updates.actual_end_date;
      if (updates.actual_hours) updateData.actual_hours = updates.actual_hours;
      if (updates.assigned_to) updateData.assigned_to = updates.assigned_to;
      if (updates.notes) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('production_schedules')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      await fetchSchedules(currentPageState, pageSizeState);
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
      fetchResources();
      fetchAlerts();
    }
  }, [currentOrganization?.id, fetchResources, fetchAlerts]);

  return {
    schedules,
    resources,
    alerts,
    loading,
    totalCount,
    createSchedule,
    updateSchedule,
    createResource,
    markAlertRead,
    fetchSchedules,
    fetchResources,
    fetchAlerts,
  };
};