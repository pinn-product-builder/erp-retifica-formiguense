-- Aplicar manualmente no Supabase Dashboard → SQL Editor se `db push` não rodar
-- (histórico de migrations remoto vs local dessincronizado).
-- Idempotente: pode rodar de novo com segurança (DROP IF EXISTS nas policies/trigger).

-- Grupo econômico: várias organizations consolidadas na visão financeira (1 grupo por org).

CREATE TABLE IF NOT EXISTS public.organization_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

COMMENT ON TABLE public.organization_groups IS
  'Agrupamento de empresas para visão consolidada no financeiro; não substitui o tenant organizations.';

CREATE TABLE IF NOT EXISTS public.organization_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.organization_groups (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_group_members_group_id
  ON public.organization_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_organization_group_members_organization_id
  ON public.organization_group_members (organization_id);

DROP TRIGGER IF EXISTS update_organization_groups_updated_at ON public.organization_groups;
CREATE TRIGGER update_organization_groups_updated_at
  BEFORE UPDATE ON public.organization_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.organization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_group_select_if_member_of_child_org" ON public.organization_groups;
DROP POLICY IF EXISTS "org_group_insert_authenticated" ON public.organization_groups;
DROP POLICY IF EXISTS "org_group_update_super" ON public.organization_groups;
DROP POLICY IF EXISTS "org_group_delete_super" ON public.organization_groups;

CREATE POLICY "org_group_select_if_member_of_child_org"
  ON public.organization_groups
  FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.organization_group_members m
      WHERE m.group_id = organization_groups.id
        AND public.is_org_member(m.organization_id)
    )
  );

CREATE POLICY "org_group_insert_authenticated"
  ON public.organization_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "org_group_update_super"
  ON public.organization_groups
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "org_group_delete_super"
  ON public.organization_groups
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "org_group_members_select_if_group_visible" ON public.organization_group_members;
DROP POLICY IF EXISTS "org_group_members_insert_admin" ON public.organization_group_members;
DROP POLICY IF EXISTS "org_group_members_delete_admin" ON public.organization_group_members;

CREATE POLICY "org_group_members_select_if_group_visible"
  ON public.organization_group_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_org_member(organization_id)
    OR EXISTS (
      SELECT 1
      FROM public.organization_group_members m2
      WHERE m2.group_id = organization_group_members.group_id
        AND public.is_org_member(m2.organization_id)
    )
  );

CREATE POLICY "org_group_members_insert_admin"
  ON public.organization_group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_org_role(organization_id, 'admin'::public.app_role)
      OR public.has_org_role(organization_id, 'owner'::public.app_role)
    )
  );

CREATE POLICY "org_group_members_delete_admin"
  ON public.organization_group_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin()
    OR (
      public.has_org_role(organization_id, 'admin'::public.app_role)
      OR public.has_org_role(organization_id, 'owner'::public.app_role)
    )
  );

CREATE OR REPLACE FUNCTION public.org_ids_in_same_group(p_org_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT m.organization_id
      FROM public.organization_group_members m
      WHERE m.group_id = (
        SELECT gm.group_id
        FROM public.organization_group_members gm
        WHERE gm.organization_id = p_org_id
        LIMIT 1
      )
      ORDER BY m.organization_id
    ),
    ARRAY[]::uuid[]
  );
$$;

COMMENT ON FUNCTION public.org_ids_in_same_group(uuid) IS
  'Lista organizations do mesmo grupo econômico; {} se p_org_id não pertence a nenhum grupo.';

GRANT EXECUTE ON FUNCTION public.org_ids_in_same_group(uuid) TO authenticated;
