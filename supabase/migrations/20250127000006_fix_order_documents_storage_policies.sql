-- Ajusta as policies do bucket order-documents para permitir upload antes de registrar o documento

DROP POLICY IF EXISTS "Users can view their own order documents or admins can view all" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload documents for their own orders or admins can upload all" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents for their own orders or admins can update all" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete order documents" ON storage.objects;

-- Visualização
CREATE POLICY "Users can view their own order documents or admins can view all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-documents' AND (
    public.is_admin() OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      JOIN LATERAL regexp_matches(name, '^([0-9a-fA-F-]{36})/') AS match(order_uuid_text) ON true
      WHERE o.id = match.order_uuid_text[1]::uuid
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

-- Upload
CREATE POLICY "Users can upload documents for their own orders or admins can upload all"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-documents' AND (
    public.is_admin() OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      JOIN LATERAL regexp_matches(name, '^([0-9a-fA-F-]{36})/') AS match(order_uuid_text) ON true
      WHERE o.id = match.order_uuid_text[1]::uuid
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

-- Atualização de metadados
CREATE POLICY "Users can update documents for their own orders or admins can update all"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'order-documents' AND (
    public.is_admin() OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.customers c ON o.customer_id = c.id
      JOIN LATERAL regexp_matches(name, '^([0-9a-fA-F-]{36})/') AS match(order_uuid_text) ON true
      WHERE o.id = match.order_uuid_text[1]::uuid
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

-- Exclusão apenas para administradores
CREATE POLICY "Admins can delete order documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-documents' AND public.is_admin()
);

