ALTER TABLE supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_return_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS supplier_returns_return_number_org_key
  ON supplier_returns (org_id, return_number);
