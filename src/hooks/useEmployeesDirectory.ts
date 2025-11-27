import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeDirectoryEntry {
  id: string;
  full_name: string;
  position?: string | null;
}

export function useEmployeesDirectory() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<EmployeeDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position, is_active')
        .eq('org_id', currentOrganization.id)
        .order('full_name', { ascending: true });

      if (error) throw error;

      const sanitized = (data || [])
        .filter((employee) => employee.is_active !== false)
        .map(({ id, full_name, position }) => ({
          id,
          full_name,
          position,
        }));

      setEmployees(sanitized);
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de funcionários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    refreshEmployees: fetchEmployees,
  };
}

