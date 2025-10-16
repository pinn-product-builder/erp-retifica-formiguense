-- Create reports schema for enterprise functionality
CREATE TABLE IF NOT EXISTS public.report_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_type TEXT NOT NULL DEFAULT 'csv',
  parameters_schema JSONB NOT NULL DEFAULT '{}',
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, code)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  report_code TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  period_start DATE,
  period_end DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  size_bytes INTEGER,
  hash_sha256 TEXT,
  generated_by UUID,
  generated_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create global audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Add storage bucket for reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'reports', false, 52428800, ARRAY['text/csv', 'application/pdf', 'application/json', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.report_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_catalog
CREATE POLICY "Users can view report_catalog for their organization" 
ON public.report_catalog FOR SELECT 
USING ((org_id = current_org_id()) OR (org_id IS NULL));

CREATE POLICY "Admins can manage report_catalog for their organization" 
ON public.report_catalog FOR ALL 
USING ((org_id = current_org_id()) AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

-- RLS Policies for reports
CREATE POLICY "Users can view reports from their organization" 
ON public.reports FOR SELECT 
USING (org_id = current_org_id());

CREATE POLICY "Users can create reports for their organization" 
ON public.reports FOR INSERT 
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update their own reports" 
ON public.reports FOR UPDATE 
USING (org_id = current_org_id());

-- RLS Policies for audit_log
CREATE POLICY "Users can view audit_log from their organization" 
ON public.audit_log FOR SELECT 
USING (org_id = current_org_id());

-- Storage policies for reports bucket
CREATE POLICY "Users can view reports from their organization" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload reports for their organization" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add updated_at triggers
CREATE TRIGGER update_report_catalog_updated_at
  BEFORE UPDATE ON public.report_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix critical RLS issues - Add org_id to financial tables that don't have proper multi-tenancy
ALTER TABLE public.accounts_payable ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.consultants ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.monthly_dre ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE public.parts_inventory ADD COLUMN IF NOT EXISTS org_id UUID;

-- Update RLS policies for financial tables to be org-specific
DROP POLICY IF EXISTS "Authenticated users can manage accounts payable" ON public.accounts_payable;
DROP POLICY IF EXISTS "Authenticated users can view accounts payable" ON public.accounts_payable;

CREATE POLICY "Users can manage accounts payable for their organization" 
ON public.accounts_payable FOR ALL 
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "Authenticated users can manage bank accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Authenticated users can view bank accounts" ON public.bank_accounts;

CREATE POLICY "Users can manage bank accounts for their organization" 
ON public.bank_accounts FOR ALL 
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "Authenticated users can manage expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON public.expense_categories;

CREATE POLICY "Users can view expense categories for their organization" 
ON public.expense_categories FOR SELECT 
USING ((org_id = current_org_id()) OR (org_id IS NULL));

CREATE POLICY "Admins can manage expense categories for their organization" 
ON public.expense_categories FOR ALL 
USING ((org_id = current_org_id()) AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "Authenticated users can manage consultants" ON public.consultants;
DROP POLICY IF EXISTS "Authenticated users can view consultants" ON public.consultants;

CREATE POLICY "Users can manage consultants for their organization" 
ON public.consultants FOR ALL 
USING (org_id = current_org_id())
WITH CHECK (org_id = current_org_id());

-- Add foreign keys for referential integrity
ALTER TABLE public.tax_rate_tables 
ADD CONSTRAINT fk_tax_rate_tables_tax_type 
FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE RESTRICT;

ALTER TABLE public.tax_rate_tables 
ADD CONSTRAINT fk_tax_rate_tables_classification 
FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE RESTRICT;

ALTER TABLE public.obligations 
ADD CONSTRAINT fk_obligations_obligation_kind 
FOREIGN KEY (obligation_kind_id) REFERENCES public.obligation_kinds(id) ON DELETE RESTRICT;

ALTER TABLE public.obligation_files 
ADD CONSTRAINT fk_obligation_files_obligation 
FOREIGN KEY (obligation_id) REFERENCES public.obligations(id) ON DELETE CASCADE;

ALTER TABLE public.tax_calculations 
ADD CONSTRAINT fk_tax_calculations_regime 
FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;

ALTER TABLE public.tax_calculations 
ADD CONSTRAINT fk_tax_calculations_classification 
FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE RESTRICT;

-- Insert default report catalog entries
INSERT INTO public.report_catalog (org_id, code, name, description, category, template_type, parameters_schema, display_order) VALUES
(NULL, 'vendas_geral', 'Relatório de Vendas', 'Relatório geral de vendas por período', 'financeiro', 'csv', '{"period": {"type": "daterange", "required": true}, "consultant": {"type": "select", "required": false}}', 1),
(NULL, 'produtividade', 'Relatório de Produtividade', 'Produtividade por consultor e período', 'operacional', 'csv', '{"period": {"type": "daterange", "required": true}, "consultant": {"type": "select", "required": false}}', 2),
(NULL, 'clientes', 'Relatório de Clientes', 'Lista de clientes e informações', 'comercial', 'csv', '{"status": {"type": "select", "required": false}, "type": {"type": "select", "required": false}}', 3),
(NULL, 'estoque', 'Relatório de Estoque', 'Situação do estoque de peças', 'estoque', 'csv', '{"component": {"type": "select", "required": false}, "status": {"type": "select", "required": false}}', 4);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_org_id ON public.reports(org_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id ON public.audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);