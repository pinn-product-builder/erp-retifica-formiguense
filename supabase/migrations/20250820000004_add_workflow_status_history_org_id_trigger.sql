-- Add trigger to auto-populate org_id in workflow_status_history
-- This prevents RLS policy violations when inserting workflow history
-- Error: "new row violates row-level security policy for table \"workflow_status_history\""

CREATE OR REPLACE FUNCTION public.set_workflow_status_history_org_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se org_id não foi fornecido, buscar do order_workflow → order
  IF NEW.org_id IS NULL AND NEW.order_workflow_id IS NOT NULL THEN
    SELECT o.org_id INTO NEW.org_id
    FROM order_workflow ow
    INNER JOIN orders o ON o.id = ow.order_id
    WHERE ow.id = NEW.order_workflow_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_workflow_status_history_org_id ON public.workflow_status_history;
CREATE TRIGGER trigger_set_workflow_status_history_org_id
  BEFORE INSERT OR UPDATE ON public.workflow_status_history
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workflow_status_history_org_id();

COMMENT ON FUNCTION public.set_workflow_status_history_org_id() IS 'Auto-populates org_id from order_workflow → orders to prevent RLS policy violations';
COMMENT ON TRIGGER trigger_set_workflow_status_history_org_id ON public.workflow_status_history IS 'Ensures org_id is populated before insert/update for RLS compliance';

