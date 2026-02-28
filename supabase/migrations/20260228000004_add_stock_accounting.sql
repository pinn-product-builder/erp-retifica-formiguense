create table if not exists stock_accounting_config (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  movement_type text not null,
  reason_id uuid,
  debit_account text not null,
  credit_account text not null,
  description_template text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint stock_accounting_config_type_check check (
    movement_type in ('entrada', 'saida', 'ajuste', 'baixa', 'writedown')
  )
);

create table if not exists stock_accounting_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  movement_id uuid references inventory_movements(id),
  entry_date date not null,
  competencia date not null,
  debit_account text not null,
  credit_account text not null,
  amount numeric not null,
  description text,
  reference text,
  status text not null default 'draft',
  posted_at timestamptz,
  posted_by uuid,
  reversed_at timestamptz,
  reversed_by uuid,
  created_at timestamptz not null default now(),
  constraint stock_accounting_entries_status_check check (status in ('draft', 'posted', 'reversed'))
);

create table if not exists stock_provisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  part_id uuid not null references parts_inventory(id) on delete cascade,
  batch_id uuid references stock_batches(id),
  provision_type text not null,
  provision_date date not null,
  cost_before numeric not null,
  vrl numeric not null,
  provision_amount numeric not null,
  reversal_amount numeric not null default 0,
  evidence jsonb,
  approved_by uuid,
  approved_at timestamptz,
  accounting_entry_id uuid references stock_accounting_entries(id),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint stock_provisions_type_check check (
    provision_type in ('vrl_writedown', 'obsolescence', 'damage')
  ),
  constraint stock_provisions_status_check check (status in ('pending', 'approved', 'reversed'))
);

alter table stock_accounting_config enable row level security;
alter table stock_accounting_entries enable row level security;
alter table stock_provisions enable row level security;

create policy "stock_accounting_config_org_select" on stock_accounting_config
  for select using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "stock_accounting_config_org_all" on stock_accounting_config
  for all using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "stock_accounting_entries_org_select" on stock_accounting_entries
  for select using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "stock_accounting_entries_org_insert" on stock_accounting_entries
  for insert with check (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "stock_accounting_entries_org_update" on stock_accounting_entries
  for update using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "stock_provisions_org_select" on stock_provisions
  for select using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "stock_provisions_org_insert" on stock_provisions
  for insert with check (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "stock_provisions_org_update" on stock_provisions
  for update using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));
