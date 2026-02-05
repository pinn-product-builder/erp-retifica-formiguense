-- Tabela de templates de serviços e peças por motor
CREATE TABLE IF NOT EXISTS public.engine_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    engine_brand TEXT NOT NULL,
    engine_model TEXT NOT NULL,
    engine_type_id UUID REFERENCES public.engine_types(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(org_id, engine_brand, engine_model)
);

-- Tabela de peças do template
CREATE TABLE IF NOT EXISTS public.engine_template_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.engine_templates(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES public.parts_inventory(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(template_id, part_id)
);

-- Tabela de serviços do template
CREATE TABLE IF NOT EXISTS public.engine_template_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.engine_templates(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.additional_services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(template_id, service_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_engine_templates_org_id ON public.engine_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_engine_templates_engine_type_id ON public.engine_templates(engine_type_id);
CREATE INDEX IF NOT EXISTS idx_engine_templates_brand_model ON public.engine_templates(engine_brand, engine_model);
CREATE INDEX IF NOT EXISTS idx_engine_template_parts_template_id ON public.engine_template_parts(template_id);
CREATE INDEX IF NOT EXISTS idx_engine_template_services_template_id ON public.engine_template_services(template_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_engine_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engine_templates_updated_at
    BEFORE UPDATE ON public.engine_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_engine_templates_updated_at();

-- RLS Policies
ALTER TABLE public.engine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_template_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_template_services ENABLE ROW LEVEL SECURITY;

-- Policies para engine_templates
CREATE POLICY "Users can view templates from their organization"
ON public.engine_templates FOR SELECT
TO public
USING (
    org_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "Users can create templates for their organization"
ON public.engine_templates FOR INSERT
TO public
WITH CHECK (
    org_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "Users can update templates from their organization"
ON public.engine_templates FOR UPDATE
TO public
USING (
    org_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

CREATE POLICY "Users can delete templates from their organization"
ON public.engine_templates FOR DELETE
TO public
USING (
    org_id IN (
        SELECT organization_id
        FROM organization_users
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- Policies para engine_template_parts
CREATE POLICY "Users can view template parts from their organization"
ON public.engine_template_parts FOR SELECT
TO public
USING (
    template_id IN (
        SELECT id FROM public.engine_templates
        WHERE org_id IN (
            SELECT organization_id
            FROM organization_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    )
);

CREATE POLICY "Users can manage template parts from their organization"
ON public.engine_template_parts FOR ALL
TO public
USING (
    template_id IN (
        SELECT id FROM public.engine_templates
        WHERE org_id IN (
            SELECT organization_id
            FROM organization_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    )
);

-- Policies para engine_template_services
CREATE POLICY "Users can view template services from their organization"
ON public.engine_template_services FOR SELECT
TO public
USING (
    template_id IN (
        SELECT id FROM public.engine_templates
        WHERE org_id IN (
            SELECT organization_id
            FROM organization_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    )
);

CREATE POLICY "Users can manage template services from their organization"
ON public.engine_template_services FOR ALL
TO public
USING (
    template_id IN (
        SELECT id FROM public.engine_templates
        WHERE org_id IN (
            SELECT organization_id
            FROM organization_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    )
);

-- Comentários
COMMENT ON TABLE public.engine_templates IS 'Templates de peças e serviços por modelo de motor';
COMMENT ON TABLE public.engine_template_parts IS 'Peças associadas aos templates de motor';
COMMENT ON TABLE public.engine_template_services IS 'Serviços associados aos templates de motor';
