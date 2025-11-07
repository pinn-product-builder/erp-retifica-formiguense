-- Fix: Remover campo 'message' da função check_stock_alerts
-- Problema: A função estava tentando inserir campo 'message' que não existe em stock_alerts
-- Solução: Remover referências ao campo 'message' do INSERT e UPDATE

CREATE OR REPLACE FUNCTION public.check_stock_alerts()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    min_stock INTEGER;
    current_stock INTEGER;
    v_part_code TEXT;
    v_part_name TEXT;
BEGIN
    -- Get part code, part name and minimum stock configuration
    SELECT 
        pi.part_code,
        pi.part_name,
        COALESCE(psc.minimum_stock, 5) -- Default minimum stock is 5
    INTO v_part_code, v_part_name, min_stock
    FROM parts_inventory pi
    LEFT JOIN parts_stock_config psc ON pi.part_code = psc.part_code AND pi.org_id = psc.org_id
    WHERE pi.id = NEW.part_id;
    
    -- Create alert if stock is below minimum
    IF NEW.new_quantity <= min_stock AND NEW.new_quantity < NEW.previous_quantity THEN
        INSERT INTO stock_alerts (
            org_id,
            part_code,
            part_name,
            current_stock,
            minimum_stock,
            alert_type,
            alert_level,
            is_active
        ) 
        VALUES (
            NEW.org_id,
            v_part_code,
            v_part_name,
            NEW.new_quantity,
            min_stock,
            'low_stock',
            CASE 
                WHEN NEW.new_quantity = 0 THEN 'critical'
                WHEN NEW.new_quantity < min_stock * 0.5 THEN 'high'
                ELSE 'warning'
            END,
            true
        )
        ON CONFLICT (org_id, part_code) 
        DO UPDATE SET
            current_stock = EXCLUDED.current_stock,
            alert_level = EXCLUDED.alert_level,
            created_at = NOW(),
            is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_stock_alerts() IS 
'Verifica estoque após movimentação e cria alertas se necessário. 
FIX: Removido campo message que não existe na tabela stock_alerts.';
