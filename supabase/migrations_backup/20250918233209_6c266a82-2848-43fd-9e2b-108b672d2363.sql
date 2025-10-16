-- Adicionar super_admin ao enum app_role
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Adicionar campo super_admin na tabela profiles
ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

-- Criar função para verificar se usuário é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_super_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para verificar se usuário pode gerenciar organizações globalmente
CREATE OR REPLACE FUNCTION public.can_manage_organizations()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar política RLS para organizações - apenas super_admin pode criar
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Only super admin can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (public.is_super_admin());

-- Política para super_admin visualizar todas as organizações
CREATE POLICY "Super admin can view all organizations"
ON public.organizations
FOR SELECT
USING (public.is_super_admin() OR public.is_org_member(id));

-- Política para super_admin gerenciar todas as organizações
CREATE POLICY "Super admin can manage all organizations"
ON public.organizations
FOR UPDATE
USING (public.is_super_admin() OR public.has_org_role(id, 'owner') OR public.has_org_role(id, 'admin'));

-- Política para super_admin deletar organizações
CREATE POLICY "Super admin can delete organizations"
ON public.organizations
FOR DELETE
USING (public.is_super_admin());

-- Atualizar políticas para organization_users
-- Super admin pode gerenciar usuários de qualquer organização
DROP POLICY IF EXISTS "Org owners and admins can manage members" ON public.organization_users;
CREATE POLICY "Super admin and org owners/admins can manage members"
ON public.organization_users
FOR ALL
USING (
  public.is_super_admin() OR 
  public.has_org_role(organization_id, 'owner') OR 
  public.has_org_role(organization_id, 'admin')
);

-- Super admin pode visualizar todos os usuários de organizações
DROP POLICY IF EXISTS "Users can view org members of their organizations" ON public.organization_users;
CREATE POLICY "Super admin can view all org members, users see their own orgs"
ON public.organization_users
FOR SELECT
USING (
  public.is_super_admin() OR 
  public.is_org_member(organization_id)
);

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Indica se o usuário é super administrador da aplicação (dono)';
COMMENT ON FUNCTION public.is_super_admin() IS 'Verifica se o usuário atual é super administrador';
COMMENT ON FUNCTION public.can_manage_organizations() IS 'Verifica se o usuário pode gerenciar organizações globalmente';