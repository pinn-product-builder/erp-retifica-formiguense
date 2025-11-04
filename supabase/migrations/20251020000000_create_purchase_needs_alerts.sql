-- Migration: Create Alerts from Purchase Needs
-- Description: Cria alertas na tabela alerts quando purchase_needs são criados ou atualizados

-- Função para criar/atualizar alerta a partir de purchase_need
CREATE OR REPLACE FUNCTION create_purchase_need_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_severity TEXT;
  v_title TEXT;
  v_message TEXT;
  v_action_label TEXT;
  v_action_url TEXT;
  v_alert_id UUID;
BEGIN
  -- Determinar severidade baseada na prioridade
  v_severity := CASE NEW.priority_level
    WHEN 'critical' THEN 'error'
    WHEN 'high' THEN 'warning'
    WHEN 'medium' THEN 'warning'
    ELSE 'info'
  END;

  -- Criar título e mensagem
  v_title := 'Necessidade de Compra: ' || NEW.part_name;
  v_message := 'Necessário comprar ' || NEW.required_quantity || ' unidades de ' || NEW.part_name;
  
  IF NEW.available_quantity > 0 THEN
    v_message := v_message || ' (Estoque atual: ' || NEW.available_quantity || ')';
  ELSE
    v_message := v_message || ' (Estoque esgotado)';
  END IF;

  IF NEW.delivery_urgency_date IS NOT NULL THEN
    v_message := v_message || ' - Urgência: ' || TO_CHAR(NEW.delivery_urgency_date, 'DD/MM/YYYY');
  END IF;

  -- Action label e URL
  v_action_label := 'Ver Necessidades';
  v_action_url := '/compras';

  -- Se o status mudou para 'completed' ou 'cancelled', desativar alertas existentes
  IF TG_OP = 'UPDATE' AND NEW.status IN ('completed', 'cancelled', 'ordered') THEN
    UPDATE alerts
    SET is_active = false,
        updated_at = NOW()
    WHERE org_id = NEW.org_id
      AND alert_type = 'purchase_need'
      AND metadata->>'purchase_need_id' = NEW.id::TEXT
      AND is_active = true;
    
    RETURN NEW;
  END IF;

  -- Apenas criar alerta para status 'pending' ou 'in_quotation'
  IF NEW.status NOT IN ('pending', 'in_quotation') THEN
    RETURN NEW;
  END IF;

  -- Verificar se já existe alerta ativo para este purchase_need
  SELECT id INTO v_alert_id
  FROM alerts
  WHERE org_id = NEW.org_id
    AND alert_type = 'purchase_need'
    AND metadata->>'purchase_need_id' = NEW.id::TEXT
    AND is_active = true
  LIMIT 1;

  IF v_alert_id IS NOT NULL THEN
    -- Atualizar alerta existente
    UPDATE alerts
    SET 
      title = v_title,
      message = v_message,
      severity = v_severity,
      action_label = v_action_label,
      action_url = v_action_url,
      metadata = jsonb_build_object(
        'purchase_need_id', NEW.id,
        'part_code', NEW.part_code,
        'part_name', NEW.part_name,
        'required_quantity', NEW.required_quantity,
        'available_quantity', NEW.available_quantity,
        'shortage_quantity', NEW.shortage_quantity,
        'priority_level', NEW.priority_level,
        'need_type', NEW.need_type,
        'status', NEW.status,
        'estimated_cost', NEW.estimated_cost,
        'delivery_urgency_date', NEW.delivery_urgency_date
      ),
      updated_at = NOW()
    WHERE id = v_alert_id;
  ELSE
    -- Criar novo alerta
    INSERT INTO alerts (
      org_id,
      alert_type,
      title,
      message,
      severity,
      is_active,
      is_dismissible,
      action_label,
      action_url,
      metadata,
      expires_at
    ) VALUES (
      NEW.org_id,
      'purchase_need',
      v_title,
      v_message,
      v_severity,
      true,
      true,
      v_action_label,
      v_action_url,
      jsonb_build_object(
        'purchase_need_id', NEW.id,
        'part_code', NEW.part_code,
        'part_name', NEW.part_name,
        'required_quantity', NEW.required_quantity,
        'available_quantity', NEW.available_quantity,
        'shortage_quantity', NEW.shortage_quantity,
        'priority_level', NEW.priority_level,
        'need_type', NEW.need_type,
        'status', NEW.status,
        'estimated_cost', NEW.estimated_cost,
        'delivery_urgency_date', NEW.delivery_urgency_date
      ),
      CASE 
        WHEN NEW.delivery_urgency_date IS NOT NULL THEN NEW.delivery_urgency_date
        ELSE NOW() + INTERVAL '30 days'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário na função
COMMENT ON FUNCTION create_purchase_need_alert() IS 
'Cria ou atualiza alertas na tabela alerts quando purchase_needs são criados ou atualizados. Desativa alertas quando o status muda para completed, cancelled ou ordered.';

-- Criar trigger para INSERT
DROP TRIGGER IF EXISTS trg_create_purchase_need_alert_insert ON purchase_needs;
CREATE TRIGGER trg_create_purchase_need_alert_insert
  AFTER INSERT ON purchase_needs
  FOR EACH ROW
  EXECUTE FUNCTION create_purchase_need_alert();

-- Criar trigger para UPDATE
DROP TRIGGER IF EXISTS trg_create_purchase_need_alert_update ON purchase_needs;
CREATE TRIGGER trg_create_purchase_need_alert_update
  AFTER UPDATE ON purchase_needs
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status 
    OR OLD.priority_level IS DISTINCT FROM NEW.priority_level
    OR OLD.required_quantity IS DISTINCT FROM NEW.required_quantity
    OR OLD.available_quantity IS DISTINCT FROM NEW.available_quantity
  )
  EXECUTE FUNCTION create_purchase_need_alert();

-- Índice para otimizar busca de alertas por purchase_need_id
CREATE INDEX IF NOT EXISTS idx_alerts_purchase_need_metadata 
ON alerts USING GIN (metadata)
WHERE alert_type = 'purchase_need';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION create_purchase_need_alert() TO authenticated;

