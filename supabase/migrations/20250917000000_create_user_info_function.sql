-- Função para buscar informações básicas dos usuários da organização
-- Esta função é executada com privilégios de segurança do sistema
CREATE OR REPLACE FUNCTION get_organization_users_info(org_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Esta função precisa ser implementada no backend ou via Edge Function
  -- Por enquanto, retorna dados básicos disponíveis
  SELECT 
    ou.user_id,
    COALESCE(p.email, 'email@example.com') as email,
    COALESCE(p.name, 'Nome não disponível') as name,
    ou.created_at
  FROM organization_users ou
  LEFT JOIN profiles p ON p.user_id = ou.user_id
  WHERE ou.organization_id = org_id
  AND ou.is_active = true
  ORDER BY ou.created_at DESC;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_organization_users_info(UUID) TO authenticated;
