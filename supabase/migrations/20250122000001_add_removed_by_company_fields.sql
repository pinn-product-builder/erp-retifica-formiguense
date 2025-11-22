-- Migration: Adicionar campos de remoção por mecânicos da empresa
-- Description: Adiciona campos para rastrear se o motor foi removido por mecânicos da empresa e quem fez a remoção

ALTER TABLE public.engines 
ADD COLUMN IF NOT EXISTS removed_by_company boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS removed_by_employee_name text NULL;

COMMENT ON COLUMN public.engines.removed_by_company IS 'Indica se o motor foi removido por mecânicos da empresa';
COMMENT ON COLUMN public.engines.removed_by_employee_name IS 'Nome do funcionário que removeu o motor (se removido por mecânicos da empresa)';

