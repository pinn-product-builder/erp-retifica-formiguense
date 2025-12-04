-- Migration: Adicionar novos componentes ao enum engine_component
-- Description: Adiciona componentes solicitados: Volante, Prensa, Compressor, Módulo, Bomba Injetora, Bicos Injetores, Bomba de Alta, Unidades Eletrônicas, Bicos Eletrônicos

DO $$ 
BEGIN
    -- Volante (já existe 'volante' e 'volante_motor', mas vamos garantir que 'volante' existe)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'volante' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'volante';
    END IF;
    
    -- Prensa (já existe 'prensa_motor', mas vamos adicionar 'prensa' também)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'prensa' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'prensa';
    END IF;
    
    -- Compressor
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'compressor' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'compressor';
    END IF;
    
    -- Módulo
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'modulo' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'modulo';
    END IF;
    
    -- Bomba Injetora
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bomba_injetora' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bomba_injetora';
    END IF;
    
    -- Bicos Injetores (já existe, mas vamos garantir)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bicos_injetores' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bicos_injetores';
    END IF;
    
    -- Bomba de Alta
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bomba_alta' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bomba_alta';
    END IF;
    
    -- Unidades Eletrônicas
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unidades_eletronicas' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'unidades_eletronicas';
    END IF;
    
    -- Bicos Eletrônicos
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'bicos_eletronicos' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'bicos_eletronicos';
    END IF;
END $$;

