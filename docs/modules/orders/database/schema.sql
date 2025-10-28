-- =====================================================
-- MÓDULO: ORDENS DE SERVIÇO
-- Descrição: Schema completo do módulo de OS
-- Data: 28/10/2025
-- =====================================================

-- =====================================================
-- TABELA PRINCIPAL: orders
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  
  -- Relacionamentos
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  engine_id UUID REFERENCES public.engines(id),
  collection_request_id UUID REFERENCES public.collection_requests(id),
  consultant_id UUID REFERENCES public.employees(id),
  
  -- Status e Controle
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN (
      'draft', 
      'ativa', 
      'em_andamento', 
      'pausada', 
      'concluida', 
      'entregue', 
      'garantia', 
      'cancelada', 
      'arquivada'
    )
  ),
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 4),
  
  -- Datas
  estimated_delivery DATE,
  actual_delivery DATE,
  
  -- Garantia
  warranty_months INTEGER NOT NULL DEFAULT 3 CHECK (warranty_months >= 1),
  
  -- Observações
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Ordens de Serviço - registro principal';
COMMENT ON COLUMN public.orders.order_number IS 'Número da OS no formato ORG-YYYY-NNNN';
COMMENT ON COLUMN public.orders.status IS 'Status atual da OS no ciclo de vida';
COMMENT ON COLUMN public.orders.priority IS '1=Baixa, 2=Normal, 3=Alta, 4=Urgente';
COMMENT ON COLUMN public.orders.warranty_months IS 'Prazo de garantia em meses (padrão: 3)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON public.orders(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- =====================================================
-- TABELA: order_status_history
-- Descrição: Histórico de mudanças de status
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  old_status TEXT,
  new_status TEXT NOT NULL,
  
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

COMMENT ON TABLE public.order_status_history IS 'Log de todas as mudanças de status das OSs';

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON public.order_status_history(changed_at DESC);

-- =====================================================
-- TABELA: order_materials
-- Descrição: Materiais/peças aplicadas na OS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Referência à peça (opcional se peça não estiver no estoque)
  part_id UUID REFERENCES public.parts_inventory(id),
  
  -- Dados da peça (sempre preenchidos)
  part_name TEXT NOT NULL,
  part_code TEXT,
  
  -- Quantidades e valores
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost NUMERIC(10,2) DEFAULT 0.00 CHECK (unit_cost >= 0),
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  
  -- Auditoria
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_materials IS 'Peças e materiais aplicados em cada OS';
COMMENT ON COLUMN public.order_materials.total_cost IS 'Custo total calculado automaticamente (quantity × unit_cost)';

CREATE INDEX IF NOT EXISTS idx_order_materials_order_id ON public.order_materials(order_id);
CREATE INDEX IF NOT EXISTS idx_order_materials_part_id ON public.order_materials(part_id);

-- =====================================================
-- TABELA: order_warranties
-- Descrição: Garantias emitidas para as OSs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  warranty_type TEXT NOT NULL CHECK (warranty_type IN ('pecas', 'servico', 'total')),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_warranties IS 'Garantias emitidas para OSs concluídas';
COMMENT ON COLUMN public.order_warranties.warranty_type IS 'Tipo: pecas (só peças), servico (só mão de obra), total (ambos)';

CREATE INDEX IF NOT EXISTS idx_order_warranties_order_id ON public.order_warranties(order_id);
CREATE INDEX IF NOT EXISTS idx_order_warranties_is_active ON public.order_warranties(is_active);

-- =====================================================
-- TABELA: order_photos
-- Descrição: Fotos anexadas às OSs por etapa
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  photo_url TEXT NOT NULL,
  stage TEXT CHECK (stage IN ('check-in', 'diagnostico', 'producao', 'metrologia', 'entrega')),
  description TEXT,
  
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_photos IS 'Galeria de fotos por etapa da OS';

CREATE INDEX IF NOT EXISTS idx_order_photos_order_id ON public.order_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_order_photos_stage ON public.order_photos(stage);

-- =====================================================
-- TABELA: time_logs
-- Descrição: Registro de tempo trabalhado por etapa
-- =====================================================
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_workflow_id UUID NOT NULL REFERENCES public.order_workflow(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  
  activity_type TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.time_logs IS 'Registro de tempo trabalhado em cada etapa do workflow';
COMMENT ON COLUMN public.time_logs.duration_minutes IS 'Duração em minutos calculada automaticamente';

CREATE INDEX IF NOT EXISTS idx_time_logs_workflow_id ON public.time_logs(order_workflow_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON public.time_logs(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Atualizar updated_at automaticamente
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_warranties_updated_at
  BEFORE UPDATE ON public.order_warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id, old_status, new_status, changed_by, org_id
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), NEW.org_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Trigger: Criar garantia automaticamente ao concluir OS
CREATE OR REPLACE FUNCTION public.create_order_warranty()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar garantia quando ordem é marcada como concluída
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    INSERT INTO public.order_warranties (
      order_id,
      warranty_type,
      start_date,
      end_date,
      terms,
      org_id
    ) VALUES (
      NEW.id,
      'total',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 month' * COALESCE(NEW.warranty_months, 3),
      'Garantia padrão para serviços executados. Cobre mão de obra e peças aplicadas.',
      NEW.org_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS create_warranty_trigger ON public.orders;
CREATE TRIGGER create_warranty_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_warranty();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Usuários podem visualizar OSs de sua organização" 
  ON public.orders 
  FOR SELECT 
  USING (org_id = current_org_id());

CREATE POLICY "Usuários podem criar OSs em sua organização" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (org_id = current_org_id());

CREATE POLICY "Usuários podem atualizar OSs de sua organização" 
  ON public.orders 
  FOR UPDATE 
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

CREATE POLICY "Usuários podem deletar OSs de sua organização" 
  ON public.orders 
  FOR DELETE 
  USING (org_id = current_org_id());

-- Políticas para order_status_history
CREATE POLICY "Usuários podem visualizar histórico de sua organização" 
  ON public.order_status_history 
  FOR SELECT 
  USING (org_id = current_org_id());

CREATE POLICY "Usuários podem criar histórico em sua organização" 
  ON public.order_status_history 
  FOR INSERT 
  WITH CHECK (org_id = current_org_id());

-- Políticas para order_materials
CREATE POLICY "Usuários podem gerenciar materiais de sua organização" 
  ON public.order_materials 
  FOR ALL 
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Políticas para order_warranties
CREATE POLICY "Usuários podem gerenciar garantias de sua organização" 
  ON public.order_warranties 
  FOR ALL 
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Políticas para order_photos
CREATE POLICY "Usuários podem gerenciar fotos de sua organização" 
  ON public.order_photos 
  FOR ALL 
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- Políticas para time_logs
CREATE POLICY "Usuários podem gerenciar time logs de sua organização" 
  ON public.time_logs 
  FOR ALL 
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_warranties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_photos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_logs TO authenticated;
