-- Segurança: RLS em tabelas sem política / sem RLS, views (security invoker + sem auth.users),
-- e search_path fixo em funções public (linter Supabase).
--
-- Fora do escopo desta migration (revisar caso a caso): rls_policy_always_true, auth OTP,
-- leaked password protection, upgrade de Postgres (dashboard).

-- =============================================================================
-- 1) View v_active_reservations: remover join em auth.users; usar user_basic_info;
--    security_invoker para respeitar RLS das tabelas base.
-- =============================================================================
CREATE OR REPLACE VIEW public.v_active_reservations
WITH (security_invoker = true) AS
SELECT
  pr.id,
  pr.org_id,
  pr.order_id,
  o.order_number,
  pr.budget_id,
  pr.part_code,
  pr.part_name,
  pr.quantity_reserved,
  COALESCE(pr.quantity_separated, 0) AS quantity_separated,
  COALESCE(pr.quantity_applied, 0) AS quantity_applied,
  pr.quantity_reserved - COALESCE(pr.quantity_applied, 0) AS quantity_available,
  pr.unit_cost,
  pr.total_reserved_cost,
  pr.reservation_status,
  pr.reserved_at,
  pr.expires_at,
  CASE
    WHEN pr.expires_at < NOW() THEN true
    ELSE false
  END AS is_expired,
  EXTRACT(DAY FROM (pr.expires_at - NOW())) AS days_until_expiration,
  CAST(ubi.email AS character varying(255)) AS reserved_by_email,
  pr.notes
FROM public.parts_reservations pr
LEFT JOIN public.orders o ON o.id = pr.order_id
LEFT JOIN public.user_basic_info ubi ON ubi.user_id = pr.reserved_by
WHERE pr.reservation_status IN ('reserved', 'partial', 'separated')
ORDER BY pr.expires_at ASC;

COMMENT ON VIEW public.v_active_reservations IS
  'Relatório de reservas ativas; email do usuário via user_basic_info (sem auth.users).';

-- =============================================================================
-- 2) Demais views: executar com privilégios do usuário chamador (PG15+)
-- =============================================================================
DO $$
DECLARE
  v_name text;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'supplier_purchase_volume',
    'inventory_movements_with_users',
    'quotation_savings_by_item',
    'v_workflows_with_pending_checklists',
    'valid_supplier_prices',
    'purchase_orders_monthly',
    'purchase_proposal_comparison',
    'pending_purchase_approvals',
    'purchase_quotation_details'
  ]
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER VIEW public.%I SET (security_invoker = true)',
        v_name
      );
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'View public.% ausente; ignorando.', v_name;
    END;
  END LOOP;
END $$;

-- =============================================================================
-- 3) budget_alerts: políticas por organização do orçamento (detailed_budgets)
-- =============================================================================
DROP POLICY IF EXISTS "Org members manage budget_alerts for their org budgets" ON public.budget_alerts;

CREATE POLICY "Org members manage budget_alerts for their org budgets"
ON public.budget_alerts
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.detailed_budgets db
    WHERE db.id = budget_alerts.budget_id
      AND public.is_org_member(db.org_id)
  )
)
WITH CHECK (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1
    FROM public.detailed_budgets db
    WHERE db.id = budget_alerts.budget_id
      AND public.is_org_member(db.org_id)
  )
);

-- =============================================================================
-- 4) purchase_efficiency_reports
-- =============================================================================
DROP POLICY IF EXISTS "Org members manage purchase_efficiency_reports" ON public.purchase_efficiency_reports;

CREATE POLICY "Org members manage purchase_efficiency_reports"
ON public.purchase_efficiency_reports
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR public.is_org_member(org_id)
)
WITH CHECK (
  public.is_super_admin()
  OR public.is_org_member(org_id)
);

-- =============================================================================
-- 5) Tabelas públicas sem RLS (advisor): habilitar + política por org_id
-- =============================================================================
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_additional_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_return_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "warranty_claims_org_access" ON public.warranty_claims;
CREATE POLICY "warranty_claims_org_access"
ON public.warranty_claims FOR ALL TO authenticated
USING (public.is_super_admin() OR public.is_org_member(org_id))
WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS "warranty_indicators_org_access" ON public.warranty_indicators;
CREATE POLICY "warranty_indicators_org_access"
ON public.warranty_indicators FOR ALL TO authenticated
USING (public.is_super_admin() OR public.is_org_member(org_id))
WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS "diagnostic_additional_parts_org_access" ON public.diagnostic_additional_parts;
CREATE POLICY "diagnostic_additional_parts_org_access"
ON public.diagnostic_additional_parts FOR ALL TO authenticated
USING (public.is_super_admin() OR public.is_org_member(org_id))
WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS "diagnostic_additional_services_org_access" ON public.diagnostic_additional_services;
CREATE POLICY "diagnostic_additional_services_org_access"
ON public.diagnostic_additional_services FOR ALL TO authenticated
USING (public.is_super_admin() OR public.is_org_member(org_id))
WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

DROP POLICY IF EXISTS "org_return_counters_org_access" ON public.org_return_counters;
CREATE POLICY "org_return_counters_org_access"
ON public.org_return_counters FOR ALL TO authenticated
USING (public.is_super_admin() OR public.is_org_member(org_id))
WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- =============================================================================
-- 6) Revogar acesso anônimo em tabelas sensíveis (se existir grant herdado)
-- =============================================================================
REVOKE ALL ON public.budget_alerts FROM anon;
REVOKE ALL ON public.purchase_efficiency_reports FROM anon;
REVOKE ALL ON public.warranty_claims FROM anon;
REVOKE ALL ON public.warranty_indicators FROM anon;
REVOKE ALL ON public.diagnostic_additional_parts FROM anon;
REVOKE ALL ON public.diagnostic_additional_services FROM anon;
REVOKE ALL ON public.org_return_counters FROM anon;

-- =============================================================================
-- 7) Funções em public: fixar search_path (mitiga function_search_path_mutable)
-- =============================================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) AS c(cfg)
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        r.schema_name,
        r.func_name,
        r.args
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'ALTER FUNCTION %.%(%): %', r.schema_name, r.func_name, r.args, SQLERRM;
    END;
  END LOOP;
END $$;
