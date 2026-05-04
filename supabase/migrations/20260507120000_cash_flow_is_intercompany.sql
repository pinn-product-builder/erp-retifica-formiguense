-- Lançamentos entre empresas do grupo (consolidados): excluídos do fluxo analítico por padrão no app.
ALTER TABLE public.cash_flow
  ADD COLUMN IF NOT EXISTS is_intercompany boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.cash_flow.is_intercompany IS
  'True = movimento intercompany (eliminação na consolidação). Consultas de fluxo de caixa excluem por padrão no frontend; operações bancárias/fechamento podem incluir todos os lançamentos.';
