-- Criar tabela de Componentes Macro
CREATE TABLE IF NOT EXISTS public.macro_components (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT unique_macro_component_per_org UNIQUE (org_id, name)
);

-- Criar tabela de Serviços Adicionais
CREATE TABLE IF NOT EXISTS public.additional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  macro_component_id UUID REFERENCES public.macro_components(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Adicionar campo macro_component_id na tabela parts_inventory
ALTER TABLE public.parts_inventory 
ADD COLUMN IF NOT EXISTS macro_component_id UUID REFERENCES public.macro_components(id) ON DELETE SET NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_macro_components_org_id ON public.macro_components(org_id);
CREATE INDEX IF NOT EXISTS idx_macro_components_active ON public.macro_components(is_active);
CREATE INDEX IF NOT EXISTS idx_additional_services_org_id ON public.additional_services(org_id);
CREATE INDEX IF NOT EXISTS idx_additional_services_macro_component ON public.additional_services(macro_component_id);
CREATE INDEX IF NOT EXISTS idx_additional_services_active ON public.additional_services(is_active);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_macro_component ON public.parts_inventory(macro_component_id);

-- Habilitar RLS
ALTER TABLE public.macro_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para macro_components
CREATE POLICY "Users can view macro_components from their organization"
  ON public.macro_components FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "Users can insert macro_components for their organization"
  ON public.macro_components FOR INSERT
  WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update macro_components from their organization"
  ON public.macro_components FOR UPDATE
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete macro_components from their organization"
  ON public.macro_components FOR DELETE
  USING (org_id = current_org_id());

-- Políticas RLS para additional_services
CREATE POLICY "Users can view additional_services from their organization"
  ON public.additional_services FOR SELECT
  USING (org_id = current_org_id());

CREATE POLICY "Users can insert additional_services for their organization"
  ON public.additional_services FOR INSERT
  WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can update additional_services from their organization"
  ON public.additional_services FOR UPDATE
  USING (org_id = current_org_id())
  WITH CHECK (org_id = current_org_id());

CREATE POLICY "Users can delete additional_services from their organization"
  ON public.additional_services FOR DELETE
  USING (org_id = current_org_id());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_macro_components_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_additional_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_macro_components_updated_at
  BEFORE UPDATE ON public.macro_components
  FOR EACH ROW
  EXECUTE FUNCTION update_macro_components_updated_at();

CREATE TRIGGER trigger_update_additional_services_updated_at
  BEFORE UPDATE ON public.additional_services
  FOR EACH ROW
  EXECUTE FUNCTION update_additional_services_updated_at();

-- Trigger para definir org_id automaticamente
CREATE OR REPLACE FUNCTION set_macro_components_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := current_org_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_additional_services_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := current_org_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_macro_components_org_id
  BEFORE INSERT OR UPDATE ON public.macro_components
  FOR EACH ROW
  EXECUTE FUNCTION set_macro_components_org_id();

CREATE TRIGGER trigger_set_additional_services_org_id
  BEFORE INSERT OR UPDATE ON public.additional_services
  FOR EACH ROW
  EXECUTE FUNCTION set_additional_services_org_id();

-- Inserir componentes macro padrão
INSERT INTO public.macro_components (name, description, display_order, org_id)
SELECT 
  unnest(ARRAY['Bloco', 'Biela', 'Virabrequim', 'Comando', 'Volante', 'Cabecote', 'Montagem Completa']),
  unnest(ARRAY[
    'Componente macro para Bloco',
    'Componente macro para Biela',
    'Componente macro para Virabrequim',
    'Componente macro para Comando',
    'Componente macro para Volante',
    'Componente macro para Cabecote',
    'Componente macro para Montagem Completa'
  ]),
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]),
  o.id
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.macro_components mc 
  WHERE mc.org_id = o.id AND mc.name = 'Bloco'
)
ON CONFLICT DO NOTHING;

