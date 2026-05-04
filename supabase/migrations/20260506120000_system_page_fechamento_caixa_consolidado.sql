-- Página: consolidado diário de fechamentos de caixa (todos os operadores / contas)
INSERT INTO public.system_pages (name, display_name, description, route_path, module, icon, is_active)
VALUES (
  'fechamento-caixa-consolidado',
  'Consolidado de caixa',
  'Visão por data somando fechamentos de todas as contas de caixa da organização',
  '/fechamento-caixa/consolidado',
  'financial',
  'LayoutGrid',
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
