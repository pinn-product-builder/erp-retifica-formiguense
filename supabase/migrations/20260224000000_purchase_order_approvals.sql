ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_status_check CHECK (
    status = ANY (ARRAY[
      'draft'::text, 'pending'::text, 'pending_approval'::text,
      'approved'::text, 'rejected'::text, 'sent'::text,
      'confirmed'::text, 'in_transit'::text, 'delivered'::text, 'cancelled'::text
    ])
  );

CREATE TABLE IF NOT EXISTS purchase_order_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

  action TEXT NOT NULL CHECK (action IN ('enviado', 'aprovado', 'rejeitado', 'escalado')),

  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now(),

  required_level TEXT NOT NULL,
  notes TEXT,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_approvals_order ON purchase_order_approvals(order_id);

ALTER TABLE purchase_order_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals from their organization"
  ON purchase_order_approvals FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM purchase_orders
      WHERE org_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert approvals in their organization"
  ON purchase_order_approvals FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM purchase_orders
      WHERE org_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE OR REPLACE VIEW pending_purchase_approvals AS
SELECT
  po.id,
  po.po_number,
  po.org_id,
  po.supplier_id,
  po.status,
  po.order_date,
  po.expected_delivery,
  po.total_value,
  po.created_by,
  po.created_at,
  s.name AS supplier_name,
  CASE
    WHEN COALESCE(po.total_value, 0) < 1000 THEN 'auto'
    WHEN COALESCE(po.total_value, 0) < 5000 THEN 'gerente'
    ELSE 'admin'
  END AS required_level
FROM purchase_orders po
JOIN suppliers s ON s.id = po.supplier_id
WHERE po.status = 'pending_approval'
  AND po.org_id IS NOT NULL;
