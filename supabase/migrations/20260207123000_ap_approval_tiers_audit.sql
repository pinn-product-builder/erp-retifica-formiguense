ALTER TABLE public.approval_tiers_ap
  ADD COLUMN IF NOT EXISTS min_amount numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approver_role text;

CREATE TABLE IF NOT EXISTS public.accounts_payable_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payable_id uuid NOT NULL REFERENCES public.accounts_payable(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('approve', 'reject')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accounts_payable_approval_events_payable_id_idx
  ON public.accounts_payable_approval_events (payable_id);

ALTER TABLE public.accounts_payable_approval_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_payable_approval_events_authenticated" ON public.accounts_payable_approval_events;
CREATE POLICY "accounts_payable_approval_events_authenticated"
  ON public.accounts_payable_approval_events
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.accounts_payable_org_summary(p_org_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'all', COUNT(*)::bigint,
    'pending', COUNT(*) FILTER (WHERE status = 'pending'::payment_status)::bigint,
    'overdue', COUNT(*) FILTER (WHERE status = 'overdue'::payment_status)::bigint,
    'paid', COUNT(*) FILTER (WHERE status = 'paid'::payment_status)::bigint,
    'pending_amount', COALESCE(SUM(amount) FILTER (WHERE status = 'pending'::payment_status), 0)::numeric
  )
  FROM public.accounts_payable
  WHERE org_id = p_org_id;
$$;

GRANT EXECUTE ON FUNCTION public.accounts_payable_org_summary(uuid) TO authenticated;
