/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { translateStatus, ORDER_STATUS, WORKFLOW_STATUS, DIAGNOSTIC_STATUS, BUDGET_STATUS } from '@/utils/statusTranslations';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: 'order_status' | 'workflow_status' | 'diagnostic' | 'budget' | 'reservation' | 'material' | 'report' | 'warranty';
  title: string;
  description?: string;
  details?: Record<string, unknown>;
  user_id?: string;
  user_name?: string;
  icon_type: 'status' | 'workflow' | 'diagnostic' | 'budget' | 'package' | 'file' | 'shield';
  color: string;
}

const componentLabels: Record<string, string> = {
  'bloco': 'Bloco do Motor',
  'tampa_bloco': 'Tampa do Bloco',
  'parafusos_bloco': 'Parafusos do Bloco',
  'eixo': 'Eixo',
  'virabrequim': 'Eixo Virabrequim',
  'engrenagem_virabrequim': 'Engrenagem do Virabrequim',
  'polia_motor': 'Polia do Motor',
  'comando': 'Eixo de Comando',
  'engrenagem_comando': 'Engrenagem do Comando',
  'biela': 'Biela',
  'pistao': 'Pistão',
  'cabecote': 'Cabeçote do Motor',
  'molas_cabecote': 'Molas do Cabeçote',
  'valvulas': 'Válvulas',
  'chapeletas': 'Chapeletas',
  'alca_icamento': 'Alça de Içamento',
  'tampa_valvulas': 'Tampa de Válvulas',
  'tampa_oleo': 'Tampa de Óleo',
  'balancim': 'Balancim',
  'tucho': 'Tucho',
  'vareta_valvula': 'Vareta de Válvula',
  'volante_motor': 'Volante do Motor',
  'prensa_motor': 'Prensa do Motor',
  'disco_embreagem': 'Disco de Embreagem',
  'carcaca_embreagem': 'Carcaça/Lata de Embreagem',
  'rolamento_embreagem': 'Rolamento de Embreagem',
  'suporte_motor': 'Suporte do Motor',
  'suporte_alternador': 'Suporte do Alternador',
  'suporte_bomba_hidraulica': 'Suporte da Bomba Hidráulica',
  'alternador': 'Alternador',
  'motor_arranque': 'Motor de Arranque',
  'bomba_hidraulica': 'Bomba Hidráulica',
  'radiador_oleo': 'Radiador de óleo/Trocador de Calor',
  'filtro_lubrificante': 'Filtro Lubrificante',
  'correia': 'Correia',
  'tensor_correia': 'Tensor(es) da Correia',
  'bomba_oleo': 'Bomba de Óleo',
  'pescador_bomba_oleo': 'Pescador da Bomba de Óleo',
  'carter': 'Cárter',
  'coletor_admissao': 'Coletor de Admissão',
  'coletor_escape': 'Coletor de Escape',
  'flauta': 'Flauta',
  'bicos_injetores': 'Bicos Injetores',
  'respiro_motor': 'Respiro do Motor',
  'mangueira': 'Mangueira',
  'bomba_agua': 'Bomba d\'água',
  'polia_bomba_agua': 'Polia da Bomba d\'água',
  'cachimbo_agua': 'Cachimbo d\'água',
  'cano_agua': 'Cano d\'água',
  'velas_ignicao': 'Velas de Ignição',
  'cano': 'Cano',
  'vareta_nivel_oleo': 'Vareta do Nível de Óleo',
  'correia_acessorios': 'Correia de Acessórios',
  'esticador_correia_acessorios': 'Esticador da Correia de Acessórios',
  'tensor_esticador': 'Tensor com Esticador',
  'sensores': 'Sensores',
  'sensor_temperatura': 'Sensor de Temperatura',
  'sensor_oleo': 'Sensor de Óleo',
  'sensor_rotacao': 'Sensor de Rotação',
  'sensor_admissao': 'Sensor de Admissão',
  'sensor_fase': 'Sensor de Fase',
  'sensor_detonacao': 'Sensor de Detonação',
  'sonda_lambda': 'Sonda Lâmbda (descarga)',
  'corrente_distribuicao': 'Corrente de Distribuição + Tensor',
  'bobinas_ignicao': 'Bobinas de Ignição',
  'cabos_velas': 'Cabos de Velas',
  'bomba_gasolina': 'Bomba de Gasolina',
  'corpo_borboleta': 'Corpo de Borboleta',
  'carburador': 'Carburador',
  'protecao': 'Proteção',
  'pistao_com_anel': 'Pistão c/anel',
  'anel': 'Anel',
  'camisas': 'Camisas',
  'bucha_comando': 'Bucha Comando',
  'retentores_dianteiro': 'Retentores Dianteiro',
  'retentores_traseiro': 'Retentores Traseiro',
  'pista_virabrequim': 'Pista Virabrequim',
  'selo_comando': 'Selo do Comando',
  'gaxeta': 'Gaxeta',
  'selo_dagua': 'Selo D\'agua',
  'borrachas_camisa': 'Borrachas de Camisa',
  'calco_camisas': 'Calço das camisas',
  'bujao_carter': 'Bujão do Cárter',
  'tubo_bloco': 'Tubo do Bloco'
};

const reservationStatusLabels: Record<string, string> = {
  'reserved': 'Reservado',
  'separated': 'Separado',
  'applied': 'Aplicado',
  'cancelled': 'Cancelado',
  'expired': 'Expirado'
};

const warrantyTypeLabels: Record<string, string> = {
  'parts': 'Peças',
  'labor': 'Mão de Obra',
  'full': 'Completa'
};

const reportTypeLabels: Record<string, string> = {
  'metrology': 'Metrologia',
  'machining': 'Usinagem',
  'assembly': 'Montagem',
  'final_inspection': 'Inspeção Final'
};

const conformityStatusLabels: Record<string, string> = {
  'conform': 'Conforme',
  'non_conform': 'Não Conforme',
  'pending': 'Pendente'
};

const translateComponent = (component: string): string => {
  return componentLabels[component] || component;
};

export function useOrderTimeline(orderId: string, enabled: boolean = true) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = useCallback(async (overrideOrderId?: string) => {
    const targetOrderId = overrideOrderId || orderId;
    if (!targetOrderId) return;

    setLoading(true);
    try {
      const allEvents: TimelineEvent[] = [];

      // 1. Histórico de Status da Ordem
      const { data: orderHistory } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', targetOrderId)
        .order('changed_at', { ascending: false });

      orderHistory?.forEach(history => {
        const oldStatus = translateStatus(history.old_status, 'order') || history.old_status;
        const newStatus = translateStatus(history.new_status, 'order') || history.new_status;
        allEvents.push({
          id: `order-status-${history.id}`,
          timestamp: history.changed_at,
          event_type: 'order_status',
          title: `Status alterado para: ${newStatus}`,
          description: history.notes || undefined,
          details: { old_status: oldStatus, new_status: newStatus },
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
        .eq('order_workflow.order_id', targetOrderId)
        .order('changed_at', { ascending: false });

      workflowHistory?.forEach((history: unknown) => {
        const component = translateComponent(history.order_workflow?.component || '');
        const oldStatus = translateStatus(history.old_status, 'workflow') || history.old_status;
        const newStatus = translateStatus(history.new_status, 'workflow') || history.new_status;
        allEvents.push({
          id: `workflow-${history.id}`,
          timestamp: history.changed_at,
          event_type: 'workflow_status',
          title: `Workflow ${component}: ${newStatus}`,
          description: history.reason || undefined,
          details: { 
            component: component,
            old_status: oldStatus, 
            new_status: newStatus 
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
        .eq('order_id', targetOrderId)
        .order('diagnosed_at', { ascending: false });

      diagnostics?.forEach(diagnostic => {
        const component = translateComponent(diagnostic.component || '');
        const status = translateStatus(diagnostic.status, 'diagnostic') || diagnostic.status;
        allEvents.push({
          id: `diagnostic-${diagnostic.id}`,
          timestamp: diagnostic.diagnosed_at || new Date().toISOString(),
          event_type: 'diagnostic',
          title: `Diagnóstico de ${component} concluído`,
          description: `Status: ${status}`,
          details: { component: component },
          user_id: diagnostic.diagnosed_by || undefined,
          icon_type: 'diagnostic',
          color: 'bg-yellow-500',
        });
      });

      // 4. Orçamentos
      const { data: budgets } = await supabase
        .from('detailed_budgets')
        .select('*')
        .eq('order_id', targetOrderId)
        .order('created_at', { ascending: false });

      budgets?.forEach((budget: unknown) => {
        const component = translateComponent(budget.component || '');
        const status = translateStatus(budget.status, 'budget') || budget.status;
        
        // Evento de criação
        if (budget.budget_number) {
          allEvents.push({
            id: `budget-created-${budget.id}`,
            timestamp: budget.created_at,
            event_type: 'budget',
            title: `Orçamento ${budget.budget_number} criado`,
            description: `Componente: ${component} - Valor: R$ ${budget.total_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            details: { 
              budget_number: budget.budget_number,
              component: component,
              status: status,
              total_amount: budget.total_amount
            },
            user_id: budget.created_by || undefined,
            icon_type: 'budget',
            color: 'bg-blue-500',
          });
        }

        // Evento de atualização (se diferente da criação)
        if (budget.updated_at && budget.updated_at !== budget.created_at && budget.budget_number) {
          allEvents.push({
            id: `budget-updated-${budget.id}`,
            timestamp: budget.updated_at,
            event_type: 'budget',
            title: `Orçamento ${budget.budget_number} atualizado`,
            description: `Status: ${status}`,
            details: { 
              budget_number: budget.budget_number,
              component: component,
              status: status
            },
            icon_type: 'budget',
            color: 'bg-yellow-500',
          });
        }

        // Evento de reabertura
        if (budget.status === 'reopened' && budget.budget_number) {
          allEvents.push({
            id: `budget-reopened-${budget.id}`,
            timestamp: budget.updated_at || budget.created_at,
            event_type: 'budget',
            title: `Orçamento ${budget.budget_number} reaberto para edição`,
            description: 'O orçamento foi reaberto para incluir novos serviços ou peças',
            details: { 
              budget_number: budget.budget_number,
              component: component
            },
            icon_type: 'budget',
            color: 'bg-orange-500',
          });
        }

        // Evento de envio para cliente
        if (budget.status === 'pending_customer' && budget.budget_number) {
          allEvents.push({
            id: `budget-sent-${budget.id}`,
            timestamp: budget.updated_at || budget.created_at,
            event_type: 'budget',
            title: `Orçamento ${budget.budget_number} enviado para aprovação do cliente`,
            description: 'Aguardando aprovação do cliente',
            details: { 
              budget_number: budget.budget_number,
              component: component
            },
            icon_type: 'budget',
            color: 'bg-indigo-500',
          });
        }
      });

      // 5. Aprovações de Orçamento
      const { data: budgetApprovals } = await supabase
        .from('budget_approvals')
        .select(`
          *,
          detailed_budgets!inner(order_id, budget_number)
        `)
        .eq('detailed_budgets.order_id', targetOrderId)
        .order('approved_at', { ascending: false });

      budgetApprovals?.forEach((approval: unknown) => {
        if (approval.detailed_budgets?.budget_number) {
          const approvalTypeLabel = approval.approval_type === 'total' ? 'totalmente' : approval.approval_type === 'partial' ? 'parcialmente' : 'rejeitado';
          allEvents.push({
            id: `budget-approval-${approval.id}`,
            timestamp: approval.approved_at,
            event_type: 'budget',
            title: `Orçamento ${approval.detailed_budgets.budget_number} ${approvalTypeLabel}`,
            description: approval.approval_notes || undefined,
            details: { 
              approval_type: approvalTypeLabel,
              approved_amount: approval.approved_amount,
              budget_number: approval.detailed_budgets.budget_number
            },
            user_id: approval.registered_by || undefined,
            icon_type: 'budget',
            color: approval.approval_type === 'rejected' ? 'bg-red-500' : 'bg-green-500',
          });
        }
      });

      // 5. Reservas de Peças
      const { data: reservations } = await supabase
        .from('parts_reservations')
        .select('*')
        .eq('order_id', targetOrderId)
        .order('reserved_at', { ascending: false });

      reservations?.forEach(reservation => {
        const reservationStatus = reservationStatusLabels[reservation.reservation_status] || reservation.reservation_status;
        allEvents.push({
          id: `reservation-${reservation.id}`,
          timestamp: reservation.reserved_at || new Date().toISOString(),
          event_type: 'reservation',
          title: `Peça reservada: ${reservation.part_name}`,
          description: `Quantidade: ${reservation.quantity_reserved} - Status: ${reservationStatus}`,
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
        .eq('order_id', targetOrderId)
        .order('generated_at', { ascending: false });

      reports?.forEach(report => {
        const reportType = reportTypeLabels[report.report_type] || report.report_type;
        const component = translateComponent(report.component || '');
        const conformityStatus = conformityStatusLabels[report.conformity_status] || report.conformity_status;
        allEvents.push({
          id: `report-${report.id}`,
          timestamp: report.generated_at || new Date().toISOString(),
          event_type: 'report',
          title: `Relatório técnico gerado: ${reportType}`,
          description: `Componente: ${component} - Status: ${conformityStatus}`,
          details: { 
            report_type: reportType,
            conformity_status: conformityStatus 
          },
          user_id: report.generated_by || undefined,
          icon_type: 'file',
          color: 'bg-orange-500',
        });
      });

      // 6. Exclusões de Orçamento (via audit_log)
      const { data: budgetDeletions } = await supabase
        .from('audit_log')
        .select('*')
        .eq('table_name', 'detailed_budgets')
        .eq('operation', 'DELETE')
        .order('timestamp', { ascending: false });

      if (budgetDeletions) {
        // Buscar order_id dos orçamentos excluídos através dos old_values
        for (const deletion of budgetDeletions) {
          if (deletion.old_values?.order_id === targetOrderId) {
            if (deletion.old_values?.budget_number) {
              const component = deletion.old_values?.component ? translateComponent(deletion.old_values.component) : undefined;
              allEvents.push({
                id: `budget-deleted-${deletion.id}`,
                timestamp: deletion.timestamp,
                event_type: 'budget',
                title: `Orçamento ${deletion.old_values.budget_number} excluído`,
                description: component ? `Componente: ${component}` : undefined,
                details: { 
                  budget_number: deletion.old_values.budget_number,
                  component: component
                },
                user_id: deletion.user_id || undefined,
                icon_type: 'budget',
                color: 'bg-red-500',
              });
            }
          }
        }
      }

      // 7. Garantias
      const { data: warranties } = await supabase
        .from('order_warranties')
        .select('*')
        .eq('order_id', targetOrderId)
        .order('created_at', { ascending: false });

      warranties?.forEach(warranty => {
        const warrantyType = warrantyTypeLabels[warranty.warranty_type] || warranty.warranty_type;
        allEvents.push({
          id: `warranty-${warranty.id}`,
          timestamp: warranty.created_at,
          event_type: 'warranty',
          title: `Garantia ${warrantyType} criada`,
          description: `Válida até ${new Date(warranty.end_date).toLocaleDateString('pt-BR')}`,
          details: { 
            warranty_type: warrantyType,
            start_date: warranty.start_date,
            end_date: warranty.end_date 
          },
          icon_type: 'shield',
          color: 'bg-cyan-500',
        });
      });

      // Ordenar todos os eventos por timestamp (mais recente primeiro)
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Buscar nomes dos usuários
      const userIds = [...new Set(allEvents.map(e => e.user_id).filter(Boolean))] as string[];
      let userNames: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('user_basic_info')
          .select('user_id, name')
          .in('user_id', userIds);
          
        userNames = (users || []).reduce((acc, user) => ({
          ...acc,
          [user.user_id]: user.name
        }), {}) as Record<string, string>;
      }

      // Adicionar nomes dos usuários aos eventos
      const eventsWithUserNames = allEvents.map(event => ({
        ...event,
        user_name: event.user_id ? (userNames[event.user_id] || 'Usuário não identificado') : undefined
      }));

      setEvents(eventsWithUserNames);
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
  }, [orderId, toast]);

  useEffect(() => {
    if (!enabled) return;
    fetchTimeline();
  }, [orderId, enabled, fetchTimeline]);

  return {
    events,
    loading,
    fetchTimeline,
  };
}

