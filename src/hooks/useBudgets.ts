import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useBudgets() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const handleError = (error: any, message: string) => {
    console.error(message, error);
    toast({
      title: "Erro",
      description: message,
      variant: "destructive"
    });
  };

  // --- Budgets ---
  const getBudgets = async (orderId?: string) => {
    if (!orgId) return [];
    try {
      setLoading(true);
      let query = supabase
        .from('budgets')
        .select(`
          *,
          orders!inner(
            order_number,
            customers!inner(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (orderId) {
        query = query.eq('order_id', orderId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao carregar orçamentos');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (budget: any) => {
    if (!orgId) {
      handleError(null, 'Organização não encontrada.');
      return null;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...budget })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Sucesso", description: "Orçamento criado com sucesso." });
      return data;
    } catch (error) {
      handleError(error, 'Erro ao criar orçamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (id: string, updates: any) => {
    if (!orgId) {
      handleError(null, 'Organização não encontrada.');
      return null;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Sucesso", description: "Orçamento atualizado com sucesso." });
      return data;
    } catch (error) {
      handleError(error, 'Erro ao atualizar orçamento');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBudget = async (id: string) => {
    if (!orgId) {
      handleError(null, 'Organização não encontrada.');
      return false;
    }
    try {
      setLoading(true);
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Sucesso", description: "Orçamento excluído com sucesso." });
      return true;
    } catch (error) {
      handleError(error, 'Erro ao excluir orçamento');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Service Prices ---
  const getServicePrices = async (serviceName?: string) => {
    if (!orgId) return [];
    try {
      setLoading(true);
      let query = supabase
        .from('service_price_table')
        .select('*')
        .eq('org_id', orgId)
        .order('service_name', { ascending: true });

      if (serviceName) {
        query = query.ilike('service_name', `%${serviceName}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao carregar preços de serviços');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getServicePrice = async (serviceName: string) => {
    if (!orgId) return null;
    try {
      const { data, error } = await supabase
        .from('service_price_table')
        .select('*')
        .eq('org_id', orgId)
        .ilike('service_name', serviceName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao buscar preço do serviço');
      return null;
    }
  };

  // --- Parts Prices ---
  const getPartsPrices = async (partName?: string) => {
    if (!orgId) return [];
    try {
      setLoading(true);
      let query = supabase
        .from('parts_price_table')
        .select('*')
        .eq('org_id', orgId)
        .order('part_name', { ascending: true });

      if (partName) {
        query = query.ilike('part_name', `%${partName}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao carregar preços de peças');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPartPrice = async (partName: string) => {
    if (!orgId) return null;
    try {
      const { data, error } = await supabase
        .from('parts_price_table')
        .select('*')
        .eq('org_id', orgId)
        .ilike('part_name', partName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      handleError(error, 'Erro ao buscar preço da peça');
      return null;
    }
  };

  // --- Budget Calculation ---
  const calculateBudgetFromServices = async (services: any[], parts: any[] = []) => {
    try {
      let laborTotal = 0;
      let partsTotal = 0;
      const calculatedServices = [];
      const calculatedParts = [];

      // Calculate services
      for (const service of services) {
        const servicePrice = await getServicePrice(service.name);
        const laborHours = service.labor_hours || 1;
        const laborRate = (servicePrice as any)?.base_price || service.labor_rate || 50;
        const serviceTotal = laborHours * laborRate;

        calculatedServices.push({
          ...service,
          labor_hours: laborHours,
          labor_rate: laborRate,
          labor_total: serviceTotal,
          price_source: servicePrice ? 'price_table' : 'manual'
        });

        laborTotal += serviceTotal;
      }

      // Calculate parts
      for (const part of parts) {
        const partPrice = await getPartPrice(part.name);
        const quantity = part.quantity || 1;
        const unitPrice = (partPrice as any)?.unit_price || part.unit_price || 0;
        const partTotal = quantity * unitPrice;

        calculatedParts.push({
          ...part,
          quantity,
          unit_price: unitPrice,
          total: partTotal,
          price_source: partPrice ? 'price_table' : 'manual'
        });

        partsTotal += partTotal;
      }

      const subtotal = laborTotal + partsTotal;
      const discount = 0; // TODO: implement discount logic
      const taxPercentage = 0; // TODO: implement tax logic
      const taxAmount = subtotal * (taxPercentage / 100);
      const total = subtotal - discount + taxAmount;

      return {
        services: calculatedServices,
        parts: calculatedParts,
        labor_hours: calculatedServices.reduce((sum, s) => sum + s.labor_hours, 0),
        labor_rate: calculatedServices.length > 0 
          ? calculatedServices.reduce((sum, s) => sum + s.labor_rate, 0) / calculatedServices.length 
          : 0,
        labor_total: laborTotal,
        parts_total: partsTotal,
        subtotal,
        discount,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        total_amount: total
      };
    } catch (error) {
      handleError(error, 'Erro ao calcular orçamento');
      return null;
    }
  };

  return {
    loading,
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    getServicePrices,
    getServicePrice,
    getPartsPrices,
    getPartPrice,
    calculateBudgetFromServices,
  };
}