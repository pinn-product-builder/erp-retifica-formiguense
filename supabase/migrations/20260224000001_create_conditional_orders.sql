-- Create conditional_orders table
CREATE TABLE IF NOT EXISTS public.conditional_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conditional_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  analysis_days INTEGER NOT NULL DEFAULT 30,
  reference_doc TEXT,
  expiry_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_analysis', 'approved', 'partial_return', 'returned', 'purchased', 'overdue')),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users(id),
  justification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (org_id, conditional_number)
);

-- Create conditional_order_items table
CREATE TABLE IF NOT EXISTS public.conditional_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conditional_order_id UUID NOT NULL REFERENCES public.conditional_orders(id) ON DELETE CASCADE,
  part_code TEXT,
  part_name TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  decision TEXT CHECK (decision IN ('approve', 'return', NULL)),
  decision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_conditional_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_conditional_orders_updated_at
  BEFORE UPDATE ON public.conditional_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_conditional_orders_updated_at();

-- Auto-update total_amount when items change
CREATE OR REPLACE FUNCTION public.update_conditional_order_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.conditional_orders
  SET total_amount = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM public.conditional_order_items
    WHERE conditional_order_id = COALESCE(NEW.conditional_order_id, OLD.conditional_order_id)
  )
  WHERE id = COALESCE(NEW.conditional_order_id, OLD.conditional_order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_conditional_order_items_total
  AFTER INSERT OR UPDATE OR DELETE ON public.conditional_order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_conditional_order_total();

-- Function to generate conditional order number
CREATE OR REPLACE FUNCTION public.generate_conditional_number(p_org_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
  v_number TEXT;
BEGIN
  v_year := to_char(now(), 'YY');
  SELECT COUNT(*) INTO v_count
  FROM public.conditional_orders
  WHERE org_id = p_org_id
    AND date_trunc('year', created_at) = date_trunc('year', now());
  v_number := 'COND-' || v_year || '-' || lpad((v_count + 1)::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- RLS Policies
ALTER TABLE public.conditional_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditional_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conditional orders from their org"
  ON public.conditional_orders FOR SELECT
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can insert conditional orders in their org"
  ON public.conditional_orders FOR INSERT
  WITH CHECK (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can update conditional orders in their org"
  ON public.conditional_orders FOR UPDATE
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can delete conditional orders in their org"
  ON public.conditional_orders FOR DELETE
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can view conditional order items"
  ON public.conditional_order_items FOR SELECT
  USING (conditional_order_id IN (
    SELECT id FROM public.conditional_orders
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can insert conditional order items"
  ON public.conditional_order_items FOR INSERT
  WITH CHECK (conditional_order_id IN (
    SELECT id FROM public.conditional_orders
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can update conditional order items"
  ON public.conditional_order_items FOR UPDATE
  USING (conditional_order_id IN (
    SELECT id FROM public.conditional_orders
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "Users can delete conditional order items"
  ON public.conditional_order_items FOR DELETE
  USING (conditional_order_id IN (
    SELECT id FROM public.conditional_orders
    WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conditional_orders_org_id ON public.conditional_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_conditional_orders_supplier_id ON public.conditional_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_conditional_orders_status ON public.conditional_orders(status);
CREATE INDEX IF NOT EXISTS idx_conditional_orders_expiry_date ON public.conditional_orders(expiry_date);
CREATE INDEX IF NOT EXISTS idx_conditional_order_items_order_id ON public.conditional_order_items(conditional_order_id);
