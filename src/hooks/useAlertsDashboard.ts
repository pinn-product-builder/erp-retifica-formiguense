import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { Database } from '@/integrations/supabase/types';

type StockAlert = Database['public']['Tables']['stock_alerts']['Row'];
type BudgetAlert = Database['public']['Tables']['budget_alerts']['Row'];
type PurchaseNeed = Database['public']['Tables']['purchase_needs']['Row'];

interface WorkflowPending {
  id: string;
  order_id: string;
  order_number: string;
  component: string;
  status: string;
  started_at: string;
  created_at: string;
  missing_checklist: string;
}

interface AlertsDashboardData {
  stockAlerts: StockAlert[];
  budgetAlerts: BudgetAlert[];
  purchaseNeeds: PurchaseNeed[];
  workflowPending: WorkflowPending[];
  totalAlerts: number;
}

export function useAlertsDashboard() {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [alerts, setAlerts] = useState<AlertsDashboardData>({
    stockAlerts: [],
    budgetAlerts: [],
    purchaseNeeds: [],
    workflowPending: [],
    totalAlerts: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      // 1. Alertas de Estoque
      const { data: stockAlerts, error: stockError } = await supabase
        .from('stock_alerts')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('alert_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (stockError) throw stockError;

      // 2. Alertas de Orçamento
      const { data: budgetAlerts, error: budgetError } = await supabase
        .from('budget_alerts')
        .select('*')
        .eq('is_active', true)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false });

      if (budgetError) throw budgetError;

      // 3. Necessidades de Compra
      const { data: purchaseNeeds, error: purchaseError } = await supabase
        .from('purchase_needs')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('status', 'pending')
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (purchaseError) throw purchaseError;

      // 4. Workflows Pendentes (com checklists obrigatórios não preenchidos)
      const { data: workflowPending, error: workflowError } = await supabase
        .rpc('get_workflows_pending_checklists', {
          p_org_id: currentOrganization.id
        });

      if (workflowError) {
        console.error('Erro ao buscar workflows pendentes:', workflowError);
      }

      const totalAlerts = 
        (stockAlerts?.length || 0) +
        (budgetAlerts?.length || 0) +
        (purchaseNeeds?.length || 0) +
        (workflowPending?.length || 0);

      setAlerts({
        stockAlerts: stockAlerts || [],
        budgetAlerts: budgetAlerts || [],
        purchaseNeeds: purchaseNeeds || [],
        workflowPending: workflowPending || [],
        totalAlerts,
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar alertas do sistema',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const dismissBudgetAlert = async (alertId: string) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('budget_alerts')
        .update({
          is_active: false,
          dismissed_at: new Date().toISOString(),
          dismissed_by: user.data.user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Alerta dispensado',
      });

      fetchAlerts(); // Refresh
      return true;
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao dispensar alerta',
        variant: 'destructive',
      });
      return false;
    }
  };

  const acknowledgeStockAlert = async (alertId: string) => {
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.data.user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Alerta reconhecido',
      });

      fetchAlerts(); // Refresh
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao reconhecer alerta',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Configurar real-time updates para alertas
    const stockAlertsSubscription = supabase
      .channel('stock_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_alerts',
          filter: `org_id=eq.${currentOrganization?.id}`,
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    const budgetAlertsSubscription = supabase
      .channel('budget_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_alerts',
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      stockAlertsSubscription.unsubscribe();
      budgetAlertsSubscription.unsubscribe();
    };
  }, [currentOrganization?.id]);

  return {
    alerts,
    loading,
    fetchAlerts,
    dismissBudgetAlert,
    acknowledgeStockAlert,
  };
}

