-- Campos de finalidade, título e urgência em cotações (US-PUR-013/014)
ALTER TABLE public.purchase_quotations
  ADD COLUMN IF NOT EXISTS title            TEXT,
  ADD COLUMN IF NOT EXISTS urgency          TEXT DEFAULT 'normal'
    CHECK (urgency IN ('normal', 'media', 'alta', 'urgente')),
  ADD COLUMN IF NOT EXISTS purpose          TEXT DEFAULT 'stock'
    CHECK (purpose IN ('stock', 'budget')),
  ADD COLUMN IF NOT EXISTS order_reference  TEXT,
  ADD COLUMN IF NOT EXISTS budget_reference TEXT;

COMMENT ON COLUMN public.purchase_quotations.title            IS 'Título descritivo da cotação';
COMMENT ON COLUMN public.purchase_quotations.urgency          IS 'Nível de urgência: normal, media, alta, urgente';
COMMENT ON COLUMN public.purchase_quotations.purpose          IS 'Finalidade: stock=compra, budget=orçamento';
COMMENT ON COLUMN public.purchase_quotations.order_reference  IS 'Vínculo com Ordem de Serviço (finalidade stock)';
COMMENT ON COLUMN public.purchase_quotations.budget_reference IS 'Referência do orçamento de venda (finalidade budget)';
