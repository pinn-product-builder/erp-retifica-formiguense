INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/xml',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit,
  public = EXCLUDED.public;

DROP POLICY IF EXISTS "invoices_select_org" ON storage.objects;
CREATE POLICY "invoices_select_org" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);

DROP POLICY IF EXISTS "invoices_insert_org" ON storage.objects;
CREATE POLICY "invoices_insert_org" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);

DROP POLICY IF EXISTS "invoices_update_org" ON storage.objects;
CREATE POLICY "invoices_update_org" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);

DROP POLICY IF EXISTS "invoices_delete_org" ON storage.objects;
CREATE POLICY "invoices_delete_org" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = (storage.foldername(name))[1]::uuid
      AND ou.user_id = auth.uid()
      AND ou.is_active = true
  )
);
