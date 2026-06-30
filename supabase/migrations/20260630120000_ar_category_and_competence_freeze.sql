-- ============================================================
-- Contas a receber: categoria do plano de contas (#4)
-- Contas a receber/pagar: opção de congelar a competência (#6)
--
-- #4: o módulo de Contas a receber não tinha vínculo com o plano
--     de contas (expense_categories). Cliente Favarini pediu para
--     manter o mesmo plano de contas usado em CP.
--
-- #6: a competência sempre era recalculada para acompanhar o
--     vencimento ao editar o título. Quando o regime é de
--     competência puro (ex.: serviço prestado em maio, recebido
--     em julho), a data de competência precisa permanecer fixa
--     mesmo se o vencimento for prorrogado. O toggle por
--     lançamento (freeze_competence) cobre os dois cenários.
-- ============================================================

-- 1. accounts_receivable: adicionar expense_category_id
ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS expense_category_id uuid
  REFERENCES public.expense_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_expense_category
  ON public.accounts_receivable(expense_category_id);

COMMENT ON COLUMN public.accounts_receivable.expense_category_id IS
  'Categoria do plano de contas (compartilhado com accounts_payable) para classificação contábil e relatórios por categoria.';

-- 2. accounts_receivable: adicionar freeze_competence
ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS freeze_competence boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.accounts_receivable.freeze_competence IS
  'Quando true, competence_date não é recalculada ao alterar due_date. Default false mantém o comportamento legado de acompanhar o vencimento.';

-- 3. accounts_payable: adicionar freeze_competence
ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS freeze_competence boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.accounts_payable.freeze_competence IS
  'Quando true, competence_date não é recalculada ao alterar due_date. Default false mantém o comportamento legado.';

-- ============================================================
-- 4. Registrar página /importar-xml (#2 — tela standalone de
--    teste do parser NF-e para o módulo de estoque/compras).
-- ============================================================
INSERT INTO public.system_pages (name, display_name, description, route_path, module, icon, is_active)
VALUES (
  'importar-xml',
  'Importar XML (estoque)',
  'Tela de testes para o parser de NF-e: carrega XML e exibe cabeçalho, itens e duplicatas.',
  '/importar-xml',
  'purchasing',
  'FileText',
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
