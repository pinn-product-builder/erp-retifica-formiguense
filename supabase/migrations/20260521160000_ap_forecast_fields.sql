-- =====================================================
-- Contas a Pagar: distinguir previsão recorrente vs realizado.
-- Task ClickUp 86agmy9vd.
--
-- Quando a recorrência gera um AP, ele entra como is_forecast = true.
-- Ao receber a NF real, usuário "confirma" preenchendo dados reais → forecast_resolved_at.
-- Fluxo Projetado pode tratar diferente quando is_forecast (ainda não há NF emitida).
-- =====================================================

ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS is_forecast BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS forecast_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS forecast_recurring_schedule_id UUID
    REFERENCES public.ap_recurring_schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS forecast_original_amount NUMERIC(12, 2);

CREATE INDEX IF NOT EXISTS idx_ap_is_forecast_pending
  ON public.accounts_payable(org_id, is_forecast, forecast_resolved_at)
  WHERE is_forecast = true AND forecast_resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ap_forecast_schedule
  ON public.accounts_payable(forecast_recurring_schedule_id)
  WHERE forecast_recurring_schedule_id IS NOT NULL;

COMMENT ON COLUMN public.accounts_payable.is_forecast IS
  'true quando o AP vem de previsão recorrente e ainda não foi confirmado com NF real.';
COMMENT ON COLUMN public.accounts_payable.forecast_resolved_at IS
  'Quando preenchido, o AP foi confirmado com dados reais da NF — deixa de ser previsão.';
COMMENT ON COLUMN public.accounts_payable.forecast_original_amount IS
  'Valor originalmente previsto (snapshot). Permite calcular variância previsto x realizado.';
