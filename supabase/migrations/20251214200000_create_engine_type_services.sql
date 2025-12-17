-- Migration: Create engine_type_services junction table
-- Description: Tabela de relacionamento N:N entre engine_types e additional_services

-- Criar tabela de relacionamento
CREATE TABLE IF NOT EXISTS public.engine_type_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    engine_type_id uuid NOT NULL,
    service_id uuid NOT NULL,
    is_required boolean DEFAULT false,
    display_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NULL,
    updated_at timestamptz DEFAULT now() NULL,
    CONSTRAINT engine_type_services_pkey PRIMARY KEY (id),
    CONSTRAINT engine_type_services_engine_type_fkey 
        FOREIGN KEY (engine_type_id) 
        REFERENCES public.engine_types(id) 
        ON DELETE CASCADE,
    CONSTRAINT engine_type_services_service_fkey 
        FOREIGN KEY (service_id) 
        REFERENCES public.additional_services(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_engine_type_service 
        UNIQUE (engine_type_id, service_id)
);

-- Comentários
COMMENT ON TABLE public.engine_type_services IS 
'Tabela de relacionamento N:N entre tipos de motor e serviços. 
Define quais serviços compõem cada tipo de motor e serão exibidos no diagnóstico.';

COMMENT ON COLUMN public.engine_type_services.is_required IS 
'Indica se o serviço é obrigatório para este tipo de motor';

COMMENT ON COLUMN public.engine_type_services.display_order IS 
'Ordem de exibição do serviço no diagnóstico';

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_engine_type_services_engine_type 
ON public.engine_type_services(engine_type_id);

CREATE INDEX IF NOT EXISTS idx_engine_type_services_service 
ON public.engine_type_services(service_id);

CREATE INDEX IF NOT EXISTS idx_engine_type_services_display_order 
ON public.engine_type_services(engine_type_id, display_order);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_engine_type_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engine_type_services_updated_at
    BEFORE UPDATE ON public.engine_type_services
    FOR EACH ROW
    EXECUTE FUNCTION update_engine_type_services_updated_at();

-- RLS Policies (Row Level Security)
ALTER TABLE public.engine_type_services ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem visualizar serviços de tipos de motor da sua organização
CREATE POLICY "Users can view engine type services from their org"
ON public.engine_type_services
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.engine_types et
        WHERE et.id = engine_type_services.engine_type_id
        AND et.org_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid()
        )
    )
);

-- Policy: Admins podem gerenciar serviços de tipos de motor
CREATE POLICY "Admins can manage engine type services"
ON public.engine_type_services
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.engine_types et
        WHERE et.id = engine_type_services.engine_type_id
        AND et.org_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'manager')
        )
    )
);
