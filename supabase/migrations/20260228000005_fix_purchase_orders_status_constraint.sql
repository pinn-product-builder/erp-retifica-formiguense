-- =====================================================
-- FIX: Adicionar 'partially_received' e 'completed' ao CHECK constraint
--      da tabela purchase_orders
--
-- O trigger update_purchase_order_on_receipt tentava setar esses status
-- mas eles não estavam na lista do CHECK constraint, causando falha
-- silenciosa (transação revertida) ao registrar recebimento parcial.
-- =====================================================

ALTER TABLE public.purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE public.purchase_orders
  ADD CONSTRAINT purchase_orders_status_check CHECK (
    status = ANY (ARRAY[
      'draft'::text,
      'pending_approval'::text,
      'approved'::text,
      'sent'::text,
      'confirmed'::text,
      'in_transit'::text,
      'partially_received'::text,
      'delivered'::text,
      'completed'::text,
      'cancelled'::text
    ])
  );
