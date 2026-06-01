-- =====================================================
-- Negociação individual da duplicata (CR).
-- Task ClickUp 86agymxde.
--
-- Quando há negociação ativa, a régua automática (Fase 2) deve pular
-- esse título e o sistema gera lembrete na data prometida.
-- =====================================================

ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS negotiation_promised_date DATE,
  ADD COLUMN IF NOT EXISTS negotiation_notes TEXT,
  ADD COLUMN IF NOT EXISTS negotiation_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS negotiation_owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS negotiation_resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ar_negotiation_promised_date
  ON public.accounts_receivable(negotiation_promised_date)
  WHERE negotiation_promised_date IS NOT NULL AND negotiation_resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ar_negotiation_paused
  ON public.accounts_receivable(org_id, negotiation_paused_at)
  WHERE negotiation_paused_at IS NOT NULL AND negotiation_resolved_at IS NULL;

COMMENT ON COLUMN public.accounts_receivable.negotiation_promised_date IS
  'Data prometida pelo cliente em negociação individual. Régua automática suspende disparos até resolução.';
COMMENT ON COLUMN public.accounts_receivable.negotiation_paused_at IS
  'Marca início da negociação (pausa régua). Null quando não há negociação ativa.';
COMMENT ON COLUMN public.accounts_receivable.negotiation_resolved_at IS
  'Marca resolução da negociação (paga, refeita ou cancelada). Quando preenchida, régua volta a operar.';
