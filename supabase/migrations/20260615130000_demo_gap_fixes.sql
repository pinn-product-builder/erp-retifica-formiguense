-- ============================================================
-- Gap-fix para demo (Favarini): Transferências + OFX
-- ============================================================

-- ============================================================
-- 1. Registrar /transferencias em system_pages
-- ============================================================
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

-- ============================================================
-- 2. bank_statement_lines: external_id (FITID OFX) + dedup
-- ============================================================
ALTER TABLE public.bank_statement_lines
  ADD COLUMN IF NOT EXISTS external_id text;

COMMENT ON COLUMN public.bank_statement_lines.external_id IS
  'Identificador único da transação no banco (FITID do OFX). Usado para evitar duplicação em reimports.';

CREATE INDEX IF NOT EXISTS idx_bsl_external_id
  ON public.bank_statement_lines(external_id)
  WHERE external_id IS NOT NULL;

-- Unique partial index por conta + FITID (evita reimport duplicado mesmo trocando o nome do arquivo)
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

-- ============================================================
-- 3. Sincronizar rotas reais usadas no app com system_pages
--    (idempotente; corrige desalinhamento entre populate_system_pages
--     antigo que registrou rotas /financial/* nunca implementadas)
-- ============================================================
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
