-- =====================================================
-- MIGRAÇÃO: Criar workflow apenas quando orçamento for aprovado
-- =====================================================
-- Esta migração remove a criação automática de workflow na criação da ordem
-- e adiciona a criação apenas quando o orçamento for aprovado
-- =====================================================

-- 1. REMOVER TRIGGER QUE CRIA WORKFLOW NA CRIAÇÃO DA ORDEM
-- =====================================================
DROP TRIGGER IF EXISTS trigger_create_workflow ON public.orders;

-- 2. CRIAR FUNÇÃO PARA CRIAR WORKFLOW BASEADO NO TIPO DE MOTOR
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_workflow_from_engine_type(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_engine_type_id UUID;
  v_required_components engine_component[];
  v_component engine_component;
  v_existing_workflow_id UUID;
BEGIN
  -- Buscar engine_type_id da ordem através do engine
  SELECT e.engine_type_id INTO v_engine_type_id
  FROM orders o
  INNER JOIN engines e ON e.id = o.engine_id
  WHERE o.id = p_order_id;

  -- Se não encontrou engine_type, usar componentes padrão
  IF v_engine_type_id IS NULL THEN
    v_required_components := ARRAY['bloco', 'eixo', 'biela', 'comando', 'cabecote']::engine_component[];
  ELSE
    -- Buscar componentes requeridos do tipo de motor
    SELECT required_components INTO v_required_components
    FROM engine_types
    WHERE id = v_engine_type_id
      AND is_active = true;

    -- Se não encontrou componentes ou está vazio, usar padrão
    IF v_required_components IS NULL OR array_length(v_required_components, 1) IS NULL THEN
      v_required_components := ARRAY['bloco', 'eixo', 'biela', 'comando', 'cabecote']::engine_component[];
    END IF;
  END IF;

  -- Criar workflow para cada componente requerido
  FOREACH v_component IN ARRAY v_required_components
  LOOP
    -- Verificar se já existe workflow para este componente nesta ordem
    SELECT id INTO v_existing_workflow_id
    FROM order_workflow
    WHERE order_id = p_order_id
      AND component = v_component
    LIMIT 1;

    -- Só criar se não existir
    IF v_existing_workflow_id IS NULL THEN
      INSERT INTO public.order_workflow (
        order_id,
        component,
        status
      )
      VALUES (
        p_order_id,
        v_component,
        'entrada'
      );
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.create_workflow_from_engine_type(UUID) IS 
'Cria workflows para uma ordem baseado nos componentes requeridos do tipo de motor. 
Usa componentes padrão se o tipo de motor não for encontrado ou não tiver componentes definidos.';

-- 3. ATUALIZAR FUNÇÃO fn_process_budget_approval PARA CRIAR WORKFLOW
-- =====================================================
-- Esta função já existe e será atualizada para incluir a criação de workflow
-- Baseada na versão mais recente de 20251018000000_fix_duplicate_reservations_on_budget_approval.sql
CREATE OR REPLACE FUNCTION public.fn_process_budget_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_budget RECORD;
  v_part JSONB;
  v_available_stock INTEGER;
  v_shortage INTEGER;
  v_organization_id UUID;
  v_part_code TEXT;
  v_part_name TEXT;
  v_part_quantity INTEGER;
  v_part_unit_price NUMERIC;
  v_existing_reservation_id UUID;
  v_part_current_quantity INTEGER;
  v_part_id UUID;
  v_new_reservation_id UUID;
BEGIN
  -- Buscar detalhes do orçamento
  SELECT * INTO v_budget
  FROM detailed_budgets
  WHERE id = NEW.budget_id;

  -- Buscar organização da ordem
  SELECT org_id INTO v_organization_id
  FROM orders
  WHERE id = v_budget.order_id;

  -- Processar apenas aprovações totais ou parciais
  IF NEW.approval_type IN ('total', 'parcial') THEN
    
    -- 1. PROCESSAR PEÇAS DO ORÇAMENTO
    FOR v_part IN SELECT * FROM jsonb_array_elements(v_budget.parts)
    LOOP
      -- Extrair dados da peça com fallback para diferentes formatos de JSON
      v_part_code := COALESCE(v_part->>'part_code', v_part->>'code');
      v_part_name := COALESCE(v_part->>'part_name', v_part->>'name');
      v_part_quantity := (v_part->>'quantity')::INTEGER;
      v_part_unit_price := (v_part->>'unit_price')::NUMERIC;

      -- Validar dados obrigatórios
      IF v_part_code IS NULL OR v_part_name IS NULL OR v_part_quantity IS NULL THEN
        RAISE WARNING 'Skipping part due to missing code, name or quantity in JSON: %', v_part;
        CONTINUE;
      END IF;

      -- Verificar se já existe uma reserva para esta peça neste orçamento e ordem
      SELECT id INTO v_existing_reservation_id
      FROM parts_reservations
      WHERE budget_id = NEW.budget_id
        AND part_code = v_part_code
        AND order_id = v_budget.order_id
        AND reservation_status IN ('reserved', 'partial', 'separated')
      LIMIT 1;

      -- Se já existe reserva, pular para evitar duplicata
      IF v_existing_reservation_id IS NOT NULL THEN
        RAISE NOTICE 'Reservation already exists for part % in budget % - skipping', v_part_code, NEW.budget_id;
        CONTINUE;
      END IF;

      -- Buscar part_id do estoque
      SELECT id, COALESCE(SUM(quantity), 0) INTO v_part_id, v_part_current_quantity
      FROM parts_inventory
      WHERE part_code = v_part_code
        AND status = 'disponivel'
        AND org_id = v_organization_id
      GROUP BY id
      LIMIT 1;

      -- Verificar estoque disponível
      v_available_stock := COALESCE(v_part_current_quantity, 0);
      v_shortage := v_part_quantity - v_available_stock;

      IF v_available_stock >= v_part_quantity THEN
        -- ESTOQUE SUFICIENTE: Criar reserva
        INSERT INTO parts_reservations (
          order_id,
          budget_id,
          part_id,
          part_code,
          part_name,
          quantity_reserved,
          unit_cost,
          reservation_status,
          reserved_by,
          org_id
        ) VALUES (
          v_budget.order_id,
          v_budget.id,
          v_part_id,
          v_part_code,
          v_part_name,
          v_part_quantity,
          v_part_unit_price,
          'reserved',
          NEW.registered_by,
          v_organization_id
        ) RETURNING id INTO v_new_reservation_id;

        -- Criar movimentação de estoque para reserva
        INSERT INTO inventory_movements (
          org_id,
          part_id,
          movement_type,
          quantity,
          previous_quantity,
          new_quantity,
          unit_cost,
          order_id,
          budget_id,
          reason,
          notes,
          created_by,
          metadata
        ) VALUES (
          v_organization_id,
          v_part_id,
          'reserva',
          v_part_quantity,
          v_part_current_quantity,
          v_part_current_quantity, -- Reserva não altera estoque físico
          v_part_unit_price,
          v_budget.order_id,
          v_budget.id,
          'Reserva de peças para orçamento aprovado',
          'Reserva #' || v_new_reservation_id,
          NEW.registered_by,
          jsonb_build_object('reservation_id', v_new_reservation_id, 'budget_id', v_budget.id)
        );

      ELSE
        -- ESTOQUE INSUFICIENTE: Criar alerta e necessidade de compra
        
        -- Criar alerta de estoque
        INSERT INTO stock_alerts (
          org_id,
          part_code,
          part_name,
          current_stock,
          minimum_stock,
          alert_type,
          alert_level,
          is_active
        ) VALUES (
          v_organization_id,
          v_part_code,
          v_part_name,
          v_available_stock,
          v_part_quantity,
          'insufficient_for_order',
          'critical',
          true
        )
        ON CONFLICT (org_id, part_code) DO UPDATE SET
          current_stock = EXCLUDED.current_stock,
          minimum_stock = GREATEST(stock_alerts.minimum_stock, EXCLUDED.minimum_stock),
          alert_level = 'critical',
          is_active = true,
          updated_at = NOW();

        -- Criar necessidade de compra
        INSERT INTO purchase_needs (
          org_id,
          part_code,
          part_name,
          required_quantity,
          available_quantity,
          priority_level,
          need_type,
          related_orders,
          estimated_cost,
          status
        ) VALUES (
          v_organization_id,
          v_part_code,
          v_part_name,
          v_part_quantity,
          v_available_stock,
          'high',
          'planned',
          jsonb_build_array(jsonb_build_object('order_id', v_budget.order_id)),
          v_part_unit_price * v_shortage,
          'pending'
        )
        ON CONFLICT (org_id, part_code, status) 
        DO UPDATE SET
          required_quantity = purchase_needs.required_quantity + EXCLUDED.required_quantity,
          estimated_cost = purchase_needs.estimated_cost + EXCLUDED.estimated_cost,
          updated_at = NOW();

        -- Se houver estoque parcial, reservar o que tem
        IF v_available_stock > 0 AND v_part_id IS NOT NULL THEN
          INSERT INTO parts_reservations (
            order_id,
            budget_id,
            part_id,
            part_code,
            part_name,
            quantity_reserved,
            unit_cost,
            reservation_status,
            reserved_by,
            org_id
          ) VALUES (
            v_budget.order_id,
            v_budget.id,
            v_part_id,
            v_part_code,
            v_part_name,
            v_available_stock,
            v_part_unit_price,
            'partial',
            NEW.registered_by,
            v_organization_id
          ) RETURNING id INTO v_new_reservation_id;

          -- Criar movimentação de estoque para reserva parcial
          INSERT INTO inventory_movements (
            org_id,
            part_id,
            movement_type,
            quantity,
            previous_quantity,
            new_quantity,
            unit_cost,
            order_id,
            budget_id,
            reason,
            notes,
            created_by,
            metadata
          ) VALUES (
            v_organization_id,
            v_part_id,
            'reserva',
            v_available_stock,
            v_part_current_quantity,
            v_part_current_quantity, -- Reserva não altera estoque físico
            v_part_unit_price,
            v_budget.order_id,
            v_budget.id,
            'Reserva parcial de peças para orçamento aprovado',
            'Reserva parcial #' || v_new_reservation_id,
            NEW.registered_by,
            jsonb_build_object('reservation_id', v_new_reservation_id, 'budget_id', v_budget.id)
          );
        END IF;
      END IF;
    END LOOP;

    -- 2. GERAR CONTAS A RECEBER
    INSERT INTO accounts_receivable (
      order_id,
      budget_id,
      customer_id,
      installment_number,
      total_installments,
      amount,
      due_date,
      status,
      org_id
    )
    SELECT 
      v_budget.order_id,
      v_budget.id,
      o.customer_id,
      1,
      1,
      NEW.approved_amount,
      CURRENT_DATE + INTERVAL '30 days',
      'pending',
      o.org_id
    FROM orders o
    WHERE o.id = v_budget.order_id
    ON CONFLICT DO NOTHING;

    -- 3. ATUALIZAR STATUS DO ORÇAMENTO
    UPDATE detailed_budgets
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = NEW.budget_id;

    -- 4. ATUALIZAR STATUS DA ORDEM
    UPDATE orders
    SET status = 'aprovada',
        updated_at = NOW()
    WHERE id = v_budget.order_id;

    -- 5. REGISTRAR NO HISTÓRICO DA ORDEM
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by,
      notes,
      org_id
    )
    SELECT 
      v_budget.order_id,
      o.status,
      'aprovada',
      NEW.registered_by,
      'Orçamento aprovado - ' || NEW.approval_type,
      o.org_id
    FROM orders o
    WHERE o.id = v_budget.order_id
    ON CONFLICT DO NOTHING;

    -- 6. CRIAR WORKFLOW PARA A ORDEM (NOVO)
    PERFORM create_workflow_from_engine_type(v_budget.order_id);

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_process_budget_approval() IS 
'Processa aprovação de orçamento, gerando reservas de peças, contas a receber e criando workflows para a ordem. 
Agora cria workflows apenas quando o orçamento é aprovado.';

