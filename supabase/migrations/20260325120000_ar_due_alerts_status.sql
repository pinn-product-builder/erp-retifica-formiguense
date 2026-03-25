ALTER TABLE public.ar_due_alerts
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.ar_due_alerts
SET status = CASE WHEN is_read THEN 'read' ELSE 'unread' END
WHERE status IS NULL;

UPDATE public.ar_due_alerts SET status = 'unread' WHERE status IS NULL;

ALTER TABLE public.ar_due_alerts ALTER COLUMN status SET DEFAULT 'unread';
ALTER TABLE public.ar_due_alerts ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.ar_due_alerts DROP CONSTRAINT IF EXISTS ar_due_alerts_status_check;
ALTER TABLE public.ar_due_alerts
  ADD CONSTRAINT ar_due_alerts_status_check CHECK (status IN ('unread', 'read', 'in_negotiation'));
