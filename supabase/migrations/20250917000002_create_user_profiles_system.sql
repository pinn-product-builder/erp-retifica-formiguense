-- Criar sistema de perfis de usuários com setores e páginas

-- 1. Tabela de perfis (reutilizando a existente, mas expandindo)
-- Vamos manter a tabela profiles atual e adicionar novas tabelas para o sistema

-- 2. Tabela de setores
CREATE TABLE IF NOT EXISTS public.user_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Cor hex para identificação visual
  is_active BOOLEAN DEFAULT true,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_sector_name_per_org UNIQUE(name, org_id)
);

-- 3. Tabela de páginas/telas do sistema
CREATE TABLE IF NOT EXISTS public.system_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  route_path VARCHAR(200) NOT NULL,
  module VARCHAR(50), -- fiscal, financial, production, etc.
  icon VARCHAR(50), -- nome do ícone lucide
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de perfis de usuário (nova estrutura)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sector_id UUID REFERENCES public.user_sectors(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_profile_name_per_org UNIQUE(name, org_id)
);

-- 5. Tabela de permissões de páginas por perfil
CREATE TABLE IF NOT EXISTS public.profile_page_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.system_pages(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT unique_profile_page UNIQUE(profile_id, page_id)
);

-- 6. Tabela de vínculo usuário-perfil
CREATE TABLE IF NOT EXISTS public.user_profile_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT unique_user_profile_org UNIQUE(user_id, profile_id, org_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_page_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_sectors
CREATE POLICY "Users can view sectors of their organization" ON public.user_sectors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid() AND organization_id = org_id AND is_active = true
    )
  );

CREATE POLICY "Admins can manage sectors" ON public.user_sectors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid() AND organization_id = org_id 
      AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Políticas RLS para system_pages
CREATE POLICY "All authenticated users can view system pages" ON public.system_pages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only owners can manage system pages" ON public.system_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view profiles of their organization" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid() AND organization_id = org_id AND is_active = true
    )
  );

CREATE POLICY "Admins can manage profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid() AND organization_id = org_id 
      AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Políticas RLS para profile_page_permissions
CREATE POLICY "Users can view permissions of their org profiles" ON public.profile_page_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.organization_users ou ON ou.organization_id = up.org_id
      WHERE up.id = profile_id AND ou.user_id = auth.uid() AND ou.is_active = true
    )
  );

CREATE POLICY "Admins can manage profile permissions" ON public.profile_page_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.organization_users ou ON ou.organization_id = up.org_id
      WHERE up.id = profile_id AND ou.user_id = auth.uid() 
      AND ou.role IN ('owner', 'admin') AND ou.is_active = true
    )
  );

-- Políticas RLS para user_profile_assignments
CREATE POLICY "Users can view profile assignments of their organization" ON public.user_profile_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid() AND organization_id = org_id AND is_active = true
    )
  );

CREATE POLICY "Admins can manage profile assignments" ON public.user_profile_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid() AND organization_id = org_id 
      AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_user_sectors_updated_at
  BEFORE UPDATE ON public.user_sectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_pages_updated_at
  BEFORE UPDATE ON public.system_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_sectors_org_id ON public.user_sectors(org_id);
CREATE INDEX idx_user_profiles_org_id ON public.user_profiles(org_id);
CREATE INDEX idx_user_profiles_sector_id ON public.user_profiles(sector_id);
CREATE INDEX idx_profile_page_permissions_profile_id ON public.profile_page_permissions(profile_id);
CREATE INDEX idx_profile_page_permissions_page_id ON public.profile_page_permissions(page_id);
CREATE INDEX idx_user_profile_assignments_user_id ON public.user_profile_assignments(user_id);
CREATE INDEX idx_user_profile_assignments_profile_id ON public.user_profile_assignments(profile_id);
CREATE INDEX idx_user_profile_assignments_org_id ON public.user_profile_assignments(org_id);
