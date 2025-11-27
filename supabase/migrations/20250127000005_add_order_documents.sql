-- Create bucket for order documents (PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-documents', 'order-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Table to track uploaded documents per order
CREATE TABLE IF NOT EXISTS public.order_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'outros',
  file_path text NOT NULL,
  file_name text NOT NULL,
  description text NULL,
  uploaded_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.order_documents IS 'Documentos em PDF associados a ordens de serviço';
COMMENT ON COLUMN public.order_documents.document_type IS 'Classificação do documento (contrato, checklist, relatório, etc.)';

CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON public.order_documents(order_id);

ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;

-- Policies mirroring order_photos (customers that own the order or admins)
CREATE POLICY "Users can view documents for their own orders or admins can view all"
ON public.order_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id
      AND (c.created_by = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users can upload documents for their own orders or admins can upload all"
ON public.order_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id
      AND (c.created_by = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users can update documents for their own orders or admins can update all"
ON public.order_documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id
      AND (c.created_by = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Admins can delete order documents"
ON public.order_documents
FOR DELETE
TO authenticated
USING (
  public.is_admin()
);

-- Storage policies for order documents bucket
CREATE POLICY "Users can view their own order documents or admins can view all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-documents' AND (
    EXISTS (
      SELECT 1 FROM public.order_documents od
      JOIN public.orders o ON od.order_id = o.id
      JOIN public.customers c ON o.customer_id = c.id
      WHERE od.file_path = name
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

CREATE POLICY "Users can upload documents for their own orders or admins can upload all"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-documents' AND (
    EXISTS (
      SELECT 1 FROM public.order_documents od
      JOIN public.orders o ON od.order_id = o.id
      JOIN public.customers c ON o.customer_id = c.id
      WHERE od.file_path = name
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

CREATE POLICY "Users can update documents for their own orders or admins can update all"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'order-documents' AND (
    EXISTS (
      SELECT 1 FROM public.order_documents od
      JOIN public.orders o ON od.order_id = o.id
      JOIN public.customers c ON o.customer_id = c.id
      WHERE od.file_path = name
        AND (c.created_by = auth.uid() OR public.is_admin())
    )
  )
);

CREATE POLICY "Admins can delete order documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-documents' AND public.is_admin()
);

