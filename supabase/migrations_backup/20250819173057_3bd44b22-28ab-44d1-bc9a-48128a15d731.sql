-- Phase 0 & 1: Critical fixes and basic security improvements

-- 1. Add created_by column to obligations table
ALTER TABLE public.obligations 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- 2. Add essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_obligations_created_by ON public.obligations(created_by);
CREATE INDEX IF NOT EXISTS idx_obligations_period ON public.obligations(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_obligations_kind_period ON public.obligations(obligation_kind_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_order ON public.tax_calculations(order_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_regime ON public.tax_calculations(regime_id);
CREATE INDEX IF NOT EXISTS idx_tax_ledgers_period ON public.tax_ledgers(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_tax_ledgers_tax_type ON public.tax_ledgers(tax_type_id);
CREATE INDEX IF NOT EXISTS idx_obligation_files_obligation ON public.obligation_files(obligation_id);

-- 3. Add updated_at triggers for tables that don't have them
CREATE TRIGGER update_obligations_updated_at
    BEFORE UPDATE ON public.obligations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_obligation_files_updated_at
    BEFORE UPDATE ON public.obligation_files
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Storage policies for fiscal-outputs bucket
-- Create policies for the fiscal-outputs bucket
CREATE POLICY "Users can view their own fiscal files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'fiscal-outputs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their own fiscal files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'fiscal-outputs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own fiscal files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'fiscal-outputs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own fiscal files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'fiscal-outputs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Update obligations RLS to use created_by
DROP POLICY IF EXISTS "Authenticated users can manage obligations" ON public.obligations;

CREATE POLICY "Users can view their own obligations" 
ON public.obligations 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own obligations" 
ON public.obligations 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own obligations" 
ON public.obligations 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own obligations" 
ON public.obligations 
FOR DELETE 
USING (created_by = auth.uid());