-- Fix ambiguous org_id in budget_approvals RLS policies
-- This fixes the "column reference \"org_id\" is ambiguous" error in RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view budget approvals" ON public.budget_approvals;
DROP POLICY IF EXISTS "Users can create budget approvals" ON public.budget_approvals;

-- Recreate with explicit table qualifications to avoid ambiguity
CREATE POLICY "Users can view budget approvals"
ON public.budget_approvals
FOR SELECT
USING (
  budget_id IN (
    SELECT db.id
    FROM detailed_budgets db
    INNER JOIN orders o ON o.id = db.order_id
    WHERE o.org_id IN (
      SELECT ou.organization_id
      FROM organization_users ou
      WHERE ou.user_id = auth.uid()
        AND ou.is_active = true
    )
  )
);

CREATE POLICY "Users can create budget approvals"
ON public.budget_approvals
FOR INSERT
WITH CHECK (
  budget_id IN (
    SELECT db.id
    FROM detailed_budgets db
    INNER JOIN orders o ON o.id = db.order_id
    WHERE o.org_id IN (
      SELECT ou.organization_id
      FROM organization_users ou
      WHERE ou.user_id = auth.uid()
        AND ou.is_active = true
    )
  )
);

COMMENT ON POLICY "Users can view budget approvals" ON public.budget_approvals IS 'Permite visualizar aprovações de orçamentos da organização. FIX: Qualificação explícita de tabelas para evitar ambiguidade de org_id.';
COMMENT ON POLICY "Users can create budget approvals" ON public.budget_approvals IS 'Permite criar aprovações de orçamentos da organização. FIX: Qualificação explícita de tabelas para evitar ambiguidade de org_id.';

