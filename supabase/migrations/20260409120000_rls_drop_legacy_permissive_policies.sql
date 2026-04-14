-- RLS apenas (parte 1/2): DROP das políticas apontadas pelo Supabase Database Advisor
-- (get_advisors type security), lint rls_policy_always_true (USING/WITH CHECK sempre true).
-- Doc: https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy
-- Tabelas cobertas nesta rodada: accounts_payable_approval_events, ap_*, approval_tiers_ap,
-- ar_*, bank_*, card_machine_configs, cash_closings, cash_flow_projection, consultants,
-- cost_centers, customers, fin_accounting_entries, financial_notifications,
-- monthly_financial_reports, order_workflow, orders, partner_withdrawals, payment_methods,
-- receipt_history, time_logs.
-- Próximo arquivo: 20260409120100_rls_create_org_member_policies.sql

-- accounts_payable_approval_events
DROP POLICY IF EXISTS "accounts_payable_approval_events_authenticated" ON public.accounts_payable_approval_events;

-- ap_payment_history
DROP POLICY IF EXISTS "ap_payment_history_authenticated" ON public.ap_payment_history;

-- ap_recurring_schedules
DROP POLICY IF EXISTS "ap_recurring_authenticated" ON public.ap_recurring_schedules;

-- approval_tiers_ap
DROP POLICY IF EXISTS "approval_tiers_ap_authenticated" ON public.approval_tiers_ap;

-- ar_due_alerts
DROP POLICY IF EXISTS "ar_due_alerts_authenticated" ON public.ar_due_alerts;

-- ar_late_fee_history
DROP POLICY IF EXISTS "ar_late_fee_history_authenticated" ON public.ar_late_fee_history;

-- ar_late_fee_rules
DROP POLICY IF EXISTS "ar_late_fee_rules_authenticated" ON public.ar_late_fee_rules;

-- ar_renegotiations
DROP POLICY IF EXISTS "ar_renegotiations_authenticated" ON public.ar_renegotiations;

-- bank_*
DROP POLICY IF EXISTS "bank_reconciliation_items_authenticated" ON public.bank_reconciliation_items;
DROP POLICY IF EXISTS "bank_reconciliation_reports_authenticated" ON public.bank_reconciliation_reports;
DROP POLICY IF EXISTS "bank_reconciliations_authenticated" ON public.bank_reconciliations;
DROP POLICY IF EXISTS "bank_statement_imports_authenticated" ON public.bank_statement_imports;
DROP POLICY IF EXISTS "bank_statement_lines_authenticated" ON public.bank_statement_lines;
DROP POLICY IF EXISTS "bank_transmission_batches_authenticated" ON public.bank_transmission_batches;

-- card_machine_configs
DROP POLICY IF EXISTS "card_machine_configs_authenticated" ON public.card_machine_configs;

-- cash_closings
DROP POLICY IF EXISTS "cash_closings_authenticated" ON public.cash_closings;

-- cash_flow_projection
DROP POLICY IF EXISTS "Authenticated users can manage cash flow projection" ON public.cash_flow_projection;
DROP POLICY IF EXISTS "Authenticated users can view cash flow projection" ON public.cash_flow_projection;

-- consultants
DROP POLICY IF EXISTS "Allow all operations on consultants for development" ON public.consultants;
DROP POLICY IF EXISTS "Enable all access for development" ON public.consultants;
DROP POLICY IF EXISTS "Users can manage consultants" ON public.consultants;
DROP POLICY IF EXISTS "Authenticated users can view consultants" ON public.consultants;
DROP POLICY IF EXISTS "Authenticated users can manage consultants" ON public.consultants;
DROP POLICY IF EXISTS "Users can manage consultants for their organization" ON public.consultants;

-- cost_centers
DROP POLICY IF EXISTS "cost_centers_authenticated" ON public.cost_centers;

-- customers (dev, migrações antigas, políticas por org no remoto)
DROP POLICY IF EXISTS "Allow customers access for development" ON public.customers;
DROP POLICY IF EXISTS "Enable all access for development" ON public.customers;
DROP POLICY IF EXISTS "Users can manage own customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view their own customers or admins can view all" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers or admins can update all" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view customers from their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers for their organization" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers from their organization" ON public.customers;
DROP POLICY IF EXISTS "Organization admins can delete customers" ON public.customers;

-- fin_accounting_entries
DROP POLICY IF EXISTS "fin_accounting_entries_authenticated" ON public.fin_accounting_entries;

-- financial_notifications
DROP POLICY IF EXISTS "financial_notifications_authenticated" ON public.financial_notifications;

-- monthly_financial_reports
DROP POLICY IF EXISTS "monthly_financial_reports_authenticated" ON public.monthly_financial_reports;

-- order_workflow
DROP POLICY IF EXISTS "Allow order_workflow access for development" ON public.order_workflow;
DROP POLICY IF EXISTS "Authenticated users can manage order workflow" ON public.order_workflow;

-- orders
DROP POLICY IF EXISTS "Allow orders access for development" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for development" ON public.orders;
DROP POLICY IF EXISTS "Users can manage orders" ON public.orders;

-- partner_withdrawals
DROP POLICY IF EXISTS "partner_withdrawals_authenticated" ON public.partner_withdrawals;

-- payment_methods
DROP POLICY IF EXISTS "Authenticated users can manage payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Authenticated users can view payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Enable all access for development" ON public.payment_methods;

-- receipt_history
DROP POLICY IF EXISTS "receipt_history_authenticated" ON public.receipt_history;

-- time_logs
DROP POLICY IF EXISTS "Authenticated users can manage time logs" ON public.time_logs;
