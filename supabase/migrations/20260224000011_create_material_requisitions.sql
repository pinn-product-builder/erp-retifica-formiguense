-- US-PUR-012: Tabela de requisições de materiais vinculadas a OS
CREATE TABLE IF NOT EXISTS public.material_requisitions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL,
  requisition_number    TEXT NOT NULL,
  service_order_id      UUID REFERENCES public.orders(id),
  service_order_number  TEXT,
  requested_by          UUID NOT NULL,
  requested_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  required_date         DATE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente', 'parcialmente_atendida', 'atendida', 'cancelada')),
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.material_requisition_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id          UUID NOT NULL REFERENCES public.material_requisitions(id) ON DELETE CASCADE,
  part_id                 UUID REFERENCES public.parts_inventory(id),
  part_code               TEXT NOT NULL,
  part_name               TEXT NOT NULL,
  quantity_required       NUMERIC(10,3) NOT NULL,
  quantity_available      NUMERIC(10,3) DEFAULT 0,
  quantity_reserved       NUMERIC(10,3) DEFAULT 0,
  quantity_to_purchase    NUMERIC(10,3) DEFAULT 0,
  status                  TEXT NOT NULL DEFAULT 'pendente'
                          CHECK (status IN ('disponivel', 'reservado', 'compra_pendente', 'aguardando', 'recebido', 'pendente')),
  expected_delivery_date  DATE,
  purchase_order_id       UUID,
  purchase_need_id        UUID,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_requisitions_org   ON public.material_requisitions(org_id);
CREATE INDEX IF NOT EXISTS idx_material_requisitions_order ON public.material_requisitions(service_order_id);
CREATE INDEX IF NOT EXISTS idx_material_requisition_items  ON public.material_requisition_items(requisition_id);

ALTER TABLE public.material_requisitions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requisition_items  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mr_select" ON public.material_requisitions FOR SELECT
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "mr_insert" ON public.material_requisitions FOR INSERT
  WITH CHECK (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "mr_update" ON public.material_requisitions FOR UPDATE
  USING (org_id IN (
    SELECT organization_id FROM public.organization_users
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "mri_select" ON public.material_requisition_items FOR SELECT
  USING (requisition_id IN (
    SELECT id FROM public.material_requisitions WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "mri_insert" ON public.material_requisition_items FOR INSERT
  WITH CHECK (requisition_id IN (
    SELECT id FROM public.material_requisitions WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

CREATE POLICY "mri_update" ON public.material_requisition_items FOR UPDATE
  USING (requisition_id IN (
    SELECT id FROM public.material_requisitions WHERE org_id IN (
      SELECT organization_id FROM public.organization_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  ));

-- Trigger para gerar número sequencial da requisição
CREATE OR REPLACE FUNCTION public.generate_requisition_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq  INTEGER;
BEGIN
  v_year := to_char(now(), 'YYYYMMDD');
  SELECT COUNT(*) + 1
    INTO v_seq
    FROM public.material_requisitions
   WHERE org_id = NEW.org_id
     AND created_at >= date_trunc('day', now());
  NEW.requisition_number := 'REQ-' || v_year || '-' || lpad(v_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_requisition_number ON public.material_requisitions;
CREATE TRIGGER trg_generate_requisition_number
  BEFORE INSERT ON public.material_requisitions
  FOR EACH ROW
  WHEN (NEW.requisition_number IS NULL OR NEW.requisition_number = '')
  EXECUTE FUNCTION public.generate_requisition_number();

-- US-PUR-011: Função para gerar necessidades de compra a partir de alertas de estoque ativos
CREATE OR REPLACE FUNCTION public.generate_purchase_needs_from_alerts(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  v_alert       RECORD;
  v_existing    UUID;
  v_urgency     TEXT;
  v_reorder_qty INTEGER;
  v_count       INTEGER := 0;
BEGIN
  FOR v_alert IN
    SELECT *
      FROM public.stock_alerts
     WHERE org_id = p_org_id
       AND is_active = true
       AND resolved_at IS NULL
  LOOP
    SELECT id INTO v_existing
      FROM public.purchase_needs
     WHERE org_id = p_org_id
       AND part_code = v_alert.part_code
       AND status IN ('pending', 'in_quotation', 'ordered')
     LIMIT 1;

    IF v_existing IS NULL THEN
      IF v_alert.current_stock <= 0 THEN
        v_urgency := 'critical';
      ELSIF v_alert.minimum_stock > 0
        AND (v_alert.current_stock::FLOAT / v_alert.minimum_stock) <= 0.25 THEN
        v_urgency := 'high';
      ELSIF v_alert.minimum_stock > 0
        AND (v_alert.current_stock::FLOAT / v_alert.minimum_stock) <= 0.50 THEN
        v_urgency := 'medium';
      ELSE
        v_urgency := 'low';
      END IF;

      v_reorder_qty := COALESCE(
        v_alert.maximum_stock - v_alert.current_stock,
        v_alert.minimum_stock * 2,
        10
      );
      IF v_reorder_qty <= 0 THEN
        v_reorder_qty := GREATEST(v_alert.minimum_stock, 1);
      END IF;

      INSERT INTO public.purchase_needs (
        org_id, part_code, part_name,
        required_quantity, available_quantity, shortage_quantity,
        priority_level, need_type, status, estimated_cost
      ) VALUES (
        p_org_id,
        v_alert.part_code,
        v_alert.part_name,
        v_reorder_qty,
        v_alert.current_stock,
        GREATEST(0, v_reorder_qty - v_alert.current_stock),
        v_urgency,
        'auto_reorder',
        'pending',
        0
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('generated_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
