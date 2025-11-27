-- Migration: Adicionar componentes necessários para checklists de metrologia
-- Adiciona 'volante' e 'montagem' ao enum engine_component

DO $$ 
BEGIN
    -- Adicionar 'volante' (diferente de 'volante_motor' que já existe)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'volante' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'volante';
    END IF;
    
    -- Adicionar 'montagem' para checklist de montagem completa
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'montagem' AND enumtypid = 'engine_component'::regtype) THEN
        ALTER TYPE engine_component ADD VALUE 'montagem';
    END IF;
END $$;

