-- Página: visão consolidada de cobrança por cliente (multi-organização)
INSERT INTO public.system_pages (name, display_name, description, route_path, module, icon, is_active)
VALUES (
  'customer-ar-position',
  'Posição do cliente',
  'Contas a receber e recebimentos por CPF/CNPJ nas empresas com acesso',
  '/posicao-cliente-cobranca',
  'financial',
  'ContactRound',
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  route_path = EXCLUDED.route_path,
  module = EXCLUDED.module,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  updated_at = now();
