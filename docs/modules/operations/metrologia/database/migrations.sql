-- =====================================================
-- MIGRATION: Módulo de Metrologia
-- Descrição: Criação de todas as tabelas, views, functions e policies
-- Autor: Equipe ERP Retífica
-- Data: 28/10/2025
-- =====================================================

-- =====================================================
-- 1. TABELAS PRINCIPAIS
-- =====================================================

-- Tabela: metrology_inspections
-- Descrição: Armazena inspeções metrológicas de motores
CREATE TABLE IF NOT EXISTS public.metrology_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  inspection_number TEXT NOT NULL UNIQUE,
  inspection_status TEXT NOT NULL DEFAULT 'em_andamento',
  current_step INTEGER NOT NULL DEFAULT 1,
  
  -- Etapa 1: Identificação do Motor
  motor_identification JSONB,
  
  -- Etapa 2: Componentes Recebidos
  components_received JSONB,
  
  -- Etapa 3: Análise Visual (referência para motor_dna)
  visual_analysis_completed BOOLEAN DEFAULT FALSE,
  
  -- Etapa 4: Medições Dimensionais (referência para dimensional_measurements)
  measurements_completed BOOLEAN DEFAULT FALSE,
  
  -- Etapa 5: Parecer Técnico
  technical_report_id UUID,
  
  -- Metadados
  inspected_by UUID NOT NULL REFERENCES public.profiles(id),
  inspected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (
    inspection_status IN ('em_andamento', 'concluido', 'approved')
  ),
  CONSTRAINT valid_step CHECK (current_step BETWEEN 1 AND 5)
);

-- Índices para performance
CREATE INDEX idx_metrology_inspections_org ON public.metrology_inspections(org_id);
CREATE INDEX idx_metrology_inspections_order ON public.metrology_inspections(order_id);
CREATE INDEX idx_metrology_inspections_number ON public.metrology_inspections(inspection_number);
CREATE INDEX idx_metrology_motor_serial ON public.metrology_inspections 
  USING GIN ((motor_identification->>'engine_serial_number'));

-- Comentários
COMMENT ON TABLE public.metrology_inspections IS 'Inspeções metrológicas de motores - processo digital de análise dimensional e visual';
COMMENT ON COLUMN public.metrology_inspections.inspection_number IS 'Número único formato MET-YYYY-0001';
COMMENT ON COLUMN public.metrology_inspections.motor_identification IS 'Dados da Etapa 1: tipo motor, marca, modelo, ano, número do motor, fotos';

-- =====================================================

-- Tabela: motor_dna
-- Descrição: DNA de componentes individuais (Etapa 3 - Análise Visual)
CREATE TABLE IF NOT EXISTS public.motor_dna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES public.metrology_inspections(id) ON DELETE CASCADE,
  
  component TEXT NOT NULL, -- 'bloco', 'eixo', 'biela', 'comando', 'cabecote'
  component_code TEXT, -- Código interno do componente
  
  visual_analysis JSONB NOT NULL, -- Checklist visual + observações
  photos JSONB, -- Array de URLs das fotos
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_component CHECK (
    component IN ('bloco', 'eixo', 'biela', 'comando', 'cabecote', 'outro')
  )
);

CREATE INDEX idx_motor_dna_inspection ON public.motor_dna(inspection_id);
CREATE INDEX idx_motor_dna_component ON public.motor_dna(component);

COMMENT ON TABLE public.motor_dna IS 'Análise visual detalhada de cada componente do motor';

-- =====================================================

-- Tabela: dimensional_measurements
-- Descrição: Medições dimensionais (Etapa 4)
CREATE TABLE IF NOT EXISTS public.dimensional_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES public.metrology_inspections(id) ON DELETE CASCADE,
  
  component TEXT NOT NULL,
  measurement_point TEXT NOT NULL, -- Ex: "Cilindro 1", "Colo móvel 2"
  nominal_value NUMERIC(10, 3) NOT NULL, -- Valor nominal em mm
  min_tolerance NUMERIC(10, 3) NOT NULL, -- Tolerância mínima
  max_tolerance NUMERIC(10, 3) NOT NULL, -- Tolerância máxima
  measured_value NUMERIC(10, 3) NOT NULL, -- Valor medido
  tolerance_status TEXT NOT NULL, -- 'ok', 'warning', 'out_of_tolerance'
  
  unit TEXT DEFAULT 'mm', -- Unidade de medida
  measurement_method TEXT, -- Ex: "Micrômetro externo", "Calibre"
  notes TEXT,
  
  measured_by UUID REFERENCES public.profiles(id),
  measured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_tolerance_status CHECK (
    tolerance_status IN ('ok', 'warning', 'out_of_tolerance')
  )
);

CREATE INDEX idx_dimensional_measurements_inspection ON public.dimensional_measurements(inspection_id);
CREATE INDEX idx_dimensional_measurements_component ON public.dimensional_measurements(component);
CREATE INDEX idx_dimensional_measurements_status ON public.dimensional_measurements(tolerance_status);

COMMENT ON TABLE public.dimensional_measurements IS 'Medições dimensionais com controle de tolerâncias';

-- =====================================================

-- Tabela: technical_reports
-- Descrição: Parecer técnico gerado (Etapa 5)
CREATE TABLE IF NOT EXISTS public.technical_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL UNIQUE REFERENCES public.metrology_inspections(id) ON DELETE CASCADE,
  
  diagnosis TEXT NOT NULL, -- Diagnóstico geral
  probable_causes TEXT NOT NULL, -- Causas prováveis
  recommendations TEXT, -- Recomendações
  suggested_services JSONB NOT NULL, -- Array de serviços: [{code, name, priority}]
  
  pdf_url TEXT NOT NULL, -- URL do PDF no Storage
  pdf_pages INTEGER NOT NULL,
  pdf_size_kb INTEGER NOT NULL,
  
  generated_by UUID NOT NULL REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  regenerated_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_technical_reports_inspection ON public.technical_reports(inspection_id);

COMMENT ON TABLE public.technical_reports IS 'Parecer técnico em PDF gerado automaticamente';

-- =====================================================

-- Tabela: metrology_kpis (materializada para dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.metrology_kpis AS
SELECT 
  mi.org_id,
  mi.inspected_by,
  DATE_TRUNC('day', mi.inspected_at) as date,
  COUNT(*) as total_inspections,
  AVG(EXTRACT(EPOCH FROM (mi.inspected_at - mi.created_at)) / 3600) as avg_analysis_hours,
  COUNT(*) FILTER (WHERE tr.regenerated_count > 0) as rework_count,
  COUNT(*) FILTER (WHERE mi.inspection_status = 'approved') as completed_count
FROM public.metrology_inspections mi
LEFT JOIN public.technical_reports tr ON tr.inspection_id = mi.id
WHERE mi.inspection_status IN ('concluido', 'approved')
GROUP BY mi.org_id, mi.inspected_by, DATE_TRUNC('day', mi.inspected_at);

CREATE UNIQUE INDEX idx_metrology_kpis_unique ON public.metrology_kpis(org_id, inspected_by, date);

COMMENT ON MATERIALIZED VIEW public.metrology_kpis IS 'KPIs agregados para dashboard de metrologia';

-- =====================================================
-- 2. FUNCTIONS
-- =====================================================

-- Function: generate_inspection_number
-- Descrição: Gera número sequencial de inspeção formato MET-YYYY-0001
CREATE OR REPLACE FUNCTION public.generate_inspection_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT := TO_CHAR(NOW(), 'YYYY');
  v_sequence INTEGER;
  v_number TEXT;
BEGIN
  -- Buscar o último número do ano atual para a organização
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(inspection_number, '-', 3) AS INTEGER
      )
    ), 
    0
  ) INTO v_sequence
  FROM public.metrology_inspections
  WHERE org_id = p_org_id
    AND inspection_number LIKE 'MET-' || v_year || '-%';
  
  -- Incrementar
  v_sequence := v_sequence + 1;
  
  -- Formatar com 4 dígitos
  v_number := 'MET-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_inspection_number IS 'Gera número sequencial único de inspeção por organização';

-- =====================================================

-- Function: calculate_tolerance_status
-- Descrição: Calcula status de tolerância baseado no valor medido
CREATE OR REPLACE FUNCTION public.calculate_tolerance_status(
  p_measured NUMERIC,
  p_min NUMERIC,
  p_max NUMERIC
)
RETURNS TEXT AS $$
BEGIN
  IF p_measured < p_min OR p_measured > p_max THEN
    RETURN 'out_of_tolerance';
  ELSIF p_measured >= p_min * 0.95 AND p_measured <= p_max * 1.05 THEN
    RETURN 'warning';
  ELSE
    RETURN 'ok';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_tolerance_status IS 'Calcula status de tolerância: ok, warning, out_of_tolerance';

-- =====================================================

-- Function: update_updated_at_column
-- Descrição: Trigger function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_metrology_inspections_updated_at
  BEFORE UPDATE ON public.metrology_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_motor_dna_updated_at
  BEFORE UPDATE ON public.motor_dna
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================

-- Function: refresh_metrology_kpis
-- Descrição: Atualiza a materialized view de KPIs
CREATE OR REPLACE FUNCTION public.refresh_metrology_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.metrology_kpis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.metrology_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensional_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_reports ENABLE ROW LEVEL SECURITY;

-- Policy: metrology_inspections - SELECT
CREATE POLICY "Users can view metrology inspections from their org"
ON public.metrology_inspections
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy: metrology_inspections - INSERT
CREATE POLICY "Metrology users can create inspections"
ON public.metrology_inspections
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND inspected_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy: metrology_inspections - UPDATE
CREATE POLICY "Metrology users can update their own inspections"
ON public.metrology_inspections
FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND (
    inspected_by IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT user_id FROM public.profiles 
      WHERE role IN ('admin', 'owner', 'gerente_producao')
    )
  )
);

-- Policy: motor_dna - SELECT
CREATE POLICY "Users can view motor_dna from their org"
ON public.motor_dna
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy: motor_dna - INSERT/UPDATE/DELETE
CREATE POLICY "Metrology users can manage motor_dna"
ON public.motor_dna
FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy: dimensional_measurements - SELECT
CREATE POLICY "Users can view measurements from their org"
ON public.dimensional_measurements
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy: dimensional_measurements - INSERT/UPDATE/DELETE
CREATE POLICY "Metrology users can manage measurements"
ON public.dimensional_measurements
FOR ALL
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy: technical_reports - SELECT
CREATE POLICY "Users can view technical reports from their org"
ON public.technical_reports
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy: technical_reports - INSERT
CREATE POLICY "Metrology users can create technical reports"
ON public.technical_reports
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 4. STORAGE POLICIES
-- =====================================================

-- Bucket: metrology-photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('metrology-photos', 'metrology-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Upload photos
CREATE POLICY "Users can upload metrology photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'metrology-photos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE org_id = (storage.foldername(name))[1]::uuid
  )
);

-- Policy: View photos
CREATE POLICY "Users can view metrology photos from their org"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'metrology-photos'
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE org_id = (storage.foldername(name))[1]::uuid
  )
);

-- Policy: Delete photos
CREATE POLICY "Users can delete metrology photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'metrology-photos'
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE org_id = (storage.foldername(name))[1]::uuid
  )
);

-- =====================================================
-- 5. ATUALIZAÇÃO DE TABELAS EXISTENTES
-- =====================================================

-- Adicionar campos em orders para suportar metrologia
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'metrology_inspection_id'
  ) THEN
    ALTER TABLE public.orders
    ADD COLUMN metrology_inspection_id UUID REFERENCES public.metrology_inspections(id),
    ADD COLUMN metrology_status TEXT,
    ADD COLUMN has_metrology_report BOOLEAN DEFAULT FALSE,
    ADD COLUMN motor_dna_id TEXT;
    
    CREATE INDEX idx_orders_metrology ON public.orders(metrology_inspection_id);
  END IF;
END $$;

-- Adicionar campos em detailed_budgets para vínculo com metrologia
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'detailed_budgets' AND column_name = 'metrology_inspection_id'
  ) THEN
    ALTER TABLE public.detailed_budgets
    ADD COLUMN metrology_inspection_id UUID REFERENCES public.metrology_inspections(id),
    ADD COLUMN source TEXT DEFAULT 'manual',
    ADD COLUMN metrology_pdf_url TEXT;
  END IF;
END $$;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Comentário final
COMMENT ON SCHEMA public IS 'Schema público com módulo de metrologia implementado';
