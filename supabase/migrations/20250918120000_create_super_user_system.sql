-- Migration: Create Super User System
-- This migration creates the infrastructure for super users who can create organizations

-- 1. Create super_user_type enum
CREATE TYPE public.super_user_type AS ENUM ('platform_admin', 'organization_creator');

-- 2. Create super_users table
CREATE TABLE public.super_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_user_type public.super_user_type NOT NULL DEFAULT 'organization_creator',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Constraints
  UNIQUE(user_id) -- Each user can only be a super user once
);

-- 3. Enable RLS on super_users table
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for super_users table
-- Only super users can view super user records
CREATE POLICY "super_users_can_view_super_users" ON public.super_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_users su
      WHERE su.user_id = auth.uid() AND su.is_active = TRUE
    )
  );

-- Only platform admins can manage super users
CREATE POLICY "platform_admins_can_manage_super_users" ON public.super_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_users su
      WHERE su.user_id = auth.uid() 
      AND su.super_user_type = 'platform_admin' 
      AND su.is_active = TRUE
    )
  );

-- 5. Create function to check if user is super user
CREATE OR REPLACE FUNCTION public.is_super_user(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.super_users 
    WHERE user_id = user_uuid 
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to check super user type
CREATE OR REPLACE FUNCTION public.get_super_user_type(user_uuid UUID DEFAULT auth.uid())
RETURNS public.super_user_type AS $$
DECLARE
  user_type public.super_user_type;
BEGIN
  SELECT super_user_type INTO user_type
  FROM public.super_users 
  WHERE user_id = user_uuid 
  AND is_active = TRUE;
  
  RETURN user_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to check if user can create organizations
CREATE OR REPLACE FUNCTION public.can_create_organizations(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.super_users 
    WHERE user_id = user_uuid 
    AND is_active = TRUE
    AND super_user_type IN ('platform_admin', 'organization_creator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update organizations table policies
-- Remove the old policy that allowed any user to create organizations
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

-- Create new policy: only super users can create organizations
CREATE POLICY "super_users_can_create_organizations" ON public.organizations
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND 
    public.can_create_organizations(auth.uid())
  );

-- 9. Create super_user_signup_requests table for pending requests
CREATE TABLE public.super_user_signup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  message TEXT,
  requested_type public.super_user_type NOT NULL DEFAULT 'organization_creator',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  -- Constraints
  CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 10. Enable RLS on super_user_signup_requests
ALTER TABLE public.super_user_signup_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for signup requests
CREATE POLICY "platform_admins_can_view_requests" ON public.super_user_signup_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.super_users su
      WHERE su.user_id = auth.uid() 
      AND su.super_user_type = 'platform_admin' 
      AND su.is_active = TRUE
    )
  );

CREATE POLICY "anyone_can_create_requests" ON public.super_user_signup_requests
  FOR INSERT
  WITH CHECK (TRUE); -- Anyone can submit a request

CREATE POLICY "platform_admins_can_update_requests" ON public.super_user_signup_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.super_users su
      WHERE su.user_id = auth.uid() 
      AND su.super_user_type = 'platform_admin' 
      AND su.is_active = TRUE
    )
  );

-- 11. Create indexes for performance
CREATE INDEX idx_super_users_user_id ON public.super_users(user_id);
CREATE INDEX idx_super_users_type_active ON public.super_users(super_user_type, is_active);
CREATE INDEX idx_signup_requests_status ON public.super_user_signup_requests(status, created_at);
CREATE INDEX idx_signup_requests_email ON public.super_user_signup_requests(email);

-- 12. Create audit trigger for super_users table
CREATE TRIGGER audit_super_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.super_users
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_super_user_requests_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.super_user_signup_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- 13. Create function to approve super user request
CREATE OR REPLACE FUNCTION public.approve_super_user_request(
  request_id UUID,
  approver_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  request_record RECORD;
  new_user_id UUID;
BEGIN
  -- Check if current user is platform admin
  IF NOT EXISTS (
    SELECT 1 FROM public.super_users 
    WHERE user_id = auth.uid() 
    AND super_user_type = 'platform_admin' 
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Only platform admins can approve requests';
  END IF;

  -- Get request details
  SELECT * INTO request_record 
  FROM public.super_user_signup_requests 
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Create user account (this would typically be done through Supabase Auth API)
  -- For now, we'll just mark the request as approved and expect manual user creation
  
  -- Update request status
  UPDATE public.super_user_signup_requests 
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    review_notes = approver_notes
  WHERE id = request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Insert initial platform admin (this should be done manually for the first admin)
-- This is commented out as it should be done through a separate process
-- INSERT INTO public.super_users (user_id, super_user_type, created_at, notes)
-- VALUES ('YOUR_FIRST_ADMIN_USER_ID', 'platform_admin', NOW(), 'Initial platform administrator');

-- 15. Create notification function for new requests
CREATE OR REPLACE FUNCTION public.notify_new_super_user_request()
RETURNS TRIGGER AS $$
BEGIN
  -- This could send notifications to platform admins
  -- For now, we'll just log it
  INSERT INTO public.audit_logs (
    org_id, user_id, action, table_name, record_id, new_data
  ) VALUES (
    NULL, -- No org_id for super user requests
    NULL, -- No authenticated user for public requests
    'NEW_SUPER_USER_REQUEST',
    'super_user_signup_requests',
    NEW.id,
    row_to_json(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_new_request_trigger
  AFTER INSERT ON public.super_user_signup_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_super_user_request();

COMMENT ON TABLE public.super_users IS 'Super users who can create and manage organizations';
COMMENT ON TABLE public.super_user_signup_requests IS 'Requests from users wanting to become super users';
COMMENT ON FUNCTION public.is_super_user IS 'Check if a user is a super user';
COMMENT ON FUNCTION public.can_create_organizations IS 'Check if a user can create organizations';
