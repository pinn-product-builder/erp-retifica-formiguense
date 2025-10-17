-- =====================================================
-- EXPANSÃO DO SISTEMA DE RESERVAS + TRIGGER FALTANTE
-- =====================================================
-- Expande a tabela parts_reservations existente com novos recursos
-- mantendo compatibilidade com o fluxo atual (reservado → separado → aplicado)
-- 
-- 🔥 IMPORTANTE: Cria o TRIGGER faltante para ativar as reservas automáticas
-- 🔒 SEGURANÇA: Todas as funções filtram por org_id usando current_org_id()
--
-- Criado: 2025-01-17
-- Atualizado: 2025-01-17 (Correções de segurança multi-tenant)
-- Autor: Sistema ERP Retifica Formiguense
-- =====================================================

-- =====================================================
-- 1. ADICIONAR NOVOS CAMPOS À TABELA EXISTENTE
-- =====================================================
-- Adicionar campo de expiração de reservas
ALTER TABLE public.parts_reservations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- 2. ATUALIZAR CONSTRAINT DO STATUS
-- =====================================================
-- Expandir os valores permitidos de reservation_status
ALTER TABLE public.parts_reservations 
DROP CONSTRAINT IF EXISTS parts_reservations_reservation_status_check;

ALTER TABLE public.parts_reservations 
ADD CONSTRAINT parts_reservations_reservation_status_check CHECK (
  reservation_status IN ('reserved', 'partial', 'separated', 'applied', 'expired', 'cancelled')
);

-- =====================================================
-- 3. CRIAR ÍNDICES ADICIONAIS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_parts_reservations_expires_at 
  ON public.parts_reservations(expires_at) 
  WHERE reservation_status IN ('reserved', 'partial', 'separated');

CREATE INDEX IF NOT EXISTS idx_parts_reservations_status_org 
  ON public.parts_reservations(reservation_status, org_id);

CREATE INDEX IF NOT EXISTS idx_parts_reservations_part_id 
  ON public.parts_reservations(part_id) 
  WHERE part_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parts_reservations_budget_id 
  ON public.parts_reservations(budget_id) 
  WHERE budget_id IS NOT NULL;

-- =====================================================
-- 4. ATUALIZAR DADOS EXISTENTES
-- =====================================================
-- Definir expires_at para reservas existentes que não têm
UPDATE public.parts_reservations
SET expires_at = COALESCE(reserved_at, created_at, NOW()) + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- =====================================================
-- 5. 🔥 CRIAR TRIGGER FALTANTE - RESERVA AUTOMÁTICA
-- =====================================================
-- Este é o trigger que estava faltando!
-- Ele ativa a função fn_process_budget_approval() que já existe
DROP TRIGGER IF EXISTS trigger_process_budget_approval ON public.budget_approvals;
CREATE TRIGGER trigger_process_budget_approval
  AFTER INSERT ON public.budget_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_process_budget_approval();

COMMENT ON TRIGGER trigger_process_budget_approval ON public.budget_approvals IS 
'Trigger que ativa o processamento automático de aprovação de orçamento, incluindo reservas de peças, geração de necessidades de compra e contas a receber.';

-- =====================================================
-- 6. CRIAR TRIGGER PARA NOTIFICAÇÃO
-- =====================================================
DROP TRIGGER IF EXISTS trigger_notify_budget_approved ON public.budget_approvals;
CREATE TRIGGER trigger_notify_budget_approved
  AFTER INSERT ON public.budget_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_budget_approved();

COMMENT ON TRIGGER trigger_notify_budget_approved ON public.budget_approvals IS 
'Notifica usuários quando um orçamento é aprovado.';

-- =====================================================
-- 7. FUNÇÃO: Consumir peças reservadas
-- =====================================================
CREATE OR REPLACE FUNCTION public.consume_reserved_parts(
  p_order_id UUID,
  p_parts JSONB -- [{part_code: string, quantity: number}]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_part JSONB;
  v_reservation RECORD;
  v_consumed INTEGER;
  v_result JSONB := '{"success": true, "consumed": [], "errors": []}'::jsonb;
BEGIN
  -- Buscar informações da ordem
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
    AND org_id = current_org_id(); -- FIX: Filtro por org_id
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ordem de serviço não encontrada ou não pertence à organização'
    );
  END IF;
  
  -- Para cada item de consumo
  FOR v_part IN SELECT * FROM jsonb_array_elements(p_parts)
  LOOP
    -- Buscar reserva ativa para esta peça e ordem
    SELECT * INTO v_reservation
    FROM parts_reservations
    WHERE order_id = p_order_id
      AND part_code = (v_part->>'part_code')::TEXT
      AND reservation_status IN ('reserved', 'partial', 'separated')
      AND (quantity_reserved - COALESCE(quantity_applied, 0)) > 0
      AND org_id = v_order.org_id -- FIX: Filtro por org_id
    ORDER BY reserved_at ASC
    LIMIT 1;
    
    IF FOUND THEN
      v_consumed := LEAST(
        (v_part->>'quantity')::INTEGER,
        v_reservation.quantity_reserved - COALESCE(v_reservation.quantity_applied, 0)
      );
      
      -- Atualizar reserva
      UPDATE parts_reservations
      SET 
        quantity_applied = COALESCE(quantity_applied, 0) + v_consumed,
        applied_at = CASE 
          WHEN COALESCE(quantity_applied, 0) + v_consumed >= quantity_reserved THEN NOW()
          ELSE applied_at
        END,
        applied_by = CASE 
          WHEN COALESCE(quantity_applied, 0) + v_consumed >= quantity_reserved THEN auth.uid()
          ELSE applied_by
        END,
        reservation_status = CASE 
          WHEN COALESCE(quantity_applied, 0) + v_consumed >= quantity_reserved THEN 'applied'
          ELSE reservation_status
        END,
        updated_at = NOW()
      WHERE id = v_reservation.id;
      
      -- Criar movimentação de saída no estoque
      INSERT INTO inventory_movements (
        org_id,
        part_code,
        movement_type,
        quantity,
        unit_cost,
        order_id,
        budget_id,
        reason,
        notes,
        created_by,
        metadata
      ) VALUES (
        v_order.org_id,
        v_reservation.part_code,
        'saida',
        v_consumed,
        v_reservation.unit_cost,
        p_order_id,
        v_reservation.budget_id,
        'production_use',
        'Consumo em OS - Reserva #' || v_reservation.id,
        auth.uid(),
        jsonb_build_object(
          'reservation_id', v_reservation.id,
          'consumption_type', 'reserved'
        )
      );
      
      v_result := jsonb_set(
        v_result, 
        '{consumed}', 
        (v_result->'consumed') || jsonb_build_object(
          'part_code', v_reservation.part_code,
          'quantity_consumed', v_consumed,
          'reservation_id', v_reservation.id,
          'status', 'success'
        )
      );
    ELSE
      -- Não há reserva para esta peça
      v_result := jsonb_set(
        v_result, 
        '{errors}', 
        (v_result->'errors') || jsonb_build_object(
          'part_code', v_part->>'part_code',
          'error', 'No active reservation found'
        )
      );
    END IF;
  END LOOP;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.consume_reserved_parts(UUID, JSONB) IS 
'Consome peças reservadas durante execução de ordem de serviço, criando movimentações de saída automáticas.';

-- =====================================================
-- 8. FUNÇÃO: Liberar reservas expiradas (Job diário)
-- =====================================================
CREATE OR REPLACE FUNCTION public.release_expired_reservations()
RETURNS TABLE(
  expired_count INTEGER,
  reservations_expired JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_expired_reservations JSONB := '[]'::jsonb;
  v_reservation RECORD;
BEGIN
  -- Buscar e marcar reservas expiradas
  FOR v_reservation IN
    SELECT *
    FROM parts_reservations
    WHERE reservation_status IN ('reserved', 'partial', 'separated')
      AND expires_at < NOW()
      AND (quantity_reserved - COALESCE(quantity_applied, 0)) > 0
      AND org_id = current_org_id() -- FIX: Filtro por org_id
  LOOP
    -- Atualizar status
    UPDATE parts_reservations
    SET 
      reservation_status = 'expired',
      updated_at = NOW()
    WHERE id = v_reservation.id;
    
    v_expired_count := v_expired_count + 1;
    
    -- Adicionar ao resultado
    v_expired_reservations := v_expired_reservations || jsonb_build_object(
      'reservation_id', v_reservation.id,
      'order_id', v_reservation.order_id,
      'part_code', v_reservation.part_code,
      'quantity_released', v_reservation.quantity_reserved - COALESCE(v_reservation.quantity_applied, 0),
      'expired_at', v_reservation.expires_at
    );
    
    -- Criar notificação para a equipe
    INSERT INTO stock_alerts (
      org_id,
      part_code,
      part_name,
      alert_type,
      alert_level,
      message,
      is_active,
      metadata
    ) VALUES (
      v_reservation.org_id,
      v_reservation.part_code,
      v_reservation.part_name,
      'reservation_expired',
      'warning',
      'Reserva expirada - ' || (v_reservation.quantity_reserved - COALESCE(v_reservation.quantity_applied, 0))::TEXT || ' unidades liberadas',
      true,
      jsonb_build_object(
        'reservation_id', v_reservation.id,
        'order_id', v_reservation.order_id,
        'expired_at', v_reservation.expires_at
      )
    );
  END LOOP;
  
  RETURN QUERY SELECT v_expired_count, v_expired_reservations;
END;
$$;

COMMENT ON FUNCTION public.release_expired_reservations() IS 
'Job diário que marca reservas expiradas (30 dias sem consumo) e cria alertas. Retorna quantidade de reservas expiradas e detalhes.';

-- =====================================================
-- 9. FUNÇÃO: Cancelar reserva
-- =====================================================
CREATE OR REPLACE FUNCTION public.cancel_reservation(
  p_reservation_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  -- Buscar reserva
  SELECT * INTO v_reservation
  FROM parts_reservations
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- FIX: Filtro por org_id
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reserva não encontrada ou não pertence à organização'
    );
  END IF;
  
  -- Verificar se pode cancelar
  IF v_reservation.reservation_status NOT IN ('reserved', 'partial', 'separated') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reserva não pode ser cancelada. Status atual: ' || v_reservation.reservation_status
    );
  END IF;
  
  -- Cancelar reserva
  UPDATE parts_reservations
  SET 
    reservation_status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = auth.uid(),
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- FIX: Filtro por org_id
  
  -- Criar alerta
  INSERT INTO stock_alerts (
    org_id,
    part_code,
    part_name,
    alert_type,
    alert_level,
    message,
    is_active,
    metadata
  ) VALUES (
    v_reservation.org_id,
    v_reservation.part_code,
    v_reservation.part_name,
    'reservation_cancelled',
    'info',
    'Reserva cancelada - ' || (v_reservation.quantity_reserved - COALESCE(v_reservation.quantity_applied, 0))::TEXT || ' unidades liberadas',
    true,
    jsonb_build_object(
      'reservation_id', v_reservation.id,
      'order_id', v_reservation.order_id,
      'cancelled_by', auth.uid(),
      'reason', p_reason
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'quantity_released', v_reservation.quantity_reserved - COALESCE(v_reservation.quantity_applied, 0)
  );
END;
$$;

COMMENT ON FUNCTION public.cancel_reservation(UUID, TEXT) IS 
'Cancela uma reserva manualmente com motivo opcional. Libera as peças para o estoque.';

-- =====================================================
-- 10. FUNÇÃO: Estender prazo de reserva
-- =====================================================
CREATE OR REPLACE FUNCTION public.extend_reservation(
  p_reservation_id UUID,
  p_additional_days INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation RECORD;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  -- Buscar reserva
  SELECT * INTO v_reservation
  FROM parts_reservations
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- FIX: Filtro por org_id
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reserva não encontrada ou não pertence à organização'
    );
  END IF;
  
  -- Verificar se pode estender
  IF v_reservation.reservation_status NOT IN ('reserved', 'partial', 'separated') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reserva não pode ser estendida. Status atual: ' || v_reservation.reservation_status
    );
  END IF;
  
  -- Validar dias adicionais
  IF p_additional_days <= 0 OR p_additional_days > 90 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Dias adicionais devem estar entre 1 e 90'
    );
  END IF;
  
  -- Estender prazo
  v_new_expires_at := COALESCE(v_reservation.expires_at, NOW()) + (p_additional_days || ' days')::INTERVAL;
  
  UPDATE parts_reservations
  SET 
    expires_at = v_new_expires_at,
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'extended_at', NOW(),
      'extended_by', auth.uid(),
      'additional_days', p_additional_days
    )
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- FIX: Filtro por org_id
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'new_expires_at', v_new_expires_at,
    'days_extended', p_additional_days
  );
END;
$$;

COMMENT ON FUNCTION public.extend_reservation(UUID, INTEGER) IS 
'Estende o prazo de validade de uma reserva por N dias adicionais (máximo 90 dias).';

-- =====================================================
-- 11. FUNÇÃO: Separar peças reservadas
-- =====================================================
CREATE OR REPLACE FUNCTION public.separate_reserved_parts(
  p_reservation_id UUID,
  p_quantity_to_separate INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation RECORD;
  v_available_to_separate INTEGER;
BEGIN
  -- Buscar reserva
  SELECT * INTO v_reservation
  FROM parts_reservations
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- FIX: Filtro por org_id
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reserva não encontrada ou não pertence à organização'
    );
  END IF;
  
  -- Calcular disponível para separar
  v_available_to_separate := v_reservation.quantity_reserved - COALESCE(v_reservation.quantity_separated, 0);
  
  -- Validar quantidade
  IF p_quantity_to_separate <= 0 OR p_quantity_to_separate > v_available_to_separate THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quantidade inválida. Disponível para separar: ' || v_available_to_separate
    );
  END IF;
  
  -- Atualizar separação
  UPDATE parts_reservations
  SET 
    quantity_separated = COALESCE(quantity_separated, 0) + p_quantity_to_separate,
    separated_at = CASE 
      WHEN COALESCE(quantity_separated, 0) + p_quantity_to_separate >= quantity_reserved THEN NOW()
      ELSE separated_at
    END,
    separated_by = CASE 
      WHEN COALESCE(quantity_separated, 0) + p_quantity_to_separate >= quantity_reserved THEN auth.uid()
      ELSE separated_by
    END,
    reservation_status = CASE 
      WHEN COALESCE(quantity_separated, 0) + p_quantity_to_separate >= quantity_reserved THEN 'separated'
      ELSE reservation_status
    END,
    updated_at = NOW()
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- FIX: Filtro por org_id
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'quantity_separated', p_quantity_to_separate,
    'total_separated', COALESCE(v_reservation.quantity_separated, 0) + p_quantity_to_separate,
    'remaining_to_separate', v_available_to_separate - p_quantity_to_separate
  );
END;
$$;

COMMENT ON FUNCTION public.separate_reserved_parts(UUID, INTEGER) IS 
'Marca peças reservadas como separadas (workflow: reservado → separado → aplicado).';

-- =====================================================
-- 12. TRIGGER: Atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_reservations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_reservations_updated_at ON public.parts_reservations;
CREATE TRIGGER trigger_update_reservations_updated_at
  BEFORE UPDATE ON public.parts_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reservations_updated_at();

-- =====================================================
-- 13. VIEW: Relatório de reservas ativas
-- =====================================================
CREATE OR REPLACE VIEW public.v_active_reservations AS
SELECT 
  pr.id,
  pr.org_id,
  pr.order_id,
  o.order_number,
  pr.budget_id,
  pr.part_code,
  pr.part_name,
  pr.quantity_reserved,
  COALESCE(pr.quantity_separated, 0) as quantity_separated,
  COALESCE(pr.quantity_applied, 0) as quantity_applied,
  pr.quantity_reserved - COALESCE(pr.quantity_applied, 0) as quantity_available,
  pr.unit_cost,
  pr.total_reserved_cost,
  pr.reservation_status,
  pr.reserved_at,
  pr.expires_at,
  CASE 
    WHEN pr.expires_at < NOW() THEN true
    ELSE false
  END as is_expired,
  EXTRACT(DAY FROM (pr.expires_at - NOW())) as days_until_expiration,
  u.email as reserved_by_email,
  pr.notes
FROM parts_reservations pr
LEFT JOIN orders o ON o.id = pr.order_id
LEFT JOIN auth.users u ON u.id = pr.reserved_by
WHERE pr.reservation_status IN ('reserved', 'partial', 'separated')
ORDER BY pr.expires_at ASC;

COMMENT ON VIEW public.v_active_reservations IS 
'View com relatório de reservas ativas, incluindo cálculo de expiração e quantidades disponíveis.';

-- =====================================================
-- 14. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================
COMMENT ON COLUMN public.parts_reservations.expires_at IS 
'Data de expiração da reserva (padrão: 30 dias). Reservas expiradas são liberadas automaticamente.';

COMMENT ON COLUMN public.parts_reservations.metadata IS 
'Dados adicionais flexíveis da reserva (extensões, histórico, etc).';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================