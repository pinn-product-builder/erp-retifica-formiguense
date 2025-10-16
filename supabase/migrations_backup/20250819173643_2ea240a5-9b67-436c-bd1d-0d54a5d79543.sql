-- Fix security warnings from linter

-- 1. Fix Function Search Path Mutable - Update all functions to have immutable search_path
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
  ORDER BY joined_at DESC 
  LIMIT 1;
$$;

-- Also fix existing functions that might have mutable search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_customer_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    'employee'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_accounts_receivable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;