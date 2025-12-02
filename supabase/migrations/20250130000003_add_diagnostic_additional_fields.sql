-- Add additional fields to diagnostic_checklist_responses table
ALTER TABLE public.diagnostic_checklist_responses
ADD COLUMN IF NOT EXISTS additional_parts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS additional_services jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS technical_observations text,
ADD COLUMN IF NOT EXISTS extra_services text,
ADD COLUMN IF NOT EXISTS final_opinion text;

-- Add comment to columns
COMMENT ON COLUMN public.diagnostic_checklist_responses.additional_parts IS 'Array de peças adicionais selecionadas no diagnóstico';
COMMENT ON COLUMN public.diagnostic_checklist_responses.additional_services IS 'Array de serviços adicionais selecionados no diagnóstico';
COMMENT ON COLUMN public.diagnostic_checklist_responses.technical_observations IS 'Observações técnicas do diagnóstico';
COMMENT ON COLUMN public.diagnostic_checklist_responses.extra_services IS 'Serviços extras descritos no diagnóstico';
COMMENT ON COLUMN public.diagnostic_checklist_responses.final_opinion IS 'Parecer final do diagnóstico';

