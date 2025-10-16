-- Execute este SQL no painel do Supabase (SQL Editor)
-- para permitir uploads de imagem no bucket reports

UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'text/csv', 
  'application/pdf', 
  'application/json', 
  'text/plain',
  'image/jpeg',
  'image/png'
]
WHERE id = 'reports';

-- Verificar se foi atualizado
SELECT id, name, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'reports';
