-- ================================================
-- BACKUP COMPLETO DO BANCO DE DADOS - ERP RETÍFICA
-- Data: 2025-09-21 12:00:00
-- Antes da migração: Remoção da tabela profiles
-- ================================================

-- DADOS ATUAIS DA TABELA PROFILES (4 registros)
-- ==============================================

-- Estrutura da tabela profiles
-- CREATE TABLE public.profiles (
--   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
--   name TEXT,
--   role TEXT DEFAULT 'employee',
--   is_super_admin BOOLEAN DEFAULT false,
--   created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
-- );

-- Dados da tabela profiles
INSERT INTO public.profiles_backup_20250921 (id, user_id, name, role, is_super_admin, created_at, updated_at) VALUES
('79130e83-6939-4082-bae1-435a6404988a', 'c2f340dc-56ee-4e68-8150-af758ba78803', 'Paulo Marcio', 'employee', false, '2025-07-24 15:35:02.935181+00', '2025-07-24 15:35:02.935181+00'),
('700fad1c-32fd-4c26-b6b5-bc843c02ef99', '3e047603-ee90-402c-9778-7b48c1690001', 'Administrador', 'employee', false, '2025-07-24 19:22:23.66313+00', '2025-07-24 19:22:23.66313+00'),
('84282d3c-f396-41ed-a192-3122b2149180', 'b1dc1928-42fc-4702-bdf1-1abdb1d5f769', 'Funcionário', 'employee', false, '2025-07-24 19:22:23.66313+00', '2025-07-24 19:22:23.66313+00'),
('4d6decc3-ce0a-4c45-98f6-6364fb030109', '3e047603-ee90-402c-9778-7b48c1690002', 'Administrador', 'employee', true, '2025-09-18 23:34:16.693128+00', '2025-09-18 23:34:45.901443+00');

-- DADOS ATUAIS DA TABELA USER_BASIC_INFO (2 registros)
-- =====================================================

-- Dados da tabela user_basic_info
INSERT INTO public.user_basic_info_backup_20250921 (id, user_id, email, name, created_at, updated_at) VALUES
('c2f4c034-fb3b-419f-8e31-24aca9a32b45', '3e047603-ee90-402c-9778-7b48c1690002', 'superuser@admin.com', 'Owner', '2025-09-18 22:27:52.482934+00', '2025-09-18 22:27:52.482934+00'),
('c2f4c034-fb3b-419f-8e31-24aca9a32b46', '3e047603-ee90-402c-9778-7b48c1690001', 'admin@retificas.com', 'Admin', '2025-09-18 22:27:52.482934+00', '2025-09-18 23:47:50.962886+00');

-- DADOS ATUAIS DE AUTH.USERS (is_super_admin)
-- ===========================================

-- Usuários com flag is_super_admin definida
-- user_id: b1dc1928-42fc-4702-bdf1-1abdb1d5f769, email: funcionario@retificas.com, is_super_admin: false
-- user_id: 3e047603-ee90-402c-9778-7b48c1690001, email: admin@retificas.com, is_super_admin: false  
-- user_id: 3e047603-ee90-402c-9778-7b48c1690002, email: superuser@admin.com, is_super_admin: false

-- ANÁLISE DOS DADOS
-- =================

-- SUPER ADMIN IDENTIFICADO:
-- Na tabela profiles: user_id '3e047603-ee90-402c-9778-7b48c1690002' tem is_super_admin = true
-- Na tabela auth.users: mesmo user_id tem is_super_admin = false
-- AÇÃO NECESSÁRIA: Sincronizar auth.users.is_super_admin = true para este usuário

-- USUÁRIOS A MIGRAR:
-- 1. Paulo Marcio (c2f340dc-56ee-4e68-8150-af758ba78803) - não está em user_basic_info
-- 2. Funcionário (b1dc1928-42fc-4702-bdf1-1abdb1d5f769) - não está em user_basic_info
-- 3. Administrador (3e047603-ee90-402c-9778-7b48c1690001) - já está em user_basic_info
-- 4. Administrador Super (3e047603-ee90-402c-9778-7b48c1690002) - já está em user_basic_info

-- COMANDOS DE RESTAURAÇÃO (EM CASO DE NECESSIDADE)
-- ================================================

-- Para restaurar a tabela profiles:
/*
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'employee',
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir dados de backup
INSERT INTO public.profiles (id, user_id, name, role, is_super_admin, created_at, updated_at) VALUES
('79130e83-6939-4082-bae1-435a6404988a', 'c2f340dc-56ee-4e68-8150-af758ba78803', 'Paulo Marcio', 'employee', false, '2025-07-24 15:35:02.935181+00', '2025-07-24 15:35:02.935181+00'),
('700fad1c-32fd-4c26-b6b5-bc843c02ef99', '3e047603-ee90-402c-9778-7b48c1690001', 'Administrador', 'employee', false, '2025-07-24 19:22:23.66313+00', '2025-07-24 19:22:23.66313+00'),
('84282d3c-f396-41ed-a192-3122b2149180', 'b1dc1928-42fc-4702-bdf1-1abdb1d5f769', 'Funcionário', 'employee', false, '2025-07-24 19:22:23.66313+00', '2025-07-24 19:22:23.66313+00'),
('4d6decc3-ce0a-4c45-98f6-6364fb030109', '3e047603-ee90-402c-9778-7b48c1690002', 'Administrador', 'employee', true, '2025-09-18 23:34:16.693128+00', '2025-09-18 23:34:45.901443+00');
*/

-- VALIDAÇÃO PÓS-MIGRAÇÃO
-- ======================

-- Verificar se dados foram migrados corretamente:
-- SELECT * FROM user_basic_info WHERE user_id IN (
--   'c2f340dc-56ee-4e68-8150-af758ba78803',  -- Paulo Marcio
--   'b1dc1928-42fc-4702-bdf1-1abdb1d5f769',  -- Funcionário  
--   '3e047603-ee90-402c-9778-7b48c1690001',  -- Admin
--   '3e047603-ee90-402c-9778-7b48c1690002'   -- Super Admin
-- );

-- Verificar se super admin foi sincronizado:
-- SELECT id, email, is_super_admin FROM auth.users 
-- WHERE id = '3e047603-ee90-402c-9778-7b48c1690002';
-- Resultado esperado: is_super_admin = true

-- FIM DO BACKUP
-- =============
