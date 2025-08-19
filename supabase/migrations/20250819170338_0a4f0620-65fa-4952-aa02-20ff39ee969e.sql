
-- 1) Garantir que o bucket fiscal-outputs exista (não torna público)
insert into storage.buckets (id, name, public)
values ('fiscal-outputs', 'fiscal-outputs', false)
on conflict (id) do nothing;

-- 2) Tabela de arquivos de obrigações
create table if not exists public.obligation_files (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_type text not null,              -- exemplo: 'SPED_CONTRIB', 'SPED_FISCAL', 'GIA', etc.
  mime_type text,
  size_bytes integer,
  hash_sha256 text,
  generated_by uuid,                    -- id do usuário (NÃO referenciar auth.users)
  generated_at timestamptz not null default now(),
  status text not null default 'success',  -- 'success' | 'error' | 'processing' ...
  error_message text
);

-- 3) Índices
create index if not exists obligation_files_obligation_id_idx on public.obligation_files(obligation_id);
create index if not exists obligation_files_generated_at_idx on public.obligation_files(generated_at);

-- 4) RLS na tabela obligation_files
alter table public.obligation_files enable row level security;

-- Política alinhada ao padrão atual do projeto (permissiva para usuários autenticados)
-- Caso queira mais restritivo (por generated_by ou admin), posso ajustar depois.
drop policy if exists "Authenticated users can manage obligation_files" on public.obligation_files;
create policy "Authenticated users can manage obligation_files"
  on public.obligation_files
  as permissive
  for all
  to authenticated
  using (true)
  with check (true);

-- 5) Políticas de Storage para bucket fiscal-outputs
-- Convenção de path: {userId}/{obligationId}/{nomeArquivo}
-- Usuário só pode gerenciar sua própria pasta; admins podem tudo

-- SELECT
drop policy if exists "Users can view their own fiscal outputs or admins" on storage.objects;
create policy "Users can view their own fiscal outputs or admins"
  on storage.objects
  as permissive
  for select
  to authenticated
  using (
    bucket_id = 'fiscal-outputs'
    and (
      auth.uid()::text = split_part(name, '/', 1)
      or public.is_admin()
    )
  );

-- INSERT
drop policy if exists "Users can upload to their own fiscal outputs folder" on storage.objects;
create policy "Users can upload to their own fiscal outputs folder"
  on storage.objects
  as permissive
  for insert
  to authenticated
  with check (
    bucket_id = 'fiscal-outputs'
    and (
      auth.uid()::text = split_part(name, '/', 1)
      or public.is_admin()
    )
  );

-- UPDATE
drop policy if exists "Users can update their own fiscal outputs files" on storage.objects;
create policy "Users can update their own fiscal outputs files"
  on storage.objects
  as permissive
  for update
  to authenticated
  using (
    bucket_id = 'fiscal-outputs'
    and (
      auth.uid()::text = split_part(name, '/', 1)
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'fiscal-outputs'
    and (
      auth.uid()::text = split_part(name, '/', 1)
      or public.is_admin()
    )
  );

-- DELETE
drop policy if exists "Users can delete their own fiscal outputs files" on storage.objects;
create policy "Users can delete their own fiscal outputs files"
  on storage.objects
  as permissive
  for delete
  to authenticated
  using (
    bucket_id = 'fiscal-outputs'
    and (
      auth.uid()::text = split_part(name, '/', 1)
      or public.is_admin()
    )
  );
