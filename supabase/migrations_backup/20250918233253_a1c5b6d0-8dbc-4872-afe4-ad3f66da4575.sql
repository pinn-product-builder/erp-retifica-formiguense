-- Fix search path security issues for the functions we just created
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_super_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_organizations()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;