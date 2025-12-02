-- Script gerado para popular serviços adicionais
-- Total de serviços únicos: 43
-- Mapeamento: 0002 BIELA -> Biela, 0003 BLOCO -> Bloco, 0004 CABECOTE -> Cabecote, 
--             0005 COMANDO -> Comando, 0006 VIRABREQUIM -> Virabrequim,
--             0007 MONTAGEM/0014 MOTOR/0015 DIVERSOS -> Montagem Completa

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'EMBUCHAR E MANDRILHAR BUCHA DE BI',
  75.1::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Biela'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'EMBUCHAR E MANDRILHAR BUCHA DE BI'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'GERAL NAS BIELAS',
  53.1::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Biela'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'GERAL NAS BIELAS'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'DESMONTAGEM MANCAIS',
  30::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Bloco'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'DESMONTAGEM MANCAIS'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'ENCAMISAR CILINDRO-LEVE',
  120::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Bloco'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'ENCAMISAR CILINDRO-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'PLAINAR FACE BLOCO-LEVE',
  400::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Bloco'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'PLAINAR FACE BLOCO-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'POLIR CAIXA FIXA',
  111.7::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Bloco'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'POLIR CAIXA FIXA'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'RETIFICAR E BRUNIR CILINDRO-LEVE',
  180.4::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Bloco'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'RETIFICAR E BRUNIR CILINDRO-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'SOLDAR/RECUPERAR BLOCO-LEVE',
  1037.3::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Bloco'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'SOLDAR/RECUPERAR BLOCO-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'TESTAR BLOCO-LEVE',
  300::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Bloco'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'TESTAR BLOCO-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'ESMERILHAR E MONTAR VÁLVULAS-LEVE',
  450.8::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'ESMERILHAR E MONTAR VÁLVULAS-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'JATEAR CABEÇOTE-LEVE',
  31.4::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'JATEAR CABEÇOTE-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'PLAINAR CABEÇOTE',
  232.3::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'PLAINAR CABEÇOTE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'PLAINAR CABEÇOTE-LEVE',
  200::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'PLAINAR CABEÇOTE-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'RETIFICAR SEDE DE VÁLVULA-LEVE',
  9::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'RETIFICAR SEDE DE VÁLVULA-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'RETIFICAR VALVULAS',
  12.7::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'RETIFICAR VALVULAS'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'SOLDA G NA FACE DO CABEÇOTE',
  120::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'SOLDA G NA FACE DO CABEÇOTE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'SOLDA P NA FACE CABEÇOTE',
  80::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'SOLDA P NA FACE CABEÇOTE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'SOLDA FACE CABEÇOTE',
  80::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'SOLDA FACE CABEÇOTE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'SUBSTITUIR GUIA-LEVE',
  11.7::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Cabecote'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'SUBSTITUIR GUIA-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'GABARITAR COMANDO',
  0.01::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Comando'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'GABARITAR COMANDO'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'MONTAR/DESMONTAR ENGRENAGEM',
  0.01::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Comando'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'MONTAR/DESMONTAR ENGRENAGEM'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'SUBSTITUIR EIXO COMANDO',
  0.01::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Comando'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'SUBSTITUIR EIXO COMANDO'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'ENGRENAGEM VIRABREQUIM',
  0.01::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Virabrequim'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'ENGRENAGEM VIRABREQUIM'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'POLIR VIRABREQUIM',
  63.7::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Virabrequim'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'POLIR VIRABREQUIM'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'RECUPERAR ENCOSTO DO EIXO',
  550::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Virabrequim'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'RECUPERAR ENCOSTO DO EIXO'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'RETIFICAR COLO FIXO-LEVE',
  120::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Virabrequim'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'RETIFICAR COLO FIXO-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'RETIFICAR COLO MÓVEL-LEVE',
  120::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Virabrequim'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'RETIFICAR COLO MÓVEL-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'SUBSTITUICAO VIRABREQUIM',
  0.01::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Virabrequim'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'SUBSTITUICAO VIRABREQUIM'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'AJUSTAR BIELA E EIXO NO BLOCO',
  319::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'AJUSTAR BIELA E EIXO NO BLOCO'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'MONTAGEM COMPLETA-LEVE',
  2500::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'MONTAGEM COMPLETA-LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'DIÁRIA MECÂNICO',
  50::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'DIÁRIA MECÂNICO'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'INSTALAR MOTOR',
  1800::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'INSTALAR MOTOR'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'PINTURA - MOTORES LINHA LEVE',
  100::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'PINTURA - MOTORES LINHA LEVE'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'REMOÇAO MOTOR',
  750::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'REMOÇAO MOTOR'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'REMOVER MOTOR',
  1800::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'REMOVER MOTOR'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'TROCAR OLEO',
  50::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'TROCAR OLEO'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'DESMONTAGEM DO MOTOR',
  183.6::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'DESMONTAGEM DO MOTOR'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'DESMONTAGEM PARCIAL DO MOTOR',
  94.6::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'DESMONTAGEM PARCIAL DO MOTOR'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'DESPESA DE DESLOCAMENTO',
  0.01::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'DESPESA DE DESLOCAMENTO'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'INSPEÇÃO COMPONENTES CONFORME NBR',
  90::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'INSPEÇÃO COMPONENTES CONFORME NBR'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'LAVAÇÃO QUÍMICA+TÉRMICA DAS PÇS',
  120.2::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'LAVAÇÃO QUÍMICA+TÉRMICA DAS PÇS'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'OLEO LUBRIFICANTE ESPECIAL',
  75.1::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'OLEO LUBRIFICANTE ESPECIAL'
  );

INSERT INTO public.additional_services (description, value, macro_component_id, org_id, is_active)
SELECT 
  'PINTURA GERAL',
  75.1::NUMERIC(10,2),
  mc.id,
  o.id,
  true
FROM public.organizations o
CROSS JOIN public.macro_components mc
WHERE mc.org_id = o.id 
  AND mc.name = 'Montagem Completa'
  AND NOT EXISTS (
    SELECT 1 FROM public.additional_services as a
    WHERE a.org_id = o.id
      AND a.macro_component_id = mc.id
      AND a.description = 'PINTURA GERAL'
  );
