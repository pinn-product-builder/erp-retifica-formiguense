-- Corrigir função update_inventory_on_movement para garantir que o estoque seja sempre atualizado
-- O problema era que a função buscava informações antes de atualizar, e se houvesse erro, não atualizava

CREATE OR REPLACE FUNCTION public.update_inventory_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_part_name TEXT;
  v_part_code VARCHAR(100);
  v_low_stock_threshold INTEGER := 5; -- padrão
  v_min_stock INTEGER;
  v_updated_rows INTEGER;
BEGIN
  -- PRIMEIRO: Atualizar quantidade na tabela parts_inventory
  -- Isso deve acontecer SEMPRE, independente de outras operações
  UPDATE parts_inventory
  SET quantity = NEW.new_quantity
  WHERE id = NEW.part_id;
  
  -- Verificar se a atualização foi bem-sucedida
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  IF v_updated_rows = 0 THEN
    RAISE WARNING 'Não foi possível atualizar estoque da peça %. Peça não encontrada ou sem permissão.', NEW.part_id;
    RETURN NEW; -- Retorna mesmo assim para não bloquear a movimentação
  END IF;
  
  RAISE NOTICE 'Estoque atualizado para peça %. Nova quantidade: %', NEW.part_id, NEW.new_quantity;
  
  -- DEPOIS: Buscar informações adicionais para alertas (opcional)
  -- Se falhar, não impede a atualização do estoque
  BEGIN
    SELECT 
      pi.part_name,
      pi.part_code,
      COALESCE(psc.minimum_stock, v_low_stock_threshold)
    INTO v_part_name, v_part_code, v_min_stock
    FROM parts_inventory pi
    LEFT JOIN parts_stock_config psc ON pi.part_code = psc.part_code AND pi.org_id = psc.org_id
    WHERE pi.id = NEW.part_id;
    
    -- Se encontrou informações, processar alertas
    IF FOUND THEN
      -- Criar alerta se estoque ficar baixo
      IF NEW.new_quantity <= v_min_stock AND NEW.new_quantity >= 0 THEN
        -- Inserir ou atualizar alerta de estoque baixo
        INSERT INTO stock_alerts (
          org_id,
          part_code,
          part_name,
          current_stock,
          minimum_stock,
          alert_type,
          alert_level,
          is_active,
          created_at
        )
        VALUES (
          NEW.org_id,
          v_part_code,
          v_part_name,
          NEW.new_quantity,
          v_min_stock,
          'low_stock',
          CASE 
            WHEN NEW.new_quantity = 0 THEN 'critical'
            WHEN NEW.new_quantity < v_min_stock * 0.5 THEN 'high'
            ELSE 'warning'
          END,
          true,
          NOW()
        )
        ON CONFLICT (org_id, part_code) 
        DO UPDATE SET
          current_stock = EXCLUDED.current_stock,
          alert_level = EXCLUDED.alert_level,
          created_at = NOW(),
          is_active = true;
      END IF;
      
      -- Se estoque voltou a nível adequado, desativar alerta
      IF NEW.new_quantity > v_min_stock THEN
        UPDATE stock_alerts
        SET is_active = false
        WHERE org_id = NEW.org_id
          AND part_code = v_part_code
          AND alert_type = 'low_stock';
      END IF;
    ELSE
      RAISE NOTICE 'Informações adicionais da peça % não encontradas. Estoque atualizado, mas alertas não processados.', NEW.part_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Se houver erro ao processar alertas, logar mas não falhar
    RAISE WARNING 'Erro ao processar alertas de estoque para peça %: %', NEW.part_id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Garantir que o trigger está configurado corretamente
DROP TRIGGER IF EXISTS trigger_update_inventory_on_movement ON public.inventory_movements;
CREATE TRIGGER trigger_update_inventory_on_movement
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_movement();

-- Comentário atualizado
COMMENT ON FUNCTION public.update_inventory_on_movement() IS 
'Atualiza o estoque (parts_inventory.quantity) quando uma movimentação é criada. Garante que o estoque seja sempre atualizado, mesmo se houver problemas ao processar alertas. Processa alertas de estoque baixo se as informações da peça estiverem disponíveis.';

