import { supabase } from '@/integrations/supabase/client';

export interface WorkflowAdvanceResult {
  success: boolean;
  nextStatus?: string;
  message: string;
}

class WorkflowService {
  static async advanceOrderWorkflowsAfterApproval(orderId: string): Promise<WorkflowAdvanceResult> {
    try {
      const { data: workflows, error: workflowError } = await supabase
        .from('order_workflow')
        .select('id, status')
        .eq('order_id', orderId);

      if (workflowError) {
        console.error('Erro ao buscar workflows:', workflowError);
        return {
          success: false,
          message: 'Erro ao buscar workflows da ordem'
        };
      }

      if (!workflows || workflows.length === 0) {
        return {
          success: false,
          message: 'Nenhum workflow encontrado para esta ordem'
        };
      }

      const currentWorkflowStatus = workflows[0].status;

      const { data: nextStatusData, error: prereqError } = await supabase
        .from('status_prerequisites')
        .select('to_status_key')
        .eq('from_status_key', currentWorkflowStatus)
        .eq('entity_type', 'workflow')
        .eq('is_active', true)
        .order('id')
        .limit(1)
        .maybeSingle();

      if (prereqError) {
        console.error('Erro ao buscar próximo status:', prereqError);
        return {
          success: false,
          message: 'Erro ao verificar próximo status'
        };
      }

      if (!nextStatusData?.to_status_key) {
        return {
          success: true,
          message: 'Não há próximo status disponível para avançar automaticamente'
        };
      }

      const updatePromises = workflows.map(workflow =>
        supabase
          .from('order_workflow')
          .update({
            status: nextStatusData.to_status_key,
            started_at: null,
            completed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', workflow.id)
      );

      const results = await Promise.all(updatePromises);
      const hasErrors = results.some(r => r.error);

      if (hasErrors) {
        console.error('Erro ao atualizar workflows:', results.filter(r => r.error));
        return {
          success: false,
          message: 'Erro ao avançar workflows'
        };
      }

      return {
        success: true,
        nextStatus: nextStatusData.to_status_key,
        message: `Workflows avançados para ${nextStatusData.to_status_key}`
      };
    } catch (error) {
      console.error('Erro ao processar avanço de workflows:', error);
      return {
        success: false,
        message: 'Erro inesperado ao processar workflows'
      };
    }
  }
}

export default WorkflowService;
