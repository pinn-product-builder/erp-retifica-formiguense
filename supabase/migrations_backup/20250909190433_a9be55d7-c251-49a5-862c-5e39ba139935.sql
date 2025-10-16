-- Fix audit log RLS policy to allow inserts
CREATE POLICY "Users can insert audit_log for their organization"
ON public.fiscal_audit_log
FOR INSERT
WITH CHECK (org_id = current_org_id() OR org_id IS NULL);

-- Restrict system_config to admin-only for modifications
DROP POLICY IF EXISTS "Users can create system_config for their organization" ON public.system_config;
DROP POLICY IF EXISTS "Users can update system_config from their organization" ON public.system_config;
DROP POLICY IF EXISTS "Users can delete system_config from their organization" ON public.system_config;

-- Create admin-only policies for system_config
CREATE POLICY "Admins can create system_config for their organization"
ON public.system_config
FOR INSERT
WITH CHECK (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role));

CREATE POLICY "Admins can update system_config from their organization"
ON public.system_config
FOR UPDATE
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role))
WITH CHECK (org_id = current_org_id());

CREATE POLICY "Admins can delete system_config from their organization"
ON public.system_config
FOR DELETE
USING (org_id = current_org_id() AND has_org_role(org_id, 'admin'::app_role));