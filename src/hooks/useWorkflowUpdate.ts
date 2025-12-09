
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

export function useWorkflowUpdate() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateWorkflowStatus = async (workflowId: string, newStatus: string, changeReason?: string) => {
    try {
      setLoading(true);

      // Primeiro, buscar o status atual para o histórico
      const { data: currentWorkflow, error: fetchError } = await supabase
        .from('order_workflow')
        .select('status, component, order_id, started_at, completed_at')
        .eq('id', workflowId)
        .single();

      if (fetchError) throw fetchError;

      const currentTime = new Date().toISOString();
      const updateData: Record<string, string | null> = { 
        status: newStatus,
        updated_at: currentTime
      };

      if (currentWorkflow.status !== newStatus) {
        // Reset timestamps so the new etapa can be iniciated/pausada novamente
        updateData.started_at = null;
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('order_workflow')
        .update(updateData)
        .eq('id', workflowId);

      if (error) throw error;

      // Registrar no histórico de auditoria
      if (currentWorkflow.status !== newStatus) {
        const { error: historyError } = await supabase
          .from('workflow_status_history')
          .insert({
            order_workflow_id: workflowId,
            old_status: currentWorkflow.status as "entrada" | "metrologia" | "usinagem" | "montagem" | "pronto" | "garantia" | "entregue",
            new_status: newStatus as "entrada" | "metrologia" | "usinagem" | "montagem" | "pronto" | "garantia" | "entregue",
            changed_by: (await supabase.auth.getUser()).data.user?.id,
            reason: changeReason,
          });

        if (historyError) {
          console.error('Erro ao registrar histórico:', historyError);
          // Não falha a operação principal por erro no histórico
        }
      }

      toast({
        title: "Status atualizado!",
        description: `Componente movido para ${newStatus.toUpperCase()}`
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflowDetails = async (workflowId: string, details: { notes?: string; assigned_to?: string }) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('order_workflow')
        .update({
          ...details,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: "Detalhes salvos!",
        description: "Informações do workflow atualizadas"
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os detalhes",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('order_workflow')
        .update({
          started_at: new Date().toISOString(),
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: "Etapa iniciada!",
        description: "O trabalho nesta etapa foi iniciado"
      });

      return true;
    } catch (error) {
      console.error('Erro ao iniciar workflow:', error);
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a etapa",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeWorkflow = async (workflowId: string, autoAdvance: boolean = true) => {
    try {
      setLoading(true);

      // Buscar dados do workflow atual
      const { data: currentWorkflow, error: fetchError } = await supabase
        .from('order_workflow')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (fetchError) throw fetchError;

      // Marcar como concluído
      const { error: updateError } = await supabase
        .from('order_workflow')
        .update({
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (updateError) throw updateError;

      // Se auto-avanço está habilitado, tentar avançar para próxima etapa
      if (autoAdvance) {
        await advanceToNextStatus(currentWorkflow);
      }

      toast({
        title: "Etapa concluída!",
        description: autoAdvance ? "Avançando para próxima etapa..." : "O trabalho nesta etapa foi finalizado"
      });

      return true;
    } catch (error) {
      console.error('Erro ao concluir workflow:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a etapa",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const advanceToNextStatus = async (currentWorkflow: { id: string; status: string; component: string; order_id?: string }) => {
    try {
      // 1. VERIFICAR CHECKLISTS OBRIGATÓRIOS
      const { data: requiredChecklists, error: checklistError } = await supabase
        .from('workflow_checklists')
        .select('id, checklist_name, blocks_workflow_advance')
        .eq('step_key', currentWorkflow.status)
        .eq('component', currentWorkflow.component as Database["public"]["Enums"]["engine_component"])
        .eq('is_mandatory', true)
        .eq('is_active', true);

      if (checklistError) {
        console.error('Erro ao verificar checklists:', checklistError);
      }

      // Se existem checklists obrigatórios que bloqueiam o avanço
      if (requiredChecklists && requiredChecklists.length > 0) {
        for (const checklist of requiredChecklists) {
          if (checklist.blocks_workflow_advance) {
            // Verificar se o checklist foi preenchido e aprovado
            const { data: response, error: responseError } = await supabase
              .from('workflow_checklist_responses')
              .select('overall_status')
              .eq('order_workflow_id', currentWorkflow.id)
              .eq('checklist_id', checklist.id)
              .maybeSingle();

            if (responseError) {
              console.error('Erro ao verificar resposta do checklist:', responseError);
            }

            // Se não foi preenchido ou não está aprovado, bloquear
            if (!response || response.overall_status !== 'approved') {
              toast({
                title: "🔒 Checklist Obrigatório Pendente",
                description: `O checklist "${checklist.checklist_name}" deve ser completado e aprovado antes de avançar.`,
                variant: "destructive"
              });
              return false;
            }
          }
        }
      }

      // 2. BUSCAR PRÓXIMO STATUS PERMITIDO
      const { data: nextStatusData, error: nextStatusError } = await supabase
        .from('status_prerequisites')
        .select('to_status_key, transition_type')
        .eq('from_status_key', currentWorkflow.status)
        .eq('entity_type', 'workflow')
        .eq('is_active', true)
        .order('id')
        .limit(1)
        .single();

      if (nextStatusError || !nextStatusData) {
        console.log('Nenhum próximo status encontrado ou workflow finalizado');
        toast({
          title: "Etapa concluída!",
          description: "Não há próxima etapa configurada",
        });
        return false;
      }

      // 3. VERIFICAR TIPO DE TRANSIÇÃO
      if (nextStatusData.transition_type === 'approval_required') {
        toast({
          title: "Etapa concluída!",
          description: "Próxima etapa requer aprovação de supervisor",
          variant: "default"
        });
        return false;
      }

      // 4. AVANÇAR PARA PRÓXIMO STATUS
      const success = await updateWorkflowStatus(
        currentWorkflow.id, 
        nextStatusData.to_status_key,
        nextStatusData.transition_type === 'automatic' 
          ? 'Avanço automático após conclusão da etapa anterior'
          : 'Avançado manualmente pelo usuário após conclusão'
      );

      if (success) {
        await supabase
          .from('order_workflow')
          .update({
            started_at: null,
            completed_at: null,
          })
          .eq('id', currentWorkflow.id);

        toast({
          title: "✅ Etapa avançada!",
          description: `Workflow movido para: ${nextStatusData.to_status_key}`,
        });
        
        // 5. VERIFICAR SE PRECISA GERAR RELATÓRIO TÉCNICO
        await checkAndGenerateTechnicalReport(currentWorkflow);
      }

      return success;
    } catch (error) {
      console.error('Erro ao avançar para próximo status:', error);
      toast({
        title: "Erro ao avançar",
        description: "Não foi possível avançar para a próxima etapa",
        variant: "destructive"
      });
      return false;
    }
  };

  const checkAndGenerateTechnicalReport = async (workflow: { id: string; status: string; component: string; order_id?: string }) => {
    try {
      // Buscar se a etapa concluída requer relatório técnico
      const { data: stepConfig, error: stepError } = await supabase
        .from('workflow_steps')
        .select('technical_report_required, step_name')
        .eq('step_key', workflow.status)
        .eq('component', workflow.component as Database["public"]["Enums"]["engine_component"])
        .maybeSingle();

      if (stepError || !stepConfig || !stepConfig.technical_report_required) {
        return; // Não requer relatório
      }

      // Buscar dados do checklist para incluir no relatório
      const { data: checklistResponse } = await supabase
        .from('workflow_checklist_responses')
        .select('*')
        .eq('order_workflow_id', workflow.id)
        .maybeSingle();

      // Buscar ordem para pegar org_id
      const { data: order } = await supabase
        .from('orders')
        .select('org_id')
        .eq('id', workflow.order_id)
        .single();

      if (!order) return;

      // Gerar relatório técnico automático
      const { error: reportError } = await supabase
        .from('technical_reports')
        .insert({
          order_id: workflow.order_id,
          component: workflow.component as Database["public"]["Enums"]["engine_component"],
          report_type: workflow.status,
          report_template: 'standard',
          report_data: {
            step_name: stepConfig.step_name,
            checklist_data: checklistResponse?.responses || {},
            measurements: checklistResponse?.measurements || {},
          },
          measurements_data: checklistResponse?.measurements || {},
          photos_data: checklistResponse?.photos || [],
          conformity_status: checklistResponse?.overall_status === 'approved' ? 'conforming' : 'pending',
          generated_automatically: true,
          org_id: order.org_id,
        });

      if (reportError) {
        console.error('Erro ao gerar relatório técnico:', reportError);
      } else {
        toast({
          title: "📄 Relatório Técnico Gerado",
          description: `Relatório automático criado para ${stepConfig.step_name}`,
        });
      }
    } catch (error) {
      console.error('Erro ao verificar necessidade de relatório:', error);
    }
  };

  const checkAndAdvanceOrderWorkflows = async (orderId: string, currentStatus: string) => {
    try {
      // Buscar todos os workflows da OS no status atual
      const { data: workflows, error: fetchError } = await supabase
        .from('order_workflow')
        .select('id, status, component, completed_at')
        .eq('order_id', orderId)
        .eq('status', currentStatus);

      if (fetchError || !workflows || workflows.length === 0) {
        return false;
      }

      // Verificar se todos os workflows estão finalizados (completed_at não é null)
      const allCompleted = workflows.every(w => w.completed_at !== null);

      if (!allCompleted) {
        return false; // Ainda há componentes não finalizados
      }

      // Buscar configuração do status atual
      const { data: statusConfig } = await supabase
        .from('status_config')
        .select('allow_component_split')
        .eq('status_key', currentStatus)
        .eq('entity_type', 'workflow')
        .maybeSingle();

      // Se o status atual não permite split, não precisa verificar componentes
      if (!statusConfig?.allow_component_split) {
        return false;
      }

      // Buscar próximo status permitido
      const { data: nextStatusData, error: nextStatusError } = await supabase
        .from('status_prerequisites')
        .select('to_status_key, transition_type')
        .eq('from_status_key', currentStatus)
        .eq('entity_type', 'workflow')
        .eq('is_active', true)
        .order('id')
        .limit(1)
        .maybeSingle();

      if (nextStatusError || !nextStatusData) {
        return false; // Não há próximo status
      }

      // Verificar se o próximo status também permite split ou se aceita todos os componentes
      const { data: nextStatusConfig } = await supabase
        .from('status_config')
        .select('allow_component_split')
        .eq('status_key', nextStatusData.to_status_key)
        .eq('entity_type', 'workflow')
        .maybeSingle();

      // Se o próximo status não permite split, só avança se todos estiverem finalizados
      // Se permite split, pode avançar individualmente
      if (!nextStatusConfig?.allow_component_split && allCompleted) {
        // Avançar todos os workflows para o próximo status
        const updatePromises = workflows.map(workflow =>
          updateWorkflowStatus(
            workflow.id,
            nextStatusData.to_status_key,
            'Avanço automático: todos os componentes finalizados'
          )
        );

        await Promise.all(updatePromises);

        toast({
          title: "✅ OS avançada automaticamente!",
          description: `Todos os componentes foram movidos para: ${nextStatusData.to_status_key}`,
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar avanço automático:', error);
      return false;
    }
  };

  return {
    loading,
    updateWorkflowStatus,
    updateWorkflowDetails,
    startWorkflow,
    completeWorkflow,
    advanceToNextStatus,
    checkAndAdvanceOrderWorkflows
  };
}
