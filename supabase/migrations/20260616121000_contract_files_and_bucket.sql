-- Upload de contratos: arquivo (PDF/imagem) anexado ao contrato + extração por IA pré-preenche o formulário.

-- 1) Bucket privado para os arquivos de contrato
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit,
  public = EXCLUDED.public;

-- 2) RLS do bucket: escopo por organização via primeiro segmento do path ({org_id}/...)
DROP POLICY IF EXISTS "contracts_select_org" ON storage.objects;
CREATE POLICY "contracts_select_org" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);

DROP POLICY IF EXISTS "contracts_insert_org" ON storage.objects;
CREATE POLICY "contracts_insert_org" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);

DROP POLICY IF EXISTS "contracts_update_org" ON storage.objects;
CREATE POLICY "contracts_update_org" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);

DROP POLICY IF EXISTS "contracts_delete_org" ON storage.objects;
CREATE POLICY "contracts_delete_org" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'contracts'
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);

-- 3) Referência do arquivo no contrato
ALTER TABLE public.supplier_contracts
  ADD COLUMN IF NOT EXISTS contract_file_path text,
  ADD COLUMN IF NOT EXISTS contract_file_name text;

COMMENT ON COLUMN public.supplier_contracts.contract_file_path IS
  'Caminho no bucket storage "contracts" do arquivo original do contrato (PDF/imagem).';
COMMENT ON COLUMN public.supplier_contracts.contract_file_name IS
  'Nome original do arquivo do contrato enviado pelo usuário.';
