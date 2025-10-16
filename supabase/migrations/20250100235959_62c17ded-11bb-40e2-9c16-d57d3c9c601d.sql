
-- ========== ENUMS DE APOIO (mantemos o mínimo fixo; catálogos de tributos/regimes serão tabelas dinâmicas) ==========

create type public.jurisdiction as enum ('federal','estadual','municipal');
create type public.operation_type as enum ('venda','compra','prestacao_servico');
create type public.base_calc_method as enum ('percentual','valor_fixo','mva','reducao_base','substituicao_tributaria','isento','nao_incidencia');
create type public.classification_type as enum ('produto','servico');
create type public.filing_status as enum ('rascunho','gerado','validado','enviado','erro');
create type public.period_status as enum ('aberto','fechado','transmitido');

-- ========== CADASTROS DINÂMICOS PRINCIPAIS ==========

-- Tributos (dinâmico: ex.: ICMS, ISS, IPI, PIS, COFINS, IRPJ, CSLL...)
create table if not exists public.tax_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- ex.: "ICMS", "ISS"
  name text not null,                     -- nome amigável
  jurisdiction public.jurisdiction not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Regimes Tributários (dinâmico: ex.: Simples Nacional, Lucro Presumido, Lucro Real)
create table if not exists public.tax_regimes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- ex.: "simples_nacional"
  name text not null,                     -- ex.: "Simples Nacional"
  description text,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Classificações Fiscais (NCM / código de serviço / CEST)
create table if not exists public.fiscal_classifications (
  id uuid primary key default gen_random_uuid(),
  type public.classification_type not null,
  ncm_code text,                          -- produtos
  service_code text,                      -- serviços (ex.: LC 116)
  cest text,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela de Alíquotas por jurisdição (UF/município) e classificação
create table if not exists public.tax_rate_tables (
  id uuid primary key default gen_random_uuid(),
  tax_type_id uuid not null references public.tax_types(id) on delete cascade,
  jurisdiction_code text not null,        -- ex.: "SP", "RJ", "3550308" (IBGE), etc.
  classification_id uuid references public.fiscal_classifications(id) on delete set null,
  rate numeric(10,4) not null default 0,  -- alíquota
  base_reduction numeric(10,4) default 0, -- redução de base (%)
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tax_rate_idx on public.tax_rate_tables (tax_type_id, jurisdiction_code, classification_id, valid_from);

-- Regras Fiscais (parametrização por regime, tipo de tributo, operação, UF origem/destino, classificação)
create table if not exists public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  regime_id uuid not null references public.tax_regimes(id) on delete cascade,
  tax_type_id uuid not null references public.tax_types(id) on delete cascade,
  operation public.operation_type not null,
  origin_uf text,
  destination_uf text,
  classification_id uuid references public.fiscal_classifications(id) on delete set null,
  calc_method public.base_calc_method not null default 'percentual',
  rate numeric(10,4),                     -- se calc_method = percentual
  base_reduction numeric(10,4),           -- redução de base (%)
  is_active boolean not null default true,
  priority integer not null default 100,  -- prioridades para escolha de regra
  valid_from date not null default current_date,
  valid_to date,
  formula text,                           -- opcional: expressão armazenada (interpretada no app)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tax_rules_query_idx on public.tax_rules (regime_id, tax_type_id, operation, classification_id, origin_uf, destination_uf, is_active, valid_from);

-- Configurações da Empresa (dados fiscais + regime corrente)
create table if not exists public.company_fiscal_settings (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  cnpj text,
  state text,
  municipality_code text,
  regime_id uuid not null references public.tax_regimes(id) on delete restrict,
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Obrigações Acessórias (catálogo dinâmico de tipos)
create table if not exists public.obligation_kinds (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,              -- ex.: "SPED_FISCAL", "EFD_CONTRIB", "DCTF"
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Instâncias de obrigações por período
create table if not exists public.obligations (
  id uuid primary key default gen_random_uuid(),
  obligation_kind_id uuid not null references public.obligation_kinds(id) on delete restrict,
  period_month int not null check (period_month between 1 and 12),
  period_year int not null check (period_year between 2000 and 2100),
  status public.filing_status not null default 'rascunho',
  generated_file_path text,               -- arquivo no bucket "fiscal-outputs"
  protocol text,
  started_at timestamptz,
  finished_at timestamptz,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (obligation_kind_id, period_year, period_month)
);

-- Apuração / Livro de apuração por período e tributo
create table if not exists public.tax_ledgers (
  id uuid primary key default gen_random_uuid(),
  period_month int not null check (period_month between 1 and 12),
  period_year int not null check (period_year between 2000 and 2100),
  tax_type_id uuid not null references public.tax_types(id) on delete restrict,
  regime_id uuid not null references public.tax_regimes(id) on delete restrict,
  total_credits numeric(14,2) not null default 0,
  total_debits numeric(14,2) not null default 0,
  balance_due numeric(14,2) not null default 0,
  status public.period_status not null default 'aberto',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_year, period_month, tax_type_id, regime_id)
);

-- Cálculos realizados (simulações ou por operação real)
create table if not exists public.tax_calculations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid, -- será conectada à tabela orders depois, com ALTER TABLE
  operation public.operation_type not null,
  classification_id uuid references public.fiscal_classifications(id) on delete set null,
  regime_id uuid not null references public.tax_regimes(id) on delete restrict,
  amount numeric(14,2) not null,
  origin_uf text,
  destination_uf text,
  calculated_at timestamptz not null default now(),
  result jsonb not null,                  -- detalhamento por tributo (base, alíquota, valor, observações)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tax_calc_order_idx on public.tax_calculations (order_id, calculated_at desc);

-- ========== TRIGGERS updated_at ==========

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tax_types_updated_at on public.tax_types;
create trigger trg_tax_types_updated_at before update on public.tax_types
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_tax_regimes_updated_at on public.tax_regimes;
create trigger trg_tax_regimes_updated_at before update on public.tax_regimes
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_fiscal_class_updated_at on public.fiscal_classifications;
create trigger trg_fiscal_class_updated_at before update on public.fiscal_classifications
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_tax_rate_tables_updated_at on public.tax_rate_tables;
create trigger trg_tax_rate_tables_updated_at before update on public.tax_rate_tables
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_tax_rules_updated_at on public.tax_rules;
create trigger trg_tax_rules_updated_at before update on public.tax_rules
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_company_fiscal_settings_updated_at on public.company_fiscal_settings;
create trigger trg_company_fiscal_settings_updated_at before update on public.company_fiscal_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_obligation_kinds_updated_at on public.obligation_kinds;
create trigger trg_obligation_kinds_updated_at before update on public.obligation_kinds
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_obligations_updated_at on public.obligations;
create trigger trg_obligations_updated_at before update on public.obligations
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_tax_ledgers_updated_at on public.tax_ledgers;
create trigger trg_tax_ledgers_updated_at before update on public.tax_ledgers
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_tax_calculations_updated_at on public.tax_calculations;
create trigger trg_tax_calculations_updated_at before update on public.tax_calculations
for each row execute procedure public.set_updated_at();

-- ========== RLS ==========

alter table public.tax_types enable row level security;
alter table public.tax_regimes enable row level security;
alter table public.fiscal_classifications enable row level security;
alter table public.tax_rate_tables enable row level security;
alter table public.tax_rules enable row level security;
alter table public.company_fiscal_settings enable row level security;
alter table public.obligation_kinds enable row level security;
alter table public.obligations enable row level security;
alter table public.tax_ledgers enable row level security;
alter table public.tax_calculations enable row level security;

-- Políticas padrão: permitir gestão por usuários autenticados (ajustaremos depois se desejar multi-tenant/roles granulares)
create policy "Authenticated users can manage tax_types"
on public.tax_types for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage tax_regimes"
on public.tax_regimes for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage fiscal_classifications"
on public.fiscal_classifications for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage tax_rate_tables"
on public.tax_rate_tables for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage tax_rules"
on public.tax_rules for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage company_fiscal_settings"
on public.company_fiscal_settings for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage obligation_kinds"
on public.obligation_kinds for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage obligations"
on public.obligations for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage tax_ledgers"
on public.tax_ledgers for all to authenticated using (true) with check (true);

create policy "Authenticated users can manage tax_calculations"
on public.tax_calculations for all to authenticated using (true) with check (true);

-- ========== STORAGE: BUCKET PRIVADO PARA ARQUIVOS FISCAIS ==========

-- Cria bucket privado para saídas fiscais (SPED, EFD, declarações)
insert into storage.buckets (id, name, public)
values ('fiscal-outputs','fiscal-outputs', false)
on conflict (id) do nothing;

-- Políticas de acesso aos objetos do bucket fiscal-outputs
create policy "Users can view fiscal outputs"
on storage.objects for select to authenticated
using (bucket_id = 'fiscal-outputs');

create policy "Users can upload fiscal outputs"
on storage.objects for insert to authenticated
with check (bucket_id = 'fiscal-outputs');

create policy "Users can update fiscal outputs"
on storage.objects for update to authenticated
using (bucket_id = 'fiscal-outputs');

-- Admins can delete fiscal outputs (policy will be added after is_admin() function is created)
-- create policy "Admins can delete fiscal outputs"
-- on storage.objects for delete to authenticated
-- using (bucket_id = 'fiscal-outputs' and public.is_admin());
