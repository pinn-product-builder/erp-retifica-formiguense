-- =====================================================
-- SCHEMA: Cadastro de Cliente Pessoa Física
-- Módulo: Clientes
-- User Story: US-CLI-001
-- =====================================================

-- =====================================================
-- TABELA: customers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Tipo de cliente
  type TEXT NOT NULL CHECK (type IN ('direto', 'oficina')),
  
  -- Dados Pessoa Física
  cpf TEXT, -- Apenas números, 11 dígitos
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Dados Pessoa Jurídica (para type = 'oficina')
  cnpj TEXT,
  company_name TEXT,
  trade_name TEXT,
  contact_person TEXT,
  
  -- Endereço
  address_cep TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  
  -- Observações
  notes TEXT,
  
  -- Status
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT cpf_length CHECK (cpf IS NULL OR length(cpf) = 11),
  CONSTRAINT cnpj_length CHECK (cnpj IS NULL OR length(cnpj) = 14),
  CONSTRAINT type_cpf_check CHECK (
    (type = 'direto' AND cpf IS NOT NULL AND cnpj IS NULL) OR
    (type = 'oficina' AND cnpj IS NOT NULL AND cpf IS NULL)
  ),
  CONSTRAINT unique_cpf_per_org UNIQUE (org_id, cpf),
  CONSTRAINT unique_cnpj_per_org UNIQUE (org_id, cnpj)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índice para busca por CPF
CREATE INDEX idx_customers_cpf ON public.customers(org_id, cpf) WHERE cpf IS NOT NULL;

-- Índice para busca por CNPJ
CREATE INDEX idx_customers_cnpj ON public.customers(org_id, cnpj) WHERE cnpj IS NOT NULL;

-- Índice para busca por nome (case-insensitive)
CREATE INDEX idx_customers_name ON public.customers USING gin(to_tsvector('portuguese', name));

-- Índice para busca por telefone
CREATE INDEX idx_customers_phone ON public.customers(org_id, phone);

-- Índice para clientes ativos
CREATE INDEX idx_customers_active ON public.customers(org_id, active) WHERE active = true;

-- =====================================================
-- TRIGGER: Atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (todos da organização podem ver)
CREATE POLICY customers_select_policy ON public.customers
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: INSERT (todos autenticados podem criar)
CREATE POLICY customers_insert_policy ON public.customers
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: UPDATE (todos da organização podem atualizar)
CREATE POLICY customers_update_policy ON public.customers
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy: DELETE (apenas admin pode deletar)
CREATE POLICY customers_delete_policy ON public.customers
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Clientes Ativos Pessoa Física
CREATE OR REPLACE VIEW v_customers_pf_active AS
SELECT 
  c.id,
  c.org_id,
  c.cpf,
  c.name,
  c.phone,
  c.email,
  c.address_street,
  c.address_city,
  c.address_state,
  c.notes,
  c.created_at,
  c.updated_at
FROM public.customers c
WHERE c.type = 'direto'
AND c.active = true;

GRANT SELECT ON v_customers_pf_active TO authenticated;

-- View: Estatísticas de Clientes
CREATE OR REPLACE VIEW v_customers_stats AS
SELECT 
  org_id,
  COUNT(*) AS total_customers,
  COUNT(*) FILTER (WHERE type = 'direto') AS total_pf,
  COUNT(*) FILTER (WHERE type = 'oficina') AS total_pj,
  COUNT(*) FILTER (WHERE active = true) AS total_active,
  COUNT(*) FILTER (WHERE active = false) AS total_inactive
FROM public.customers
GROUP BY org_id;

GRANT SELECT ON v_customers_stats TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.customers IS 'Cadastro de clientes (Pessoa Física e Jurídica)';
COMMENT ON COLUMN public.customers.type IS 'Tipo de cliente: direto (PF) ou oficina (PJ)';
COMMENT ON COLUMN public.customers.cpf IS 'CPF sem máscara, apenas 11 dígitos numéricos';
COMMENT ON COLUMN public.customers.cnpj IS 'CNPJ sem máscara, apenas 14 dígitos numéricos';
COMMENT ON CONSTRAINT unique_cpf_per_org ON public.customers IS 'Garante unicidade de CPF por organização';
COMMENT ON CONSTRAINT type_cpf_check ON public.customers IS 'Garante que PF tenha CPF e PJ tenha CNPJ';

-- =====================================================
-- DADOS DE EXEMPLO (SEED)
-- =====================================================

-- Ver arquivo: seed.sql

-- =====================================================
-- FIM DO SCHEMA
-- =====================================================
