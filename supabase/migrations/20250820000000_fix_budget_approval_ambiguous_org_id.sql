-- Fix ambiguous org_id references in budget approval functions
-- This migration fixes the "column reference \"org_id\" is ambiguous" error
-- that occurs when approving budgets.

-- 1. Fix fn_process_budget_approval function
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
      -- Verificar estoque disponível
      SELECT COALESCE(SUM(quantity), 0) INTO v_available_stock
      FROM parts_inventory
      WHERE part_code = (v_part->>'code')::TEXT
        AND status = 'disponivel'
        AND org_id = v_organization_id;

      v_shortage := (v_part->>'quantity')::INTEGER - v_available_stock;

      IF v_available_stock >= (v_part->>'quantity')::INTEGER THEN
        -- ESTOQUE SUFICIENTE: Criar reserva
        INSERT INTO parts_reservations (
          order_id,
          budget_id,
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
          (v_part->>'code')::TEXT,
          (v_part->>'name')::TEXT,
          (v_part->>'quantity')::INTEGER,
          (v_part->>'unit_price')::NUMERIC,
          'reserved',
          NEW.registered_by,
          v_organization_id
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
          (v_part->>'code')::TEXT,
          (v_part->>'name')::TEXT,
          v_available_stock,
          (v_part->>'quantity')::INTEGER,
          'insufficient_for_order',
          'critical',
          true
        )
        ON CONFLICT DO NOTHING;

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
          (v_part->>'code')::TEXT,
          (v_part->>'name')::TEXT,
          (v_part->>'quantity')::INTEGER,
          v_available_stock,
          'high',
          'planned',
          jsonb_build_array(jsonb_build_object('order_id', v_budget.order_id)),
          (v_part->>'unit_price')::NUMERIC * v_shortage,
          'pending'
        );

        -- Se houver estoque parcial, reservar o que tem
        IF v_available_stock > 0 THEN
          INSERT INTO parts_reservations (
            order_id,
            budget_id,
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
            (v_part->>'code')::TEXT,
            (v_part->>'name')::TEXT,
            v_available_stock,
            (v_part->>'unit_price')::NUMERIC,
            'partial',
            NEW.registered_by,
            v_organization_id
          );
        END IF;
      END IF;
    END LOOP;

    -- 2. GERAR CONTAS A RECEBER
    -- FIX: Qualificar explicitamente a coluna org_id com o alias da tabela
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
      CURRENT_DATE + INTERVAL '30 days', -- Vencimento padrão: 30 dias
      'pending',
      o.org_id  -- FIX: Qualificado com o alias 'o' da tabela orders
    FROM orders o
    WHERE o.id = v_budget.order_id;

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
      o.org_id  -- FIX: Qualificado com o alias 'o' da tabela orders
    FROM orders o
    WHERE o.id = v_budget.order_id;

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_process_budget_approval() IS 'Processa aprovação de orçamento, gerando reservas de peças e contas a receber. FIX: Corrigido referência ambígua de org_id.';

-- 2. Fix notify_budget_approved function
CREATE OR REPLACE FUNCTION public.notify_budget_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_notification_type_id UUID;
  v_budget RECORD;
BEGIN
  -- Buscar dados do orçamento
  -- FIX: Qualificar explicitamente org_id com alias da tabela orders
  SELECT 
    db.*,
    o.order_number,
    o.org_id as order_org_id  -- FIX: Alias explícito para evitar ambiguidade
  INTO v_budget
  FROM detailed_budgets db
  INNER JOIN orders o ON o.id = db.order_id
  WHERE db.id = NEW.budget_id;

  -- Buscar tipo de notificação
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE code = 'budget_approved'
  LIMIT 1;

  IF v_notification_type_id IS NOT NULL THEN
    PERFORM create_notification(
      v_budget.order_org_id,  -- FIX: Usando o alias criado acima
      NULL, -- Global para produção
      v_notification_type_id,
      '✅ Orçamento Aprovado: OS #' || v_budget.order_number,
      'Orçamento de R$ ' || NEW.approved_amount::TEXT || ' aprovado. Ordem liberada para produção.',
      'success',
      '/ordens/' || v_budget.order_id,
      jsonb_build_object(
        'budget_id', NEW.budget_id,
        'order_id', v_budget.order_id,
        'approved_amount', NEW.approved_amount,
        'approval_type', NEW.approval_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_budget_approved() IS 'Cria notificação quando orçamento é aprovado. FIX: Corrigido referência ambígua de org_id.';

