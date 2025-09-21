-- ================================================
-- MIGRAÇÃO: Remover tabela profiles e organizar nomenclatura
-- ================================================
-- 
-- Esta migração:
-- 1. Remove a tabela profiles (dados migrados para user_basic_info)
-- 2. Usa auth.users.is_super_admin para controle de super admin
-- 3. Atualiza todas as funções e triggers
-- 4. Migra dados existentes antes de remover
--
-- Data: 2025-09-21
-- ================================================

-- STEP 1: Migrar dados existentes de profiles para user_basic_info
-- ================================================================

-- Inserir dados de profiles em user_basic_info (se não existirem)
INSERT INTO public.user_basic_info (user_id, email, name, created_at, updated_at)
SELECT 
  p.user_id,
  COALESCE(p.email, au.email, 'no-email@temp.com') as email,
  COALESCE(p.name, 'Nome não disponível') as name,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_basic_info ubi 
  WHERE ubi.user_id = p.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
  name = COALESCE(EXCLUDED.name, user_basic_info.name),
  email = COALESCE(EXCLUDED.email, user_basic_info.email),
  updated_at = now();

-- STEP 2: Migrar flag is_super_admin para auth.users (se necessário)
-- ==================================================================

-- Atualizar auth.users.is_super_admin baseado em profiles.is_super_admin
UPDATE auth.users 
SET is_super_admin = p.is_super_admin
FROM public.profiles p
WHERE auth.users.id = p.user_id 
AND p.is_super_admin = true
AND (auth.users.is_super_admin IS NULL OR auth.users.is_super_admin = false);

-- STEP 3: Atualizar funções que referenciam profiles
-- ==================================================

-- Atualizar função get_organization_users_info para usar apenas user_basic_info
CREATE OR REPLACE FUNCTION get_organization_users_info(org_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ou.user_id,
    COALESCE(ubi.email, 'email@example.com') as email,
    COALESCE(ubi.name, 'Nome não disponível') as name,
    ou.created_at
  FROM organization_users ou
  LEFT JOIN user_basic_info ubi ON ubi.user_id = ou.user_id
  WHERE ou.organization_id = org_id
  AND ou.is_active = true
  ORDER BY ou.created_at DESC;
$$;

-- Criar função para verificar se usuário é super admin (usando auth.users)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(au.is_super_admin, false)
  FROM auth.users au
  WHERE au.id = auth.uid();
$$;

-- Criar função para verificar se usuário é super admin por user_id
CREATE OR REPLACE FUNCTION is_user_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(au.is_super_admin, false)
  FROM auth.users au
  WHERE au.id = user_id;
$$;

-- STEP 4: Atualizar trigger de criação de usuário
-- ===============================================

-- Remover trigger antigo que criava profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Criar novo trigger que cria user_basic_info
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Criar entrada em user_basic_info
  INSERT INTO public.user_basic_info (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Nome não disponível')
  );
  RETURN NEW;
END;
$$;

-- Criar trigger para user_basic_info
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Atualizar políticas RLS
-- ===============================

-- Atualizar política de user_basic_info para incluir super admins
DROP POLICY IF EXISTS "Users can view basic info of org members" ON public.user_basic_info;
DROP POLICY IF EXISTS "Admins can manage basic info" ON public.user_basic_info;

-- Política para visualização
CREATE POLICY "Users can view basic info of org members" ON public.user_basic_info
  FOR SELECT USING (
    -- Super admins podem ver todos
    is_super_admin() OR
    -- Usuários podem ver membros da mesma organização
    EXISTS (
      SELECT 1 FROM public.organization_users ou1
      JOIN public.organization_users ou2 ON ou1.organization_id = ou2.organization_id
      WHERE ou1.user_id = auth.uid()
      AND ou2.user_id = user_basic_info.user_id
      AND ou1.is_active = true
      AND ou2.is_active = true
    )
  );

-- Política para gerenciamento
CREATE POLICY "Admins and super admins can manage basic info" ON public.user_basic_info
  FOR ALL USING (
    -- Super admins podem gerenciar todos
    is_super_admin() OR
    -- Admins da organização podem gerenciar usuários da mesma org
    EXISTS (
      SELECT 1 FROM public.organization_users ou1
      JOIN public.organization_users ou2 ON ou1.organization_id = ou2.organization_id
      WHERE ou1.user_id = auth.uid()
      AND ou2.user_id = user_basic_info.user_id
      AND ou1.role IN ('owner', 'admin')
      AND ou1.is_active = true
    )
  );

-- STEP 6: Remover dependências da tabela profiles
-- ===============================================

-- Remover foreign keys que referenciam profiles (se existirem)
-- (Não há foreign keys conhecidas apontando para profiles no schema atual)

-- STEP 7: Remover tabela profiles
-- ===============================

-- Desabilitar RLS primeiro
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover políticas
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Remover triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Remover tabela
DROP TABLE IF EXISTS public.profiles CASCADE;

-- STEP 8: Conceder permissões nas novas funções
-- =============================================

GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_super_admin(UUID) TO authenticated;

-- STEP 9: Comentários e documentação
-- ==================================

COMMENT ON TABLE public.user_basic_info IS 'Informações básicas dos usuários - cache de auth.users para facilitar consultas';
COMMENT ON FUNCTION is_super_admin() IS 'Verifica se o usuário atual é super admin usando auth.users.is_super_admin';
COMMENT ON FUNCTION is_user_super_admin(UUID) IS 'Verifica se um usuário específico é super admin usando auth.users.is_super_admin';

-- STEP 10: Logs de migração
-- ========================

DO $$
BEGIN
  RAISE NOTICE 'MIGRAÇÃO CONCLUÍDA: profiles removida, user_basic_info organizada, auth.users.is_super_admin em uso';
  RAISE NOTICE 'Próximos passos: Atualizar hooks TypeScript para usar user_basic_info e auth.users.is_super_admin';
END $$;
