-- Criar tabela para armazenar informações básicas dos usuários
-- Essa tabela é uma cache das informações do auth.users para facilitar consultas
CREATE TABLE IF NOT EXISTS public.user_basic_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_basic_info ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuários podem ver informações de usuários da mesma organização
CREATE POLICY "Users can view basic info of org members" ON public.user_basic_info
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_users ou1
      JOIN public.organization_users ou2 ON ou1.organization_id = ou2.organization_id
      WHERE ou1.user_id = auth.uid()
      AND ou2.user_id = user_basic_info.user_id
      AND ou1.is_active = true
      AND ou2.is_active = true
    )
  );

-- Admins podem inserir/atualizar informações básicas
CREATE POLICY "Admins can manage basic info" ON public.user_basic_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_basic_info_updated_at
  BEFORE UPDATE ON public.user_basic_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_basic_info_user_id ON public.user_basic_info(user_id);
CREATE INDEX idx_user_basic_info_email ON public.user_basic_info(email);
