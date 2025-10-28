-- =====================================================
-- MÓDULO: Financeiro - Contas a Pagar
-- VIEWS PARA CONSULTAS OTIMIZADAS
-- =====================================================

-- =====================================================
-- VIEW: Contas a Pagar com Detalhes Completos
-- =====================================================
CREATE OR REPLACE VIEW public.v_payable_accounts_details AS
SELECT 
  pa.id,
  pa.org_id,
  pa.amount,
  pa.due_date,
  pa.description,
  pa.notes,
  pa.invoice_number,
  pa.invoice_file_url,
  pa.status,
  pa.paid_at,
  pa.paid_amount,
  pa.payment_method,
  pa.created_at,
  pa.updated_at,
  
  -- Fornecedor
  s.id as supplier_id,
  s.name as supplier_name,
  s.cnpj_cpf as supplier_document,
  s.phone as supplier_phone,
  
  -- Categoria
  ec.id as category_id,
  ec.name as category_name,
  ec.color as category_color,
  
  -- Ordem de Serviço (se vinculada)
  o.id as order_id,
  o.order_number,
  
  -- Auditoria
  creator.email as created_by_email,
  creator_profile.name as created_by_name,
  payer.email as paid_by_email,
  payer_profile.name as paid_by_name,
  
  -- Cálculos
  CASE 
    WHEN pa.status = 'pending' AND pa.due_date < CURRENT_DATE THEN 'overdue'
    ELSE pa.status
  END as computed_status,
  
  CURRENT_DATE - pa.due_date as days_overdue,
  
  pa.due_date - CURRENT_DATE as days_until_due,
  
  CASE 
    WHEN pa.paid_amount IS NOT NULL THEN pa.amount - pa.paid_amount
    ELSE 0
  END as difference_amount

FROM public.payable_accounts pa
INNER JOIN public.suppliers s ON s.id = pa.supplier_id
INNER JOIN public.expense_categories ec ON ec.id = pa.category_id
LEFT JOIN public.orders o ON o.id = pa.order_id
LEFT JOIN auth.users creator ON creator.id = pa.created_by
LEFT JOIN public.profiles creator_profile ON creator_profile.user_id = pa.created_by
LEFT JOIN auth.users payer ON payer.id = pa.paid_by
LEFT JOIN public.profiles payer_profile ON payer_profile.user_id = pa.paid_by;

COMMENT ON VIEW public.v_payable_accounts_details IS 
'View completa de contas a pagar com todos os relacionamentos e cálculos.';

GRANT SELECT ON public.v_payable_accounts_details TO authenticated;

-- =====================================================
-- VIEW: Dashboard de Contas a Pagar
-- =====================================================
CREATE OR REPLACE VIEW public.v_payables_dashboard AS
SELECT 
  org_id,
  
  -- Totais gerais
  COUNT(*) as total_accounts,
  SUM(amount) as total_amount,
  
  -- Por status
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) as pending_amount,
  
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
  COALESCE(SUM(CASE WHEN status = 'paid' THEN paid_amount END), 0) as paid_amount,
  
  COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
  COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0) as overdue_amount,
  
  -- Vencimentos próximos (7 dias)
  COUNT(CASE 
    WHEN status = 'pending' 
    AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    THEN 1 
  END) as due_soon_count,
  COALESCE(SUM(CASE 
    WHEN status = 'pending' 
    AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    THEN amount 
  END), 0) as due_soon_amount,
  
  -- Médias
  AVG(amount) as average_amount,
  AVG(CASE WHEN status = 'paid' THEN paid_amount END) as average_paid,
  
  -- Maior e menor
  MAX(amount) as max_amount,
  MIN(amount) as min_amount

FROM public.payable_accounts
GROUP BY org_id;

COMMENT ON VIEW public.v_payables_dashboard IS 
'Agregação para dashboard de contas a pagar com KPIs principais.';

GRANT SELECT ON public.v_payables_dashboard TO authenticated;

-- =====================================================
-- VIEW: Contas Vencidas Detalhadas
-- =====================================================
CREATE OR REPLACE VIEW public.v_overdue_payables AS
SELECT 
  pa.*,
  s.name as supplier_name,
  s.phone as supplier_phone,
  s.email as supplier_email,
  ec.name as category_name,
  CURRENT_DATE - pa.due_date as days_overdue,
  pa.amount * (CURRENT_DATE - pa.due_date) * 0.001 as estimated_penalty

FROM public.payable_accounts pa
INNER JOIN public.suppliers s ON s.id = pa.supplier_id
INNER JOIN public.expense_categories ec ON ec.id = pa.category_id
WHERE pa.status IN ('pending', 'overdue')
  AND pa.due_date < CURRENT_DATE
ORDER BY pa.due_date ASC;

COMMENT ON VIEW public.v_overdue_payables IS 
'Contas vencidas ordenadas por data com cálculo de multa estimada.';

GRANT SELECT ON public.v_overdue_payables TO authenticated;

-- =====================================================
-- VIEW: Fluxo de Caixa Projetado
-- =====================================================
CREATE OR REPLACE VIEW public.v_cashflow_projection AS
SELECT 
  org_id,
  due_date,
  SUM(amount) as expected_expense,
  COUNT(*) as account_count,
  array_agg(DISTINCT category_id) as categories
FROM public.payable_accounts
WHERE status IN ('pending', 'overdue')
  AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
GROUP BY org_id, due_date
ORDER BY due_date ASC;

COMMENT ON VIEW public.v_cashflow_projection IS 
'Projeção de despesas para os próximos 90 dias.';

GRANT SELECT ON public.v_cashflow_projection TO authenticated;

-- =====================================================
-- VIEW: Ranking de Fornecedores por Valor
-- =====================================================
CREATE OR REPLACE VIEW public.v_suppliers_ranking AS
SELECT 
  pa.org_id,
  s.id as supplier_id,
  s.name as supplier_name,
  COUNT(pa.id) as total_accounts,
  SUM(pa.amount) as total_amount,
  SUM(CASE WHEN pa.status = 'paid' THEN pa.paid_amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN pa.status IN ('pending', 'overdue') THEN pa.amount ELSE 0 END) as pending_amount,
  AVG(pa.amount) as average_amount,
  MAX(pa.due_date) as last_due_date

FROM public.payable_accounts pa
INNER JOIN public.suppliers s ON s.id = pa.supplier_id
GROUP BY pa.org_id, s.id, s.name
ORDER BY total_amount DESC;

COMMENT ON VIEW public.v_suppliers_ranking IS 
'Ranking de fornecedores por valor total de contas.';

GRANT SELECT ON public.v_suppliers_ranking TO authenticated;

-- =====================================================
-- VIEW: Análise por Categoria
-- =====================================================
CREATE OR REPLACE VIEW public.v_expenses_by_category AS
SELECT 
  pa.org_id,
  ec.id as category_id,
  ec.name as category_name,
  ec.color as category_color,
  COUNT(pa.id) as account_count,
  SUM(pa.amount) as total_amount,
  SUM(CASE WHEN pa.status = 'paid' THEN pa.paid_amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN pa.status IN ('pending', 'overdue') THEN pa.amount ELSE 0 END) as pending_amount,
  ROUND(
    (SUM(pa.amount) * 100.0) / NULLIF(SUM(SUM(pa.amount)) OVER (PARTITION BY pa.org_id), 0),
    2
  ) as percentage_of_total

FROM public.payable_accounts pa
INNER JOIN public.expense_categories ec ON ec.id = pa.category_id
GROUP BY pa.org_id, ec.id, ec.name, ec.color
ORDER BY total_amount DESC;

COMMENT ON VIEW public.v_expenses_by_category IS 
'Análise de despesas agrupadas por categoria com percentuais.';

GRANT SELECT ON public.v_expenses_by_category TO authenticated;
