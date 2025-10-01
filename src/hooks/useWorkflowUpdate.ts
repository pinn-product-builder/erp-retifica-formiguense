
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useWorkflowUpdate() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateWorkflowStatus = async (workflowId: string, newStatus: string, changeReason?: string) => {
    try {
      setLoading(true);

      // Primeiro, buscar o status atual para o histórico
      const { data: currentWorkflow, error: fetchError } = await supabase
        .from('order_workflow')
        .select('status, component, order_id')
        .eq('id', workflowId)
        .single();

      if (fetchError) throw fetchError;

      const currentTime = new Date().toISOString();
      const updateData: Record<string, string | null> = { 
        status: newStatus,
        updated_at: currentTime
      };

      // Buscar dados completos do workflow atual
      const { data: fullWorkflow, error: fullFetchError } = await supabase
        .from('order_workflow')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (fullFetchError) throw fullFetchError;

      // Lógica corrigida para timestamps
      if (newStatus === 'entrada') {
        // Entrada: apenas marcar como iniciado se não foi iniciado antes
        if (!fullWorkflow.started_at) {
          updateData.started_at = currentTime;
        }
        // Limpar completed_at se estava concluído
        updateData.completed_at = null;
      } else if (['pronto', 'garantia', 'entregue'].includes(newStatus)) {
        // Status finais: marcar como concluído
        updateData.completed_at = currentTime;
        // Garantir que tem started_at
        if (!fullWorkflow.started_at) {
          updateData.started_at = currentTime;
        }
      } else {
        // Status intermediários: marcar como iniciado se não foi iniciado
        if (!fullWorkflow.started_at) {
          updateData.started_at = currentTime;
        }
        // Limpar completed_at se estava concluído
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

  const advanceToNextStatus = async (currentWorkflow: { id: string; status: string; component: string }) => {
    try {
      // Buscar próximo status permitido
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
        return;
      }

      // Para transições automáticas e manuais, avançar
      // Apenas bloquear se for approval_required
      if (nextStatusData.transition_type === 'approval_required') {
        toast({
          title: "Etapa concluída!",
          description: "Próxima etapa requer aprovação de supervisor",
          variant: "default"
        });
        return;
      }

      // Avançar para próximo status (automatic ou manual)
      const success = await updateWorkflowStatus(
        currentWorkflow.id, 
        nextStatusData.to_status_key,
        nextStatusData.transition_type === 'automatic' 
          ? 'Avanço automático após conclusão da etapa anterior'
          : 'Avançado manualmente pelo usuário após conclusão'
      );

      if (success) {
        toast({
          title: "✅ Etapa avançada!",
          description: `Workflow movido para: ${nextStatusData.to_status_key}`,
        });
      }
    } catch (error) {
      console.error('Erro ao avançar para próximo status:', error);
      toast({
        title: "Erro ao avançar",
        description: "Não foi possível avançar para a próxima etapa",
        variant: "destructive"
      });
    }
  };

  return {
    loading,
    updateWorkflowStatus,
    updateWorkflowDetails,
    startWorkflow,
    completeWorkflow,
    advanceToNextStatus
  };
}
