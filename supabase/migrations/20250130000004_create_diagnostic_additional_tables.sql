-- Create diagnostic_additional_parts table
CREATE TABLE IF NOT EXISTS public.diagnostic_additional_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    diagnostic_response_id uuid NOT NULL,
    part_code varchar(255) NOT NULL,
    part_name varchar(255) NOT NULL,
    quantity numeric(10, 2) NOT NULL DEFAULT 1,
    unit_price numeric(10, 2) NOT NULL DEFAULT 0,
    total numeric(10, 2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    org_id uuid,
    CONSTRAINT diagnostic_additional_parts_pkey PRIMARY KEY (id),
    CONSTRAINT diagnostic_additional_parts_diagnostic_response_id_fkey 
        FOREIGN KEY (diagnostic_response_id) 
        REFERENCES public.diagnostic_checklist_responses(id) 
        ON DELETE CASCADE
);

-- Create diagnostic_additional_services table
CREATE TABLE IF NOT EXISTS public.diagnostic_additional_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    diagnostic_response_id uuid NOT NULL,
    service_id uuid,
    description varchar(500) NOT NULL,
    quantity numeric(10, 2) NOT NULL DEFAULT 1,
    unit_price numeric(10, 2) NOT NULL DEFAULT 0,
    total numeric(10, 2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    org_id uuid,
    CONSTRAINT diagnostic_additional_services_pkey PRIMARY KEY (id),
    CONSTRAINT diagnostic_additional_services_diagnostic_response_id_fkey 
        FOREIGN KEY (diagnostic_response_id) 
        REFERENCES public.diagnostic_checklist_responses(id) 
        ON DELETE CASCADE,
    CONSTRAINT diagnostic_additional_services_service_id_fkey 
        FOREIGN KEY (service_id) 
        REFERENCES public.additional_services(id) 
        ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_additional_parts_diagnostic_response_id 
    ON public.diagnostic_additional_parts(diagnostic_response_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_additional_parts_org_id 
    ON public.diagnostic_additional_parts(org_id);

CREATE INDEX IF NOT EXISTS idx_diagnostic_additional_services_diagnostic_response_id 
    ON public.diagnostic_additional_services(diagnostic_response_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_additional_services_org_id 
    ON public.diagnostic_additional_services(org_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_additional_services_service_id 
    ON public.diagnostic_additional_services(service_id);

-- Create trigger function to set org_id
CREATE OR REPLACE FUNCTION set_diagnostic_additional_parts_org_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.org_id IS NULL THEN
        SELECT org_id INTO NEW.org_id
        FROM public.diagnostic_checklist_responses
        WHERE id = NEW.diagnostic_response_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_diagnostic_additional_services_org_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.org_id IS NULL THEN
        SELECT org_id INTO NEW.org_id
        FROM public.diagnostic_checklist_responses
        WHERE id = NEW.diagnostic_response_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_set_diagnostic_additional_parts_org_id
    BEFORE INSERT OR UPDATE
    ON public.diagnostic_additional_parts
    FOR EACH ROW
    EXECUTE FUNCTION set_diagnostic_additional_parts_org_id();

CREATE TRIGGER trigger_set_diagnostic_additional_services_org_id
    BEFORE INSERT OR UPDATE
    ON public.diagnostic_additional_services
    FOR EACH ROW
    EXECUTE FUNCTION set_diagnostic_additional_services_org_id();

-- Migrate existing data from JSONB columns to new tables
DO $$
DECLARE
    diagnostic_record RECORD;
    part_item JSONB;
    service_item JSONB;
BEGIN
    FOR diagnostic_record IN 
        SELECT id, org_id, additional_parts, additional_services
        FROM public.diagnostic_checklist_responses
        WHERE (additional_parts IS NOT NULL AND jsonb_array_length(additional_parts) > 0)
           OR (additional_services IS NOT NULL AND jsonb_array_length(additional_services) > 0)
    LOOP
        -- Migrate parts
        IF diagnostic_record.additional_parts IS NOT NULL THEN
            FOR part_item IN SELECT * FROM jsonb_array_elements(diagnostic_record.additional_parts)
            LOOP
                INSERT INTO public.diagnostic_additional_parts (
                    diagnostic_response_id,
                    org_id,
                    part_code,
                    part_name,
                    quantity,
                    unit_price,
                    total
                ) VALUES (
                    diagnostic_record.id,
                    diagnostic_record.org_id,
                    part_item->>'part_code',
                    part_item->>'part_name',
                    COALESCE((part_item->>'quantity')::numeric, 1),
                    COALESCE((part_item->>'unit_price')::numeric, 0),
                    COALESCE((part_item->>'total')::numeric, 0)
                ) ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;

        -- Migrate services
        IF diagnostic_record.additional_services IS NOT NULL THEN
            FOR service_item IN SELECT * FROM jsonb_array_elements(diagnostic_record.additional_services)
            LOOP
                BEGIN
                    INSERT INTO public.diagnostic_additional_services (
                        diagnostic_response_id,
                        org_id,
                        service_id,
                        description,
                        quantity,
                        unit_price,
                        total
                    ) VALUES (
                        diagnostic_record.id,
                        diagnostic_record.org_id,
                        CASE 
                            WHEN service_item->>'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                            THEN (service_item->>'id')::uuid
                            ELSE NULL
                        END,
                        service_item->>'description',
                        COALESCE((service_item->>'quantity')::numeric, 1),
                        COALESCE((service_item->>'unit_price')::numeric, 0),
                        COALESCE((service_item->>'total')::numeric, 0)
                    ) ON CONFLICT DO NOTHING;
                EXCEPTION WHEN OTHERS THEN
                    -- Skip invalid records
                    CONTINUE;
                END;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Add comments
COMMENT ON TABLE public.diagnostic_additional_parts IS 'Peças adicionais selecionadas em diagnósticos';
COMMENT ON TABLE public.diagnostic_additional_services IS 'Serviços adicionais selecionados em diagnósticos';

