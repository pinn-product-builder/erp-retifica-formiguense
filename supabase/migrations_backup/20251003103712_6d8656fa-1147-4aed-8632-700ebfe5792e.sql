-- Enable RLS on environment_reservations table
ALTER TABLE public.environment_reservations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage environment reservations for their organization
CREATE POLICY "Users can manage environment reservations for their organization"
ON public.environment_reservations
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