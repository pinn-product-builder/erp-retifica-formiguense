create table if not exists stock_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  part_id uuid not null references parts_inventory(id) on delete cascade,
  batch_number text not null,
  manufacturing_date date,
  expiry_date date,
  best_before_date date,
  supplier_id uuid,
  purchase_receipt_id uuid,
  quantity numeric not null default 0,
  reserved_quantity numeric not null default 0,
  unit_cost numeric,
  status text not null default 'available',
  quarantine_until date,
  quarantine_reason text,
  notes text,
  created_at timestamptz not null default now(),
  unique(org_id, part_id, batch_number),
  constraint stock_batches_status_check check (status in ('available', 'reserved', 'quarantine', 'expired', 'consumed'))
);

create table if not exists stock_serials (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  part_id uuid not null references parts_inventory(id) on delete cascade,
  batch_id uuid references stock_batches(id),
  serial_number text not null,
  status text not null default 'available',
  current_location_id uuid,
  purchase_receipt_id uuid,
  sale_order_id uuid,
  warranty_expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  sold_at timestamptz,
  unique(org_id, serial_number),
  constraint stock_serials_status_check check (status in ('available', 'reserved', 'sold', 'returned', 'scrapped'))
);

alter table parts_inventory
  add column if not exists requires_batch boolean not null default false,
  add column if not exists requires_serial boolean not null default false,
  add column if not exists shelf_life_days integer,
  add column if not exists expiry_alert_days integer not null default 30;

alter table inventory_movements
  add column if not exists batch_id uuid references stock_batches(id),
  add column if not exists serial_id uuid references stock_serials(id);

alter table stock_batches enable row level security;
alter table stock_serials enable row level security;

create policy "stock_batches_org_select" on stock_batches
  for select using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "stock_batches_org_insert" on stock_batches
  for insert with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "stock_batches_org_update" on stock_batches
  for update using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "stock_batches_org_delete" on stock_batches
  for delete using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "stock_serials_org_select" on stock_serials
  for select using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "stock_serials_org_insert" on stock_serials
  for insert with check (org_id = (select org_id from profiles where id = auth.uid()));

create policy "stock_serials_org_update" on stock_serials
  for update using (org_id = (select org_id from profiles where id = auth.uid()));

create policy "stock_serials_org_delete" on stock_serials
  for delete using (org_id = (select org_id from profiles where id = auth.uid()));
