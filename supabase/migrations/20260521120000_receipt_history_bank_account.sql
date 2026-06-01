-- =====================================================
-- CR: vincular origem do pagamento (banco/caixa) no receipt_history
-- Task ClickUp 86agymx0v
--
-- Decisão: coluna NULLABLE no banco para não quebrar dados históricos.
-- A obrigatoriedade é validada no app (Zod schema) para novas baixas.
-- =====================================================

ALTER TABLE public.receipt_history
  ADD COLUMN IF NOT EXISTS bank_account_id UUID
    REFERENCES public.bank_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_receipt_history_bank_account_id
  ON public.receipt_history(bank_account_id)
  WHERE bank_account_id IS NOT NULL;

COMMENT ON COLUMN public.receipt_history.bank_account_id IS
  'Origem do pagamento (conta bancária ou caixa). Obrigatório no app a partir de mai/2026; nullable para histórico anterior.';
