-- Migração: Vincular templates ao tipo de motor em vez de marca/modelo

-- 1. Remover templates sem tipo de motor (limpeza antes do constraint)
DELETE FROM public.engine_templates WHERE engine_type_id IS NULL;

-- 2. Remover o constraint único antigo de marca/modelo
ALTER TABLE public.engine_templates
  DROP CONSTRAINT IF EXISTS engine_templates_org_id_engine_brand_engine_model_key;

-- 3. Tornar engine_type_id obrigatório
ALTER TABLE public.engine_templates
  ALTER COLUMN engine_type_id SET NOT NULL;

-- 4. Adicionar constraint único por org + tipo de motor (1 template por tipo de motor por organização)
ALTER TABLE public.engine_templates
  ADD CONSTRAINT engine_templates_org_id_engine_type_id_key
  UNIQUE(org_id, engine_type_id);

-- 5. Tornar engine_brand e engine_model opcionais (compatibilidade retroativa)
ALTER TABLE public.engine_templates
  ALTER COLUMN engine_brand DROP NOT NULL,
  ALTER COLUMN engine_model DROP NOT NULL;

-- 6. Remover índice antigo de marca/modelo
DROP INDEX IF EXISTS idx_engine_templates_brand_model;

COMMENT ON COLUMN public.engine_templates.engine_type_id IS 'Tipo de motor ao qual este template pertence (obrigatório, único por organização)';
COMMENT ON COLUMN public.engine_templates.engine_brand IS 'Depreciado: marca do motor (mantido para compatibilidade retroativa)';
COMMENT ON COLUMN public.engine_templates.engine_model IS 'Depreciado: modelo do motor (mantido para compatibilidade retroativa)';
