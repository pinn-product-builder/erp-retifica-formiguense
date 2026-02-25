CREATE TABLE IF NOT EXISTS public.supplier_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expiring', 'expired', 'cancelled')),
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  renewal_notice_days INTEGER NOT NULL DEFAULT 30,
  payment_days INTEGER NOT NULL DEFAULT 30,
  discount_percentage NUMERIC(5,2),
  minimum_order NUMERIC(15,2),
  maximum_order NUMERIC(15,2),
  total_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, contract_number)
);

CREATE TABLE IF NOT EXISTS public.supplier_contract_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.supplier_contracts(id) ON DELETE CASCADE,
  part_code TEXT,
  part_name TEXT NOT NULL,
  agreed_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(15,3),
  max_quantity NUMERIC(15,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.update_supplier_contracts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_supplier_contracts_updated_at
  BEFORE UPDATE ON public.supplier_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_contracts_updated_at();

CREATE OR REPLACE FUNCTION public.generate_contract_number(p_org_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(now(), 'YYYY');
  SELECT COUNT(*) INTO v_count
  FROM public.supplier_contracts
  WHERE org_id = p_org_id
    AND date_trunc('year', created_at) = date_trunc('year', now());
  RETURN 'CONT-' || v_year || '-' || lpad((v_count + 1)::TEXT, 3, '0');
END;
$$;

ALTER TABLE public.supplier_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_contract_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts from their org"
  ON public.supplier_contracts FOR SELECT
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can insert contracts in their org"
  ON public.supplier_contracts FOR INSERT
  WITH CHECK (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update contracts in their org"
  ON public.supplier_contracts FOR UPDATE
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can delete contracts in their org"
  ON public.supplier_contracts FOR DELETE
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can view contract items"
  ON public.supplier_contract_items FOR SELECT
  USING (contract_id IN (
    SELECT id FROM public.supplier_contracts
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can insert contract items"
  ON public.supplier_contract_items FOR INSERT
  WITH CHECK (contract_id IN (
    SELECT id FROM public.supplier_contracts
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can update contract items"
  ON public.supplier_contract_items FOR UPDATE
  USING (contract_id IN (
    SELECT id FROM public.supplier_contracts
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can delete contract items"
  ON public.supplier_contract_items FOR DELETE
  USING (contract_id IN (
    SELECT id FROM public.supplier_contracts
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE INDEX IF NOT EXISTS idx_supplier_contracts_org_id ON public.supplier_contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_supplier_id ON public.supplier_contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_status ON public.supplier_contracts(status);
CREATE INDEX IF NOT EXISTS idx_supplier_contracts_end_date ON public.supplier_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_supplier_contract_items_contract_id ON public.supplier_contract_items(contract_id);
