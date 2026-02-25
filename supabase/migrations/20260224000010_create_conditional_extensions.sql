-- US-PUR-016: campos de recebimento em conditional_order_items
ALTER TABLE public.conditional_order_items
  ADD COLUMN IF NOT EXISTS quantity_received NUMERIC(15,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS received_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_by       UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS receiving_notes   TEXT;

-- US-PUR-016: campo received_at em conditional_orders
ALTER TABLE public.conditional_orders
  ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- US-PUR-021: tabela de prorrogações
CREATE TABLE IF NOT EXISTS public.conditional_extensions (
  id                    UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conditional_order_id  UUID NOT NULL REFERENCES public.conditional_orders(id) ON DELETE CASCADE,
  previous_deadline     DATE NOT NULL,
  new_deadline          DATE NOT NULL,
  days_added            INTEGER NOT NULL CHECK (days_added > 0 AND days_added <= 7),
  justification         TEXT NOT NULL,
  extension_number      INTEGER NOT NULL CHECK (extension_number IN (1, 2)),
  requested_by          UUID REFERENCES auth.users(id) NOT NULL,
  approved_by           UUID REFERENCES auth.users(id),
  status                TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conditional_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ce_select" ON public.conditional_extensions FOR SELECT
  USING (conditional_order_id IN (
    SELECT id FROM public.conditional_orders WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "ce_insert" ON public.conditional_extensions FOR INSERT
  WITH CHECK (conditional_order_id IN (
    SELECT id FROM public.conditional_orders WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE INDEX IF NOT EXISTS idx_conditional_extensions_order
  ON public.conditional_extensions(conditional_order_id);
