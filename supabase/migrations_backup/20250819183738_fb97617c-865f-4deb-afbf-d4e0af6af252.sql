-- Update RLS policies for fiscal tables to be organization-aware
-- Fix hardcoded colors and improve organization integration

-- Drop existing permissive policies and create proper organization-based ones
DROP POLICY IF EXISTS "Authenticated users can manage tax_types" ON public.tax_types;
DROP POLICY IF EXISTS "Authenticated users can manage tax_regimes" ON public.tax_regimes;
DROP POLICY IF EXISTS "Authenticated users can manage fiscal_classifications" ON public.fiscal_classifications;
DROP POLICY IF EXISTS "Authenticated users can manage tax_rules" ON public.tax_rules;
DROP POLICY IF EXISTS "Authenticated users can manage tax_rate_tables" ON public.tax_rate_tables;
DROP POLICY IF EXISTS "Authenticated users can manage tax_calculations" ON public.tax_calculations;
DROP POLICY IF EXISTS "Authenticated users can manage tax_ledgers" ON public.tax_ledgers;
DROP POLICY IF EXISTS "Authenticated users can manage company_fiscal_settings" ON public.company_fiscal_settings;
DROP POLICY IF EXISTS "Authenticated users can manage obligation_kinds" ON public.obligation_kinds;
DROP POLICY IF EXISTS "Authenticated users can manage obligation_files" ON public.obligation_files;

-- Create proper organization-based RLS policies for tax_types
CREATE POLICY "Users can view tax_types from their organization"
ON public.tax_types FOR SELECT
TO authenticated
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Users can create tax_types for their organization"
ON public.tax_types FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update tax_types from their organization"
ON public.tax_types FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete tax_types from their organization"
ON public.tax_types FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for tax_regimes
CREATE POLICY "Users can view tax_regimes from their organization"
ON public.tax_regimes FOR SELECT
TO authenticated
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Users can create tax_regimes for their organization"
ON public.tax_regimes FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update tax_regimes from their organization"
ON public.tax_regimes FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete tax_regimes from their organization"
ON public.tax_regimes FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for fiscal_classifications
CREATE POLICY "Users can view fiscal_classifications from their organization"
ON public.fiscal_classifications FOR SELECT
TO authenticated
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Users can create fiscal_classifications for their organization"
ON public.fiscal_classifications FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update fiscal_classifications from their organization"
ON public.fiscal_classifications FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete fiscal_classifications from their organization"
ON public.fiscal_classifications FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for tax_rules
CREATE POLICY "Users can view tax_rules from their organization"
ON public.tax_rules FOR SELECT
TO authenticated
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Users can create tax_rules for their organization"
ON public.tax_rules FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update tax_rules from their organization"
ON public.tax_rules FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete tax_rules from their organization"
ON public.tax_rules FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for tax_rate_tables
CREATE POLICY "Users can view tax_rate_tables from their organization"
ON public.tax_rate_tables FOR SELECT
TO authenticated
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Users can create tax_rate_tables for their organization"
ON public.tax_rate_tables FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update tax_rate_tables from their organization"
ON public.tax_rate_tables FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete tax_rate_tables from their organization"
ON public.tax_rate_tables FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for tax_calculations
CREATE POLICY "Users can view tax_calculations from their organization"
ON public.tax_calculations FOR SELECT
TO authenticated
USING (org_id = current_org_id());

CREATE POLICY "Users can create tax_calculations for their organization"
ON public.tax_calculations FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update tax_calculations from their organization"
ON public.tax_calculations FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete tax_calculations from their organization"
ON public.tax_calculations FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for tax_ledgers
CREATE POLICY "Users can view tax_ledgers from their organization"
ON public.tax_ledgers FOR SELECT
TO authenticated
USING (org_id = current_org_id());

CREATE POLICY "Users can create tax_ledgers for their organization"
ON public.tax_ledgers FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update tax_ledgers from their organization"
ON public.tax_ledgers FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete tax_ledgers from their organization"
ON public.tax_ledgers FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for company_fiscal_settings
CREATE POLICY "Users can view company_fiscal_settings from their organization"
ON public.company_fiscal_settings FOR SELECT
TO authenticated
USING (org_id = current_org_id());

CREATE POLICY "Users can create company_fiscal_settings for their organization"
ON public.company_fiscal_settings FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update company_fiscal_settings from their organization"
ON public.company_fiscal_settings FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete company_fiscal_settings from their organization"
ON public.company_fiscal_settings FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for obligation_kinds
CREATE POLICY "Users can view obligation_kinds from their organization"
ON public.obligation_kinds FOR SELECT
TO authenticated
USING (org_id = current_org_id() OR org_id IS NULL);

CREATE POLICY "Users can create obligation_kinds for their organization"
ON public.obligation_kinds FOR INSERT
TO authenticated
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update obligation_kinds from their organization"
ON public.obligation_kinds FOR UPDATE
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete obligation_kinds from their organization"
ON public.obligation_kinds FOR DELETE
TO authenticated
USING (org_id = current_org_id());

-- Create proper organization-based RLS policies for obligation_files
CREATE POLICY "Users can view obligation_files from their organization"
ON public.obligation_files FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.obligations o 
  WHERE o.id = obligation_files.obligation_id 
  AND o.org_id = current_org_id()
));

CREATE POLICY "Users can create obligation_files for their organization"
ON public.obligation_files FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.obligations o 
  WHERE o.id = obligation_files.obligation_id 
  AND o.org_id = current_org_id()
));

CREATE POLICY "Users can update obligation_files from their organization"
ON public.obligation_files FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.obligations o 
  WHERE o.id = obligation_files.obligation_id 
  AND o.org_id = current_org_id()
));

CREATE POLICY "Users can delete obligation_files from their organization"
ON public.obligation_files FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.obligations o 
  WHERE o.id = obligation_files.obligation_id 
  AND o.org_id = current_org_id()
));

-- Create a table for configurable jurisdiction badge colors
CREATE TABLE IF NOT EXISTS public.jurisdiction_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id),
  jurisdiction text NOT NULL,
  badge_color text NOT NULL,
  text_color text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(org_id, jurisdiction)
);

-- Enable RLS for jurisdiction_config
ALTER TABLE public.jurisdiction_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage jurisdiction_config for their organization"
ON public.jurisdiction_config FOR ALL
TO authenticated
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Insert default jurisdiction configurations
INSERT INTO public.jurisdiction_config (jurisdiction, badge_color, text_color) VALUES
('federal', 'hsl(var(--primary))', 'hsl(var(--primary-foreground))'),
('estadual', 'hsl(var(--secondary))', 'hsl(var(--secondary-foreground))'),
('municipal', 'hsl(var(--accent))', 'hsl(var(--accent-foreground))')
ON CONFLICT (org_id, jurisdiction) DO NOTHING;

-- Create audit log table for fiscal operations
CREATE TABLE IF NOT EXISTS public.fiscal_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  user_id uuid REFERENCES auth.users(id),
  timestamp timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS for fiscal_audit_log
ALTER TABLE public.fiscal_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit_log from their organization"
ON public.fiscal_audit_log FOR SELECT
TO authenticated
USING (org_id = current_org_id());

-- Create triggers for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION update_jurisdiction_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE TRIGGER update_jurisdiction_config_updated_at
  BEFORE UPDATE ON public.jurisdiction_config
  FOR EACH ROW
  EXECUTE FUNCTION update_jurisdiction_config_updated_at();