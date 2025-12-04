-- Alterar campo status da tabela order_workflow de enum para TEXT
-- Isso permite criar novos status dinamicamente através da tabela status_config

-- Primeiro, remover objetos que dependem do campo status
DROP VIEW IF EXISTS public.v_workflows_with_pending_checklists;
DROP TRIGGER IF EXISTS trigger_check_mandatory_checklists ON public.order_workflow;

-- Converter os valores existentes do enum para text
ALTER TABLE public.order_workflow 
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- Garantir que o campo tenha um valor padrão
ALTER TABLE public.order_workflow 
  ALTER COLUMN status SET DEFAULT 'entrada';

-- Recriar o trigger após alterar o tipo do campo
CREATE TRIGGER trigger_check_mandatory_checklists
  BEFORE UPDATE ON public.order_workflow
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION check_mandatory_checklists_before_workflow_advance();

-- Recriar a view após alterar o tipo do campo
CREATE OR REPLACE VIEW public.v_workflows_with_pending_checklists AS
SELECT 
  ow.id AS workflow_id,
  ow.order_id,
  o.order_number,
  ow.component,
  ow.status,
  ow.started_at,
  jsonb_agg(
    jsonb_build_object(
      'checklist_id', wc.id,
      'checklist_name', wc.checklist_name,
      'is_mandatory', wc.is_mandatory,
      'blocks_workflow_advance', wc.blocks_workflow_advance
    )
  ) FILTER (WHERE wcr.id IS NULL) AS missing_checklists
FROM order_workflow ow
JOIN orders o ON o.id = ow.order_id
JOIN workflow_checklists wc ON (
  wc.step_key = ow.status 
  AND wc.component = ow.component 
  AND wc.is_mandatory = true 
  AND wc.is_active = true
)
LEFT JOIN workflow_checklist_responses wcr ON (
  wcr.order_workflow_id = ow.id 
  AND wcr.checklist_id = wc.id 
  AND wcr.overall_status = 'approved'
)
WHERE ow.started_at IS NOT NULL 
  AND ow.completed_at IS NULL 
  AND wcr.id IS NULL
GROUP BY ow.id, ow.order_id, o.order_number, ow.component, ow.status, ow.started_at;

-- Criar índice se não existir (pode ser útil para performance)
CREATE INDEX IF NOT EXISTS idx_order_workflow_status_text 
  ON public.order_workflow(status) 
  WHERE status IS NOT NULL;

