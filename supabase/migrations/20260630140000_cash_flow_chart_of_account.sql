-- Categorização por plano de contas (chart_of_accounts) no lançamento de caixa.
-- Atribuído durante conciliação bancária ou edição manual; nulo permitido.

ALTER TABLE public.cash_flow
  ADD COLUMN IF NOT EXISTS chart_of_account_id uuid
  REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cash_flow_chart_of_account
  ON public.cash_flow(chart_of_account_id)
  WHERE chart_of_account_id IS NOT NULL;

COMMENT ON COLUMN public.cash_flow.chart_of_account_id IS
  'Plano de contas (chart_of_accounts) atribuído ao lançamento. Definido durante conciliação bancária ou edição manual.';
