-- Migration: Public Schema - Foreign Keys
-- Description: Creates all foreign key constraints for tables in the public schema
-- Based on: backup/public-ddl.sql
-- Note: This migration should run after all tables are created

-- public.accounts_payable foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_payable_expense_category_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'accounts_payable'
    ) THEN
        ALTER TABLE public.accounts_payable ADD CONSTRAINT accounts_payable_expense_category_id_fkey FOREIGN KEY (expense_category_id) REFERENCES public.expense_categories(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_payable_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'accounts_payable'
    ) THEN
        ALTER TABLE public.accounts_payable ADD CONSTRAINT accounts_payable_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.accounts_receivable foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_receivable_budget_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'accounts_receivable'
    ) THEN
        ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_receivable_customer_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'accounts_receivable'
    ) THEN
        ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_receivable_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'accounts_receivable'
    ) THEN
        ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_receivable_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'accounts_receivable'
    ) THEN
        ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.alert_history foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'alert_history_dismissed_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'alert_history'
    ) THEN
        ALTER TABLE public.alert_history ADD CONSTRAINT alert_history_dismissed_by_fkey FOREIGN KEY (dismissed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'alert_history_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'alert_history'
    ) THEN
        ALTER TABLE public.alert_history ADD CONSTRAINT alert_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.approval_rules foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'approval_rules_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'approval_rules'
    ) THEN
        ALTER TABLE public.approval_rules ADD CONSTRAINT approval_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.approval_workflows foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'approval_workflows_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'approval_workflows'
    ) THEN
        ALTER TABLE public.approval_workflows ADD CONSTRAINT approval_workflows_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'approval_workflows_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'approval_workflows'
    ) THEN
        ALTER TABLE public.approval_workflows ADD CONSTRAINT approval_workflows_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'approval_workflows_requested_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'approval_workflows'
    ) THEN
        ALTER TABLE public.approval_workflows ADD CONSTRAINT approval_workflows_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.budget_alerts foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'budget_alerts_budget_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'budget_alerts'
    ) THEN
        ALTER TABLE public.budget_alerts ADD CONSTRAINT budget_alerts_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'budget_alerts_dismissed_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'budget_alerts'
    ) THEN
        ALTER TABLE public.budget_alerts ADD CONSTRAINT budget_alerts_dismissed_by_fkey FOREIGN KEY (dismissed_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.budget_approvals foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'budget_approvals_budget_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'budget_approvals'
    ) THEN
        ALTER TABLE public.budget_approvals ADD CONSTRAINT budget_approvals_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'budget_approvals_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'budget_approvals'
    ) THEN
        ALTER TABLE public.budget_approvals ADD CONSTRAINT budget_approvals_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'budget_approvals_registered_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'budget_approvals'
    ) THEN
        ALTER TABLE public.budget_approvals ADD CONSTRAINT budget_approvals_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.budgets foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'budgets_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'budgets'
    ) THEN
        ALTER TABLE public.budgets ADD CONSTRAINT budgets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.cash_flow foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_flow_accounts_payable_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'cash_flow'
    ) THEN
        ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_accounts_payable_id_fkey FOREIGN KEY (accounts_payable_id) REFERENCES public.accounts_payable(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_flow_accounts_receivable_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'cash_flow'
    ) THEN
        ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_accounts_receivable_id_fkey FOREIGN KEY (accounts_receivable_id) REFERENCES public.accounts_receivable(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_flow_bank_account_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'cash_flow'
    ) THEN
        ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_flow_category_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'cash_flow'
    ) THEN
        ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cash_flow_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'cash_flow'
    ) THEN
        ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;


-- public.commission_calculations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'commission_calculations_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'commission_calculations'
    ) THEN
        ALTER TABLE public.commission_calculations ADD CONSTRAINT commission_calculations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'commission_calculations_employee_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'commission_calculations'
    ) THEN
        ALTER TABLE public.commission_calculations ADD CONSTRAINT commission_calculations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'commission_calculations_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'commission_calculations'
    ) THEN
        ALTER TABLE public.commission_calculations ADD CONSTRAINT commission_calculations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.company_fiscal_settings foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'company_fiscal_settings_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'company_fiscal_settings'
    ) THEN
        ALTER TABLE public.company_fiscal_settings ADD CONSTRAINT company_fiscal_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'company_fiscal_settings_regime_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'company_fiscal_settings'
    ) THEN
        ALTER TABLE public.company_fiscal_settings ADD CONSTRAINT company_fiscal_settings_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;
    END IF;
END $$;


-- public.customers foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE public.customers ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE public.customers ADD CONSTRAINT customers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.detailed_budgets foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'detailed_budgets_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'detailed_budgets'
    ) THEN
        ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'detailed_budgets_diagnostic_response_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'detailed_budgets'
    ) THEN
        ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_diagnostic_response_id_fkey FOREIGN KEY (diagnostic_response_id) REFERENCES public.diagnostic_checklist_responses(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'detailed_budgets_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'detailed_budgets'
    ) THEN
        ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'detailed_budgets_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'detailed_budgets'
    ) THEN
        ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.diagnostic_checklist_items foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklist_items_checklist_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklist_items'
    ) THEN
        ALTER TABLE public.diagnostic_checklist_items ADD CONSTRAINT diagnostic_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.diagnostic_checklists(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.diagnostic_checklist_responses foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklist_responses_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklist_responses'
    ) THEN
        ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklist_responses_checklist_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklist_responses'
    ) THEN
        ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.diagnostic_checklists(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklist_responses_diagnosed_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklist_responses'
    ) THEN
        ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_diagnosed_by_fkey FOREIGN KEY (diagnosed_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklist_responses_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklist_responses'
    ) THEN
        ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklist_responses_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklist_responses'
    ) THEN
        ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.diagnostic_checklists foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklists_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklists'
    ) THEN
        ALTER TABLE public.diagnostic_checklists ADD CONSTRAINT diagnostic_checklists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklists_engine_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklists'
    ) THEN
        ALTER TABLE public.diagnostic_checklists ADD CONSTRAINT diagnostic_checklists_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'diagnostic_checklists_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'diagnostic_checklists'
    ) THEN
        ALTER TABLE public.diagnostic_checklists ADD CONSTRAINT diagnostic_checklists_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.employee_time_tracking foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_time_tracking_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'employee_time_tracking'
    ) THEN
        ALTER TABLE public.employee_time_tracking ADD CONSTRAINT employee_time_tracking_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_time_tracking_employee_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'employee_time_tracking'
    ) THEN
        ALTER TABLE public.employee_time_tracking ADD CONSTRAINT employee_time_tracking_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employee_time_tracking_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'employee_time_tracking'
    ) THEN
        ALTER TABLE public.employee_time_tracking ADD CONSTRAINT employee_time_tracking_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.employees foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employees_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'employees'
    ) THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employees_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'employees'
    ) THEN
        ALTER TABLE public.employees ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.engine_types foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'engine_types_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'engine_types'
    ) THEN
        ALTER TABLE public.engine_types ADD CONSTRAINT engine_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.engines foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'engines_engine_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'engines'
    ) THEN
        ALTER TABLE public.engines ADD CONSTRAINT engines_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'engines_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'engines'
    ) THEN
        ALTER TABLE public.engines ADD CONSTRAINT engines_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.entry_form_fields foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entry_form_fields_template_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'entry_form_fields'
    ) THEN
        ALTER TABLE public.entry_form_fields ADD CONSTRAINT entry_form_fields_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.entry_form_templates(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.entry_form_submissions foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entry_form_submissions_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'entry_form_submissions'
    ) THEN
        ALTER TABLE public.entry_form_submissions ADD CONSTRAINT entry_form_submissions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entry_form_submissions_submitted_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'entry_form_submissions'
    ) THEN
        ALTER TABLE public.entry_form_submissions ADD CONSTRAINT entry_form_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entry_form_submissions_template_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'entry_form_submissions'
    ) THEN
        ALTER TABLE public.entry_form_submissions ADD CONSTRAINT entry_form_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.entry_form_templates(id);
    END IF;
END $$;


-- public.entry_form_templates foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entry_form_templates_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'entry_form_templates'
    ) THEN
        ALTER TABLE public.entry_form_templates ADD CONSTRAINT entry_form_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entry_form_templates_engine_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'entry_form_templates'
    ) THEN
        ALTER TABLE public.entry_form_templates ADD CONSTRAINT entry_form_templates_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'entry_form_templates_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'entry_form_templates'
    ) THEN
        ALTER TABLE public.entry_form_templates ADD CONSTRAINT entry_form_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.environment_reservations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'environment_reservations_environment_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'environment_reservations'
    ) THEN
        ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.special_environments(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'environment_reservations_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'environment_reservations'
    ) THEN
        ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'environment_reservations_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'environment_reservations'
    ) THEN
        ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'environment_reservations_reserved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'environment_reservations'
    ) THEN
        ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_reserved_by_fkey FOREIGN KEY (reserved_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.fiscal_audit_log foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fiscal_audit_log_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'fiscal_audit_log'
    ) THEN
        ALTER TABLE public.fiscal_audit_log ADD CONSTRAINT fiscal_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.fiscal_classifications foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fiscal_classifications_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'fiscal_classifications'
    ) THEN
        ALTER TABLE public.fiscal_classifications ADD CONSTRAINT fiscal_classifications_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.inventory_count_items foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_count_items_count_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_count_items'
    ) THEN
        ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_count_id_fkey FOREIGN KEY (count_id) REFERENCES public.inventory_counts(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_count_items_counted_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_count_items'
    ) THEN
        ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_counted_by_fkey FOREIGN KEY (counted_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_count_items_part_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_count_items'
    ) THEN
        ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.inventory_counts foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_counts_counted_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_counts'
    ) THEN
        ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_counted_by_fkey FOREIGN KEY (counted_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_counts_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_counts'
    ) THEN
        ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_counts_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_counts'
    ) THEN
        ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_counts_reviewed_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_counts'
    ) THEN
        ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.inventory_movements foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_movements_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_movements_budget_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_movements_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_movements_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_movements_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'inventory_movements_part_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.jurisdiction_config foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'jurisdiction_config_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'jurisdiction_config'
    ) THEN
        ALTER TABLE public.jurisdiction_config ADD CONSTRAINT jurisdiction_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.kpi_targets foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_parent_goal'
        AND table_schema = 'public'
        AND table_name = 'kpi_targets'
    ) THEN
        ALTER TABLE public.kpi_targets ADD CONSTRAINT fk_parent_goal FOREIGN KEY (parent_goal_id) REFERENCES public.kpi_targets(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'kpi_targets_kpi_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'kpi_targets'
    ) THEN
        ALTER TABLE public.kpi_targets ADD CONSTRAINT kpi_targets_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpis(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'kpi_targets_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'kpi_targets'
    ) THEN
        ALTER TABLE public.kpi_targets ADD CONSTRAINT kpi_targets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.obligation_files foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_obligation_files_obligation'
        AND table_schema = 'public'
        AND table_name = 'obligation_files'
    ) THEN
        ALTER TABLE public.obligation_files ADD CONSTRAINT fk_obligation_files_obligation FOREIGN KEY (obligation_id) REFERENCES public.obligations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'obligation_files_obligation_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'obligation_files'
    ) THEN
        ALTER TABLE public.obligation_files ADD CONSTRAINT obligation_files_obligation_id_fkey FOREIGN KEY (obligation_id) REFERENCES public.obligations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.obligation_kinds foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'obligation_kinds_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'obligation_kinds'
    ) THEN
        ALTER TABLE public.obligation_kinds ADD CONSTRAINT obligation_kinds_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.obligations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_obligations_obligation_kind'
        AND table_schema = 'public'
        AND table_name = 'obligations'
    ) THEN
        ALTER TABLE public.obligations ADD CONSTRAINT fk_obligations_obligation_kind FOREIGN KEY (obligation_kind_id) REFERENCES public.obligation_kinds(id) ON DELETE RESTRICT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'obligations_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'obligations'
    ) THEN
        ALTER TABLE public.obligations ADD CONSTRAINT obligations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'obligations_obligation_kind_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'obligations'
    ) THEN
        ALTER TABLE public.obligations ADD CONSTRAINT obligations_obligation_kind_id_fkey FOREIGN KEY (obligation_kind_id) REFERENCES public.obligation_kinds(id) ON DELETE RESTRICT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'obligations_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'obligations'
    ) THEN
        ALTER TABLE public.obligations ADD CONSTRAINT obligations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.order_materials foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_materials_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_materials'
    ) THEN
        ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_materials_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_materials'
    ) THEN
        ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_materials_part_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_materials'
    ) THEN
        ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_materials_used_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_materials'
    ) THEN
        ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.order_photos foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_photos_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_photos'
    ) THEN
        ALTER TABLE public.order_photos ADD CONSTRAINT order_photos_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.order_status_history foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_status_history_changed_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_status_history'
    ) THEN
        ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_status_history_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_status_history'
    ) THEN
        ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_status_history_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_status_history'
    ) THEN
        ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.order_warranties foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_warranties_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_warranties'
    ) THEN
        ALTER TABLE public.order_warranties ADD CONSTRAINT order_warranties_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_warranties_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_warranties'
    ) THEN
        ALTER TABLE public.order_warranties ADD CONSTRAINT order_warranties_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.order_workflow foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_workflow_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_workflow'
    ) THEN
        ALTER TABLE public.order_workflow ADD CONSTRAINT order_workflow_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_workflow_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_workflow'
    ) THEN
        ALTER TABLE public.order_workflow ADD CONSTRAINT order_workflow_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_workflow_workflow_step_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'order_workflow'
    ) THEN
        ALTER TABLE public.order_workflow ADD CONSTRAINT order_workflow_workflow_step_id_fkey FOREIGN KEY (workflow_step_id) REFERENCES public.workflow_steps(id);
    END IF;
END $$;


-- public.orders foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_consultant_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.consultants(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_customer_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_engine_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_engine_id_fkey FOREIGN KEY (engine_id) REFERENCES public.engines(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.organization_themes foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organization_themes_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'organization_themes'
    ) THEN
        ALTER TABLE public.organization_themes ADD CONSTRAINT organization_themes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.organization_users foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organization_users_invited_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'organization_users'
    ) THEN
        ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organization_users_organization_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'organization_users'
    ) THEN
        ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organization_users_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'organization_users'
    ) THEN
        ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.organizations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organizations_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'organizations'
    ) THEN
        ALTER TABLE public.organizations ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.parts_inventory foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_inventory_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_inventory'
    ) THEN
        ALTER TABLE public.parts_inventory ADD CONSTRAINT parts_inventory_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.parts_price_table foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_price_table_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_price_table'
    ) THEN
        ALTER TABLE public.parts_price_table ADD CONSTRAINT parts_price_table_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.parts_reservations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_applied_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_budget_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_cancelled_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_part_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_reserved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_reserved_by_fkey FOREIGN KEY (reserved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_reservations_separated_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_reservations'
    ) THEN
        ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_separated_by_fkey FOREIGN KEY (separated_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.parts_stock_config foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_stock_config_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_stock_config'
    ) THEN
        ALTER TABLE public.parts_stock_config ADD CONSTRAINT parts_stock_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_stock_config_preferred_supplier_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_stock_config'
    ) THEN
        ALTER TABLE public.parts_stock_config ADD CONSTRAINT parts_stock_config_preferred_supplier_id_fkey FOREIGN KEY (preferred_supplier_id) REFERENCES public.suppliers(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'parts_stock_config_updated_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'parts_stock_config'
    ) THEN
        ALTER TABLE public.parts_stock_config ADD CONSTRAINT parts_stock_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.performance_rankings foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'performance_rankings_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'performance_rankings'
    ) THEN
        ALTER TABLE public.performance_rankings ADD CONSTRAINT performance_rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.performance_reviews foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'performance_reviews_employee_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'performance_reviews'
    ) THEN
        ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'performance_reviews_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'performance_reviews'
    ) THEN
        ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'performance_reviews_reviewer_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'performance_reviews'
    ) THEN
        ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.production_alerts foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_alerts_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'production_alerts'
    ) THEN
        ALTER TABLE public.production_alerts ADD CONSTRAINT production_alerts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_alerts_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'production_alerts'
    ) THEN
        ALTER TABLE public.production_alerts ADD CONSTRAINT production_alerts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_alerts_schedule_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'production_alerts'
    ) THEN
        ALTER TABLE public.production_alerts ADD CONSTRAINT production_alerts_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.production_schedules(id);
    END IF;
END $$;


-- public.production_schedules foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_schedules_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'production_schedules'
    ) THEN
        ALTER TABLE public.production_schedules ADD CONSTRAINT production_schedules_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'production_schedules_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'production_schedules'
    ) THEN
        ALTER TABLE public.production_schedules ADD CONSTRAINT production_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.profile_page_permissions foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profile_page_permissions_page_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'profile_page_permissions'
    ) THEN
        ALTER TABLE public.profile_page_permissions ADD CONSTRAINT profile_page_permissions_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.system_pages(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profile_page_permissions_profile_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'profile_page_permissions'
    ) THEN
        ALTER TABLE public.profile_page_permissions ADD CONSTRAINT profile_page_permissions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.purchase_efficiency_reports foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_efficiency_reports_generated_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_efficiency_reports'
    ) THEN
        ALTER TABLE public.purchase_efficiency_reports ADD CONSTRAINT purchase_efficiency_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_efficiency_reports_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_efficiency_reports'
    ) THEN
        ALTER TABLE public.purchase_efficiency_reports ADD CONSTRAINT purchase_efficiency_reports_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.purchase_needs foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_needs_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_needs'
    ) THEN
        ALTER TABLE public.purchase_needs ADD CONSTRAINT purchase_needs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.purchase_order_items foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_order_items_part_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_order_items'
    ) THEN
        ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_order_items_po_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_order_items'
    ) THEN
        ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.purchase_orders foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_orders_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_orders'
    ) THEN
        ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_orders_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_orders'
    ) THEN
        ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_orders_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_orders'
    ) THEN
        ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_orders_requisition_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_orders'
    ) THEN
        ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_orders_supplier_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_orders'
    ) THEN
        ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
    END IF;
END $$;


-- public.purchase_receipt_items foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_receipt_items_part_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_receipt_items'
    ) THEN
        ALTER TABLE public.purchase_receipt_items ADD CONSTRAINT purchase_receipt_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_receipt_items_purchase_order_item_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_receipt_items'
    ) THEN
        ALTER TABLE public.purchase_receipt_items ADD CONSTRAINT purchase_receipt_items_purchase_order_item_id_fkey FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_items(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_receipt_items_receipt_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_receipt_items'
    ) THEN
        ALTER TABLE public.purchase_receipt_items ADD CONSTRAINT purchase_receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.purchase_receipts(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.purchase_receipts foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_receipts_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_receipts'
    ) THEN
        ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_receipts_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_receipts'
    ) THEN
        ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_receipts_purchase_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_receipts'
    ) THEN
        ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_receipts_received_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_receipts'
    ) THEN
        ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_received_by_fkey FOREIGN KEY (received_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.purchase_requisition_items foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_requisition_items_requisition_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_requisition_items'
    ) THEN
        ALTER TABLE public.purchase_requisition_items ADD CONSTRAINT purchase_requisition_items_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.purchase_requisitions foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_requisitions_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_requisitions'
    ) THEN
        ALTER TABLE public.purchase_requisitions ADD CONSTRAINT purchase_requisitions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_requisitions_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_requisitions'
    ) THEN
        ALTER TABLE public.purchase_requisitions ADD CONSTRAINT purchase_requisitions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_requisitions_requested_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'purchase_requisitions'
    ) THEN
        ALTER TABLE public.purchase_requisitions ADD CONSTRAINT purchase_requisitions_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.quality_history foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quality_history_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quality_history'
    ) THEN
        ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quality_history_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quality_history'
    ) THEN
        ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quality_history_recorded_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'quality_history'
    ) THEN
        ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quality_history_related_checklist_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quality_history'
    ) THEN
        ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_related_checklist_id_fkey FOREIGN KEY (related_checklist_id) REFERENCES public.workflow_checklists(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quality_history_related_report_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quality_history'
    ) THEN
        ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_related_report_id_fkey FOREIGN KEY (related_report_id) REFERENCES public.technical_reports(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quality_history_related_response_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quality_history'
    ) THEN
        ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_related_response_id_fkey FOREIGN KEY (related_response_id) REFERENCES public.workflow_checklist_responses(id);
    END IF;
END $$;


-- public.quotation_items foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotation_items_quotation_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quotation_items'
    ) THEN
        ALTER TABLE public.quotation_items ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.quotations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotations_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE public.quotations ADD CONSTRAINT quotations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotations_requisition_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE public.quotations ADD CONSTRAINT quotations_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'quotations_supplier_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'quotations'
    ) THEN
        ALTER TABLE public.quotations ADD CONSTRAINT quotations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
    END IF;
END $$;


-- public.resource_capacity foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'resource_capacity_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'resource_capacity'
    ) THEN
        ALTER TABLE public.resource_capacity ADD CONSTRAINT resource_capacity_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.service_price_table foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_price_table_engine_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'service_price_table'
    ) THEN
        ALTER TABLE public.service_price_table ADD CONSTRAINT service_price_table_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_price_table_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'service_price_table'
    ) THEN
        ALTER TABLE public.service_price_table ADD CONSTRAINT service_price_table_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.special_environments foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'special_environments_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'special_environments'
    ) THEN
        ALTER TABLE public.special_environments ADD CONSTRAINT special_environments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.status_config foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'status_config_engine_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'status_config'
    ) THEN
        ALTER TABLE public.status_config ADD CONSTRAINT status_config_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
    END IF;
END $$;


-- public.status_prerequisites foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'status_prerequisites_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'status_prerequisites'
    ) THEN
        ALTER TABLE public.status_prerequisites ADD CONSTRAINT status_prerequisites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.stock_alerts foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stock_alerts_acknowledged_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'stock_alerts'
    ) THEN
        ALTER TABLE public.stock_alerts ADD CONSTRAINT stock_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stock_alerts_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'stock_alerts'
    ) THEN
        ALTER TABLE public.stock_alerts ADD CONSTRAINT stock_alerts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.supplier_contacts foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_contacts_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_contacts'
    ) THEN
        ALTER TABLE public.supplier_contacts ADD CONSTRAINT supplier_contacts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_contacts_supplier_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_contacts'
    ) THEN
        ALTER TABLE public.supplier_contacts ADD CONSTRAINT supplier_contacts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.supplier_evaluations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_evaluations_evaluated_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_evaluations'
    ) THEN
        ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_evaluations_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_evaluations'
    ) THEN
        ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_evaluations_purchase_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_evaluations'
    ) THEN
        ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_evaluations_supplier_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_evaluations'
    ) THEN
        ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.supplier_performance_history foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_performance_history_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_performance_history'
    ) THEN
        ALTER TABLE public.supplier_performance_history ADD CONSTRAINT supplier_performance_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_performance_history_supplier_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_performance_history'
    ) THEN
        ALTER TABLE public.supplier_performance_history ADD CONSTRAINT supplier_performance_history_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
    END IF;
END $$;


-- public.supplier_suggestions foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_suggestions_purchase_need_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_suggestions'
    ) THEN
        ALTER TABLE public.supplier_suggestions ADD CONSTRAINT supplier_suggestions_purchase_need_id_fkey FOREIGN KEY (purchase_need_id) REFERENCES public.purchase_needs(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'supplier_suggestions_supplier_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'supplier_suggestions'
    ) THEN
        ALTER TABLE public.supplier_suggestions ADD CONSTRAINT supplier_suggestions_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
    END IF;
END $$;


-- public.suppliers foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'suppliers_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'suppliers'
    ) THEN
        ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.system_config foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'system_config_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'system_config'
    ) THEN
        ALTER TABLE public.system_config ADD CONSTRAINT system_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.tax_calculations foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tax_calculations_classification'
        AND table_schema = 'public'
        AND table_name = 'tax_calculations'
    ) THEN
        ALTER TABLE public.tax_calculations ADD CONSTRAINT fk_tax_calculations_classification FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE RESTRICT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tax_calculations_regime'
        AND table_schema = 'public'
        AND table_name = 'tax_calculations'
    ) THEN
        ALTER TABLE public.tax_calculations ADD CONSTRAINT fk_tax_calculations_regime FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_calculations_classification_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_calculations'
    ) THEN
        ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_calculations_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_calculations'
    ) THEN
        ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_calculations_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_calculations'
    ) THEN
        ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_calculations_regime_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_calculations'
    ) THEN
        ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;
    END IF;
END $$;


-- public.tax_ledgers foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_ledgers_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_ledgers'
    ) THEN
        ALTER TABLE public.tax_ledgers ADD CONSTRAINT tax_ledgers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_ledgers_regime_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_ledgers'
    ) THEN
        ALTER TABLE public.tax_ledgers ADD CONSTRAINT tax_ledgers_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_ledgers_tax_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_ledgers'
    ) THEN
        ALTER TABLE public.tax_ledgers ADD CONSTRAINT tax_ledgers_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE RESTRICT;
    END IF;
END $$;


-- public.tax_rate_tables foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tax_rate_tables_classification'
        AND table_schema = 'public'
        AND table_name = 'tax_rate_tables'
    ) THEN
        ALTER TABLE public.tax_rate_tables ADD CONSTRAINT fk_tax_rate_tables_classification FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE RESTRICT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tax_rate_tables_tax_type'
        AND table_schema = 'public'
        AND table_name = 'tax_rate_tables'
    ) THEN
        ALTER TABLE public.tax_rate_tables ADD CONSTRAINT fk_tax_rate_tables_tax_type FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE RESTRICT;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_rate_tables_classification_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_rate_tables'
    ) THEN
        ALTER TABLE public.tax_rate_tables ADD CONSTRAINT tax_rate_tables_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_rate_tables_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_rate_tables'
    ) THEN
        ALTER TABLE public.tax_rate_tables ADD CONSTRAINT tax_rate_tables_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_rate_tables_tax_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_rate_tables'
    ) THEN
        ALTER TABLE public.tax_rate_tables ADD CONSTRAINT tax_rate_tables_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.tax_regimes foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_regimes_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_regimes'
    ) THEN
        ALTER TABLE public.tax_regimes ADD CONSTRAINT tax_regimes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.tax_rules foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_rules_classification_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_rules'
    ) THEN
        ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE SET NULL;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_rules_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_rules'
    ) THEN
        ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_rules_regime_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_rules'
    ) THEN
        ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_rules_tax_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_rules'
    ) THEN
        ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.tax_types foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tax_types_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'tax_types'
    ) THEN
        ALTER TABLE public.tax_types ADD CONSTRAINT tax_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.technical_report_templates foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'technical_report_templates_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'technical_report_templates'
    ) THEN
        ALTER TABLE public.technical_report_templates ADD CONSTRAINT technical_report_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'technical_report_templates_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'technical_report_templates'
    ) THEN
        ALTER TABLE public.technical_report_templates ADD CONSTRAINT technical_report_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.technical_reports foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'technical_reports_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'technical_reports'
    ) THEN
        ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'technical_reports_generated_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'technical_reports'
    ) THEN
        ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'technical_reports_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'technical_reports'
    ) THEN
        ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'technical_reports_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'technical_reports'
    ) THEN
        ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.technical_standards_config foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'technical_standards_config_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'technical_standards_config'
    ) THEN
        ALTER TABLE public.technical_standards_config ADD CONSTRAINT technical_standards_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.time_logs foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_logs_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'time_logs'
    ) THEN
        ALTER TABLE public.time_logs ADD CONSTRAINT time_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.user_achievements foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_achievements_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_achievements'
    ) THEN
        ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.user_basic_info foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_basic_info_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_basic_info'
    ) THEN
        ALTER TABLE public.user_basic_info ADD CONSTRAINT user_basic_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.user_profile_assignments foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profile_assignments_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_profile_assignments'
    ) THEN
        ALTER TABLE public.user_profile_assignments ADD CONSTRAINT user_profile_assignments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profile_assignments_profile_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_profile_assignments'
    ) THEN
        ALTER TABLE public.user_profile_assignments ADD CONSTRAINT user_profile_assignments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.user_profiles foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_sector_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.user_sectors(id) ON DELETE SET NULL;
    END IF;
END $$;


-- public.user_score_history foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_score_history_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_score_history'
    ) THEN
        ALTER TABLE public.user_score_history ADD CONSTRAINT user_score_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.user_scores foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_scores_user_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_scores'
    ) THEN
        ALTER TABLE public.user_scores ADD CONSTRAINT user_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.user_sectors foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_sectors_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'user_sectors'
    ) THEN
        ALTER TABLE public.user_sectors ADD CONSTRAINT user_sectors_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.warranty_claims foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_claims_customer_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_claims'
    ) THEN
        ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_claims_evaluated_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_claims'
    ) THEN
        ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_claims_new_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_claims'
    ) THEN
        ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_new_order_id_fkey FOREIGN KEY (new_order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_claims_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_claims'
    ) THEN
        ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_claims_original_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_claims'
    ) THEN
        ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_original_order_id_fkey FOREIGN KEY (original_order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_claims_resolved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_claims'
    ) THEN
        ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.warranty_indicators foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_indicators_generated_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_indicators'
    ) THEN
        ALTER TABLE public.warranty_indicators ADD CONSTRAINT warranty_indicators_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'warranty_indicators_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'warranty_indicators'
    ) THEN
        ALTER TABLE public.warranty_indicators ADD CONSTRAINT warranty_indicators_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.work_schedules foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_schedules_employee_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'work_schedules'
    ) THEN
        ALTER TABLE public.work_schedules ADD CONSTRAINT work_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'work_schedules_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'work_schedules'
    ) THEN
        ALTER TABLE public.work_schedules ADD CONSTRAINT work_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.workflow_checklist_items foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklist_items_checklist_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklist_items'
    ) THEN
        ALTER TABLE public.workflow_checklist_items ADD CONSTRAINT workflow_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.workflow_checklists(id) ON DELETE CASCADE;
    END IF;
END $$;


-- public.workflow_checklist_responses foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklist_responses_checklist_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklist_responses'
    ) THEN
        ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.workflow_checklists(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklist_responses_filled_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklist_responses'
    ) THEN
        ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_filled_by_fkey FOREIGN KEY (filled_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklist_responses_order_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklist_responses'
    ) THEN
        ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklist_responses_order_workflow_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklist_responses'
    ) THEN
        ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_order_workflow_id_fkey FOREIGN KEY (order_workflow_id) REFERENCES public.order_workflow(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklist_responses_reviewed_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklist_responses'
    ) THEN
        ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklist_responses_supervisor_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklist_responses'
    ) THEN
        ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_supervisor_approved_by_fkey FOREIGN KEY (supervisor_approved_by) REFERENCES auth.users(id);
    END IF;
END $$;


-- public.workflow_checklists foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklists_created_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklists'
    ) THEN
        ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklists_engine_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklists'
    ) THEN
        ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklists_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklists'
    ) THEN
        ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_checklists_workflow_step_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_checklists'
    ) THEN
        ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_workflow_step_id_fkey FOREIGN KEY (workflow_step_id) REFERENCES public.workflow_steps(id);
    END IF;
END $$;


-- public.workflow_status_history foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_status_history_approved_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_status_history'
    ) THEN
        ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_status_history_changed_by_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_status_history'
    ) THEN
        ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_status_history_order_workflow_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_status_history'
    ) THEN
        ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_order_workflow_id_fkey FOREIGN KEY (order_workflow_id) REFERENCES public.order_workflow(id) ON DELETE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_status_history_org_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_status_history'
    ) THEN
        ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
    END IF;
END $$;


-- public.workflow_steps foreign keys

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_steps_engine_type_id_fkey'
        AND table_schema = 'public'
        AND table_name = 'workflow_steps'
    ) THEN
        ALTER TABLE public.workflow_steps ADD CONSTRAINT workflow_steps_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id) ON DELETE CASCADE;
    END IF;
END $$;
