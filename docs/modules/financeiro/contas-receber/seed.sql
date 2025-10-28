-- =====================================================
-- MÓDULO: Financeiro - Contas a Receber
-- DADOS DE SEED PARA DESENVOLVIMENTO
-- =====================================================

-- NOTA: Este arquivo contém dados de exemplo para desenvolvimento
-- NÃO executar em produção

-- =====================================================
-- Exemplo de Contas a Receber
-- =====================================================

-- Substitua os UUIDs pelos da sua organização de teste

-- Conta Pendente (vencimento futuro)
INSERT INTO public.accounts_receivable (
  org_id,
  customer_id,
  order_id,
  amount,
  due_date,
  installment_number,
  total_installments,
  invoice_number,
  status,
  notes
) VALUES (
  'org-uuid-here',
  'customer-uuid-here',
  'order-uuid-here',
  1500.00,
  CURRENT_DATE + INTERVAL '15 days',
  1,
  3,
  'NF-001234',
  'pending',
  'Primeira parcela de serviço de retífica'
) ON CONFLICT DO NOTHING;

-- Conta Vencida
INSERT INTO public.accounts_receivable (
  org_id,
  customer_id,
  order_id,
  amount,
  due_date,
  installment_number,
  total_installments,
  status,
  notes
) VALUES (
  'org-uuid-here',
  'customer-uuid-here',
  'order-uuid-here',
  3000.00,
  CURRENT_DATE - INTERVAL '10 days',
  2,
  2,
  'overdue',
  'Segunda parcela - cliente não pagou na data'
) ON CONFLICT DO NOTHING;

-- Conta Paga
INSERT INTO public.accounts_receivable (
  org_id,
  customer_id,
  order_id,
  amount,
  due_date,
  payment_date,
  installment_number,
  total_installments,
  payment_method,
  late_fee,
  discount,
  status
) VALUES (
  'org-uuid-here',
  'customer-uuid-here',
  'order-uuid-here',
  2500.00,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '28 days',
  1,
  1,
  'pix',
  0.00,
  100.00,
  'paid'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- Histórico de Recebimentos
-- =====================================================

INSERT INTO public.receipt_history (
  receivable_account_id,
  amount_received,
  received_at,
  payment_method,
  late_fee_charged,
  discount_applied,
  notes
) VALUES (
  (SELECT id FROM accounts_receivable WHERE invoice_number = 'NF-PAID-001' LIMIT 1),
  2400.00,
  CURRENT_DATE - INTERVAL '28 days',
  'pix',
  0.00,
  100.00,
  'Pagamento com desconto de pontualidade'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- Limites de Crédito
-- =====================================================

INSERT INTO public.customer_credit_limits (
  org_id,
  customer_id,
  credit_limit,
  current_balance,
  is_blocked
) VALUES (
  'org-uuid-here',
  'customer-uuid-here',
  10000.00,
  4500.00,
  FALSE
) ON CONFLICT (org_id, customer_id) DO UPDATE
SET credit_limit = EXCLUDED.credit_limit;

-- Cliente Bloqueado por Inadimplência
INSERT INTO public.customer_credit_limits (
  org_id,
  customer_id,
  credit_limit,
  current_balance,
  is_blocked,
  blocked_reason,
  blocked_at
) VALUES (
  'org-uuid-here',
  'customer-uuid-here',
  5000.00,
  8200.00,
  TRUE,
  'Cliente com contas vencidas há mais de 30 dias',
  NOW()
) ON CONFLICT (org_id, customer_id) DO UPDATE
SET 
  is_blocked = EXCLUDED.is_blocked,
  blocked_reason = EXCLUDED.blocked_reason,
  blocked_at = EXCLUDED.blocked_at;
