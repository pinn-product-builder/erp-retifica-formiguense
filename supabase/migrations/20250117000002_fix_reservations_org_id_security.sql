-- =====================================================
-- CORREÇÃO DE SEGURANÇA: FILTROS ORG_ID NAS FUNÇÕES DE RESERVA
-- =====================================================
-- Esta migration corrige as funções de reserva para incluir filtros de org_id
-- garantindo isolamento completo entre organizações (multi-tenancy)
--
-- CRÍTICO: Sem estes filtros, usuários poderiam manipular reservas de outras organizações
--
-- Criado: 2025-01-17
-- Autor: Sistema ERP Retifica Formiguense - Correção de Segurança
-- =====================================================

-- =====================================================
-- 1. CORRIGIR: consume_reserved_parts()
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
  -- Buscar informações da ordem COM FILTRO DE ORG_ID
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
    AND org_id = current_org_id(); -- 🔒 SEGURANÇA: Filtro por org_id
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ordem de serviço não encontrada ou não pertence à organização'
    );
  END IF;
  
  -- Para cada item de consumo
  FOR v_part IN SELECT * FROM jsonb_array_elements(p_parts)
  LOOP
    -- Buscar reserva ativa COM FILTRO DE ORG_ID
    SELECT * INTO v_reservation
    FROM parts_reservations
    WHERE order_id = p_order_id
      AND part_code = (v_part->>'part_code')::TEXT
      AND reservation_status IN ('reserved', 'partial', 'separated')
      AND (quantity_reserved - COALESCE(quantity_applied, 0)) > 0
      AND org_id = v_order.org_id -- 🔒 SEGURANÇA: Filtro por org_id
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

-- =====================================================
-- 2. CORRIGIR: release_expired_reservations()
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
  -- Buscar e marcar reservas expiradas COM FILTRO DE ORG_ID
  FOR v_reservation IN
    SELECT *
    FROM parts_reservations
    WHERE reservation_status IN ('reserved', 'partial', 'separated')
      AND expires_at < NOW()
      AND (quantity_reserved - COALESCE(quantity_applied, 0)) > 0
      AND org_id = current_org_id() -- 🔒 SEGURANÇA: Filtro por org_id
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

-- =====================================================
-- 3. CORRIGIR: cancel_reservation()
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
  -- Buscar reserva COM FILTRO DE ORG_ID
  SELECT * INTO v_reservation
  FROM parts_reservations
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- 🔒 SEGURANÇA: Filtro por org_id
  
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
  
  -- Cancelar reserva COM FILTRO DE ORG_ID
  UPDATE parts_reservations
  SET 
    reservation_status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = auth.uid(),
    cancellation_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- 🔒 SEGURANÇA: Filtro por org_id
  
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

-- =====================================================
-- 4. CORRIGIR: extend_reservation()
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
  -- Buscar reserva COM FILTRO DE ORG_ID
  SELECT * INTO v_reservation
  FROM parts_reservations
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- 🔒 SEGURANÇA: Filtro por org_id
  
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
  
  -- Estender prazo COM FILTRO DE ORG_ID
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
    AND org_id = current_org_id(); -- 🔒 SEGURANÇA: Filtro por org_id
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'new_expires_at', v_new_expires_at,
    'days_extended', p_additional_days
  );
END;
$$;

-- =====================================================
-- 5. CORRIGIR: separate_reserved_parts()
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
  -- Buscar reserva COM FILTRO DE ORG_ID
  SELECT * INTO v_reservation
  FROM parts_reservations
  WHERE id = p_reservation_id
    AND org_id = current_org_id(); -- 🔒 SEGURANÇA: Filtro por org_id
  
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
  
  -- Atualizar separação COM FILTRO DE ORG_ID
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
    AND org_id = current_org_id(); -- 🔒 SEGURANÇA: Filtro por org_id
  
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'quantity_separated', p_quantity_to_separate,
    'total_separated', COALESCE(v_reservation.quantity_separated, 0) + p_quantity_to_separate,
    'remaining_to_separate', v_available_to_separate - p_quantity_to_separate
  );
END;
$$;

-- =====================================================
-- 6. COMENTÁRIOS DE SEGURANÇA
-- =====================================================
COMMENT ON FUNCTION public.consume_reserved_parts(UUID, JSONB) IS 
'🔒 SEGURO: Consome peças reservadas com filtros de org_id para isolamento multi-tenant.';

COMMENT ON FUNCTION public.release_expired_reservations() IS 
'🔒 SEGURO: Libera reservas expiradas apenas da organização atual.';

COMMENT ON FUNCTION public.cancel_reservation(UUID, TEXT) IS 
'🔒 SEGURO: Cancela reservas com validação de propriedade por org_id.';

COMMENT ON FUNCTION public.extend_reservation(UUID, INTEGER) IS 
'🔒 SEGURO: Estende reservas com validação de propriedade por org_id.';

COMMENT ON FUNCTION public.separate_reserved_parts(UUID, INTEGER) IS 
'🔒 SEGURO: Separa peças reservadas com validação de propriedade por org_id.';

-- =====================================================
-- FIM DA MIGRATION DE CORREÇÃO DE SEGURANÇA
-- =====================================================
