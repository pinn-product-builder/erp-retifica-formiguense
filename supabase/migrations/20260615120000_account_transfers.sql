-- Transferência entre Contas (Banco/Caixa)
-- Cria a tabela account_transfers, uma RPC atômica create_account_transfer
-- que registra duas linhas em cash_flow (saída na origem, entrada no destino)
-- ambas marcadas com a categoria contábil "Transferência", e RLS por org_id.

-- ============================================================
-- Enum expense_category: adicionar 'transfer' se ainda não existir
-- ============================================================
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

-- ============================================================
-- Categoria contábil "Transferência" por organização (idempotente)
-- (precisa estar em transação separada do ADD VALUE do enum acima
--  para que o novo valor 'transfer' já esteja committed; em migrations
--  do Supabase cada arquivo roda em uma transação, então fica para
--  a função fazer o backfill on-the-fly via RPC.)
-- ============================================================

-- ============================================================
-- Tabela account_transfers
-- ============================================================
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

-- ============================================================
-- RLS por org_id (mesma migration da criação)
-- ============================================================
ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_all_account_transfers" ON public.account_transfers;
CREATE POLICY "org_member_all_account_transfers"
  ON public.account_transfers
  FOR ALL
  TO authenticated
  USING (public.is_super_admin() OR public.is_org_member(org_id))
  WITH CHECK (public.is_super_admin() OR public.is_org_member(org_id));

-- ============================================================
-- RPC: create_account_transfer (atômica)
-- ============================================================
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
  -- Autorização
  IF NOT (public.is_super_admin() OR public.is_org_member(p_org_id)) THEN
    RAISE EXCEPTION 'Sem permissão para criar transferência nesta organização';
  END IF;

  -- Validações
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

  -- Contas pertencem à organização?
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

  -- Categoria contábil "Transferência" (cria sob demanda)
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

  -- Saída na conta de origem
  INSERT INTO public.cash_flow (
    org_id, transaction_type, amount, description, transaction_date,
    payment_method, bank_account_id, category_id, notes, reconciled, is_intercompany
  ) VALUES (
    p_org_id, 'expense', p_amount, v_full_desc, p_transfer_date,
    'bank_transfer', p_from_bank_account_id, v_cat_id, p_notes, false, false
  ) RETURNING id INTO v_cf_out;

  -- Entrada na conta de destino
  INSERT INTO public.cash_flow (
    org_id, transaction_type, amount, description, transaction_date,
    payment_method, bank_account_id, category_id, notes, reconciled, is_intercompany
  ) VALUES (
    p_org_id, 'income', p_amount, v_full_desc, p_transfer_date,
    'bank_transfer', p_to_bank_account_id, v_cat_id, p_notes, false, false
  ) RETURNING id INTO v_cf_in;

  -- Cabeçalho da transferência
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
