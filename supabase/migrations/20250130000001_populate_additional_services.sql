
-- Script gerado automaticamente para popular serviços adicionais
-- Total de serviços: 43

DO $$
DECLARE
  v_org_id UUID;
  v_component_id UUID;
  v_description TEXT;
  v_value NUMERIC(10,2);
  v_service_count INTEGER := 0;
BEGIN
  -- Processar cada organização
  FOR v_org_id IN SELECT id FROM public.organizations LOOP


    -- EMBUCHAR E MANDRILHAR BUCHA DE BI
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Biela'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'EMBUCHAR E MANDRILHAR BUCHA DE BI'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'EMBUCHAR E MANDRILHAR BUCHA DE BI',
          75.1::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- DESMONTAGEM MANCAIS
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Bloco'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'DESMONTAGEM MANCAIS'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'DESMONTAGEM MANCAIS',
          30::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- ENCAMISAR CILINDRO-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Bloco'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'ENCAMISAR CILINDRO-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'ENCAMISAR CILINDRO-LEVE',
          120::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- PLAINAR FACE BLOCO-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Bloco'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'PLAINAR FACE BLOCO-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'PLAINAR FACE BLOCO-LEVE',
          400::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- POLIR CAIXA FIXA
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Bloco'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'POLIR CAIXA FIXA'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'POLIR CAIXA FIXA',
          111.7::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- RETIFICAR E BRUNIR CILINDRO-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Bloco'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'RETIFICAR E BRUNIR CILINDRO-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'RETIFICAR E BRUNIR CILINDRO-LEVE',
          180.4::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- SOLDAR/RECUPERAR BLOCO-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Bloco'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'SOLDAR/RECUPERAR BLOCO-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'SOLDAR/RECUPERAR BLOCO-LEVE',
          1037.3::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- TESTAR BLOCO-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Bloco'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'TESTAR BLOCO-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'TESTAR BLOCO-LEVE',
          300::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- ESMERILHAR E MONTAR VÁLVULAS-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'ESMERILHAR E MONTAR VÁLVULAS-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'ESMERILHAR E MONTAR VÁLVULAS-LEVE',
          450.8::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- JATEAR CABEÇOTE-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'JATEAR CABEÇOTE-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'JATEAR CABEÇOTE-LEVE',
          31.4::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- PLAINAR CABEÇOTE-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'PLAINAR CABEÇOTE-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'PLAINAR CABEÇOTE-LEVE',
          200::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- RETIFICAR VALVULAS
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'RETIFICAR VALVULAS'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'RETIFICAR VALVULAS',
          12.7::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- SOLDA G NA FACE DO CABEÇOTE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'SOLDA G NA FACE DO CABEÇOTE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'SOLDA G NA FACE DO CABEÇOTE',
          120::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- SUBSTITUIR GUIA-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'SUBSTITUIR GUIA-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'SUBSTITUIR GUIA-LEVE',
          11.7::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- GABARITAR COMANDO
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Comando'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'GABARITAR COMANDO'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'GABARITAR COMANDO',
          0.01::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- MONTAR/DESMONTAR ENGRENAGEM
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Comando'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'MONTAR/DESMONTAR ENGRENAGEM'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'MONTAR/DESMONTAR ENGRENAGEM',
          0.01::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- SUBSTITUIR EIXO COMANDO
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Comando'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'SUBSTITUIR EIXO COMANDO'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'SUBSTITUIR EIXO COMANDO',
          0.01::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- ENGRENAGEM VIRABREQUIM
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Virabrequim'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'ENGRENAGEM VIRABREQUIM'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'ENGRENAGEM VIRABREQUIM',
          0.01::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- POLIR VIRABREQUIM
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Virabrequim'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'POLIR VIRABREQUIM'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'POLIR VIRABREQUIM',
          63.7::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- RECUPERAR ENCOSTO DO EIXO
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Virabrequim'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'RECUPERAR ENCOSTO DO EIXO'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'RECUPERAR ENCOSTO DO EIXO',
          550::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- RETIFICAR COLO FIXO-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Virabrequim'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'RETIFICAR COLO FIXO-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'RETIFICAR COLO FIXO-LEVE',
          120::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- RETIFICAR COLO MÓVEL-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Virabrequim'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'RETIFICAR COLO MÓVEL-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'RETIFICAR COLO MÓVEL-LEVE',
          120::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- SUBSTITUICAO VIRABREQUIM
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Virabrequim'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'SUBSTITUICAO VIRABREQUIM'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'SUBSTITUICAO VIRABREQUIM',
          0.01::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- AJUSTAR BIELA E EIXO NO BLOCO
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'AJUSTAR BIELA E EIXO NO BLOCO'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'AJUSTAR BIELA E EIXO NO BLOCO',
          319::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- MONTAGEM COMPLETA-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'MONTAGEM COMPLETA-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'MONTAGEM COMPLETA-LEVE',
          2500::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- DIÁRIA MECÂNICO
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'DIÁRIA MECÂNICO'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'DIÁRIA MECÂNICO',
          50::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- INSTALAR MOTOR
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'INSTALAR MOTOR'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'INSTALAR MOTOR',
          1800::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- PINTURA - MOTORES LINHA LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'PINTURA - MOTORES LINHA LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'PINTURA - MOTORES LINHA LEVE',
          100::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- REMOVER MOTOR
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'REMOVER MOTOR'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'REMOVER MOTOR',
          1800::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- TROCAR OLEO
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'TROCAR OLEO'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'TROCAR OLEO',
          50::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- DESMONTAGEM DO MOTOR
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'DESMONTAGEM DO MOTOR'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'DESMONTAGEM DO MOTOR',
          183.6::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- DESMONTAGEM PARCIAL DO MOTOR
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'DESMONTAGEM PARCIAL DO MOTOR'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'DESMONTAGEM PARCIAL DO MOTOR',
          94.6::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- DESPESA DE DESLOCAMENTO
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'DESPESA DE DESLOCAMENTO'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'DESPESA DE DESLOCAMENTO',
          0.01::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- PLAINAR CABEÇOTE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'PLAINAR CABEÇOTE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'PLAINAR CABEÇOTE',
          232.3::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- RETIFICAR SEDE DE VÁLVULA-LEVE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'RETIFICAR SEDE DE VÁLVULA-LEVE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'RETIFICAR SEDE DE VÁLVULA-LEVE',
          9::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- SOLDA P NA FACE CABEÇOTE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'SOLDA P NA FACE CABEÇOTE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'SOLDA P NA FACE CABEÇOTE',
          80::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- REMOÇAO MOTOR
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'REMOÇAO MOTOR'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'REMOÇAO MOTOR',
          750::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- INSPEÇÃO COMPONENTES CONFORME NBR
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'INSPEÇÃO COMPONENTES CONFORME NBR'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'INSPEÇÃO COMPONENTES CONFORME NBR',
          90::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- LAVAÇÃO QUÍMICA+TÉRMICA DAS PÇS
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'LAVAÇÃO QUÍMICA+TÉRMICA DAS PÇS'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'LAVAÇÃO QUÍMICA+TÉRMICA DAS PÇS',
          120.2::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- OLEO LUBRIFICANTE ESPECIAL
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'OLEO LUBRIFICANTE ESPECIAL'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'OLEO LUBRIFICANTE ESPECIAL',
          75.1::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- PINTURA GERAL
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Montagem Completa'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'PINTURA GERAL'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'PINTURA GERAL',
          75.1::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- GERAL NAS BIELAS
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Biela'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'GERAL NAS BIELAS'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'GERAL NAS BIELAS',
          53.1::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    -- SOLDA FACE CABEÇOTE
    SELECT id INTO v_component_id
    FROM public.macro_components
    WHERE org_id = v_org_id AND name = 'Cabecote'
    LIMIT 1;
    
    IF v_component_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.additional_services
        WHERE org_id = v_org_id
          AND macro_component_id = v_component_id
          AND description = 'SOLDA FACE CABEÇOTE'
      ) THEN
        INSERT INTO public.additional_services (
          description,
          value,
          macro_component_id,
          org_id,
          is_active
        ) VALUES (
          'SOLDA FACE CABEÇOTE',
          80::NUMERIC(10,2),
          v_component_id,
          v_org_id,
          true
        );
        v_service_count := v_service_count + 1;
      END IF;
    END IF;


    RAISE NOTICE 'Organização %: % serviços processados', v_org_id, v_service_count;
    v_service_count := 0;
  END LOOP;
  
  RAISE NOTICE 'Processamento concluído!';
END $$;
