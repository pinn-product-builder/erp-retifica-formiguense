-- Migration: Adicionar campos para peças e serviços adicionais no diagnóstico
-- e permitir que o componente seja NULL para checklists que se aplicam a todos os componentes

-- 1. Adicionar campos para peças e serviços adicionais selecionados manualmente
ALTER TABLE public.diagnostic_checklist_responses 
ADD COLUMN IF NOT EXISTS additional_parts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS additional_services jsonb DEFAULT '[]'::jsonb;

-- 2. Permitir que component seja NULL em diagnostic_checklists (já deve estar permitido, mas garantindo)
ALTER TABLE public.diagnostic_checklists 
ALTER COLUMN component DROP NOT NULL;

-- 3. Comentários para documentação
COMMENT ON COLUMN public.diagnostic_checklist_responses.additional_parts IS 'Peças adicionais selecionadas manualmente durante o diagnóstico';
COMMENT ON COLUMN public.diagnostic_checklist_responses.additional_services IS 'Serviços adicionais selecionados manualmente durante o diagnóstico';
COMMENT ON COLUMN public.diagnostic_checklist_responses.generated_services IS 'Serviços gerados automaticamente baseados nas respostas do checklist';

-- 4. Criar índices para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_diagnostic_responses_additional_parts 
ON public.diagnostic_checklist_responses USING gin (additional_parts);

CREATE INDEX IF NOT EXISTS idx_diagnostic_responses_additional_services 
ON public.diagnostic_checklist_responses USING gin (additional_services);

