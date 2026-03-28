alter table public.parts_inventory
  add column if not exists barcode text,
  add column if not exists entry_packaging text,
  add column if not exists inventory_section text,
  add column if not exists merchandise_origin text,
  add column if not exists ncm text;

alter table public.parts_inventory
  drop constraint if exists parts_inventory_entry_packaging_check;

alter table public.parts_inventory
  add constraint parts_inventory_entry_packaging_check
  check (entry_packaging is null or entry_packaging in ('unidade', 'jogo', 'kit'));

alter table public.parts_inventory
  drop constraint if exists parts_inventory_inventory_section_check;

alter table public.parts_inventory
  add constraint parts_inventory_inventory_section_check
  check (inventory_section is null or inventory_section in ('diesel', 'otto', 'bosch'));

create index if not exists idx_parts_inventory_barcode on public.parts_inventory (org_id, barcode)
  where barcode is not null;

create index if not exists idx_parts_inventory_ncm on public.parts_inventory (org_id, ncm)
  where ncm is not null;
