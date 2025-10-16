-- ============================================================================
-- Migration: Add org_id to budget and diagnostic tables for proper multi-tenancy
-- ============================================================================
-- This migration adds org_id columns to tables that are missing it,
-- ensuring proper multi-tenant isolation and better performance.
--
-- Tables affected:
-- 1. detailed_budgets
-- 2. budget_approvals  
-- 3. diagnostic_checklist_responses
--
-- Author: System
-- Date: 2025-01-02
-- ============================================================================

-- ============================================================================
-- STEP 1: Add org_id columns
-- ============================================================================

-- 1.1 Add org_id to detailed_budgets
ALTER TABLE public.detailed_budgets 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- 1.2 Add org_id to budget_approvals
ALTER TABLE public.budget_approvals 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- 1.3 Add org_id to diagnostic_checklist_responses
ALTER TABLE public.diagnostic_checklist_responses 
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- ============================================================================
-- STEP 2: Populate org_id with existing data
-- ============================================================================

-- 2.1 Populate detailed_budgets.org_id from orders
UPDATE public.detailed_budgets db
SET org_id = o.org_id
FROM public.orders o
WHERE db.order_id = o.id
  AND db.org_id IS NULL;

-- 2.2 Populate budget_approvals.org_id from detailed_budgets → orders
UPDATE public.budget_approvals ba
SET org_id = o.org_id
FROM public.detailed_budgets db
INNER JOIN public.orders o ON o.id = db.order_id
WHERE ba.budget_id = db.id
  AND ba.org_id IS NULL;

-- 2.3 Populate diagnostic_checklist_responses.org_id from orders (FIX: tem order_id direto)
UPDATE public.diagnostic_checklist_responses dcr
SET org_id = o.org_id
FROM public.orders o
WHERE dcr.order_id = o.id
  AND dcr.org_id IS NULL;

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_detailed_budgets_org_id 
ON public.detailed_budgets(org_id);

CREATE INDEX IF NOT EXISTS idx_budget_approvals_org_id 
ON public.budget_approvals(org_id);

CREATE INDEX IF NOT EXISTS idx_diagnostic_checklist_responses_org_id 
ON public.diagnostic_checklist_responses(org_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_detailed_budgets_org_order 
ON public.detailed_budgets(org_id, order_id);

CREATE INDEX IF NOT EXISTS idx_budget_approvals_org_budget 
ON public.budget_approvals(org_id, budget_id);

-- ============================================================================
-- STEP 4: Update RLS Policies (simplified with direct org_id)
-- ============================================================================

-- 4.1 Drop old policies for detailed_budgets
DROP POLICY IF EXISTS "Users can view detailed budgets" ON public.detailed_budgets;
DROP POLICY IF EXISTS "Users can create detailed budgets" ON public.detailed_budgets;
DROP POLICY IF EXISTS "Users can update detailed budgets" ON public.detailed_budgets;
DROP POLICY IF EXISTS "Users can delete detailed budgets" ON public.detailed_budgets;

-- 4.2 Create simplified policies for detailed_budgets
CREATE POLICY "Users can view detailed budgets"
ON public.detailed_budgets
FOR SELECT
USING (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

CREATE POLICY "Users can create detailed budgets"
ON public.detailed_budgets
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

CREATE POLICY "Users can update detailed budgets"
ON public.detailed_budgets
FOR UPDATE
USING (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

CREATE POLICY "Users can delete detailed budgets"
ON public.detailed_budgets
FOR DELETE
USING (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- 4.3 Update policies for budget_approvals (already created, just update)
DROP POLICY IF EXISTS "Users can view budget approvals" ON public.budget_approvals;
DROP POLICY IF EXISTS "Users can create budget approvals" ON public.budget_approvals;

CREATE POLICY "Users can view budget approvals"
ON public.budget_approvals
FOR SELECT
USING (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

CREATE POLICY "Users can create budget approvals"
ON public.budget_approvals
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- 4.4 Update policies for diagnostic_checklist_responses
DROP POLICY IF EXISTS "Users can view diagnostic checklist responses" ON public.diagnostic_checklist_responses;
DROP POLICY IF EXISTS "Users can create diagnostic checklist responses" ON public.diagnostic_checklist_responses;
DROP POLICY IF EXISTS "Users can update diagnostic checklist responses" ON public.diagnostic_checklist_responses;

CREATE POLICY "Users can view diagnostic checklist responses"
ON public.diagnostic_checklist_responses
FOR SELECT
USING (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

CREATE POLICY "Users can create diagnostic checklist responses"
ON public.diagnostic_checklist_responses
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

CREATE POLICY "Users can update diagnostic checklist responses"
ON public.diagnostic_checklist_responses
FOR UPDATE
USING (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- ============================================================================
-- STEP 5: Create triggers to auto-populate org_id on INSERT
-- ============================================================================

-- 5.1 Trigger for detailed_budgets
CREATE OR REPLACE FUNCTION public.set_detailed_budgets_org_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se org_id não foi fornecido, buscar da ordem
  IF NEW.org_id IS NULL AND NEW.order_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM orders
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_detailed_budgets_org_id ON public.detailed_budgets;
CREATE TRIGGER trigger_set_detailed_budgets_org_id
  BEFORE INSERT OR UPDATE ON public.detailed_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_detailed_budgets_org_id();

-- 5.2 Trigger for budget_approvals
CREATE OR REPLACE FUNCTION public.set_budget_approvals_org_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se org_id não foi fornecido, buscar do budget
  IF NEW.org_id IS NULL AND NEW.budget_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM detailed_budgets
    WHERE id = NEW.budget_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_budget_approvals_org_id ON public.budget_approvals;
CREATE TRIGGER trigger_set_budget_approvals_org_id
  BEFORE INSERT OR UPDATE ON public.budget_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.set_budget_approvals_org_id();

-- 5.3 Trigger for diagnostic_checklist_responses
CREATE OR REPLACE FUNCTION public.set_diagnostic_response_org_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se org_id não foi fornecido, buscar da order (FIX: tem order_id direto)
  IF NEW.org_id IS NULL AND NEW.order_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id
    FROM orders
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_diagnostic_response_org_id ON public.diagnostic_checklist_responses;
CREATE TRIGGER trigger_set_diagnostic_response_org_id
  BEFORE INSERT OR UPDATE ON public.diagnostic_checklist_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_diagnostic_response_org_id();

-- ============================================================================
-- STEP 6: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.detailed_budgets.org_id IS 'Organization ID for multi-tenant isolation. Auto-populated from order.';
COMMENT ON COLUMN public.budget_approvals.org_id IS 'Organization ID for multi-tenant isolation. Auto-populated from budget.';
COMMENT ON COLUMN public.diagnostic_checklist_responses.org_id IS 'Organization ID for multi-tenant isolation. Auto-populated from workflow.';

COMMENT ON TRIGGER trigger_set_detailed_budgets_org_id ON public.detailed_budgets IS 'Auto-populates org_id from related order';
COMMENT ON TRIGGER trigger_set_budget_approvals_org_id ON public.budget_approvals IS 'Auto-populates org_id from related budget';
COMMENT ON TRIGGER trigger_set_diagnostic_response_org_id ON public.diagnostic_checklist_responses IS 'Auto-populates org_id from related workflow';

-- ============================================================================
-- STEP 7: Verify data integrity
-- ============================================================================

-- Log any records that still don't have org_id (should be none after migration)
DO $$
DECLARE
  v_missing_budgets INTEGER;
  v_missing_approvals INTEGER;
  v_missing_responses INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing_budgets FROM detailed_budgets WHERE org_id IS NULL;
  SELECT COUNT(*) INTO v_missing_approvals FROM budget_approvals WHERE org_id IS NULL;
  SELECT COUNT(*) INTO v_missing_responses FROM diagnostic_checklist_responses WHERE org_id IS NULL;
  
  IF v_missing_budgets > 0 THEN
    RAISE WARNING 'Found % detailed_budgets without org_id', v_missing_budgets;
  END IF;
  
  IF v_missing_approvals > 0 THEN
    RAISE WARNING 'Found % budget_approvals without org_id', v_missing_approvals;
  END IF;
  
  IF v_missing_responses > 0 THEN
    RAISE WARNING 'Found % diagnostic_checklist_responses without org_id', v_missing_responses;
  END IF;
  
  IF v_missing_budgets = 0 AND v_missing_approvals = 0 AND v_missing_responses = 0 THEN
    RAISE NOTICE '✅ All records have org_id populated successfully!';
  END IF;
END $$;

