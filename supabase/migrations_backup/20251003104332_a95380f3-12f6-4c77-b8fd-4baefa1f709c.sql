-- First, add org_id column to engines table if it doesn't exist
ALTER TABLE public.engines ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id);

-- Update existing engines to have org_id based on their orders
UPDATE public.engines e
SET org_id = o.org_id
FROM public.orders o
WHERE o.engine_id = e.id
AND e.org_id IS NULL;

-- Drop the overly permissive development policies
DROP POLICY IF EXISTS "Allow engines access for development" ON public.engines;
DROP POLICY IF EXISTS "Authenticated users can manage engines" ON public.engines;

-- Create proper organization-based RLS policies
CREATE POLICY "Users can view engines from their organization"
ON public.engines
FOR SELECT
TO public
USING (
  org_id IN (
    SELECT organization_users.organization_id
    FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.is_active = true
  )
);

CREATE POLICY "Users can create engines for their organization"
ON public.engines
FOR INSERT
TO public
WITH CHECK (
  org_id IN (
    SELECT organization_users.organization_id
    FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.is_active = true
  )
);

CREATE POLICY "Users can update engines from their organization"
ON public.engines
FOR UPDATE
TO public
USING (
  org_id IN (
    SELECT organization_users.organization_id
    FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.is_active = true
  )
)
WITH CHECK (
  org_id IN (
    SELECT organization_users.organization_id
    FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.is_active = true
  )
);

CREATE POLICY "Admins can delete engines from their organization"
ON public.engines
FOR DELETE
TO public
USING (
  org_id IN (
    SELECT organization_users.organization_id
    FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.is_active = true
    AND organization_users.role IN ('owner', 'admin')
  )
);

-- Create index on org_id for performance
CREATE INDEX IF NOT EXISTS idx_engines_org_id ON public.engines(org_id);