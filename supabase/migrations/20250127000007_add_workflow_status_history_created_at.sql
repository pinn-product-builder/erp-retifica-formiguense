-- Add created_at to workflow_status_history for legacy references

ALTER TABLE public.workflow_status_history
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows using changed_at when available
UPDATE public.workflow_status_history
SET created_at = changed_at
WHERE created_at IS NOT DISTINCT FROM now() AND changed_at IS NOT NULL;

