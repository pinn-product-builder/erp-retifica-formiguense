-- Migration: Adicionar novos componentes ao enum engine_component
-- Description: Adiciona todos os componentes de motor listados no PartForm.tsx

DO $$ 
BEGIN
    -- Adicionar novos componentes ao enum engine_component
    -- Componentes principais do Bloco
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tampa_bloco' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'tampa_bloco';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'parafusos_bloco' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'parafusos_bloco';
    END IF;
    
    -- Componentes do Virabrequim
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'engrenagem_virabrequim' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'engrenagem_virabrequim';
    END IF;
    
    -- Polia do Motor
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'polia_motor' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'polia_motor';
    END IF;
    
    -- Componentes do Comando
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'engrenagem_comando' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'engrenagem_comando';
    END IF;
    
    -- Componentes do Cabeçote
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'molas_cabecote' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'molas_cabecote';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'valvulas' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'valvulas';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'chapeletas' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'chapeletas';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'alca_icamento' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'alca_icamento';
    END IF;
    
    -- Tampas
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tampa_valvulas' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'tampa_valvulas';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tampa_oleo' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'tampa_oleo';
    END IF;
    
    -- Componentes de Válvulas
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'balancim' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'balancim';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tucho' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'tucho';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vareta_valvula' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'vareta_valvula';
    END IF;
    
    -- Volante e Prensa
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'volante_motor' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'volante_motor';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'prensa_motor' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'prensa_motor';
    END IF;
    
    -- Embreagem
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'disco_embreagem' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'disco_embreagem';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'carcaca_embreagem' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'carcaca_embreagem';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rolamento_embreagem' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'rolamento_embreagem';
    END IF;
    
    -- Suportes
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'suporte_motor' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'suporte_motor';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'suporte_alternador' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'suporte_alternador';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'suporte_bomba_hidraulica' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'suporte_bomba_hidraulica';
    END IF;
    
    -- Alternador e Motor de Arranque
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'alternador' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'alternador';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'motor_arranque' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'motor_arranque';
    END IF;
    
    -- Bombas
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bomba_hidraulica' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bomba_hidraulica';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bomba_oleo' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bomba_oleo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pescador_bomba_oleo' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'pescador_bomba_oleo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bomba_agua' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bomba_agua';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'polia_bomba_agua' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'polia_bomba_agua';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bomba_gasolina' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bomba_gasolina';
    END IF;
    
    -- Sistema de Refrigeração
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'radiador_oleo' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'radiador_oleo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'filtro_lubrificante' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'filtro_lubrificante';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cachimbo_agua' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'cachimbo_agua';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cano_agua' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'cano_agua';
    END IF;
    
    -- Correias
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'correia' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'correia';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tensor_correia' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'tensor_correia';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'correia_acessorios' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'correia_acessorios';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'esticador_correia_acessorios' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'esticador_correia_acessorios';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tensor_esticador' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'tensor_esticador';
    END IF;
    
    -- Cárter e Coletores
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'carter' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'carter';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'coletor_admissao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'coletor_admissao';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'coletor_escape' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'coletor_escape';
    END IF;
    
    -- Sistema de Alimentação
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'flauta' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'flauta';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bicos_injetores' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bicos_injetores';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'respiro_motor' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'respiro_motor';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'corpo_borboleta' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'corpo_borboleta';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'carburador' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'carburador';
    END IF;
    
    -- Sistema de Ignição
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'velas_ignicao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'velas_ignicao';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bobinas_ignicao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bobinas_ignicao';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cabos_velas' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'cabos_velas';
    END IF;
    
    -- Sensores
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sensores' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sensores';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sensor_temperatura' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sensor_temperatura';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sensor_oleo' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sensor_oleo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sensor_rotacao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sensor_rotacao';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sensor_admissao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sensor_admissao';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sensor_fase' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sensor_fase';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sensor_detonacao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sensor_detonacao';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'sonda_lambda' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'sonda_lambda';
    END IF;
    
    -- Distribuição
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'corrente_distribuicao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'corrente_distribuicao';
    END IF;
    
    -- Outros
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'mangueira' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'mangueira';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cano' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'cano';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vareta_nivel_oleo' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'vareta_nivel_oleo';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'protecao' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'protecao';
    END IF;
END $$;

