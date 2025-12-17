-- Migration: Fix RLS policies for engine_type_services
-- Description: Corrige as policies para usar organization_users (padrão do sistema)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view engine type services from their org" ON public.engine_type_services;
DROP POLICY IF EXISTS "Users can view engine type services from their organization" ON public.engine_type_services;
DROP POLICY IF EXISTS "Admins and managers can insert engine type services" ON public.engine_type_services;
DROP POLICY IF EXISTS "Admins and managers can update engine type services" ON public.engine_type_services;
DROP POLICY IF EXISTS "Admins and managers can delete engine type services" ON public.engine_type_services;
DROP POLICY IF EXISTS "Users can insert engine type services for their organization" ON public.engine_type_services;
DROP POLICY IF EXISTS "Users can update engine type services from their organization" ON public.engine_type_services;
DROP POLICY IF EXISTS "Users can delete engine type services from their organization" ON public.engine_type_services;

-- Create policies matching the pattern of engine_types
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
