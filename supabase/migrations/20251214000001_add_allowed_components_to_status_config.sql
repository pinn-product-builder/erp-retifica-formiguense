-- =====================================================
-- MIGRAÇÃO: Adicionar allowed_components à tabela status_config
-- =====================================================
-- Esta migração adiciona a coluna allowed_components para permitir
-- filtrar quais componentes podem ser desmembrados em cada status
-- =====================================================

-- 1. ADICIONAR COLUNA allowed_components
-- =====================================================
ALTER TABLE public.status_config
ADD COLUMN IF NOT EXISTS allowed_components jsonb DEFAULT NULL;

-- 2. COMENTÁRIOS
-- =====================================================
COMMENT ON COLUMN public.status_config.allowed_components IS 
'Array de componentes (engine_component) permitidos para desmembramento neste status. 
NULL = todos os componentes são permitidos. 
[] = nenhum componente é permitido.
["bloco", "eixo"] = apenas esses componentes são permitidos.';

-- 3. ÍNDICE PARA CONSULTAS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_status_config_allowed_components 
ON public.status_config 
USING gin (allowed_components)
WHERE allowed_components IS NOT NULL;

