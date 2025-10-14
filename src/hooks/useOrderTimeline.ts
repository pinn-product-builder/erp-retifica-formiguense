import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: 'order_status' | 'workflow_status' | 'diagnostic' | 'budget' | 'reservation' | 'material' | 'report' | 'warranty';
  title: string;
  description?: string;
  details?: Record<string, any>;
  user_id?: string;
  icon_type: 'status' | 'workflow' | 'diagnostic' | 'budget' | 'package' | 'file' | 'shield';
  color: string;
}

export function useOrderTimeline(orderId: string) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const allEvents: TimelineEvent[] = [];

      // 1. Histórico de Status da Ordem
      const { data: orderHistory } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false });

      orderHistory?.forEach(history => {
        allEvents.push({
          id: `order-status-${history.id}`,
          timestamp: history.changed_at,
          event_type: 'order_status',
          title: `Status alterado para: ${history.new_status}`,
          description: history.notes || undefined,
          details: { old_status: history.old_status, new_status: history.new_status },
          user_id: history.changed_by || undefined,
          icon_type: 'status',
          color: 'bg-blue-500',
        });
      });

      // 2. Histórico de Workflow
      const { data: workflowHistory } = await supabase
        .from('workflow_status_history')
        .select(`
          *,
          order_workflow!inner(component)
        `)
        .eq('order_workflow.order_id', orderId)
        .order('changed_at', { ascending: false });

      workflowHistory?.forEach((history: any) => {
        allEvents.push({
          id: `workflow-${history.id}`,
          timestamp: history.changed_at,
          event_type: 'workflow_status',
          title: `Workflow ${history.order_workflow?.component}: ${history.new_status}`,
          description: history.reason || undefined,
          details: { 
            component: history.order_workflow?.component,
            old_status: history.old_status, 
            new_status: history.new_status 
          },
          user_id: history.changed_by || undefined,
          icon_type: 'workflow',
          color: 'bg-purple-500',
        });
      });

      // 3. Diagnósticos
      const { data: diagnostics } = await supabase
        .from('diagnostic_checklist_responses')
        .select('*')
        .eq('order_id', orderId)
        .order('diagnosed_at', { ascending: false });

      diagnostics?.forEach(diagnostic => {
        allEvents.push({
          id: `diagnostic-${diagnostic.id}`,
          timestamp: diagnostic.diagnosed_at || new Date().toISOString(),
          event_type: 'diagnostic',
          title: `Diagnóstico de ${diagnostic.component} concluído`,
          description: `Status: ${diagnostic.status}`,
          details: { component: diagnostic.component },
          user_id: diagnostic.diagnosed_by || undefined,
          icon_type: 'diagnostic',
          color: 'bg-yellow-500',
        });
      });

      // 4. Aprovações de Orçamento
      const { data: budgetApprovals } = await supabase
        .from('budget_approvals')
        .select(`
          *,
          detailed_budgets!inner(order_id)
        `)
        .eq('detailed_budgets.order_id', orderId)
        .order('approved_at', { ascending: false });

      budgetApprovals?.forEach((approval: any) => {
        allEvents.push({
          id: `budget-${approval.id}`,
          timestamp: approval.approved_at,
          event_type: 'budget',
          title: `Orçamento ${approval.approval_type === 'total' ? 'totalmente' : 'parcialmente'} aprovado`,
          description: approval.approval_notes || undefined,
          details: { 
            approval_type: approval.approval_type,
            approved_amount: approval.approved_amount 
          },
          user_id: approval.registered_by || undefined,
          icon_type: 'budget',
          color: 'bg-green-500',
        });
      });

      // 5. Reservas de Peças
      const { data: reservations } = await supabase
        .from('parts_reservations')
        .select('*')
        .eq('order_id', orderId)
        .order('reserved_at', { ascending: false });

      reservations?.forEach(reservation => {
        allEvents.push({
          id: `reservation-${reservation.id}`,
          timestamp: reservation.reserved_at || new Date().toISOString(),
          event_type: 'reservation',
          title: `Peça reservada: ${reservation.part_name}`,
          description: `Quantidade: ${reservation.quantity_reserved} - Status: ${reservation.reservation_status}`,
          details: { 
            part_code: reservation.part_code,
            quantity: reservation.quantity_reserved 
          },
          user_id: reservation.reserved_by || undefined,
          icon_type: 'package',
          color: 'bg-indigo-500',
        });

        // Adicionar eventos de separação e aplicação
        if (reservation.separated_at) {
          allEvents.push({
            id: `separation-${reservation.id}`,
            timestamp: reservation.separated_at,
            event_type: 'material',
            title: `Peça separada: ${reservation.part_name}`,
            description: `Quantidade: ${reservation.quantity_separated || reservation.quantity_reserved}`,
            details: { part_code: reservation.part_code },
            user_id: reservation.separated_by || undefined,
            icon_type: 'package',
            color: 'bg-teal-500',
          });
        }

        if (reservation.applied_at) {
          allEvents.push({
            id: `application-${reservation.id}`,
            timestamp: reservation.applied_at,
            event_type: 'material',
            title: `Peça aplicada: ${reservation.part_name}`,
            description: `Quantidade: ${reservation.quantity_applied || reservation.quantity_reserved}`,
            details: { part_code: reservation.part_code },
            user_id: reservation.applied_by || undefined,
            icon_type: 'package',
            color: 'bg-emerald-500',
          });
        }
      });

      // 6. Relatórios Técnicos
      const { data: reports } = await supabase
        .from('technical_reports')
        .select('*')
        .eq('order_id', orderId)
        .order('generated_at', { ascending: false });

      reports?.forEach(report => {
        allEvents.push({
          id: `report-${report.id}`,
          timestamp: report.generated_at || new Date().toISOString(),
          event_type: 'report',
          title: `Relatório técnico gerado: ${report.report_type}`,
          description: `Componente: ${report.component} - Status: ${report.conformity_status}`,
          details: { 
            report_type: report.report_type,
            conformity_status: report.conformity_status 
          },
          user_id: report.generated_by || undefined,
          icon_type: 'file',
          color: 'bg-orange-500',
        });
      });

      // 7. Garantias
      const { data: warranties } = await supabase
        .from('order_warranties')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      warranties?.forEach(warranty => {
        allEvents.push({
          id: `warranty-${warranty.id}`,
          timestamp: warranty.created_at,
          event_type: 'warranty',
          title: `Garantia ${warranty.warranty_type} criada`,
          description: `Válida até ${new Date(warranty.end_date).toLocaleDateString('pt-BR')}`,
          details: { 
            warranty_type: warranty.warranty_type,
            start_date: warranty.start_date,
            end_date: warranty.end_date 
          },
          icon_type: 'shield',
          color: 'bg-cyan-500',
        });
      });

      // Ordenar todos os eventos por timestamp (mais recente primeiro)
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar linha do tempo da ordem',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [orderId]);

  return {
    events,
    loading,
    fetchTimeline,
  };
}

