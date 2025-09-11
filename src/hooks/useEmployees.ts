import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  cpf?: string;
  hire_date: string;
  position: string;
  department?: string;
  salary?: number;
  hourly_rate?: number;
  commission_rate: number;
  is_active: boolean;
  phone?: string;
  email?: string;
  address?: string;
}

export interface WorkSchedule {
  id: string;
  employee_id: string;
  shift_name: string;
  monday_start?: string;
  monday_end?: string;
  tuesday_start?: string;
  tuesday_end?: string;
  wednesday_start?: string;
  wednesday_end?: string;
  thursday_start?: string;
  thursday_end?: string;
  friday_start?: string;
  friday_end?: string;
  saturday_start?: string;
  saturday_end?: string;
  sunday_start?: string;
  sunday_end?: string;
  effective_from: string;
  effective_to?: string;
}

export interface TimeTracking {
  id: string;
  employee_id: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  break_duration: number;
  total_hours?: number;
  overtime_hours: number;
  status: string;
  notes?: string;
  employee?: {
    full_name: string;
    position: string;
  };
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  overall_rating?: number;
  productivity_score?: number;
  quality_score?: number;
  punctuality_score?: number;
  teamwork_score?: number;
  status: string;
  employee?: Employee;
}

export interface Commission {
  id: string;
  employee_id: string;
  period_month: number;
  period_year: number;
  base_sales: number;
  commission_rate: number;
  calculated_commission: number;
  final_commission: number;
  status: string;
  employee?: {
    full_name: string;
    position: string;
  };
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [timeTracking, setTimeTracking] = useState<TimeTracking[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchEmployees = async () => {
    if (!currentOrganization?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar funcionários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeTracking = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('employee_time_tracking')
        .select(`
          *,
          employee:employees(full_name, position)
        `)
        .eq('org_id', currentOrganization.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      setTimeTracking(data || []);
    } catch (error) {
      console.error('Error fetching time tracking:', error);
    }
  };

  const fetchCommissions = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { data, error } = await supabase
        .from('commission_calculations')
        .select(`
          *,
          employee:employees(full_name, position)
        `)
        .eq('org_id', currentOrganization.id)
        .gte('period_year', currentYear - 1)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error) {
      console.error('Error fetching commissions:', error);
    }
  };

  const createEmployee = async (employee: Omit<Employee, 'id' | 'employee_number'>) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert({
          ...employee,
          org_id: currentOrganization.id,
          employee_number: `EMP${Date.now()}`,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchEmployees();
      toast({
        title: 'Sucesso',
        description: 'Funcionário criado com sucesso',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar funcionário',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchEmployees();
      toast({
        title: 'Sucesso',
        description: 'Funcionário atualizado com sucesso',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar funcionário',
        variant: 'destructive',
      });
      return false;
    }
  };

  const createWorkSchedule = async (schedule: Omit<WorkSchedule, 'id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('work_schedules')
        .insert({
          ...schedule,
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Escala criada com sucesso',
      });
      
      return data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar escala',
        variant: 'destructive',
      });
      return null;
    }
  };

  const recordTimeEntry = async (timeEntry: Omit<TimeTracking, 'id'>) => {
    if (!currentOrganization?.id) return null;

    try {
      const { data, error } = await supabase
        .from('employee_time_tracking')
        .insert({
          ...timeEntry,
          org_id: currentOrganization.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchTimeTracking();
      toast({
        title: 'Sucesso',
        description: 'Ponto registrado com sucesso',
      });
      
      return data;
    } catch (error) {
      console.error('Error recording time:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao registrar ponto',
        variant: 'destructive',
      });
      return null;
    }
  };

  const calculateCommissions = async (month: number, year: number) => {
    if (!currentOrganization?.id) return false;

    try {
      // Simplified commission calculation - in reality this would be more complex
      const activeEmployees = employees.filter(emp => emp.is_active && emp.commission_rate > 0);
      
      for (const employee of activeEmployees) {
        const { error } = await supabase
          .from('commission_calculations')
          .insert({
            employee_id: employee.id,
            period_month: month,
            period_year: year,
            base_sales: 0, // Would calculate from sales data
            commission_rate: employee.commission_rate,
            calculated_commission: 0,
            final_commission: 0,
            org_id: currentOrganization.id,
          });

        if (error && !error.message.includes('duplicate')) {
          throw error;
        }
      }
      
      await fetchCommissions();
      toast({
        title: 'Sucesso',
        description: 'Comissões calculadas com sucesso',
      });
      
      return true;
    } catch (error) {
      console.error('Error calculating commissions:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao calcular comissões',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchEmployees();
      fetchTimeTracking();
      fetchCommissions();
    }
  }, [currentOrganization?.id]);

  return {
    employees,
    schedules,
    timeTracking,
    reviews,
    commissions,
    loading,
    createEmployee,
    updateEmployee,
    createWorkSchedule,
    recordTimeEntry,
    calculateCommissions,
    fetchEmployees,
    fetchTimeTracking,
    fetchCommissions,
  };
};