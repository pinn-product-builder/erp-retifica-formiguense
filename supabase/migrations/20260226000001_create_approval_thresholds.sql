CREATE TABLE IF NOT EXISTS public.approval_thresholds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id),

  min_value     NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_value     NUMERIC(12,2),

  approval_type TEXT NOT NULL DEFAULT 'single'
                CHECK (approval_type IN ('auto', 'single', 'multiple', 'chain')),
  approvers     UUID[] DEFAULT '{}',
  label         TEXT,

  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_range CHECK (max_value IS NULL OR max_value > min_value)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_approval_thresholds_org_min
  ON public.approval_thresholds(org_id, min_value)
  WHERE is_active = true;

ALTER TABLE public.approval_thresholds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'approval_thresholds' AND policyname = 'at_select'
  ) THEN
    CREATE POLICY "at_select" ON public.approval_thresholds FOR SELECT
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'approval_thresholds' AND policyname = 'at_insert'
  ) THEN
    CREATE POLICY "at_insert" ON public.approval_thresholds FOR INSERT
      WITH CHECK (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
          AND role IN ('admin', 'owner', 'super_admin')
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'approval_thresholds' AND policyname = 'at_update'
  ) THEN
    CREATE POLICY "at_update" ON public.approval_thresholds FOR UPDATE
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
          AND role IN ('admin', 'owner', 'super_admin')
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'approval_thresholds' AND policyname = 'at_delete'
  ) THEN
    CREATE POLICY "at_delete" ON public.approval_thresholds FOR DELETE
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
          AND role IN ('admin', 'owner', 'super_admin')
      ));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_approval_level_for_value(p_org_id UUID, p_value NUMERIC)
RETURNS TEXT AS $$
DECLARE
  v_threshold RECORD;
BEGIN
  SELECT approval_type INTO v_threshold
    FROM public.approval_thresholds
   WHERE org_id = p_org_id
     AND is_active = true
     AND min_value <= p_value
     AND (max_value IS NULL OR max_value > p_value)
   ORDER BY min_value DESC
   LIMIT 1;

  IF v_threshold IS NULL THEN
    IF p_value < 1000 THEN RETURN 'auto';
    ELSIF p_value < 5000 THEN RETURN 'gerente';
    ELSE RETURN 'admin';
    END IF;
  END IF;

  RETURN v_threshold.approval_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
