-- Fix storage security: Make order-photos bucket private and add proper RLS
UPDATE storage.buckets 
SET public = false 
WHERE id = 'order-photos';

-- Add proper RLS policies for storage.objects
CREATE POLICY "Users can view their own order photos or admins can view all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-photos' AND (
    -- Check if user owns the order through order_photos table
    EXISTS (
      SELECT 1 FROM public.order_photos op
      JOIN public.orders o ON op.order_id = o.id
      JOIN public.customers c ON o.customer_id = c.id
      WHERE op.file_path = name 
      AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

CREATE POLICY "Users can upload photos for their own orders or admins can upload all"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-photos' AND (
    -- Check if user owns the order through order_photos table
    EXISTS (
      SELECT 1 FROM public.order_photos op
      JOIN public.orders o ON op.order_id = o.id
      JOIN public.customers c ON o.customer_id = c.id
      WHERE op.file_path = name 
      AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

CREATE POLICY "Users can update photos for their own orders or admins can update all"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'order-photos' AND (
    EXISTS (
      SELECT 1 FROM public.order_photos op
      JOIN public.orders o ON op.order_id = o.id
      JOIN public.customers c ON o.customer_id = c.id
      WHERE op.file_path = name 
      AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

CREATE POLICY "Admins can delete order photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-photos' AND public.is_admin()
);

-- Harden order_photos table RLS
DROP POLICY IF EXISTS "Authenticated users can manage order photos" ON public.order_photos;

CREATE POLICY "Users can view photos for their own orders or admins can view all"
ON public.order_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id 
    AND (c.created_by = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users can upload photos for their own orders or admins can upload all"
ON public.order_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id 
    AND (c.created_by = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users can update photos for their own orders or admins can update all"
ON public.order_photos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id 
    AND (c.created_by = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Admins can delete order photos"
ON public.order_photos
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Harden profiles table RLS
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile or admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- Fix missing search_path in existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    'employee'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_accounts_receivable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Só gera se o status mudou para aprovado
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
        INSERT INTO public.accounts_receivable (
            budget_id,
            order_id,
            customer_id,
            amount,
            due_date,
            installment_number,
            total_installments
        )
        SELECT 
            NEW.id,
            NEW.order_id,
            o.customer_id,
            NEW.total_cost,
            CURRENT_DATE + INTERVAL '30 days',
            1,
            1
        FROM public.orders o
        WHERE o.id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_year TEXT;
    sequence_num INTEGER;
    order_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Buscar o próximo número sequencial para o ano atual
    SELECT COALESCE(
        MAX(SUBSTRING(order_number FROM 'RF-' || current_year || '-(\d+)')::INTEGER), 
        0
    ) + 1
    INTO sequence_num
    FROM public.orders
    WHERE order_number LIKE 'RF-' || current_year || '-%';
    
    -- Formatar como RF-YYYY-NNNN
    order_number := 'RF-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN order_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;