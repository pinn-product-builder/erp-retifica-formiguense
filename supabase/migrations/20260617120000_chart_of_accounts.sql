-- Plano de Contas (chart of accounts): conta contábil + grupo + nível + tipo (Entradas/Saídas/Transferência).
-- Modela receitas E despesas, fiel à planilha do cliente. Deduplicado por org + nome normalizado.

CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conta_contabil text NOT NULL,
  grupo text,
  nivel text,
  tipo text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.chart_of_accounts IS 'Plano de contas por organização: conta contábil + grupo + nível + tipo (Entradas/Saídas/Transferência).';
COMMENT ON COLUMN public.chart_of_accounts.tipo IS 'Entradas | Saídas | Transferência';
COMMENT ON COLUMN public.chart_of_accounts.nivel IS 'Ex.: Receitas Operacionais, Despesas Variáveis, Despesas Fixas, Custos Diretos, Receitas Não Operacionais, Não Operacional, Transferência';

-- Evita duplicatas futuras: único por organização + nome normalizado (case/espaço-insensível)
CREATE UNIQUE INDEX IF NOT EXISTS chart_of_accounts_org_name_uniq
  ON public.chart_of_accounts (org_id, lower(btrim(conta_contabil)));
CREATE INDEX IF NOT EXISTS chart_of_accounts_org_idx ON public.chart_of_accounts (org_id);

-- updated_at automático
DROP TRIGGER IF EXISTS set_chart_of_accounts_updated_at ON public.chart_of_accounts;
CREATE TRIGGER set_chart_of_accounts_updated_at
  BEFORE UPDATE ON public.chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS no mesmo padrão de expense_categories (current_org_id())
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coa_select_org" ON public.chart_of_accounts;
CREATE POLICY "coa_select_org" ON public.chart_of_accounts FOR SELECT
  TO authenticated USING (org_id = current_org_id());

DROP POLICY IF EXISTS "coa_insert_org" ON public.chart_of_accounts;
CREATE POLICY "coa_insert_org" ON public.chart_of_accounts FOR INSERT
  TO authenticated WITH CHECK (org_id IS NOT NULL AND org_id = current_org_id());

DROP POLICY IF EXISTS "coa_update_org" ON public.chart_of_accounts;
CREATE POLICY "coa_update_org" ON public.chart_of_accounts FOR UPDATE
  TO authenticated USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id());

DROP POLICY IF EXISTS "coa_delete_org" ON public.chart_of_accounts;
CREATE POLICY "coa_delete_org" ON public.chart_of_accounts FOR DELETE
  TO authenticated USING (org_id = current_org_id());
