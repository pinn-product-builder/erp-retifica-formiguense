-- =====================================================
-- RLS: workshop_os_part_lines (acesso por organização do usuário)
-- =====================================================

ALTER TABLE public.workshop_os_part_lines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workshop_os_part_lines' AND policyname = 'wopl_select'
  ) THEN
    CREATE POLICY "wopl_select" ON public.workshop_os_part_lines FOR SELECT
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workshop_os_part_lines' AND policyname = 'wopl_insert'
  ) THEN
    CREATE POLICY "wopl_insert" ON public.workshop_os_part_lines FOR INSERT
      WITH CHECK (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workshop_os_part_lines' AND policyname = 'wopl_update'
  ) THEN
    CREATE POLICY "wopl_update" ON public.workshop_os_part_lines FOR UPDATE
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workshop_os_part_lines' AND policyname = 'wopl_delete'
  ) THEN
    CREATE POLICY "wopl_delete" ON public.workshop_os_part_lines FOR DELETE
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;
