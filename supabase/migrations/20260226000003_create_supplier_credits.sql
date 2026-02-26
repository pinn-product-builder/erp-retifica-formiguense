-- US-PUR-038: Créditos de Devolução de Fornecedor

CREATE TABLE IF NOT EXISTS supplier_credits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id      UUID REFERENCES suppliers(id) NOT NULL,

  origin_type      TEXT NOT NULL CHECK (origin_type IN ('return', 'bonus', 'discount', 'other')),
  origin_id        UUID,
  description      TEXT,

  original_amount  NUMERIC(12, 2) NOT NULL CHECK (original_amount > 0),
  used_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,

  status           TEXT NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available', 'partially_used', 'used', 'expired')),
  expires_at       DATE,

  org_id           UUID REFERENCES organizations(id) NOT NULL,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_credit_usage (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id    UUID REFERENCES supplier_credits(id) NOT NULL,
  payable_id   UUID REFERENCES accounts_payable(id),
  description  TEXT,

  amount_used  NUMERIC(12, 2) NOT NULL CHECK (amount_used > 0),

  used_by      UUID REFERENCES auth.users(id),
  used_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE supplier_credits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_credit_usage  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_supplier_credits" ON supplier_credits
  USING (org_id IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_isolation_supplier_credit_usage" ON supplier_credit_usage
  USING (credit_id IN (
    SELECT id FROM supplier_credits
    WHERE org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    )
  ));

-- Índices
CREATE INDEX IF NOT EXISTS idx_supplier_credits_supplier  ON supplier_credits (supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_credits_org       ON supplier_credits (org_id);
CREATE INDEX IF NOT EXISTS idx_supplier_credits_status    ON supplier_credits (status);
CREATE INDEX IF NOT EXISTS idx_supplier_credit_usage_credit ON supplier_credit_usage (credit_id);
