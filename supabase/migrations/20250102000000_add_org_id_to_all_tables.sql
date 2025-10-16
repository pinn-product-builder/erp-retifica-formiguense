-- Add org_id column to all business tables after they are created
-- This migration adds multi-tenancy support to all tables

-- Add org_id to fiscal tables
ALTER TABLE public.tax_types ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_regimes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.fiscal_classifications ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_rules ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.obligation_kinds ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.obligations ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_calculations ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_ledgers ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_rate_tables ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.company_fiscal_settings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- Add org_id to business tables
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.accounts_receivable ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- Create indexes for org_id columns
CREATE INDEX IF NOT EXISTS idx_tax_types_org_id ON public.tax_types(org_id);
CREATE INDEX IF NOT EXISTS idx_tax_regimes_org_id ON public.tax_regimes(org_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_classifications_org_id ON public.fiscal_classifications(org_id);
CREATE INDEX IF NOT EXISTS idx_tax_rules_org_id ON public.tax_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_obligation_kinds_org_id ON public.obligation_kinds(org_id);
CREATE INDEX IF NOT EXISTS idx_obligations_org_id ON public.obligations(org_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_org_id ON public.tax_calculations(org_id);
CREATE INDEX IF NOT EXISTS idx_tax_ledgers_org_id ON public.tax_ledgers(org_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_tables_org_id ON public.tax_rate_tables(org_id);
CREATE INDEX IF NOT EXISTS idx_company_fiscal_settings_org_id ON public.company_fiscal_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON public.orders(org_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_org_id ON public.accounts_receivable(org_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_org_id ON public.accounts_payable(org_id);

