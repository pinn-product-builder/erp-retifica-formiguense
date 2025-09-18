-- Script para configurar o primeiro super administrador
-- Execute este script após aplicar a migração 20250918000000_add_super_admin_role.sql

-- Defina o email do usuário que será o super admin
-- SUBSTITUA 'seu-email@exemplo.com' pelo email do dono da aplicação
  UPDATE public.profiles 
  SET is_super_admin = TRUE 
  WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'seu-email@exemplo.com'
    LIMIT 1
  );

  -- Verificar se a atualização foi bem-sucedida
  SELECT 
    u.email,
    p.name,
    p.is_super_admin
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.user_id
  WHERE p.is_super_admin = TRUE;
