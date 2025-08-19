-- Phase 2: Multi-tenancy and RBAC Implementation

-- 1. Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'user');

-- 2. Create organizations table
CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- 3. Create organization_users junction table
CREATE TABLE public.organization_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    joined_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- 4. Add org_id to business tables
ALTER TABLE public.tax_types ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_regimes ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.fiscal_classifications ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_rules ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.obligation_kinds ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.obligations ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_calculations ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_ledgers ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.tax_rate_tables ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.company_fiscal_settings ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.customers ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.orders ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.accounts_receivable ADD COLUMN org_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.accounts_payable ADD COLUMN org_id UUID REFERENCES public.organizations(id);

-- 5. Create essential indexes
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);
CREATE INDEX idx_org_users_org_id ON public.organization_users(organization_id);
CREATE INDEX idx_org_users_user_id ON public.organization_users(user_id);
CREATE INDEX idx_org_users_role ON public.organization_users(role);

-- Add org_id indexes to business tables
CREATE INDEX idx_tax_types_org_id ON public.tax_types(org_id);
CREATE INDEX idx_tax_regimes_org_id ON public.tax_regimes(org_id);
CREATE INDEX idx_fiscal_classifications_org_id ON public.fiscal_classifications(org_id);
CREATE INDEX idx_tax_rules_org_id ON public.tax_rules(org_id);
CREATE INDEX idx_obligation_kinds_org_id ON public.obligation_kinds(org_id);
CREATE INDEX idx_obligations_org_id ON public.obligations(org_id);
CREATE INDEX idx_tax_calculations_org_id ON public.tax_calculations(org_id);
CREATE INDEX idx_tax_ledgers_org_id ON public.tax_ledgers(org_id);
CREATE INDEX idx_tax_rate_tables_org_id ON public.tax_rate_tables(org_id);
CREATE INDEX idx_company_fiscal_settings_org_id ON public.company_fiscal_settings(org_id);
CREATE INDEX idx_customers_org_id ON public.customers(org_id);
CREATE INDEX idx_orders_org_id ON public.orders(org_id);
CREATE INDEX idx_accounts_receivable_org_id ON public.accounts_receivable(org_id);
CREATE INDEX idx_accounts_payable_org_id ON public.accounts_payable(org_id);

-- 6. Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_users_updated_at
    BEFORE UPDATE ON public.organization_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Helper functions for organization access
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_users 
  WHERE user_id = auth.uid() 
  AND is_active = true 
  ORDER BY joined_at DESC 
  LIMIT 1;
$$;

-- 8. Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies for organizations
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations
FOR SELECT
USING (public.is_org_member(id));

CREATE POLICY "Org owners and admins can update organization"
ON public.organizations
FOR UPDATE
USING (public.has_org_role(id, 'owner') OR public.has_org_role(id, 'admin'));

CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- 10. RLS policies for organization_users
CREATE POLICY "Users can view org members of their organizations"
ON public.organization_users
FOR SELECT
USING (public.is_org_member(organization_id));

CREATE POLICY "Org owners and admins can manage members"
ON public.organization_users
FOR ALL
USING (public.has_org_role(organization_id, 'owner') OR public.has_org_role(organization_id, 'admin'));

CREATE POLICY "Users can join when invited"
ON public.organization_users
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 11. Data Migration: Create "Default Organization" for existing data
DO $$
DECLARE
    default_org_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get the first user to be the owner (or use a specific admin user)
    SELECT user_id INTO admin_user_id FROM public.profiles LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Create default organization
        INSERT INTO public.organizations (name, slug, description, created_by)
        VALUES ('Organização Padrão', 'default-org', 'Organização criada automaticamente durante migração', admin_user_id)
        RETURNING id INTO default_org_id;
        
        -- Add all existing users to default organization
        INSERT INTO public.organization_users (organization_id, user_id, role, joined_at)
        SELECT default_org_id, user_id, 'admin', now()
        FROM public.profiles;
        
        -- Update all business tables to use default org
        UPDATE public.tax_types SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.tax_regimes SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.fiscal_classifications SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.tax_rules SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.obligation_kinds SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.obligations SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.tax_calculations SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.tax_ledgers SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.tax_rate_tables SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.company_fiscal_settings SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.customers SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.orders SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.accounts_receivable SET org_id = default_org_id WHERE org_id IS NULL;
        UPDATE public.accounts_payable SET org_id = default_org_id WHERE org_id IS NULL;
    END IF;
END $$;