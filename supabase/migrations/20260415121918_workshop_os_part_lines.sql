-- =====================================================
-- Gestão de Itens e Peças da OS (montagem/oficina)
-- Migration: criação da tabela principal
-- Escopo: somente estrutura da tabela
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workshop_os_part_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organização e vínculo com OS
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.detailed_budgets(id) ON DELETE SET NULL,

  -- Produto/peça
  part_id UUID REFERENCES public.parts_inventory(id) ON DELETE SET NULL,
  part_code TEXT NOT NULL,
  part_name TEXT NOT NULL,

  -- Origem e classificação
  source TEXT NOT NULL DEFAULT 'commercial_json' CHECK (source IN ('commercial_json', 'extra', 'substitution')),
  is_extra BOOLEAN NOT NULL DEFAULT false,
  section_name TEXT NOT NULL DEFAULT 'Montagem',
  commercial_line_key TEXT,
  budget_part_index INTEGER,
  replaces_line_id UUID REFERENCES public.workshop_os_part_lines(id) ON DELETE SET NULL,

  -- Quantidades e estados de execução
  qty_noted INTEGER NOT NULL DEFAULT 1 CHECK (qty_noted > 0),
  qty_released INTEGER NOT NULL DEFAULT 0 CHECK (qty_released >= 0),
  qty_cancelled INTEGER NOT NULL DEFAULT 0 CHECK (qty_cancelled >= 0),
  CONSTRAINT workshop_os_part_lines_qty_consistency_check
    CHECK (qty_released + qty_cancelled <= qty_noted),

  -- Preço e decisão de preço dissimilar
  unit_price_original_snapshot NUMERIC(12, 2) CHECK (unit_price_original_snapshot IS NULL OR unit_price_original_snapshot >= 0),
  unit_price_applied NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price_applied >= 0),
  price_basis TEXT NOT NULL DEFAULT 'substitute' CHECK (price_basis IN ('original', 'substitute', 'manual')),

  -- Referências operacionais
  reservation_id UUID REFERENCES public.parts_reservations(id) ON DELETE SET NULL,
  last_movement_id UUID REFERENCES public.inventory_movements(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  notes TEXT,

  -- Auditoria
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workshop_os_part_lines_org_id
  ON public.workshop_os_part_lines(org_id);

CREATE INDEX IF NOT EXISTS idx_workshop_os_part_lines_order_id
  ON public.workshop_os_part_lines(order_id);

CREATE INDEX IF NOT EXISTS idx_workshop_os_part_lines_order_extra
  ON public.workshop_os_part_lines(order_id, is_extra);

CREATE INDEX IF NOT EXISTS idx_workshop_os_part_lines_part_code
  ON public.workshop_os_part_lines(part_code);

CREATE INDEX IF NOT EXISTS idx_workshop_os_part_lines_replaces_line_id
  ON public.workshop_os_part_lines(replaces_line_id)
  WHERE replaces_line_id IS NOT NULL;

CREATE TRIGGER update_workshop_os_part_lines_updated_at
BEFORE UPDATE ON public.workshop_os_part_lines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.workshop_os_part_lines IS
  'Linhas de peças da OS para oficina/montagem: anotação, baixa, substituição e cancelamento parcial.';
