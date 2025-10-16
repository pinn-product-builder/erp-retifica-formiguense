-- Enable RLS on special_environments table
ALTER TABLE public.special_environments ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage special environments for their organization
CREATE POLICY "Users can manage special environments for their organization"
ON public.special_environments
FOR ALL
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