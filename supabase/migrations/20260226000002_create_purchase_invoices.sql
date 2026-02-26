CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id),
  receipt_id        UUID REFERENCES public.purchase_receipts(id),

  invoice_number    TEXT NOT NULL,
  invoice_series    TEXT,
  issue_date        DATE NOT NULL,

  access_key        TEXT CHECK (access_key IS NULL OR length(access_key) = 44),

  total_products    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_freight     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_taxes       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_discount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_invoice     NUMERIC(12,2) NOT NULL,

  payment_condition TEXT,
  due_dates         DATE[],

  xml_url           TEXT,
  pdf_url           TEXT,

  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'validated', 'divergent')),
  validation_notes  TEXT,

  org_id            UUID NOT NULL REFERENCES public.organizations(id),
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_invoices_number
  ON public.purchase_invoices(org_id, invoice_number, invoice_series);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_order
  ON public.purchase_invoices(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_org
  ON public.purchase_invoices(org_id);

ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_invoices' AND policyname = 'pi_select'
  ) THEN
    CREATE POLICY "pi_select" ON public.purchase_invoices FOR SELECT
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_invoices' AND policyname = 'pi_insert'
  ) THEN
    CREATE POLICY "pi_insert" ON public.purchase_invoices FOR INSERT
      WITH CHECK (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_invoices' AND policyname = 'pi_update'
  ) THEN
    CREATE POLICY "pi_update" ON public.purchase_invoices FOR UPDATE
      USING (org_id IN (
        SELECT organization_id FROM public.organization_users
        WHERE user_id = auth.uid() AND is_active = true
      ));
  END IF;
END $$;
