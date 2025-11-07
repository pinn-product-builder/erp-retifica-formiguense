-- Migration: Fix completed_orders KPI to include 'entregue' status
-- Description: Atualiza a função calculate_kpi_value e os registros de KPIs para incluir ordens com status 'entregue' nos cálculos de pedidos concluídos

-- Corrigir função calculate_kpi_value para incluir 'entregue' em completed_orders
CREATE OR REPLACE FUNCTION public.calculate_kpi_value(
  kpi_code TEXT,
  organization_id UUID,
  timeframe TEXT DEFAULT 'current'
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result NUMERIC := 0;
  start_date TIMESTAMP WITH TIME ZONE;
  end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determinar período baseado no timeframe
  CASE timeframe
    WHEN 'current' THEN
      start_date := NOW() - INTERVAL '30 days';
      end_date := NOW();
    WHEN 'previous' THEN
      -- Para comparação, buscar 30 dias anteriores
      start_date := NOW() - INTERVAL '60 days';
      end_date := NOW() - INTERVAL '30 days';
    ELSE
      start_date := NOW() - INTERVAL '30 days';
      end_date := NOW();
  END CASE;

  -- Calcular KPI baseado no código
  CASE kpi_code
    WHEN 'total_orders' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'orders_in_progress' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status IN ('ativa', 'em_andamento')
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'completed_orders' THEN
      -- CORRIGIDO: Incluir tanto 'concluida' quanto 'entregue' como ordens concluídas
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status IN ('concluida', 'entregue')
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'pending_budget_approvals' THEN
      SELECT COUNT(*) INTO result
      FROM detailed_budgets
      WHERE org_id = organization_id
      AND status IN ('draft', 'pendente')
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'revenue_current_month' THEN
      SELECT COALESCE(SUM(total_amount), 0) INTO result
      FROM detailed_budgets
      WHERE org_id = organization_id
      AND status = 'approved'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'average_order_value' THEN
      SELECT COALESCE(AVG(total_amount), 0) INTO result
      FROM detailed_budgets
      WHERE org_id = organization_id
      AND status = 'approved'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'customer_satisfaction' THEN
      -- Placeholder para métrica futura
      SELECT 85.0 INTO result;
    
    WHEN 'orders_today' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND created_at >= DATE_TRUNC('day', NOW());
    
    WHEN 'pending_orders' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status = 'pendente';
    
    WHEN 'completed_today' THEN
      -- CORRIGIDO: Incluir tanto 'concluida' quanto 'entregue' como ordens concluídas hoje
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status IN ('concluida', 'entregue')
      AND actual_delivery >= DATE_TRUNC('day', NOW());
    
    ELSE
      result := 0;
  END CASE;

  RETURN result;
END;
$$;

-- Atualizar registros de KPIs para refletir a mudança
UPDATE public.kpis
SET 
  calculation_formula = 'COUNT(orders WHERE status IN (''concluida'', ''entregue''))',
  description = 'Pedidos finalizados no período (inclui concluídos e entregues)',
  updated_at = NOW()
WHERE code = 'completed_orders'
AND (calculation_formula LIKE '%status = ''concluida''%' OR calculation_formula LIKE '%status=''concluida''%');

-- Atualizar descrição no hook useDashboard também (via comentário)
COMMENT ON FUNCTION public.calculate_kpi_value IS 
'Calcula valores de KPIs para uma organização. ATUALIZADO: completed_orders agora inclui status ''concluida'' e ''entregue''.';

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.kpis.calculation_formula IS 
'Fórmula de cálculo do KPI. Para completed_orders, deve incluir status IN (''concluida'', ''entregue'').';

