-- US-PUR-041: Histórico de Negociações de Preço

CREATE TABLE IF NOT EXISTS negotiation_rounds (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id           UUID REFERENCES purchase_quotations(id) ON DELETE CASCADE,
  supplier_id            UUID REFERENCES suppliers(id) NOT NULL,
  round_number           INTEGER NOT NULL DEFAULT 1,

  initial_total          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  final_total            NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_percentage    NUMERIC(6, 2) GENERATED ALWAYS AS (
    CASE WHEN initial_total > 0
      THEN ROUND(((initial_total - final_total) / initial_total) * 100, 2)
      ELSE 0
    END
  ) STORED,
  total_savings          NUMERIC(12, 2) GENERATED ALWAYS AS (initial_total - final_total) STORED,

  negotiation_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  arguments_used         TEXT,
  supplier_justification TEXT,
  notes                  TEXT,

  negotiated_by          UUID REFERENCES auth.users(id),
  org_id                 UUID REFERENCES organizations(id) NOT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE negotiation_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_negotiation_rounds" ON negotiation_rounds
  USING (org_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_negotiation_rounds_quotation  ON negotiation_rounds (quotation_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_rounds_supplier   ON negotiation_rounds (supplier_id);
CREATE INDEX IF NOT EXISTS idx_negotiation_rounds_org        ON negotiation_rounds (org_id);
