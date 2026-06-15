-- =============================================================
-- BUNDLE SQL — Demo Favarini (2026-06-15)
-- =============================================================
-- Aplicar via Supabase Studio (SQL Editor) na ordem abaixo.
-- 100% idempotente: pode rodar 2x sem efeito colateral.
--
-- Cobre:
--   1. Transferência entre Contas (tabela, RPC, RLS)
--   2. Categoria contábil 'transfer' no enum expense_category
--   3. external_id (FITID OFX) em bank_statement_lines + dedup
--   4. Registro da rota /transferencias em system_pages
--   5. Sincronização de rotas financeiras com system_pages
-- =============================================================

-- =============================================================
-- PARTE 1 — Enum + tabela account_transfers + RLS + RPC
-- (arquivo: 20260615120000_account_transfers.sql)
-- =============================================================

DO $enum_transfer$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'expense_category' AND e.enumlabel = 'transfer'
  ) THEN
    ALTER TYPE public.expense_category ADD VALUE 'transfer';
  END IF;
END
$enum_transfer$;

CREATE TABLE IF NOT EXISTS public.account_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id),
  to_bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id),
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  transfer_date date NOT NULL,
  description text NOT NULL,
  notes text,
  cash_flow_out_id uuid REFERENCES public.cash_flow(id),
  cash_flow_in_id  uuid REFERENCES public.cash_flow(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_transfers_distinct_accounts CHECK (from_bank_account_id <> to_bank_account_id)
);

CREATE INDEX IF NOT EXISTS idx_account_transfers_org      ON public.account_transfers(org_id);
CREATE INDEX IF NOT EXISTS idx_account_transfers_from     ON public.account_transfers(from_bank_account_id);
CREATE INDEX IF NOT EXISTS idx_account_transfers_to       ON public.account_transfers(to_bank_account_id);
CREATE INDEX IF NOT EXISTS idx_account_transfers_date     ON public.account_transfers(transfer_date DESC);

COMMENT ON TABLE public.account_transfers IS
  'Transferências entre contas (banco/caixa) — uma linha por transferência, com referência às duas movimentações de cash_flow geradas.';

ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_all_account_transfers" ON public.account_transfers;
CREATE POLICY "org_member_all_account_transfers"
  ON public.account_transfers
  FOR ALL
  TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

CREATE OR REPLACE FUNCTION public.create_account_transfer(
  p_org_id uuid,
  p_from_bank_account_id uuid,
  p_to_bank_account_id uuid,
  p_amount numeric,
  p_transfer_date date,
  p_description text,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_org uuid;
  v_to_org   uuid;
  v_from_name text;
  v_to_name   text;
  v_cat_id    uuid;
  v_cf_out    uuid;
  v_cf_in     uuid;
  v_transfer  uuid;
  v_user      uuid := auth.uid();
  v_full_desc text;
BEGIN
  IF NOT (public.is_super_admin() OR public.is_org_member(p_org_id)) THEN
    RAISE EXCEPTION 'Sem permissão para criar transferência nesta organização';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Valor da transferência deve ser maior que zero';
  END IF;

  IF p_from_bank_account_id = p_to_bank_account_id THEN
    RAISE EXCEPTION 'Conta de origem e destino devem ser diferentes';
  END IF;

  IF p_transfer_date IS NULL THEN
    RAISE EXCEPTION 'Data da transferência é obrigatória';
  END IF;

  IF coalesce(trim(p_description), '') = '' THEN
    RAISE EXCEPTION 'Descrição é obrigatória';
  END IF;

  SELECT org_id, name INTO v_from_org, v_from_name
  FROM public.bank_accounts WHERE id = p_from_bank_account_id;
  IF v_from_org IS NULL THEN
    RAISE EXCEPTION 'Conta de origem não encontrada';
  END IF;
  IF v_from_org <> p_org_id THEN
    RAISE EXCEPTION 'Conta de origem não pertence à organização informada';
  END IF;

  SELECT org_id, name INTO v_to_org, v_to_name
  FROM public.bank_accounts WHERE id = p_to_bank_account_id;
  IF v_to_org IS NULL THEN
    RAISE EXCEPTION 'Conta de destino não encontrada';
  END IF;
  IF v_to_org <> p_org_id THEN
    RAISE EXCEPTION 'Conta de destino não pertence à organização informada';
  END IF;

  SELECT id INTO v_cat_id
  FROM public.expense_categories
  WHERE org_id = p_org_id AND name = 'Transferência'
  LIMIT 1;

  IF v_cat_id IS NULL THEN
    INSERT INTO public.expense_categories (org_id, name, category, description, is_active)
    VALUES (p_org_id, 'Transferência', 'transfer'::public.expense_category,
            'Transferências internas entre contas (banco/caixa)', true)
    RETURNING id INTO v_cat_id;
  END IF;

  v_full_desc := 'Transferência: ' || coalesce(v_from_name, '?') || ' → ' || coalesce(v_to_name, '?')
                 || ' — ' || p_description;

  INSERT INTO public.cash_flow (
    org_id, transaction_type, amount, description, transaction_date,
    payment_method, bank_account_id, category_id, notes, reconciled, is_intercompany
  ) VALUES (
    p_org_id, 'expense', p_amount, v_full_desc, p_transfer_date,
    'bank_transfer', p_from_bank_account_id, v_cat_id, p_notes, false, false
  ) RETURNING id INTO v_cf_out;

  INSERT INTO public.cash_flow (
    org_id, transaction_type, amount, description, transaction_date,
    payment_method, bank_account_id, category_id, notes, reconciled, is_intercompany
  ) VALUES (
    p_org_id, 'income', p_amount, v_full_desc, p_transfer_date,
    'bank_transfer', p_to_bank_account_id, v_cat_id, p_notes, false, false
  ) RETURNING id INTO v_cf_in;

  INSERT INTO public.account_transfers (
    org_id, from_bank_account_id, to_bank_account_id, amount, transfer_date,
    description, notes, cash_flow_out_id, cash_flow_in_id, created_by
  ) VALUES (
    p_org_id, p_from_bank_account_id, p_to_bank_account_id, p_amount, p_transfer_date,
    p_description, p_notes, v_cf_out, v_cf_in, v_user
  ) RETURNING id INTO v_transfer;

  RETURN v_transfer;
END;
$$;

REVOKE ALL ON FUNCTION public.create_account_transfer(uuid, uuid, uuid, numeric, date, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_account_transfer(uuid, uuid, uuid, numeric, date, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_account_transfer(uuid, uuid, uuid, numeric, date, text, text) IS
  'Cria transferência entre contas: insere duas linhas em cash_flow (expense na origem, income no destino) com categoria Transferência e registra cabeçalho em account_transfers. Atômica.';

-- =============================================================
-- PARTE 2 — Gap fixes (system_pages, OFX FITID)
-- (arquivo: 20260615130000_demo_gap_fixes.sql)
-- =============================================================

INSERT INTO public.system_pages (name, display_name, description, route_path, module, icon, is_active)
VALUES (
  'transferencias',
  'Transferência entre contas',
  'Transferência entre contas correntes, aplicações e caixas (banco/caixa)',
  '/transferencias',
  'financial',
  'ArrowRightLeft',
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  route_path = EXCLUDED.route_path,
  module = EXCLUDED.module,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  updated_at = now();

ALTER TABLE public.bank_statement_lines
  ADD COLUMN IF NOT EXISTS external_id text;

COMMENT ON COLUMN public.bank_statement_lines.external_id IS
  'Identificador único da transação no banco (FITID do OFX). Usado para evitar duplicação em reimports.';

CREATE INDEX IF NOT EXISTS idx_bsl_external_id
  ON public.bank_statement_lines(external_id)
  WHERE external_id IS NOT NULL;

DO $bsl_unique$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uq_bsl_account_external_id'
  ) THEN
    CREATE UNIQUE INDEX uq_bsl_account_external_id
      ON public.bank_statement_lines(import_id, external_id)
      WHERE external_id IS NOT NULL;
  END IF;
END
$bsl_unique$;

INSERT INTO public.system_pages (name, display_name, description, route_path, module, icon, is_active)
VALUES
  ('financial-home',           'Dashboard Financeiro',  'Painel financeiro consolidado',                       '/financeiro',              'financial', 'TrendingUp',         true),
  ('contas-receber',           'Contas a Receber',      'Gestão de contas a receber',                          '/contas-receber',          'financial', 'Banknote',           true),
  ('contas-pagar',             'Contas a Pagar',        'Gestão de contas a pagar',                            '/contas-pagar',            'financial', 'CreditCard',         true),
  ('ap-recorrentes',           'AP Recorrentes',        'Despesas recorrentes',                                '/ap-recorrentes',          'financial', 'Repeat',             true),
  ('inadimplencia-aging',      'Vencimentos a receber', 'Aging de inadimplência',                              '/inadimplencia-aging',     'financial', 'AlertTriangle',      true),
  ('fluxo-caixa',              'Fluxo de Caixa',        'Lançamentos de entrada e saída',                      '/fluxo-caixa',             'financial', 'PiggyBank',          true),
  ('dre',                      'DRE Mensal',            'Demonstrativo de resultados',                         '/dre',                     'financial', 'Calculator',         true),
  ('fechamento-caixa',         'Fechamento de caixa',   'Conferência de caixa por usuário',                    '/fechamento-caixa',        'financial', 'Wallet',             true),
  ('conciliacao-bancaria',     'Conciliação bancária',  'Conciliação com extratos OFX/CSV',                    '/conciliacao-bancaria',    'financial', 'Landmark',           true),
  ('fluxo-projetado',          'Fluxo projetado',       'Projeção de fluxo com cenários',                      '/fluxo-projetado',         'financial', 'LineChart',          true),
  ('config-financeiro',        'Config. financeiro',    'Categorias, contas, métodos de pagamento',            '/config-financeiro',       'financial', 'SlidersHorizontal',  true),
  ('relatorios-financeiros',   'Relatórios financeiros','Relatórios e exports financeiros',                    '/relatorios-financeiros',  'financial', 'BarChart3',          true),
  ('aprovacao-contas-pagar',   'Aprovação AP',          'Aprovação de contas a pagar',                         '/aprovacao-contas-pagar',  'financial', 'ClipboardCheck',     true),
  ('retiradas-socios',         'Retiradas sócios',      'Lançamentos de retiradas dos sócios',                 '/retiradas-socios',        'financial', 'Wallet',             true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  route_path = EXCLUDED.route_path,
  module = EXCLUDED.module,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- =============================================================
-- SMOKE TEST (opcional)
-- =============================================================
-- Substitua os UUIDs pelos seus para validar antes da demo:
--
-- SELECT public.create_account_transfer(
--   '00000000-0000-0000-0000-000000000000'::uuid,  -- p_org_id
--   '00000000-0000-0000-0000-000000000000'::uuid,  -- from_bank_account_id (caixa)
--   '00000000-0000-0000-0000-000000000000'::uuid,  -- to_bank_account_id (banco)
--   5000.00,
--   CURRENT_DATE,
--   'Sangria do dia',
--   'Demo Favarini'
-- );
--
-- Deve retornar UUID da transferência. Em seguida confira:
--   SELECT * FROM public.account_transfers ORDER BY created_at DESC LIMIT 1;
--   SELECT * FROM public.cash_flow WHERE description ILIKE 'Transferência:%' ORDER BY created_at DESC LIMIT 2;
