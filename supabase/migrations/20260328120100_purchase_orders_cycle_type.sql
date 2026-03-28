ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS cycle_type TEXT
    CHECK (cycle_type IS NULL OR cycle_type IN ('diesel', 'otto', 'outros'));

COMMENT ON COLUMN public.purchase_orders.cycle_type IS 'Ciclo do motor: diesel, otto (gasolina/álcool) ou outros';
