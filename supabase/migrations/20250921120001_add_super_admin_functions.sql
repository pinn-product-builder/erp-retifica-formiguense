-- ================================================
-- FUNÇÕES PARA GERENCIAR SUPER ADMIN VIA AUTH.USERS
-- ================================================
--
-- Estas funções permitem gerenciar o flag is_super_admin
-- na tabela auth.users de forma segura
--
-- Data: 2025-09-21
-- ================================================

-- STEP 1: Função para promover usuário a super admin
-- ==================================================

CREATE OR REPLACE FUNCTION promote_user_to_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'auth', 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Apenas super administradores podem promover outros usuários';
  END IF;

  -- Verificar se o usuário alvo existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Promover o usuário
  UPDATE auth.users 
  SET is_super_admin = true, 
      updated_at = now()
  WHERE id = user_id;

  -- Log da ação
  INSERT INTO public.audit_log (
    org_id, 
    table_name, 
    record_id, 
    operation, 
    old_values, 
    new_values, 
    user_id
  ) VALUES (
    NULL, -- Super admin actions são globais
    'auth.users',
    user_id,
    'PROMOTE_SUPER_ADMIN',
    jsonb_build_object('is_super_admin', false),
    jsonb_build_object('is_super_admin', true),
    auth.uid()
  );

  RETURN true;
END;
$$;

-- STEP 2: Função para revogar super admin
-- =======================================

CREATE OR REPLACE FUNCTION revoke_user_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'auth', 'public'
AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Apenas super administradores podem revogar permissões';
  END IF;

  -- Não permitir revogar próprias permissões
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode revogar suas próprias permissões de super admin';
  END IF;

  -- Verificar se o usuário alvo existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Revogar permissões
  UPDATE auth.users 
  SET is_super_admin = false, 
      updated_at = now()
  WHERE id = user_id;

  -- Log da ação
  INSERT INTO public.audit_log (
    org_id, 
    table_name, 
    record_id, 
    operation, 
    old_values, 
    new_values, 
    user_id
  ) VALUES (
    NULL, -- Super admin actions são globais
    'auth.users',
    user_id,
    'REVOKE_SUPER_ADMIN',
    jsonb_build_object('is_super_admin', true),
    jsonb_build_object('is_super_admin', false),
    auth.uid()
  );

  RETURN true;
END;
$$;

-- STEP 3: Função para listar todos os super admins
-- ================================================

CREATE OR REPLACE FUNCTION get_all_super_admins()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'auth', 'public'
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    COALESCE(ubi.name, 'Nome não disponível') as name,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN public.user_basic_info ubi ON ubi.user_id = au.id
  WHERE au.is_super_admin = true
  AND au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
$$;

-- STEP 4: Função para verificar se um usuário específico é super admin
-- ====================================================================

-- Atualizar a função existente para ser mais robusta
CREATE OR REPLACE FUNCTION is_user_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'auth'
AS $$
  SELECT COALESCE(au.is_super_admin, false)
  FROM auth.users au
  WHERE au.id = user_id
  AND au.deleted_at IS NULL;
$$;

-- STEP 5: Função para sincronizar user_basic_info quando usuário é criado
-- =======================================================================

-- Atualizar função handle_new_user para ser mais robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public', 'auth'
AS $$
BEGIN
  -- Criar entrada em user_basic_info
  INSERT INTO public.user_basic_info (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      'Nome não disponível'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, user_basic_info.name),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- STEP 6: Conceder permissões
-- ===========================

GRANT EXECUTE ON FUNCTION promote_user_to_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_super_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_super_admin(UUID) TO authenticated;

-- STEP 7: Comentários e documentação
-- ==================================

COMMENT ON FUNCTION promote_user_to_super_admin(UUID) IS 'Promove um usuário a super administrador. Apenas super admins podem executar.';
COMMENT ON FUNCTION revoke_user_super_admin(UUID) IS 'Revoga permissões de super admin de um usuário. Apenas super admins podem executar.';
COMMENT ON FUNCTION get_all_super_admins() IS 'Lista todos os super administradores do sistema.';
COMMENT ON FUNCTION is_user_super_admin(UUID) IS 'Verifica se um usuário específico é super admin usando auth.users.is_super_admin';

-- STEP 8: Logs
-- ============

DO $$
BEGIN
  RAISE NOTICE 'FUNÇÕES DE SUPER ADMIN CRIADAS: promote_user_to_super_admin, revoke_user_super_admin, get_all_super_admins';
  RAISE NOTICE 'Agora o sistema usa auth.users.is_super_admin em vez de profiles.is_super_admin';
END $$;
