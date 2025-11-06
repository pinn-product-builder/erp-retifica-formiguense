-- public.achievement_configs definition

-- Drop table

-- DROP TABLE public.achievement_configs;

CREATE TABLE public.achievement_configs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	achievement_key text NOT NULL,
	title text NOT NULL,
	description text NOT NULL,
	icon text NOT NULL,
	points int4 DEFAULT 0 NULL,
	criteria jsonb NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT achievement_configs_org_id_achievement_key_key UNIQUE (org_id, achievement_key),
	CONSTRAINT achievement_configs_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_achievement_configs_active ON public.achievement_configs USING btree (is_active);
CREATE INDEX idx_achievement_configs_org ON public.achievement_configs USING btree (org_id);


-- public.alerts definition

-- Drop table

-- DROP TABLE public.alerts;

CREATE TABLE public.alerts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	alert_type text NOT NULL,
	title text NOT NULL,
	message text NOT NULL,
	severity text DEFAULT 'warning'::text NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	is_dismissible bool DEFAULT true NOT NULL,
	auto_dismiss_after int4 NULL,
	target_users jsonb DEFAULT '[]'::jsonb NULL,
	action_label text NULL,
	action_url text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	expires_at timestamptz NULL,
	CONSTRAINT alerts_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_alerts_purchase_need_metadata ON public.alerts USING gin (metadata) WHERE (alert_type = 'purchase_need'::text);

-- Table Triggers

create trigger trigger_archive_dismissed_alert after
update
    on
    public.alerts for each row execute function archive_dismissed_alert();
create trigger update_alerts_updated_at before
update
    on
    public.alerts for each row execute function update_updated_at_column();


-- public.audit_log definition

-- Drop table

-- DROP TABLE public.audit_log;

CREATE TABLE public.audit_log (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	table_name text NOT NULL,
	record_id uuid NOT NULL,
	operation text NOT NULL,
	old_values jsonb NULL,
	new_values jsonb NULL,
	user_id uuid NULL,
	"timestamp" timestamptz DEFAULT now() NOT NULL,
	ip_address inet NULL,
	user_agent text NULL,
	CONSTRAINT audit_log_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_audit_log_org_id ON public.audit_log USING btree (org_id);
CREATE INDEX idx_audit_log_table_record ON public.audit_log USING btree (table_name, record_id);


-- public.bank_accounts definition

-- Drop table

-- DROP TABLE public.bank_accounts;

CREATE TABLE public.bank_accounts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	bank_name text NOT NULL,
	agency text NULL,
	account_number text NOT NULL,
	account_type text DEFAULT 'checking'::text NULL,
	balance numeric(15, 2) DEFAULT 0.00 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	org_id uuid NULL,
	CONSTRAINT bank_accounts_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_bank_accounts_updated_at before
update
    on
    public.bank_accounts for each row execute function update_updated_at_column();


-- public.cash_flow_projection definition

-- Drop table

-- DROP TABLE public.cash_flow_projection;

CREATE TABLE public.cash_flow_projection (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	projection_date date NOT NULL,
	projected_income numeric(15, 2) DEFAULT 0.00 NULL,
	projected_expenses numeric(15, 2) DEFAULT 0.00 NULL,
	projected_balance numeric(15, 2) DEFAULT 0.00 NULL,
	actual_income numeric(15, 2) DEFAULT 0.00 NULL,
	actual_expenses numeric(15, 2) DEFAULT 0.00 NULL,
	actual_balance numeric(15, 2) DEFAULT 0.00 NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT cash_flow_projection_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_cash_flow_projection_updated_at before
update
    on
    public.cash_flow_projection for each row execute function update_updated_at_column();


-- public.consultants definition

-- Drop table

-- DROP TABLE public.consultants;

CREATE TABLE public.consultants (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	email text NULL,
	phone text NULL,
	commission_rate numeric(5, 2) DEFAULT 0.00 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT consultants_email_key UNIQUE (email),
	CONSTRAINT consultants_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger trigger_updated_at_consultants before
update
    on
    public.consultants for each row execute function update_updated_at_column();


-- public.dashboard_preferences definition

-- Drop table

-- DROP TABLE public.dashboard_preferences;

CREATE TABLE public.dashboard_preferences (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	user_id uuid NULL,
	preference_type text NOT NULL,
	preference_key text NOT NULL,
	preference_value jsonb DEFAULT '{}'::jsonb NOT NULL,
	is_global bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT dashboard_preferences_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_dashboard_preferences_updated_at before
update
    on
    public.dashboard_preferences for each row execute function update_updated_at_column();


-- public.expense_categories definition

-- Drop table

-- DROP TABLE public.expense_categories;

CREATE TABLE public.expense_categories (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	category public."expense_category" NOT NULL,
	description text NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	org_id uuid NULL,
	CONSTRAINT expense_categories_pkey PRIMARY KEY (id)
);


-- public.kpis definition

-- Drop table

-- DROP TABLE public.kpis;

CREATE TABLE public.kpis (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	calculation_formula text NOT NULL,
	unit text DEFAULT 'number'::text NOT NULL,
	icon text DEFAULT 'TrendingUp'::text NOT NULL,
	color text DEFAULT 'primary'::text NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	display_order int4 DEFAULT 0 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT kpis_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_kpis_updated_at before
update
    on
    public.kpis for each row execute function update_updated_at_column();


-- public.monthly_dre definition

-- Drop table

-- DROP TABLE public.monthly_dre;

CREATE TABLE public.monthly_dre (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"month" int4 NOT NULL,
	"year" int4 NOT NULL,
	total_revenue numeric(15, 2) DEFAULT 0.00 NULL,
	direct_costs numeric(15, 2) DEFAULT 0.00 NULL,
	operational_expenses numeric(15, 2) DEFAULT 0.00 NULL,
	gross_profit numeric(15, 2) DEFAULT 0.00 NULL,
	net_profit numeric(15, 2) DEFAULT 0.00 NULL,
	profit_margin numeric(5, 2) DEFAULT 0.00 NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	org_id uuid NULL,
	CONSTRAINT monthly_dre_month_year_key UNIQUE (month, year),
	CONSTRAINT monthly_dre_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_monthly_dre_updated_at before
update
    on
    public.monthly_dre for each row execute function update_updated_at_column();


-- public.notification_types definition

-- Drop table

-- DROP TABLE public.notification_types;

CREATE TABLE public.notification_types (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	icon text DEFAULT 'Bell'::text NOT NULL,
	color text DEFAULT 'blue'::text NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT notification_types_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_notification_types_updated_at before
update
    on
    public.notification_types for each row execute function update_updated_at_column();


-- public.payment_methods definition

-- Drop table

-- DROP TABLE public.payment_methods;

CREATE TABLE public.payment_methods (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"method" public."payment_method" NOT NULL,
	fee_percentage numeric(5, 2) DEFAULT 0.00 NULL,
	fee_fixed numeric(10, 2) DEFAULT 0.00 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT payment_methods_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_payment_methods_updated_at before
update
    on
    public.payment_methods for each row execute function update_updated_at_column();


-- public.quick_actions definition

-- Drop table

-- DROP TABLE public.quick_actions;

CREATE TABLE public.quick_actions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	title text NOT NULL,
	description text NULL,
	icon text DEFAULT 'Plus'::text NOT NULL,
	href text NOT NULL,
	variant text DEFAULT 'outline'::text NOT NULL,
	is_featured bool DEFAULT false NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	display_order int4 DEFAULT 0 NOT NULL,
	permissions jsonb DEFAULT '[]'::jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT quick_actions_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_quick_actions_updated_at before
update
    on
    public.quick_actions for each row execute function update_updated_at_column();


-- public.report_catalog definition

-- Drop table

-- DROP TABLE public.report_catalog;

CREATE TABLE public.report_catalog (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	category text DEFAULT 'general'::text NOT NULL,
	template_type text DEFAULT 'csv'::text NOT NULL,
	parameters_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
	permissions jsonb DEFAULT '[]'::jsonb NULL,
	is_active bool DEFAULT true NOT NULL,
	display_order int4 DEFAULT 0 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT report_catalog_org_id_code_key UNIQUE (org_id, code),
	CONSTRAINT report_catalog_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_report_catalog_updated_at before
update
    on
    public.report_catalog for each row execute function update_updated_at_column();


-- public.reports definition

-- Drop table

-- DROP TABLE public.reports;

CREATE TABLE public.reports (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	report_code text NOT NULL,
	parameters jsonb DEFAULT '{}'::jsonb NOT NULL,
	period_start date NULL,
	period_end date NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	file_path text NULL,
	file_name text NULL,
	file_type text NULL,
	size_bytes int4 NULL,
	hash_sha256 text NULL,
	generated_by uuid NULL,
	generated_at timestamptz NULL,
	error_message text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT reports_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_reports_created_at ON public.reports USING btree (created_at);
CREATE INDEX idx_reports_org_id ON public.reports USING btree (org_id);
CREATE INDEX idx_reports_status ON public.reports USING btree (status);

-- Table Triggers

create trigger update_reports_updated_at before
update
    on
    public.reports for each row execute function update_updated_at_column();


-- public.search_sources definition

-- Drop table

-- DROP TABLE public.search_sources;

CREATE TABLE public.search_sources (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	source_name text NOT NULL,
	source_type text NOT NULL,
	table_name text NULL,
	search_fields jsonb DEFAULT '[]'::jsonb NOT NULL,
	display_fields jsonb DEFAULT '[]'::jsonb NOT NULL,
	result_template text NULL,
	permissions jsonb DEFAULT '[]'::jsonb NULL,
	is_active bool DEFAULT true NOT NULL,
	weight int4 DEFAULT 100 NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT search_sources_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_search_sources_updated_at before
update
    on
    public.search_sources for each row execute function update_updated_at_column();


-- public.system_pages definition

-- Drop table

-- DROP TABLE public.system_pages;

CREATE TABLE public.system_pages (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	display_name varchar(100) NOT NULL,
	description text NULL,
	route_path varchar(200) NOT NULL,
	"module" varchar(50) NULL,
	icon varchar(50) NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT system_pages_name_key UNIQUE (name),
	CONSTRAINT system_pages_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_system_pages_updated_at before
update
    on
    public.system_pages for each row execute function update_updated_at_column();


-- public.notifications definition

-- Drop table

-- DROP TABLE public.notifications;

CREATE TABLE public.notifications (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	user_id uuid NULL,
	notification_type_id uuid NOT NULL,
	title text NOT NULL,
	message text NOT NULL,
	severity text DEFAULT 'info'::text NOT NULL,
	is_read bool DEFAULT false NOT NULL,
	is_global bool DEFAULT false NOT NULL,
	expires_at timestamptz NULL,
	action_url text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT notifications_pkey PRIMARY KEY (id),
	CONSTRAINT notifications_notification_type_id_fkey FOREIGN KEY (notification_type_id) REFERENCES public.notification_types(id) ON DELETE CASCADE
);
CREATE INDEX idx_notifications_org_global_unread ON public.notifications USING btree (org_id, is_global, is_read, created_at DESC) WHERE ((is_global = true) AND (is_read = false));
CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, is_read, created_at DESC) WHERE (is_read = false);

-- Table Triggers

create trigger update_notifications_updated_at before
update
    on
    public.notifications for each row execute function update_updated_at_column();


-- public.accounts_payable definition

-- Drop table

-- DROP TABLE public.accounts_payable;

CREATE TABLE public.accounts_payable (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	supplier_name text NOT NULL,
	supplier_document text NULL,
	expense_category_id uuid NULL,
	description text NOT NULL,
	amount numeric(15, 2) NOT NULL,
	due_date date NOT NULL,
	payment_date date NULL,
	status public."payment_status" DEFAULT 'pending'::payment_status NULL,
	"payment_method" public."payment_method" NULL,
	invoice_number text NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	org_id uuid NULL,
	CONSTRAINT accounts_payable_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_accounts_payable_org_id ON public.accounts_payable USING btree (org_id);

-- Table Triggers

create trigger update_accounts_payable_updated_at before
update
    on
    public.accounts_payable for each row execute function update_updated_at_column();


-- public.accounts_receivable definition

-- Drop table

-- DROP TABLE public.accounts_receivable;

CREATE TABLE public.accounts_receivable (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	budget_id uuid NULL,
	customer_id uuid NOT NULL,
	invoice_number text NULL,
	installment_number int4 DEFAULT 1 NULL,
	total_installments int4 DEFAULT 1 NULL,
	amount numeric(15, 2) NOT NULL,
	due_date date NOT NULL,
	payment_date date NULL,
	status public."payment_status" DEFAULT 'pending'::payment_status NULL,
	"payment_method" public."payment_method" NULL,
	late_fee numeric(15, 2) DEFAULT 0.00 NULL,
	discount numeric(15, 2) DEFAULT 0.00 NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	org_id uuid NULL,
	CONSTRAINT accounts_receivable_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_accounts_receivable_budget_id ON public.accounts_receivable USING btree (budget_id) WHERE (budget_id IS NOT NULL);
CREATE INDEX idx_accounts_receivable_org_id ON public.accounts_receivable USING btree (org_id);

-- Table Triggers

create trigger update_accounts_receivable_updated_at before
update
    on
    public.accounts_receivable for each row execute function update_updated_at_column();


-- public.alert_history definition

-- Drop table

-- DROP TABLE public.alert_history;

CREATE TABLE public.alert_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	alert_id uuid NOT NULL,
	org_id uuid NOT NULL,
	alert_type text NOT NULL,
	title text NOT NULL,
	message text NOT NULL,
	severity text NOT NULL,
	dismissed_by uuid NULL,
	dismissed_at timestamptz NULL,
	action_taken text NULL,
	action_taken_at timestamptz NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT alert_history_pkey PRIMARY KEY (id),
	CONSTRAINT alert_history_severity_check CHECK ((severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'success'::text])))
);
CREATE INDEX idx_alert_history_alert_id ON public.alert_history USING btree (alert_id);
CREATE INDEX idx_alert_history_created_at ON public.alert_history USING btree (created_at DESC);
CREATE INDEX idx_alert_history_org_id ON public.alert_history USING btree (org_id);
CREATE INDEX idx_alert_history_severity ON public.alert_history USING btree (severity);


-- public.approval_rules definition

-- Drop table

-- DROP TABLE public.approval_rules;

CREATE TABLE public.approval_rules (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	rule_type text NOT NULL,
	min_value numeric(15, 2) NULL,
	min_quantity int4 NULL,
	min_percentage numeric(5, 2) NULL,
	allowed_approvers _text DEFAULT '{admin,manager,owner}'::text[] NULL,
	is_active bool DEFAULT true NULL,
	description text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT approval_rules_pkey PRIMARY KEY (id),
	CONSTRAINT approval_rules_rule_type_check CHECK ((rule_type = ANY (ARRAY['purchase_order'::text, 'inventory_adjustment'::text, 'inventory_entry'::text, 'inventory_exit'::text])))
);
CREATE INDEX idx_approval_rules_active ON public.approval_rules USING btree (is_active) WHERE (is_active = true);
CREATE INDEX idx_approval_rules_org_id ON public.approval_rules USING btree (org_id);
CREATE INDEX idx_approval_rules_type ON public.approval_rules USING btree (rule_type);

-- Table Triggers

create trigger update_approval_rules_updated_at before
update
    on
    public.approval_rules for each row execute function update_updated_at_column();


-- public.approval_workflows definition

-- Drop table

-- DROP TABLE public.approval_workflows;

CREATE TABLE public.approval_workflows (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	workflow_type text NOT NULL,
	reference_id uuid NOT NULL,
	reference_table text NOT NULL,
	requested_by uuid NOT NULL,
	requested_at timestamptz DEFAULT now() NOT NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	rejection_reason text NULL,
	item_data jsonb NOT NULL,
	approval_reason text NULL,
	value_threshold numeric(15, 2) NULL,
	quantity_threshold int4 NULL,
	percentage_threshold numeric(5, 2) NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT approval_workflows_pkey PRIMARY KEY (id),
	CONSTRAINT approval_workflows_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text]))),
	CONSTRAINT approval_workflows_workflow_type_check CHECK ((workflow_type = ANY (ARRAY['purchase_order'::text, 'inventory_adjustment'::text, 'inventory_entry'::text, 'inventory_exit'::text])))
);
CREATE INDEX idx_approval_workflows_approved_by ON public.approval_workflows USING btree (approved_by) WHERE (approved_by IS NOT NULL);
CREATE INDEX idx_approval_workflows_org_id ON public.approval_workflows USING btree (org_id);
CREATE INDEX idx_approval_workflows_reference ON public.approval_workflows USING btree (reference_id, reference_table);
CREATE INDEX idx_approval_workflows_requested_by ON public.approval_workflows USING btree (requested_by);
CREATE INDEX idx_approval_workflows_status ON public.approval_workflows USING btree (status);
CREATE INDEX idx_approval_workflows_type ON public.approval_workflows USING btree (workflow_type);

-- Table Triggers

create trigger update_approval_workflows_updated_at before
update
    on
    public.approval_workflows for each row execute function update_updated_at_column();


-- public.budget_alerts definition

-- Drop table

-- DROP TABLE public.budget_alerts;

CREATE TABLE public.budget_alerts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	budget_id uuid NULL,
	alert_type varchar(50) NOT NULL,
	alert_message text NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	dismissed_at timestamptz NULL,
	dismissed_by uuid NULL,
	CONSTRAINT budget_alerts_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_budget_alerts_active ON public.budget_alerts USING btree (is_active);
CREATE INDEX idx_budget_alerts_budget ON public.budget_alerts USING btree (budget_id);
CREATE INDEX idx_budget_alerts_type ON public.budget_alerts USING btree (alert_type);

-- Table Triggers

create trigger trg_notify_budget_pending after
insert
    on
    public.budget_alerts for each row
    when ((new.is_active = true)) execute function notify_budget_pending();


-- public.budget_approvals definition

-- Drop table

-- DROP TABLE public.budget_approvals;

CREATE TABLE public.budget_approvals (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	budget_id uuid NULL,
	approval_type varchar(50) NOT NULL,
	approved_services jsonb DEFAULT '[]'::jsonb NULL,
	approved_parts jsonb DEFAULT '[]'::jsonb NULL,
	approved_amount numeric(12, 2) NULL,
	approval_method varchar(50) NOT NULL,
	approval_document jsonb DEFAULT '{}'::jsonb NULL,
	customer_signature text NULL,
	approval_notes text NULL,
	approved_by_customer varchar(255) NULL,
	approved_at timestamptz DEFAULT now() NULL,
	registered_by uuid NULL,
	org_id uuid NULL,
	CONSTRAINT budget_approvals_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_budget_approvals_budget ON public.budget_approvals USING btree (budget_id);
CREATE INDEX idx_budget_approvals_date ON public.budget_approvals USING btree (approved_at);
CREATE INDEX idx_budget_approvals_org_budget ON public.budget_approvals USING btree (org_id, budget_id);
CREATE INDEX idx_budget_approvals_org_id ON public.budget_approvals USING btree (org_id);
CREATE INDEX idx_budget_approvals_type ON public.budget_approvals USING btree (approval_type);

-- Table Triggers

create trigger trg_notify_budget_approved after
insert
    on
    public.budget_approvals for each row
    when (((new.approval_type)::text = any ((array['total'::character varying,
    'parcial'::character varying])::text[]))) execute function notify_budget_approved();
create trigger trigger_process_budget_approval after
insert
    on
    public.budget_approvals for each row execute function fn_process_budget_approval();
create trigger trigger_set_budget_approvals_org_id before
insert
    or
update
    on
    public.budget_approvals for each row execute function set_budget_approvals_org_id();


-- public.budgets definition

-- Drop table

-- DROP TABLE public.budgets;

CREATE TABLE public.budgets (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	component public."engine_component" NOT NULL,
	description text NOT NULL,
	labor_cost numeric(10, 2) DEFAULT 0.00 NULL,
	parts_cost numeric(10, 2) DEFAULT 0.00 NULL,
	total_cost numeric(10, 2) GENERATED ALWAYS AS ((labor_cost + parts_cost)) STORED NULL,
	status public."budget_status" DEFAULT 'pendente'::budget_status NULL,
	approved_at timestamptz NULL,
	approved_by text NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT budgets_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger trigger_generate_accounts_receivable after
update
    on
    public.budgets for each row execute function generate_accounts_receivable();
create trigger trigger_updated_at_budgets before
update
    on
    public.budgets for each row execute function update_updated_at_column();


-- public.cash_flow definition

-- Drop table

-- DROP TABLE public.cash_flow;

CREATE TABLE public.cash_flow (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"transaction_type" public."transaction_type" NOT NULL,
	amount numeric(15, 2) NOT NULL,
	description text NOT NULL,
	transaction_date date NOT NULL,
	"payment_method" public."payment_method" NULL,
	bank_account_id uuid NULL,
	accounts_receivable_id uuid NULL,
	accounts_payable_id uuid NULL,
	order_id uuid NULL,
	category_id uuid NULL,
	notes text NULL,
	reconciled bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT cash_flow_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_cash_flow_updated_at before
update
    on
    public.cash_flow for each row execute function update_updated_at_column();


-- public.commission_calculations definition

-- Drop table

-- DROP TABLE public.commission_calculations;

CREATE TABLE public.commission_calculations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	employee_id uuid NOT NULL,
	period_month int4 NOT NULL,
	period_year int4 NOT NULL,
	base_sales numeric(15, 2) DEFAULT 0 NULL,
	commission_rate numeric(5, 2) DEFAULT 0 NULL,
	calculated_commission numeric(15, 2) DEFAULT 0 NULL,
	bonus numeric(15, 2) DEFAULT 0 NULL,
	deductions numeric(15, 2) DEFAULT 0 NULL,
	final_commission numeric(15, 2) DEFAULT 0 NULL,
	status text DEFAULT 'calculated'::text NULL,
	approved_by uuid NULL,
	paid_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT commission_calculations_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_commission_calculations_updated_at before
update
    on
    public.commission_calculations for each row execute function update_updated_at_column();


-- public.company_fiscal_settings definition

-- Drop table

-- DROP TABLE public.company_fiscal_settings;

CREATE TABLE public.company_fiscal_settings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_name text NOT NULL,
	cnpj text NULL,
	state text NULL,
	municipality_code text NULL,
	regime_id uuid NOT NULL,
	effective_from date DEFAULT CURRENT_DATE NOT NULL,
	effective_to date NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT company_fiscal_settings_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_company_fiscal_settings_org_id ON public.company_fiscal_settings USING btree (org_id);

-- Table Triggers

create trigger trg_company_fiscal_settings_updated_at before
update
    on
    public.company_fiscal_settings for each row execute function set_updated_at();


-- public.customers definition

-- Drop table

-- DROP TABLE public.customers;

CREATE TABLE public.customers (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"type" public."customer_type" NOT NULL,
	"name" text NOT NULL,
	"document" text NOT NULL,
	phone text NOT NULL,
	email text NULL,
	address text NULL,
	workshop_name text NULL,
	workshop_cnpj text NULL,
	workshop_contact text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	created_by uuid NULL,
	org_id uuid NOT NULL,
	CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_customers_created_by ON public.customers USING btree (created_by);
CREATE INDEX idx_customers_org_id ON public.customers USING btree (org_id);

-- Table Triggers

create trigger trigger_set_customer_created_by before
insert
    on
    public.customers for each row execute function set_customer_created_by();
create trigger trigger_updated_at_customers before
update
    on
    public.customers for each row execute function update_updated_at_column();


-- public.detailed_budgets definition

-- Drop table

-- DROP TABLE public.detailed_budgets;

CREATE TABLE public.detailed_budgets (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	component public."engine_component" NOT NULL,
	diagnostic_response_id uuid NULL,
	budget_number varchar(50) NULL,
	services jsonb DEFAULT '[]'::jsonb NOT NULL,
	parts jsonb DEFAULT '[]'::jsonb NOT NULL,
	labor_hours numeric(6, 2) DEFAULT 0 NULL,
	labor_rate numeric(10, 2) DEFAULT 0 NULL,
	labor_total numeric(12, 2) DEFAULT 0 NULL,
	parts_total numeric(12, 2) DEFAULT 0 NULL,
	discount numeric(12, 2) DEFAULT 0 NULL,
	tax_percentage numeric(5, 2) DEFAULT 0 NULL,
	tax_amount numeric(12, 2) DEFAULT 0 NULL,
	total_amount numeric(12, 2) DEFAULT 0 NULL,
	estimated_delivery_days int4 DEFAULT 7 NULL,
	warranty_months int4 DEFAULT 3 NULL,
	status varchar(50) DEFAULT 'draft'::character varying NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	created_by uuid NULL,
	org_id uuid NULL,
	labor_description text NULL,
	CONSTRAINT detailed_budgets_budget_number_org_id_key UNIQUE (budget_number, org_id),
	CONSTRAINT detailed_budgets_pkey PRIMARY KEY (id),
	CONSTRAINT unique_budget_per_component UNIQUE (order_id, component)
);
CREATE INDEX idx_detailed_budgets_budget_number_pattern ON public.detailed_budgets USING btree (budget_number) WHERE (budget_number IS NOT NULL);
CREATE INDEX idx_detailed_budgets_component ON public.detailed_budgets USING btree (component);
CREATE INDEX idx_detailed_budgets_number ON public.detailed_budgets USING btree (budget_number);
CREATE INDEX idx_detailed_budgets_order ON public.detailed_budgets USING btree (order_id);
CREATE INDEX idx_detailed_budgets_org_budget ON public.detailed_budgets USING btree (org_id, budget_number) WHERE (budget_number IS NOT NULL);
COMMENT ON INDEX public.idx_detailed_budgets_org_budget IS 'Índice composto para otimizar buscas de orçamentos por organização e número.
Usado em consultas que filtram por org_id e budget_number simultaneamente.';
CREATE INDEX idx_detailed_budgets_org_id ON public.detailed_budgets USING btree (org_id);
COMMENT ON INDEX public.idx_detailed_budgets_org_id IS 'Índice para otimizar buscas de orçamentos por organização.
Usado pela função generate_budget_number() para encontrar o último número da org.';
CREATE INDEX idx_detailed_budgets_org_order ON public.detailed_budgets USING btree (org_id, order_id);
CREATE INDEX idx_detailed_budgets_status ON public.detailed_budgets USING btree (status);

-- Table Triggers

create trigger trigger_auto_generate_budget_number before
insert
    on
    public.detailed_budgets for each row execute function auto_generate_budget_number();
create trigger trigger_calculate_budget_totals before
insert
    or
update
    on
    public.detailed_budgets for each row execute function calculate_budget_totals();
create trigger trigger_set_detailed_budgets_org_id before
insert
    or
update
    on
    public.detailed_budgets for each row execute function set_detailed_budgets_org_id();


-- public.diagnostic_checklist_items definition

-- Drop table

-- DROP TABLE public.diagnostic_checklist_items;

CREATE TABLE public.diagnostic_checklist_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	checklist_id uuid NULL,
	item_name varchar(255) NOT NULL,
	item_description text NULL,
	item_type varchar(50) DEFAULT 'checkbox'::character varying NULL,
	item_options jsonb DEFAULT '[]'::jsonb NULL,
	is_required bool DEFAULT false NULL,
	triggers_service jsonb DEFAULT '[]'::jsonb NULL,
	expected_values jsonb DEFAULT '{}'::jsonb NULL,
	display_order int4 DEFAULT 0 NULL,
	help_text text NULL,
	CONSTRAINT diagnostic_checklist_items_pkey PRIMARY KEY (id),
	CONSTRAINT unique_item_per_checklist UNIQUE (checklist_id, item_name)
);
CREATE INDEX idx_diagnostic_checklist_items_checklist ON public.diagnostic_checklist_items USING btree (checklist_id);
CREATE INDEX idx_diagnostic_checklist_items_order ON public.diagnostic_checklist_items USING btree (display_order);


-- public.diagnostic_checklist_responses definition

-- Drop table

-- DROP TABLE public.diagnostic_checklist_responses;

CREATE TABLE public.diagnostic_checklist_responses (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	checklist_id uuid NULL,
	component public."engine_component" NOT NULL,
	responses jsonb DEFAULT '{}'::jsonb NOT NULL,
	photos jsonb DEFAULT '[]'::jsonb NULL,
	generated_services jsonb DEFAULT '[]'::jsonb NULL,
	diagnosed_by uuid NULL,
	diagnosed_at timestamptz DEFAULT now() NULL,
	status varchar(50) DEFAULT 'completed'::character varying NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	org_id uuid NULL,
	CONSTRAINT diagnostic_checklist_responses_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_diagnostic_checklist_responses_org_id ON public.diagnostic_checklist_responses USING btree (org_id);
CREATE INDEX idx_diagnostic_responses_component ON public.diagnostic_checklist_responses USING btree (component);
CREATE INDEX idx_diagnostic_responses_diagnosed_by ON public.diagnostic_checklist_responses USING btree (diagnosed_by);
CREATE INDEX idx_diagnostic_responses_order ON public.diagnostic_checklist_responses USING btree (order_id);

-- Table Triggers

create trigger trigger_set_diagnostic_response_org_id before
insert
    or
update
    on
    public.diagnostic_checklist_responses for each row execute function set_diagnostic_response_org_id();


-- public.diagnostic_checklists definition

-- Drop table

-- DROP TABLE public.diagnostic_checklists;

CREATE TABLE public.diagnostic_checklists (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	engine_type_id uuid NULL,
	component public."engine_component" NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"version" int4 DEFAULT 1 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	created_by uuid NULL,
	CONSTRAINT diagnostic_checklists_pkey PRIMARY KEY (id),
	CONSTRAINT unique_checklist_per_component UNIQUE (org_id, engine_type_id, component, name, version)
);
CREATE INDEX idx_diagnostic_checklists_component ON public.diagnostic_checklists USING btree (component);
CREATE INDEX idx_diagnostic_checklists_engine_type ON public.diagnostic_checklists USING btree (engine_type_id);
CREATE INDEX idx_diagnostic_checklists_org ON public.diagnostic_checklists USING btree (org_id);


-- public.employee_time_tracking definition

-- Drop table

-- DROP TABLE public.employee_time_tracking;

CREATE TABLE public.employee_time_tracking (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	employee_id uuid NOT NULL,
	"date" date NOT NULL,
	clock_in time NULL,
	clock_out time NULL,
	break_duration int4 DEFAULT 0 NULL,
	total_hours numeric(8, 2) NULL,
	overtime_hours numeric(8, 2) DEFAULT 0 NULL,
	status text DEFAULT 'present'::text NULL,
	notes text NULL,
	approved_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT employee_time_tracking_pkey PRIMARY KEY (id)
);


-- public.employees definition

-- Drop table

-- DROP TABLE public.employees;

CREATE TABLE public.employees (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	employee_number text NOT NULL,
	user_id uuid NULL,
	full_name text NOT NULL,
	cpf text NULL,
	hire_date date DEFAULT CURRENT_DATE NULL,
	"position" text NOT NULL,
	department text NULL,
	salary numeric(15, 2) NULL,
	hourly_rate numeric(8, 2) NULL,
	commission_rate numeric(5, 2) DEFAULT 0 NULL,
	is_active bool DEFAULT true NULL,
	phone text NULL,
	email text NULL,
	address text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT employees_cpf_key UNIQUE (cpf),
	CONSTRAINT employees_employee_number_key UNIQUE (employee_number),
	CONSTRAINT employees_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_employees_updated_at before
update
    on
    public.employees for each row execute function update_updated_at_column();


-- public.engine_types definition

-- Drop table

-- DROP TABLE public.engine_types;

CREATE TABLE public.engine_types (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	"name" varchar(255) NOT NULL,
	category varchar(100) NOT NULL,
	description text NULL,
	technical_standards jsonb DEFAULT '[]'::jsonb NULL,
	required_components public._engine_component DEFAULT '{bloco,eixo,biela,comando,cabecote}'::engine_component[] NULL,
	special_requirements jsonb DEFAULT '{}'::jsonb NULL,
	default_warranty_months int4 DEFAULT 3 NULL,
	is_active bool DEFAULT true NULL,
	display_order int4 DEFAULT 0 NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT engine_types_pkey PRIMARY KEY (id),
	CONSTRAINT unique_engine_type_per_org UNIQUE (org_id, name)
);
CREATE INDEX idx_engine_types_category ON public.engine_types USING btree (category);
CREATE INDEX idx_engine_types_org ON public.engine_types USING btree (org_id);


-- public.engines definition

-- Drop table

-- DROP TABLE public.engines;

CREATE TABLE public.engines (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	brand text NOT NULL,
	model text NOT NULL,
	fuel_type text NOT NULL,
	serial_number text NULL,
	is_complete bool DEFAULT false NULL,
	assembly_state text NULL,
	has_block bool DEFAULT false NULL,
	has_head bool DEFAULT false NULL,
	has_crankshaft bool DEFAULT false NULL,
	has_piston bool DEFAULT false NULL,
	has_connecting_rod bool DEFAULT false NULL,
	turns_manually bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	engine_type_id uuid NULL,
	reception_form_data jsonb DEFAULT '{}'::jsonb NULL,
	org_id uuid NULL,
	CONSTRAINT engines_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_engines_org_id ON public.engines USING btree (org_id);

-- Table Triggers

create trigger bosch_auto_identification_trigger before
insert
    or
update
    on
    public.engines for each row execute function identify_bosch_components();
create trigger trigger_updated_at_engines before
update
    on
    public.engines for each row execute function update_updated_at_column();


-- public.entry_form_fields definition

-- Drop table

-- DROP TABLE public.entry_form_fields;

CREATE TABLE public.entry_form_fields (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	template_id uuid NULL,
	field_name varchar(100) NOT NULL,
	field_label varchar(255) NOT NULL,
	field_type varchar(50) NOT NULL,
	field_options jsonb DEFAULT '[]'::jsonb NULL,
	is_required bool DEFAULT false NULL,
	default_value text NULL,
	validation_rules jsonb DEFAULT '{}'::jsonb NULL,
	display_order int4 DEFAULT 0 NULL,
	help_text text NULL,
	CONSTRAINT entry_form_fields_pkey PRIMARY KEY (id),
	CONSTRAINT unique_field_per_template UNIQUE (template_id, field_name)
);


-- public.entry_form_submissions definition

-- Drop table

-- DROP TABLE public.entry_form_submissions;

CREATE TABLE public.entry_form_submissions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	template_id uuid NULL,
	order_id uuid NULL,
	form_data jsonb DEFAULT '{}'::jsonb NOT NULL,
	submitted_by uuid NULL,
	submitted_at timestamptz DEFAULT now() NULL,
	status varchar(50) DEFAULT 'completed'::character varying NULL,
	generated_services jsonb DEFAULT '[]'::jsonb NULL,
	CONSTRAINT entry_form_submissions_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_form_submissions_date ON public.entry_form_submissions USING btree (submitted_at);
CREATE INDEX idx_form_submissions_order ON public.entry_form_submissions USING btree (order_id);
CREATE INDEX idx_form_submissions_template ON public.entry_form_submissions USING btree (template_id);


-- public.entry_form_templates definition

-- Drop table

-- DROP TABLE public.entry_form_templates;

CREATE TABLE public.entry_form_templates (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	engine_type_id uuid NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	layout_type varchar(50) DEFAULT 'service_list'::character varying NULL,
	"version" int4 DEFAULT 1 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	created_by uuid NULL,
	CONSTRAINT entry_form_templates_pkey PRIMARY KEY (id),
	CONSTRAINT unique_template_name_per_org UNIQUE (org_id, name, version)
);


-- public.environment_reservations definition

-- Drop table

-- DROP TABLE public.environment_reservations;

CREATE TABLE public.environment_reservations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	environment_id uuid NULL,
	order_id uuid NULL,
	component public."engine_component" NOT NULL,
	workflow_step_key varchar(50) NOT NULL,
	reserved_from timestamptz NOT NULL,
	reserved_until timestamptz NOT NULL,
	actual_start timestamptz NULL,
	actual_end timestamptz NULL,
	reservation_status varchar(50) DEFAULT 'reserved'::character varying NULL,
	reserved_by uuid NULL,
	notes text NULL,
	org_id uuid NULL,
	CONSTRAINT environment_reservations_pkey PRIMARY KEY (id)
);


-- public.fiscal_audit_log definition

-- Drop table

-- DROP TABLE public.fiscal_audit_log;

CREATE TABLE public.fiscal_audit_log (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	table_name text NOT NULL,
	record_id uuid NOT NULL,
	operation text NOT NULL,
	old_values jsonb NULL,
	new_values jsonb NULL,
	user_id uuid NULL,
	"timestamp" timestamptz DEFAULT now() NULL,
	ip_address inet NULL,
	user_agent text NULL,
	CONSTRAINT fiscal_audit_log_operation_check CHECK ((operation = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text]))),
	CONSTRAINT fiscal_audit_log_pkey PRIMARY KEY (id)
);


-- public.fiscal_classifications definition

-- Drop table

-- DROP TABLE public.fiscal_classifications;

CREATE TABLE public.fiscal_classifications (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"type" public."classification_type" NOT NULL,
	ncm_code text NULL,
	service_code text NULL,
	cest text NULL,
	description text NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT fiscal_classifications_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_fiscal_classifications_org_id ON public.fiscal_classifications USING btree (org_id);

-- Table Triggers

create trigger trg_fiscal_class_updated_at before
update
    on
    public.fiscal_classifications for each row execute function set_updated_at();


-- public.inventory_count_items definition

-- Drop table

-- DROP TABLE public.inventory_count_items;

CREATE TABLE public.inventory_count_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	count_id uuid NOT NULL,
	part_id uuid NOT NULL,
	expected_quantity int4 NOT NULL,
	counted_quantity int4 NULL,
	difference int4 GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED NULL,
	unit_cost numeric(10, 2) NULL,
	notes text NULL,
	counted_by uuid NULL,
	counted_at timestamptz NULL,
	CONSTRAINT inventory_count_items_pkey PRIMARY KEY (id),
	CONSTRAINT unique_part_per_count UNIQUE (count_id, part_id)
);
CREATE INDEX idx_inventory_count_items_count_id ON public.inventory_count_items USING btree (count_id);
CREATE INDEX idx_inventory_count_items_part_id ON public.inventory_count_items USING btree (part_id);


-- public.inventory_counts definition

-- Drop table

-- DROP TABLE public.inventory_counts;

CREATE TABLE public.inventory_counts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	count_number text NOT NULL,
	count_date date NOT NULL,
	status text DEFAULT 'draft'::text NOT NULL,
	counted_by uuid NULL,
	reviewed_by uuid NULL,
	notes text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	completed_at timestamptz NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	count_type text DEFAULT 'total'::text NULL,
	category_filter text NULL,
	location_filter text NULL,
	high_rotation_only bool DEFAULT false NULL,
	CONSTRAINT inventory_counts_count_type_check CHECK ((count_type = ANY (ARRAY['total'::text, 'partial'::text, 'cyclic'::text]))),
	CONSTRAINT inventory_counts_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_counts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text]))),
	CONSTRAINT unique_count_number_per_org UNIQUE (org_id, count_number)
);
CREATE INDEX idx_inventory_counts_count_date ON public.inventory_counts USING btree (count_date DESC);
CREATE INDEX idx_inventory_counts_org_id ON public.inventory_counts USING btree (org_id);
CREATE INDEX idx_inventory_counts_status ON public.inventory_counts USING btree (status);

-- Table Triggers

create trigger update_inventory_counts_updated_at before
update
    on
    public.inventory_counts for each row execute function update_updated_at_column();


-- public.inventory_movements definition

-- Drop table

-- DROP TABLE public.inventory_movements;

CREATE TABLE public.inventory_movements (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	part_id uuid NOT NULL,
	movement_type text NOT NULL,
	quantity int4 NOT NULL,
	previous_quantity int4 NOT NULL,
	new_quantity int4 NOT NULL,
	unit_cost numeric(10, 2) NULL,
	order_id uuid NULL,
	budget_id uuid NULL,
	reason text NOT NULL,
	notes text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	requires_approval bool DEFAULT false NULL,
	approval_status text DEFAULT 'approved'::text NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	rejection_reason text NULL,
	CONSTRAINT inventory_movements_approval_status_check CHECK ((approval_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
	CONSTRAINT inventory_movements_movement_type_check CHECK ((movement_type = ANY (ARRAY['entrada'::text, 'saida'::text, 'ajuste'::text, 'transferencia'::text, 'reserva'::text, 'baixa'::text]))),
	CONSTRAINT inventory_movements_pkey PRIMARY KEY (id),
	CONSTRAINT inventory_movements_quantity_check CHECK ((quantity <> 0))
);
CREATE INDEX idx_inventory_movements_budget_id ON public.inventory_movements USING btree (budget_id) WHERE (budget_id IS NOT NULL);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements USING btree (created_at DESC);
CREATE INDEX idx_inventory_movements_order_id ON public.inventory_movements USING btree (order_id) WHERE (order_id IS NOT NULL);
CREATE INDEX idx_inventory_movements_org_id ON public.inventory_movements USING btree (org_id);
CREATE INDEX idx_inventory_movements_part_id ON public.inventory_movements USING btree (part_id);
CREATE INDEX idx_inventory_movements_type ON public.inventory_movements USING btree (movement_type);

-- Table Triggers

create trigger trigger_check_movement_approval before
insert
    on
    public.inventory_movements for each row execute function check_movement_approval_required();
create trigger trigger_check_stock_alerts after
insert
    or
update
    on
    public.inventory_movements for each row
    when ((new.approval_status = 'approved'::text)) execute function check_stock_alerts();
create trigger trigger_update_inventory_on_movement after
insert
    on
    public.inventory_movements for each row execute function update_inventory_on_movement();
create trigger trigger_validate_inventory_movement before
insert
    on
    public.inventory_movements for each row execute function validate_inventory_movement();


-- public.jurisdiction_config definition

-- Drop table

-- DROP TABLE public.jurisdiction_config;

CREATE TABLE public.jurisdiction_config (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	"jurisdiction" text NOT NULL,
	badge_color text NOT NULL,
	text_color text NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT jurisdiction_config_org_id_jurisdiction_key UNIQUE (org_id, jurisdiction),
	CONSTRAINT jurisdiction_config_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_jurisdiction_config_updated_at before
update
    on
    public.jurisdiction_config for each row execute function update_jurisdiction_config_updated_at();


-- public.kpi_targets definition

-- Drop table

-- DROP TABLE public.kpi_targets;

CREATE TABLE public.kpi_targets (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	kpi_id uuid NULL,
	target_value numeric NOT NULL,
	period_type text NOT NULL,
	valid_from date DEFAULT CURRENT_DATE NOT NULL,
	valid_to date NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	goal_type text DEFAULT 'kpi'::text NULL,
	progress_current numeric DEFAULT 0 NULL,
	progress_unit text DEFAULT 'number'::text NULL,
	status text DEFAULT 'pending'::text NULL,
	assigned_to _uuid NULL,
	priority text DEFAULT 'medium'::text NULL,
	parent_goal_id uuid NULL,
	milestones jsonb DEFAULT '[]'::jsonb NULL,
	notifications_enabled bool DEFAULT true NULL,
	auto_update_from_kpi bool DEFAULT true NULL,
	description text NULL,
	target_period_start timestamptz DEFAULT now() NULL,
	target_period_end timestamptz NULL,
	CONSTRAINT kpi_targets_goal_type_check CHECK ((goal_type = ANY (ARRAY['kpi'::text, 'custom'::text, 'project'::text]))),
	CONSTRAINT kpi_targets_pkey PRIMARY KEY (id),
	CONSTRAINT kpi_targets_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
	CONSTRAINT kpi_targets_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'on_track'::text, 'at_risk'::text, 'delayed'::text, 'completed'::text])))
);
CREATE INDEX idx_kpi_targets_goal_type ON public.kpi_targets USING btree (goal_type);
CREATE INDEX idx_kpi_targets_org_id ON public.kpi_targets USING btree (org_id);
CREATE INDEX idx_kpi_targets_parent_goal ON public.kpi_targets USING btree (parent_goal_id);
CREATE INDEX idx_kpi_targets_priority ON public.kpi_targets USING btree (priority);
CREATE INDEX idx_kpi_targets_status ON public.kpi_targets USING btree (status);

-- Table Triggers

create trigger trigger_update_goal_status before
insert
    or
update
    of progress_current,
    target_value,
    target_period_end on
    public.kpi_targets for each row execute function update_goal_status();
create trigger update_kpi_targets_updated_at before
update
    on
    public.kpi_targets for each row execute function update_updated_at_column();


-- public.obligation_files definition

-- Drop table

-- DROP TABLE public.obligation_files;

CREATE TABLE public.obligation_files (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	obligation_id uuid NOT NULL,
	file_path text NOT NULL,
	file_name text NOT NULL,
	file_type text NOT NULL,
	mime_type text NULL,
	size_bytes int4 NULL,
	hash_sha256 text NULL,
	generated_by uuid NULL,
	generated_at timestamptz DEFAULT now() NOT NULL,
	status text DEFAULT 'success'::text NOT NULL,
	error_message text NULL,
	CONSTRAINT obligation_files_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_obligation_files_obligation ON public.obligation_files USING btree (obligation_id);
CREATE INDEX obligation_files_generated_at_idx ON public.obligation_files USING btree (generated_at);
CREATE INDEX obligation_files_obligation_id_idx ON public.obligation_files USING btree (obligation_id);

-- Table Triggers

create trigger update_obligation_files_updated_at before
update
    on
    public.obligation_files for each row execute function update_updated_at_column();


-- public.obligation_kinds definition

-- Drop table

-- DROP TABLE public.obligation_kinds;

CREATE TABLE public.obligation_kinds (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT obligation_kinds_code_key UNIQUE (code),
	CONSTRAINT obligation_kinds_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_obligation_kinds_org_id ON public.obligation_kinds USING btree (org_id);

-- Table Triggers

create trigger trg_obligation_kinds_updated_at before
update
    on
    public.obligation_kinds for each row execute function set_updated_at();


-- public.obligations definition

-- Drop table

-- DROP TABLE public.obligations;

CREATE TABLE public.obligations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	obligation_kind_id uuid NOT NULL,
	period_month int4 NOT NULL,
	period_year int4 NOT NULL,
	status public."filing_status" DEFAULT 'rascunho'::filing_status NOT NULL,
	generated_file_path text NULL,
	protocol text NULL,
	started_at timestamptz NULL,
	finished_at timestamptz NULL,
	message text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	created_by uuid NULL,
	org_id uuid NULL,
	CONSTRAINT obligations_obligation_kind_id_period_year_period_month_key UNIQUE (obligation_kind_id, period_year, period_month),
	CONSTRAINT obligations_period_month_check CHECK (((period_month >= 1) AND (period_month <= 12))),
	CONSTRAINT obligations_period_year_check CHECK (((period_year >= 2000) AND (period_year <= 2100))),
	CONSTRAINT obligations_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_obligations_created_by ON public.obligations USING btree (created_by);
CREATE INDEX idx_obligations_kind_period ON public.obligations USING btree (obligation_kind_id, period_year, period_month);
CREATE INDEX idx_obligations_org_id ON public.obligations USING btree (org_id);
CREATE INDEX idx_obligations_period ON public.obligations USING btree (period_year, period_month);

-- Table Triggers

create trigger trg_obligations_updated_at before
update
    on
    public.obligations for each row execute function set_updated_at();
create trigger update_obligations_updated_at before
update
    on
    public.obligations for each row execute function update_updated_at_column();


-- public.order_materials definition

-- Drop table

-- DROP TABLE public.order_materials;

CREATE TABLE public.order_materials (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	part_id uuid NULL,
	quantity int4 DEFAULT 1 NOT NULL,
	unit_cost numeric(10, 2) DEFAULT 0.00 NULL,
	total_cost numeric(10, 2) GENERATED ALWAYS AS ((quantity::numeric * unit_cost)) STORED NULL,
	used_at timestamptz DEFAULT now() NULL,
	used_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	part_name text NOT NULL,
	part_code text NULL,
	notes text NULL,
	CONSTRAINT order_materials_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_order_materials_updated_at before
update
    on
    public.order_materials for each row execute function update_updated_at_column();


-- public.order_photos definition

-- Drop table

-- DROP TABLE public.order_photos;

CREATE TABLE public.order_photos (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	component public."engine_component" NULL,
	workflow_step public."workflow_status" NULL,
	photo_type text NOT NULL,
	file_path text NOT NULL,
	file_name text NOT NULL,
	description text NULL,
	uploaded_by text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT order_photos_pkey PRIMARY KEY (id)
);


-- public.order_status_history definition

-- Drop table

-- DROP TABLE public.order_status_history;

CREATE TABLE public.order_status_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	old_status text NULL,
	new_status text NOT NULL,
	changed_by uuid NULL,
	changed_at timestamptz DEFAULT now() NOT NULL,
	notes text NULL,
	org_id uuid NULL,
	CONSTRAINT order_status_history_pkey PRIMARY KEY (id)
);


-- public.order_warranties definition

-- Drop table

-- DROP TABLE public.order_warranties;

CREATE TABLE public.order_warranties (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	warranty_type text NOT NULL,
	start_date date NOT NULL,
	end_date date NOT NULL,
	terms text NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT order_warranties_pkey PRIMARY KEY (id),
	CONSTRAINT order_warranties_warranty_type_check CHECK ((warranty_type = ANY (ARRAY['pecas'::text, 'servico'::text, 'total'::text])))
);
CREATE INDEX idx_order_warranties_order ON public.order_warranties USING btree (order_id, is_active);

-- Table Triggers

create trigger update_order_warranties_updated_at before
update
    on
    public.order_warranties for each row execute function update_updated_at_column();


-- public.order_workflow definition

-- Drop table

-- DROP TABLE public.order_workflow;

CREATE TABLE public.order_workflow (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	component public."engine_component" NOT NULL,
	status public."workflow_status" DEFAULT 'entrada'::workflow_status NULL,
	started_at timestamptz NULL,
	completed_at timestamptz NULL,
	notes text NULL,
	assigned_to text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	workflow_step_id uuid NULL,
	requires_approval bool DEFAULT false NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	estimated_completion timestamptz NULL,
	actual_hours numeric(5, 2) DEFAULT 0 NULL,
	CONSTRAINT order_workflow_order_id_component_key UNIQUE (order_id, component),
	CONSTRAINT order_workflow_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_order_workflow_status_pending ON public.order_workflow USING btree (status, component) WHERE ((started_at IS NOT NULL) AND (completed_at IS NULL));

-- Table Triggers

create trigger trigger_check_mandatory_checklists before
update
    on
    public.order_workflow for each row
    when ((old.status is distinct
from
    new.status)) execute function check_mandatory_checklists_before_workflow_advance();
create trigger trigger_updated_at_order_workflow before
update
    on
    public.order_workflow for each row execute function update_updated_at_column();


-- public.orders definition

-- Drop table

-- DROP TABLE public.orders;

CREATE TABLE public.orders (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_number text NOT NULL,
	customer_id uuid NOT NULL,
	consultant_id uuid NOT NULL,
	engine_id uuid NOT NULL,
	collection_date date NOT NULL,
	collection_time time NOT NULL,
	collection_location text NOT NULL,
	driver_name text NOT NULL,
	failure_reason text NULL,
	status public."order_status" DEFAULT 'ativa'::order_status NULL,
	initial_observations text NULL,
	final_observations text NULL,
	estimated_delivery date NULL,
	actual_delivery date NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NOT NULL,
	priority int4 DEFAULT 1 NULL,
	warranty_months int4 DEFAULT 3 NULL,
	created_by uuid NULL,
	CONSTRAINT orders_order_number_key UNIQUE (order_number),
	CONSTRAINT orders_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_orders_created_by ON public.orders USING btree (created_by);
CREATE INDEX idx_orders_org_created_by ON public.orders USING btree (org_id, created_by);
CREATE INDEX idx_orders_org_id ON public.orders USING btree (org_id);
CREATE INDEX idx_orders_status_created_by ON public.orders USING btree (status, created_by) WHERE (created_by IS NOT NULL);

-- Table Triggers

create trigger create_warranty_trigger after
update
    on
    public.orders for each row execute function create_order_warranty();
create trigger order_status_change_trigger after
update
    on
    public.orders for each row execute function log_order_status_change();
create trigger trg_order_delivered_warranty after
update
    on
    public.orders for each row execute function fn_create_order_warranty();
create trigger trigger_create_workflow after
insert
    on
    public.orders for each row execute function create_default_workflow();
create trigger trigger_set_order_created_by before
insert
    on
    public.orders for each row execute function set_order_created_by();
create trigger trigger_set_order_number before
insert
    on
    public.orders for each row execute function set_order_number();
create trigger trigger_updated_at_orders before
update
    on
    public.orders for each row execute function update_updated_at_column();


-- public.organization_themes definition

-- Drop table

-- DROP TABLE public.organization_themes;

CREATE TABLE public.organization_themes (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	theme_name text DEFAULT 'default'::text NOT NULL,
	primary_color text DEFAULT '#FF6B35'::text NOT NULL,
	secondary_color text DEFAULT '#004E89'::text NOT NULL,
	accent_color text DEFAULT '#00A8CC'::text NOT NULL,
	success_color text DEFAULT '#28A745'::text NOT NULL,
	warning_color text DEFAULT '#FFC107'::text NOT NULL,
	error_color text DEFAULT '#DC3545'::text NOT NULL,
	info_color text DEFAULT '#17A2B8'::text NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT organization_themes_org_id_theme_name_key UNIQUE (org_id, theme_name),
	CONSTRAINT organization_themes_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_organization_themes_updated_at before
update
    on
    public.organization_themes for each row execute function update_organization_themes_updated_at();


-- public.organization_users definition

-- Drop table

-- DROP TABLE public.organization_users;

CREATE TABLE public.organization_users (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	organization_id uuid NOT NULL,
	user_id uuid NOT NULL,
	"role" public."app_role" DEFAULT 'user'::app_role NOT NULL,
	invited_at timestamptz DEFAULT now() NULL,
	joined_at timestamptz NULL,
	invited_by uuid NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT organization_users_organization_id_user_id_key UNIQUE (organization_id, user_id),
	CONSTRAINT organization_users_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_org_users_org_id ON public.organization_users USING btree (organization_id);
CREATE INDEX idx_org_users_role ON public.organization_users USING btree (role);
CREATE INDEX idx_org_users_user_id ON public.organization_users USING btree (user_id);

-- Table Triggers

create trigger update_organization_users_updated_at before
update
    on
    public.organization_users for each row execute function update_updated_at_column();


-- public.organizations definition

-- Drop table

-- DROP TABLE public.organizations;

CREATE TABLE public.organizations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	slug text NOT NULL,
	description text NULL,
	settings jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	created_by uuid NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	CONSTRAINT organizations_pkey PRIMARY KEY (id),
	CONSTRAINT organizations_slug_key UNIQUE (slug)
);
CREATE INDEX idx_organizations_created_by ON public.organizations USING btree (created_by);
CREATE INDEX idx_organizations_is_active ON public.organizations USING btree (is_active);
CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);

-- Table Triggers

create trigger update_organizations_updated_at before
update
    on
    public.organizations for each row execute function update_updated_at_column();


-- public.parts_inventory definition

-- Drop table

-- DROP TABLE public.parts_inventory;

CREATE TABLE public.parts_inventory (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	part_name text NOT NULL,
	part_code text NULL,
	quantity int4 DEFAULT 1 NOT NULL,
	unit_cost numeric(10, 2) DEFAULT 0.00 NULL,
	supplier text NULL,
	component public."engine_component" NULL,
	status text DEFAULT 'pendente'::text NULL,
	separated_at timestamptz NULL,
	applied_at timestamptz NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT parts_inventory_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_parts_inventory_org_component ON public.parts_inventory USING btree (org_id, component);
CREATE INDEX idx_parts_inventory_org_id ON public.parts_inventory USING btree (org_id);
CREATE INDEX idx_parts_inventory_org_status ON public.parts_inventory USING btree (org_id, status);

-- Table Triggers

create trigger trg_auto_reorder_on_low_stock after
update
    of quantity on
    public.parts_inventory for each row
    when ((new.quantity < old.quantity)) execute function check_stock_and_create_purchase_need();
create trigger trg_stock_minimum_alert after
update
    of quantity on
    public.parts_inventory for each row
    when ((new.quantity < old.quantity)) execute function fn_check_stock_minimum();
create trigger trigger_check_minimum_stock after
update
    on
    public.parts_inventory for each row
    when ((old.quantity is distinct
from
    new.quantity)) execute function check_minimum_stock_levels();
create trigger trigger_create_inventory_movement_on_part_insert after
insert
    on
    public.parts_inventory for each row
    when ((new.quantity > 0)) execute function create_inventory_movement_on_part_insert();
create trigger trigger_set_parts_inventory_org_id before
insert
    or
update
    on
    public.parts_inventory for each row execute function set_parts_inventory_org_id();
create trigger trigger_update_stock_status before
update
    on
    public.parts_inventory for each row execute function update_stock_status_on_zero();
create trigger validate_bosch_parts_trigger before
insert
    or
update
    on
    public.parts_inventory for each row execute function validate_bosch_parts();


-- public.parts_price_table definition

-- Drop table

-- DROP TABLE public.parts_price_table;

CREATE TABLE public.parts_price_table (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	part_code varchar(100) NOT NULL,
	part_name varchar(255) NOT NULL,
	part_description text NULL,
	compatible_components public._engine_component DEFAULT '{}'::engine_component[] NULL,
	unit_price numeric(10, 2) NOT NULL,
	cost_price numeric(10, 2) NULL,
	margin_percentage numeric(5, 2) DEFAULT 30.0 NULL,
	supplier varchar(255) NULL,
	is_active bool DEFAULT true NULL,
	last_updated timestamptz DEFAULT now() NULL,
	CONSTRAINT parts_price_table_pkey PRIMARY KEY (id),
	CONSTRAINT unique_part_per_org UNIQUE (org_id, part_code)
);
CREATE INDEX idx_parts_price_table_code ON public.parts_price_table USING btree (part_code);
CREATE INDEX idx_parts_price_table_org ON public.parts_price_table USING btree (org_id);


-- public.parts_reservations definition

-- Drop table

-- DROP TABLE public.parts_reservations;

CREATE TABLE public.parts_reservations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	budget_id uuid NULL,
	part_id uuid NULL,
	part_code varchar(100) NOT NULL,
	part_name varchar(255) NOT NULL,
	quantity_reserved int4 DEFAULT 1 NOT NULL,
	quantity_separated int4 DEFAULT 0 NULL,
	quantity_applied int4 DEFAULT 0 NULL,
	unit_cost numeric(10, 2) DEFAULT 0 NULL,
	total_reserved_cost numeric(12, 2) GENERATED ALWAYS AS ((quantity_reserved::numeric * unit_cost)) STORED NULL,
	reservation_status varchar(50) DEFAULT 'reserved'::character varying NULL,
	reserved_at timestamptz DEFAULT now() NULL,
	reserved_by uuid NULL,
	separated_at timestamptz NULL,
	separated_by uuid NULL,
	applied_at timestamptz NULL,
	applied_by uuid NULL,
	notes text NULL,
	org_id uuid NULL,
	expires_at timestamptz DEFAULT now() + '30 days'::interval NULL,
	cancelled_at timestamptz NULL,
	cancelled_by uuid NULL,
	cancellation_reason text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT parts_reservations_pkey PRIMARY KEY (id),
	CONSTRAINT parts_reservations_reservation_status_check CHECK (((reservation_status)::text = ANY ((ARRAY['reserved'::character varying, 'partial'::character varying, 'separated'::character varying, 'applied'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[]))),
	CONSTRAINT valid_quantities CHECK (((quantity_separated <= quantity_reserved) AND (quantity_applied <= quantity_separated)))
);
CREATE INDEX idx_parts_reservations_budget ON public.parts_reservations USING btree (budget_id);
CREATE INDEX idx_parts_reservations_budget_id ON public.parts_reservations USING btree (budget_id) WHERE (budget_id IS NOT NULL);
CREATE INDEX idx_parts_reservations_expires_at ON public.parts_reservations USING btree (expires_at) WHERE ((reservation_status)::text = ANY ((ARRAY['reserved'::character varying, 'partial'::character varying, 'separated'::character varying])::text[]));
CREATE INDEX idx_parts_reservations_order ON public.parts_reservations USING btree (order_id);
CREATE INDEX idx_parts_reservations_order_budget ON public.parts_reservations USING btree (order_id, budget_id);
CREATE INDEX idx_parts_reservations_org ON public.parts_reservations USING btree (org_id);
CREATE INDEX idx_parts_reservations_part_code ON public.parts_reservations USING btree (part_code);
CREATE INDEX idx_parts_reservations_part_id ON public.parts_reservations USING btree (part_id) WHERE (part_id IS NOT NULL);
CREATE INDEX idx_parts_reservations_status ON public.parts_reservations USING btree (reservation_status);
CREATE INDEX idx_parts_reservations_status_org ON public.parts_reservations USING btree (reservation_status, org_id);
CREATE UNIQUE INDEX idx_unique_reservation_per_budget_part ON public.parts_reservations USING btree (budget_id, part_code, order_id) WHERE ((budget_id IS NOT NULL) AND ((reservation_status)::text = ANY ((ARRAY['reserved'::character varying, 'partial'::character varying, 'separated'::character varying])::text[])));
COMMENT ON INDEX public.idx_unique_reservation_per_budget_part IS 'Evita criar múltiplas reservas para a mesma peça no mesmo orçamento e ordem de serviço';

-- Table Triggers

create trigger trigger_update_reservations_updated_at before
update
    on
    public.parts_reservations for each row execute function update_reservations_updated_at();


-- public.parts_stock_config definition

-- Drop table

-- DROP TABLE public.parts_stock_config;

CREATE TABLE public.parts_stock_config (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	part_code varchar(100) NOT NULL,
	part_name varchar(255) NOT NULL,
	minimum_stock int4 DEFAULT 5 NULL,
	maximum_stock int4 DEFAULT 50 NULL,
	reorder_point int4 DEFAULT 10 NULL,
	economic_order_quantity int4 DEFAULT 20 NULL,
	lead_time_days int4 DEFAULT 7 NULL,
	safety_stock int4 DEFAULT 3 NULL,
	abc_classification varchar(1) DEFAULT 'C'::character varying NULL,
	rotation_frequency varchar(20) DEFAULT 'medium'::character varying NULL,
	is_critical bool DEFAULT false NULL,
	auto_reorder_enabled bool DEFAULT false NULL,
	preferred_supplier_id uuid NULL,
	last_updated timestamptz DEFAULT now() NULL,
	updated_by uuid NULL,
	CONSTRAINT parts_stock_config_pkey PRIMARY KEY (id),
	CONSTRAINT unique_stock_config_per_org UNIQUE (org_id, part_code)
);
CREATE INDEX idx_parts_stock_config_critical ON public.parts_stock_config USING btree (is_critical);
CREATE INDEX idx_parts_stock_config_org ON public.parts_stock_config USING btree (org_id);
CREATE INDEX idx_parts_stock_config_part ON public.parts_stock_config USING btree (part_code);


-- public.performance_rankings definition

-- Drop table

-- DROP TABLE public.performance_rankings;

CREATE TABLE public.performance_rankings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	user_id uuid NULL,
	period_type text NOT NULL,
	period_start date NOT NULL,
	period_end date NOT NULL,
	total_points int4 DEFAULT 0 NULL,
	rank_position int4 NULL,
	metrics jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT performance_rankings_org_id_user_id_period_type_period_star_key UNIQUE (org_id, user_id, period_type, period_start),
	CONSTRAINT performance_rankings_period_type_check CHECK ((period_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text]))),
	CONSTRAINT performance_rankings_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_performance_rankings_org_period ON public.performance_rankings USING btree (org_id, period_type, period_start);
CREATE INDEX idx_performance_rankings_rank ON public.performance_rankings USING btree (rank_position);
CREATE INDEX idx_performance_rankings_user ON public.performance_rankings USING btree (user_id);


-- public.performance_reviews definition

-- Drop table

-- DROP TABLE public.performance_reviews;

CREATE TABLE public.performance_reviews (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	employee_id uuid NOT NULL,
	reviewer_id uuid NOT NULL,
	review_period_start date NOT NULL,
	review_period_end date NOT NULL,
	overall_rating numeric(3, 2) NULL,
	productivity_score numeric(3, 2) NULL,
	quality_score numeric(3, 2) NULL,
	punctuality_score numeric(3, 2) NULL,
	teamwork_score numeric(3, 2) NULL,
	goals text NULL,
	achievements text NULL,
	improvement_areas text NULL,
	"comments" text NULL,
	status text DEFAULT 'draft'::text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT performance_reviews_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_performance_reviews_updated_at before
update
    on
    public.performance_reviews for each row execute function update_updated_at_column();


-- public.production_alerts definition

-- Drop table

-- DROP TABLE public.production_alerts;

CREATE TABLE public.production_alerts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	alert_type text NOT NULL,
	title text NOT NULL,
	message text NOT NULL,
	severity text DEFAULT 'warning'::text NULL,
	order_id uuid NULL,
	schedule_id uuid NULL,
	is_read bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT production_alerts_pkey PRIMARY KEY (id)
);


-- public.production_schedules definition

-- Drop table

-- DROP TABLE public.production_schedules;

CREATE TABLE public.production_schedules (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	component public."engine_component" NOT NULL,
	planned_start_date date NOT NULL,
	planned_end_date date NOT NULL,
	actual_start_date date NULL,
	actual_end_date date NULL,
	estimated_hours numeric(8, 2) DEFAULT 0 NULL,
	actual_hours numeric(8, 2) DEFAULT 0 NULL,
	priority int4 DEFAULT 1 NULL,
	status text DEFAULT 'planned'::text NULL,
	assigned_to text NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NOT NULL,
	CONSTRAINT production_schedules_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_production_schedules_updated_at before
update
    on
    public.production_schedules for each row execute function update_updated_at_column();


-- public.profile_page_permissions definition

-- Drop table

-- DROP TABLE public.profile_page_permissions;

CREATE TABLE public.profile_page_permissions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	profile_id uuid NULL,
	page_id uuid NULL,
	can_view bool DEFAULT true NULL,
	can_edit bool DEFAULT false NULL,
	can_delete bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT profile_page_permissions_pkey PRIMARY KEY (id),
	CONSTRAINT unique_profile_page UNIQUE (profile_id, page_id)
);
CREATE INDEX idx_profile_page_permissions_page_id ON public.profile_page_permissions USING btree (page_id);
CREATE INDEX idx_profile_page_permissions_profile_id ON public.profile_page_permissions USING btree (profile_id);


-- public.purchase_efficiency_reports definition

-- Drop table

-- DROP TABLE public.purchase_efficiency_reports;

CREATE TABLE public.purchase_efficiency_reports (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	report_period_start date NOT NULL,
	report_period_end date NOT NULL,
	total_purchases_planned int4 DEFAULT 0 NULL,
	total_purchases_emergency int4 DEFAULT 0 NULL,
	planned_purchase_percentage numeric(5, 2) DEFAULT 0 NULL,
	total_cost_planned numeric(15, 2) DEFAULT 0 NULL,
	total_cost_emergency numeric(15, 2) DEFAULT 0 NULL,
	cost_savings_planned numeric(15, 2) DEFAULT 0 NULL,
	average_delivery_days numeric(4, 1) DEFAULT 0 NULL,
	supplier_performance_average numeric(3, 2) DEFAULT 0 NULL,
	stock_out_incidents int4 DEFAULT 0 NULL,
	efficiency_score numeric(3, 2) DEFAULT 0 NULL,
	generated_at timestamptz DEFAULT now() NULL,
	generated_by uuid NULL,
	CONSTRAINT purchase_efficiency_reports_pkey PRIMARY KEY (id)
);


-- public.purchase_needs definition

-- Drop table

-- DROP TABLE public.purchase_needs;

CREATE TABLE public.purchase_needs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	part_code varchar(100) NOT NULL,
	part_name varchar(255) NOT NULL,
	required_quantity int4 NOT NULL,
	available_quantity int4 DEFAULT 0 NULL,
	shortage_quantity int4 GENERATED ALWAYS AS (required_quantity - available_quantity) STORED NULL,
	priority_level varchar(20) DEFAULT 'normal'::character varying NULL,
	need_type varchar(50) DEFAULT 'planned'::character varying NULL,
	related_orders jsonb DEFAULT '[]'::jsonb NULL,
	suggested_suppliers jsonb DEFAULT '[]'::jsonb NULL,
	estimated_cost numeric(12, 2) DEFAULT 0 NULL,
	delivery_urgency_date date NULL,
	status varchar(50) DEFAULT 'pending'::character varying NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT purchase_needs_pkey PRIMARY KEY (id),
	CONSTRAINT unique_part_need_per_org UNIQUE (org_id, part_code, status)
);
CREATE INDEX idx_purchase_needs_org ON public.purchase_needs USING btree (org_id);
CREATE INDEX idx_purchase_needs_part_code ON public.purchase_needs USING btree (part_code);
CREATE INDEX idx_purchase_needs_priority ON public.purchase_needs USING btree (priority_level);
CREATE INDEX idx_purchase_needs_status ON public.purchase_needs USING btree (status);
CREATE INDEX idx_purchase_needs_urgency ON public.purchase_needs USING btree (delivery_urgency_date);

-- Table Triggers

create trigger calculate_supplier_suggestions_trigger after
insert
    or
update
    on
    public.purchase_needs for each row execute function calculate_supplier_suggestions();
create trigger trg_create_purchase_need_alert_insert after
insert
    on
    public.purchase_needs for each row execute function create_purchase_need_alert();
create trigger trg_create_purchase_need_alert_update after
update
    on
    public.purchase_needs for each row
    when ((((old.status)::text is distinct
from
    (new.status)::text)
        or ((old.priority_level)::text is distinct
    from
        (new.priority_level)::text)
            or (old.required_quantity is distinct
        from
            new.required_quantity)
            or (old.available_quantity is distinct
        from
            new.available_quantity))) execute function create_purchase_need_alert();
create trigger trg_notify_purchase_need after
insert
    on
    public.purchase_needs for each row
    when (((new.status)::text = 'pending'::text)) execute function notify_purchase_need();


-- public.purchase_order_items definition

-- Drop table

-- DROP TABLE public.purchase_order_items;

CREATE TABLE public.purchase_order_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	po_id uuid NOT NULL,
	item_name text NOT NULL,
	description text NULL,
	quantity int4 DEFAULT 1 NOT NULL,
	unit_price numeric(15, 2) NOT NULL,
	total_price numeric(15, 2) NOT NULL,
	received_quantity int4 DEFAULT 0 NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	part_id uuid NULL,
	CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_purchase_order_items_part_id ON public.purchase_order_items USING btree (part_id) WHERE (part_id IS NOT NULL);


-- public.purchase_orders definition

-- Drop table

-- DROP TABLE public.purchase_orders;

CREATE TABLE public.purchase_orders (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	po_number text NOT NULL,
	requisition_id uuid NULL,
	supplier_id uuid NOT NULL,
	status text DEFAULT 'pending'::text NULL,
	order_date date DEFAULT CURRENT_DATE NULL,
	expected_delivery date NULL,
	actual_delivery date NULL,
	total_value numeric(15, 2) DEFAULT 0 NULL,
	terms text NULL,
	notes text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	subtotal numeric(10, 2) DEFAULT 0 NULL,
	taxes numeric(10, 2) DEFAULT 0 NULL,
	freight numeric(10, 2) DEFAULT 0 NULL,
	discount numeric(10, 2) DEFAULT 0 NULL,
	delivery_address text NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	sent_at timestamptz NULL,
	confirmed_at timestamptz NULL,
	requires_approval bool DEFAULT false NULL,
	CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
	CONSTRAINT purchase_orders_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'sent'::text, 'confirmed'::text, 'in_transit'::text, 'delivered'::text, 'cancelled'::text])))
);

-- Table Triggers

create trigger set_purchase_order_number before
insert
    on
    public.purchase_orders for each row execute function set_po_number();
create trigger trigger_check_po_approval before
insert
    or
update
    on
    public.purchase_orders for each row execute function check_po_approval_required();
create trigger update_purchase_orders_updated_at before
update
    on
    public.purchase_orders for each row execute function update_updated_at_column();


-- public.purchase_receipt_items definition

-- Drop table

-- DROP TABLE public.purchase_receipt_items;

CREATE TABLE public.purchase_receipt_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	receipt_id uuid NOT NULL,
	purchase_order_item_id uuid NOT NULL,
	part_id uuid NULL,
	ordered_quantity int4 NOT NULL,
	received_quantity int4 NOT NULL,
	has_divergence bool GENERATED ALWAYS AS (received_quantity <> ordered_quantity) STORED NULL,
	divergence_reason text NULL,
	unit_cost numeric(10, 2) NULL,
	total_cost numeric(10, 2) GENERATED ALWAYS AS ((received_quantity::numeric * unit_cost)) STORED NULL,
	quality_status text DEFAULT 'approved'::text NULL,
	quality_notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	approved_quantity int4 DEFAULT 0 NULL,
	rejected_quantity int4 DEFAULT 0 NULL,
	rejection_reason text NULL,
	lot_number text NULL,
	expiry_date date NULL,
	warehouse_location text NULL,
	CONSTRAINT purchase_receipt_items_pkey PRIMARY KEY (id),
	CONSTRAINT purchase_receipt_items_quality_status_check CHECK ((quality_status = ANY (ARRAY['under_review'::text, 'approved'::text, 'rejected'::text]))),
	CONSTRAINT purchase_receipt_items_received_quantity_check CHECK ((received_quantity >= 0))
);
CREATE INDEX idx_purchase_receipt_items_part_id ON public.purchase_receipt_items USING btree (part_id) WHERE (part_id IS NOT NULL);
CREATE INDEX idx_purchase_receipt_items_po_item_id ON public.purchase_receipt_items USING btree (purchase_order_item_id);
CREATE INDEX idx_purchase_receipt_items_receipt_id ON public.purchase_receipt_items USING btree (receipt_id);

-- Table Triggers

create trigger trigger_create_inventory_entry after
insert
    on
    public.purchase_receipt_items for each row
    when (((new.part_id is not null)
        and (new.quality_status = 'approved'::text))) execute function create_inventory_entry_on_receipt();
create trigger trigger_update_po_on_receipt after
insert
    or
update
    on
    public.purchase_receipt_items for each row execute function update_purchase_order_on_receipt();


-- public.purchase_receipts definition

-- Drop table

-- DROP TABLE public.purchase_receipts;

CREATE TABLE public.purchase_receipts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	purchase_order_id uuid NOT NULL,
	receipt_number text NOT NULL,
	receipt_date date NOT NULL,
	status text DEFAULT 'pending'::text NOT NULL,
	invoice_number text NULL,
	invoice_date date NULL,
	has_divergence bool DEFAULT false NULL,
	received_by uuid NULL,
	notes text NULL,
	created_by uuid NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	invoice_url text NULL,
	total_value numeric(10, 2) DEFAULT 0 NULL,
	CONSTRAINT purchase_receipts_pkey PRIMARY KEY (id),
	CONSTRAINT purchase_receipts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'partial'::text, 'completed'::text, 'cancelled'::text]))),
	CONSTRAINT unique_receipt_number_per_org UNIQUE (org_id, receipt_number)
);
CREATE INDEX idx_purchase_receipts_date ON public.purchase_receipts USING btree (receipt_date DESC);
CREATE INDEX idx_purchase_receipts_org_id ON public.purchase_receipts USING btree (org_id);
CREATE INDEX idx_purchase_receipts_po_id ON public.purchase_receipts USING btree (purchase_order_id);
CREATE INDEX idx_purchase_receipts_status ON public.purchase_receipts USING btree (status);

-- Table Triggers

create trigger update_purchase_receipts_updated_at before
update
    on
    public.purchase_receipts for each row execute function update_updated_at_column();


-- public.purchase_requisition_items definition

-- Drop table

-- DROP TABLE public.purchase_requisition_items;

CREATE TABLE public.purchase_requisition_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	requisition_id uuid NOT NULL,
	item_name text NOT NULL,
	description text NULL,
	quantity int4 DEFAULT 1 NOT NULL,
	unit_price numeric(15, 2) NULL,
	total_price numeric(15, 2) NULL,
	urgency_date date NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT purchase_requisition_items_pkey PRIMARY KEY (id)
);


-- public.purchase_requisitions definition

-- Drop table

-- DROP TABLE public.purchase_requisitions;

CREATE TABLE public.purchase_requisitions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	requisition_number text NOT NULL,
	requested_by uuid NULL,
	department text NULL,
	priority text DEFAULT 'medium'::text NULL,
	justification text NULL,
	status text DEFAULT 'pending'::text NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	total_estimated_value numeric(15, 2) DEFAULT 0 NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT purchase_requisitions_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger set_purchase_requisition_number before
insert
    on
    public.purchase_requisitions for each row execute function set_requisition_number();
create trigger update_purchase_requisitions_updated_at before
update
    on
    public.purchase_requisitions for each row execute function update_updated_at_column();


-- public.quality_history definition

-- Drop table

-- DROP TABLE public.quality_history;

CREATE TABLE public.quality_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	component public."engine_component" NOT NULL,
	step_key varchar(50) NOT NULL,
	quality_event_type varchar(50) NOT NULL,
	event_description text NOT NULL,
	severity_level varchar(20) DEFAULT 'info'::character varying NULL,
	related_checklist_id uuid NULL,
	related_response_id uuid NULL,
	related_report_id uuid NULL,
	event_data jsonb DEFAULT '{}'::jsonb NULL,
	recorded_by uuid NULL,
	recorded_at timestamptz DEFAULT now() NULL,
	org_id uuid NULL,
	CONSTRAINT quality_history_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_quality_history_component ON public.quality_history USING btree (component);
CREATE INDEX idx_quality_history_date ON public.quality_history USING btree (recorded_at);
CREATE INDEX idx_quality_history_event_type ON public.quality_history USING btree (quality_event_type);
CREATE INDEX idx_quality_history_order ON public.quality_history USING btree (order_id);
CREATE INDEX idx_quality_history_severity ON public.quality_history USING btree (severity_level);


-- public.quotation_items definition

-- Drop table

-- DROP TABLE public.quotation_items;

CREATE TABLE public.quotation_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	quotation_id uuid NOT NULL,
	item_name text NOT NULL,
	description text NULL,
	quantity int4 DEFAULT 1 NOT NULL,
	unit_price numeric(15, 2) NOT NULL,
	total_price numeric(15, 2) NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT quotation_items_pkey PRIMARY KEY (id)
);


-- public.quotations definition

-- Drop table

-- DROP TABLE public.quotations;

CREATE TABLE public.quotations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	requisition_id uuid NOT NULL,
	supplier_id uuid NOT NULL,
	quote_number text NULL,
	quote_date date DEFAULT CURRENT_DATE NULL,
	validity_date date NULL,
	total_value numeric(15, 2) DEFAULT 0 NULL,
	delivery_time int4 NULL,
	terms text NULL,
	status text DEFAULT 'pending'::text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT quotations_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_quotations_updated_at before
update
    on
    public.quotations for each row execute function update_updated_at_column();


-- public.resource_capacity definition

-- Drop table

-- DROP TABLE public.resource_capacity;

CREATE TABLE public.resource_capacity (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	resource_name text NOT NULL,
	resource_type text NOT NULL,
	daily_capacity_hours numeric(8, 2) DEFAULT 8 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT resource_capacity_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_resource_capacity_updated_at before
update
    on
    public.resource_capacity for each row execute function update_updated_at_column();


-- public.service_price_table definition

-- Drop table

-- DROP TABLE public.service_price_table;

CREATE TABLE public.service_price_table (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	engine_type_id uuid NULL,
	component public."engine_component" NOT NULL,
	service_code varchar(50) NOT NULL,
	service_name varchar(255) NOT NULL,
	service_description text NULL,
	unit_type varchar(50) DEFAULT 'unit'::character varying NULL,
	base_price numeric(10, 2) NOT NULL,
	labor_hours numeric(5, 2) DEFAULT 0 NULL,
	difficulty_multiplier numeric(3, 2) DEFAULT 1.0 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT service_price_table_pkey PRIMARY KEY (id),
	CONSTRAINT unique_service_per_engine_type UNIQUE (org_id, engine_type_id, component, service_code)
);
CREATE INDEX idx_service_price_table_component ON public.service_price_table USING btree (component);
CREATE INDEX idx_service_price_table_engine_type ON public.service_price_table USING btree (engine_type_id);
CREATE INDEX idx_service_price_table_org ON public.service_price_table USING btree (org_id);


-- public.special_environments definition

-- Drop table

-- DROP TABLE public.special_environments;

CREATE TABLE public.special_environments (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	environment_name varchar(255) NOT NULL,
	environment_type varchar(50) NOT NULL,
	requirements jsonb DEFAULT '{}'::jsonb NOT NULL,
	current_status varchar(50) DEFAULT 'available'::character varying NULL,
	temperature_min numeric(4, 1) NULL,
	temperature_max numeric(4, 1) NULL,
	humidity_min numeric(4, 1) NULL,
	humidity_max numeric(4, 1) NULL,
	cleanliness_class varchar(20) NULL,
	certification_required bool DEFAULT false NULL,
	certification_valid_until date NULL,
	last_maintenance date NULL,
	next_maintenance date NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT special_environments_pkey PRIMARY KEY (id)
);


-- public.status_config definition

-- Drop table

-- DROP TABLE public.status_config;

CREATE TABLE public.status_config (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	entity_type text NOT NULL,
	status_key text NOT NULL,
	status_label text NOT NULL,
	badge_variant text DEFAULT 'default'::text NOT NULL,
	color text NULL,
	icon text NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	engine_type_id uuid NULL,
	component public."engine_component" NULL,
	prerequisites jsonb DEFAULT '[]'::jsonb NULL,
	estimated_hours numeric(5, 2) DEFAULT 0 NULL,
	requires_approval bool DEFAULT false NULL,
	approval_roles jsonb DEFAULT '[]'::jsonb NULL,
	display_order int4 DEFAULT 0 NULL,
	notification_config jsonb DEFAULT '{}'::jsonb NULL,
	sla_config jsonb DEFAULT '{}'::jsonb NULL,
	visual_config jsonb DEFAULT '{}'::jsonb NULL,
	automation_rules jsonb DEFAULT '[]'::jsonb NULL,
	CONSTRAINT status_config_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_status_config_engine_type ON public.status_config USING btree (engine_type_id);

-- Table Triggers

create trigger update_status_config_updated_at before
update
    on
    public.status_config for each row execute function update_updated_at_column();


-- public.status_prerequisites definition

-- Drop table

-- DROP TABLE public.status_prerequisites;

CREATE TABLE public.status_prerequisites (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	from_status_key varchar(50) NOT NULL,
	to_status_key varchar(50) NOT NULL,
	entity_type varchar(20) DEFAULT 'workflow'::character varying NOT NULL,
	transition_type public."status_transition_type" DEFAULT 'manual'::status_transition_type NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	component varchar(100) NULL,
	org_id uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT status_prerequisites_pkey PRIMARY KEY (id)
);


-- public.stock_alerts definition

-- Drop table

-- DROP TABLE public.stock_alerts;

CREATE TABLE public.stock_alerts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	part_code varchar(100) NULL,
	part_name varchar(255) NOT NULL,
	current_stock int4 NOT NULL,
	minimum_stock int4 NOT NULL,
	maximum_stock int4 DEFAULT 0 NULL,
	alert_type varchar(50) NOT NULL,
	alert_level varchar(20) DEFAULT 'warning'::character varying NULL,
	created_at timestamptz DEFAULT now() NULL,
	acknowledged_at timestamptz NULL,
	acknowledged_by uuid NULL,
	resolved_at timestamptz NULL,
	is_active bool DEFAULT true NULL,
	CONSTRAINT stock_alerts_pkey PRIMARY KEY (id),
	CONSTRAINT unique_stock_alert_per_org_part UNIQUE (org_id, part_code)
);
CREATE INDEX idx_stock_alerts_active ON public.stock_alerts USING btree (is_active);
CREATE INDEX idx_stock_alerts_level ON public.stock_alerts USING btree (alert_level);
CREATE INDEX idx_stock_alerts_org ON public.stock_alerts USING btree (org_id);
CREATE INDEX idx_stock_alerts_org_part ON public.stock_alerts USING btree (org_id, part_code) WHERE ((part_code IS NOT NULL) AND (is_active = true));
CREATE INDEX idx_stock_alerts_part ON public.stock_alerts USING btree (part_code);

-- Table Triggers

create trigger trg_notify_stock_minimum after
insert
    on
    public.stock_alerts for each row
    when ((new.is_active = true)) execute function notify_stock_minimum();
create trigger trigger_create_stock_notification after
insert
    on
    public.stock_alerts for each row execute function create_stock_notification();
create trigger trigger_create_stock_notification_update after
update
    on
    public.stock_alerts for each row
    when ((((old.alert_type)::text is distinct
from
    (new.alert_type)::text)
        or (old.is_active is distinct
    from
        new.is_active))) execute function create_stock_notification();


-- public.supplier_contacts definition

-- Drop table

-- DROP TABLE public.supplier_contacts;

CREATE TABLE public.supplier_contacts (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	supplier_id uuid NOT NULL,
	org_id uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NULL,
	email text NULL,
	phone text NULL,
	whatsapp text NULL,
	is_primary bool DEFAULT false NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT supplier_contacts_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_supplier_contacts_is_primary ON public.supplier_contacts USING btree (is_primary) WHERE (is_primary = true);
CREATE INDEX idx_supplier_contacts_org_id ON public.supplier_contacts USING btree (org_id);
CREATE INDEX idx_supplier_contacts_supplier_id ON public.supplier_contacts USING btree (supplier_id);

-- Table Triggers

create trigger update_supplier_contacts_updated_at before
update
    on
    public.supplier_contacts for each row execute function update_updated_at_column();


-- public.supplier_evaluations definition

-- Drop table

-- DROP TABLE public.supplier_evaluations;

CREATE TABLE public.supplier_evaluations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	supplier_id uuid NOT NULL,
	org_id uuid NOT NULL,
	purchase_order_id uuid NULL,
	delivery_rating numeric(3, 2) NOT NULL,
	quality_rating numeric(3, 2) NOT NULL,
	price_rating numeric(3, 2) NOT NULL,
	service_rating numeric(3, 2) NOT NULL,
	overall_rating numeric(3, 2) GENERATED ALWAYS AS (((delivery_rating + quality_rating + price_rating + service_rating) / 4::numeric)) STORED NULL,
	delivered_on_time bool NOT NULL,
	had_quality_issues bool DEFAULT false NULL,
	"comments" text NULL,
	evaluated_by uuid NULL,
	evaluated_at timestamptz DEFAULT now() NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT supplier_evaluations_delivery_rating_check CHECK (((delivery_rating >= (1)::numeric) AND (delivery_rating <= (5)::numeric))),
	CONSTRAINT supplier_evaluations_pkey PRIMARY KEY (id),
	CONSTRAINT supplier_evaluations_price_rating_check CHECK (((price_rating >= (1)::numeric) AND (price_rating <= (5)::numeric))),
	CONSTRAINT supplier_evaluations_quality_rating_check CHECK (((quality_rating >= (1)::numeric) AND (quality_rating <= (5)::numeric))),
	CONSTRAINT supplier_evaluations_service_rating_check CHECK (((service_rating >= (1)::numeric) AND (service_rating <= (5)::numeric)))
);
CREATE INDEX idx_supplier_evaluations_evaluated_at ON public.supplier_evaluations USING btree (evaluated_at DESC);
CREATE INDEX idx_supplier_evaluations_org_id ON public.supplier_evaluations USING btree (org_id);
CREATE INDEX idx_supplier_evaluations_po_id ON public.supplier_evaluations USING btree (purchase_order_id) WHERE (purchase_order_id IS NOT NULL);
CREATE INDEX idx_supplier_evaluations_supplier_id ON public.supplier_evaluations USING btree (supplier_id);

-- Table Triggers

create trigger trigger_supplier_evaluation_rating after
insert
    on
    public.supplier_evaluations for each row execute function trigger_recalculate_supplier_rating();


-- public.supplier_performance_history definition

-- Drop table

-- DROP TABLE public.supplier_performance_history;

CREATE TABLE public.supplier_performance_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	supplier_id uuid NULL,
	purchase_order_id uuid NULL,
	part_code varchar(100) NOT NULL,
	ordered_quantity int4 NOT NULL,
	received_quantity int4 NOT NULL,
	ordered_price numeric(10, 2) NOT NULL,
	actual_price numeric(10, 2) NOT NULL,
	promised_delivery_date date NOT NULL,
	actual_delivery_date date NULL,
	quality_rating numeric(3, 2) DEFAULT 5.0 NULL,
	delivery_performance numeric(3, 2) DEFAULT 0 NULL,
	price_variance_percentage numeric(5, 2) DEFAULT 0 NULL,
	quantity_fulfillment_percentage numeric(5, 2) DEFAULT 0 NULL,
	overall_score numeric(3, 2) DEFAULT 0 NULL,
	notes text NULL,
	org_id uuid NULL,
	recorded_at timestamptz DEFAULT now() NULL,
	CONSTRAINT supplier_performance_history_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_supplier_performance_date ON public.supplier_performance_history USING btree (recorded_at);
CREATE INDEX idx_supplier_performance_part ON public.supplier_performance_history USING btree (part_code);
CREATE INDEX idx_supplier_performance_supplier ON public.supplier_performance_history USING btree (supplier_id);

-- Table Triggers

create trigger trigger_calculate_supplier_performance before
insert
    or
update
    on
    public.supplier_performance_history for each row execute function calculate_supplier_performance();
create trigger update_supplier_performance_trigger after
insert
    or
update
    on
    public.supplier_performance_history for each row execute function update_supplier_performance();


-- public.supplier_suggestions definition

-- Drop table

-- DROP TABLE public.supplier_suggestions;

CREATE TABLE public.supplier_suggestions (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	purchase_need_id uuid NULL,
	supplier_id uuid NULL,
	supplier_name varchar(255) NOT NULL,
	suggested_price numeric(10, 2) NOT NULL,
	delivery_days int4 DEFAULT 7 NULL,
	reliability_score numeric(3, 2) DEFAULT 5.0 NULL,
	last_purchase_date date NULL,
	total_purchases_count int4 DEFAULT 0 NULL,
	average_delivery_days numeric(4, 1) DEFAULT 7.0 NULL,
	quality_rating numeric(3, 2) DEFAULT 5.0 NULL,
	cost_benefit_score numeric(5, 2) DEFAULT 5.0 NULL,
	is_preferred bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT supplier_suggestions_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_supplier_suggestions_need ON public.supplier_suggestions USING btree (purchase_need_id);
CREATE INDEX idx_supplier_suggestions_score ON public.supplier_suggestions USING btree (cost_benefit_score);
CREATE INDEX idx_supplier_suggestions_supplier ON public.supplier_suggestions USING btree (supplier_id);


-- public.suppliers definition

-- Drop table

-- DROP TABLE public.suppliers;

CREATE TABLE public.suppliers (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	cnpj text NULL,
	email text NULL,
	phone text NULL,
	address text NULL,
	contact_person text NULL,
	payment_terms text NULL,
	delivery_days int4 DEFAULT 0 NULL,
	rating numeric(3, 2) DEFAULT 5.00 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NOT NULL,
	whatsapp text NULL,
	website text NULL,
	categories _text DEFAULT '{}'::text[] NULL,
	brands _text DEFAULT '{}'::text[] NULL,
	is_preferred bool DEFAULT false NULL,
	total_orders int4 DEFAULT 0 NULL,
	on_time_delivery_rate numeric(5, 2) DEFAULT 100.00 NULL,
	quality_rating numeric(3, 2) DEFAULT 5.00 NULL,
	price_rating numeric(3, 2) DEFAULT 5.00 NULL,
	last_purchase_date date NULL,
	CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_suppliers_brands ON public.suppliers USING gin (brands);
CREATE INDEX idx_suppliers_categories ON public.suppliers USING gin (categories);
CREATE INDEX idx_suppliers_is_preferred ON public.suppliers USING btree (is_preferred) WHERE (is_preferred = true);
CREATE INDEX idx_suppliers_rating ON public.suppliers USING btree (rating DESC);

-- Table Triggers

create trigger update_suppliers_updated_at before
update
    on
    public.suppliers for each row execute function update_updated_at_column();


-- public.system_config definition

-- Drop table

-- DROP TABLE public.system_config;

CREATE TABLE public.system_config (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	"key" text NOT NULL,
	value text NOT NULL,
	category text NOT NULL,
	description text NULL,
	data_type text DEFAULT 'string'::text NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT system_config_data_type_check CHECK ((data_type = ANY (ARRAY['string'::text, 'number'::text, 'boolean'::text, 'json'::text]))),
	CONSTRAINT system_config_org_id_key_key UNIQUE (org_id, key),
	CONSTRAINT system_config_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_system_config_updated_at before
update
    on
    public.system_config for each row execute function update_updated_at_column();


-- public.tax_calculations definition

-- Drop table

-- DROP TABLE public.tax_calculations;

CREATE TABLE public.tax_calculations (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	operation public."operation_type" NOT NULL,
	classification_id uuid NULL,
	regime_id uuid NOT NULL,
	amount numeric(14, 2) NOT NULL,
	origin_uf text NULL,
	destination_uf text NULL,
	calculated_at timestamptz DEFAULT now() NOT NULL,
	"result" jsonb NOT NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT tax_calculations_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tax_calculations_order ON public.tax_calculations USING btree (order_id);
CREATE INDEX idx_tax_calculations_org_id ON public.tax_calculations USING btree (org_id);
CREATE INDEX idx_tax_calculations_regime ON public.tax_calculations USING btree (regime_id);
CREATE INDEX tax_calc_order_idx ON public.tax_calculations USING btree (order_id, calculated_at DESC);

-- Table Triggers

create trigger trg_tax_calculations_updated_at before
update
    on
    public.tax_calculations for each row execute function set_updated_at();


-- public.tax_ledgers definition

-- Drop table

-- DROP TABLE public.tax_ledgers;

CREATE TABLE public.tax_ledgers (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	period_month int4 NOT NULL,
	period_year int4 NOT NULL,
	tax_type_id uuid NOT NULL,
	regime_id uuid NOT NULL,
	total_credits numeric(14, 2) DEFAULT 0 NOT NULL,
	total_debits numeric(14, 2) DEFAULT 0 NOT NULL,
	balance_due numeric(14, 2) DEFAULT 0 NOT NULL,
	status public."period_status" DEFAULT 'aberto'::period_status NOT NULL,
	notes text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT tax_ledgers_period_month_check CHECK (((period_month >= 1) AND (period_month <= 12))),
	CONSTRAINT tax_ledgers_period_year_check CHECK (((period_year >= 2000) AND (period_year <= 2100))),
	CONSTRAINT tax_ledgers_period_year_period_month_tax_type_id_regime_id_key UNIQUE (period_year, period_month, tax_type_id, regime_id),
	CONSTRAINT tax_ledgers_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tax_ledgers_org_id ON public.tax_ledgers USING btree (org_id);
CREATE INDEX idx_tax_ledgers_period ON public.tax_ledgers USING btree (period_year, period_month);
CREATE INDEX idx_tax_ledgers_tax_type ON public.tax_ledgers USING btree (tax_type_id);

-- Table Triggers

create trigger trg_tax_ledgers_updated_at before
update
    on
    public.tax_ledgers for each row execute function set_updated_at();


-- public.tax_rate_tables definition

-- Drop table

-- DROP TABLE public.tax_rate_tables;

CREATE TABLE public.tax_rate_tables (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	tax_type_id uuid NOT NULL,
	jurisdiction_code text NOT NULL,
	classification_id uuid NULL,
	rate numeric(10, 4) DEFAULT 0 NOT NULL,
	base_reduction numeric(10, 4) DEFAULT 0 NULL,
	valid_from date DEFAULT CURRENT_DATE NOT NULL,
	valid_to date NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT tax_rate_tables_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tax_rate_tables_org_id ON public.tax_rate_tables USING btree (org_id);
CREATE INDEX tax_rate_idx ON public.tax_rate_tables USING btree (tax_type_id, jurisdiction_code, classification_id, valid_from);

-- Table Triggers

create trigger trg_tax_rate_tables_updated_at before
update
    on
    public.tax_rate_tables for each row execute function set_updated_at();


-- public.tax_regimes definition

-- Drop table

-- DROP TABLE public.tax_regimes;

CREATE TABLE public.tax_regimes (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	effective_from date NULL,
	effective_to date NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT tax_regimes_code_key UNIQUE (code),
	CONSTRAINT tax_regimes_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tax_regimes_org_id ON public.tax_regimes USING btree (org_id);

-- Table Triggers

create trigger trg_tax_regimes_updated_at before
update
    on
    public.tax_regimes for each row execute function set_updated_at();


-- public.tax_rules definition

-- Drop table

-- DROP TABLE public.tax_rules;

CREATE TABLE public.tax_rules (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	regime_id uuid NOT NULL,
	tax_type_id uuid NOT NULL,
	operation public."operation_type" NOT NULL,
	origin_uf text NULL,
	destination_uf text NULL,
	classification_id uuid NULL,
	calc_method public."base_calc_method" DEFAULT 'percentual'::base_calc_method NOT NULL,
	rate numeric(10, 4) NULL,
	base_reduction numeric(10, 4) NULL,
	is_active bool DEFAULT true NOT NULL,
	priority int4 DEFAULT 100 NOT NULL,
	valid_from date DEFAULT CURRENT_DATE NOT NULL,
	valid_to date NULL,
	formula text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT tax_rules_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tax_rules_org_id ON public.tax_rules USING btree (org_id);
CREATE INDEX tax_rules_query_idx ON public.tax_rules USING btree (regime_id, tax_type_id, operation, classification_id, origin_uf, destination_uf, is_active, valid_from);

-- Table Triggers

create trigger trg_tax_rules_updated_at before
update
    on
    public.tax_rules for each row execute function set_updated_at();


-- public.tax_types definition

-- Drop table

-- DROP TABLE public.tax_types;

CREATE TABLE public.tax_types (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	code text NOT NULL,
	"name" text NOT NULL,
	"jurisdiction" public."jurisdiction" NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT tax_types_code_key UNIQUE (code),
	CONSTRAINT tax_types_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_tax_types_org_id ON public.tax_types USING btree (org_id);

-- Table Triggers

create trigger trg_tax_types_updated_at before
update
    on
    public.tax_types for each row execute function set_updated_at();


-- public.technical_report_templates definition

-- Drop table

-- DROP TABLE public.technical_report_templates;

CREATE TABLE public.technical_report_templates (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	template_name varchar(255) NOT NULL,
	report_type varchar(50) NOT NULL,
	technical_standard varchar(100) NULL,
	applicable_components public._engine_component DEFAULT '{}'::engine_component[] NULL,
	template_structure jsonb DEFAULT '{}'::jsonb NOT NULL,
	required_data_fields jsonb DEFAULT '[]'::jsonb NULL,
	optional_data_fields jsonb DEFAULT '[]'::jsonb NULL,
	measurement_fields jsonb DEFAULT '[]'::jsonb NULL,
	photo_requirements jsonb DEFAULT '[]'::jsonb NULL,
	header_template text NULL,
	footer_template text NULL,
	css_styles text NULL,
	is_active bool DEFAULT true NULL,
	"version" int4 DEFAULT 1 NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	created_by uuid NULL,
	CONSTRAINT technical_report_templates_pkey PRIMARY KEY (id),
	CONSTRAINT unique_report_template_per_org UNIQUE (org_id, template_name, version)
);
CREATE INDEX idx_technical_report_templates_org ON public.technical_report_templates USING btree (org_id);
CREATE INDEX idx_technical_report_templates_standard ON public.technical_report_templates USING btree (technical_standard);
CREATE INDEX idx_technical_report_templates_type ON public.technical_report_templates USING btree (report_type);


-- public.technical_reports definition

-- Drop table

-- DROP TABLE public.technical_reports;

CREATE TABLE public.technical_reports (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NULL,
	component public."engine_component" NOT NULL,
	report_type varchar(50) NOT NULL,
	report_template varchar(100) NULL,
	technical_standard varchar(100) NULL,
	report_number varchar(50) NULL,
	report_data jsonb DEFAULT '{}'::jsonb NOT NULL,
	measurements_data jsonb DEFAULT '{}'::jsonb NULL,
	photos_data jsonb DEFAULT '[]'::jsonb NULL,
	conformity_status varchar(50) DEFAULT 'pending'::character varying NULL,
	non_conformities jsonb DEFAULT '[]'::jsonb NULL,
	corrective_actions jsonb DEFAULT '[]'::jsonb NULL,
	generated_automatically bool DEFAULT true NULL,
	generated_at timestamptz DEFAULT now() NULL,
	generated_by uuid NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	pdf_file_path text NULL,
	is_customer_visible bool DEFAULT true NULL,
	org_id uuid NULL,
	CONSTRAINT technical_reports_pkey PRIMARY KEY (id),
	CONSTRAINT technical_reports_report_number_key UNIQUE (report_number),
	CONSTRAINT unique_technical_report_per_component UNIQUE (order_id, component, report_type)
);
CREATE INDEX idx_technical_reports_component ON public.technical_reports USING btree (component);
CREATE INDEX idx_technical_reports_conformity ON public.technical_reports USING btree (conformity_status);
CREATE INDEX idx_technical_reports_number ON public.technical_reports USING btree (report_number);
CREATE INDEX idx_technical_reports_order ON public.technical_reports USING btree (order_id);
CREATE INDEX idx_technical_reports_type ON public.technical_reports USING btree (report_type);

-- Table Triggers

create trigger trg_notify_technical_report after
insert
    on
    public.technical_reports for each row execute function notify_technical_report();


-- public.technical_standards_config definition

-- Drop table

-- DROP TABLE public.technical_standards_config;

CREATE TABLE public.technical_standards_config (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	standard_code varchar(50) NOT NULL,
	standard_name varchar(255) NOT NULL,
	description text NULL,
	applicable_components public._engine_component DEFAULT '{}'::engine_component[] NULL,
	measurement_requirements jsonb DEFAULT '{}'::jsonb NULL,
	tolerance_tables jsonb DEFAULT '{}'::jsonb NULL,
	test_procedures jsonb DEFAULT '{}'::jsonb NULL,
	documentation_requirements jsonb DEFAULT '{}'::jsonb NULL,
	certification_required bool DEFAULT false NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT technical_standards_config_pkey PRIMARY KEY (id),
	CONSTRAINT unique_technical_standard_per_org UNIQUE (org_id, standard_code)
);
CREATE INDEX idx_technical_standards_config_code ON public.technical_standards_config USING btree (standard_code);
CREATE INDEX idx_technical_standards_config_org ON public.technical_standards_config USING btree (org_id);


-- public.time_logs definition

-- Drop table

-- DROP TABLE public.time_logs;

CREATE TABLE public.time_logs (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_id uuid NOT NULL,
	component public."engine_component" NOT NULL,
	workflow_step public."workflow_status" NOT NULL,
	employee_name text NOT NULL,
	start_time timestamptz NOT NULL,
	end_time timestamptz NULL,
	duration_minutes int4 GENERATED ALWAYS AS (
CASE
    WHEN end_time IS NOT NULL THEN EXTRACT(epoch FROM end_time - start_time) / 60::numeric
    ELSE NULL::numeric
END) STORED NULL,
	description text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT time_logs_pkey PRIMARY KEY (id)
);


-- public.user_achievements definition

-- Drop table

-- DROP TABLE public.user_achievements;

CREATE TABLE public.user_achievements (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	user_id uuid NULL,
	achievement_type text NOT NULL,
	achievement_data jsonb DEFAULT '{}'::jsonb NULL,
	earned_at timestamptz DEFAULT now() NULL,
	points_earned int4 DEFAULT 0 NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT user_achievements_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements USING btree (earned_at);
CREATE INDEX idx_user_achievements_org_user ON public.user_achievements USING btree (org_id, user_id);
CREATE INDEX idx_user_achievements_type ON public.user_achievements USING btree (achievement_type);


-- public.user_basic_info definition

-- Drop table

-- DROP TABLE public.user_basic_info;

CREATE TABLE public.user_basic_info (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NULL,
	email text NOT NULL,
	"name" text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT user_basic_info_pkey PRIMARY KEY (id),
	CONSTRAINT user_basic_info_user_id_key UNIQUE (user_id)
);
CREATE INDEX idx_user_basic_info_email ON public.user_basic_info USING btree (email);
CREATE INDEX idx_user_basic_info_user_id ON public.user_basic_info USING btree (user_id);

-- Table Triggers

create trigger update_user_basic_info_updated_at before
update
    on
    public.user_basic_info for each row execute function update_updated_at_column();


-- public.user_profile_assignments definition

-- Drop table

-- DROP TABLE public.user_profile_assignments;

CREATE TABLE public.user_profile_assignments (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	profile_id uuid NULL,
	org_id uuid NULL,
	assigned_by uuid NULL,
	assigned_at timestamptz DEFAULT now() NULL,
	is_active bool DEFAULT true NULL,
	CONSTRAINT unique_user_profile_org UNIQUE (user_id, profile_id, org_id),
	CONSTRAINT user_profile_assignments_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_profile_assignments_org_id ON public.user_profile_assignments USING btree (org_id);
CREATE INDEX idx_user_profile_assignments_profile_id ON public.user_profile_assignments USING btree (profile_id);
CREATE INDEX idx_user_profile_assignments_user_id ON public.user_profile_assignments USING btree (user_id);


-- public.user_profiles definition

-- Drop table

-- DROP TABLE public.user_profiles;

CREATE TABLE public.user_profiles (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	sector_id uuid NULL,
	org_id uuid NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT unique_profile_name_per_org UNIQUE (name, org_id),
	CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_profiles_org_id ON public.user_profiles USING btree (org_id);
CREATE INDEX idx_user_profiles_sector_id ON public.user_profiles USING btree (sector_id);

-- Table Triggers

create trigger update_user_profiles_updated_at before
update
    on
    public.user_profiles for each row execute function update_updated_at_column();


-- public.user_score_history definition

-- Drop table

-- DROP TABLE public.user_score_history;

CREATE TABLE public.user_score_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	user_id uuid NULL,
	action_type text NOT NULL,
	points_earned int4 NOT NULL,
	points_before int4 NOT NULL,
	points_after int4 NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT user_score_history_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_score_history_created_at ON public.user_score_history USING btree (created_at);
CREATE INDEX idx_user_score_history_org_user ON public.user_score_history USING btree (org_id, user_id);


-- public.user_scores definition

-- Drop table

-- DROP TABLE public.user_scores;

CREATE TABLE public.user_scores (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NOT NULL,
	user_id uuid NULL,
	total_points int4 DEFAULT 0 NULL,
	current_level int4 DEFAULT 1 NULL,
	level_progress int4 DEFAULT 0 NULL,
	last_updated timestamptz DEFAULT now() NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT user_scores_org_id_user_id_key UNIQUE (org_id, user_id),
	CONSTRAINT user_scores_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_scores_level ON public.user_scores USING btree (current_level);
CREATE INDEX idx_user_scores_org_user ON public.user_scores USING btree (org_id, user_id);
CREATE INDEX idx_user_scores_points ON public.user_scores USING btree (total_points);


-- public.user_sectors definition

-- Drop table

-- DROP TABLE public.user_sectors;

CREATE TABLE public.user_sectors (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	color varchar(7) DEFAULT '#3B82F6'::character varying NULL,
	is_active bool DEFAULT true NULL,
	org_id uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT unique_sector_name_per_org UNIQUE (name, org_id),
	CONSTRAINT user_sectors_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_user_sectors_org_id ON public.user_sectors USING btree (org_id);

-- Table Triggers

create trigger update_user_sectors_updated_at before
update
    on
    public.user_sectors for each row execute function update_updated_at_column();


-- public.warranty_claims definition

-- Drop table

-- DROP TABLE public.warranty_claims;

CREATE TABLE public.warranty_claims (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	claim_number varchar(50) NULL,
	original_order_id uuid NULL,
	customer_id uuid NULL,
	claim_type varchar(50) NOT NULL,
	component public."engine_component" NOT NULL,
	claim_description text NOT NULL,
	failure_symptoms text NULL,
	customer_complaint text NULL,
	claim_date date DEFAULT CURRENT_DATE NULL,
	reported_by varchar(255) NULL,
	contact_method varchar(50) NULL,
	technical_evaluation_status varchar(50) DEFAULT 'pending'::character varying NULL,
	technical_evaluation jsonb DEFAULT '{}'::jsonb NULL,
	failure_cause varchar(100) NULL,
	is_warranty_valid bool NULL,
	warranty_coverage_percentage numeric(5, 2) DEFAULT 100.00 NULL,
	evaluation_notes text NULL,
	evaluated_by uuid NULL,
	evaluated_at timestamptz NULL,
	claim_status varchar(50) DEFAULT 'open'::character varying NULL,
	priority_level varchar(20) DEFAULT 'normal'::character varying NULL,
	estimated_cost numeric(12, 2) DEFAULT 0 NULL,
	actual_cost numeric(12, 2) DEFAULT 0 NULL,
	resolution_type varchar(50) NULL,
	resolution_description text NULL,
	new_order_id uuid NULL,
	resolved_at timestamptz NULL,
	resolved_by uuid NULL,
	org_id uuid NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT warranty_claims_claim_number_key UNIQUE (claim_number),
	CONSTRAINT warranty_claims_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger trigger_auto_generate_claim_number before
insert
    on
    public.warranty_claims for each row execute function auto_generate_claim_number();


-- public.warranty_indicators definition

-- Drop table

-- DROP TABLE public.warranty_indicators;

CREATE TABLE public.warranty_indicators (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	period_start date NOT NULL,
	period_end date NOT NULL,
	total_orders_delivered int4 DEFAULT 0 NULL,
	total_warranty_claims int4 DEFAULT 0 NULL,
	warranty_rate numeric(5, 2) DEFAULT 0 NULL,
	claims_by_component jsonb DEFAULT '{}'::jsonb NULL,
	claims_by_cause jsonb DEFAULT '{}'::jsonb NULL,
	average_resolution_days numeric(5, 1) DEFAULT 0 NULL,
	total_warranty_cost numeric(15, 2) DEFAULT 0 NULL,
	customer_satisfaction_avg numeric(3, 2) DEFAULT 0 NULL,
	generated_at timestamptz DEFAULT now() NULL,
	generated_by uuid NULL,
	CONSTRAINT unique_warranty_indicators_per_period UNIQUE (org_id, period_start, period_end),
	CONSTRAINT warranty_indicators_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger trigger_calculate_warranty_rate before
insert
    or
update
    on
    public.warranty_indicators for each row execute function calculate_warranty_rate();


-- public.work_schedules definition

-- Drop table

-- DROP TABLE public.work_schedules;

CREATE TABLE public.work_schedules (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	employee_id uuid NOT NULL,
	shift_name text NOT NULL,
	monday_start time NULL,
	monday_end time NULL,
	tuesday_start time NULL,
	tuesday_end time NULL,
	wednesday_start time NULL,
	wednesday_end time NULL,
	thursday_start time NULL,
	thursday_end time NULL,
	friday_start time NULL,
	friday_end time NULL,
	saturday_start time NULL,
	saturday_end time NULL,
	sunday_start time NULL,
	sunday_end time NULL,
	effective_from date DEFAULT CURRENT_DATE NULL,
	effective_to date NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	org_id uuid NULL,
	CONSTRAINT work_schedules_pkey PRIMARY KEY (id)
);


-- public.workflow_checklist_items definition

-- Drop table

-- DROP TABLE public.workflow_checklist_items;

CREATE TABLE public.workflow_checklist_items (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	checklist_id uuid NULL,
	item_code varchar(50) NOT NULL,
	item_name varchar(255) NOT NULL,
	item_description text NULL,
	item_type varchar(50) DEFAULT 'checkbox'::character varying NULL,
	measurement_unit varchar(20) NULL,
	expected_value numeric(12, 4) NULL,
	tolerance_min numeric(12, 4) NULL,
	tolerance_max numeric(12, 4) NULL,
	item_options jsonb DEFAULT '[]'::jsonb NULL,
	is_critical bool DEFAULT false NULL,
	is_required bool DEFAULT true NULL,
	requires_photo bool DEFAULT false NULL,
	requires_supervisor_check bool DEFAULT false NULL,
	validation_rules jsonb DEFAULT '{}'::jsonb NULL,
	display_order int4 DEFAULT 0 NULL,
	help_text text NULL,
	technical_reference text NULL,
	CONSTRAINT unique_workflow_item_per_checklist UNIQUE (checklist_id, item_code),
	CONSTRAINT workflow_checklist_items_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_workflow_checklist_items_checklist ON public.workflow_checklist_items USING btree (checklist_id);
CREATE INDEX idx_workflow_checklist_items_critical ON public.workflow_checklist_items USING btree (is_critical);
CREATE INDEX idx_workflow_checklist_items_order ON public.workflow_checklist_items USING btree (display_order);


-- public.workflow_checklist_responses definition

-- Drop table

-- DROP TABLE public.workflow_checklist_responses;

CREATE TABLE public.workflow_checklist_responses (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_workflow_id uuid NULL,
	checklist_id uuid NULL,
	order_id uuid NULL,
	component public."engine_component" NOT NULL,
	step_key varchar(50) NOT NULL,
	responses jsonb DEFAULT '{}'::jsonb NOT NULL,
	measurements jsonb DEFAULT '{}'::jsonb NULL,
	photos jsonb DEFAULT '[]'::jsonb NULL,
	non_conformities jsonb DEFAULT '[]'::jsonb NULL,
	corrective_actions jsonb DEFAULT '[]'::jsonb NULL,
	overall_status varchar(50) DEFAULT 'pending'::character varying NULL,
	completion_percentage numeric(5, 2) DEFAULT 0 NULL,
	filled_by uuid NULL,
	filled_at timestamptz DEFAULT now() NULL,
	reviewed_by uuid NULL,
	reviewed_at timestamptz NULL,
	supervisor_approved_by uuid NULL,
	supervisor_approved_at timestamptz NULL,
	notes text NULL,
	CONSTRAINT unique_workflow_response_per_workflow UNIQUE (order_workflow_id, checklist_id),
	CONSTRAINT workflow_checklist_responses_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_workflow_checklist_responses_checklist ON public.workflow_checklist_responses USING btree (checklist_id);
CREATE INDEX idx_workflow_checklist_responses_component ON public.workflow_checklist_responses USING btree (component);
CREATE INDEX idx_workflow_checklist_responses_order ON public.workflow_checklist_responses USING btree (order_id);
CREATE INDEX idx_workflow_checklist_responses_order_workflow ON public.workflow_checklist_responses USING btree (order_workflow_id);
CREATE INDEX idx_workflow_checklist_responses_status ON public.workflow_checklist_responses USING btree (overall_status);
CREATE INDEX idx_workflow_responses_workflow_checklist ON public.workflow_checklist_responses USING btree (order_workflow_id, checklist_id, overall_status);

-- Table Triggers

create trigger trigger_auto_generate_technical_report after
insert
    or
update
    on
    public.workflow_checklist_responses for each row execute function auto_generate_technical_report();
create trigger trigger_calculate_checklist_completion before
insert
    or
update
    on
    public.workflow_checklist_responses for each row execute function calculate_checklist_completion();
create trigger trigger_log_quality_event after
insert
    or
update
    on
    public.workflow_checklist_responses for each row execute function log_quality_event();


-- public.workflow_checklists definition

-- Drop table

-- DROP TABLE public.workflow_checklists;

CREATE TABLE public.workflow_checklists (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	org_id uuid NULL,
	engine_type_id uuid NULL,
	workflow_step_id uuid NULL,
	component public."engine_component" NOT NULL,
	step_key varchar(50) NOT NULL,
	checklist_name varchar(255) NOT NULL,
	description text NULL,
	technical_standard varchar(100) NULL,
	is_mandatory bool DEFAULT true NULL,
	requires_supervisor_approval bool DEFAULT false NULL,
	supervisor_roles jsonb DEFAULT '["manager", "supervisor"]'::jsonb NULL,
	blocks_workflow_advance bool DEFAULT true NULL,
	"version" int4 DEFAULT 1 NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	created_by uuid NULL,
	CONSTRAINT unique_workflow_checklist_per_step UNIQUE (org_id, workflow_step_id, checklist_name, version),
	CONSTRAINT workflow_checklists_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_workflow_checklists_component ON public.workflow_checklists USING btree (component);
CREATE INDEX idx_workflow_checklists_engine_type ON public.workflow_checklists USING btree (engine_type_id);
CREATE INDEX idx_workflow_checklists_org ON public.workflow_checklists USING btree (org_id);
CREATE INDEX idx_workflow_checklists_standard ON public.workflow_checklists USING btree (technical_standard);
CREATE INDEX idx_workflow_checklists_step ON public.workflow_checklists USING btree (workflow_step_id);
CREATE INDEX idx_workflow_checklists_step_component ON public.workflow_checklists USING btree (step_key, component, is_mandatory, is_active) WHERE ((is_mandatory = true) AND (is_active = true));


-- public.workflow_status_history definition

-- Drop table

-- DROP TABLE public.workflow_status_history;

CREATE TABLE public.workflow_status_history (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	order_workflow_id uuid NULL,
	old_status public."workflow_status" NULL,
	new_status public."workflow_status" NOT NULL,
	changed_by uuid NULL,
	changed_at timestamptz DEFAULT now() NULL,
	reason text NULL,
	approval_required bool DEFAULT false NULL,
	approved_by uuid NULL,
	approved_at timestamptz NULL,
	org_id uuid NULL,
	CONSTRAINT workflow_status_history_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_workflow_status_history_date ON public.workflow_status_history USING btree (changed_at);
CREATE INDEX idx_workflow_status_history_order ON public.workflow_status_history USING btree (order_workflow_id);
CREATE INDEX idx_workflow_status_history_user ON public.workflow_status_history USING btree (changed_by);

-- Table Triggers

create trigger trigger_set_workflow_status_history_org_id before
insert
    or
update
    on
    public.workflow_status_history for each row execute function set_workflow_status_history_org_id();


-- public.workflow_steps definition

-- Drop table

-- DROP TABLE public.workflow_steps;

CREATE TABLE public.workflow_steps (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	engine_type_id uuid NULL,
	component public."engine_component" NOT NULL,
	step_name varchar(100) NOT NULL,
	step_key varchar(50) NOT NULL,
	description text NULL,
	is_required bool DEFAULT true NULL,
	estimated_hours numeric(5, 2) DEFAULT 0 NULL,
	step_order int4 NOT NULL,
	prerequisites jsonb DEFAULT '[]'::jsonb NULL,
	special_equipment jsonb DEFAULT '[]'::jsonb NULL,
	quality_checklist_required bool DEFAULT false NULL,
	technical_report_required bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT unique_step_per_component UNIQUE (engine_type_id, component, step_order),
	CONSTRAINT workflow_steps_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_workflow_steps_component ON public.workflow_steps USING btree (component);
CREATE INDEX idx_workflow_steps_engine_type ON public.workflow_steps USING btree (engine_type_id);


-- public.accounts_payable foreign keys

ALTER TABLE public.accounts_payable ADD CONSTRAINT accounts_payable_expense_category_id_fkey FOREIGN KEY (expense_category_id) REFERENCES public.expense_categories(id);
ALTER TABLE public.accounts_payable ADD CONSTRAINT accounts_payable_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.accounts_receivable foreign keys

ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE SET NULL;
ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.accounts_receivable ADD CONSTRAINT accounts_receivable_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.alert_history foreign keys

ALTER TABLE public.alert_history ADD CONSTRAINT alert_history_dismissed_by_fkey FOREIGN KEY (dismissed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.alert_history ADD CONSTRAINT alert_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


-- public.approval_rules foreign keys

ALTER TABLE public.approval_rules ADD CONSTRAINT approval_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


-- public.approval_workflows foreign keys

ALTER TABLE public.approval_workflows ADD CONSTRAINT approval_workflows_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.approval_workflows ADD CONSTRAINT approval_workflows_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.approval_workflows ADD CONSTRAINT approval_workflows_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);


-- public.budget_alerts foreign keys

ALTER TABLE public.budget_alerts ADD CONSTRAINT budget_alerts_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE CASCADE;
ALTER TABLE public.budget_alerts ADD CONSTRAINT budget_alerts_dismissed_by_fkey FOREIGN KEY (dismissed_by) REFERENCES auth.users(id);


-- public.budget_approvals foreign keys

ALTER TABLE public.budget_approvals ADD CONSTRAINT budget_approvals_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE CASCADE;
ALTER TABLE public.budget_approvals ADD CONSTRAINT budget_approvals_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.budget_approvals ADD CONSTRAINT budget_approvals_registered_by_fkey FOREIGN KEY (registered_by) REFERENCES auth.users(id);


-- public.budgets foreign keys

ALTER TABLE public.budgets ADD CONSTRAINT budgets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


-- public.cash_flow foreign keys

ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_accounts_payable_id_fkey FOREIGN KEY (accounts_payable_id) REFERENCES public.accounts_payable(id);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_accounts_receivable_id_fkey FOREIGN KEY (accounts_receivable_id) REFERENCES public.accounts_receivable(id);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);
ALTER TABLE public.cash_flow ADD CONSTRAINT cash_flow_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


-- public.commission_calculations foreign keys

ALTER TABLE public.commission_calculations ADD CONSTRAINT commission_calculations_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.commission_calculations ADD CONSTRAINT commission_calculations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
ALTER TABLE public.commission_calculations ADD CONSTRAINT commission_calculations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.company_fiscal_settings foreign keys

ALTER TABLE public.company_fiscal_settings ADD CONSTRAINT company_fiscal_settings_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.company_fiscal_settings ADD CONSTRAINT company_fiscal_settings_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;


-- public.customers foreign keys

ALTER TABLE public.customers ADD CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.customers ADD CONSTRAINT customers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.detailed_budgets foreign keys

ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_diagnostic_response_id_fkey FOREIGN KEY (diagnostic_response_id) REFERENCES public.diagnostic_checklist_responses(id);
ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.detailed_budgets ADD CONSTRAINT detailed_budgets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.diagnostic_checklist_items foreign keys

ALTER TABLE public.diagnostic_checklist_items ADD CONSTRAINT diagnostic_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.diagnostic_checklists(id) ON DELETE CASCADE;


-- public.diagnostic_checklist_responses foreign keys

ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.diagnostic_checklists(id);
ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_diagnosed_by_fkey FOREIGN KEY (diagnosed_by) REFERENCES auth.users(id);
ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.diagnostic_checklist_responses ADD CONSTRAINT diagnostic_checklist_responses_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.diagnostic_checklists foreign keys

ALTER TABLE public.diagnostic_checklists ADD CONSTRAINT diagnostic_checklists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.diagnostic_checklists ADD CONSTRAINT diagnostic_checklists_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
ALTER TABLE public.diagnostic_checklists ADD CONSTRAINT diagnostic_checklists_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.employee_time_tracking foreign keys

ALTER TABLE public.employee_time_tracking ADD CONSTRAINT employee_time_tracking_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.employee_time_tracking ADD CONSTRAINT employee_time_tracking_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
ALTER TABLE public.employee_time_tracking ADD CONSTRAINT employee_time_tracking_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.employees foreign keys

ALTER TABLE public.employees ADD CONSTRAINT employees_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.employees ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


-- public.engine_types foreign keys

ALTER TABLE public.engine_types ADD CONSTRAINT engine_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.engines foreign keys

ALTER TABLE public.engines ADD CONSTRAINT engines_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
ALTER TABLE public.engines ADD CONSTRAINT engines_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.entry_form_fields foreign keys

ALTER TABLE public.entry_form_fields ADD CONSTRAINT entry_form_fields_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.entry_form_templates(id) ON DELETE CASCADE;


-- public.entry_form_submissions foreign keys

ALTER TABLE public.entry_form_submissions ADD CONSTRAINT entry_form_submissions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.entry_form_submissions ADD CONSTRAINT entry_form_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id);
ALTER TABLE public.entry_form_submissions ADD CONSTRAINT entry_form_submissions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.entry_form_templates(id);


-- public.entry_form_templates foreign keys

ALTER TABLE public.entry_form_templates ADD CONSTRAINT entry_form_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.entry_form_templates ADD CONSTRAINT entry_form_templates_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
ALTER TABLE public.entry_form_templates ADD CONSTRAINT entry_form_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.environment_reservations foreign keys

ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.special_environments(id);
ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.environment_reservations ADD CONSTRAINT environment_reservations_reserved_by_fkey FOREIGN KEY (reserved_by) REFERENCES auth.users(id);


-- public.fiscal_audit_log foreign keys

ALTER TABLE public.fiscal_audit_log ADD CONSTRAINT fiscal_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


-- public.fiscal_classifications foreign keys

ALTER TABLE public.fiscal_classifications ADD CONSTRAINT fiscal_classifications_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.inventory_count_items foreign keys

ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_count_id_fkey FOREIGN KEY (count_id) REFERENCES public.inventory_counts(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_counted_by_fkey FOREIGN KEY (counted_by) REFERENCES auth.users(id);
ALTER TABLE public.inventory_count_items ADD CONSTRAINT inventory_count_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id) ON DELETE CASCADE;


-- public.inventory_counts foreign keys

ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_counted_by_fkey FOREIGN KEY (counted_by) REFERENCES auth.users(id);
ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_counts ADD CONSTRAINT inventory_counts_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


-- public.inventory_movements foreign keys

ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id) ON DELETE CASCADE;


-- public.jurisdiction_config foreign keys

ALTER TABLE public.jurisdiction_config ADD CONSTRAINT jurisdiction_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.kpi_targets foreign keys

ALTER TABLE public.kpi_targets ADD CONSTRAINT fk_parent_goal FOREIGN KEY (parent_goal_id) REFERENCES public.kpi_targets(id) ON DELETE SET NULL;
ALTER TABLE public.kpi_targets ADD CONSTRAINT kpi_targets_kpi_id_fkey FOREIGN KEY (kpi_id) REFERENCES public.kpis(id) ON DELETE CASCADE;
ALTER TABLE public.kpi_targets ADD CONSTRAINT kpi_targets_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


-- public.obligation_files foreign keys

ALTER TABLE public.obligation_files ADD CONSTRAINT fk_obligation_files_obligation FOREIGN KEY (obligation_id) REFERENCES public.obligations(id) ON DELETE CASCADE;
ALTER TABLE public.obligation_files ADD CONSTRAINT obligation_files_obligation_id_fkey FOREIGN KEY (obligation_id) REFERENCES public.obligations(id) ON DELETE CASCADE;


-- public.obligation_kinds foreign keys

ALTER TABLE public.obligation_kinds ADD CONSTRAINT obligation_kinds_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.obligations foreign keys

ALTER TABLE public.obligations ADD CONSTRAINT fk_obligations_obligation_kind FOREIGN KEY (obligation_kind_id) REFERENCES public.obligation_kinds(id) ON DELETE RESTRICT;
ALTER TABLE public.obligations ADD CONSTRAINT obligations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.obligations ADD CONSTRAINT obligations_obligation_kind_id_fkey FOREIGN KEY (obligation_kind_id) REFERENCES public.obligation_kinds(id) ON DELETE RESTRICT;
ALTER TABLE public.obligations ADD CONSTRAINT obligations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.order_materials foreign keys

ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
ALTER TABLE public.order_materials ADD CONSTRAINT order_materials_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id);


-- public.order_photos foreign keys

ALTER TABLE public.order_photos ADD CONSTRAINT order_photos_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


-- public.order_status_history foreign keys

ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);
ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_status_history ADD CONSTRAINT order_status_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.order_warranties foreign keys

ALTER TABLE public.order_warranties ADD CONSTRAINT order_warranties_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_warranties ADD CONSTRAINT order_warranties_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.order_workflow foreign keys

ALTER TABLE public.order_workflow ADD CONSTRAINT order_workflow_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.order_workflow ADD CONSTRAINT order_workflow_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.order_workflow ADD CONSTRAINT order_workflow_workflow_step_id_fkey FOREIGN KEY (workflow_step_id) REFERENCES public.workflow_steps(id);


-- public.orders foreign keys

ALTER TABLE public.orders ADD CONSTRAINT orders_consultant_id_fkey FOREIGN KEY (consultant_id) REFERENCES public.consultants(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_engine_id_fkey FOREIGN KEY (engine_id) REFERENCES public.engines(id);
ALTER TABLE public.orders ADD CONSTRAINT orders_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.organization_themes foreign keys

ALTER TABLE public.organization_themes ADD CONSTRAINT organization_themes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


-- public.organization_users foreign keys

ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id);
ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.organization_users ADD CONSTRAINT organization_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.organizations foreign keys

ALTER TABLE public.organizations ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


-- public.parts_inventory foreign keys

ALTER TABLE public.parts_inventory ADD CONSTRAINT parts_inventory_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


-- public.parts_price_table foreign keys

ALTER TABLE public.parts_price_table ADD CONSTRAINT parts_price_table_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.parts_reservations foreign keys

ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_applied_by_fkey FOREIGN KEY (applied_by) REFERENCES auth.users(id);
ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.detailed_budgets(id);
ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES auth.users(id);
ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_reserved_by_fkey FOREIGN KEY (reserved_by) REFERENCES auth.users(id);
ALTER TABLE public.parts_reservations ADD CONSTRAINT parts_reservations_separated_by_fkey FOREIGN KEY (separated_by) REFERENCES auth.users(id);


-- public.parts_stock_config foreign keys

ALTER TABLE public.parts_stock_config ADD CONSTRAINT parts_stock_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.parts_stock_config ADD CONSTRAINT parts_stock_config_preferred_supplier_id_fkey FOREIGN KEY (preferred_supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE public.parts_stock_config ADD CONSTRAINT parts_stock_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


-- public.performance_rankings foreign keys

ALTER TABLE public.performance_rankings ADD CONSTRAINT performance_rankings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.performance_reviews foreign keys

ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id);


-- public.production_alerts foreign keys

ALTER TABLE public.production_alerts ADD CONSTRAINT production_alerts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.production_alerts ADD CONSTRAINT production_alerts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.production_alerts ADD CONSTRAINT production_alerts_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.production_schedules(id);


-- public.production_schedules foreign keys

ALTER TABLE public.production_schedules ADD CONSTRAINT production_schedules_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.production_schedules ADD CONSTRAINT production_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.profile_page_permissions foreign keys

ALTER TABLE public.profile_page_permissions ADD CONSTRAINT profile_page_permissions_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.system_pages(id) ON DELETE CASCADE;
ALTER TABLE public.profile_page_permissions ADD CONSTRAINT profile_page_permissions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


-- public.purchase_efficiency_reports foreign keys

ALTER TABLE public.purchase_efficiency_reports ADD CONSTRAINT purchase_efficiency_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);
ALTER TABLE public.purchase_efficiency_reports ADD CONSTRAINT purchase_efficiency_reports_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.purchase_needs foreign keys

ALTER TABLE public.purchase_needs ADD CONSTRAINT purchase_needs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.purchase_order_items foreign keys

ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


-- public.purchase_orders foreign keys

ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(id);
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


-- public.purchase_receipt_items foreign keys

ALTER TABLE public.purchase_receipt_items ADD CONSTRAINT purchase_receipt_items_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.parts_inventory(id);
ALTER TABLE public.purchase_receipt_items ADD CONSTRAINT purchase_receipt_items_purchase_order_item_id_fkey FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_items(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_receipt_items ADD CONSTRAINT purchase_receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.purchase_receipts(id) ON DELETE CASCADE;


-- public.purchase_receipts foreign keys

ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_receipts ADD CONSTRAINT purchase_receipts_received_by_fkey FOREIGN KEY (received_by) REFERENCES auth.users(id);


-- public.purchase_requisition_items foreign keys

ALTER TABLE public.purchase_requisition_items ADD CONSTRAINT purchase_requisition_items_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE;


-- public.purchase_requisitions foreign keys

ALTER TABLE public.purchase_requisitions ADD CONSTRAINT purchase_requisitions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.purchase_requisitions ADD CONSTRAINT purchase_requisitions_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.purchase_requisitions ADD CONSTRAINT purchase_requisitions_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES auth.users(id);


-- public.quality_history foreign keys

ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);
ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_related_checklist_id_fkey FOREIGN KEY (related_checklist_id) REFERENCES public.workflow_checklists(id);
ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_related_report_id_fkey FOREIGN KEY (related_report_id) REFERENCES public.technical_reports(id);
ALTER TABLE public.quality_history ADD CONSTRAINT quality_history_related_response_id_fkey FOREIGN KEY (related_response_id) REFERENCES public.workflow_checklist_responses(id);


-- public.quotation_items foreign keys

ALTER TABLE public.quotation_items ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;


-- public.quotations foreign keys

ALTER TABLE public.quotations ADD CONSTRAINT quotations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_requisition_id_fkey FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(id);
ALTER TABLE public.quotations ADD CONSTRAINT quotations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


-- public.resource_capacity foreign keys

ALTER TABLE public.resource_capacity ADD CONSTRAINT resource_capacity_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.service_price_table foreign keys

ALTER TABLE public.service_price_table ADD CONSTRAINT service_price_table_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
ALTER TABLE public.service_price_table ADD CONSTRAINT service_price_table_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.special_environments foreign keys

ALTER TABLE public.special_environments ADD CONSTRAINT special_environments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.status_config foreign keys

ALTER TABLE public.status_config ADD CONSTRAINT status_config_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);


-- public.status_prerequisites foreign keys

ALTER TABLE public.status_prerequisites ADD CONSTRAINT status_prerequisites_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.stock_alerts foreign keys

ALTER TABLE public.stock_alerts ADD CONSTRAINT stock_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id);
ALTER TABLE public.stock_alerts ADD CONSTRAINT stock_alerts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.supplier_contacts foreign keys

ALTER TABLE public.supplier_contacts ADD CONSTRAINT supplier_contacts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_contacts ADD CONSTRAINT supplier_contacts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


-- public.supplier_evaluations foreign keys

ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES auth.users(id);
ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE public.supplier_evaluations ADD CONSTRAINT supplier_evaluations_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


-- public.supplier_performance_history foreign keys

ALTER TABLE public.supplier_performance_history ADD CONSTRAINT supplier_performance_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.supplier_performance_history ADD CONSTRAINT supplier_performance_history_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


-- public.supplier_suggestions foreign keys

ALTER TABLE public.supplier_suggestions ADD CONSTRAINT supplier_suggestions_purchase_need_id_fkey FOREIGN KEY (purchase_need_id) REFERENCES public.purchase_needs(id) ON DELETE CASCADE;
ALTER TABLE public.supplier_suggestions ADD CONSTRAINT supplier_suggestions_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


-- public.suppliers foreign keys

ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.system_config foreign keys

ALTER TABLE public.system_config ADD CONSTRAINT system_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.tax_calculations foreign keys

ALTER TABLE public.tax_calculations ADD CONSTRAINT fk_tax_calculations_classification FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE RESTRICT;
ALTER TABLE public.tax_calculations ADD CONSTRAINT fk_tax_calculations_regime FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;
ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE SET NULL;
ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.tax_calculations ADD CONSTRAINT tax_calculations_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;


-- public.tax_ledgers foreign keys

ALTER TABLE public.tax_ledgers ADD CONSTRAINT tax_ledgers_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.tax_ledgers ADD CONSTRAINT tax_ledgers_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE RESTRICT;
ALTER TABLE public.tax_ledgers ADD CONSTRAINT tax_ledgers_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE RESTRICT;


-- public.tax_rate_tables foreign keys

ALTER TABLE public.tax_rate_tables ADD CONSTRAINT fk_tax_rate_tables_classification FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE RESTRICT;
ALTER TABLE public.tax_rate_tables ADD CONSTRAINT fk_tax_rate_tables_tax_type FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE RESTRICT;
ALTER TABLE public.tax_rate_tables ADD CONSTRAINT tax_rate_tables_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE SET NULL;
ALTER TABLE public.tax_rate_tables ADD CONSTRAINT tax_rate_tables_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.tax_rate_tables ADD CONSTRAINT tax_rate_tables_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE CASCADE;


-- public.tax_regimes foreign keys

ALTER TABLE public.tax_regimes ADD CONSTRAINT tax_regimes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.tax_rules foreign keys

ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_classification_id_fkey FOREIGN KEY (classification_id) REFERENCES public.fiscal_classifications(id) ON DELETE SET NULL;
ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_regime_id_fkey FOREIGN KEY (regime_id) REFERENCES public.tax_regimes(id) ON DELETE CASCADE;
ALTER TABLE public.tax_rules ADD CONSTRAINT tax_rules_tax_type_id_fkey FOREIGN KEY (tax_type_id) REFERENCES public.tax_types(id) ON DELETE CASCADE;


-- public.tax_types foreign keys

ALTER TABLE public.tax_types ADD CONSTRAINT tax_types_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.technical_report_templates foreign keys

ALTER TABLE public.technical_report_templates ADD CONSTRAINT technical_report_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.technical_report_templates ADD CONSTRAINT technical_report_templates_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.technical_reports foreign keys

ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);
ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.technical_reports ADD CONSTRAINT technical_reports_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.technical_standards_config foreign keys

ALTER TABLE public.technical_standards_config ADD CONSTRAINT technical_standards_config_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.time_logs foreign keys

ALTER TABLE public.time_logs ADD CONSTRAINT time_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


-- public.user_achievements foreign keys

ALTER TABLE public.user_achievements ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.user_basic_info foreign keys

ALTER TABLE public.user_basic_info ADD CONSTRAINT user_basic_info_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.user_profile_assignments foreign keys

ALTER TABLE public.user_profile_assignments ADD CONSTRAINT user_profile_assignments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.user_profile_assignments ADD CONSTRAINT user_profile_assignments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


-- public.user_profiles foreign keys

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.user_sectors(id) ON DELETE SET NULL;


-- public.user_score_history foreign keys

ALTER TABLE public.user_score_history ADD CONSTRAINT user_score_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.user_scores foreign keys

ALTER TABLE public.user_scores ADD CONSTRAINT user_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- public.user_sectors foreign keys

ALTER TABLE public.user_sectors ADD CONSTRAINT user_sectors_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


-- public.warranty_claims foreign keys

ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES auth.users(id);
ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_new_order_id_fkey FOREIGN KEY (new_order_id) REFERENCES public.orders(id);
ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_original_order_id_fkey FOREIGN KEY (original_order_id) REFERENCES public.orders(id);
ALTER TABLE public.warranty_claims ADD CONSTRAINT warranty_claims_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


-- public.warranty_indicators foreign keys

ALTER TABLE public.warranty_indicators ADD CONSTRAINT warranty_indicators_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES auth.users(id);
ALTER TABLE public.warranty_indicators ADD CONSTRAINT warranty_indicators_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.work_schedules foreign keys

ALTER TABLE public.work_schedules ADD CONSTRAINT work_schedules_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);
ALTER TABLE public.work_schedules ADD CONSTRAINT work_schedules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.workflow_checklist_items foreign keys

ALTER TABLE public.workflow_checklist_items ADD CONSTRAINT workflow_checklist_items_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.workflow_checklists(id) ON DELETE CASCADE;


-- public.workflow_checklist_responses foreign keys

ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_checklist_id_fkey FOREIGN KEY (checklist_id) REFERENCES public.workflow_checklists(id);
ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_filled_by_fkey FOREIGN KEY (filled_by) REFERENCES auth.users(id);
ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_order_workflow_id_fkey FOREIGN KEY (order_workflow_id) REFERENCES public.order_workflow(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public.workflow_checklist_responses ADD CONSTRAINT workflow_checklist_responses_supervisor_approved_by_fkey FOREIGN KEY (supervisor_approved_by) REFERENCES auth.users(id);


-- public.workflow_checklists foreign keys

ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id);
ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.workflow_checklists ADD CONSTRAINT workflow_checklists_workflow_step_id_fkey FOREIGN KEY (workflow_step_id) REFERENCES public.workflow_steps(id);


-- public.workflow_status_history foreign keys

ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);
ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_order_workflow_id_fkey FOREIGN KEY (order_workflow_id) REFERENCES public.order_workflow(id) ON DELETE CASCADE;
ALTER TABLE public.workflow_status_history ADD CONSTRAINT workflow_status_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);


-- public.workflow_steps foreign keys

ALTER TABLE public.workflow_steps ADD CONSTRAINT workflow_steps_engine_type_id_fkey FOREIGN KEY (engine_type_id) REFERENCES public.engine_types(id) ON DELETE CASCADE;