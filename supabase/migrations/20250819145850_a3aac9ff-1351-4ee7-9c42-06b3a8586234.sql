-- Add user tracking to customers table for better access control
ALTER TABLE public.customers 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX idx_customers_created_by ON public.customers(created_by);

-- Update existing customers to have a created_by (set to first user for compatibility)
UPDATE public.customers 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Create more secure policies with user-based access control
CREATE POLICY "Users can view their own customers or admins can view all"
ON public.customers
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR public.is_admin()
);

CREATE POLICY "Users can create customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Users can update their own customers or admins can update all"
ON public.customers
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR public.is_admin()
);

CREATE POLICY "Admins can delete customers"
ON public.customers
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Create trigger to automatically set created_by on insert
CREATE OR REPLACE FUNCTION public.set_customer_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_customer_created_by
  BEFORE INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_customer_created_by();