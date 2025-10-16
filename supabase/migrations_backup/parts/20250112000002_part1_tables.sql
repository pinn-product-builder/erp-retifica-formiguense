-- =====================================================
-- PARTE 1/3: TABELAS purchase_receipts
-- =====================================================

CREATE TABLE IF NOT EXISTS public.purchase_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  
  -- Identificação do recebimento
  receipt_number TEXT NOT NULL,
  receipt_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'partial', 'completed', 'cancelled')
  ),
  
  -- Nota fiscal (opcional)
  invoice_number TEXT,
  invoice_date DATE,
  
  -- Divergências
  has_divergence BOOLEAN DEFAULT false,
  
  -- Responsáveis
  received_by UUID REFERENCES auth.users(id),
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint de unicidade
  CONSTRAINT unique_receipt_number_per_org UNIQUE (org_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS public.purchase_receipt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts_inventory(id),
  
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

-- Índices
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

