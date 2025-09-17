-- Migration to fix user and organization table structure inconsistencies
-- This migration addresses the issues found between documentation and implementation

-- 1. Fix profiles table structure
-- Drop existing conflicting table if it exists and recreate with consistent structure
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- 5. Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Ensure organization_users table has correct structure
-- (This should already exist from previous migrations, but let's ensure consistency)

-- Check if we need to add missing columns to organization_users
DO $$
BEGIN
  -- Add email column to profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
  
  -- Ensure organization_users has all required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_users' AND column_name = 'invited_at'
  ) THEN
    ALTER TABLE public.organization_users ADD COLUMN invited_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_users' AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE public.organization_users ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_users' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE public.organization_users ADD COLUMN invited_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.organization_users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_organization_users_org_user ON public.organization_users(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_active ON public.organization_users(organization_id, is_active);

-- 9. Update current_org_id function to use correct column names
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT organization_id 
  FROM public.organization_users 
  WHERE user_id = auth.uid() 
  AND is_active = true 
  ORDER BY joined_at DESC NULLS LAST
  LIMIT 1;
$$;

-- 10. Update helper functions to use correct column names
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_users 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(org_id UUID, required_role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_users 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND role = required_role 
    AND is_active = true
  );
$$;

-- 11. Create function to get user profile info
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  role TEXT
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.user_id, p.name, p.email, p.role
  FROM public.profiles p
  WHERE p.user_id = user_uuid;
$$;
