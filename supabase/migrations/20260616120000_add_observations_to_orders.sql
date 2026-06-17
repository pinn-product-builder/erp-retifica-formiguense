-- Campo de observações gerais da OS: texto livre editável a qualquer momento dentro da ordem.
-- Distinto de initial_observations (check-in) e final_observations (entrega), que são presos a etapas.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS observations text;

COMMENT ON COLUMN public.orders.observations IS
  'Observações gerais da OS: campo de texto livre editável a qualquer momento. Não confundir com initial_observations (check-in) nem final_observations (entrega).';
