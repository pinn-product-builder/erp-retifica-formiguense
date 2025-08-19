-- Remove the overly permissive development policies and implement proper RLS
-- This addresses the security vulnerabilities found in the scan

-- Drop the existing overly permissive policies on customers table
DROP POLICY IF EXISTS "Enable all access for development" ON public.customers;

-- Create secure RLS policies for customers table
-- Only authenticated users can view customers (employees need to access customer data for orders)
CREATE POLICY "Authenticated users can view customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (true);

-- Only authenticated users can create customers
CREATE POLICY "Authenticated users can create customers" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update customers
CREATE POLICY "Authenticated users can update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (true);

-- Only authenticated users can delete customers (restrict to admin later if needed)
CREATE POLICY "Authenticated users can delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (true);

-- Secure the consultants table
DROP POLICY IF EXISTS "Enable all access for development" ON public.consultants;

CREATE POLICY "Authenticated users can view consultants" 
ON public.consultants 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage consultants" 
ON public.consultants 
FOR ALL 
TO authenticated
USING (true);

-- Secure financial tables - these should be restricted to authenticated users only
DROP POLICY IF EXISTS "Enable all access for development" ON public.accounts_payable;
DROP POLICY IF EXISTS "Enable all access for development" ON public.accounts_receivable;
DROP POLICY IF EXISTS "Enable all access for development" ON public.cash_flow;
DROP POLICY IF EXISTS "Enable all access for development" ON public.bank_accounts;

-- Accounts Payable policies
CREATE POLICY "Authenticated users can view accounts payable" 
ON public.accounts_payable 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage accounts payable" 
ON public.accounts_payable 
FOR ALL 
TO authenticated
USING (true);

-- Accounts Receivable policies
CREATE POLICY "Authenticated users can view accounts receivable" 
ON public.accounts_receivable 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage accounts receivable" 
ON public.accounts_receivable 
FOR ALL 
TO authenticated
USING (true);

-- Cash Flow policies
CREATE POLICY "Authenticated users can view cash flow" 
ON public.cash_flow 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage cash flow" 
ON public.cash_flow 
FOR ALL 
TO authenticated
USING (true);

-- Bank Accounts policies - highly sensitive financial data
CREATE POLICY "Authenticated users can view bank accounts" 
ON public.bank_accounts 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage bank accounts" 
ON public.bank_accounts 
FOR ALL 
TO authenticated
USING (true);

-- Secure other business-critical tables
DROP POLICY IF EXISTS "Enable all access for development" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for development" ON public.engines;
DROP POLICY IF EXISTS "Enable all access for development" ON public.budgets;
DROP POLICY IF EXISTS "Enable all access for development" ON public.order_workflow;
DROP POLICY IF EXISTS "Enable all access for development" ON public.order_photos;
DROP POLICY IF EXISTS "Enable all access for development" ON public.time_logs;
DROP POLICY IF EXISTS "Enable all access for development" ON public.parts_inventory;

-- Orders policies
CREATE POLICY "Authenticated users can manage orders" 
ON public.orders 
FOR ALL 
TO authenticated
USING (true);

-- Engines policies
CREATE POLICY "Authenticated users can manage engines" 
ON public.engines 
FOR ALL 
TO authenticated
USING (true);

-- Budgets policies
CREATE POLICY "Authenticated users can manage budgets" 
ON public.budgets 
FOR ALL 
TO authenticated
USING (true);

-- Order workflow policies
CREATE POLICY "Authenticated users can manage order workflow" 
ON public.order_workflow 
FOR ALL 
TO authenticated
USING (true);

-- Order photos policies
CREATE POLICY "Authenticated users can manage order photos" 
ON public.order_photos 
FOR ALL 
TO authenticated
USING (true);

-- Time logs policies
CREATE POLICY "Authenticated users can manage time logs" 
ON public.time_logs 
FOR ALL 
TO authenticated
USING (true);

-- Parts inventory policies
CREATE POLICY "Authenticated users can manage parts inventory" 
ON public.parts_inventory 
FOR ALL 
TO authenticated
USING (true);

-- Secure lookup/configuration tables
DROP POLICY IF EXISTS "Enable all access for development" ON public.expense_categories;
DROP POLICY IF EXISTS "Enable all access for development" ON public.payment_methods;
DROP POLICY IF EXISTS "Enable all access for development" ON public.monthly_dre;
DROP POLICY IF EXISTS "Enable all access for development" ON public.cash_flow_projection;

-- Configuration tables - can be read by authenticated users
CREATE POLICY "Authenticated users can view expense categories" 
ON public.expense_categories 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage expense categories" 
ON public.expense_categories 
FOR ALL 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view payment methods" 
ON public.payment_methods 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage payment methods" 
ON public.payment_methods 
FOR ALL 
TO authenticated
USING (true);

-- Financial reporting tables
CREATE POLICY "Authenticated users can view monthly DRE" 
ON public.monthly_dre 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage monthly DRE" 
ON public.monthly_dre 
FOR ALL 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view cash flow projection" 
ON public.cash_flow_projection 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage cash flow projection" 
ON public.cash_flow_projection 
FOR ALL 
TO authenticated
USING (true);

-- IMPORTANT: Ensure users are authenticated to access the system
-- The application should require login before accessing any sensitive data