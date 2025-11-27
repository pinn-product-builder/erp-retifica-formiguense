-- Migration: Criar checklists padrão de metrologia para cada componente
-- Componentes: Bloco, Biela, Virabrequim, Comando - Balanceiros, Volante, Montagem Completa

-- Função auxiliar para criar checklist e seus itens
CREATE OR REPLACE FUNCTION create_metrology_checklist(
  p_org_id uuid,
  p_component text,
  p_name text,
  p_description text,
  p_items jsonb
) RETURNS uuid AS $$
DECLARE
  v_checklist_id uuid;
  v_item jsonb;
  v_display_order integer := 0;
BEGIN
  -- Criar checklist
  INSERT INTO public.diagnostic_checklists (
    org_id,
    component,
    name,
    description,
    version,
    is_active,
    is_default
  ) VALUES (
    p_org_id,
    p_component::public.engine_component,
    p_name,
    p_description,
    1,
    true,
    true
  ) RETURNING id INTO v_checklist_id;

  -- Criar itens do checklist
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_display_order := v_display_order + 1;
    
    INSERT INTO public.diagnostic_checklist_items (
      checklist_id,
      item_name,
      item_description,
      item_type,
      is_required,
      display_order,
      item_options,
      help_text
    ) VALUES (
      v_checklist_id,
      v_item->>'name',
      v_item->>'description',
      COALESCE(v_item->>'type', 'text'),
      COALESCE((v_item->>'required')::boolean, false),
      v_display_order,
      COALESCE(v_item->'options', '{}'::jsonb),
      v_item->>'help_text'
    );
  END LOOP;

  RETURN v_checklist_id;
END;
$$ LANGUAGE plpgsql;

-- Checklist para BLOCO
DO $$
DECLARE
  v_org_id uuid;
  v_checklist_id uuid;
BEGIN
  -- Buscar primeira organização ou usar NULL para organizações específicas
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  
  -- Criar checklist de Bloco
  v_checklist_id := create_metrology_checklist(
    v_org_id,
    'bloco',
    'Checklist de Metrologia - Bloco',
    'Checklist padrão para metrologia de bloco de motor',
    '[
      {
        "name": "Diâmetro dos Cilindros",
        "description": "Medição do diâmetro interno dos cilindros",
        "type": "number",
        "required": true,
        "help_text": "Medir em múltiplos pontos (superior, médio, inferior)"
      },
      {
        "name": "Ovalização",
        "description": "Verificação de ovalização dos cilindros",
        "type": "number",
        "required": true,
        "help_text": "Diferença entre maior e menor diâmetro"
      },
      {
        "name": "Conicidade",
        "description": "Verificação de conicidade dos cilindros",
        "type": "number",
        "required": true,
        "help_text": "Diferença entre diâmetro superior e inferior"
      },
      {
        "name": "Plano de Superfície",
        "description": "Verificação do plano da superfície do bloco",
        "type": "number",
        "required": true,
        "help_text": "Medição da planicidade da superfície superior"
      },
      {
        "name": "Alinhamento dos Cilindros",
        "description": "Verificação do alinhamento dos cilindros",
        "type": "checkbox",
        "required": true,
        "help_text": "Verificar se os cilindros estão alinhados"
      },
      {
        "name": "Fotos",
        "description": "Fotos do bloco",
        "type": "photo",
        "required": false
      },
      {
        "name": "Observações",
        "description": "Observações adicionais sobre o bloco",
        "type": "textarea",
        "required": false
      }
    ]'::jsonb
  );
END $$;

-- Checklist para BIELA
DO $$
DECLARE
  v_org_id uuid;
  v_checklist_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  
  v_checklist_id := create_metrology_checklist(
    v_org_id,
    'biela',
    'Checklist de Metrologia - Biela',
    'Checklist padrão para metrologia de biela',
    '[
      {
        "name": "Diâmetro do Pino",
        "description": "Medição do diâmetro do pino da biela",
        "type": "number",
        "required": true
      },
      {
        "name": "Diâmetro do Munhão",
        "description": "Medição do diâmetro do munhão da biela",
        "type": "number",
        "required": true
      },
      {
        "name": "Comprimento Centro a Centro",
        "description": "Medição do comprimento entre centros",
        "type": "number",
        "required": true
      },
      {
        "name": "Paralelismo",
        "description": "Verificação do paralelismo entre pino e munhão",
        "type": "number",
        "required": true
      },
      {
        "name": "Alinhamento",
        "description": "Verificação do alinhamento da biela",
        "type": "checkbox",
        "required": true
      },
      {
        "name": "Fotos",
        "description": "Fotos da biela",
        "type": "photo",
        "required": false
      },
      {
        "name": "Observações",
        "description": "Observações adicionais sobre a biela",
        "type": "textarea",
        "required": false
      }
    ]'::jsonb
  );
END $$;

-- Checklist para VIRABREQUIM
DO $$
DECLARE
  v_org_id uuid;
  v_checklist_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  
  v_checklist_id := create_metrology_checklist(
    v_org_id,
    'virabrequim',
    'Checklist de Metrologia - Virabrequim',
    'Checklist padrão para metrologia de virabrequim',
    '[
      {
        "name": "Diâmetro dos Munhões",
        "description": "Medição do diâmetro dos munhões do virabrequim",
        "type": "number",
        "required": true,
        "help_text": "Medir todos os munhões"
      },
      {
        "name": "Diâmetro dos Pinos",
        "description": "Medição do diâmetro dos pinos do virabrequim",
        "type": "number",
        "required": true,
        "help_text": "Medir todos os pinos"
      },
      {
        "name": "Ovalização dos Munhões",
        "description": "Verificação de ovalização dos munhões",
        "type": "number",
        "required": true
      },
      {
        "name": "Ovalização dos Pinos",
        "description": "Verificação de ovalização dos pinos",
        "type": "number",
        "required": true
      },
      {
        "name": "Alinhamento",
        "description": "Verificação do alinhamento do virabrequim",
        "type": "checkbox",
        "required": true
      },
      {
        "name": "Fotos",
        "description": "Fotos do virabrequim",
        "type": "photo",
        "required": false
      },
      {
        "name": "Observações",
        "description": "Observações adicionais sobre o virabrequim",
        "type": "textarea",
        "required": false
      }
    ]'::jsonb
  );
END $$;

-- Checklist para COMANDO (Balanceiros)
DO $$
DECLARE
  v_org_id uuid;
  v_checklist_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  
  v_checklist_id := create_metrology_checklist(
    v_org_id,
    'comando',
    'Checklist de Metrologia - Comando (Balanceiros)',
    'Checklist padrão para metrologia de comando de válvulas e balanceiros',
    '[
      {
        "name": "Diâmetro dos Munhões",
        "description": "Medição do diâmetro dos munhões do comando",
        "type": "number",
        "required": true
      },
      {
        "name": "Diâmetro dos Balanceiros",
        "description": "Medição do diâmetro dos balanceiros",
        "type": "number",
        "required": true
      },
      {
        "name": "Altura das Cames",
        "description": "Medição da altura das cames",
        "type": "number",
        "required": true
      },
      {
        "name": "Alinhamento",
        "description": "Verificação do alinhamento do comando",
        "type": "checkbox",
        "required": true
      },
      {
        "name": "Fotos",
        "description": "Fotos do comando e balanceiros",
        "type": "photo",
        "required": false
      },
      {
        "name": "Observações",
        "description": "Observações adicionais sobre o comando",
        "type": "textarea",
        "required": false
      }
    ]'::jsonb
  );
END $$;

-- Checklist para VOLANTE
-- Nota: Usando 'volante_motor' se 'volante' não existir, ou criar ambos
DO $$
DECLARE
  v_org_id uuid;
  v_checklist_id uuid;
  v_component_name text;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  
  -- Verificar qual componente usar
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'volante' AND enumtypid = 'engine_component'::regtype) 
    THEN 'volante' 
    ELSE 'volante_motor' 
  END INTO v_component_name;
  
  v_checklist_id := create_metrology_checklist(
    v_org_id,
    v_component_name,
    'Checklist de Metrologia - Volante',
    'Checklist padrão para metrologia de volante',
    '[
      {
        "name": "Diâmetro Externo",
        "description": "Medição do diâmetro externo do volante",
        "type": "number",
        "required": true
      },
      {
        "name": "Diâmetro do Furo Central",
        "description": "Medição do diâmetro do furo central",
        "type": "number",
        "required": true
      },
      {
        "name": "Espessura",
        "description": "Medição da espessura do volante",
        "type": "number",
        "required": true
      },
      {
        "name": "Planicidade",
        "description": "Verificação da planicidade do volante",
        "type": "number",
        "required": true
      },
      {
        "name": "Estado dos Dentes",
        "description": "Verificação do estado dos dentes da coroa",
        "type": "checkbox",
        "required": true
      },
      {
        "name": "Fotos",
        "description": "Fotos do volante",
        "type": "photo",
        "required": false
      },
      {
        "name": "Observações",
        "description": "Observações adicionais sobre o volante",
        "type": "textarea",
        "required": false
      }
    ]'::jsonb
  );
END $$;

-- Checklist para MONTAGEM COMPLETA
-- Nota: Se 'montagem' não existir, usar um componente genérico ou criar o enum primeiro
DO $$
DECLARE
  v_org_id uuid;
  v_checklist_id uuid;
  v_component_name text;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  
  -- Verificar qual componente usar
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'montagem' AND enumtypid = 'engine_component'::regtype) 
    THEN 'montagem' 
    ELSE 'bloco' -- Fallback temporário
  END INTO v_component_name;
  
  v_checklist_id := create_metrology_checklist(
    v_org_id,
    v_component_name,
    'Checklist de Metrologia - Montagem Completa',
    'Checklist padrão para verificação final da montagem completa do motor',
    '[
      {
        "name": "Folga dos Pistões",
        "description": "Verificação da folga dos pistões nos cilindros",
        "type": "number",
        "required": true
      },
      {
        "name": "Folga dos Anéis",
        "description": "Verificação da folga dos anéis dos pistões",
        "type": "number",
        "required": true
      },
      {
        "name": "Folga dos Munhões",
        "description": "Verificação da folga dos munhões do virabrequim",
        "type": "number",
        "required": true
      },
      {
        "name": "Folga dos Pinos",
        "description": "Verificação da folga dos pinos das bielas",
        "type": "number",
        "required": true
      },
      {
        "name": "Torque dos Parafusos",
        "description": "Verificação do torque dos parafusos principais",
        "type": "checkbox",
        "required": true
      },
      {
        "name": "Alinhamento Geral",
        "description": "Verificação do alinhamento geral do motor",
        "type": "checkbox",
        "required": true
      },
      {
        "name": "Fotos",
        "description": "Fotos da montagem completa",
        "type": "photo",
        "required": false
      },
      {
        "name": "Observações",
        "description": "Observações finais sobre a montagem",
        "type": "textarea",
        "required": false
      }
    ]'::jsonb
  );
END $$;

-- Remover função auxiliar após uso
DROP FUNCTION IF EXISTS create_metrology_checklist(uuid, text, text, text, jsonb);

