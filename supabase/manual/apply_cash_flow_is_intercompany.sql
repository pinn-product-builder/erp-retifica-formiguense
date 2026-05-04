-- Rodar no Supabase → SQL Editor se aparecer "column cash_flow.is_intercompany does not exist".
-- Idempotente (IF NOT EXISTS).

ALTER TABLE public.cash_flow
  ADD COLUMN IF NOT EXISTS is_intercompany boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cash_flow.is_intercompany IS
  'True = movimento intercompany (eliminação na consolidação). Consultas de fluxo de caixa excluem por padrão no frontend; operações bancárias/fechamento podem incluir todos os lançamentos.';
