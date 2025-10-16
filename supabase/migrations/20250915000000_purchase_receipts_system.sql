-- =====================================================
-- FASE 3: SISTEMA DE RECEBIMENTO DE MERCADORIAS
-- =====================================================
-- Implementação do sistema de recebimento de pedidos de compra
-- com integração automática ao estoque
--
-- Criado: 2025-01-12
-- Autor: Sistema ERP Retifica Formiguense
-- =====================================================

-- =====================================================
-- 1. TABELA: purchase_receipts (Recebimentos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchase_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  
  -- Informações do recebimento
  receipt_number TEXT NOT NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'partial', 'completed', 'cancelled')
  ),
  
  -- Responsável e observações
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Divergências
  has_divergence BOOLEAN DEFAULT false,
  divergence_notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint de unicidade
  CONSTRAINT unique_receipt_number_per_org UNIQUE (org_id, receipt_number)
);

-- =====================================================
-- 2. TABELA: purchase_receipt_items (Itens Recebidos)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchase_receipt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts_inventory(id), -- Vinculação com estoque
  
  -- Quantidades
  ordered_quantity INTEGER NOT NULL,
  received_quantity INTEGER NOT NULL CHECK (received_quantity >= 0),
  
  -- Divergências
  has_divergence BOOLEAN GENERATED ALWAYS AS (received_quantity != ordered_quantity) STORED,
  divergence_reason TEXT,
  
  -- Custo
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (received_quantity * unit_cost) STORED,
  
  -- Qualidade
  quality_status TEXT DEFAULT 'approved' CHECK (
    quality_status IN ('approved', 'rejected', 'under_review')
  ),
  quality_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_org_id 
  ON public.purchase_receipts(org_id);

CREATE INDEX IF NOT EXISTS idx_purchase_receipts_po_id 
  ON public.purchase_receipts(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_receipts_status 
  ON public.purchase_receipts(status);

CREATE INDEX IF NOT EXISTS idx_purchase_receipts_date 
  ON public.purchase_receipts(receipt_date DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_receipt_id 
  ON public.purchase_receipt_items(receipt_id);

CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_po_item_id 
  ON public.purchase_receipt_items(purchase_order_item_id);

CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_part_id 
  ON public.purchase_receipt_items(part_id)
  WHERE part_id IS NOT NULL;

-- =====================================================
-- 4. RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;

-- Policies para purchase_receipts
CREATE POLICY "Users can view receipts from their org"
  ON public.purchase_receipts 
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

CREATE POLICY "Users can create receipts in their org"
  ON public.purchase_receipts 
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update receipts in their org"
  ON public.purchase_receipts 
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

-- Policies para purchase_receipt_items
CREATE POLICY "Users can view receipt items from their org"
  ON public.purchase_receipt_items 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchase_receipts 
      WHERE id = receipt_id 
        AND org_id IN (
          SELECT organization_id 
          FROM public.organization_users 
          WHERE user_id = auth.uid() 
            AND is_active = true
        )
    )
  );

CREATE POLICY "Users can manage receipt items in their org"
  ON public.purchase_receipt_items 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_receipts 
      WHERE id = receipt_id 
        AND org_id IN (
          SELECT organization_id 
          FROM public.organization_users 
          WHERE user_id = auth.uid() 
            AND is_active = true
        )
    )
  );

-- =====================================================
-- 5. FUNCTION: Gerar número do recebimento
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_receipt_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 'REC-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM purchase_receipts
  WHERE org_id = p_org_id
    AND receipt_number LIKE 'REC-' || v_year || '-%';
  
  v_receipt_number := 'REC-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_receipt_number;
END;
$$;

-- =====================================================
-- 6. FUNCTION: Atualizar status do pedido
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_purchase_order_on_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_po_id UUID;
  v_total_ordered INTEGER;
  v_total_received INTEGER;
BEGIN
  -- Buscar PO ID
  SELECT purchase_order_id INTO v_po_id
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  -- Calcular totais do pedido
  SELECT 
    SUM(poi.quantity),
    SUM(pri.received_quantity)
  INTO v_total_ordered, v_total_received
  FROM purchase_order_items poi
  LEFT JOIN purchase_receipt_items pri ON pri.purchase_order_item_id = poi.id
  WHERE poi.po_id = v_po_id;
  
  -- Atualizar status do pedido
  IF v_total_received >= v_total_ordered THEN
    UPDATE purchase_orders
    SET 
      status = 'completed',
      actual_delivery = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = v_po_id;
  ELSIF v_total_received > 0 THEN
    UPDATE purchase_orders
    SET 
      status = 'partially_received',
      updated_at = NOW()
    WHERE id = v_po_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger: Atualizar status do PO após recebimento
DROP TRIGGER IF EXISTS trigger_update_po_on_receipt ON public.purchase_receipt_items;
CREATE TRIGGER trigger_update_po_on_receipt
  AFTER INSERT OR UPDATE ON public.purchase_receipt_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_purchase_order_on_receipt();

-- =====================================================
-- 7. TRIGGER: Atualizar updated_at
-- =====================================================
CREATE TRIGGER update_purchase_receipts_updated_at
  BEFORE UPDATE ON public.purchase_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON TABLE public.purchase_receipts IS 
'Registra recebimentos de pedidos de compra. Status: pending (aguardando), partial (parcial), completed (completo), cancelled (cancelado).';

COMMENT ON TABLE public.purchase_receipt_items IS 
'Itens individuais de cada recebimento. Registra quantidades pedidas vs recebidas, com divergências calculadas automaticamente.';

COMMENT ON FUNCTION public.generate_receipt_number(UUID) IS 
'Gera número sequencial para recebimento no formato REC-YYYY-NNNN por organização e ano.';

COMMENT ON FUNCTION public.update_purchase_order_on_receipt() IS 
'Atualiza automaticamente o status do pedido de compra quando itens são recebidos (parcial ou totalmente).';

-- =====================================================
-- 9. GRANTS (Permissões)
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.purchase_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipt_items TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

