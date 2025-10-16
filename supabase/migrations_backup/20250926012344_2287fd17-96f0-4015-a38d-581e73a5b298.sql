-- Criar bucket para fotos de diagnóstico
INSERT INTO storage.buckets (id, name, public) 
VALUES ('diagnostic-photos', 'diagnostic-photos', false);

-- Política para visualizar fotos de diagnóstico da organização
CREATE POLICY "Users can view diagnostic photos from their organization" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'diagnostic-photos' 
  AND EXISTS (
    SELECT 1 
    FROM diagnostic_checklist_responses dcr
    JOIN orders o ON o.id = dcr.order_id
    WHERE dcr.id::text = (storage.foldername(name))[1]
    AND o.org_id = current_org_id()
  )
);

-- Política para fazer upload de fotos de diagnóstico
CREATE POLICY "Users can upload diagnostic photos for their organization" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'diagnostic-photos' 
  AND EXISTS (
    SELECT 1 
    FROM diagnostic_checklist_responses dcr
    JOIN orders o ON o.id = dcr.order_id
    WHERE dcr.id::text = (storage.foldername(name))[1]
    AND o.org_id = current_org_id()
  )
);

-- Política para deletar fotos de diagnóstico da organização
CREATE POLICY "Users can delete diagnostic photos from their organization" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'diagnostic-photos' 
  AND EXISTS (
    SELECT 1 
    FROM diagnostic_checklist_responses dcr
    JOIN orders o ON o.id = dcr.order_id
    WHERE dcr.id::text = (storage.foldername(name))[1]
    AND o.org_id = current_org_id()
  )
);

-- Adicionar políticas RLS faltantes para diagnostic_checklist_items
CREATE POLICY "Admins can manage diagnostic checklist items" 
ON diagnostic_checklist_items 
FOR ALL
USING (
  checklist_id IN (
    SELECT dc.id 
    FROM diagnostic_checklists dc
    WHERE dc.org_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  )
);

-- Adicionar políticas RLS faltantes para diagnostic_checklist_responses
CREATE POLICY "Users can update diagnostic responses for their organization" 
ON diagnostic_checklist_responses 
FOR UPDATE
USING (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE org_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete diagnostic responses for their organization" 
ON diagnostic_checklist_responses 
FOR DELETE
USING (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE org_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  )
);

-- Corrigir política de detailed_budgets para permitir UPDATE e DELETE
CREATE POLICY "Users can update budgets for their organization" 
ON detailed_budgets 
FOR UPDATE
USING (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE org_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete budgets for their organization" 
ON detailed_budgets 
FOR DELETE
USING (
  order_id IN (
    SELECT id 
    FROM orders 
    WHERE org_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  )
);