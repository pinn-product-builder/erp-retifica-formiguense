
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useWorkflowUpdate() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateWorkflowStatus = async (workflowId: string, newStatus: string) => {
    try {
      setLoading(true);

      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Se está movendo para uma nova etapa, marcar como iniciado
      if (newStatus !== 'entrada' && !['pronto', 'garantia', 'entregue'].includes(newStatus)) {
        updateData.started_at = new Date().toISOString();
      }

      // Se está marcando como pronto, marcar como concluído
      if (['pronto', 'garantia', 'entregue'].includes(newStatus)) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('order_workflow')
        .update(updateData)
        .eq('id', workflowId);

      if (error) throw error;

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

  const updateWorkflowDetails = async (workflowId: string, details: any) => {
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

  const completeWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('order_workflow')
        .update({
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;

      toast({
        title: "Etapa concluída!",
        description: "O trabalho nesta etapa foi finalizado"
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

  return {
    loading,
    updateWorkflowStatus,
    updateWorkflowDetails,
    startWorkflow,
    completeWorkflow
  };
}
