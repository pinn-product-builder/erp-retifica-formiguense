create table if not exists cost_layers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  part_id uuid not null references parts_inventory(id) on delete cascade,
  batch_id uuid references stock_batches(id),
  movement_id uuid references inventory_movements(id),
  quantity_original numeric not null,
  quantity_remaining numeric not null,
  unit_cost numeric not null,
  total_cost numeric not null generated always as (quantity_remaining * unit_cost) stored,
  entry_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists cost_details (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid not null references inventory_movements(id) on delete cascade,
  cost_type text not null,
  amount numeric not null default 0,
  description text,
  created_at timestamptz not null default now(),
  constraint cost_details_type_check check (cost_type in ('price', 'freight', 'insurance', 'tax_non_recoverable', 'other'))
);

create table if not exists cost_method_changes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  part_id uuid not null references parts_inventory(id) on delete cascade,
  old_method text not null,
  new_method text not null,
  justification text not null,
  requested_by uuid not null,
  approved_by uuid,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint cost_method_changes_status_check check (status in ('pending', 'approved', 'rejected'))
);

alter table parts_inventory
  add column if not exists cost_method text not null default 'moving_avg',
  add column if not exists cost_method_locked boolean not null default false,
  add column if not exists cost_method_changed_at timestamptz,
  add column if not exists cost_method_changed_by uuid;

alter table cost_layers enable row level security;
alter table cost_details enable row level security;
alter table cost_method_changes enable row level security;

create policy "cost_layers_org_select" on cost_layers
  for select using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "cost_layers_org_insert" on cost_layers
  for insert with check (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "cost_layers_org_update" on cost_layers
  for update using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "cost_method_changes_org_select" on cost_method_changes
  for select using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "cost_method_changes_org_insert" on cost_method_changes
  for insert with check (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "cost_method_changes_org_update" on cost_method_changes
  for update using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "cost_details_movement_select" on cost_details
  for select using (
    movement_id in (
      select id from inventory_movements
      where org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1)
    )
  );

create policy "cost_details_movement_insert" on cost_details
  for insert with check (
    movement_id in (
      select id from inventory_movements
      where org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1)
    )
  );
