create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  name text not null,
  address text,
  is_active boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique(org_id, code)
);

create table if not exists warehouse_locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  code text not null,
  aisle text,
  rack text,
  bin text,
  is_active boolean not null default true,
  max_capacity integer,
  created_at timestamptz not null default now(),
  unique(warehouse_id, code)
);

alter table inventory_movements
  add column if not exists warehouse_id uuid references warehouses(id),
  add column if not exists dest_warehouse_id uuid references warehouses(id),
  add column if not exists location_id uuid references warehouse_locations(id),
  add column if not exists dest_location_id uuid references warehouse_locations(id),
  add column if not exists transfer_group_id uuid;

alter table parts_inventory
  add column if not exists warehouse_id uuid references warehouses(id),
  add column if not exists location_id uuid references warehouse_locations(id);

alter table warehouses enable row level security;
alter table warehouse_locations enable row level security;

create policy "warehouses_org_select" on warehouses
  for select using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "warehouses_org_insert" on warehouses
  for insert with check (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "warehouses_org_update" on warehouses
  for update using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "warehouses_org_delete" on warehouses
  for delete using (org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1));

create policy "warehouse_locations_org_select" on warehouse_locations
  for select using (
    warehouse_id in (
      select id from warehouses where org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1)
    )
  );

create policy "warehouse_locations_org_insert" on warehouse_locations
  for insert with check (
    warehouse_id in (
      select id from warehouses where org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1)
    )
  );

create policy "warehouse_locations_org_update" on warehouse_locations
  for update using (
    warehouse_id in (
      select id from warehouses where org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1)
    )
  );

create policy "warehouse_locations_org_delete" on warehouse_locations
  for delete using (
    warehouse_id in (
      select id from warehouses where org_id = (select organization_id from organization_users where user_id = auth.uid() and is_active = true limit 1)
    )
  );
