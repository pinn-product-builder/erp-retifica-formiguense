

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'owner',
    'admin',
    'manager',
    'user',
    'super_admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."base_calc_method" AS ENUM (
    'percentual',
    'valor_fixo',
    'mva',
    'reducao_base',
    'substituicao_tributaria',
    'isento',
    'nao_incidencia'
);


ALTER TYPE "public"."base_calc_method" OWNER TO "postgres";


CREATE TYPE "public"."budget_status" AS ENUM (
    'pendente',
    'aprovado',
    'reprovado',
    'em_producao'
);


ALTER TYPE "public"."budget_status" OWNER TO "postgres";


CREATE TYPE "public"."classification_type" AS ENUM (
    'produto',
    'servico'
);


ALTER TYPE "public"."classification_type" OWNER TO "postgres";


CREATE TYPE "public"."customer_type" AS ENUM (
    'oficina',
    'direto'
);


ALTER TYPE "public"."customer_type" OWNER TO "postgres";


CREATE TYPE "public"."engine_component" AS ENUM (
    'bloco',
    'eixo',
    'biela',
    'comando',
    'cabecote',
    'virabrequim',
    'pistao'
);


ALTER TYPE "public"."engine_component" OWNER TO "postgres";


CREATE TYPE "public"."expense_category" AS ENUM (
    'fixed',
    'variable',
    'tax',
    'supplier',
    'salary',
    'equipment',
    'maintenance'
);


ALTER TYPE "public"."expense_category" OWNER TO "postgres";


CREATE TYPE "public"."filing_status" AS ENUM (
    'rascunho',
    'gerado',
    'validado',
    'enviado',
    'erro'
);


ALTER TYPE "public"."filing_status" OWNER TO "postgres";


CREATE TYPE "public"."jurisdiction" AS ENUM (
    'federal',
    'estadual',
    'municipal'
);


ALTER TYPE "public"."jurisdiction" OWNER TO "postgres";


CREATE TYPE "public"."operation_type" AS ENUM (
    'venda',
    'compra',
    'prestacao_servico'
);


ALTER TYPE "public"."operation_type" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'ativa',
    'concluida',
    'cancelada',
    'entregue',
    'pendente',
    'em_andamento',
    'aguardando_aprovacao'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'pix',
    'credit_card',
    'debit_card',
    'bank_transfer',
    'check'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."period_status" AS ENUM (
    'aberto',
    'fechado',
    'transmitido'
);


ALTER TYPE "public"."period_status" OWNER TO "postgres";


CREATE TYPE "public"."status_transition_type" AS ENUM (
    'automatic',
    'manual',
    'approval_required',
    'conditional'
);


ALTER TYPE "public"."status_transition_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'income',
    'expense'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."workflow_status" AS ENUM (
    'entrada',
    'metrologia',
    'usinagem',
    'montagem',
    'pronto',
    'garantia',
    'entregue'
);


ALTER TYPE "public"."workflow_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_user_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  points_to_add INTEGER;
  current_points INTEGER;
  new_total_points INTEGER;
  current_level_value INTEGER;
  new_level INTEGER;
  new_level_progress INTEGER;
  level_up BOOLEAN := FALSE;
  result JSONB;
BEGIN
  -- Calcular pontos
  points_to_add := calculate_action_points(p_org_id, p_user_id, p_action_type, p_metadata);
  
  -- Buscar ou criar score do usuário
  INSERT INTO user_scores (org_id, user_id, total_points, current_level, level_progress)
  VALUES (p_org_id, p_user_id, 0, 1, 0)
  ON CONFLICT (org_id, user_id) DO NOTHING;
  
  -- Buscar score atual
  SELECT total_points, current_level INTO current_points, current_level_value
  FROM user_scores
  WHERE org_id = p_org_id AND user_id = p_user_id;
  
  -- Calcular novo total
  new_total_points := current_points + points_to_add;
  
  -- Calcular novo nível (100 pontos por nível)
  new_level := (new_total_points / 100) + 1;
  new_level_progress := new_total_points % 100;
  
  -- Verificar se subiu de nível
  IF new_level > current_level_value THEN
    level_up := TRUE;
  END IF;
  
  -- Atualizar score
  UPDATE user_scores
  SET 
    total_points = new_total_points,
    current_level = new_level,
    level_progress = new_level_progress,
    last_updated = NOW(),
    updated_at = NOW()
  WHERE org_id = p_org_id AND user_id = p_user_id;
  
  -- Registrar no histórico
  INSERT INTO user_score_history (
    org_id, user_id, action_type, points_earned, 
    points_before, points_after, metadata
  ) VALUES (
    p_org_id, p_user_id, p_action_type, points_to_add,
    current_points, new_total_points, p_metadata
  );
  
  -- Preparar resultado
  result := jsonb_build_object(
    'points_earned', points_to_add,
    'total_points', new_total_points,
    'current_level', new_level,
    'level_progress', new_level_progress,
    'level_up', level_up,
    'previous_level', current_level_value
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."add_user_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_dismissed_alert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se o alerta foi desativado, arquivar no histórico
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.alert_history (
      alert_id,
      org_id,
      alert_type,
      title,
      message,
      severity,
      dismissed_at,
      metadata
    ) VALUES (
      OLD.id,
      OLD.org_id,
      OLD.alert_type,
      OLD.title,
      OLD.message,
      OLD.severity,
      NOW(),
      OLD.metadata
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."archive_dismissed_alert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_generate_budget_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    p_org_id uuid;
BEGIN
    -- Se budget_number já foi fornecido, não gerar
    IF NEW.budget_number IS NOT NULL AND NEW.budget_number != '' THEN
        RETURN NEW;
    END IF;
    
    -- Buscar org_id da order
    SELECT org_id INTO p_org_id
    FROM orders
    WHERE id = NEW.order_id;
    
    IF p_org_id IS NULL THEN
        RAISE EXCEPTION 'Order não encontrada ou sem org_id: %', NEW.order_id;
    END IF;
    
    -- Gerar budget_number
    NEW.budget_number := generate_budget_number(p_org_id);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_budget_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_generate_claim_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.claim_number IS NULL THEN
        NEW.claim_number := generate_warranty_claim_number(NEW.org_id);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_claim_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_generate_technical_report"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    report_template RECORD;
    report_data JSONB;
    new_report_id UUID;
    current_org_id UUID;
BEGIN
    -- Só gera relatório se o checklist foi aprovado/completado
    IF NEW.overall_status IN ('completed', 'approved') AND 
       (OLD.overall_status IS NULL OR OLD.overall_status NOT IN ('completed', 'approved')) THEN
        
        -- Buscar org_id
        SELECT org_id INTO current_org_id
        FROM orders WHERE id = NEW.order_id;
        
        -- Buscar template de relatório apropriado
        SELECT * INTO report_template
        FROM technical_report_templates trt
        JOIN workflow_checklists wc ON wc.technical_standard = trt.technical_standard
        WHERE wc.id = NEW.checklist_id
        AND trt.report_type = CASE NEW.step_key
            WHEN 'metrologia' THEN 'metrologia'
            WHEN 'pronto' THEN 'final_inspection'
            ELSE 'quality_control'
        END
        AND NEW.component = ANY(trt.applicable_components)
        AND trt.is_active = true
        LIMIT 1;
        
        -- Se encontrou template, gerar relatório
        IF FOUND THEN
            -- Preparar dados do relatório
            report_data := jsonb_build_object(
                'checklist_responses', NEW.responses,
                'measurements', NEW.measurements,
                'photos', NEW.photos,
                'non_conformities', NEW.non_conformities,
                'corrective_actions', NEW.corrective_actions,
                'filled_by', NEW.filled_by,
                'filled_at', NEW.filled_at,
                'reviewed_by', NEW.reviewed_by,
                'reviewed_at', NEW.reviewed_at
            );
            
            -- Inserir relatório técnico
            INSERT INTO technical_reports (
                order_id,
                component,
                report_type,
                report_template,
                technical_standard,
                report_number,
                report_data,
                measurements_data,
                photos_data,
                conformity_status,
                non_conformities,
                corrective_actions,
                generated_by,
                org_id
            )
            VALUES (
                NEW.order_id,
                NEW.component,
                report_template.report_type,
                report_template.template_name,
                report_template.technical_standard,
                generate_technical_report_number(current_org_id, report_template.report_type),
                report_data,
                NEW.measurements,
                NEW.photos,
                CASE 
                    WHEN jsonb_array_length(NEW.non_conformities) > 0 THEN 'non_conforming'
                    ELSE 'conforming'
                END,
                NEW.non_conformities,
                NEW.corrective_actions,
                NEW.filled_by,
                current_org_id
            )
            RETURNING id INTO new_report_id;
            
            -- Registrar no histórico de qualidade
            INSERT INTO quality_history (
                order_id,
                component,
                step_key,
                quality_event_type,
                event_description,
                related_checklist_id,
                related_response_id,
                related_report_id,
                recorded_by,
                org_id
            )
            VALUES (
                NEW.order_id,
                NEW.component,
                NEW.step_key,
                'report_generated',
                'Relatório técnico gerado automaticamente: ' || report_template.template_name,
                NEW.checklist_id,
                NEW.id,
                new_report_id,
                NEW.filled_by,
                current_org_id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_technical_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_reserve_parts_on_budget_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    part_record RECORD;
    available_stock INTEGER;
    reservation_quantity INTEGER;
    v_org_id UUID;
BEGIN
    SELECT org_id INTO v_org_id FROM detailed_budgets WHERE id = NEW.budget_id;
    
    IF NEW.approval_type IN ('total', 'partial') THEN
        FOR part_record IN 
            SELECT 
                p->>'part_code' as part_code,
                p->>'part_name' as part_name,
                (p->>'quantity')::INTEGER as quantity,
                (p->>'unit_price')::NUMERIC as unit_price
            FROM 
                detailed_budgets db,
                jsonb_array_elements(db.parts) as p
            WHERE 
                db.id = NEW.budget_id
                AND p->>'part_code' IS NOT NULL
                AND TRIM(p->>'part_code') != ''
                AND (
                    NEW.approval_type = 'total' 
                    OR p->>'part_code' = ANY(
                        SELECT jsonb_array_elements_text(NEW.approved_parts)
                    )
                )
        LOOP
            SELECT COALESCE(SUM(quantity), 0) INTO available_stock
            FROM parts_inventory 
            WHERE part_code = part_record.part_code 
            AND status = 'disponivel'
            AND org_id = v_org_id;
            
            reservation_quantity := LEAST(part_record.quantity, available_stock);
            
            -- parts_reservations
            IF reservation_quantity > 0 THEN
                BEGIN
                    INSERT INTO parts_reservations (
                        order_id, budget_id, part_code, part_name,
                        quantity_reserved, unit_cost, reservation_status,
                        reserved_at, reserved_by, org_id
                    ) VALUES (
                        (SELECT order_id FROM detailed_budgets WHERE id = NEW.budget_id),
                        NEW.budget_id, part_record.part_code, part_record.part_name,
                        reservation_quantity, part_record.unit_price, 'reserved',
                        NOW(), NEW.registered_by, v_org_id
                    );
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '[parts_reservations] ERROR: %', SQLERRM;
                END;
            END IF;
            
            -- purchase_needs
            IF part_record.quantity > available_stock THEN
                BEGIN
                    INSERT INTO purchase_needs (
                        org_id, part_code, part_name, required_quantity,
                        available_quantity, priority_level, need_type,
                        related_orders, estimated_cost, delivery_urgency_date, status
                    ) VALUES (
                        v_org_id, part_record.part_code, part_record.part_name,
                        part_record.quantity - available_stock, available_stock,
                        CASE WHEN (part_record.quantity - available_stock) > part_record.quantity * 0.5 
                            THEN 'high' ELSE 'normal' END,
                        'planned',
                        jsonb_build_array((SELECT order_id FROM detailed_budgets WHERE id = NEW.budget_id)),
                        part_record.unit_price * (part_record.quantity - available_stock),
                        CURRENT_DATE + INTERVAL '7 days', 'pending'
                    )
                    ON CONFLICT (org_id, part_code, status) 
                    DO UPDATE SET
                        required_quantity = purchase_needs.required_quantity + EXCLUDED.required_quantity,
                        estimated_cost = purchase_needs.estimated_cost + EXCLUDED.estimated_cost,
                        updated_at = NOW();
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING '[purchase_needs] ERROR: %', SQLERRM;
                END;
            END IF;
        END LOOP;
        
        -- stock_alerts com validação extra
        BEGIN
            INSERT INTO stock_alerts (
                org_id, part_code, part_name, current_stock,
                minimum_stock, alert_type, alert_level
            )
            SELECT DISTINCT
                pi.org_id, 
                pi.part_code,  -- Garantido NOT NULL pelos filtros
                pi.part_name,
                COALESCE(SUM(pi.quantity), 0) as current_stock,
                COALESCE(psc.minimum_stock, 5) as minimum_stock,
                'low_stock',
                CASE 
                    WHEN COALESCE(SUM(pi.quantity), 0) = 0 THEN 'critical'
                    WHEN COALESCE(SUM(pi.quantity), 0) < COALESCE(psc.minimum_stock, 5) * 0.5 THEN 'high'
                    ELSE 'warning'
                END
            FROM parts_inventory pi
            LEFT JOIN parts_stock_config psc ON pi.part_code = psc.part_code AND pi.org_id = psc.org_id
            WHERE pi.org_id = v_org_id
            AND pi.part_code IS NOT NULL 
            AND TRIM(pi.part_code) != ''
            AND EXISTS (
                SELECT 1 FROM detailed_budgets db, jsonb_array_elements(db.parts) as p
                WHERE db.id = NEW.budget_id
                AND p->>'part_code' IS NOT NULL 
                AND TRIM(p->>'part_code') != ''
                AND p->>'part_code' = pi.part_code
            )
            GROUP BY pi.org_id, pi.part_code, pi.part_name, psc.minimum_stock
            HAVING COALESCE(SUM(pi.quantity), 0) < COALESCE(psc.minimum_stock, 5)
            AND pi.part_code IS NOT NULL  -- ✅ VALIDAÇÃO EXTRA
            ON CONFLICT (org_id, part_code) 
            DO UPDATE SET
                current_stock = EXCLUDED.current_stock,
                alert_level = EXCLUDED.alert_level,
                created_at = NOW(),
                is_active = true;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '[stock_alerts] ERROR: %', SQLERRM;
            -- Não falhar a aprovação por causa de alertas
        END;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_reserve_parts_on_budget_approval"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_reserve_parts_on_budget_approval"() IS 'Processa aprovação com exception handling. Alertas e reservas não bloqueiam a aprovação.';



CREATE OR REPLACE FUNCTION "public"."calculate_action_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  points INTEGER := 0;
BEGIN
  -- Definir pontos por tipo de ação
  CASE p_action_type
    WHEN 'order_created' THEN points := 10;
    WHEN 'order_completed' THEN points := 25;
    WHEN 'budget_approved' THEN points := 15;
    WHEN 'diagnostic_completed' THEN points := 20;
    WHEN 'alert_resolved' THEN points := 5;
    WHEN 'goal_achieved' THEN points := 50;
    WHEN 'checklist_completed' THEN points := 8;
    WHEN 'photo_uploaded' THEN points := 3;
    WHEN 'daily_login' THEN points := 2;
    WHEN 'weekly_active' THEN points := 10;
    WHEN 'monthly_active' THEN points := 25;
    ELSE points := 1;
  END CASE;

  -- Multiplicadores baseados em performance
  IF p_metadata ? 'performance_multiplier' THEN
    points := points * (p_metadata->>'performance_multiplier')::INTEGER;
  END IF;

  -- Multiplicador por streak (dias consecutivos)
  IF p_metadata ? 'streak_days' THEN
    DECLARE
      streak_days INTEGER := (p_metadata->>'streak_days')::INTEGER;
    BEGIN
      IF streak_days >= 7 THEN
        points := points * 2;
      ELSIF streak_days >= 30 THEN
        points := points * 3;
      END IF;
    END;
  END IF;

  RETURN points;
END;
$$;


ALTER FUNCTION "public"."calculate_action_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_budget_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Calcular labor_total
    NEW.labor_total = NEW.labor_hours * NEW.labor_rate;
    
    -- Calcular tax_amount
    NEW.tax_amount = (NEW.labor_total + NEW.parts_total - NEW.discount) * NEW.tax_percentage / 100;
    
    -- Calcular total_amount
    NEW.total_amount = NEW.labor_total + NEW.parts_total - NEW.discount + NEW.tax_amount;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_budget_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_checklist_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_items INTEGER;
    completed_items INTEGER;
    completion_pct NUMERIC(5,2);
BEGIN
    -- Contar total de itens obrigatórios do checklist
    SELECT COUNT(*) INTO total_items
    FROM workflow_checklist_items
    WHERE checklist_id = NEW.checklist_id
    AND is_required = true;
    
    -- Contar itens respondidos (não nulos e não vazios)
    SELECT COUNT(*) INTO completed_items
    FROM jsonb_object_keys(NEW.responses) AS key
    JOIN workflow_checklist_items wci ON wci.item_code = key
    WHERE wci.checklist_id = NEW.checklist_id
    AND wci.is_required = true
    AND NEW.responses->key IS NOT NULL
    AND NEW.responses->key != '""'::jsonb
    AND NEW.responses->key != 'null'::jsonb;
    
    -- Calcular percentual
    IF total_items > 0 THEN
        completion_pct := (completed_items::NUMERIC / total_items * 100);
    ELSE
        completion_pct := 100;
    END IF;
    
    NEW.completion_percentage := completion_pct;
    
    -- Atualizar status baseado na completude
    IF completion_pct = 100 AND NEW.overall_status = 'pending' THEN
        NEW.overall_status := 'completed';
    ELSIF completion_pct < 100 AND NEW.overall_status = 'completed' THEN
        NEW.overall_status := 'pending';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_checklist_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_kpi_trend"("kpi_code" "text", "organization_id" "uuid", "current_period" "text" DEFAULT 'current'::"text", "comparison_period" "text" DEFAULT 'previous'::"text") RETURNS TABLE("current_value" numeric, "previous_value" numeric, "change_percentage" numeric, "trend_direction" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_val NUMERIC;
  previous_val NUMERIC;
  change_pct NUMERIC;
  trend_dir TEXT;
BEGIN
  -- Calcular valor atual
  SELECT calculate_kpi_value(kpi_code, organization_id, current_period) INTO current_val;
  
  -- Calcular valor anterior
  SELECT calculate_kpi_value(kpi_code, organization_id, comparison_period) INTO previous_val;
  
  -- Calcular mudança percentual
  IF previous_val = 0 THEN
    change_pct := CASE WHEN current_val > 0 THEN 100 ELSE 0 END;
  ELSE
    change_pct := ((current_val - previous_val) / previous_val) * 100;
  END IF;
  
  -- Determinar direção da tendência
  IF ABS(change_pct) < 1 THEN
    trend_dir := 'stable';
  ELSIF change_pct > 0 THEN
    trend_dir := 'up';
  ELSE
    trend_dir := 'down';
  END IF;
  
  RETURN QUERY SELECT current_val, previous_val, change_pct, trend_dir;
END;
$$;


ALTER FUNCTION "public"."calculate_kpi_trend"("kpi_code" "text", "organization_id" "uuid", "current_period" "text", "comparison_period" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_kpi_value"("kpi_code" "text", "organization_id" "uuid", "timeframe" "text" DEFAULT 'current'::"text") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result NUMERIC := 0;
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
BEGIN
  -- Definir período baseado no timeframe
  CASE timeframe
    WHEN 'current' THEN
      -- Para 'current', buscar últimos 30 dias para ter dados
      start_date := NOW() - INTERVAL '30 days';
      end_date := NOW();
    WHEN 'yesterday' THEN
      start_date := DATE_TRUNC('day', NOW() - INTERVAL '1 day');
      end_date := DATE_TRUNC('day', NOW());
    WHEN 'week' THEN
      start_date := DATE_TRUNC('week', NOW());
      end_date := NOW();
    WHEN 'month' THEN
      start_date := DATE_TRUNC('month', NOW());
      end_date := NOW();
    WHEN 'previous' THEN
      -- Para comparação, buscar 30 dias anteriores
      start_date := NOW() - INTERVAL '60 days';
      end_date := NOW() - INTERVAL '30 days';
    ELSE
      start_date := NOW() - INTERVAL '30 days';
      end_date := NOW();
  END CASE;

  -- Calcular KPI baseado no código
  CASE kpi_code
    WHEN 'total_orders' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'orders_in_progress' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status IN ('ativa', 'em_andamento')
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'completed_orders' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status = 'concluida'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'pending_budget_approvals' THEN
      SELECT COUNT(*) INTO result
      FROM detailed_budgets
      WHERE org_id = organization_id
      AND status IN ('draft', 'pendente')
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'revenue_current_month' THEN
      SELECT COALESCE(SUM(total_amount), 0) INTO result
      FROM detailed_budgets
      WHERE org_id = organization_id
      AND status = 'approved'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'average_order_value' THEN
      SELECT COALESCE(AVG(total_amount), 0) INTO result
      FROM detailed_budgets
      WHERE org_id = organization_id
      AND status = 'approved'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'customer_satisfaction' THEN
      -- Placeholder para métrica futura
      SELECT 85.0 INTO result;
    
    WHEN 'orders_today' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND created_at >= DATE_TRUNC('day', NOW());
    
    WHEN 'pending_orders' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status = 'pendente';
    
    WHEN 'completed_today' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = organization_id
      AND status = 'concluida'
      AND actual_delivery >= DATE_TRUNC('day', NOW());
    
    ELSE
      result := 0;
  END CASE;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."calculate_kpi_value"("kpi_code" "text", "organization_id" "uuid", "timeframe" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_supplier_performance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Calcular delivery_performance
    IF NEW.actual_delivery_date IS NOT NULL THEN
        IF NEW.actual_delivery_date <= NEW.promised_delivery_date THEN
            NEW.delivery_performance = 10;
        ELSE
            NEW.delivery_performance = GREATEST(0, 10 - (NEW.actual_delivery_date - NEW.promised_delivery_date));
        END IF;
    ELSE
        NEW.delivery_performance = 0;
    END IF;
    
    -- Calcular price_variance_percentage
    NEW.price_variance_percentage = ((NEW.actual_price - NEW.ordered_price) / NEW.ordered_price * 100);
    
    -- Calcular quantity_fulfillment_percentage
    NEW.quantity_fulfillment_percentage = (NEW.received_quantity::numeric / NEW.ordered_quantity * 100);
    
    -- Calcular overall_score
    NEW.overall_score = (
        NEW.quality_rating + 
        NEW.delivery_performance + 
        GREATEST(0, 10 - ABS(NEW.price_variance_percentage)) + 
        (NEW.quantity_fulfillment_percentage / 10)
    ) / 4;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_supplier_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_supplier_suggestions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    supplier_record RECORD;
    performance_score NUMERIC;
    cost_score NUMERIC;
    delivery_score NUMERIC;
    reliability_score NUMERIC;
    final_score NUMERIC;
BEGIN
    -- Limpar sugestões antigas para esta necessidade
    DELETE FROM supplier_suggestions WHERE purchase_need_id = NEW.id;
    
    -- Para cada fornecedor ativo
    FOR supplier_record IN 
        SELECT s.*
        FROM suppliers s
        WHERE s.is_active = true 
        AND s.org_id = NEW.org_id
    LOOP
        -- Calcular score de performance baseado no histórico
        SELECT 
            COALESCE(AVG(overall_score), 5.0),
            COALESCE(AVG(delivery_performance), 0),
            COALESCE(COUNT(*), 0)
        INTO performance_score, delivery_score, reliability_score
        FROM supplier_performance_history sph
        WHERE sph.supplier_id = supplier_record.id
        AND sph.part_code = NEW.part_code
        AND sph.recorded_at >= NOW() - INTERVAL '12 months';
        
        -- Se não há histórico específico da peça, usar dados gerais do fornecedor
        IF reliability_score = 0 THEN
            SELECT 
                COALESCE(AVG(overall_score), supplier_record.rating),
                COALESCE(AVG(delivery_performance), 0),
                COALESCE(COUNT(*), 0)
            INTO performance_score, delivery_score, reliability_score
            FROM supplier_performance_history sph
            WHERE sph.supplier_id = supplier_record.id
            AND sph.recorded_at >= NOW() - INTERVAL '12 months';
        END IF;
        
        -- Usar rating padrão se não há histórico
        IF reliability_score = 0 THEN
            performance_score := supplier_record.rating;
            delivery_score := 0;
            reliability_score := 1;
        END IF;
        
        -- Calcular score de custo (baseado em preços históricos ou estimativa)
        SELECT COALESCE(AVG(actual_price), 0)
        INTO cost_score
        FROM supplier_performance_history sph
        WHERE sph.supplier_id = supplier_record.id
        AND sph.part_code = NEW.part_code
        AND sph.recorded_at >= NOW() - INTERVAL '6 months';
        
        -- Se não há preço histórico, usar estimativa baseada no custo da necessidade
        IF cost_score = 0 THEN
            cost_score := NEW.estimated_cost / NEW.required_quantity;
        END IF;
        
        -- Normalizar scores (0-10)
        performance_score := LEAST(10, GREATEST(0, performance_score));
        delivery_score := LEAST(10, GREATEST(0, 10 - (supplier_record.delivery_days * 0.5)));
        
        -- Calcular score de custo (menor custo = maior score)
        -- Assumindo que custos menores são melhores
        cost_score := CASE 
            WHEN cost_score > 0 THEN LEAST(10, GREATEST(1, 10 - (cost_score / (NEW.estimated_cost / NEW.required_quantity) * 5)))
            ELSE 7 -- Score neutro se não há dados de custo
        END;
        
        -- Score de confiabilidade baseado no número de transações
        reliability_score := LEAST(10, GREATEST(1, reliability_score * 2));
        
        -- Calcular score final ponderado
        final_score := (
            performance_score * 0.3 +  -- 30% qualidade
            delivery_score * 0.25 +    -- 25% prazo de entrega
            cost_score * 0.35 +        -- 35% custo
            reliability_score * 0.1    -- 10% confiabilidade (histórico)
        );
        
        -- Inserir sugestão
        INSERT INTO supplier_suggestions (
            purchase_need_id,
            supplier_id,
            supplier_name,
            suggested_price,
            delivery_days,
            reliability_score,
            last_purchase_date,
            total_purchases_count,
            average_delivery_days,
            quality_rating,
            cost_benefit_score,
            is_preferred
        ) VALUES (
            NEW.id,
            supplier_record.id,
            supplier_record.name,
            cost_score * (NEW.estimated_cost / NEW.required_quantity) / 10, -- Preço sugerido baseado no score
            supplier_record.delivery_days,
            performance_score,
            (
                SELECT MAX(recorded_at)::DATE 
                FROM supplier_performance_history 
                WHERE supplier_id = supplier_record.id
            ),
            reliability_score::INTEGER,
            supplier_record.delivery_days,
            performance_score,
            final_score,
            final_score >= 8.0 -- Marcar como preferido se score >= 8
        );
    END LOOP;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_supplier_suggestions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_warranty_rate"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.total_orders_delivered > 0 THEN
        NEW.warranty_rate := (NEW.total_warranty_claims::NUMERIC / NEW.total_orders_delivered * 100);
    ELSE
        NEW.warranty_rate := 0;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_warranty_rate"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_organizations"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN public.is_super_admin();
END;
$$;


ALTER FUNCTION "public"."can_manage_organizations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_manage_organizations"() IS 'Verifica se o usuário pode gerenciar organizações globalmente';



CREATE OR REPLACE FUNCTION "public"."can_workflow_advance"("p_workflow_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_workflow RECORD;
  v_checklist RECORD;
  v_response RECORD;
  v_result JSONB;
  v_blocking_checklists JSONB[] := '{}';
BEGIN
  -- Buscar workflow
  SELECT * INTO v_workflow
  FROM order_workflow
  WHERE id = p_workflow_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_advance', false,
      'reason', 'Workflow não encontrado'
    );
  END IF;

  -- Verificar checklists obrigatórios
  FOR v_checklist IN 
    SELECT id, checklist_name, blocks_workflow_advance
    FROM workflow_checklists
    WHERE step_key = v_workflow.status::TEXT
      AND component = v_workflow.component
      AND is_mandatory = true
      AND is_active = true
      AND blocks_workflow_advance = true
  LOOP
    -- Verificar se o checklist foi preenchido e aprovado
    SELECT * INTO v_response
    FROM workflow_checklist_responses
    WHERE order_workflow_id = p_workflow_id
      AND checklist_id = v_checklist.id
      AND overall_status = 'approved';

    IF NOT FOUND THEN
      v_blocking_checklists := array_append(
        v_blocking_checklists,
        jsonb_build_object(
          'checklist_id', v_checklist.id,
          'checklist_name', v_checklist.checklist_name
        )
      );
    END IF;
  END LOOP;

  -- Retornar resultado
  IF array_length(v_blocking_checklists, 1) > 0 THEN
    RETURN jsonb_build_object(
      'can_advance', false,
      'reason', 'Checklists obrigatórios pendentes',
      'blocking_checklists', array_to_json(v_blocking_checklists)
    );
  ELSE
    RETURN jsonb_build_object(
      'can_advance', true,
      'reason', 'Todos os requisitos atendidos'
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."can_workflow_advance"("p_workflow_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_workflow_advance"("p_workflow_id" "uuid") IS 'Verifica se um workflow pode avançar baseado em checklists obrigatórios';



CREATE OR REPLACE FUNCTION "public"."check_achievement_criteria"("p_org_id" "uuid", "p_user_id" "uuid", "p_achievement_key" "text", "p_criteria" "jsonb", "p_action_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  criteria_type TEXT;
  criteria_value INTEGER;
  current_value INTEGER;
  result BOOLEAN := FALSE;
BEGIN
  criteria_type := p_criteria->>'type';
  criteria_value := (p_criteria->>'value')::INTEGER;
  
  CASE criteria_type
    WHEN 'total_orders' THEN
      SELECT COUNT(*) INTO current_value
      FROM orders
      WHERE org_id = p_org_id AND created_by = p_user_id;
      
    WHEN 'completed_orders' THEN
      SELECT COUNT(*) INTO current_value
      FROM orders
      WHERE org_id = p_org_id AND created_by = p_user_id AND status = 'concluida';
      
    WHEN 'approved_budgets' THEN
      SELECT COUNT(*) INTO current_value
      FROM detailed_budgets
      WHERE org_id = p_org_id AND created_by = p_user_id AND status = 'approved';
      
    WHEN 'total_points' THEN
      SELECT COALESCE(total_points, 0) INTO current_value
      FROM user_scores
      WHERE org_id = p_org_id AND user_id = p_user_id;
      
    WHEN 'consecutive_days' THEN
      SELECT COALESCE(MAX(streak_days), 0) INTO current_value
      FROM (
        SELECT COUNT(*) as streak_days
        FROM user_score_history
        WHERE org_id = p_org_id AND user_id = p_user_id
          AND action_type = 'daily_login'
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
      ) streaks;
      
    WHEN 'level_reached' THEN
      SELECT COALESCE(current_level, 1) INTO current_value
      FROM user_scores
      WHERE org_id = p_org_id AND user_id = p_user_id;
      
    ELSE
      current_value := 0;
  END CASE;
  
  result := current_value >= criteria_value;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."check_achievement_criteria"("p_org_id" "uuid", "p_user_id" "uuid", "p_achievement_key" "text", "p_criteria" "jsonb", "p_action_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_achievements"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  achievement_record RECORD;
  new_achievements JSONB := '[]';
  achievement_data JSONB;
BEGIN
  -- Buscar conquistas disponíveis para a organização
  FOR achievement_record IN
    SELECT * FROM achievement_configs
    WHERE org_id = p_org_id AND is_active = true
  LOOP
    -- Verificar se o usuário já tem esta conquista
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements
      WHERE org_id = p_org_id 
        AND user_id = p_user_id 
        AND achievement_type = achievement_record.achievement_key
    ) THEN
      -- Verificar critérios da conquista
      IF check_achievement_criteria(
        p_org_id, p_user_id, achievement_record.achievement_key, 
        achievement_record.criteria, p_action_type, p_metadata
      ) THEN
        -- Conceder conquista
        INSERT INTO user_achievements (
          org_id, user_id, achievement_type, achievement_data, points_earned
        ) VALUES (
          p_org_id, p_user_id, achievement_record.achievement_key,
          achievement_record.criteria, achievement_record.points
        );
        
        -- Adicionar à lista de novas conquistas
        achievement_data := jsonb_build_object(
          'id', achievement_record.id,
          'key', achievement_record.achievement_key,
          'title', achievement_record.title,
          'description', achievement_record.description,
          'icon', achievement_record.icon,
          'points', achievement_record.points
        );
        
        new_achievements := new_achievements || achievement_data;
      END IF;
    END IF;
  END LOOP;
  
  RETURN new_achievements;
END;
$$;


ALTER FUNCTION "public"."check_achievements"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_mandatory_checklists_before_workflow_advance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    mandatory_checklist RECORD;
    checklist_response RECORD;
BEGIN
    -- Verificar se há checklists obrigatórios para este step
    FOR mandatory_checklist IN
        SELECT wc.* 
        FROM workflow_checklists wc
        JOIN workflow_steps ws ON ws.id = wc.workflow_step_id
        WHERE ws.step_key = OLD.status::text
        AND wc.component = NEW.component
        AND wc.is_mandatory = true
        AND wc.blocks_workflow_advance = true
        AND wc.is_active = true
    LOOP
        -- Verificar se o checklist foi completado
        SELECT * INTO checklist_response
        FROM workflow_checklist_responses wcr
        WHERE wcr.order_workflow_id = NEW.id
        AND wcr.checklist_id = mandatory_checklist.id
        AND wcr.overall_status IN ('completed', 'approved');
        
        -- Se não foi completado, bloquear o avanço
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Não é possível avançar para % sem completar o checklist obrigatório: %', 
                NEW.status, mandatory_checklist.checklist_name;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_mandatory_checklists_before_workflow_advance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_minimum_stock_levels"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    config_record RECORD;
    alert_type_val VARCHAR(50);
    alert_level_val VARCHAR(20);
BEGIN
    SELECT * INTO config_record
    FROM parts_stock_config
    WHERE org_id = NEW.org_id AND part_code = NEW.part_code;
    
    IF NOT FOUND THEN
        config_record.minimum_stock := 5;
        config_record.maximum_stock := 50;
    END IF;
    
    IF NEW.quantity = 0 THEN
        alert_type_val := 'out_of_stock';
        alert_level_val := 'critical';
    ELSIF NEW.quantity < config_record.minimum_stock THEN
        alert_type_val := 'below_minimum';
        alert_level_val := 'warning';
    ELSIF NEW.quantity = config_record.minimum_stock THEN
        alert_type_val := 'minimum_reached';
        alert_level_val := 'info';
    ELSIF NEW.quantity > config_record.maximum_stock THEN
        alert_type_val := 'overstock';
        alert_level_val := 'warning';
    END IF;
    
    IF alert_type_val IS NOT NULL AND NEW.part_code IS NOT NULL AND TRIM(NEW.part_code) != '' THEN
        BEGIN
            INSERT INTO stock_alerts (
                org_id, part_code, part_name, current_stock,
                minimum_stock, maximum_stock, alert_type, alert_level
            )
            VALUES (
                NEW.org_id, NEW.part_code, NEW.part_name, NEW.quantity,
                config_record.minimum_stock, config_record.maximum_stock,
                alert_type_val, alert_level_val
            )
            ON CONFLICT (org_id, part_code) DO UPDATE SET
                current_stock = EXCLUDED.current_stock,
                alert_type = EXCLUDED.alert_type,
                alert_level = EXCLUDED.alert_level,
                is_active = true,
                created_at = now();
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION '[check_minimum_stock_levels] ERROR: % | part_code: %', SQLERRM, NEW.part_code;
        END;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_minimum_stock_levels"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_minimum_stock_levels"() IS 'Verifica níveis de estoque e cria alertas. Apenas para peças COM part_code válido.';



CREATE OR REPLACE FUNCTION "public"."check_stock_and_create_purchase_need"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_config RECORD;
BEGIN
  -- Apenas processar se part_code é válido
  IF NEW.part_code IS NULL OR TRIM(NEW.part_code) = '' THEN
    RETURN NEW;
  END IF;

  -- Buscar configuração de estoque
  SELECT * INTO v_config
  FROM parts_stock_config
  WHERE part_code = NEW.part_code
    AND org_id = NEW.org_id;

  -- Se encontrou config e tem auto-reorder
  IF FOUND AND v_config.auto_reorder_enabled THEN
    -- Verificar se atingiu estoque mínimo
    IF NEW.quantity <= v_config.minimum_stock THEN
      
      -- Criar necessidade de compra (SEM stock_alert)
      INSERT INTO purchase_needs (
        org_id,
        part_code,
        part_name,
        required_quantity,
        available_quantity,
        priority_level,
        need_type,
        estimated_cost,
        status
      ) VALUES (
        NEW.org_id,
        NEW.part_code,
        NEW.part_name,
        v_config.economic_order_quantity,
        NEW.quantity,
        CASE 
          WHEN NEW.quantity = 0 THEN 'critical'
          WHEN NEW.quantity <= (v_config.minimum_stock * 0.5) THEN 'high'
          ELSE 'normal'
        END,
        'auto_reorder',
        0,
        'pending'
      )
      ON CONFLICT (org_id, part_code, status) DO UPDATE SET
        required_quantity = purchase_needs.required_quantity + EXCLUDED.required_quantity,
        updated_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_stock_and_create_purchase_need"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_stock_and_create_purchase_need"() IS 'Versão simplificada que apenas cria purchase_needs. Stock_alerts são criados apenas na aprovação de orçamento.';



CREATE OR REPLACE FUNCTION "public"."create_default_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    component_name engine_component;
BEGIN
    -- Criar entrada de workflow para cada componente
    FOREACH component_name IN ARRAY ENUM_RANGE(NULL::engine_component) LOOP
        INSERT INTO public.order_workflow (order_id, component, status)
        VALUES (NEW.id, component_name, 'entrada');
    END LOOP;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_inventory_entry_on_receipt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_receipt RECORD;
  v_po RECORD;
  v_part RECORD;
  v_user_id UUID;
BEGIN
  SELECT * INTO v_receipt
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = v_receipt.purchase_order_id;
  
  IF NEW.part_id IS NULL THEN
    RAISE NOTICE 'Item % não tem part_id, entrada no estoque ignorada', NEW.id;
    RETURN NEW;
  END IF;
  
  IF NEW.quality_status != 'approved' THEN
    RAISE NOTICE 'Item % com qualidade não aprovada, entrada no estoque ignorada', NEW.id;
    RETURN NEW;
  END IF;
  
  SELECT * INTO v_part
  FROM parts_inventory
  WHERE id = NEW.part_id;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Peça % não encontrada no estoque', NEW.part_id;
    RETURN NEW;
  END IF;
  
  SELECT received_by INTO v_user_id
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  INSERT INTO inventory_movements (
    org_id,
    part_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    unit_cost,
    order_id,
    reason,
    notes,
    created_by,
    metadata
  ) VALUES (
    v_receipt.org_id,
    NEW.part_id,
    'entrada',
    NEW.received_quantity,
    v_part.quantity,
    v_part.quantity + NEW.received_quantity,
    NEW.unit_cost,
    NULL,
    'Recebimento de compra - PO: ' || v_po.po_number || ' | Recebimento: ' || v_receipt.receipt_number,
    CASE 
      WHEN NEW.has_divergence THEN 
        'Recebido com divergência: ' || COALESCE(NEW.divergence_reason, 'Não especificada')
      ELSE 
        'Recebimento conforme pedido'
    END,
    COALESCE(v_user_id, v_receipt.created_by),
    jsonb_build_object(
      'receipt_id', v_receipt.id,
      'receipt_number', v_receipt.receipt_number,
      'purchase_order_id', v_po.id,
      'po_number', v_po.po_number,
      'supplier_id', v_po.supplier_id,
      'has_divergence', NEW.has_divergence,
      'quality_status', NEW.quality_status
    )
  );
  
  RAISE NOTICE 'Entrada no estoque criada para peça %', v_part.part_name;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_inventory_entry_on_receipt"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_inventory_entry_on_receipt"() IS 'Cria automaticamente uma movimentação de entrada no estoque quando um item é recebido. Apenas processa itens com part_id definido e qualidade aprovada.';



CREATE OR REPLACE FUNCTION "public"."create_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_notification_type_id" "uuid", "p_title" "text", "p_message" "text", "p_severity" "text" DEFAULT 'info'::"text", "p_action_url" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    org_id,
    user_id,
    notification_type_id,
    title,
    message,
    severity,
    action_url,
    metadata,
    is_read,
    is_global
  ) VALUES (
    p_org_id,
    p_user_id,
    p_notification_type_id,
    p_title,
    p_message,
    p_severity,
    p_action_url,
    p_metadata,
    false,
    p_user_id IS NULL
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_notification_type_id" "uuid", "p_title" "text", "p_message" "text", "p_severity" "text", "p_action_url" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_notification_type_id" "uuid", "p_title" "text", "p_message" "text", "p_severity" "text", "p_action_url" "text", "p_metadata" "jsonb") IS 'Cria uma notificação no sistema';



CREATE OR REPLACE FUNCTION "public"."create_order_warranty"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Create warranty when order is completed (using correct enum value 'concluida')
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status != 'concluida') THEN
    INSERT INTO public.order_warranties (
      order_id,
      warranty_type,
      start_date,
      end_date,
      terms,
      org_id
    ) VALUES (
      NEW.id,
      'total',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 month' * COALESCE(NEW.warranty_months, 3),
      'Garantia padrão para serviços executados',
      NEW.org_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_order_warranty"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_stock_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_severity TEXT;
BEGIN
  -- Definir título e mensagem baseado no tipo de alerta
  CASE NEW.alert_type
    WHEN 'out_of_stock' THEN
      notification_title := 'Estoque Esgotado';
      notification_message := NEW.part_name || ' (' || NEW.part_code || ') está sem estoque';
      notification_severity := 'error';
    WHEN 'below_minimum' THEN
      notification_title := 'Estoque Baixo';
      notification_message := NEW.part_name || ' (' || NEW.part_code || ') com apenas ' || NEW.current_stock || ' unidades (mínimo: ' || NEW.minimum_stock || ')';
      notification_severity := 'warning';
    WHEN 'minimum_reached' THEN
      notification_title := 'Estoque no Mínimo';
      notification_message := NEW.part_name || ' (' || NEW.part_code || ') atingiu o estoque mínimo (' || NEW.minimum_stock || ' unidades)';
      notification_severity := 'info';
    WHEN 'overstock' THEN
      notification_title := 'Estoque Excessivo';
      notification_message := NEW.part_name || ' (' || NEW.part_code || ') com ' || NEW.current_stock || ' unidades (máximo: ' || NEW.maximum_stock || ')';
      notification_severity := 'warning';
    ELSE
      notification_title := 'Alerta de Estoque';
      notification_message := NEW.part_name || ' (' || NEW.part_code || ') - ' || NEW.alert_type;
      notification_severity := 'info';
  END CASE;

  -- Criar notificação global para a organização
  INSERT INTO notifications (
    org_id,
    notification_type_id,
    title,
    message,
    severity,
    is_read,
    is_global,
    action_url,
    metadata
  ) VALUES (
    NEW.org_id,
    (SELECT id FROM notification_types WHERE name = 'stock_alert' LIMIT 1),
    notification_title,
    notification_message,
    notification_severity,
    false,
    true,
    '/inventory',
    jsonb_build_object(
      'part_code', NEW.part_code,
      'part_name', NEW.part_name,
      'current_stock', NEW.current_stock,
      'minimum_stock', NEW.minimum_stock,
      'maximum_stock', NEW.maximum_stock,
      'alert_type', NEW.alert_type,
      'alert_level', NEW.alert_level
    )
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_stock_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_org_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT organization_id 
  FROM public.organization_users 
  WHERE user_id = auth.uid() 
  AND is_active = true 
  ORDER BY joined_at DESC 
  LIMIT 1;
$$;


ALTER FUNCTION "public"."current_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_check_stock_minimum"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_config RECORD;
BEGIN
  IF NEW.part_code IS NULL OR TRIM(NEW.part_code) = '' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_config
  FROM parts_stock_config
  WHERE part_code = NEW.part_code AND org_id = NEW.org_id;

  IF FOUND AND v_config.auto_reorder_enabled THEN
    IF NEW.quantity <= v_config.minimum_stock THEN
      BEGIN
        INSERT INTO purchase_needs (
          org_id, part_code, part_name, required_quantity,
          available_quantity, priority_level, need_type,
          estimated_cost, status
        ) VALUES (
          NEW.org_id, NEW.part_code, NEW.part_name,
          v_config.economic_order_quantity, NEW.quantity,
          CASE 
            WHEN NEW.quantity = 0 THEN 'critical'
            WHEN NEW.quantity <= (v_config.minimum_stock * 0.5) THEN 'high'
            ELSE 'normal'
          END,
          'auto_reorder', 0, 'pending'
        )
        ON CONFLICT (org_id, part_code, status) DO UPDATE SET
          required_quantity = purchase_needs.required_quantity + EXCLUDED.required_quantity,
          updated_at = NOW();
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '[fn_check_stock_minimum] ERROR: % | part_code: %', SQLERRM, NEW.part_code;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_check_stock_minimum"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_check_stock_minimum"() IS 'Verifica estoque mínimo e cria necessidade de compra automática se habilitado.';



CREATE OR REPLACE FUNCTION "public"."fn_create_order_warranty"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Criar garantia automaticamente quando ordem é marcada como entregue
  IF NEW.status = 'entregue' AND OLD.status != 'entregue' THEN
    INSERT INTO order_warranties (
      order_id,
      warranty_type,
      start_date,
      end_date,
      terms,
      is_active,
      org_id
    ) VALUES (
      NEW.id,
      'total',
      NEW.actual_delivery,
      NEW.actual_delivery + (INTERVAL '1 month' * COALESCE(NEW.warranty_months, 3)),
      'Garantia padrão conforme contrato',
      true,
      NEW.org_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_create_order_warranty"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_create_order_warranty"() IS 'Cria registro de garantia automaticamente quando ordem é entregue';



CREATE OR REPLACE FUNCTION "public"."fn_process_budget_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_budget RECORD;
  v_organization_id UUID;
  v_old_status TEXT;
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
  IF NEW.approval_type IN ('total', 'partial') THEN
    
    -- Capturar status antigo ANTES de atualizar (como TEXT)
    SELECT status::TEXT INTO v_old_status
    FROM orders
    WHERE id = v_budget.order_id;
    
    -- 1. GERAR CONTAS A RECEBER
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
    WHERE o.id = v_budget.order_id;

    -- 2. ATUALIZAR STATUS DO ORÇAMENTO
    UPDATE detailed_budgets
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = NEW.budget_id;

    -- 3. ATUALIZAR STATUS DA ORDEM
    UPDATE orders
    SET status = 'ativa',
        updated_at = NOW()
    WHERE id = v_budget.order_id;

    -- 4. REGISTRAR NO HISTÓRICO DA ORDEM (usando TEXT capturado)
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by,
      notes,
      org_id
    )
    VALUES (
      v_budget.order_id,
      v_old_status,  -- Já é TEXT
      'ativa',       -- TEXT
      NEW.registered_by,
      'Orçamento aprovado - ' || NEW.approval_type,
      v_organization_id
    );

  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_process_budget_approval"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_process_budget_approval"() IS 'Processa aprovação de orçamento. Faz cast seguro de ENUM para TEXT no histórico.';



CREATE OR REPLACE FUNCTION "public"."generate_accounts_receivable"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Só gera se o status mudou para aprovado
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
        INSERT INTO public.accounts_receivable (
            budget_id,
            order_id,
            customer_id,
            amount,
            due_date,
            installment_number,
            total_installments
        )
        SELECT 
            NEW.id,
            NEW.order_id,
            o.customer_id,
            NEW.total_cost,
            CURRENT_DATE + INTERVAL '30 days',
            1,
            1
        FROM public.orders o
        WHERE o.id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_accounts_receivable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_budget_number"("org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_budget_number TEXT;
    max_attempts INTEGER := 5;
    attempt INTEGER := 0;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Loop com retry para lidar com race conditions
    LOOP
        attempt := attempt + 1;
        
        -- Buscar o próximo número disponível
        SELECT COALESCE(
            MAX(CAST(SPLIT_PART(db.budget_number, '-', 3) AS INTEGER)), 
            0
        ) + 1
        INTO sequence_num
        FROM detailed_budgets db
        JOIN orders o ON o.id = db.order_id
        WHERE o.org_id = generate_budget_number.org_id
        AND db.budget_number LIKE 'ORC-' || year_part || '-%';
        
        new_budget_number := 'ORC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
        
        -- Verificar se o número já existe (double check)
        IF NOT EXISTS (
            SELECT 1 
            FROM detailed_budgets db
            JOIN orders o ON o.id = db.order_id
            WHERE o.org_id = generate_budget_number.org_id
            AND db.budget_number = new_budget_number
        ) THEN
            RETURN new_budget_number;
        END IF;
        
        -- Se o número já existe, tentar novamente
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Não foi possível gerar budget_number após % tentativas', max_attempts;
        END IF;
        
        -- Pequeno delay antes de tentar novamente (10ms)
        PERFORM pg_sleep(0.01);
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_budget_number"("org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_budget_number"("org_id" "uuid") IS 'Gera número sequencial para orçamento no formato ORC-YYYY-NNNN. 
Thread-safe com retry logic para prevenir race conditions.';



CREATE OR REPLACE FUNCTION "public"."generate_inventory_count_number"("p_org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_count_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(count_number FROM 'INV-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM inventory_counts
  WHERE org_id = p_org_id
    AND count_number LIKE 'INV-' || v_year || '-%';
  
  v_count_number := 'INV-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_count_number;
END;
$$;


ALTER FUNCTION "public"."generate_inventory_count_number"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_year TEXT;
    sequence_num INTEGER;
    new_order_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Buscar o próximo número sequencial para o ano atual
    SELECT COALESCE(
        MAX(SUBSTRING(o.order_number FROM 'RF-' || current_year || '-([0-9]+)')::INTEGER), 
        0
    ) + 1
    INTO sequence_num
    FROM public.orders o
    WHERE o.order_number LIKE 'RF-' || current_year || '-%';
    
    -- Formatar como RF-YYYY-NNNN
    new_order_number := 'RF-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_order_number;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_po_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  new_po_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(
    MAX(SUBSTRING(po.po_number FROM 'PO-' || current_year || '-([0-9]+)')::INTEGER), 
    0
  ) + 1
  INTO sequence_num
  FROM purchase_orders po
  WHERE po.po_number LIKE 'PO-' || current_year || '-%';
  
  new_po_number := 'PO-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_po_number;
END;
$$;


ALTER FUNCTION "public"."generate_po_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_receipt_number"("p_org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_receipt_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 'REC-' || v_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence
  FROM purchase_receipts
  WHERE org_id = p_org_id
    AND receipt_number LIKE 'REC-' || v_year || '-%';
  
  v_receipt_number := 'REC-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_receipt_number;
END;
$$;


ALTER FUNCTION "public"."generate_receipt_number"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_requisition_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
  new_req_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  SELECT COALESCE(
    MAX(SUBSTRING(pr.requisition_number FROM 'REQ-' || current_year || '-([0-9]+)')::INTEGER), 
    0
  ) + 1
  INTO sequence_num
  FROM purchase_requisitions pr
  WHERE pr.requisition_number LIKE 'REQ-' || current_year || '-%';
  
  new_req_number := 'REQ-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN new_req_number;
END;
$$;


ALTER FUNCTION "public"."generate_requisition_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_technical_report_number"("org_id" "uuid", "report_type" character varying) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    year_part TEXT;
    type_prefix TEXT;
    sequence_num INTEGER;
    report_number TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Definir prefixo baseado no tipo de relatório
    type_prefix := CASE report_type
        WHEN 'metrologia' THEN 'MET'
        WHEN 'quality_control' THEN 'QC'
        WHEN 'final_inspection' THEN 'FI'
        WHEN 'bosch_test' THEN 'BSH'
        ELSE 'REP'
    END;
    
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(report_number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM technical_reports tr
    JOIN orders o ON o.id = tr.order_id
    WHERE o.org_id = generate_technical_report_number.org_id
    AND tr.report_type = generate_technical_report_number.report_type
    AND report_number LIKE type_prefix || '-' || year_part || '-%';
    
    report_number := type_prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN report_number;
END;
$$;


ALTER FUNCTION "public"."generate_technical_report_number"("org_id" "uuid", "report_type" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_warranty_claim_number"("org_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    new_claim_number TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(wc.claim_number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM warranty_claims wc
    WHERE wc.org_id = generate_warranty_claim_number.org_id
    AND wc.claim_number LIKE 'GAR-' || year_part || '-%';
    
    new_claim_number := 'GAR-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN new_claim_number;
END;
$$;


ALTER FUNCTION "public"."generate_warranty_claim_number"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_super_admins"() RETURNS TABLE("user_id" "uuid", "email" "text", "name" "text", "created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
  SELECT 
    au.id as user_id,
    au.email,
    COALESCE(ubi.name, 'Nome não disponível') as name,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  LEFT JOIN public.user_basic_info ubi ON ubi.user_id = au.id
  WHERE au.is_super_admin = true
  AND au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
$$;


ALTER FUNCTION "public"."get_all_super_admins"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_super_admins"() IS 'Lista todos os super administradores do sistema.';



CREATE OR REPLACE FUNCTION "public"."get_enum_values"("enum_name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    enum_values text[];
BEGIN
    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = enum_name;
    
    RETURN enum_values;
END;
$$;


ALTER FUNCTION "public"."get_enum_values"("enum_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_users_info"("org_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "name" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT 
    ou.user_id,
    COALESCE(ubi.email, 'email@example.com') as email,
    COALESCE(ubi.name, 'Nome não disponível') as name,
    ou.created_at
  FROM organization_users ou
  LEFT JOIN user_basic_info ubi ON ubi.user_id = ou.user_id
  WHERE ou.organization_id = org_id
  AND ou.is_active = true
  ORDER BY ou.created_at DESC;
$$;


ALTER FUNCTION "public"."get_organization_users_info"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workflows_pending_checklists"("p_org_id" "uuid") RETURNS TABLE("id" "uuid", "order_id" "uuid", "order_number" "text", "component" "text", "status" "text", "started_at" timestamp with time zone, "created_at" timestamp with time zone, "missing_checklist" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ow.id,
    ow.order_id,
    o.order_number,
    ow.component::TEXT,
    ow.status::TEXT,
    ow.started_at,
    ow.created_at,
    wc.checklist_name as missing_checklist
  FROM order_workflow ow
  INNER JOIN orders o ON o.id = ow.order_id
  INNER JOIN workflow_checklists wc ON wc.step_key = ow.status::TEXT
    AND wc.component = ow.component
    AND wc.is_mandatory = true
    AND wc.is_active = true
    AND wc.blocks_workflow_advance = true
  LEFT JOIN workflow_checklist_responses wcr ON wcr.order_workflow_id = ow.id
    AND wcr.checklist_id = wc.id
    AND wcr.overall_status = 'approved'
  WHERE o.org_id = p_org_id
    AND ow.started_at IS NOT NULL
    AND ow.completed_at IS NULL
    AND wcr.id IS NULL -- Checklist não foi preenchido ou aprovado
  ORDER BY ow.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_workflows_pending_checklists"("p_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_workflows_pending_checklists"("p_org_id" "uuid") IS 'Retorna workflows com checklists obrigatórios pendentes para uma organização';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  -- Criar entrada em user_basic_info
  INSERT INTO public.user_basic_info (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      'Nome não disponível'
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, user_basic_info.name),
    updated_at = now();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_org_role"("org_id" "uuid", "required_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_users 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND role = required_role 
    AND is_active = true
  );
$$;


ALTER FUNCTION "public"."has_org_role"("org_id" "uuid", "required_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."identify_bosch_components"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    bosch_engine_type_id UUID;
    bosch_workflow_steps RECORD;
    component_record RECORD;
BEGIN
    -- Verificar se é um motor Bosch baseado no tipo, marca ou número de série
    IF (
        LOWER(NEW.brand) LIKE '%bosch%' OR 
        LOWER(NEW.type) LIKE '%bosch%' OR 
        LOWER(NEW.serial_number) LIKE '%bosch%' OR
        NEW.reception_form_data->>'brand' ILIKE '%bosch%' OR
        NEW.reception_form_data->>'manufacturer' ILIKE '%bosch%'
    ) THEN
        
        -- Buscar tipo de motor Bosch configurado
        SELECT id INTO bosch_engine_type_id
        FROM engine_types 
        WHERE LOWER(name) LIKE '%bosch%' 
        AND org_id = NEW.engine_type_id -- Assumindo que org_id está relacionado
        AND is_active = true
        LIMIT 1;
        
        -- Se não encontrou tipo Bosch específico, criar um
        IF bosch_engine_type_id IS NULL THEN
            INSERT INTO engine_types (
                org_id,
                name,
                category,
                description,
                technical_standards,
                required_components,
                special_requirements,
                default_warranty_months,
                is_active
            ) VALUES (
                (SELECT org_id FROM engine_types WHERE id = NEW.engine_type_id),
                'Motor Bosch',
                'Bosch',
                'Motor com componentes Bosch - Workflow especializado de 14 etapas',
                '["Bosch RAM", "ISO 9001"]'::jsonb,
                ARRAY['bloco', 'eixo', 'biela', 'comando', 'cabecote']::engine_component[],
                '{
                    "clean_room_required": true,
                    "bosch_equipment_required": true,
                    "certified_technician_required": true,
                    "original_parts_only": true,
                    "special_testing_required": true
                }'::jsonb,
                6,
                true
            ) RETURNING id INTO bosch_engine_type_id;
            
            -- Criar workflow steps específicos Bosch (14 etapas)
            INSERT INTO workflow_steps (
                engine_type_id,
                component,
                step_name,
                step_key,
                description,
                is_required,
                estimated_hours,
                step_order,
                prerequisites,
                special_equipment,
                quality_checklist_required,
                technical_report_required
            ) VALUES 
            -- Etapas para cada componente Bosch
            (bosch_engine_type_id, 'bloco', 'Recepção Bosch', 'bosch_reception', 'Recepção e catalogação inicial com verificação de autenticidade Bosch', true, 0.5, 1, '[]'::jsonb, '["Sala Limpa Bosch"]'::jsonb, true, false),
            (bosch_engine_type_id, 'bloco', 'Desmontagem Controlada', 'bosch_disassembly', 'Desmontagem em ambiente controlado seguindo padrões Bosch', true, 2.0, 2, '["bosch_reception"]'::jsonb, '["Sala Limpa Bosch", "Ferramentas Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Limpeza Especializada', 'bosch_cleaning', 'Limpeza com produtos e métodos aprovados Bosch', true, 1.5, 3, '["bosch_disassembly"]'::jsonb, '["Sala Limpa Bosch", "Produtos Bosch"]'::jsonb, true, false),
            (bosch_engine_type_id, 'bloco', 'Inspeção Dimensional', 'bosch_inspection', 'Inspeção dimensional com tolerâncias Bosch RAM', true, 3.0, 4, '["bosch_cleaning"]'::jsonb, '["Equipamentos Bosch", "Sala Limpa Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Teste de Pressão', 'bosch_pressure_test', 'Teste de pressão conforme especificações Bosch', true, 1.0, 5, '["bosch_inspection"]'::jsonb, '["Bancada Teste Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Usinagem Bosch', 'bosch_machining', 'Usinagem com ferramentas e parâmetros Bosch', true, 4.0, 6, '["bosch_pressure_test"]'::jsonb, '["Centro Usinagem Bosch", "Ferramentas Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Controle Qualidade', 'bosch_quality_control', 'Controle de qualidade intermediário Bosch', true, 1.5, 7, '["bosch_machining"]'::jsonb, '["Equipamentos Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Montagem Preliminar', 'bosch_pre_assembly', 'Montagem preliminar com componentes Bosch', true, 2.0, 8, '["bosch_quality_control"]'::jsonb, '["Sala Limpa Bosch"]'::jsonb, true, false),
            (bosch_engine_type_id, 'bloco', 'Teste Funcional', 'bosch_functional_test', 'Teste funcional em bancada Bosch homologada', true, 2.5, 9, '["bosch_pre_assembly"]'::jsonb, '["Bancada Teste Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Calibração Bosch', 'bosch_calibration', 'Calibração conforme parâmetros Bosch RAM', true, 1.5, 10, '["bosch_functional_test"]'::jsonb, '["Equipamentos Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Montagem Final', 'bosch_final_assembly', 'Montagem final com torques Bosch', true, 3.0, 11, '["bosch_calibration"]'::jsonb, '["Sala Limpa Bosch", "Torquímetros Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Teste Final', 'bosch_final_test', 'Teste final completo Bosch RAM', true, 2.0, 12, '["bosch_final_assembly"]'::jsonb, '["Bancada Teste Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Certificação', 'bosch_certification', 'Certificação Bosch e geração de relatório', true, 1.0, 13, '["bosch_final_test"]'::jsonb, '["Sistema Bosch"]'::jsonb, true, true),
            (bosch_engine_type_id, 'bloco', 'Embalagem Bosch', 'bosch_packaging', 'Embalagem com padrões Bosch para entrega', true, 0.5, 14, '["bosch_certification"]'::jsonb, '["Sala Limpa Bosch"]'::jsonb, true, false);
            
            -- Repetir para outros componentes (eixo, biela, comando, cabeçote)
            -- Por brevidade, incluindo apenas algumas etapas dos outros componentes
            INSERT INTO workflow_steps (
                engine_type_id, component, step_name, step_key, description, is_required, 
                estimated_hours, step_order, prerequisites, special_equipment, 
                quality_checklist_required, technical_report_required
            ) 
            SELECT 
                bosch_engine_type_id, 
                comp::engine_component, 
                step_name, 
                REPLACE(step_key, 'bloco', comp) as step_key,
                REPLACE(description, 'bloco', comp) as description,
                is_required, estimated_hours, step_order, prerequisites, special_equipment,
                quality_checklist_required, technical_report_required
            FROM (VALUES 
                ('eixo'), ('biela'), ('comando'), ('cabecote')
            ) AS components(comp)
            CROSS JOIN (
                SELECT step_name, step_key, description, is_required, estimated_hours, 
                       step_order, prerequisites, special_equipment, quality_checklist_required, 
                       technical_report_required
                FROM workflow_steps 
                WHERE engine_type_id = bosch_engine_type_id 
                AND component = 'bloco'
            ) AS base_steps;
        END IF;
        
        -- Atualizar o motor para usar o tipo Bosch
        NEW.engine_type_id := bosch_engine_type_id;
        
        -- Adicionar informações Bosch aos dados de recepção
        NEW.reception_form_data := COALESCE(NEW.reception_form_data, '{}'::jsonb) || 
            jsonb_build_object(
                'is_bosch_component', true,
                'requires_bosch_workflow', true,
                'clean_room_required', true,
                'bosch_certification_required', true,
                'identified_at', NOW()
            );
            
        -- Criar reserva de ambiente limpo se necessário
        INSERT INTO environment_reservations (
            environment_id,
            order_id,
            component,
            workflow_step_key,
            reserved_from,
            reserved_until,
            reservation_status,
            reserved_by,
            notes,
            org_id
        )
        SELECT 
            se.id,
            (SELECT id FROM orders WHERE engine_id = NEW.id LIMIT 1),
            'bloco'::engine_component,
            'bosch_reception',
            NOW(),
            NOW() + INTERVAL '1 day',
            'reserved',
            NULL, -- Será definido quando o usuário fizer login
            'Reserva automática para componente Bosch identificado',
            se.org_id
        FROM special_environments se
        WHERE se.environment_type = 'clean_room'
        AND LOWER(se.environment_name) LIKE '%bosch%'
        AND se.is_active = true
        AND se.org_id = (SELECT org_id FROM engine_types WHERE id = bosch_engine_type_id)
        LIMIT 1;
        
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."identify_bosch_components"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_org_scores"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Inicializar scores para todos os usuários da organização
  FOR user_record IN
    SELECT DISTINCT user_id FROM organization_users WHERE organization_id = p_org_id
  LOOP
    -- Inserir score inicial se não existir
    INSERT INTO user_scores (org_id, user_id, total_points, current_level, level_progress)
    VALUES (p_org_id, user_record.user_id, 0, 1, 0)
    ON CONFLICT (org_id, user_id) DO NOTHING;
    
    -- Dar pontos iniciais para login diário (apenas se não tiver pontos ainda)
    IF NOT EXISTS (
      SELECT 1 FROM user_score_history 
      WHERE org_id = p_org_id AND user_id = user_record.user_id
    ) THEN
      PERFORM add_user_points(p_org_id, user_record.user_id, 'daily_login', '{"initial_setup": true}');
    END IF;
  END LOOP;
  
  -- Atualizar rankings para todos os períodos
  PERFORM update_performance_ranking(p_org_id, 'daily');
  PERFORM update_performance_ranking(p_org_id, 'weekly');
  PERFORM update_performance_ranking(p_org_id, 'monthly');
END;
$$;


ALTER FUNCTION "public"."initialize_org_scores"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_default_achievements"("p_org_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Conquistas de Produtividade
  INSERT INTO achievement_configs (org_id, achievement_key, title, description, icon, points, criteria) VALUES
  (p_org_id, 'first_order', 'Primeira Ordem', 'Criou sua primeira ordem de serviço', '🎯', 25, '{"type": "total_orders", "value": 1}'),
  (p_org_id, 'order_master', 'Mestre das Ordens', 'Criou 10 ordens de serviço', '🏆', 100, '{"type": "total_orders", "value": 10}'),
  (p_org_id, 'order_legend', 'Lenda das Ordens', 'Criou 50 ordens de serviço', '👑', 500, '{"type": "total_orders", "value": 50}'),
  
  -- Conquistas de Conclusão
  (p_org_id, 'first_completion', 'Primeira Conclusão', 'Concluiu sua primeira ordem', '✅', 50, '{"type": "completed_orders", "value": 1}'),
  (p_org_id, 'completion_expert', 'Especialista em Conclusão', 'Concluiu 25 ordens', '🎖️', 250, '{"type": "completed_orders", "value": 25}'),
  (p_org_id, 'completion_master', 'Mestre da Conclusão', 'Concluiu 100 ordens', '🏅', 1000, '{"type": "completed_orders", "value": 100}'),
  
  -- Conquistas de Orçamentos
  (p_org_id, 'first_approval', 'Primeira Aprovação', 'Teve seu primeiro orçamento aprovado', '💰', 75, '{"type": "approved_budgets", "value": 1}'),
  (p_org_id, 'sales_expert', 'Especialista em Vendas', 'Teve 20 orçamentos aprovados', '💎', 400, '{"type": "approved_budgets", "value": 20}'),
  (p_org_id, 'sales_master', 'Mestre das Vendas', 'Teve 100 orçamentos aprovados', '💍', 2000, '{"type": "approved_budgets", "value": 100}'),
  
  -- Conquistas de Pontuação
  (p_org_id, 'point_collector', 'Coletor de Pontos', 'Atingiu 100 pontos totais', '⭐', 50, '{"type": "total_points", "value": 100}'),
  (p_org_id, 'point_master', 'Mestre dos Pontos', 'Atingiu 1000 pontos totais', '🌟', 200, '{"type": "total_points", "value": 1000}'),
  (p_org_id, 'point_legend', 'Lenda dos Pontos', 'Atingiu 5000 pontos totais', '✨', 500, '{"type": "total_points", "value": 5000}'),
  
  -- Conquistas de Nível
  (p_org_id, 'level_5', 'Nível 5', 'Atingiu o nível 5', '🎖️', 100, '{"type": "level_reached", "value": 5}'),
  (p_org_id, 'level_10', 'Nível 10', 'Atingiu o nível 10', '🏆', 250, '{"type": "level_reached", "value": 10}'),
  (p_org_id, 'level_20', 'Nível 20', 'Atingiu o nível 20', '👑', 500, '{"type": "level_reached", "value": 20}'),
  
  -- Conquistas de Frequência
  (p_org_id, 'daily_warrior', 'Guerreiro Diário', 'Usou o sistema por 7 dias consecutivos', '🗡️', 100, '{"type": "consecutive_days", "value": 7}'),
  (p_org_id, 'monthly_hero', 'Herói Mensal', 'Usou o sistema por 30 dias consecutivos', '🦸', 500, '{"type": "consecutive_days", "value": 30}');
  
END;
$$;


ALTER FUNCTION "public"."insert_default_achievements"("p_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'super_admin')
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_users 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND is_active = true
  );
$$;


ALTER FUNCTION "public"."is_org_member"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(au.is_super_admin, false)
  FROM auth.users au
  WHERE au.id = auth.uid();
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_super_admin"() IS 'Verifica se o usuário atual é super admin usando auth.users.is_super_admin';



CREATE OR REPLACE FUNCTION "public"."is_user_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(au.is_super_admin, false)
  FROM auth.users au
  WHERE au.id = user_id;
$$;


ALTER FUNCTION "public"."is_user_super_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_user_super_admin"("user_id" "uuid") IS 'Verifica se um usuário específico é super admin usando auth.users.is_super_admin';



CREATE OR REPLACE FUNCTION "public"."log_order_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id, old_status, new_status, changed_by, org_id
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), NEW.org_id
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_order_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_quality_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    event_type VARCHAR(50);
    event_desc TEXT;
    severity VARCHAR(20) := 'info';
BEGIN
    -- Determinar tipo de evento baseado na mudança
    IF TG_OP = 'INSERT' THEN
        event_type := 'checklist_started';
        event_desc := 'Checklist iniciado: ' || (SELECT checklist_name FROM workflow_checklists WHERE id = NEW.checklist_id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.overall_status != NEW.overall_status THEN
            event_type := 'status_changed';
            event_desc := 'Status alterado de ' || OLD.overall_status || ' para ' || NEW.overall_status;
            
            IF NEW.overall_status = 'completed' THEN
                event_type := 'checklist_completed';
                event_desc := 'Checklist completado com ' || NEW.completion_percentage || '% de completude';
            ELSIF NEW.overall_status = 'approved' THEN
                event_type := 'checklist_approved';
                event_desc := 'Checklist aprovado por supervisor';
            END IF;
        END IF;
        
        -- Verificar se foram adicionadas não conformidades
        IF jsonb_array_length(NEW.non_conformities) > jsonb_array_length(COALESCE(OLD.non_conformities, '[]'::jsonb)) THEN
            event_type := 'non_conformity';
            event_desc := 'Nova não conformidade registrada';
            severity := 'warning';
        END IF;
    END IF;
    
    -- Registrar evento se houver mudança significativa
    IF event_type IS NOT NULL THEN
        INSERT INTO quality_history (
            order_id,
            component,
            step_key,
            quality_event_type,
            event_description,
            severity_level,
            related_checklist_id,
            related_response_id,
            recorded_by,
            org_id
        )
        VALUES (
            NEW.order_id,
            NEW.component,
            NEW.step_key,
            event_type,
            event_desc,
            severity,
            NEW.checklist_id,
            NEW.id,
            COALESCE(NEW.filled_by, NEW.reviewed_by),
            (SELECT org_id FROM orders WHERE id = NEW.order_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_quality_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid", "p_org_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true,
      updated_at = NOW()
  WHERE org_id = p_org_id
    AND (user_id = p_user_id OR user_id IS NULL)
    AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid", "p_org_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid", "p_org_id" "uuid") IS 'Marca todas as notificações do usuário como lidas';



CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE notifications
  SET is_read = true,
      updated_at = NOW()
  WHERE id = p_notification_id
    AND (user_id = p_user_id OR user_id IS NULL);
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") IS 'Marca notificação como lida';



CREATE OR REPLACE FUNCTION "public"."notify_budget_approved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
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
$_$;


ALTER FUNCTION "public"."notify_budget_approved"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_budget_approved"() IS 'Cria notificação quando orçamento é aprovado. FIX: Corrigido referência ambígua de org_id.';



CREATE OR REPLACE FUNCTION "public"."notify_budget_pending"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_notification_type_id UUID;
  v_budget RECORD;
BEGIN
  -- Buscar tipo de notificação
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE code = 'budget_alert'
  LIMIT 1;

  -- Buscar dados do orçamento
  SELECT db.*, o.order_number
  INTO v_budget
  FROM detailed_budgets db
  INNER JOIN orders o ON o.id = db.order_id
  WHERE db.id = NEW.budget_id;

  IF v_notification_type_id IS NOT NULL AND v_budget.id IS NOT NULL THEN
    PERFORM create_notification(
      (SELECT org_id FROM orders WHERE id = v_budget.order_id),
      NULL, -- Global para atendentes/gestores
      v_notification_type_id,
      '💰 Orçamento Pendente: OS #' || v_budget.order_number,
      NEW.alert_message,
      'warning',
      '/orcamentos/' || NEW.budget_id,
      jsonb_build_object(
        'budget_id', NEW.budget_id,
        'order_id', v_budget.order_id,
        'alert_type', NEW.alert_type
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_budget_pending"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_budget_pending"() IS 'Notifica sobre orçamentos pendentes';



CREATE OR REPLACE FUNCTION "public"."notify_purchase_need"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_notification_type_id UUID;
BEGIN
  -- Buscar tipo de notificação
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE code = 'purchase_alert'
  LIMIT 1;

  IF v_notification_type_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.org_id,
      NULL, -- Global para compradores
      v_notification_type_id,
      '🛒 Nova Necessidade de Compra: ' || NEW.part_name,
      'Necessário comprar ' || NEW.shortage_quantity || ' unidades de ' || NEW.part_name || 
      ' (Tipo: ' || CASE NEW.need_type WHEN 'emergency' THEN 'Emergencial' ELSE 'Planejada' END || ')',
      CASE 
        WHEN NEW.priority_level = 'critical' THEN 'error'
        WHEN NEW.priority_level = 'high' THEN 'warning'
        ELSE 'info'
      END,
      '/compras',
      jsonb_build_object(
        'purchase_need_id', NEW.id,
        'part_code', NEW.part_code,
        'required_quantity', NEW.required_quantity,
        'shortage_quantity', NEW.shortage_quantity,
        'priority_level', NEW.priority_level
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_purchase_need"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_purchase_need"() IS 'Notifica sobre necessidades de compra';



CREATE OR REPLACE FUNCTION "public"."notify_stock_minimum"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_notification_type_id UUID;
BEGIN
  -- Buscar tipo de notificação de estoque
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE code = 'stock_alert'
  LIMIT 1;

  -- Criar notificação global para gestores/admin
  IF v_notification_type_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.org_id,
      NULL, -- Notificação global
      v_notification_type_id,
      '⚠️ Estoque Baixo: ' || NEW.part_name,
      'O estoque de ' || NEW.part_name || ' está baixo. Atual: ' || NEW.current_stock || ' | Mínimo: ' || NEW.minimum_stock,
      CASE 
        WHEN NEW.alert_level = 'critical' THEN 'error'
        WHEN NEW.alert_level = 'warning' THEN 'warning'
        ELSE 'info'
      END,
      '/estoque',
      jsonb_build_object(
        'alert_id', NEW.id,
        'part_code', NEW.part_code,
        'current_stock', NEW.current_stock,
        'minimum_stock', NEW.minimum_stock
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_stock_minimum"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_stock_minimum"() IS 'Notifica quando estoque atinge mínimo';



CREATE OR REPLACE FUNCTION "public"."notify_technical_report"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_notification_type_id UUID;
  v_order RECORD;
BEGIN
  -- Buscar ordem
  SELECT o.*, o.order_number
  INTO v_order
  FROM orders o
  WHERE o.id = NEW.order_id;

  -- Buscar tipo de notificação
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE code = 'report_generated'
  LIMIT 1;

  IF v_notification_type_id IS NOT NULL AND NEW.generated_automatically = true THEN
    PERFORM create_notification(
      v_order.org_id,
      NULL,
      v_notification_type_id,
      '📄 Relatório Técnico Gerado: OS #' || v_order.order_number,
      'Relatório automático gerado para ' || NEW.component || ' - ' || NEW.report_type,
      'info',
      '/ordens/' || NEW.order_id || '/relatorios',
      jsonb_build_object(
        'report_id', NEW.id,
        'component', NEW.component,
        'report_type', NEW.report_type,
        'conformity_status', NEW.conformity_status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_technical_report"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_technical_report"() IS 'Notifica quando relatório técnico é gerado';



CREATE OR REPLACE FUNCTION "public"."notify_workflow_blocked_by_checklist"("p_workflow_id" "uuid", "p_checklist_name" "text", "p_order_number" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_notification_type_id UUID;
  v_workflow RECORD;
BEGIN
  -- Buscar workflow
  SELECT ow.*, o.org_id
  INTO v_workflow
  FROM order_workflow ow
  INNER JOIN orders o ON o.id = ow.order_id
  WHERE ow.id = p_workflow_id;

  -- Buscar tipo de notificação
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE code = 'workflow_alert'
  LIMIT 1;

  IF v_notification_type_id IS NOT NULL THEN
    PERFORM create_notification(
      v_workflow.org_id,
      NULL, -- Global para técnicos
      v_notification_type_id,
      '🔒 Workflow Bloqueado: OS #' || p_order_number,
      'O workflow de ' || v_workflow.component || ' está bloqueado. Checklist obrigatório pendente: ' || p_checklist_name,
      'warning',
      '/workflows',
      jsonb_build_object(
        'workflow_id', p_workflow_id,
        'component', v_workflow.component,
        'status', v_workflow.status,
        'checklist_name', p_checklist_name
      )
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."notify_workflow_blocked_by_checklist"("p_workflow_id" "uuid", "p_checklist_name" "text", "p_order_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_inventory_count_adjustments"("p_count_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_org_id UUID;
  v_count_number TEXT;
  v_counted_by UUID;
  v_item RECORD;
  v_count_status TEXT;
  v_adjustment_count INTEGER := 0;
BEGIN
  -- Buscar informações da contagem
  SELECT org_id, count_number, counted_by, status
  INTO v_org_id, v_count_number, v_counted_by, v_count_status
  FROM inventory_counts
  WHERE id = p_count_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contagem não encontrada';
  END IF;
  
  IF v_count_status = 'completed' THEN
    RAISE EXCEPTION 'Contagem já foi processada anteriormente';
  END IF;
  
  IF v_count_status != 'in_progress' THEN
    RAISE EXCEPTION 'Apenas contagens em andamento podem ser processadas';
  END IF;
  
  -- Para cada item com diferença
  FOR v_item IN 
    SELECT 
      ici.*,
      pi.part_code,
      pi.part_name
    FROM inventory_count_items ici
    INNER JOIN parts_inventory pi ON pi.id = ici.part_id
    WHERE ici.count_id = p_count_id
      AND ici.counted_quantity IS NOT NULL
      AND ici.difference != 0
  LOOP
    INSERT INTO inventory_movements (
      org_id,
      part_id,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      unit_cost,
      reason,
      notes,
      created_by,
      metadata
    ) VALUES (
      v_org_id,
      v_item.part_id,
      'ajuste',
      ABS(v_item.difference),
      v_item.expected_quantity,
      v_item.counted_quantity,
      v_item.unit_cost,
      'Ajuste de inventário #' || v_count_number,
      CASE 
        WHEN v_item.notes IS NOT NULL THEN 
          'Contagem física - ' || v_item.notes
        ELSE 
          'Contagem física - Divergência: ' || v_item.difference
      END,
      COALESCE(v_item.counted_by, v_counted_by),
      jsonb_build_object(
        'count_id', p_count_id,
        'count_number', v_count_number,
        'adjustment_type', CASE 
          WHEN v_item.difference > 0 THEN 'increase' 
          ELSE 'decrease' 
        END,
        'expected_quantity', v_item.expected_quantity,
        'counted_quantity', v_item.counted_quantity,
        'difference', v_item.difference
      )
    );
    
    v_adjustment_count := v_adjustment_count + 1;
  END LOOP;
  
  -- Atualizar status da contagem para concluída
  UPDATE inventory_counts
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_count_id;
  
  RAISE NOTICE 'Processamento concluído: % ajustes criados', v_adjustment_count;
END;
$$;


ALTER FUNCTION "public"."process_inventory_count_adjustments"("p_count_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_user_action"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  score_result JSONB;
  achievements_result JSONB;
  final_result JSONB;
BEGIN
  -- Adicionar pontos
  score_result := add_user_points(p_org_id, p_user_id, p_action_type, p_metadata);
  
  -- Verificar conquistas
  achievements_result := check_achievements(p_org_id, p_user_id, p_action_type, p_metadata);
  
  -- Atualizar ranking (apenas para ações importantes)
  IF p_action_type IN ('order_completed', 'budget_approved', 'goal_achieved') THEN
    PERFORM update_performance_ranking(p_org_id, 'weekly');
  END IF;
  
  -- Preparar resultado final
  final_result := jsonb_build_object(
    'score', score_result,
    'achievements', achievements_result,
    'action_type', p_action_type,
    'processed_at', NOW()
  );
  
  RETURN final_result;
END;
$$;


ALTER FUNCTION "public"."process_user_action"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_user_to_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Apenas super administradores podem promover outros usuários';
  END IF;

  -- Verificar se o usuário alvo existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Promover o usuário
  UPDATE auth.users 
  SET is_super_admin = true, 
      updated_at = now()
  WHERE id = user_id;

  -- Log da ação (se tabela audit_log existir)
  BEGIN
    INSERT INTO public.audit_log (
      org_id, 
      table_name, 
      record_id, 
      operation, 
      old_values, 
      new_values, 
      user_id
    ) VALUES (
      NULL, -- Super admin actions são globais
      'auth.users',
      user_id,
      'PROMOTE_SUPER_ADMIN',
      jsonb_build_object('is_super_admin', false),
      jsonb_build_object('is_super_admin', true),
      auth.uid()
    );
  EXCEPTION 
    WHEN undefined_table THEN
      NULL; -- Ignorar se tabela audit_log não existir
  END;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."promote_user_to_super_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."promote_user_to_super_admin"("user_id" "uuid") IS 'Promove um usuário a super administrador. Apenas super admins podem executar.';



CREATE OR REPLACE FUNCTION "public"."revoke_user_super_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Apenas super administradores podem revogar permissões';
  END IF;

  -- Não permitir revogar próprias permissões
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode revogar suas próprias permissões de super admin';
  END IF;

  -- Verificar se o usuário alvo existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Revogar permissões
  UPDATE auth.users 
  SET is_super_admin = false, 
      updated_at = now()
  WHERE id = user_id;

  -- Log da ação (se tabela audit_log existir)
  BEGIN
    INSERT INTO public.audit_log (
      org_id, 
      table_name, 
      record_id, 
      operation, 
      old_values, 
      new_values, 
      user_id
    ) VALUES (
      NULL, -- Super admin actions são globais
      'auth.users',
      user_id,
      'REVOKE_SUPER_ADMIN',
      jsonb_build_object('is_super_admin', true),
      jsonb_build_object('is_super_admin', false),
      auth.uid()
    );
  EXCEPTION 
    WHEN undefined_table THEN
      NULL; -- Ignorar se tabela audit_log não existir
  END;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."revoke_user_super_admin"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."revoke_user_super_admin"("user_id" "uuid") IS 'Revoga permissões de super admin de um usuário. Apenas super admins podem executar.';



CREATE OR REPLACE FUNCTION "public"."set_budget_approvals_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.budget_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id FROM detailed_budgets WHERE id = NEW.budget_id;
  END IF;
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."set_budget_approvals_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_customer_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_customer_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_detailed_budgets_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.order_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id FROM orders WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."set_detailed_budgets_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_diagnostic_response_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.order_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id FROM orders WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."set_diagnostic_response_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_parts_inventory_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Se org_id não foi fornecido, tentar buscar do order
  IF NEW.org_id IS NULL AND NEW.order_id IS NOT NULL THEN
    SELECT o.org_id INTO NEW.org_id
    FROM orders o
    WHERE o.id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_parts_inventory_org_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_po_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
    NEW.po_number := generate_po_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_po_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_requisition_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.requisition_number IS NULL OR NEW.requisition_number = '' THEN
    NEW.requisition_number := generate_requisition_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_requisition_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_workflow_status_history_org_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Se org_id não foi fornecido, buscar do order_workflow → order
  IF NEW.org_id IS NULL AND NEW.order_workflow_id IS NOT NULL THEN
    SELECT o.org_id INTO NEW.org_id
    FROM order_workflow ow
    INNER JOIN orders o ON o.id = ow.order_id
    WHERE ow.id = NEW.order_workflow_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_workflow_status_history_org_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_workflow_status_history_org_id"() IS 'Auto-populates org_id from order_workflow to prevent RLS violations';



CREATE OR REPLACE FUNCTION "public"."update_goal_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  progress_percentage NUMERIC;
  days_remaining INTEGER;
BEGIN
  -- Calcular porcentagem de progresso
  IF NEW.target_value > 0 THEN
    progress_percentage := (NEW.progress_current / NEW.target_value) * 100;
  ELSE
    progress_percentage := 0;
  END IF;
  
  -- Calcular dias restantes
  IF NEW.target_period_end IS NOT NULL THEN
    days_remaining := EXTRACT(DAY FROM (NEW.target_period_end - NOW()));
    
    -- Atualizar status baseado no progresso e prazo
    IF progress_percentage >= 100 THEN
      NEW.status := 'completed';
    ELSIF days_remaining < 0 THEN
      NEW.status := 'delayed';
    ELSIF progress_percentage >= 80 THEN
      NEW.status := 'on_track';
    ELSIF days_remaining <= 7 AND progress_percentage < 80 THEN
      NEW.status := 'at_risk';
    ELSIF progress_percentage >= 50 THEN
      NEW.status := 'on_track';
    ELSE
      NEW.status := 'at_risk';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_goal_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_on_movement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_part_name TEXT;
  v_low_stock_threshold INTEGER := 5;
  v_min_stock INTEGER;
BEGIN
  -- Buscar nome da peça e threshold configurado
  SELECT 
    pi.part_name,
    COALESCE(psc.minimum_stock, v_low_stock_threshold)
  INTO v_part_name, v_min_stock
  FROM parts_inventory pi
  LEFT JOIN parts_stock_config psc ON pi.part_code = psc.part_code AND pi.org_id = psc.org_id
  WHERE pi.id = NEW.part_id;

  -- Atualizar quantidade na tabela parts_inventory
  UPDATE parts_inventory
  SET quantity = NEW.new_quantity
  WHERE id = NEW.part_id;
  
  -- Criar alerta se estoque ficar baixo
  IF NEW.new_quantity <= v_min_stock AND NEW.new_quantity >= 0 THEN
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
    SELECT 
      NEW.org_id,
      pi.part_code,
      pi.part_name,
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
    FROM parts_inventory pi
    WHERE pi.id = NEW.part_id
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
      AND part_code = (SELECT part_code FROM parts_inventory WHERE id = NEW.part_id)
      AND alert_type = 'low_stock';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_inventory_on_movement"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_inventory_on_movement"() IS 'Trigger que atualiza automaticamente o estoque em parts_inventory e cria alertas se necessário';



CREATE OR REPLACE FUNCTION "public"."update_jurisdiction_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_jurisdiction_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organization_themes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_organization_themes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_performance_ranking"("p_org_id" "uuid", "p_period_type" "text" DEFAULT 'weekly'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  period_start_date DATE;
  period_end_date DATE;
  ranking_record RECORD;
  current_rank INTEGER := 1;
BEGIN
  -- Calcular período
  CASE p_period_type
    WHEN 'daily' THEN
      period_start_date := CURRENT_DATE;
      period_end_date := CURRENT_DATE;
    WHEN 'weekly' THEN
      period_start_date := DATE_TRUNC('week', CURRENT_DATE)::DATE;
      period_end_date := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
    WHEN 'monthly' THEN
      period_start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
      period_end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
  END CASE;
  
  -- Deletar ranking existente para o período
  DELETE FROM performance_rankings
  WHERE org_id = p_org_id 
    AND period_type = p_period_type 
    AND period_start = period_start_date;
  
  -- Inserir novo ranking ordenado por pontos
  FOR ranking_record IN
    SELECT 
      us.user_id,
      us.total_points,
      jsonb_build_object(
        'total_points', us.total_points,
        'current_level', us.current_level,
        'level_progress', us.level_progress
      ) as metrics
    FROM user_scores us
    WHERE us.org_id = p_org_id
    ORDER BY us.total_points DESC
  LOOP
    INSERT INTO performance_rankings (
      org_id, user_id, period_type, period_start, period_end,
      total_points, rank_position, metrics
    ) VALUES (
      p_org_id, ranking_record.user_id, p_period_type, 
      period_start_date, period_end_date, ranking_record.total_points,
      current_rank, ranking_record.metrics
    );
    
    current_rank := current_rank + 1;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_performance_ranking"("p_org_id" "uuid", "p_period_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_order_on_receipt"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_po_id UUID;
  v_total_ordered INTEGER;
  v_total_received INTEGER;
BEGIN
  SELECT purchase_order_id INTO v_po_id
  FROM purchase_receipts
  WHERE id = NEW.receipt_id;
  
  SELECT 
    SUM(poi.quantity),
    SUM(COALESCE(pri.received_quantity, 0))
  INTO v_total_ordered, v_total_received
  FROM purchase_order_items poi
  LEFT JOIN purchase_receipt_items pri ON pri.purchase_order_item_id = poi.id
  WHERE poi.po_id = v_po_id;
  
  IF v_total_received >= v_total_ordered THEN
    UPDATE purchase_orders
    SET 
      status = 'completed',
      actual_delivery = CURRENT_DATE
    WHERE id = v_po_id;
  ELSIF v_total_received > 0 THEN
    UPDATE purchase_orders
    SET status = 'partially_received'
    WHERE id = v_po_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_purchase_order_on_receipt"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_status_on_zero"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Se a quantidade for 0, mudar status para 'esgotado'
  IF NEW.quantity = 0 THEN
    NEW.status = 'esgotado';
  -- Se a quantidade for maior que 0 e o status for 'esgotado', mudar para 'disponivel'
  ELSIF NEW.quantity > 0 AND OLD.status = 'esgotado' THEN
    NEW.status = 'disponivel';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_stock_status_on_zero"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_supplier_performance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Atualizar rating médio do fornecedor
    UPDATE suppliers 
    SET rating = (
        SELECT COALESCE(AVG(overall_score), 5.0)
        FROM supplier_performance_history
        WHERE supplier_id = NEW.supplier_id
        AND recorded_at >= NOW() - INTERVAL '12 months'
    )
    WHERE id = NEW.supplier_id;
    
    -- Recalcular sugestões para necessidades pendentes relacionadas
    UPDATE purchase_needs 
    SET updated_at = NOW()
    WHERE part_code = NEW.part_code 
    AND status = 'pending'
    AND org_id = NEW.org_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_supplier_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_bosch_parts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    is_bosch_order BOOLEAN := false;
    part_validation JSONB;
BEGIN
    -- Verificar se é uma ordem com componentes Bosch
    SELECT EXISTS(
        SELECT 1 FROM orders o
        JOIN engines e ON o.engine_id = e.id
        WHERE o.id = NEW.order_id
        AND e.reception_form_data->>'is_bosch_component' = 'true'
    ) INTO is_bosch_order;
    
    IF is_bosch_order THEN
        -- Validar se a peça é original Bosch ou homologada
        -- Aqui você implementaria a lógica de validação baseada em:
        -- - Códigos de peça Bosch
        -- - Lista de fornecedores homologados
        -- - Certificações necessárias
        
        part_validation := jsonb_build_object(
            'is_bosch_original', CASE 
                WHEN LOWER(NEW.part_name) LIKE '%bosch%' OR LOWER(NEW.part_code) LIKE '%bosch%' 
                THEN true 
                ELSE false 
            END,
            'validation_date', NOW(),
            'requires_certification', true
        );
        
        -- Adicionar validação aos dados da peça
        NEW.notes := COALESCE(NEW.notes, '') || 
            CASE 
                WHEN part_validation->>'is_bosch_original' = 'true' 
                THEN ' [PEÇA BOSCH ORIGINAL VALIDADA]'
                ELSE ' [ATENÇÃO: VERIFICAR HOMOLOGAÇÃO BOSCH]'
            END;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_bosch_parts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_inventory_movement"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_current_quantity INTEGER;
BEGIN
  -- Buscar quantidade atual
  SELECT quantity INTO v_current_quantity
  FROM parts_inventory
  WHERE id = NEW.part_id
    AND org_id = NEW.org_id;

  -- Validar se a peça existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Peça não encontrada ou não pertence à organização';
  END IF;

  -- Validar se previous_quantity está correto
  IF NEW.previous_quantity != v_current_quantity THEN
    RAISE EXCEPTION 'Quantidade anterior (%) não corresponde ao estoque atual (%). Conflito de concorrência detectado.', 
      NEW.previous_quantity, v_current_quantity;
  END IF;

  -- Validar estoque negativo (não permitido)
  IF NEW.new_quantity < 0 THEN
    RAISE EXCEPTION 'Estoque não pode ficar negativo. Estoque atual: %, Tentativa de reduzir: %', 
      v_current_quantity, NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_inventory_movement"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_inventory_movement"() IS 'Trigger que valida a movimentação antes de inserir, impedindo estoque negativo e detectando conflitos de concorrência';



CREATE OR REPLACE FUNCTION "public"."validate_workflow_advance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_validation JSONB;
BEGIN
  -- Só validar se o status está mudando e não está sendo concluído
  IF OLD.status IS DISTINCT FROM NEW.status 
     AND OLD.completed_at IS NULL 
     AND NEW.completed_at IS NULL THEN
    
    -- Verificar se pode avançar do status antigo
    v_validation := can_workflow_advance(OLD.id);

    IF NOT (v_validation->>'can_advance')::BOOLEAN THEN
      RAISE EXCEPTION 'Não é possível avançar: %', v_validation->>'reason'
        USING HINT = 'Verifique os checklists obrigatórios',
              DETAIL = v_validation->>'blocking_checklists';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_workflow_advance"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."accounts_payable" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_name" "text" NOT NULL,
    "supplier_document" "text",
    "expense_category_id" "uuid",
    "description" "text" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "payment_date" "date",
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "payment_method" "public"."payment_method",
    "invoice_number" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."accounts_payable" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts_receivable" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "budget_id" "uuid",
    "customer_id" "uuid" NOT NULL,
    "invoice_number" "text",
    "installment_number" integer DEFAULT 1,
    "total_installments" integer DEFAULT 1,
    "amount" numeric(15,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "payment_date" "date",
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status",
    "payment_method" "public"."payment_method",
    "late_fee" numeric(15,2) DEFAULT 0.00,
    "discount" numeric(15,2) DEFAULT 0.00,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."accounts_receivable" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."achievement_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "achievement_key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "icon" "text" NOT NULL,
    "points" integer DEFAULT 0,
    "criteria" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."achievement_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alert_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL,
    "alert_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "dismissed_by" "uuid",
    "dismissed_at" timestamp with time zone,
    "action_taken" "text",
    "action_taken_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "alert_history_severity_check" CHECK (("severity" = ANY (ARRAY['info'::"text", 'warning'::"text", 'error'::"text", 'success'::"text"])))
);


ALTER TABLE "public"."alert_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."alert_history" IS 'Histórico de alertas dispensados e ações tomadas';



COMMENT ON COLUMN "public"."alert_history"."action_taken" IS 'Descrição da ação tomada pelo usuário em resposta ao alerta';



CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "alert_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "severity" "text" DEFAULT 'warning'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_dismissible" boolean DEFAULT true NOT NULL,
    "auto_dismiss_after" integer,
    "target_users" "jsonb" DEFAULT '[]'::"jsonb",
    "action_label" "text",
    "action_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "user_id" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "inet",
    "user_agent" "text"
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bank_name" "text" NOT NULL,
    "agency" "text",
    "account_number" "text" NOT NULL,
    "account_type" "text" DEFAULT 'checking'::"text",
    "balance" numeric(15,2) DEFAULT 0.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."budget_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid",
    "alert_type" character varying(50) NOT NULL,
    "alert_message" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "dismissed_at" timestamp with time zone,
    "dismissed_by" "uuid"
);


ALTER TABLE "public"."budget_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."budget_alerts" IS 'Sistema de alertas para orçamentos pendentes';



CREATE TABLE IF NOT EXISTS "public"."budget_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "budget_id" "uuid",
    "approval_type" character varying(50) NOT NULL,
    "approved_services" "jsonb" DEFAULT '[]'::"jsonb",
    "approved_parts" "jsonb" DEFAULT '[]'::"jsonb",
    "approved_amount" numeric(12,2),
    "approval_method" character varying(50) NOT NULL,
    "approval_document" "jsonb" DEFAULT '{}'::"jsonb",
    "customer_signature" "text",
    "approval_notes" "text",
    "approved_by_customer" character varying(255),
    "approved_at" timestamp with time zone DEFAULT "now"(),
    "registered_by" "uuid",
    "org_id" "uuid"
);


ALTER TABLE "public"."budget_approvals" OWNER TO "postgres";


COMMENT ON TABLE "public"."budget_approvals" IS 'Aprovações de orçamento com documentação completa';



COMMENT ON COLUMN "public"."budget_approvals"."approval_document" IS 'Metadados do documento de aprovação (foto, PDF, etc.)';



CREATE TABLE IF NOT EXISTS "public"."budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "component" "public"."engine_component" NOT NULL,
    "description" "text" NOT NULL,
    "labor_cost" numeric(10,2) DEFAULT 0.00,
    "parts_cost" numeric(10,2) DEFAULT 0.00,
    "total_cost" numeric(10,2) GENERATED ALWAYS AS (("labor_cost" + "parts_cost")) STORED,
    "status" "public"."budget_status" DEFAULT 'pendente'::"public"."budget_status",
    "approved_at" timestamp with time zone,
    "approved_by" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."budgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cash_flow" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "transaction_type" "public"."transaction_type" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "description" "text" NOT NULL,
    "transaction_date" "date" NOT NULL,
    "payment_method" "public"."payment_method",
    "bank_account_id" "uuid",
    "accounts_receivable_id" "uuid",
    "accounts_payable_id" "uuid",
    "order_id" "uuid",
    "category_id" "uuid",
    "notes" "text",
    "reconciled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cash_flow" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cash_flow_projection" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "projection_date" "date" NOT NULL,
    "projected_income" numeric(15,2) DEFAULT 0.00,
    "projected_expenses" numeric(15,2) DEFAULT 0.00,
    "projected_balance" numeric(15,2) DEFAULT 0.00,
    "actual_income" numeric(15,2) DEFAULT 0.00,
    "actual_expenses" numeric(15,2) DEFAULT 0.00,
    "actual_balance" numeric(15,2) DEFAULT 0.00,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cash_flow_projection" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commission_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period_month" integer NOT NULL,
    "period_year" integer NOT NULL,
    "base_sales" numeric(15,2) DEFAULT 0,
    "commission_rate" numeric(5,2) DEFAULT 0,
    "calculated_commission" numeric(15,2) DEFAULT 0,
    "bonus" numeric(15,2) DEFAULT 0,
    "deductions" numeric(15,2) DEFAULT 0,
    "final_commission" numeric(15,2) DEFAULT 0,
    "status" "text" DEFAULT 'calculated'::"text",
    "approved_by" "uuid",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."commission_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_fiscal_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_name" "text" NOT NULL,
    "cnpj" "text",
    "state" "text",
    "municipality_code" "text",
    "regime_id" "uuid" NOT NULL,
    "effective_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."company_fiscal_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "commission_rate" numeric(5,2) DEFAULT 0.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."consultants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."customer_type" NOT NULL,
    "name" "text" NOT NULL,
    "document" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "address" "text",
    "workshop_name" "text",
    "workshop_cnpj" "text",
    "workshop_contact" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "user_id" "uuid",
    "preference_type" "text" NOT NULL,
    "preference_key" "text" NOT NULL,
    "preference_value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_global" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dashboard_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."detailed_budgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "diagnostic_response_id" "uuid",
    "budget_number" character varying(50),
    "services" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "parts" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "labor_hours" numeric(6,2) DEFAULT 0,
    "labor_rate" numeric(10,2) DEFAULT 0,
    "labor_total" numeric(12,2) DEFAULT 0,
    "parts_total" numeric(12,2) DEFAULT 0,
    "discount" numeric(12,2) DEFAULT 0,
    "tax_percentage" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "total_amount" numeric(12,2) DEFAULT 0,
    "estimated_delivery_days" integer DEFAULT 7,
    "warranty_months" integer DEFAULT 3,
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "org_id" "uuid"
);


ALTER TABLE "public"."detailed_budgets" OWNER TO "postgres";


COMMENT ON TABLE "public"."detailed_budgets" IS 'Orçamentos detalhados com cálculo automático de totais (US-004)';



COMMENT ON COLUMN "public"."detailed_budgets"."services" IS 'Lista JSON detalhada de serviços com preços individuais';



COMMENT ON COLUMN "public"."detailed_budgets"."parts" IS 'Lista JSON detalhada de peças com quantidades e preços';



CREATE TABLE IF NOT EXISTS "public"."diagnostic_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "item_name" character varying(255) NOT NULL,
    "item_description" "text",
    "item_type" character varying(50) DEFAULT 'checkbox'::character varying,
    "item_options" "jsonb" DEFAULT '[]'::"jsonb",
    "is_required" boolean DEFAULT false,
    "triggers_service" "jsonb" DEFAULT '[]'::"jsonb",
    "expected_values" "jsonb" DEFAULT '{}'::"jsonb",
    "display_order" integer DEFAULT 0,
    "help_text" "text"
);


ALTER TABLE "public"."diagnostic_checklist_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."diagnostic_checklist_items" IS 'Itens dos checklists com tipos variados (checkbox, medição, foto, etc.)';



COMMENT ON COLUMN "public"."diagnostic_checklist_items"."triggers_service" IS 'Serviços que são automaticamente sugeridos quando item é marcado';



CREATE TABLE IF NOT EXISTS "public"."diagnostic_checklist_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "checklist_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "responses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "generated_services" "jsonb" DEFAULT '[]'::"jsonb",
    "diagnosed_by" "uuid",
    "diagnosed_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying(50) DEFAULT 'completed'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "org_id" "uuid"
);


ALTER TABLE "public"."diagnostic_checklist_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."diagnostic_checklist_responses" IS 'Respostas dos checklists preenchidos durante diagnóstico';



CREATE TABLE IF NOT EXISTS "public"."diagnostic_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "engine_type_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."diagnostic_checklists" OWNER TO "postgres";


COMMENT ON TABLE "public"."diagnostic_checklists" IS 'Checklists de diagnóstico configuráveis por tipo de motor (US-003)';



CREATE TABLE IF NOT EXISTS "public"."employee_time_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "clock_in" time without time zone,
    "clock_out" time without time zone,
    "break_duration" integer DEFAULT 0,
    "total_hours" numeric(8,2),
    "overtime_hours" numeric(8,2) DEFAULT 0,
    "status" "text" DEFAULT 'present'::"text",
    "notes" "text",
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."employee_time_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_number" "text" NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "cpf" "text",
    "hire_date" "date" DEFAULT CURRENT_DATE,
    "position" "text" NOT NULL,
    "department" "text",
    "salary" numeric(15,2),
    "hourly_rate" numeric(8,2),
    "commission_rate" numeric(5,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "phone" "text",
    "email" "text",
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engine_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "name" character varying(255) NOT NULL,
    "category" character varying(100) NOT NULL,
    "description" "text",
    "technical_standards" "jsonb" DEFAULT '[]'::"jsonb",
    "required_components" "public"."engine_component"[] DEFAULT '{bloco,eixo,biela,comando,cabecote}'::"public"."engine_component"[],
    "special_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "default_warranty_months" integer DEFAULT 3,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."engine_types" OWNER TO "postgres";


COMMENT ON TABLE "public"."engine_types" IS 'Tipos de motor configuráveis por organização (US-001)';



COMMENT ON COLUMN "public"."engine_types"."technical_standards" IS 'Normas técnicas aplicáveis (NBR 13032, Bosch RAM, etc.)';



COMMENT ON COLUMN "public"."engine_types"."special_requirements" IS 'Requisitos especiais (ambiente limpo, equipamentos)';



CREATE TABLE IF NOT EXISTS "public"."engines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "brand" "text" NOT NULL,
    "model" "text" NOT NULL,
    "fuel_type" "text" NOT NULL,
    "serial_number" "text",
    "is_complete" boolean DEFAULT false,
    "assembly_state" "text",
    "has_block" boolean DEFAULT false,
    "has_head" boolean DEFAULT false,
    "has_crankshaft" boolean DEFAULT false,
    "has_piston" boolean DEFAULT false,
    "has_connecting_rod" boolean DEFAULT false,
    "turns_manually" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "engine_type_id" "uuid",
    "reception_form_data" "jsonb" DEFAULT '{}'::"jsonb",
    "org_id" "uuid"
);


ALTER TABLE "public"."engines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entry_form_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "field_name" character varying(100) NOT NULL,
    "field_label" character varying(255) NOT NULL,
    "field_type" character varying(50) NOT NULL,
    "field_options" "jsonb" DEFAULT '[]'::"jsonb",
    "is_required" boolean DEFAULT false,
    "default_value" "text",
    "validation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "display_order" integer DEFAULT 0,
    "help_text" "text"
);


ALTER TABLE "public"."entry_form_fields" OWNER TO "postgres";


COMMENT ON TABLE "public"."entry_form_fields" IS 'Campos configuráveis dos formulários de entrada';



CREATE TABLE IF NOT EXISTS "public"."entry_form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "order_id" "uuid",
    "form_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "submitted_by" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying(50) DEFAULT 'completed'::character varying,
    "generated_services" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."entry_form_submissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."entry_form_submissions" IS 'Formulários preenchidos e dados coletados';



CREATE TABLE IF NOT EXISTS "public"."entry_form_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "engine_type_id" "uuid",
    "name" character varying(255) NOT NULL,
    "description" "text",
    "layout_type" character varying(50) DEFAULT 'service_list'::character varying,
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."entry_form_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."entry_form_templates" IS 'Templates de formulários de entrada dinâmicos (História 11)';



CREATE TABLE IF NOT EXISTS "public"."environment_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "environment_id" "uuid",
    "order_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "workflow_step_key" character varying(50) NOT NULL,
    "reserved_from" timestamp with time zone NOT NULL,
    "reserved_until" timestamp with time zone NOT NULL,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "reservation_status" character varying(50) DEFAULT 'reserved'::character varying,
    "reserved_by" "uuid",
    "notes" "text",
    "org_id" "uuid"
);


ALTER TABLE "public"."environment_reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expense_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "public"."expense_category" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."expense_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fiscal_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid" NOT NULL,
    "operation" "text" NOT NULL,
    "old_values" "jsonb",
    "new_values" "jsonb",
    "user_id" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text",
    CONSTRAINT "fiscal_audit_log_operation_check" CHECK (("operation" = ANY (ARRAY['INSERT'::"text", 'UPDATE'::"text", 'DELETE'::"text"])))
);


ALTER TABLE "public"."fiscal_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fiscal_classifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."classification_type" NOT NULL,
    "ncm_code" "text",
    "service_code" "text",
    "cest" "text",
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."fiscal_classifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_count_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "count_id" "uuid" NOT NULL,
    "part_id" "uuid" NOT NULL,
    "expected_quantity" integer NOT NULL,
    "counted_quantity" integer,
    "difference" integer GENERATED ALWAYS AS (("counted_quantity" - "expected_quantity")) STORED,
    "unit_cost" numeric(10,2),
    "notes" "text",
    "counted_by" "uuid",
    "counted_at" timestamp with time zone
);


ALTER TABLE "public"."inventory_count_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_counts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "count_number" "text" NOT NULL,
    "count_date" "date" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "counted_by" "uuid",
    "reviewed_by" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inventory_counts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."inventory_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "part_id" "uuid" NOT NULL,
    "movement_type" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "previous_quantity" integer NOT NULL,
    "new_quantity" integer NOT NULL,
    "unit_cost" numeric(10,2),
    "order_id" "uuid",
    "budget_id" "uuid",
    "reason" "text" NOT NULL,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "inventory_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['entrada'::"text", 'saida'::"text", 'ajuste'::"text", 'transferencia'::"text", 'reserva'::"text", 'baixa'::"text"]))),
    CONSTRAINT "inventory_movements_quantity_check" CHECK (("quantity" <> 0))
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


COMMENT ON TABLE "public"."inventory_movements" IS 'Registra todas as movimentações de estoque (entradas, saídas, ajustes, etc.) com auditoria completa.';



COMMENT ON COLUMN "public"."inventory_movements"."movement_type" IS 'Tipo: entrada (recebimento), saida (venda/uso), ajuste (correção), transferencia (entre locais), reserva (bloqueio), baixa (descarte)';



COMMENT ON COLUMN "public"."inventory_movements"."quantity" IS 'Quantidade movimentada (sempre positiva, o tipo define se aumenta ou diminui estoque)';



COMMENT ON COLUMN "public"."inventory_movements"."previous_quantity" IS 'Quantidade no estoque ANTES da movimentação (para auditoria e controle de concorrência)';



COMMENT ON COLUMN "public"."inventory_movements"."new_quantity" IS 'Quantidade no estoque APÓS a movimentação';



COMMENT ON COLUMN "public"."inventory_movements"."reason" IS 'Motivo/justificativa obrigatória para a movimentação';



CREATE TABLE IF NOT EXISTS "public"."jurisdiction_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "jurisdiction" "text" NOT NULL,
    "badge_color" "text" NOT NULL,
    "text_color" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jurisdiction_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kpi_targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kpi_id" "uuid",
    "target_value" numeric NOT NULL,
    "period_type" "text" NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "goal_type" "text" DEFAULT 'kpi'::"text",
    "progress_current" numeric DEFAULT 0,
    "progress_unit" "text" DEFAULT 'number'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "assigned_to" "uuid"[],
    "priority" "text" DEFAULT 'medium'::"text",
    "parent_goal_id" "uuid",
    "milestones" "jsonb" DEFAULT '[]'::"jsonb",
    "notifications_enabled" boolean DEFAULT true,
    "auto_update_from_kpi" boolean DEFAULT true,
    "description" "text",
    "target_period_start" timestamp with time zone DEFAULT "now"(),
    "target_period_end" timestamp with time zone,
    CONSTRAINT "kpi_targets_goal_type_check" CHECK (("goal_type" = ANY (ARRAY['kpi'::"text", 'custom'::"text", 'project'::"text"]))),
    CONSTRAINT "kpi_targets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "kpi_targets_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'on_track'::"text", 'at_risk'::"text", 'delayed'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."kpi_targets" OWNER TO "postgres";


COMMENT ON COLUMN "public"."kpi_targets"."kpi_id" IS 'ID do KPI (NULL para metas customizadas não vinculadas a KPIs)';



COMMENT ON COLUMN "public"."kpi_targets"."goal_type" IS 'Tipo de meta: kpi (baseada em KPI), custom (personalizada), project (projeto)';



COMMENT ON COLUMN "public"."kpi_targets"."milestones" IS 'Array de marcos intermediários: [{name, target, date, completed}]';



COMMENT ON COLUMN "public"."kpi_targets"."auto_update_from_kpi" IS 'Se true, progress_current é atualizado automaticamente do KPI vinculado';



CREATE TABLE IF NOT EXISTS "public"."kpis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "calculation_formula" "text" NOT NULL,
    "unit" "text" DEFAULT 'number'::"text" NOT NULL,
    "icon" "text" DEFAULT 'TrendingUp'::"text" NOT NULL,
    "color" "text" DEFAULT 'primary'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kpis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_dre" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "month" integer NOT NULL,
    "year" integer NOT NULL,
    "total_revenue" numeric(15,2) DEFAULT 0.00,
    "direct_costs" numeric(15,2) DEFAULT 0.00,
    "operational_expenses" numeric(15,2) DEFAULT 0.00,
    "gross_profit" numeric(15,2) DEFAULT 0.00,
    "net_profit" numeric(15,2) DEFAULT 0.00,
    "profit_margin" numeric(5,2) DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."monthly_dre" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT 'Bell'::"text" NOT NULL,
    "color" "text" DEFAULT 'blue'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "notification_type_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "severity" "text" DEFAULT 'info'::"text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "is_global" boolean DEFAULT false NOT NULL,
    "expires_at" timestamp with time zone,
    "action_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obligation_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "obligation_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "mime_type" "text",
    "size_bytes" integer,
    "hash_sha256" "text",
    "generated_by" "uuid",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'success'::"text" NOT NULL,
    "error_message" "text"
);


ALTER TABLE "public"."obligation_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obligation_kinds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."obligation_kinds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obligations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "obligation_kind_id" "uuid" NOT NULL,
    "period_month" integer NOT NULL,
    "period_year" integer NOT NULL,
    "status" "public"."filing_status" DEFAULT 'rascunho'::"public"."filing_status" NOT NULL,
    "generated_file_path" "text",
    "protocol" "text",
    "started_at" timestamp with time zone,
    "finished_at" timestamp with time zone,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "org_id" "uuid",
    CONSTRAINT "obligations_period_month_check" CHECK ((("period_month" >= 1) AND ("period_month" <= 12))),
    CONSTRAINT "obligations_period_year_check" CHECK ((("period_year" >= 2000) AND ("period_year" <= 2100)))
);


ALTER TABLE "public"."obligations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "part_id" "uuid",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_cost" numeric(10,2) DEFAULT 0.00,
    "total_cost" numeric(10,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_cost")) STORED,
    "used_at" timestamp with time zone DEFAULT "now"(),
    "used_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    "part_name" "text" NOT NULL,
    "part_code" "text",
    "notes" "text"
);


ALTER TABLE "public"."order_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "component" "public"."engine_component",
    "workflow_step" "public"."workflow_status",
    "photo_type" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "description" "text",
    "uploaded_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "old_status" "text",
    "new_status" "text" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "org_id" "uuid"
);


ALTER TABLE "public"."order_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_warranties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "warranty_type" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "terms" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    CONSTRAINT "order_warranties_warranty_type_check" CHECK (("warranty_type" = ANY (ARRAY['pecas'::"text", 'servico'::"text", 'total'::"text"])))
);


ALTER TABLE "public"."order_warranties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_workflow" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "component" "public"."engine_component" NOT NULL,
    "status" "public"."workflow_status" DEFAULT 'entrada'::"public"."workflow_status",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "notes" "text",
    "assigned_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workflow_step_id" "uuid",
    "requires_approval" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "estimated_completion" timestamp with time zone,
    "actual_hours" numeric(5,2) DEFAULT 0
);


ALTER TABLE "public"."order_workflow" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "consultant_id" "uuid" NOT NULL,
    "engine_id" "uuid" NOT NULL,
    "collection_date" "date" NOT NULL,
    "collection_time" time without time zone NOT NULL,
    "collection_location" "text" NOT NULL,
    "driver_name" "text" NOT NULL,
    "failure_reason" "text",
    "status" "public"."order_status" DEFAULT 'ativa'::"public"."order_status",
    "initial_observations" "text",
    "final_observations" "text",
    "estimated_delivery" "date",
    "actual_delivery" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "priority" integer DEFAULT 1,
    "warranty_months" integer DEFAULT 3
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "theme_name" "text" DEFAULT 'default'::"text" NOT NULL,
    "primary_color" "text" DEFAULT '#FF6B35'::"text" NOT NULL,
    "secondary_color" "text" DEFAULT '#004E89'::"text" NOT NULL,
    "accent_color" "text" DEFAULT '#00A8CC'::"text" NOT NULL,
    "success_color" "text" DEFAULT '#28A745'::"text" NOT NULL,
    "warning_color" "text" DEFAULT '#FFC107'::"text" NOT NULL,
    "error_color" "text" DEFAULT '#DC3545'::"text" NOT NULL,
    "info_color" "text" DEFAULT '#17A2B8'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organization_themes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'user'::"public"."app_role" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"(),
    "joined_at" timestamp with time zone,
    "invited_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."organizations"."is_active" IS 'Indica se a organização está ativa. Organizações inativas não podem ser acessadas mas mantêm dados históricos.';



CREATE TABLE IF NOT EXISTS "public"."parts_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "part_name" "text" NOT NULL,
    "part_code" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_cost" numeric(10,2) DEFAULT 0.00,
    "supplier" "text",
    "component" "public"."engine_component",
    "status" "text" DEFAULT 'pendente'::"text",
    "separated_at" timestamp with time zone,
    "applied_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."parts_inventory" OWNER TO "postgres";


COMMENT ON TABLE "public"."parts_inventory" IS 'Inventário de peças com suporte multi-tenant através do org_id';



CREATE TABLE IF NOT EXISTS "public"."parts_price_table" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "part_code" character varying(100) NOT NULL,
    "part_name" character varying(255) NOT NULL,
    "part_description" "text",
    "compatible_components" "public"."engine_component"[] DEFAULT '{}'::"public"."engine_component"[],
    "unit_price" numeric(10,2) NOT NULL,
    "cost_price" numeric(10,2),
    "margin_percentage" numeric(5,2) DEFAULT 30.0,
    "supplier" character varying(255),
    "is_active" boolean DEFAULT true,
    "last_updated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parts_price_table" OWNER TO "postgres";


COMMENT ON TABLE "public"."parts_price_table" IS 'Tabela de preços de peças para cálculo automático';



CREATE TABLE IF NOT EXISTS "public"."parts_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "budget_id" "uuid",
    "part_id" "uuid",
    "part_code" character varying(100) NOT NULL,
    "part_name" character varying(255) NOT NULL,
    "quantity_reserved" integer DEFAULT 1 NOT NULL,
    "quantity_separated" integer DEFAULT 0,
    "quantity_applied" integer DEFAULT 0,
    "unit_cost" numeric(10,2) DEFAULT 0,
    "total_reserved_cost" numeric(12,2) GENERATED ALWAYS AS ((("quantity_reserved")::numeric * "unit_cost")) STORED,
    "reservation_status" character varying(50) DEFAULT 'reserved'::character varying,
    "reserved_at" timestamp with time zone DEFAULT "now"(),
    "reserved_by" "uuid",
    "separated_at" timestamp with time zone,
    "separated_by" "uuid",
    "applied_at" timestamp with time zone,
    "applied_by" "uuid",
    "notes" "text",
    "org_id" "uuid",
    CONSTRAINT "valid_quantities" CHECK ((("quantity_separated" <= "quantity_reserved") AND ("quantity_applied" <= "quantity_separated")))
);


ALTER TABLE "public"."parts_reservations" OWNER TO "postgres";


COMMENT ON TABLE "public"."parts_reservations" IS 'Reservas automáticas de peças por ordem de serviço (US-005)';



COMMENT ON COLUMN "public"."parts_reservations"."reservation_status" IS 'Status da reserva: reserved → separated → applied';



CREATE TABLE IF NOT EXISTS "public"."parts_stock_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "part_code" character varying(100) NOT NULL,
    "part_name" character varying(255) NOT NULL,
    "minimum_stock" integer DEFAULT 5,
    "maximum_stock" integer DEFAULT 50,
    "reorder_point" integer DEFAULT 10,
    "economic_order_quantity" integer DEFAULT 20,
    "lead_time_days" integer DEFAULT 7,
    "safety_stock" integer DEFAULT 3,
    "abc_classification" character varying(1) DEFAULT 'C'::character varying,
    "rotation_frequency" character varying(20) DEFAULT 'medium'::character varying,
    "is_critical" boolean DEFAULT false,
    "auto_reorder_enabled" boolean DEFAULT false,
    "preferred_supplier_id" "uuid",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."parts_stock_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."parts_stock_config" IS 'Configurações de estoque por peça (mínimo, máximo, ponto de reposição)';



CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "fee_percentage" numeric(5,2) DEFAULT 0.00,
    "fee_fixed" numeric(10,2) DEFAULT 0.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_rankings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "period_type" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "total_points" integer DEFAULT 0,
    "rank_position" integer,
    "metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "performance_rankings_period_type_check" CHECK (("period_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"])))
);


ALTER TABLE "public"."performance_rankings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "review_period_start" "date" NOT NULL,
    "review_period_end" "date" NOT NULL,
    "overall_rating" numeric(3,2),
    "productivity_score" numeric(3,2),
    "quality_score" numeric(3,2),
    "punctuality_score" numeric(3,2),
    "teamwork_score" numeric(3,2),
    "goals" "text",
    "achievements" "text",
    "improvement_areas" "text",
    "comments" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."performance_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "severity" "text" DEFAULT 'warning'::"text",
    "order_id" "uuid",
    "schedule_id" "uuid",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."production_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "component" "public"."engine_component" NOT NULL,
    "planned_start_date" "date" NOT NULL,
    "planned_end_date" "date" NOT NULL,
    "actual_start_date" "date",
    "actual_end_date" "date",
    "estimated_hours" numeric(8,2) DEFAULT 0,
    "actual_hours" numeric(8,2) DEFAULT 0,
    "priority" integer DEFAULT 1,
    "status" "text" DEFAULT 'planned'::"text",
    "assigned_to" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."production_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_page_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "page_id" "uuid",
    "can_view" boolean DEFAULT true,
    "can_edit" boolean DEFAULT false,
    "can_delete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profile_page_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_efficiency_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "report_period_start" "date" NOT NULL,
    "report_period_end" "date" NOT NULL,
    "total_purchases_planned" integer DEFAULT 0,
    "total_purchases_emergency" integer DEFAULT 0,
    "planned_purchase_percentage" numeric(5,2) DEFAULT 0,
    "total_cost_planned" numeric(15,2) DEFAULT 0,
    "total_cost_emergency" numeric(15,2) DEFAULT 0,
    "cost_savings_planned" numeric(15,2) DEFAULT 0,
    "average_delivery_days" numeric(4,1) DEFAULT 0,
    "supplier_performance_average" numeric(3,2) DEFAULT 0,
    "stock_out_incidents" integer DEFAULT 0,
    "efficiency_score" numeric(3,2) DEFAULT 0,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "generated_by" "uuid"
);


ALTER TABLE "public"."purchase_efficiency_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_needs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "part_code" character varying(100) NOT NULL,
    "part_name" character varying(255) NOT NULL,
    "required_quantity" integer NOT NULL,
    "available_quantity" integer DEFAULT 0,
    "shortage_quantity" integer GENERATED ALWAYS AS (("required_quantity" - "available_quantity")) STORED,
    "priority_level" character varying(20) DEFAULT 'normal'::character varying,
    "need_type" character varying(50) DEFAULT 'planned'::character varying,
    "related_orders" "jsonb" DEFAULT '[]'::"jsonb",
    "suggested_suppliers" "jsonb" DEFAULT '[]'::"jsonb",
    "estimated_cost" numeric(12,2) DEFAULT 0,
    "delivery_urgency_date" "date",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchase_needs" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_needs" IS 'Necessidades de compra identificadas automaticamente (US-006)';



COMMENT ON COLUMN "public"."purchase_needs"."need_type" IS 'Tipo da necessidade: planned (orçamento) vs emergency (falta de estoque)';



CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "description" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "total_price" numeric(15,2) NOT NULL,
    "received_quantity" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "part_id" "uuid"
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."purchase_order_items"."part_id" IS 'Vinculação com peça do estoque. Permite entrada automática ao receber o pedido.';



CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "po_number" "text" NOT NULL,
    "requisition_id" "uuid",
    "supplier_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "order_date" "date" DEFAULT CURRENT_DATE,
    "expected_delivery" "date",
    "actual_delivery" "date",
    "total_value" numeric(15,2) DEFAULT 0,
    "terms" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_receipt_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "receipt_id" "uuid" NOT NULL,
    "purchase_order_item_id" "uuid" NOT NULL,
    "part_id" "uuid",
    "ordered_quantity" integer NOT NULL,
    "received_quantity" integer NOT NULL,
    "has_divergence" boolean GENERATED ALWAYS AS (("received_quantity" <> "ordered_quantity")) STORED,
    "divergence_reason" "text",
    "unit_cost" numeric(10,2),
    "total_cost" numeric(10,2) GENERATED ALWAYS AS ((("received_quantity")::numeric * "unit_cost")) STORED,
    "quality_status" "text" DEFAULT 'approved'::"text",
    "quality_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "purchase_receipt_items_quality_status_check" CHECK (("quality_status" = ANY (ARRAY['approved'::"text", 'rejected'::"text", 'under_review'::"text"]))),
    CONSTRAINT "purchase_receipt_items_received_quantity_check" CHECK (("received_quantity" >= 0))
);


ALTER TABLE "public"."purchase_receipt_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "receipt_number" "text" NOT NULL,
    "receipt_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invoice_number" "text",
    "invoice_date" "date",
    "has_divergence" boolean DEFAULT false,
    "received_by" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "purchase_receipts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'partial'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."purchase_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requisition_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requisition_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "description" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(15,2),
    "total_price" numeric(15,2),
    "urgency_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchase_requisition_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requisitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requisition_number" "text" NOT NULL,
    "requested_by" "uuid",
    "department" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "justification" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "total_estimated_value" numeric(15,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."purchase_requisitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quality_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "step_key" character varying(50) NOT NULL,
    "quality_event_type" character varying(50) NOT NULL,
    "event_description" "text" NOT NULL,
    "severity_level" character varying(20) DEFAULT 'info'::character varying,
    "related_checklist_id" "uuid",
    "related_response_id" "uuid",
    "related_report_id" "uuid",
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "recorded_by" "uuid",
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."quality_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."quality_history" IS 'Histórico completo de eventos de qualidade por ordem';



CREATE TABLE IF NOT EXISTS "public"."quick_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "icon" "text" DEFAULT 'Plus'::"text" NOT NULL,
    "href" "text" NOT NULL,
    "variant" "text" DEFAULT 'outline'::"text" NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quick_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "item_name" "text" NOT NULL,
    "description" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(15,2) NOT NULL,
    "total_price" numeric(15,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quotation_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requisition_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "quote_number" "text",
    "quote_date" "date" DEFAULT CURRENT_DATE,
    "validity_date" "date",
    "total_value" numeric(15,2) DEFAULT 0,
    "delivery_time" integer,
    "terms" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "template_type" "text" DEFAULT 'csv'::"text" NOT NULL,
    "parameters_schema" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."report_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "report_code" "text" NOT NULL,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "period_start" "date",
    "period_end" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "file_path" "text",
    "file_name" "text",
    "file_type" "text",
    "size_bytes" integer,
    "hash_sha256" "text",
    "generated_by" "uuid",
    "generated_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_capacity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_name" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "daily_capacity_hours" numeric(8,2) DEFAULT 8,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."resource_capacity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "source_name" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "table_name" "text",
    "search_fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "display_fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "result_template" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "weight" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."search_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_price_table" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "engine_type_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "service_code" character varying(50) NOT NULL,
    "service_name" character varying(255) NOT NULL,
    "service_description" "text",
    "unit_type" character varying(50) DEFAULT 'unit'::character varying,
    "base_price" numeric(10,2) NOT NULL,
    "labor_hours" numeric(5,2) DEFAULT 0,
    "difficulty_multiplier" numeric(3,2) DEFAULT 1.0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_price_table" OWNER TO "postgres";


COMMENT ON TABLE "public"."service_price_table" IS 'Tabela de preços de serviços para cálculo automático';



CREATE TABLE IF NOT EXISTS "public"."special_environments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "environment_name" character varying(255) NOT NULL,
    "environment_type" character varying(50) NOT NULL,
    "requirements" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "current_status" character varying(50) DEFAULT 'available'::character varying,
    "temperature_min" numeric(4,1),
    "temperature_max" numeric(4,1),
    "humidity_min" numeric(4,1),
    "humidity_max" numeric(4,1),
    "cleanliness_class" character varying(20),
    "certification_required" boolean DEFAULT false,
    "certification_valid_until" "date",
    "last_maintenance" "date",
    "next_maintenance" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."special_environments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "entity_type" "text" NOT NULL,
    "status_key" "text" NOT NULL,
    "status_label" "text" NOT NULL,
    "badge_variant" "text" DEFAULT 'default'::"text" NOT NULL,
    "color" "text",
    "icon" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "engine_type_id" "uuid",
    "component" "public"."engine_component",
    "prerequisites" "jsonb" DEFAULT '[]'::"jsonb",
    "estimated_hours" numeric(5,2) DEFAULT 0,
    "requires_approval" boolean DEFAULT false,
    "approval_roles" "jsonb" DEFAULT '[]'::"jsonb",
    "display_order" integer DEFAULT 0,
    "notification_config" "jsonb" DEFAULT '{}'::"jsonb",
    "sla_config" "jsonb" DEFAULT '{}'::"jsonb",
    "visual_config" "jsonb" DEFAULT '{}'::"jsonb",
    "automation_rules" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."status_config" OWNER TO "postgres";


COMMENT ON COLUMN "public"."status_config"."prerequisites" IS 'Status pré-requisitos para transição';



COMMENT ON COLUMN "public"."status_config"."estimated_hours" IS 'Tempo estimado padrão para esta etapa';



CREATE TABLE IF NOT EXISTS "public"."status_prerequisites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_status_key" character varying(50) NOT NULL,
    "to_status_key" character varying(50) NOT NULL,
    "entity_type" character varying(20) DEFAULT 'workflow'::character varying NOT NULL,
    "transition_type" "public"."status_transition_type" DEFAULT 'manual'::"public"."status_transition_type" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."status_prerequisites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "part_code" character varying(100),
    "part_name" character varying(255) NOT NULL,
    "current_stock" integer NOT NULL,
    "minimum_stock" integer NOT NULL,
    "maximum_stock" integer DEFAULT 0,
    "alert_type" character varying(50) NOT NULL,
    "alert_level" character varying(20) DEFAULT 'warning'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" "uuid",
    "resolved_at" timestamp with time zone,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."stock_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."stock_alerts" IS 'Alertas de estoque. part_code é nullable mas obrigatório para alertas ativos via constraint CHECK.';



CREATE TABLE IF NOT EXISTS "public"."supplier_performance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid",
    "purchase_order_id" "uuid",
    "part_code" character varying(100) NOT NULL,
    "ordered_quantity" integer NOT NULL,
    "received_quantity" integer NOT NULL,
    "ordered_price" numeric(10,2) NOT NULL,
    "actual_price" numeric(10,2) NOT NULL,
    "promised_delivery_date" "date" NOT NULL,
    "actual_delivery_date" "date",
    "quality_rating" numeric(3,2) DEFAULT 5.0,
    "delivery_performance" numeric(3,2) DEFAULT 0,
    "price_variance_percentage" numeric(5,2) DEFAULT 0,
    "quantity_fulfillment_percentage" numeric(5,2) DEFAULT 0,
    "overall_score" numeric(3,2) DEFAULT 0,
    "notes" "text",
    "org_id" "uuid",
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplier_performance_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_performance_history" IS 'Histórico de performance dos fornecedores para análise';



CREATE TABLE IF NOT EXISTS "public"."supplier_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_need_id" "uuid",
    "supplier_id" "uuid",
    "supplier_name" character varying(255) NOT NULL,
    "suggested_price" numeric(10,2) NOT NULL,
    "delivery_days" integer DEFAULT 7,
    "reliability_score" numeric(3,2) DEFAULT 5.0,
    "last_purchase_date" "date",
    "total_purchases_count" integer DEFAULT 0,
    "average_delivery_days" numeric(4,1) DEFAULT 7.0,
    "quality_rating" numeric(3,2) DEFAULT 5.0,
    "cost_benefit_score" numeric(5,2) DEFAULT 5.0,
    "is_preferred" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supplier_suggestions" OWNER TO "postgres";


COMMENT ON TABLE "public"."supplier_suggestions" IS 'Sugestões inteligentes de fornecedores baseadas no histórico';



COMMENT ON COLUMN "public"."supplier_suggestions"."cost_benefit_score" IS 'Score calculado baseado em preço, prazo, qualidade e confiabilidade';



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "cnpj" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "contact_person" "text",
    "payment_terms" "text",
    "delivery_days" integer DEFAULT 0,
    "rating" numeric(3,2) DEFAULT 5.00,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "data_type" "text" DEFAULT 'string'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "system_config_data_type_check" CHECK (("data_type" = ANY (ARRAY['string'::"text", 'number'::"text", 'boolean'::"text", 'json'::"text"])))
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "description" "text",
    "route_path" character varying(200) NOT NULL,
    "module" character varying(50),
    "icon" character varying(50),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "operation" "public"."operation_type" NOT NULL,
    "classification_id" "uuid",
    "regime_id" "uuid" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "origin_uf" "text",
    "destination_uf" "text",
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "result" "jsonb" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."tax_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_ledgers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period_month" integer NOT NULL,
    "period_year" integer NOT NULL,
    "tax_type_id" "uuid" NOT NULL,
    "regime_id" "uuid" NOT NULL,
    "total_credits" numeric(14,2) DEFAULT 0 NOT NULL,
    "total_debits" numeric(14,2) DEFAULT 0 NOT NULL,
    "balance_due" numeric(14,2) DEFAULT 0 NOT NULL,
    "status" "public"."period_status" DEFAULT 'aberto'::"public"."period_status" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid",
    CONSTRAINT "tax_ledgers_period_month_check" CHECK ((("period_month" >= 1) AND ("period_month" <= 12))),
    CONSTRAINT "tax_ledgers_period_year_check" CHECK ((("period_year" >= 2000) AND ("period_year" <= 2100)))
);


ALTER TABLE "public"."tax_ledgers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_rate_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tax_type_id" "uuid" NOT NULL,
    "jurisdiction_code" "text" NOT NULL,
    "classification_id" "uuid",
    "rate" numeric(10,4) DEFAULT 0 NOT NULL,
    "base_reduction" numeric(10,4) DEFAULT 0,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."tax_rate_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_regimes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "effective_from" "date",
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."tax_regimes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "regime_id" "uuid" NOT NULL,
    "tax_type_id" "uuid" NOT NULL,
    "operation" "public"."operation_type" NOT NULL,
    "origin_uf" "text",
    "destination_uf" "text",
    "classification_id" "uuid",
    "calc_method" "public"."base_calc_method" DEFAULT 'percentual'::"public"."base_calc_method" NOT NULL,
    "rate" numeric(10,4),
    "base_reduction" numeric(10,4),
    "is_active" boolean DEFAULT true NOT NULL,
    "priority" integer DEFAULT 100 NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_to" "date",
    "formula" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."tax_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tax_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "jurisdiction" "public"."jurisdiction" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."tax_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."technical_report_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "template_name" character varying(255) NOT NULL,
    "report_type" character varying(50) NOT NULL,
    "technical_standard" character varying(100),
    "applicable_components" "public"."engine_component"[] DEFAULT '{}'::"public"."engine_component"[],
    "template_structure" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "required_data_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "optional_data_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "measurement_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "photo_requirements" "jsonb" DEFAULT '[]'::"jsonb",
    "header_template" "text",
    "footer_template" "text",
    "css_styles" "text",
    "is_active" boolean DEFAULT true,
    "version" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."technical_report_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."technical_report_templates" IS 'Templates de relatórios por norma técnica';



CREATE TABLE IF NOT EXISTS "public"."technical_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "report_type" character varying(50) NOT NULL,
    "report_template" character varying(100),
    "technical_standard" character varying(100),
    "report_number" character varying(50),
    "report_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "measurements_data" "jsonb" DEFAULT '{}'::"jsonb",
    "photos_data" "jsonb" DEFAULT '[]'::"jsonb",
    "conformity_status" character varying(50) DEFAULT 'pending'::character varying,
    "non_conformities" "jsonb" DEFAULT '[]'::"jsonb",
    "corrective_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "generated_automatically" boolean DEFAULT true,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "generated_by" "uuid",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "pdf_file_path" "text",
    "is_customer_visible" boolean DEFAULT true,
    "org_id" "uuid"
);


ALTER TABLE "public"."technical_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."technical_reports" IS 'Relatórios técnicos gerados automaticamente (US-008)';



COMMENT ON COLUMN "public"."technical_reports"."conformity_status" IS 'Status de conformidade: conforming, non_conforming, conditional';



COMMENT ON COLUMN "public"."technical_reports"."is_customer_visible" IS 'Se o relatório deve ser visível para o cliente';



CREATE TABLE IF NOT EXISTS "public"."technical_standards_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "standard_code" character varying(50) NOT NULL,
    "standard_name" character varying(255) NOT NULL,
    "description" "text",
    "applicable_components" "public"."engine_component"[] DEFAULT '{}'::"public"."engine_component"[],
    "measurement_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "tolerance_tables" "jsonb" DEFAULT '{}'::"jsonb",
    "test_procedures" "jsonb" DEFAULT '{}'::"jsonb",
    "documentation_requirements" "jsonb" DEFAULT '{}'::"jsonb",
    "certification_required" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."technical_standards_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."technical_standards_config" IS 'Configuração de normas técnicas aplicáveis';



CREATE TABLE IF NOT EXISTS "public"."time_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "component" "public"."engine_component" NOT NULL,
    "workflow_step" "public"."workflow_status" NOT NULL,
    "employee_name" "text" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "duration_minutes" integer GENERATED ALWAYS AS (
CASE
    WHEN ("end_time" IS NOT NULL) THEN (EXTRACT(epoch FROM ("end_time" - "start_time")) / (60)::numeric)
    ELSE NULL::numeric
END) STORED,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."time_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "achievement_type" "text" NOT NULL,
    "achievement_data" "jsonb" DEFAULT '{}'::"jsonb",
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "points_earned" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_basic_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_basic_info" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_basic_info" IS 'Informações básicas dos usuários - cache de auth.users para facilitar consultas';



CREATE TABLE IF NOT EXISTS "public"."user_profile_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_id" "uuid",
    "org_id" "uuid",
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."user_profile_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "sector_id" "uuid",
    "org_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_score_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "action_type" "text" NOT NULL,
    "points_earned" integer NOT NULL,
    "points_before" integer NOT NULL,
    "points_after" integer NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_score_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "total_points" integer DEFAULT 0,
    "current_level" integer DEFAULT 1,
    "level_progress" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sectors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "color" character varying(7) DEFAULT '#3B82F6'::character varying,
    "is_active" boolean DEFAULT true,
    "org_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sectors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_checklist_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_workflow_id" "uuid",
    "checklist_id" "uuid",
    "order_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "step_key" character varying(50) NOT NULL,
    "responses" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "measurements" "jsonb" DEFAULT '{}'::"jsonb",
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "non_conformities" "jsonb" DEFAULT '[]'::"jsonb",
    "corrective_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "overall_status" character varying(50) DEFAULT 'pending'::character varying,
    "completion_percentage" numeric(5,2) DEFAULT 0,
    "filled_by" "uuid",
    "filled_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "supervisor_approved_by" "uuid",
    "supervisor_approved_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."workflow_checklist_responses" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_checklist_responses" IS 'Preenchimento dos checklists com medições e fotos';



CREATE TABLE IF NOT EXISTS "public"."workflow_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "engine_type_id" "uuid",
    "workflow_step_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "step_key" character varying(50) NOT NULL,
    "checklist_name" character varying(255) NOT NULL,
    "description" "text",
    "technical_standard" character varying(100),
    "is_mandatory" boolean DEFAULT true,
    "requires_supervisor_approval" boolean DEFAULT false,
    "supervisor_roles" "jsonb" DEFAULT '["manager", "supervisor"]'::"jsonb",
    "blocks_workflow_advance" boolean DEFAULT true,
    "version" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."workflow_checklists" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_checklists" IS 'Checklists de qualidade por etapa do workflow (US-007)';



COMMENT ON COLUMN "public"."workflow_checklists"."blocks_workflow_advance" IS 'Se true, bloqueia avanço do workflow até checklist ser completado';



CREATE OR REPLACE VIEW "public"."v_workflows_with_pending_checklists" AS
 SELECT "ow"."id" AS "workflow_id",
    "ow"."order_id",
    "o"."order_number",
    "ow"."component",
    "ow"."status",
    "ow"."started_at",
    "jsonb_agg"("jsonb_build_object"('checklist_id', "wc"."id", 'checklist_name', "wc"."checklist_name", 'is_mandatory', "wc"."is_mandatory", 'blocks_workflow_advance', "wc"."blocks_workflow_advance")) FILTER (WHERE ("wcr"."id" IS NULL)) AS "missing_checklists"
   FROM ((("public"."order_workflow" "ow"
     JOIN "public"."orders" "o" ON (("o"."id" = "ow"."order_id")))
     JOIN "public"."workflow_checklists" "wc" ON (((("wc"."step_key")::"text" = ("ow"."status")::"text") AND ("wc"."component" = "ow"."component") AND ("wc"."is_mandatory" = true) AND ("wc"."is_active" = true))))
     LEFT JOIN "public"."workflow_checklist_responses" "wcr" ON ((("wcr"."order_workflow_id" = "ow"."id") AND ("wcr"."checklist_id" = "wc"."id") AND (("wcr"."overall_status")::"text" = 'approved'::"text"))))
  WHERE (("ow"."started_at" IS NOT NULL) AND ("ow"."completed_at" IS NULL) AND ("wcr"."id" IS NULL))
  GROUP BY "ow"."id", "ow"."order_id", "o"."order_number", "ow"."component", "ow"."status", "ow"."started_at";


ALTER VIEW "public"."v_workflows_with_pending_checklists" OWNER TO "postgres";


COMMENT ON VIEW "public"."v_workflows_with_pending_checklists" IS 'View de workflows com checklists pendentes para dashboard';



CREATE TABLE IF NOT EXISTS "public"."warranty_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "claim_number" character varying(50),
    "original_order_id" "uuid",
    "customer_id" "uuid",
    "claim_type" character varying(50) NOT NULL,
    "component" "public"."engine_component" NOT NULL,
    "claim_description" "text" NOT NULL,
    "failure_symptoms" "text",
    "customer_complaint" "text",
    "claim_date" "date" DEFAULT CURRENT_DATE,
    "reported_by" character varying(255),
    "contact_method" character varying(50),
    "technical_evaluation_status" character varying(50) DEFAULT 'pending'::character varying,
    "technical_evaluation" "jsonb" DEFAULT '{}'::"jsonb",
    "failure_cause" character varying(100),
    "is_warranty_valid" boolean,
    "warranty_coverage_percentage" numeric(5,2) DEFAULT 100.00,
    "evaluation_notes" "text",
    "evaluated_by" "uuid",
    "evaluated_at" timestamp with time zone,
    "claim_status" character varying(50) DEFAULT 'open'::character varying,
    "priority_level" character varying(20) DEFAULT 'normal'::character varying,
    "estimated_cost" numeric(12,2) DEFAULT 0,
    "actual_cost" numeric(12,2) DEFAULT 0,
    "resolution_type" character varying(50),
    "resolution_description" "text",
    "new_order_id" "uuid",
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "org_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."warranty_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warranty_indicators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid",
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "total_orders_delivered" integer DEFAULT 0,
    "total_warranty_claims" integer DEFAULT 0,
    "warranty_rate" numeric(5,2) DEFAULT 0,
    "claims_by_component" "jsonb" DEFAULT '{}'::"jsonb",
    "claims_by_cause" "jsonb" DEFAULT '{}'::"jsonb",
    "average_resolution_days" numeric(5,1) DEFAULT 0,
    "total_warranty_cost" numeric(15,2) DEFAULT 0,
    "customer_satisfaction_avg" numeric(3,2) DEFAULT 0,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "generated_by" "uuid"
);


ALTER TABLE "public"."warranty_indicators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."work_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "shift_name" "text" NOT NULL,
    "monday_start" time without time zone,
    "monday_end" time without time zone,
    "tuesday_start" time without time zone,
    "tuesday_end" time without time zone,
    "wednesday_start" time without time zone,
    "wednesday_end" time without time zone,
    "thursday_start" time without time zone,
    "thursday_end" time without time zone,
    "friday_start" time without time zone,
    "friday_end" time without time zone,
    "saturday_start" time without time zone,
    "saturday_end" time without time zone,
    "sunday_start" time without time zone,
    "sunday_end" time without time zone,
    "effective_from" "date" DEFAULT CURRENT_DATE,
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" "uuid"
);


ALTER TABLE "public"."work_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "checklist_id" "uuid",
    "item_code" character varying(50) NOT NULL,
    "item_name" character varying(255) NOT NULL,
    "item_description" "text",
    "item_type" character varying(50) DEFAULT 'checkbox'::character varying,
    "measurement_unit" character varying(20),
    "expected_value" numeric(12,4),
    "tolerance_min" numeric(12,4),
    "tolerance_max" numeric(12,4),
    "item_options" "jsonb" DEFAULT '[]'::"jsonb",
    "is_critical" boolean DEFAULT false,
    "is_required" boolean DEFAULT true,
    "requires_photo" boolean DEFAULT false,
    "requires_supervisor_check" boolean DEFAULT false,
    "validation_rules" "jsonb" DEFAULT '{}'::"jsonb",
    "display_order" integer DEFAULT 0,
    "help_text" "text",
    "technical_reference" "text"
);


ALTER TABLE "public"."workflow_checklist_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_checklist_items" IS 'Itens dos checklists com validações e tolerâncias técnicas';



COMMENT ON COLUMN "public"."workflow_checklist_items"."is_critical" IS 'Item crítico para qualidade - falha bloqueia aprovação';



CREATE TABLE IF NOT EXISTS "public"."workflow_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_workflow_id" "uuid",
    "old_status" "public"."workflow_status",
    "new_status" "public"."workflow_status" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text",
    "approval_required" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "org_id" "uuid"
);


ALTER TABLE "public"."workflow_status_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_status_history" IS 'Histórico de mudanças de status com auditoria completa';



CREATE TABLE IF NOT EXISTS "public"."workflow_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "engine_type_id" "uuid",
    "component" "public"."engine_component" NOT NULL,
    "step_name" character varying(100) NOT NULL,
    "step_key" character varying(50) NOT NULL,
    "description" "text",
    "is_required" boolean DEFAULT true,
    "estimated_hours" numeric(5,2) DEFAULT 0,
    "step_order" integer NOT NULL,
    "prerequisites" "jsonb" DEFAULT '[]'::"jsonb",
    "special_equipment" "jsonb" DEFAULT '[]'::"jsonb",
    "quality_checklist_required" boolean DEFAULT false,
    "technical_report_required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_steps" OWNER TO "postgres";


COMMENT ON TABLE "public"."workflow_steps" IS 'Etapas de workflow personalizáveis por tipo de motor';



COMMENT ON COLUMN "public"."workflow_steps"."prerequisites" IS 'Etapas que devem estar completas antes desta';



ALTER TABLE ONLY "public"."accounts_payable"
    ADD CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."achievement_configs"
    ADD CONSTRAINT "achievement_configs_org_id_achievement_key_key" UNIQUE ("org_id", "achievement_key");



ALTER TABLE ONLY "public"."achievement_configs"
    ADD CONSTRAINT "achievement_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alert_history"
    ADD CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_accounts"
    ADD CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_alerts"
    ADD CONSTRAINT "budget_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_flow"
    ADD CONSTRAINT "cash_flow_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cash_flow_projection"
    ADD CONSTRAINT "cash_flow_projection_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_calculations"
    ADD CONSTRAINT "commission_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_fiscal_settings"
    ADD CONSTRAINT "company_fiscal_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultants"
    ADD CONSTRAINT "consultants_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."consultants"
    ADD CONSTRAINT "consultants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_preferences"
    ADD CONSTRAINT "dashboard_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."detailed_budgets"
    ADD CONSTRAINT "detailed_budgets_budget_number_org_id_key" UNIQUE ("budget_number", "org_id");



COMMENT ON CONSTRAINT "detailed_budgets_budget_number_org_id_key" ON "public"."detailed_budgets" IS 'Garante que budget_number é único por organização (multi-tenant).
Permite que organizações diferentes tenham o mesmo número (ex: ORC-2025-0001).
Impede duplicatas dentro da mesma organização.';



ALTER TABLE ONLY "public"."detailed_budgets"
    ADD CONSTRAINT "detailed_budgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnostic_checklist_items"
    ADD CONSTRAINT "diagnostic_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnostic_checklist_responses"
    ADD CONSTRAINT "diagnostic_checklist_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diagnostic_checklists"
    ADD CONSTRAINT "diagnostic_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_time_tracking"
    ADD CONSTRAINT "employee_time_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_number_key" UNIQUE ("employee_number");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engine_types"
    ADD CONSTRAINT "engine_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engines"
    ADD CONSTRAINT "engines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entry_form_fields"
    ADD CONSTRAINT "entry_form_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entry_form_submissions"
    ADD CONSTRAINT "entry_form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entry_form_templates"
    ADD CONSTRAINT "entry_form_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."environment_reservations"
    ADD CONSTRAINT "environment_reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expense_categories"
    ADD CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fiscal_audit_log"
    ADD CONSTRAINT "fiscal_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fiscal_classifications"
    ADD CONSTRAINT "fiscal_classifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_count_items"
    ADD CONSTRAINT "inventory_count_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_counts"
    ADD CONSTRAINT "inventory_counts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jurisdiction_config"
    ADD CONSTRAINT "jurisdiction_config_org_id_jurisdiction_key" UNIQUE ("org_id", "jurisdiction");



ALTER TABLE ONLY "public"."jurisdiction_config"
    ADD CONSTRAINT "jurisdiction_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpi_targets"
    ADD CONSTRAINT "kpi_targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kpis"
    ADD CONSTRAINT "kpis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_dre"
    ADD CONSTRAINT "monthly_dre_month_year_key" UNIQUE ("month", "year");



ALTER TABLE ONLY "public"."monthly_dre"
    ADD CONSTRAINT "monthly_dre_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_types"
    ADD CONSTRAINT "notification_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obligation_files"
    ADD CONSTRAINT "obligation_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obligation_kinds"
    ADD CONSTRAINT "obligation_kinds_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."obligation_kinds"
    ADD CONSTRAINT "obligation_kinds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obligations"
    ADD CONSTRAINT "obligations_obligation_kind_id_period_year_period_month_key" UNIQUE ("obligation_kind_id", "period_year", "period_month");



ALTER TABLE ONLY "public"."obligations"
    ADD CONSTRAINT "obligations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_materials"
    ADD CONSTRAINT "order_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_photos"
    ADD CONSTRAINT "order_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_warranties"
    ADD CONSTRAINT "order_warranties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_workflow"
    ADD CONSTRAINT "order_workflow_order_id_component_key" UNIQUE ("order_id", "component");



ALTER TABLE ONLY "public"."order_workflow"
    ADD CONSTRAINT "order_workflow_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_org_id_theme_name_key" UNIQUE ("org_id", "theme_name");



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_users"
    ADD CONSTRAINT "organization_users_organization_id_user_id_key" UNIQUE ("organization_id", "user_id");



ALTER TABLE ONLY "public"."organization_users"
    ADD CONSTRAINT "organization_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."parts_inventory"
    ADD CONSTRAINT "parts_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parts_price_table"
    ADD CONSTRAINT "parts_price_table_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parts_stock_config"
    ADD CONSTRAINT "parts_stock_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_rankings"
    ADD CONSTRAINT "performance_rankings_org_id_user_id_period_type_period_star_key" UNIQUE ("org_id", "user_id", "period_type", "period_start");



ALTER TABLE ONLY "public"."performance_rankings"
    ADD CONSTRAINT "performance_rankings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_alerts"
    ADD CONSTRAINT "production_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_schedules"
    ADD CONSTRAINT "production_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_page_permissions"
    ADD CONSTRAINT "profile_page_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_efficiency_reports"
    ADD CONSTRAINT "purchase_efficiency_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_needs"
    ADD CONSTRAINT "purchase_needs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_receipt_items"
    ADD CONSTRAINT "purchase_receipt_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requisition_items"
    ADD CONSTRAINT "purchase_requisition_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requisitions"
    ADD CONSTRAINT "purchase_requisitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quality_history"
    ADD CONSTRAINT "quality_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quick_actions"
    ADD CONSTRAINT "quick_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_catalog"
    ADD CONSTRAINT "report_catalog_org_id_code_key" UNIQUE ("org_id", "code");



ALTER TABLE ONLY "public"."report_catalog"
    ADD CONSTRAINT "report_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_capacity"
    ADD CONSTRAINT "resource_capacity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_sources"
    ADD CONSTRAINT "search_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_price_table"
    ADD CONSTRAINT "service_price_table_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."special_environments"
    ADD CONSTRAINT "special_environments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_config"
    ADD CONSTRAINT "status_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_prerequisites"
    ADD CONSTRAINT "status_prerequisites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_performance_history"
    ADD CONSTRAINT "supplier_performance_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_suggestions"
    ADD CONSTRAINT "supplier_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_org_id_key_key" UNIQUE ("org_id", "key");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_pages"
    ADD CONSTRAINT "system_pages_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."system_pages"
    ADD CONSTRAINT "system_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_ledgers"
    ADD CONSTRAINT "tax_ledgers_period_year_period_month_tax_type_id_regime_id_key" UNIQUE ("period_year", "period_month", "tax_type_id", "regime_id");



ALTER TABLE ONLY "public"."tax_ledgers"
    ADD CONSTRAINT "tax_ledgers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_rate_tables"
    ADD CONSTRAINT "tax_rate_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_regimes"
    ADD CONSTRAINT "tax_regimes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."tax_regimes"
    ADD CONSTRAINT "tax_regimes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_rules"
    ADD CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tax_types"
    ADD CONSTRAINT "tax_types_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."tax_types"
    ADD CONSTRAINT "tax_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technical_report_templates"
    ADD CONSTRAINT "technical_report_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technical_reports"
    ADD CONSTRAINT "technical_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technical_reports"
    ADD CONSTRAINT "technical_reports_report_number_key" UNIQUE ("report_number");



ALTER TABLE ONLY "public"."technical_standards_config"
    ADD CONSTRAINT "technical_standards_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."time_logs"
    ADD CONSTRAINT "time_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."detailed_budgets"
    ADD CONSTRAINT "unique_budget_per_component" UNIQUE ("order_id", "component");



ALTER TABLE ONLY "public"."diagnostic_checklists"
    ADD CONSTRAINT "unique_checklist_per_component" UNIQUE ("org_id", "engine_type_id", "component", "name", "version");



ALTER TABLE ONLY "public"."inventory_counts"
    ADD CONSTRAINT "unique_count_number_per_org" UNIQUE ("org_id", "count_number");



ALTER TABLE ONLY "public"."engine_types"
    ADD CONSTRAINT "unique_engine_type_per_org" UNIQUE ("org_id", "name");



ALTER TABLE ONLY "public"."entry_form_fields"
    ADD CONSTRAINT "unique_field_per_template" UNIQUE ("template_id", "field_name");



ALTER TABLE ONLY "public"."diagnostic_checklist_items"
    ADD CONSTRAINT "unique_item_per_checklist" UNIQUE ("checklist_id", "item_name");



ALTER TABLE ONLY "public"."purchase_needs"
    ADD CONSTRAINT "unique_part_need_per_org" UNIQUE ("org_id", "part_code", "status");



ALTER TABLE ONLY "public"."inventory_count_items"
    ADD CONSTRAINT "unique_part_per_count" UNIQUE ("count_id", "part_id");



ALTER TABLE ONLY "public"."parts_price_table"
    ADD CONSTRAINT "unique_part_per_org" UNIQUE ("org_id", "part_code");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "unique_profile_name_per_org" UNIQUE ("name", "org_id");



ALTER TABLE ONLY "public"."profile_page_permissions"
    ADD CONSTRAINT "unique_profile_page" UNIQUE ("profile_id", "page_id");



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "unique_receipt_number_per_org" UNIQUE ("org_id", "receipt_number");



ALTER TABLE ONLY "public"."technical_report_templates"
    ADD CONSTRAINT "unique_report_template_per_org" UNIQUE ("org_id", "template_name", "version");



ALTER TABLE ONLY "public"."user_sectors"
    ADD CONSTRAINT "unique_sector_name_per_org" UNIQUE ("name", "org_id");



ALTER TABLE ONLY "public"."service_price_table"
    ADD CONSTRAINT "unique_service_per_engine_type" UNIQUE ("org_id", "engine_type_id", "component", "service_code");



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "unique_step_per_component" UNIQUE ("engine_type_id", "component", "step_order");



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "unique_stock_alert_per_org_part" UNIQUE ("org_id", "part_code");



ALTER TABLE ONLY "public"."parts_stock_config"
    ADD CONSTRAINT "unique_stock_config_per_org" UNIQUE ("org_id", "part_code");



ALTER TABLE ONLY "public"."technical_reports"
    ADD CONSTRAINT "unique_technical_report_per_component" UNIQUE ("order_id", "component", "report_type");



ALTER TABLE ONLY "public"."technical_standards_config"
    ADD CONSTRAINT "unique_technical_standard_per_org" UNIQUE ("org_id", "standard_code");



ALTER TABLE ONLY "public"."entry_form_templates"
    ADD CONSTRAINT "unique_template_name_per_org" UNIQUE ("org_id", "name", "version");



ALTER TABLE ONLY "public"."user_profile_assignments"
    ADD CONSTRAINT "unique_user_profile_org" UNIQUE ("user_id", "profile_id", "org_id");



ALTER TABLE ONLY "public"."warranty_indicators"
    ADD CONSTRAINT "unique_warranty_indicators_per_period" UNIQUE ("org_id", "period_start", "period_end");



ALTER TABLE ONLY "public"."workflow_checklists"
    ADD CONSTRAINT "unique_workflow_checklist_per_step" UNIQUE ("org_id", "workflow_step_id", "checklist_name", "version");



ALTER TABLE ONLY "public"."workflow_checklist_items"
    ADD CONSTRAINT "unique_workflow_item_per_checklist" UNIQUE ("checklist_id", "item_code");



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "unique_workflow_response_per_workflow" UNIQUE ("order_workflow_id", "checklist_id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_basic_info"
    ADD CONSTRAINT "user_basic_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_basic_info"
    ADD CONSTRAINT "user_basic_info_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_profile_assignments"
    ADD CONSTRAINT "user_profile_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_score_history"
    ADD CONSTRAINT "user_score_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_scores"
    ADD CONSTRAINT "user_scores_org_id_user_id_key" UNIQUE ("org_id", "user_id");



ALTER TABLE ONLY "public"."user_scores"
    ADD CONSTRAINT "user_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sectors"
    ADD CONSTRAINT "user_sectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_claim_number_key" UNIQUE ("claim_number");



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."warranty_indicators"
    ADD CONSTRAINT "warranty_indicators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."work_schedules"
    ADD CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_checklist_items"
    ADD CONSTRAINT "workflow_checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "workflow_checklist_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_checklists"
    ADD CONSTRAINT "workflow_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_status_history"
    ADD CONSTRAINT "workflow_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_accounts_payable_org_id" ON "public"."accounts_payable" USING "btree" ("org_id");



CREATE INDEX "idx_accounts_receivable_budget_id" ON "public"."accounts_receivable" USING "btree" ("budget_id") WHERE ("budget_id" IS NOT NULL);



CREATE INDEX "idx_accounts_receivable_org_id" ON "public"."accounts_receivable" USING "btree" ("org_id");



CREATE INDEX "idx_achievement_configs_active" ON "public"."achievement_configs" USING "btree" ("is_active");



CREATE INDEX "idx_achievement_configs_org" ON "public"."achievement_configs" USING "btree" ("org_id");



CREATE INDEX "idx_alert_history_alert_id" ON "public"."alert_history" USING "btree" ("alert_id");



CREATE INDEX "idx_alert_history_created_at" ON "public"."alert_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_alert_history_org_id" ON "public"."alert_history" USING "btree" ("org_id");



CREATE INDEX "idx_alert_history_severity" ON "public"."alert_history" USING "btree" ("severity");



CREATE INDEX "idx_audit_log_org_id" ON "public"."audit_log" USING "btree" ("org_id");



CREATE INDEX "idx_audit_log_table_record" ON "public"."audit_log" USING "btree" ("table_name", "record_id");



CREATE INDEX "idx_budget_alerts_active" ON "public"."budget_alerts" USING "btree" ("is_active");



CREATE INDEX "idx_budget_alerts_budget" ON "public"."budget_alerts" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_alerts_type" ON "public"."budget_alerts" USING "btree" ("alert_type");



CREATE INDEX "idx_budget_approvals_budget" ON "public"."budget_approvals" USING "btree" ("budget_id");



CREATE INDEX "idx_budget_approvals_date" ON "public"."budget_approvals" USING "btree" ("approved_at");



CREATE INDEX "idx_budget_approvals_org_budget" ON "public"."budget_approvals" USING "btree" ("org_id", "budget_id");



CREATE INDEX "idx_budget_approvals_org_id" ON "public"."budget_approvals" USING "btree" ("org_id");



CREATE INDEX "idx_budget_approvals_type" ON "public"."budget_approvals" USING "btree" ("approval_type");



CREATE INDEX "idx_company_fiscal_settings_org_id" ON "public"."company_fiscal_settings" USING "btree" ("org_id");



CREATE INDEX "idx_customers_created_by" ON "public"."customers" USING "btree" ("created_by");



CREATE INDEX "idx_customers_org_id" ON "public"."customers" USING "btree" ("org_id");



CREATE INDEX "idx_detailed_budgets_budget_number_pattern" ON "public"."detailed_budgets" USING "btree" ("budget_number") WHERE ("budget_number" IS NOT NULL);



CREATE INDEX "idx_detailed_budgets_component" ON "public"."detailed_budgets" USING "btree" ("component");



CREATE INDEX "idx_detailed_budgets_number" ON "public"."detailed_budgets" USING "btree" ("budget_number");



CREATE INDEX "idx_detailed_budgets_order" ON "public"."detailed_budgets" USING "btree" ("order_id");



CREATE INDEX "idx_detailed_budgets_org_budget" ON "public"."detailed_budgets" USING "btree" ("org_id", "budget_number") WHERE ("budget_number" IS NOT NULL);



COMMENT ON INDEX "public"."idx_detailed_budgets_org_budget" IS 'Índice composto para otimizar buscas de orçamentos por organização e número.
Usado em consultas que filtram por org_id e budget_number simultaneamente.';



CREATE INDEX "idx_detailed_budgets_org_id" ON "public"."detailed_budgets" USING "btree" ("org_id");



COMMENT ON INDEX "public"."idx_detailed_budgets_org_id" IS 'Índice para otimizar buscas de orçamentos por organização.
Usado pela função generate_budget_number() para encontrar o último número da org.';



CREATE INDEX "idx_detailed_budgets_org_order" ON "public"."detailed_budgets" USING "btree" ("org_id", "order_id");



CREATE INDEX "idx_detailed_budgets_status" ON "public"."detailed_budgets" USING "btree" ("status");



CREATE INDEX "idx_diagnostic_checklist_items_checklist" ON "public"."diagnostic_checklist_items" USING "btree" ("checklist_id");



CREATE INDEX "idx_diagnostic_checklist_items_order" ON "public"."diagnostic_checklist_items" USING "btree" ("display_order");



CREATE INDEX "idx_diagnostic_checklist_responses_org_id" ON "public"."diagnostic_checklist_responses" USING "btree" ("org_id");



CREATE INDEX "idx_diagnostic_checklists_component" ON "public"."diagnostic_checklists" USING "btree" ("component");



CREATE INDEX "idx_diagnostic_checklists_engine_type" ON "public"."diagnostic_checklists" USING "btree" ("engine_type_id");



CREATE INDEX "idx_diagnostic_checklists_org" ON "public"."diagnostic_checklists" USING "btree" ("org_id");



CREATE INDEX "idx_diagnostic_responses_component" ON "public"."diagnostic_checklist_responses" USING "btree" ("component");



CREATE INDEX "idx_diagnostic_responses_diagnosed_by" ON "public"."diagnostic_checklist_responses" USING "btree" ("diagnosed_by");



CREATE INDEX "idx_diagnostic_responses_order" ON "public"."diagnostic_checklist_responses" USING "btree" ("order_id");



CREATE INDEX "idx_engine_types_category" ON "public"."engine_types" USING "btree" ("category");



CREATE INDEX "idx_engine_types_org" ON "public"."engine_types" USING "btree" ("org_id");



CREATE INDEX "idx_engines_org_id" ON "public"."engines" USING "btree" ("org_id");



CREATE INDEX "idx_fiscal_classifications_org_id" ON "public"."fiscal_classifications" USING "btree" ("org_id");



CREATE INDEX "idx_form_submissions_date" ON "public"."entry_form_submissions" USING "btree" ("submitted_at");



CREATE INDEX "idx_form_submissions_order" ON "public"."entry_form_submissions" USING "btree" ("order_id");



CREATE INDEX "idx_form_submissions_template" ON "public"."entry_form_submissions" USING "btree" ("template_id");



CREATE INDEX "idx_inventory_count_items_count_id" ON "public"."inventory_count_items" USING "btree" ("count_id");



CREATE INDEX "idx_inventory_count_items_part_id" ON "public"."inventory_count_items" USING "btree" ("part_id");



CREATE INDEX "idx_inventory_counts_count_date" ON "public"."inventory_counts" USING "btree" ("count_date" DESC);



CREATE INDEX "idx_inventory_counts_org_id" ON "public"."inventory_counts" USING "btree" ("org_id");



CREATE INDEX "idx_inventory_counts_status" ON "public"."inventory_counts" USING "btree" ("status");



CREATE INDEX "idx_inventory_movements_budget_id" ON "public"."inventory_movements" USING "btree" ("budget_id") WHERE ("budget_id" IS NOT NULL);



CREATE INDEX "idx_inventory_movements_created_at" ON "public"."inventory_movements" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_inventory_movements_order_id" ON "public"."inventory_movements" USING "btree" ("order_id") WHERE ("order_id" IS NOT NULL);



CREATE INDEX "idx_inventory_movements_org_id" ON "public"."inventory_movements" USING "btree" ("org_id");



CREATE INDEX "idx_inventory_movements_part_id" ON "public"."inventory_movements" USING "btree" ("part_id");



CREATE INDEX "idx_inventory_movements_type" ON "public"."inventory_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_kpi_targets_goal_type" ON "public"."kpi_targets" USING "btree" ("goal_type");



CREATE INDEX "idx_kpi_targets_org_id" ON "public"."kpi_targets" USING "btree" ("org_id");



CREATE INDEX "idx_kpi_targets_parent_goal" ON "public"."kpi_targets" USING "btree" ("parent_goal_id");



CREATE INDEX "idx_kpi_targets_priority" ON "public"."kpi_targets" USING "btree" ("priority");



CREATE INDEX "idx_kpi_targets_status" ON "public"."kpi_targets" USING "btree" ("status");



CREATE INDEX "idx_notifications_org_global_unread" ON "public"."notifications" USING "btree" ("org_id", "is_global", "is_read", "created_at" DESC) WHERE (("is_global" = true) AND ("is_read" = false));



CREATE INDEX "idx_notifications_user_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read", "created_at" DESC) WHERE ("is_read" = false);



CREATE INDEX "idx_obligation_files_obligation" ON "public"."obligation_files" USING "btree" ("obligation_id");



CREATE INDEX "idx_obligation_kinds_org_id" ON "public"."obligation_kinds" USING "btree" ("org_id");



CREATE INDEX "idx_obligations_created_by" ON "public"."obligations" USING "btree" ("created_by");



CREATE INDEX "idx_obligations_kind_period" ON "public"."obligations" USING "btree" ("obligation_kind_id", "period_year", "period_month");



CREATE INDEX "idx_obligations_org_id" ON "public"."obligations" USING "btree" ("org_id");



CREATE INDEX "idx_obligations_period" ON "public"."obligations" USING "btree" ("period_year", "period_month");



CREATE INDEX "idx_order_warranties_order" ON "public"."order_warranties" USING "btree" ("order_id", "is_active");



CREATE INDEX "idx_order_workflow_status_pending" ON "public"."order_workflow" USING "btree" ("status", "component") WHERE (("started_at" IS NOT NULL) AND ("completed_at" IS NULL));



CREATE INDEX "idx_orders_org_id" ON "public"."orders" USING "btree" ("org_id");



CREATE INDEX "idx_org_users_org_id" ON "public"."organization_users" USING "btree" ("organization_id");



CREATE INDEX "idx_org_users_role" ON "public"."organization_users" USING "btree" ("role");



CREATE INDEX "idx_org_users_user_id" ON "public"."organization_users" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_created_by" ON "public"."organizations" USING "btree" ("created_by");



CREATE INDEX "idx_organizations_is_active" ON "public"."organizations" USING "btree" ("is_active");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_parts_inventory_org_component" ON "public"."parts_inventory" USING "btree" ("org_id", "component");



CREATE INDEX "idx_parts_inventory_org_id" ON "public"."parts_inventory" USING "btree" ("org_id");



CREATE INDEX "idx_parts_inventory_org_status" ON "public"."parts_inventory" USING "btree" ("org_id", "status");



CREATE INDEX "idx_parts_price_table_code" ON "public"."parts_price_table" USING "btree" ("part_code");



CREATE INDEX "idx_parts_price_table_org" ON "public"."parts_price_table" USING "btree" ("org_id");



CREATE INDEX "idx_parts_reservations_budget" ON "public"."parts_reservations" USING "btree" ("budget_id");



CREATE INDEX "idx_parts_reservations_order" ON "public"."parts_reservations" USING "btree" ("order_id");



CREATE INDEX "idx_parts_reservations_order_budget" ON "public"."parts_reservations" USING "btree" ("order_id", "budget_id");



CREATE INDEX "idx_parts_reservations_org" ON "public"."parts_reservations" USING "btree" ("org_id");



CREATE INDEX "idx_parts_reservations_part_code" ON "public"."parts_reservations" USING "btree" ("part_code");



CREATE INDEX "idx_parts_reservations_status" ON "public"."parts_reservations" USING "btree" ("reservation_status");



CREATE INDEX "idx_parts_stock_config_critical" ON "public"."parts_stock_config" USING "btree" ("is_critical");



CREATE INDEX "idx_parts_stock_config_org" ON "public"."parts_stock_config" USING "btree" ("org_id");



CREATE INDEX "idx_parts_stock_config_part" ON "public"."parts_stock_config" USING "btree" ("part_code");



CREATE INDEX "idx_performance_rankings_org_period" ON "public"."performance_rankings" USING "btree" ("org_id", "period_type", "period_start");



CREATE INDEX "idx_performance_rankings_rank" ON "public"."performance_rankings" USING "btree" ("rank_position");



CREATE INDEX "idx_performance_rankings_user" ON "public"."performance_rankings" USING "btree" ("user_id");



CREATE INDEX "idx_profile_page_permissions_page_id" ON "public"."profile_page_permissions" USING "btree" ("page_id");



CREATE INDEX "idx_profile_page_permissions_profile_id" ON "public"."profile_page_permissions" USING "btree" ("profile_id");



CREATE INDEX "idx_purchase_needs_org" ON "public"."purchase_needs" USING "btree" ("org_id");



CREATE INDEX "idx_purchase_needs_part_code" ON "public"."purchase_needs" USING "btree" ("part_code");



CREATE INDEX "idx_purchase_needs_priority" ON "public"."purchase_needs" USING "btree" ("priority_level");



CREATE INDEX "idx_purchase_needs_status" ON "public"."purchase_needs" USING "btree" ("status");



CREATE INDEX "idx_purchase_needs_urgency" ON "public"."purchase_needs" USING "btree" ("delivery_urgency_date");



CREATE INDEX "idx_purchase_order_items_part_id" ON "public"."purchase_order_items" USING "btree" ("part_id") WHERE ("part_id" IS NOT NULL);



CREATE INDEX "idx_purchase_receipt_items_part_id" ON "public"."purchase_receipt_items" USING "btree" ("part_id") WHERE ("part_id" IS NOT NULL);



CREATE INDEX "idx_purchase_receipt_items_po_item_id" ON "public"."purchase_receipt_items" USING "btree" ("purchase_order_item_id");



CREATE INDEX "idx_purchase_receipt_items_receipt_id" ON "public"."purchase_receipt_items" USING "btree" ("receipt_id");



CREATE INDEX "idx_purchase_receipts_date" ON "public"."purchase_receipts" USING "btree" ("receipt_date" DESC);



CREATE INDEX "idx_purchase_receipts_org_id" ON "public"."purchase_receipts" USING "btree" ("org_id");



CREATE INDEX "idx_purchase_receipts_po_id" ON "public"."purchase_receipts" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_purchase_receipts_status" ON "public"."purchase_receipts" USING "btree" ("status");



CREATE INDEX "idx_quality_history_component" ON "public"."quality_history" USING "btree" ("component");



CREATE INDEX "idx_quality_history_date" ON "public"."quality_history" USING "btree" ("recorded_at");



CREATE INDEX "idx_quality_history_event_type" ON "public"."quality_history" USING "btree" ("quality_event_type");



CREATE INDEX "idx_quality_history_order" ON "public"."quality_history" USING "btree" ("order_id");



CREATE INDEX "idx_quality_history_severity" ON "public"."quality_history" USING "btree" ("severity_level");



CREATE INDEX "idx_reports_created_at" ON "public"."reports" USING "btree" ("created_at");



CREATE INDEX "idx_reports_org_id" ON "public"."reports" USING "btree" ("org_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "idx_service_price_table_component" ON "public"."service_price_table" USING "btree" ("component");



CREATE INDEX "idx_service_price_table_engine_type" ON "public"."service_price_table" USING "btree" ("engine_type_id");



CREATE INDEX "idx_service_price_table_org" ON "public"."service_price_table" USING "btree" ("org_id");



CREATE INDEX "idx_status_config_engine_type" ON "public"."status_config" USING "btree" ("engine_type_id");



CREATE INDEX "idx_stock_alerts_active" ON "public"."stock_alerts" USING "btree" ("is_active");



CREATE INDEX "idx_stock_alerts_level" ON "public"."stock_alerts" USING "btree" ("alert_level");



CREATE INDEX "idx_stock_alerts_org" ON "public"."stock_alerts" USING "btree" ("org_id");



CREATE INDEX "idx_stock_alerts_org_part" ON "public"."stock_alerts" USING "btree" ("org_id", "part_code") WHERE (("part_code" IS NOT NULL) AND ("is_active" = true));



CREATE INDEX "idx_stock_alerts_part" ON "public"."stock_alerts" USING "btree" ("part_code");



CREATE INDEX "idx_supplier_performance_date" ON "public"."supplier_performance_history" USING "btree" ("recorded_at");



CREATE INDEX "idx_supplier_performance_part" ON "public"."supplier_performance_history" USING "btree" ("part_code");



CREATE INDEX "idx_supplier_performance_supplier" ON "public"."supplier_performance_history" USING "btree" ("supplier_id");



CREATE INDEX "idx_supplier_suggestions_need" ON "public"."supplier_suggestions" USING "btree" ("purchase_need_id");



CREATE INDEX "idx_supplier_suggestions_score" ON "public"."supplier_suggestions" USING "btree" ("cost_benefit_score");



CREATE INDEX "idx_supplier_suggestions_supplier" ON "public"."supplier_suggestions" USING "btree" ("supplier_id");



CREATE INDEX "idx_tax_calculations_order" ON "public"."tax_calculations" USING "btree" ("order_id");



CREATE INDEX "idx_tax_calculations_org_id" ON "public"."tax_calculations" USING "btree" ("org_id");



CREATE INDEX "idx_tax_calculations_regime" ON "public"."tax_calculations" USING "btree" ("regime_id");



CREATE INDEX "idx_tax_ledgers_org_id" ON "public"."tax_ledgers" USING "btree" ("org_id");



CREATE INDEX "idx_tax_ledgers_period" ON "public"."tax_ledgers" USING "btree" ("period_year", "period_month");



CREATE INDEX "idx_tax_ledgers_tax_type" ON "public"."tax_ledgers" USING "btree" ("tax_type_id");



CREATE INDEX "idx_tax_rate_tables_org_id" ON "public"."tax_rate_tables" USING "btree" ("org_id");



CREATE INDEX "idx_tax_regimes_org_id" ON "public"."tax_regimes" USING "btree" ("org_id");



CREATE INDEX "idx_tax_rules_org_id" ON "public"."tax_rules" USING "btree" ("org_id");



CREATE INDEX "idx_tax_types_org_id" ON "public"."tax_types" USING "btree" ("org_id");



CREATE INDEX "idx_technical_report_templates_org" ON "public"."technical_report_templates" USING "btree" ("org_id");



CREATE INDEX "idx_technical_report_templates_standard" ON "public"."technical_report_templates" USING "btree" ("technical_standard");



CREATE INDEX "idx_technical_report_templates_type" ON "public"."technical_report_templates" USING "btree" ("report_type");



CREATE INDEX "idx_technical_reports_component" ON "public"."technical_reports" USING "btree" ("component");



CREATE INDEX "idx_technical_reports_conformity" ON "public"."technical_reports" USING "btree" ("conformity_status");



CREATE INDEX "idx_technical_reports_number" ON "public"."technical_reports" USING "btree" ("report_number");



CREATE INDEX "idx_technical_reports_order" ON "public"."technical_reports" USING "btree" ("order_id");



CREATE INDEX "idx_technical_reports_type" ON "public"."technical_reports" USING "btree" ("report_type");



CREATE INDEX "idx_technical_standards_config_code" ON "public"."technical_standards_config" USING "btree" ("standard_code");



CREATE INDEX "idx_technical_standards_config_org" ON "public"."technical_standards_config" USING "btree" ("org_id");



CREATE INDEX "idx_user_achievements_earned_at" ON "public"."user_achievements" USING "btree" ("earned_at");



CREATE INDEX "idx_user_achievements_org_user" ON "public"."user_achievements" USING "btree" ("org_id", "user_id");



CREATE INDEX "idx_user_achievements_type" ON "public"."user_achievements" USING "btree" ("achievement_type");



CREATE INDEX "idx_user_basic_info_email" ON "public"."user_basic_info" USING "btree" ("email");



CREATE INDEX "idx_user_basic_info_user_id" ON "public"."user_basic_info" USING "btree" ("user_id");



CREATE INDEX "idx_user_profile_assignments_org_id" ON "public"."user_profile_assignments" USING "btree" ("org_id");



CREATE INDEX "idx_user_profile_assignments_profile_id" ON "public"."user_profile_assignments" USING "btree" ("profile_id");



CREATE INDEX "idx_user_profile_assignments_user_id" ON "public"."user_profile_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_org_id" ON "public"."user_profiles" USING "btree" ("org_id");



CREATE INDEX "idx_user_profiles_sector_id" ON "public"."user_profiles" USING "btree" ("sector_id");



CREATE INDEX "idx_user_score_history_created_at" ON "public"."user_score_history" USING "btree" ("created_at");



CREATE INDEX "idx_user_score_history_org_user" ON "public"."user_score_history" USING "btree" ("org_id", "user_id");



CREATE INDEX "idx_user_scores_level" ON "public"."user_scores" USING "btree" ("current_level");



CREATE INDEX "idx_user_scores_org_user" ON "public"."user_scores" USING "btree" ("org_id", "user_id");



CREATE INDEX "idx_user_scores_points" ON "public"."user_scores" USING "btree" ("total_points");



CREATE INDEX "idx_user_sectors_org_id" ON "public"."user_sectors" USING "btree" ("org_id");



CREATE INDEX "idx_workflow_checklist_items_checklist" ON "public"."workflow_checklist_items" USING "btree" ("checklist_id");



CREATE INDEX "idx_workflow_checklist_items_critical" ON "public"."workflow_checklist_items" USING "btree" ("is_critical");



CREATE INDEX "idx_workflow_checklist_items_order" ON "public"."workflow_checklist_items" USING "btree" ("display_order");



CREATE INDEX "idx_workflow_checklist_responses_checklist" ON "public"."workflow_checklist_responses" USING "btree" ("checklist_id");



CREATE INDEX "idx_workflow_checklist_responses_component" ON "public"."workflow_checklist_responses" USING "btree" ("component");



CREATE INDEX "idx_workflow_checklist_responses_order" ON "public"."workflow_checklist_responses" USING "btree" ("order_id");



CREATE INDEX "idx_workflow_checklist_responses_order_workflow" ON "public"."workflow_checklist_responses" USING "btree" ("order_workflow_id");



CREATE INDEX "idx_workflow_checklist_responses_status" ON "public"."workflow_checklist_responses" USING "btree" ("overall_status");



CREATE INDEX "idx_workflow_checklists_component" ON "public"."workflow_checklists" USING "btree" ("component");



CREATE INDEX "idx_workflow_checklists_engine_type" ON "public"."workflow_checklists" USING "btree" ("engine_type_id");



CREATE INDEX "idx_workflow_checklists_org" ON "public"."workflow_checklists" USING "btree" ("org_id");



CREATE INDEX "idx_workflow_checklists_standard" ON "public"."workflow_checklists" USING "btree" ("technical_standard");



CREATE INDEX "idx_workflow_checklists_step" ON "public"."workflow_checklists" USING "btree" ("workflow_step_id");



CREATE INDEX "idx_workflow_checklists_step_component" ON "public"."workflow_checklists" USING "btree" ("step_key", "component", "is_mandatory", "is_active") WHERE (("is_mandatory" = true) AND ("is_active" = true));



CREATE INDEX "idx_workflow_responses_workflow_checklist" ON "public"."workflow_checklist_responses" USING "btree" ("order_workflow_id", "checklist_id", "overall_status");



CREATE INDEX "idx_workflow_status_history_date" ON "public"."workflow_status_history" USING "btree" ("changed_at");



CREATE INDEX "idx_workflow_status_history_order" ON "public"."workflow_status_history" USING "btree" ("order_workflow_id");



CREATE INDEX "idx_workflow_status_history_user" ON "public"."workflow_status_history" USING "btree" ("changed_by");



CREATE INDEX "idx_workflow_steps_component" ON "public"."workflow_steps" USING "btree" ("component");



CREATE INDEX "idx_workflow_steps_engine_type" ON "public"."workflow_steps" USING "btree" ("engine_type_id");



CREATE INDEX "obligation_files_generated_at_idx" ON "public"."obligation_files" USING "btree" ("generated_at");



CREATE INDEX "obligation_files_obligation_id_idx" ON "public"."obligation_files" USING "btree" ("obligation_id");



CREATE INDEX "tax_calc_order_idx" ON "public"."tax_calculations" USING "btree" ("order_id", "calculated_at" DESC);



CREATE INDEX "tax_rate_idx" ON "public"."tax_rate_tables" USING "btree" ("tax_type_id", "jurisdiction_code", "classification_id", "valid_from");



CREATE INDEX "tax_rules_query_idx" ON "public"."tax_rules" USING "btree" ("regime_id", "tax_type_id", "operation", "classification_id", "origin_uf", "destination_uf", "is_active", "valid_from");



CREATE OR REPLACE TRIGGER "auto_parts_reservation_trigger" AFTER INSERT ON "public"."budget_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."auto_reserve_parts_on_budget_approval"();



CREATE OR REPLACE TRIGGER "bosch_auto_identification_trigger" BEFORE INSERT OR UPDATE ON "public"."engines" FOR EACH ROW EXECUTE FUNCTION "public"."identify_bosch_components"();



CREATE OR REPLACE TRIGGER "calculate_supplier_suggestions_trigger" AFTER INSERT OR UPDATE ON "public"."purchase_needs" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_supplier_suggestions"();



CREATE OR REPLACE TRIGGER "create_warranty_trigger" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."create_order_warranty"();



CREATE OR REPLACE TRIGGER "order_status_change_trigger" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."log_order_status_change"();



CREATE OR REPLACE TRIGGER "set_purchase_order_number" BEFORE INSERT ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_po_number"();



CREATE OR REPLACE TRIGGER "set_purchase_requisition_number" BEFORE INSERT ON "public"."purchase_requisitions" FOR EACH ROW EXECUTE FUNCTION "public"."set_requisition_number"();



CREATE OR REPLACE TRIGGER "trg_auto_reorder_on_low_stock" AFTER UPDATE OF "quantity" ON "public"."parts_inventory" FOR EACH ROW WHEN (("new"."quantity" < "old"."quantity")) EXECUTE FUNCTION "public"."check_stock_and_create_purchase_need"();



COMMENT ON TRIGGER "trg_auto_reorder_on_low_stock" ON "public"."parts_inventory" IS 'Cria necessidade de compra automática quando estoque baixo (se auto_reorder habilitado). NÃO cria stock_alerts (feito pelo trigger de aprovação).';



CREATE OR REPLACE TRIGGER "trg_budget_approval_actions" AFTER INSERT ON "public"."budget_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."fn_process_budget_approval"();



CREATE OR REPLACE TRIGGER "trg_company_fiscal_settings_updated_at" BEFORE UPDATE ON "public"."company_fiscal_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_fiscal_class_updated_at" BEFORE UPDATE ON "public"."fiscal_classifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_notify_budget_approved" AFTER INSERT ON "public"."budget_approvals" FOR EACH ROW WHEN ((("new"."approval_type")::"text" = ANY ((ARRAY['total'::character varying, 'parcial'::character varying])::"text"[]))) EXECUTE FUNCTION "public"."notify_budget_approved"();



CREATE OR REPLACE TRIGGER "trg_notify_budget_pending" AFTER INSERT ON "public"."budget_alerts" FOR EACH ROW WHEN (("new"."is_active" = true)) EXECUTE FUNCTION "public"."notify_budget_pending"();



CREATE OR REPLACE TRIGGER "trg_notify_purchase_need" AFTER INSERT ON "public"."purchase_needs" FOR EACH ROW WHEN ((("new"."status")::"text" = 'pending'::"text")) EXECUTE FUNCTION "public"."notify_purchase_need"();



CREATE OR REPLACE TRIGGER "trg_notify_stock_minimum" AFTER INSERT ON "public"."stock_alerts" FOR EACH ROW WHEN (("new"."is_active" = true)) EXECUTE FUNCTION "public"."notify_stock_minimum"();



CREATE OR REPLACE TRIGGER "trg_notify_technical_report" AFTER INSERT ON "public"."technical_reports" FOR EACH ROW EXECUTE FUNCTION "public"."notify_technical_report"();



CREATE OR REPLACE TRIGGER "trg_obligation_kinds_updated_at" BEFORE UPDATE ON "public"."obligation_kinds" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_obligations_updated_at" BEFORE UPDATE ON "public"."obligations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_order_delivered_warranty" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."fn_create_order_warranty"();



CREATE OR REPLACE TRIGGER "trg_stock_minimum_alert" AFTER UPDATE OF "quantity" ON "public"."parts_inventory" FOR EACH ROW WHEN (("new"."quantity" < "old"."quantity")) EXECUTE FUNCTION "public"."fn_check_stock_minimum"();



COMMENT ON TRIGGER "trg_stock_minimum_alert" ON "public"."parts_inventory" IS 'DESABILITADO PERMANENTEMENTE - Lógica movida para auto_reserve_parts_on_budget_approval() para evitar conflitos ON CONFLICT';



CREATE OR REPLACE TRIGGER "trg_tax_calculations_updated_at" BEFORE UPDATE ON "public"."tax_calculations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tax_ledgers_updated_at" BEFORE UPDATE ON "public"."tax_ledgers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tax_rate_tables_updated_at" BEFORE UPDATE ON "public"."tax_rate_tables" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tax_regimes_updated_at" BEFORE UPDATE ON "public"."tax_regimes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tax_rules_updated_at" BEFORE UPDATE ON "public"."tax_rules" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tax_types_updated_at" BEFORE UPDATE ON "public"."tax_types" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_archive_dismissed_alert" AFTER UPDATE ON "public"."alerts" FOR EACH ROW EXECUTE FUNCTION "public"."archive_dismissed_alert"();



CREATE OR REPLACE TRIGGER "trigger_auto_generate_budget_number" BEFORE INSERT ON "public"."detailed_budgets" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_budget_number"();



COMMENT ON TRIGGER "trigger_auto_generate_budget_number" ON "public"."detailed_budgets" IS 'Gera automaticamente budget_number antes de inserir novo orçamento.';



CREATE OR REPLACE TRIGGER "trigger_auto_generate_claim_number" BEFORE INSERT ON "public"."warranty_claims" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_claim_number"();



CREATE OR REPLACE TRIGGER "trigger_auto_generate_technical_report" AFTER INSERT OR UPDATE ON "public"."workflow_checklist_responses" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_technical_report"();



CREATE OR REPLACE TRIGGER "trigger_calculate_budget_totals" BEFORE INSERT OR UPDATE ON "public"."detailed_budgets" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_budget_totals"();



CREATE OR REPLACE TRIGGER "trigger_calculate_checklist_completion" BEFORE INSERT OR UPDATE ON "public"."workflow_checklist_responses" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_checklist_completion"();



CREATE OR REPLACE TRIGGER "trigger_calculate_supplier_performance" BEFORE INSERT OR UPDATE ON "public"."supplier_performance_history" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_supplier_performance"();



CREATE OR REPLACE TRIGGER "trigger_calculate_warranty_rate" BEFORE INSERT OR UPDATE ON "public"."warranty_indicators" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_warranty_rate"();



CREATE OR REPLACE TRIGGER "trigger_check_mandatory_checklists" BEFORE UPDATE ON "public"."order_workflow" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."check_mandatory_checklists_before_workflow_advance"();



CREATE OR REPLACE TRIGGER "trigger_check_minimum_stock" AFTER UPDATE ON "public"."parts_inventory" FOR EACH ROW WHEN (("old"."quantity" IS DISTINCT FROM "new"."quantity")) EXECUTE FUNCTION "public"."check_minimum_stock_levels"();



COMMENT ON TRIGGER "trigger_check_minimum_stock" ON "public"."parts_inventory" IS 'DESABILITADO PERMANENTEMENTE - Lógica movida para auto_reserve_parts_on_budget_approval() para evitar conflitos ON CONFLICT';



CREATE OR REPLACE TRIGGER "trigger_create_inventory_entry" AFTER INSERT ON "public"."purchase_receipt_items" FOR EACH ROW WHEN ((("new"."part_id" IS NOT NULL) AND ("new"."quality_status" = 'approved'::"text"))) EXECUTE FUNCTION "public"."create_inventory_entry_on_receipt"();



CREATE OR REPLACE TRIGGER "trigger_create_stock_notification" AFTER INSERT ON "public"."stock_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."create_stock_notification"();



CREATE OR REPLACE TRIGGER "trigger_create_stock_notification_update" AFTER UPDATE ON "public"."stock_alerts" FOR EACH ROW WHEN (((("old"."alert_type")::"text" IS DISTINCT FROM ("new"."alert_type")::"text") OR ("old"."is_active" IS DISTINCT FROM "new"."is_active"))) EXECUTE FUNCTION "public"."create_stock_notification"();



CREATE OR REPLACE TRIGGER "trigger_create_workflow" AFTER INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_workflow"();



CREATE OR REPLACE TRIGGER "trigger_generate_accounts_receivable" AFTER UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."generate_accounts_receivable"();



CREATE OR REPLACE TRIGGER "trigger_log_quality_event" AFTER INSERT OR UPDATE ON "public"."workflow_checklist_responses" FOR EACH ROW EXECUTE FUNCTION "public"."log_quality_event"();



CREATE OR REPLACE TRIGGER "trigger_set_budget_approvals_org_id" BEFORE INSERT OR UPDATE ON "public"."budget_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."set_budget_approvals_org_id"();



CREATE OR REPLACE TRIGGER "trigger_set_customer_created_by" BEFORE INSERT ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_customer_created_by"();



CREATE OR REPLACE TRIGGER "trigger_set_detailed_budgets_org_id" BEFORE INSERT OR UPDATE ON "public"."detailed_budgets" FOR EACH ROW EXECUTE FUNCTION "public"."set_detailed_budgets_org_id"();



CREATE OR REPLACE TRIGGER "trigger_set_diagnostic_response_org_id" BEFORE INSERT OR UPDATE ON "public"."diagnostic_checklist_responses" FOR EACH ROW EXECUTE FUNCTION "public"."set_diagnostic_response_org_id"();



CREATE OR REPLACE TRIGGER "trigger_set_order_number" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_number"();



CREATE OR REPLACE TRIGGER "trigger_set_parts_inventory_org_id" BEFORE INSERT OR UPDATE ON "public"."parts_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."set_parts_inventory_org_id"();



CREATE OR REPLACE TRIGGER "trigger_set_workflow_status_history_org_id" BEFORE INSERT OR UPDATE ON "public"."workflow_status_history" FOR EACH ROW EXECUTE FUNCTION "public"."set_workflow_status_history_org_id"();



COMMENT ON TRIGGER "trigger_set_workflow_status_history_org_id" ON "public"."workflow_status_history" IS 'Auto-populates org_id before insert/update';



CREATE OR REPLACE TRIGGER "trigger_update_goal_status" BEFORE INSERT OR UPDATE OF "progress_current", "target_value", "target_period_end" ON "public"."kpi_targets" FOR EACH ROW EXECUTE FUNCTION "public"."update_goal_status"();



CREATE OR REPLACE TRIGGER "trigger_update_inventory_on_movement" AFTER INSERT ON "public"."inventory_movements" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_on_movement"();



CREATE OR REPLACE TRIGGER "trigger_update_po_on_receipt" AFTER INSERT OR UPDATE ON "public"."purchase_receipt_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_purchase_order_on_receipt"();



CREATE OR REPLACE TRIGGER "trigger_update_stock_status" BEFORE UPDATE ON "public"."parts_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_stock_status_on_zero"();



CREATE OR REPLACE TRIGGER "trigger_updated_at_budgets" BEFORE UPDATE ON "public"."budgets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_updated_at_consultants" BEFORE UPDATE ON "public"."consultants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_updated_at_customers" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_updated_at_engines" BEFORE UPDATE ON "public"."engines" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_updated_at_order_workflow" BEFORE UPDATE ON "public"."order_workflow" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_updated_at_orders" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_validate_inventory_movement" BEFORE INSERT ON "public"."inventory_movements" FOR EACH ROW EXECUTE FUNCTION "public"."validate_inventory_movement"();



CREATE OR REPLACE TRIGGER "update_accounts_payable_updated_at" BEFORE UPDATE ON "public"."accounts_payable" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_accounts_receivable_updated_at" BEFORE UPDATE ON "public"."accounts_receivable" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_alerts_updated_at" BEFORE UPDATE ON "public"."alerts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bank_accounts_updated_at" BEFORE UPDATE ON "public"."bank_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cash_flow_projection_updated_at" BEFORE UPDATE ON "public"."cash_flow_projection" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cash_flow_updated_at" BEFORE UPDATE ON "public"."cash_flow" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_commission_calculations_updated_at" BEFORE UPDATE ON "public"."commission_calculations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_dashboard_preferences_updated_at" BEFORE UPDATE ON "public"."dashboard_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_employees_updated_at" BEFORE UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_inventory_counts_updated_at" BEFORE UPDATE ON "public"."inventory_counts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jurisdiction_config_updated_at" BEFORE UPDATE ON "public"."jurisdiction_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_jurisdiction_config_updated_at"();



CREATE OR REPLACE TRIGGER "update_kpi_targets_updated_at" BEFORE UPDATE ON "public"."kpi_targets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_kpis_updated_at" BEFORE UPDATE ON "public"."kpis" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_monthly_dre_updated_at" BEFORE UPDATE ON "public"."monthly_dre" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notification_types_updated_at" BEFORE UPDATE ON "public"."notification_types" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_obligation_files_updated_at" BEFORE UPDATE ON "public"."obligation_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_obligations_updated_at" BEFORE UPDATE ON "public"."obligations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_order_materials_updated_at" BEFORE UPDATE ON "public"."order_materials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_order_warranties_updated_at" BEFORE UPDATE ON "public"."order_warranties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organization_themes_updated_at" BEFORE UPDATE ON "public"."organization_themes" FOR EACH ROW EXECUTE FUNCTION "public"."update_organization_themes_updated_at"();



CREATE OR REPLACE TRIGGER "update_organization_users_updated_at" BEFORE UPDATE ON "public"."organization_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_methods_updated_at" BEFORE UPDATE ON "public"."payment_methods" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_performance_reviews_updated_at" BEFORE UPDATE ON "public"."performance_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_production_schedules_updated_at" BEFORE UPDATE ON "public"."production_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchase_orders_updated_at" BEFORE UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchase_receipts_updated_at" BEFORE UPDATE ON "public"."purchase_receipts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchase_requisitions_updated_at" BEFORE UPDATE ON "public"."purchase_requisitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quick_actions_updated_at" BEFORE UPDATE ON "public"."quick_actions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quotations_updated_at" BEFORE UPDATE ON "public"."quotations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_report_catalog_updated_at" BEFORE UPDATE ON "public"."report_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reports_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_resource_capacity_updated_at" BEFORE UPDATE ON "public"."resource_capacity" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_search_sources_updated_at" BEFORE UPDATE ON "public"."search_sources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_status_config_updated_at" BEFORE UPDATE ON "public"."status_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_supplier_performance_trigger" AFTER INSERT OR UPDATE ON "public"."supplier_performance_history" FOR EACH ROW EXECUTE FUNCTION "public"."update_supplier_performance"();



CREATE OR REPLACE TRIGGER "update_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_config_updated_at" BEFORE UPDATE ON "public"."system_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_pages_updated_at" BEFORE UPDATE ON "public"."system_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_basic_info_updated_at" BEFORE UPDATE ON "public"."user_basic_info" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_sectors_updated_at" BEFORE UPDATE ON "public"."user_sectors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_bosch_parts_trigger" BEFORE INSERT OR UPDATE ON "public"."parts_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."validate_bosch_parts"();



ALTER TABLE ONLY "public"."accounts_payable"
    ADD CONSTRAINT "accounts_payable_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "public"."expense_categories"("id");



ALTER TABLE ONLY "public"."accounts_payable"
    ADD CONSTRAINT "accounts_payable_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."detailed_budgets"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "accounts_receivable_budget_id_fkey" ON "public"."accounts_receivable" IS 'FK para detailed_budgets (nova tabela de orçamentos). budget_id é nullable pois nem toda conta vem de orçamento.';



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."alert_history"
    ADD CONSTRAINT "alert_history_dismissed_by_fkey" FOREIGN KEY ("dismissed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."alert_history"
    ADD CONSTRAINT "alert_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_alerts"
    ADD CONSTRAINT "budget_alerts_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."detailed_budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_alerts"
    ADD CONSTRAINT "budget_alerts_dismissed_by_fkey" FOREIGN KEY ("dismissed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."detailed_budgets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."budget_approvals"
    ADD CONSTRAINT "budget_approvals_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."budgets"
    ADD CONSTRAINT "budgets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cash_flow"
    ADD CONSTRAINT "cash_flow_accounts_payable_id_fkey" FOREIGN KEY ("accounts_payable_id") REFERENCES "public"."accounts_payable"("id");



ALTER TABLE ONLY "public"."cash_flow"
    ADD CONSTRAINT "cash_flow_accounts_receivable_id_fkey" FOREIGN KEY ("accounts_receivable_id") REFERENCES "public"."accounts_receivable"("id");



ALTER TABLE ONLY "public"."cash_flow"
    ADD CONSTRAINT "cash_flow_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id");



ALTER TABLE ONLY "public"."cash_flow"
    ADD CONSTRAINT "cash_flow_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id");



ALTER TABLE ONLY "public"."cash_flow"
    ADD CONSTRAINT "cash_flow_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."commission_calculations"
    ADD CONSTRAINT "commission_calculations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."commission_calculations"
    ADD CONSTRAINT "commission_calculations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."commission_calculations"
    ADD CONSTRAINT "commission_calculations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."company_fiscal_settings"
    ADD CONSTRAINT "company_fiscal_settings_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."company_fiscal_settings"
    ADD CONSTRAINT "company_fiscal_settings_regime_id_fkey" FOREIGN KEY ("regime_id") REFERENCES "public"."tax_regimes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."detailed_budgets"
    ADD CONSTRAINT "detailed_budgets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."detailed_budgets"
    ADD CONSTRAINT "detailed_budgets_diagnostic_response_id_fkey" FOREIGN KEY ("diagnostic_response_id") REFERENCES "public"."diagnostic_checklist_responses"("id");



ALTER TABLE ONLY "public"."detailed_budgets"
    ADD CONSTRAINT "detailed_budgets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."detailed_budgets"
    ADD CONSTRAINT "detailed_budgets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."diagnostic_checklist_items"
    ADD CONSTRAINT "diagnostic_checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."diagnostic_checklists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diagnostic_checklist_responses"
    ADD CONSTRAINT "diagnostic_checklist_responses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."diagnostic_checklist_responses"
    ADD CONSTRAINT "diagnostic_checklist_responses_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."diagnostic_checklists"("id");



ALTER TABLE ONLY "public"."diagnostic_checklist_responses"
    ADD CONSTRAINT "diagnostic_checklist_responses_diagnosed_by_fkey" FOREIGN KEY ("diagnosed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."diagnostic_checklist_responses"
    ADD CONSTRAINT "diagnostic_checklist_responses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."diagnostic_checklist_responses"
    ADD CONSTRAINT "diagnostic_checklist_responses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."diagnostic_checklists"
    ADD CONSTRAINT "diagnostic_checklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."diagnostic_checklists"
    ADD CONSTRAINT "diagnostic_checklists_engine_type_id_fkey" FOREIGN KEY ("engine_type_id") REFERENCES "public"."engine_types"("id");



ALTER TABLE ONLY "public"."diagnostic_checklists"
    ADD CONSTRAINT "diagnostic_checklists_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."employee_time_tracking"
    ADD CONSTRAINT "employee_time_tracking_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."employee_time_tracking"
    ADD CONSTRAINT "employee_time_tracking_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."employee_time_tracking"
    ADD CONSTRAINT "employee_time_tracking_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."engine_types"
    ADD CONSTRAINT "engine_types_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."engines"
    ADD CONSTRAINT "engines_engine_type_id_fkey" FOREIGN KEY ("engine_type_id") REFERENCES "public"."engine_types"("id");



ALTER TABLE ONLY "public"."engines"
    ADD CONSTRAINT "engines_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."entry_form_fields"
    ADD CONSTRAINT "entry_form_fields_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."entry_form_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entry_form_submissions"
    ADD CONSTRAINT "entry_form_submissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."entry_form_submissions"
    ADD CONSTRAINT "entry_form_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entry_form_submissions"
    ADD CONSTRAINT "entry_form_submissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."entry_form_templates"("id");



ALTER TABLE ONLY "public"."entry_form_templates"
    ADD CONSTRAINT "entry_form_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."entry_form_templates"
    ADD CONSTRAINT "entry_form_templates_engine_type_id_fkey" FOREIGN KEY ("engine_type_id") REFERENCES "public"."engine_types"("id");



ALTER TABLE ONLY "public"."entry_form_templates"
    ADD CONSTRAINT "entry_form_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."environment_reservations"
    ADD CONSTRAINT "environment_reservations_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "public"."special_environments"("id");



ALTER TABLE ONLY "public"."environment_reservations"
    ADD CONSTRAINT "environment_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."environment_reservations"
    ADD CONSTRAINT "environment_reservations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."environment_reservations"
    ADD CONSTRAINT "environment_reservations_reserved_by_fkey" FOREIGN KEY ("reserved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."fiscal_audit_log"
    ADD CONSTRAINT "fiscal_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."fiscal_classifications"
    ADD CONSTRAINT "fiscal_classifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."obligation_files"
    ADD CONSTRAINT "fk_obligation_files_obligation" FOREIGN KEY ("obligation_id") REFERENCES "public"."obligations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obligations"
    ADD CONSTRAINT "fk_obligations_obligation_kind" FOREIGN KEY ("obligation_kind_id") REFERENCES "public"."obligation_kinds"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."kpi_targets"
    ADD CONSTRAINT "fk_parent_goal" FOREIGN KEY ("parent_goal_id") REFERENCES "public"."kpi_targets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "fk_tax_calculations_classification" FOREIGN KEY ("classification_id") REFERENCES "public"."fiscal_classifications"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "fk_tax_calculations_regime" FOREIGN KEY ("regime_id") REFERENCES "public"."tax_regimes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tax_rate_tables"
    ADD CONSTRAINT "fk_tax_rate_tables_classification" FOREIGN KEY ("classification_id") REFERENCES "public"."fiscal_classifications"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tax_rate_tables"
    ADD CONSTRAINT "fk_tax_rate_tables_tax_type" FOREIGN KEY ("tax_type_id") REFERENCES "public"."tax_types"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."inventory_count_items"
    ADD CONSTRAINT "inventory_count_items_count_id_fkey" FOREIGN KEY ("count_id") REFERENCES "public"."inventory_counts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_count_items"
    ADD CONSTRAINT "inventory_count_items_counted_by_fkey" FOREIGN KEY ("counted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_count_items"
    ADD CONSTRAINT "inventory_count_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_counts"
    ADD CONSTRAINT "inventory_counts_counted_by_fkey" FOREIGN KEY ("counted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_counts"
    ADD CONSTRAINT "inventory_counts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_counts"
    ADD CONSTRAINT "inventory_counts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_counts"
    ADD CONSTRAINT "inventory_counts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."detailed_budgets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jurisdiction_config"
    ADD CONSTRAINT "jurisdiction_config_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."kpi_targets"
    ADD CONSTRAINT "kpi_targets_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kpi_targets"
    ADD CONSTRAINT "kpi_targets_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_notification_type_id_fkey" FOREIGN KEY ("notification_type_id") REFERENCES "public"."notification_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obligation_files"
    ADD CONSTRAINT "obligation_files_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "public"."obligations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obligation_kinds"
    ADD CONSTRAINT "obligation_kinds_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."obligations"
    ADD CONSTRAINT "obligations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."obligations"
    ADD CONSTRAINT "obligations_obligation_kind_id_fkey" FOREIGN KEY ("obligation_kind_id") REFERENCES "public"."obligation_kinds"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."obligations"
    ADD CONSTRAINT "obligations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."order_materials"
    ADD CONSTRAINT "order_materials_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_materials"
    ADD CONSTRAINT "order_materials_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."order_materials"
    ADD CONSTRAINT "order_materials_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id");



ALTER TABLE ONLY "public"."order_materials"
    ADD CONSTRAINT "order_materials_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."order_photos"
    ADD CONSTRAINT "order_photos_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."order_warranties"
    ADD CONSTRAINT "order_warranties_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_warranties"
    ADD CONSTRAINT "order_warranties_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."order_workflow"
    ADD CONSTRAINT "order_workflow_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."order_workflow"
    ADD CONSTRAINT "order_workflow_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_workflow"
    ADD CONSTRAINT "order_workflow_workflow_step_id_fkey" FOREIGN KEY ("workflow_step_id") REFERENCES "public"."workflow_steps"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_engine_id_fkey" FOREIGN KEY ("engine_id") REFERENCES "public"."engines"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."organization_themes"
    ADD CONSTRAINT "organization_themes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_users"
    ADD CONSTRAINT "organization_users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."organization_users"
    ADD CONSTRAINT "organization_users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_users"
    ADD CONSTRAINT "organization_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."parts_inventory"
    ADD CONSTRAINT "parts_inventory_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parts_price_table"
    ADD CONSTRAINT "parts_price_table_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_applied_by_fkey" FOREIGN KEY ("applied_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "public"."detailed_budgets"("id");



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id");



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_reserved_by_fkey" FOREIGN KEY ("reserved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."parts_reservations"
    ADD CONSTRAINT "parts_reservations_separated_by_fkey" FOREIGN KEY ("separated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."parts_stock_config"
    ADD CONSTRAINT "parts_stock_config_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."parts_stock_config"
    ADD CONSTRAINT "parts_stock_config_preferred_supplier_id_fkey" FOREIGN KEY ("preferred_supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."parts_stock_config"
    ADD CONSTRAINT "parts_stock_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."performance_rankings"
    ADD CONSTRAINT "performance_rankings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."performance_reviews"
    ADD CONSTRAINT "performance_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."production_alerts"
    ADD CONSTRAINT "production_alerts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."production_alerts"
    ADD CONSTRAINT "production_alerts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."production_alerts"
    ADD CONSTRAINT "production_alerts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."production_schedules"("id");



ALTER TABLE ONLY "public"."production_schedules"
    ADD CONSTRAINT "production_schedules_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."production_schedules"
    ADD CONSTRAINT "production_schedules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."profile_page_permissions"
    ADD CONSTRAINT "profile_page_permissions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."system_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_page_permissions"
    ADD CONSTRAINT "profile_page_permissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_efficiency_reports"
    ADD CONSTRAINT "purchase_efficiency_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."purchase_efficiency_reports"
    ADD CONSTRAINT "purchase_efficiency_reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."purchase_needs"
    ADD CONSTRAINT "purchase_needs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "public"."purchase_requisitions"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."purchase_receipt_items"
    ADD CONSTRAINT "purchase_receipt_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts_inventory"("id");



ALTER TABLE ONLY "public"."purchase_receipt_items"
    ADD CONSTRAINT "purchase_receipt_items_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_receipt_items"
    ADD CONSTRAINT "purchase_receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "public"."purchase_receipts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_receipts"
    ADD CONSTRAINT "purchase_receipts_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."purchase_requisition_items"
    ADD CONSTRAINT "purchase_requisition_items_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "public"."purchase_requisitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_requisitions"
    ADD CONSTRAINT "purchase_requisitions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."purchase_requisitions"
    ADD CONSTRAINT "purchase_requisitions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."purchase_requisitions"
    ADD CONSTRAINT "purchase_requisitions_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."quality_history"
    ADD CONSTRAINT "quality_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."quality_history"
    ADD CONSTRAINT "quality_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."quality_history"
    ADD CONSTRAINT "quality_history_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."quality_history"
    ADD CONSTRAINT "quality_history_related_checklist_id_fkey" FOREIGN KEY ("related_checklist_id") REFERENCES "public"."workflow_checklists"("id");



ALTER TABLE ONLY "public"."quality_history"
    ADD CONSTRAINT "quality_history_related_report_id_fkey" FOREIGN KEY ("related_report_id") REFERENCES "public"."technical_reports"("id");



ALTER TABLE ONLY "public"."quality_history"
    ADD CONSTRAINT "quality_history_related_response_id_fkey" FOREIGN KEY ("related_response_id") REFERENCES "public"."workflow_checklist_responses"("id");



ALTER TABLE ONLY "public"."quotation_items"
    ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_requisition_id_fkey" FOREIGN KEY ("requisition_id") REFERENCES "public"."purchase_requisitions"("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."resource_capacity"
    ADD CONSTRAINT "resource_capacity_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."service_price_table"
    ADD CONSTRAINT "service_price_table_engine_type_id_fkey" FOREIGN KEY ("engine_type_id") REFERENCES "public"."engine_types"("id");



ALTER TABLE ONLY "public"."service_price_table"
    ADD CONSTRAINT "service_price_table_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."special_environments"
    ADD CONSTRAINT "special_environments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."status_config"
    ADD CONSTRAINT "status_config_engine_type_id_fkey" FOREIGN KEY ("engine_type_id") REFERENCES "public"."engine_types"("id");



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."supplier_performance_history"
    ADD CONSTRAINT "supplier_performance_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."supplier_performance_history"
    ADD CONSTRAINT "supplier_performance_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."supplier_suggestions"
    ADD CONSTRAINT "supplier_suggestions_purchase_need_id_fkey" FOREIGN KEY ("purchase_need_id") REFERENCES "public"."purchase_needs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_suggestions"
    ADD CONSTRAINT "supplier_suggestions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "public"."fiscal_classifications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tax_calculations"
    ADD CONSTRAINT "tax_calculations_regime_id_fkey" FOREIGN KEY ("regime_id") REFERENCES "public"."tax_regimes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tax_ledgers"
    ADD CONSTRAINT "tax_ledgers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tax_ledgers"
    ADD CONSTRAINT "tax_ledgers_regime_id_fkey" FOREIGN KEY ("regime_id") REFERENCES "public"."tax_regimes"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tax_ledgers"
    ADD CONSTRAINT "tax_ledgers_tax_type_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "public"."tax_types"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tax_rate_tables"
    ADD CONSTRAINT "tax_rate_tables_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "public"."fiscal_classifications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tax_rate_tables"
    ADD CONSTRAINT "tax_rate_tables_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tax_rate_tables"
    ADD CONSTRAINT "tax_rate_tables_tax_type_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "public"."tax_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_regimes"
    ADD CONSTRAINT "tax_regimes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tax_rules"
    ADD CONSTRAINT "tax_rules_classification_id_fkey" FOREIGN KEY ("classification_id") REFERENCES "public"."fiscal_classifications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tax_rules"
    ADD CONSTRAINT "tax_rules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."tax_rules"
    ADD CONSTRAINT "tax_rules_regime_id_fkey" FOREIGN KEY ("regime_id") REFERENCES "public"."tax_regimes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_rules"
    ADD CONSTRAINT "tax_rules_tax_type_id_fkey" FOREIGN KEY ("tax_type_id") REFERENCES "public"."tax_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tax_types"
    ADD CONSTRAINT "tax_types_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."technical_report_templates"
    ADD CONSTRAINT "technical_report_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."technical_report_templates"
    ADD CONSTRAINT "technical_report_templates_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."technical_reports"
    ADD CONSTRAINT "technical_reports_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."technical_reports"
    ADD CONSTRAINT "technical_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."technical_reports"
    ADD CONSTRAINT "technical_reports_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."technical_reports"
    ADD CONSTRAINT "technical_reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."technical_standards_config"
    ADD CONSTRAINT "technical_standards_config_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."time_logs"
    ADD CONSTRAINT "time_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_basic_info"
    ADD CONSTRAINT "user_basic_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profile_assignments"
    ADD CONSTRAINT "user_profile_assignments_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profile_assignments"
    ADD CONSTRAINT "user_profile_assignments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."user_sectors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_score_history"
    ADD CONSTRAINT "user_score_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_scores"
    ADD CONSTRAINT "user_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sectors"
    ADD CONSTRAINT "user_sectors_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_evaluated_by_fkey" FOREIGN KEY ("evaluated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_new_order_id_fkey" FOREIGN KEY ("new_order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_original_order_id_fkey" FOREIGN KEY ("original_order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."warranty_claims"
    ADD CONSTRAINT "warranty_claims_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."warranty_indicators"
    ADD CONSTRAINT "warranty_indicators_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."warranty_indicators"
    ADD CONSTRAINT "warranty_indicators_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."work_schedules"
    ADD CONSTRAINT "work_schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id");



ALTER TABLE ONLY "public"."work_schedules"
    ADD CONSTRAINT "work_schedules_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."workflow_checklist_items"
    ADD CONSTRAINT "workflow_checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."workflow_checklists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "workflow_checklist_responses_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "public"."workflow_checklists"("id");



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "workflow_checklist_responses_filled_by_fkey" FOREIGN KEY ("filled_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "workflow_checklist_responses_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "workflow_checklist_responses_order_workflow_id_fkey" FOREIGN KEY ("order_workflow_id") REFERENCES "public"."order_workflow"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "workflow_checklist_responses_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workflow_checklist_responses"
    ADD CONSTRAINT "workflow_checklist_responses_supervisor_approved_by_fkey" FOREIGN KEY ("supervisor_approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workflow_checklists"
    ADD CONSTRAINT "workflow_checklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workflow_checklists"
    ADD CONSTRAINT "workflow_checklists_engine_type_id_fkey" FOREIGN KEY ("engine_type_id") REFERENCES "public"."engine_types"("id");



ALTER TABLE ONLY "public"."workflow_checklists"
    ADD CONSTRAINT "workflow_checklists_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."workflow_checklists"
    ADD CONSTRAINT "workflow_checklists_workflow_step_id_fkey" FOREIGN KEY ("workflow_step_id") REFERENCES "public"."workflow_steps"("id");



ALTER TABLE ONLY "public"."workflow_status_history"
    ADD CONSTRAINT "workflow_status_history_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workflow_status_history"
    ADD CONSTRAINT "workflow_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workflow_status_history"
    ADD CONSTRAINT "workflow_status_history_order_workflow_id_fkey" FOREIGN KEY ("order_workflow_id") REFERENCES "public"."order_workflow"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_status_history"
    ADD CONSTRAINT "workflow_status_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."workflow_steps"
    ADD CONSTRAINT "workflow_steps_engine_type_id_fkey" FOREIGN KEY ("engine_type_id") REFERENCES "public"."engine_types"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and super admins can manage basic info" ON "public"."user_basic_info" USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."organization_users" "ou1"
     JOIN "public"."organization_users" "ou2" ON (("ou1"."organization_id" = "ou2"."organization_id")))
  WHERE (("ou1"."user_id" = "auth"."uid"()) AND ("ou2"."user_id" = "user_basic_info"."user_id") AND ("ou1"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("ou1"."is_active" = true))))));



CREATE POLICY "Admins can create system_config for their organization" ON "public"."system_config" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can delete engines from their organization" ON "public"."engines" FOR DELETE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can delete order photos" ON "public"."order_photos" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can delete system_config from their organization" ON "public"."system_config" FOR DELETE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage KPIs for their organization" ON "public"."kpis" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage achievement configs" ON "public"."achievement_configs" USING (("org_id" IN ( SELECT "achievement_configs"."org_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = 'admin'::"public"."app_role")))));



CREATE POLICY "Admins can manage alerts for their organization" ON "public"."alerts" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage diagnostic checklist items" ON "public"."diagnostic_checklist_items" USING (("checklist_id" IN ( SELECT "dc"."id"
   FROM "public"."diagnostic_checklists" "dc"
  WHERE ("dc"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))))));



CREATE POLICY "Admins can manage diagnostic checklists" ON "public"."diagnostic_checklists" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage engine types" ON "public"."engine_types" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage expense categories for their organization" ON "public"."expense_categories" USING ((("org_id" = "public"."current_org_id"()) AND "public"."has_org_role"("org_id", 'admin'::"public"."app_role"))) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Admins can manage notification types for their organization" ON "public"."notification_types" USING ((("org_id" = "public"."current_org_id"()) AND "public"."has_org_role"("org_id", 'admin'::"public"."app_role"))) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Admins can manage organization themes" ON "public"."organization_themes" USING ((("org_id" = "public"."current_org_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."organization_id" = "organization_themes"."org_id") AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])))))));



CREATE POLICY "Admins can manage parts prices" ON "public"."parts_price_table" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage profile assignments" ON "public"."user_profile_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."organization_id" = "user_profile_assignments"."org_id") AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Admins can manage profile permissions" ON "public"."profile_page_permissions" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_profiles" "up"
     JOIN "public"."organization_users" "ou" ON (("ou"."organization_id" = "up"."org_id")))
  WHERE (("up"."id" = "profile_page_permissions"."profile_id") AND ("ou"."user_id" = "auth"."uid"()) AND ("ou"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("ou"."is_active" = true)))));



CREATE POLICY "Admins can manage profiles" ON "public"."user_profiles" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."organization_id" = "user_profiles"."org_id") AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Admins can manage quick actions for their organization" ON "public"."quick_actions" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage report templates" ON "public"."technical_report_templates" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage report_catalog for their organization" ON "public"."report_catalog" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage search sources for their organization" ON "public"."search_sources" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage sectors" ON "public"."user_sectors" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."organization_id" = "user_sectors"."org_id") AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Admins can manage service prices" ON "public"."service_price_table" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage technical standards" ON "public"."technical_standards_config" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))));



CREATE POLICY "Admins can manage workflow checklists" ON "public"."workflow_checklists" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role", 'manager'::"public"."app_role"]))))));



CREATE POLICY "Admins can update system_config from their organization" ON "public"."system_config" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"])))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "All authenticated users can view system pages" ON "public"."system_pages" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow all operations on consultants for development" ON "public"."consultants" USING (true) WITH CHECK (true);



CREATE POLICY "Allow customers access for development" ON "public"."customers" USING (true) WITH CHECK (true);



CREATE POLICY "Allow order_workflow access for development" ON "public"."order_workflow" USING (true) WITH CHECK (true);



CREATE POLICY "Allow orders access for development" ON "public"."orders" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can manage cash flow projection" ON "public"."cash_flow_projection" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage order workflow" ON "public"."order_workflow" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage orders" ON "public"."orders" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage payment methods" ON "public"."payment_methods" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage status config" ON "public"."status_config" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage time logs" ON "public"."time_logs" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view cash flow projection" ON "public"."cash_flow_projection" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view payment methods" ON "public"."payment_methods" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Only owners can manage system pages" ON "public"."system_pages" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."role" = 'owner'::"public"."app_role") AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Only super admin can create organizations" ON "public"."organizations" FOR INSERT WITH CHECK ("public"."is_super_admin"());



CREATE POLICY "Org owners and admins can update organization" ON "public"."organizations" FOR UPDATE USING (("public"."has_org_role"("id", 'owner'::"public"."app_role") OR "public"."has_org_role"("id", 'admin'::"public"."app_role")));



CREATE POLICY "Organization admins can delete customers" ON "public"."customers" FOR DELETE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true) AND ("organization_users"."role" = ANY (ARRAY['owner'::"public"."app_role", 'admin'::"public"."app_role"]))))));



CREATE POLICY "Super admin and org owners/admins can manage members" ON "public"."organization_users" USING (("public"."is_super_admin"() OR "public"."has_org_role"("organization_id", 'owner'::"public"."app_role") OR "public"."has_org_role"("organization_id", 'admin'::"public"."app_role")));



CREATE POLICY "Super admin can delete organizations" ON "public"."organizations" FOR DELETE USING ("public"."is_super_admin"());



CREATE POLICY "Super admin can manage all organizations" ON "public"."organizations" FOR UPDATE USING (("public"."is_super_admin"() OR "public"."has_org_role"("id", 'owner'::"public"."app_role") OR "public"."has_org_role"("id", 'admin'::"public"."app_role")));



CREATE POLICY "Super admin can view all org members, users see their own orgs" ON "public"."organization_users" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_org_member"("organization_id")));



CREATE POLICY "Super admin can view all organizations" ON "public"."organizations" FOR SELECT USING (("public"."is_super_admin"() OR "public"."is_org_member"("id")));



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create budget approvals" ON "public"."budget_approvals" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create budgets" ON "public"."detailed_budgets" FOR INSERT WITH CHECK (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create checklist responses" ON "public"."workflow_checklist_responses" FOR INSERT WITH CHECK (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create company_fiscal_settings for their organization" ON "public"."company_fiscal_settings" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create counts in their org" ON "public"."inventory_counts" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can create customers for their organization" ON "public"."customers" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create detailed budgets" ON "public"."detailed_budgets" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create diagnostic checklist responses" ON "public"."diagnostic_checklist_responses" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create diagnostic responses" ON "public"."diagnostic_checklist_responses" FOR INSERT WITH CHECK (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can create engines for their organization" ON "public"."engines" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create fiscal_classifications for their organization" ON "public"."fiscal_classifications" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create movements in their org" ON "public"."inventory_movements" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can create obligation_files for their organization" ON "public"."obligation_files" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."obligations" "o"
  WHERE (("o"."id" = "obligation_files"."obligation_id") AND ("o"."org_id" = "public"."current_org_id"())))));



CREATE POLICY "Users can create obligation_kinds for their organization" ON "public"."obligation_kinds" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create order_status_history for their organization" ON "public"."order_status_history" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create receipts in their org" ON "public"."purchase_receipts" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can create reports for their organization" ON "public"."reports" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can create tax_calculations for their organization" ON "public"."tax_calculations" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create tax_ledgers for their organization" ON "public"."tax_ledgers" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create tax_rate_tables for their organization" ON "public"."tax_rate_tables" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create tax_regimes for their organization" ON "public"."tax_regimes" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create tax_rules for their organization" ON "public"."tax_rules" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create tax_types for their organization" ON "public"."tax_types" FOR INSERT TO "authenticated" WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can create their own obligations" ON "public"."obligations" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete budgets for their organization" ON "public"."detailed_budgets" FOR DELETE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete company_fiscal_settings from their organizatio" ON "public"."company_fiscal_settings" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete detailed budgets" ON "public"."detailed_budgets" FOR DELETE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can delete diagnostic responses for their organization" ON "public"."diagnostic_checklist_responses" FOR DELETE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete fiscal_classifications from their organization" ON "public"."fiscal_classifications" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete kpi_targets for their organization" ON "public"."kpi_targets" FOR DELETE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



COMMENT ON POLICY "Users can delete kpi_targets for their organization" ON "public"."kpi_targets" IS 'Permite usuários da organização deletarem metas';



CREATE POLICY "Users can delete obligation_files from their organization" ON "public"."obligation_files" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."obligations" "o"
  WHERE (("o"."id" = "obligation_files"."obligation_id") AND ("o"."org_id" = "public"."current_org_id"())))));



CREATE POLICY "Users can delete obligation_kinds from their organization" ON "public"."obligation_kinds" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete parts in their organization" ON "public"."parts_inventory" FOR DELETE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete tax_calculations from their organization" ON "public"."tax_calculations" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete tax_ledgers from their organization" ON "public"."tax_ledgers" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete tax_rate_tables from their organization" ON "public"."tax_rate_tables" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete tax_regimes from their organization" ON "public"."tax_regimes" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete tax_rules from their organization" ON "public"."tax_rules" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete tax_types from their organization" ON "public"."tax_types" FOR DELETE TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can delete their own obligations" ON "public"."obligations" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can insert achievements for their organization" ON "public"."user_achievements" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "user_achievements"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert alert history for their organization" ON "public"."alert_history" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "alert_history"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert audit_log for their organization" ON "public"."fiscal_audit_log" FOR INSERT WITH CHECK ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can insert form submissions" ON "public"."entry_form_submissions" FOR INSERT WITH CHECK (("template_id" IN ( SELECT "entry_form_templates"."id"
   FROM "public"."entry_form_templates"
  WHERE ("entry_form_templates"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert kpi_targets for their organization" ON "public"."kpi_targets" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))) AND (("kpi_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."kpis" "k"
  WHERE (("k"."id" = "kpi_targets"."kpi_id") AND (("k"."org_id" = "k"."org_id") OR ("k"."org_id" IS NULL))))))));



COMMENT ON POLICY "Users can insert kpi_targets for their organization" ON "public"."kpi_targets" IS 'Permite usuários da organização criarem metas (com ou sem kpi_id)';



CREATE POLICY "Users can insert parts in their organization" ON "public"."parts_inventory" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert rankings for their organization" ON "public"."performance_rankings" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "performance_rankings"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert their own score history" ON "public"."user_score_history" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "user_score_history"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can insert their own scores" ON "public"."user_scores" FOR INSERT WITH CHECK ((("org_id" IN ( SELECT "user_scores"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can insert workflow history" ON "public"."workflow_status_history" FOR INSERT WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can join when invited" ON "public"."organization_users" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage accounts paypayable for their organization" ON "public"."accounts_payable" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage accounts receivable for their organization" ON "public"."accounts_receivable" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage bank accounts for their organization" ON "public"."bank_accounts" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage budgets for their organization" ON "public"."budgets" USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "budgets"."order_id") AND ("o"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "budgets"."order_id") AND ("o"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can manage cash flow for their organization" ON "public"."cash_flow" USING (((("order_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "cash_flow"."order_id") AND ("o"."org_id" = "public"."current_org_id"()))))) OR (("accounts_receivable_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."accounts_receivable" "ar"
  WHERE (("ar"."id" = "cash_flow"."accounts_receivable_id") AND ("ar"."org_id" = "public"."current_org_id"()))))) OR (("accounts_payable_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."accounts_payable" "ap"
  WHERE (("ap"."id" = "cash_flow"."accounts_payable_id") AND ("ap"."org_id" = "public"."current_org_id"()))))) OR (("bank_account_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."bank_accounts" "ba"
  WHERE (("ba"."id" = "cash_flow"."bank_account_id") AND ("ba"."org_id" = "public"."current_org_id"())))))));



CREATE POLICY "Users can manage commission_calculations for their organization" ON "public"."commission_calculations" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage count items in their org" ON "public"."inventory_count_items" USING ((EXISTS ( SELECT 1
   FROM "public"."inventory_counts"
  WHERE (("inventory_counts"."id" = "inventory_count_items"."count_id") AND ("inventory_counts"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can manage dashboard preferences for their organization" ON "public"."dashboard_preferences" USING ((("org_id" IS NULL) OR ("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage employee_time_tracking for their organization" ON "public"."employee_time_tracking" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage employees for their organization" ON "public"."employees" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage environment reservations for their organizatio" ON "public"."environment_reservations" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage jurisdiction_config for their organization" ON "public"."jurisdiction_config" TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can manage monthly DRE for their organization" ON "public"."monthly_dre" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage order_materials for their organization" ON "public"."order_materials" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage order_warranties for their organization" ON "public"."order_warranties" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage parts reservations" ON "public"."parts_reservations" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage performance_reviews for their organization" ON "public"."performance_reviews" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can manage production_alerts for their organization" ON "public"."production_alerts" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage production_schedules for their organization" ON "public"."production_schedules" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage purchase needs" ON "public"."purchase_needs" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage purchase_order_items through orders" ON "public"."purchase_order_items" USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
  WHERE (("po"."id" = "purchase_order_items"."po_id") AND ("po"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
  WHERE (("po"."id" = "purchase_order_items"."po_id") AND ("po"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can manage purchase_orders for their organization" ON "public"."purchase_orders" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage purchase_requisition_items through requisition" ON "public"."purchase_requisition_items" USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_requisitions" "pr"
  WHERE (("pr"."id" = "purchase_requisition_items"."requisition_id") AND ("pr"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."purchase_requisitions" "pr"
  WHERE (("pr"."id" = "purchase_requisition_items"."requisition_id") AND ("pr"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can manage purchase_requisitions for their organization" ON "public"."purchase_requisitions" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage quotation_items through quotations" ON "public"."quotation_items" USING ((EXISTS ( SELECT 1
   FROM "public"."quotations" "q"
  WHERE (("q"."id" = "quotation_items"."quotation_id") AND ("q"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."quotations" "q"
  WHERE (("q"."id" = "quotation_items"."quotation_id") AND ("q"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can manage quotations for their organization" ON "public"."quotations" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage receipt items in their org" ON "public"."purchase_receipt_items" USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_receipts"
  WHERE (("purchase_receipts"."id" = "purchase_receipt_items"."receipt_id") AND ("purchase_receipts"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can manage resource_capacity for their organization" ON "public"."resource_capacity" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage special environments for their organization" ON "public"."special_environments" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage stock alerts" ON "public"."stock_alerts" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage suppliers for their organization" ON "public"."suppliers" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can manage technical reports" ON "public"."technical_reports" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage work_schedules for their organization" ON "public"."work_schedules" USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update budgets for their organization" ON "public"."detailed_budgets" FOR UPDATE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update company_fiscal_settings from their organizatio" ON "public"."company_fiscal_settings" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update counts in their org" ON "public"."inventory_counts" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update customers from their organization" ON "public"."customers" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update detailed budgets" ON "public"."detailed_budgets" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update diagnostic checklist responses" ON "public"."diagnostic_checklist_responses" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update diagnostic responses for their organization" ON "public"."diagnostic_checklist_responses" FOR UPDATE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update engines from their organization" ON "public"."engines" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update fiscal_classifications from their organization" ON "public"."fiscal_classifications" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update kpi_targets for their organization" ON "public"."kpi_targets" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



COMMENT ON POLICY "Users can update kpi_targets for their organization" ON "public"."kpi_targets" IS 'Permite usuários da organização atualizarem metas';



CREATE POLICY "Users can update obligation_files from their organization" ON "public"."obligation_files" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."obligations" "o"
  WHERE (("o"."id" = "obligation_files"."obligation_id") AND ("o"."org_id" = "public"."current_org_id"())))));



CREATE POLICY "Users can update obligation_kinds from their organization" ON "public"."obligation_kinds" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update parts in their organization" ON "public"."parts_inventory" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"())))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update photos for their own orders or admins can upda" ON "public"."order_photos" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."customers" "c" ON (("o"."customer_id" = "c"."id")))
  WHERE (("o"."id" = "order_photos"."order_id") AND (("c"."created_by" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "Users can update receipts in their org" ON "public"."purchase_receipts" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update tax_calculations from their organization" ON "public"."tax_calculations" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update tax_ledgers from their organization" ON "public"."tax_ledgers" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update tax_rate_tables from their organization" ON "public"."tax_rate_tables" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update tax_regimes from their organization" ON "public"."tax_regimes" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update tax_rules from their organization" ON "public"."tax_rules" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update tax_types from their organization" ON "public"."tax_types" FOR UPDATE TO "authenticated" USING (("org_id" = "public"."current_org_id"())) WITH CHECK (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can update their checklist responses" ON "public"."workflow_checklist_responses" FOR UPDATE USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING ((("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can update their own obligations" ON "public"."obligations" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own reports" ON "public"."reports" FOR UPDATE USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))) WITH CHECK (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can update their own scores" ON "public"."user_scores" FOR UPDATE USING ((("org_id" IN ( SELECT "user_scores"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can upload photos for orders" ON "public"."order_photos" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."organization_users" "ou" ON (("ou"."organization_id" = "o"."org_id")))
  WHERE (("o"."id" = "order_photos"."order_id") AND ("ou"."user_id" = "auth"."uid"()) AND ("ou"."is_active" = true))))));



CREATE POLICY "Users can view KPIs for their organization" ON "public"."kpis" FOR SELECT USING ((("org_id" IS NULL) OR ("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))));



CREATE POLICY "Users can view achievement configs from their organization" ON "public"."achievement_configs" FOR SELECT USING (("org_id" IN ( SELECT "achievement_configs"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view achievements from their organization" ON "public"."user_achievements" FOR SELECT USING (("org_id" IN ( SELECT "user_achievements"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view alert history from their organization" ON "public"."alert_history" FOR SELECT USING (("org_id" IN ( SELECT "alert_history"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view alerts for their organization" ON "public"."alerts" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view audit_log from their organization" ON "public"."audit_log" FOR SELECT USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can view audit_log from their organization" ON "public"."fiscal_audit_log" FOR SELECT TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can view basic info of org members" ON "public"."user_basic_info" FOR SELECT USING (("public"."is_super_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."organization_users" "ou1"
     JOIN "public"."organization_users" "ou2" ON (("ou1"."organization_id" = "ou2"."organization_id")))
  WHERE (("ou1"."user_id" = "auth"."uid"()) AND ("ou2"."user_id" = "user_basic_info"."user_id") AND ("ou1"."is_active" = true) AND ("ou2"."is_active" = true))))));



CREATE POLICY "Users can view budget approvals" ON "public"."budget_approvals" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view checklist items" ON "public"."diagnostic_checklist_items" FOR SELECT USING (("checklist_id" IN ( SELECT "diagnostic_checklists"."id"
   FROM "public"."diagnostic_checklists"
  WHERE ("diagnostic_checklists"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view checklist items" ON "public"."workflow_checklist_items" FOR SELECT USING (("checklist_id" IN ( SELECT "workflow_checklists"."id"
   FROM "public"."workflow_checklists"
  WHERE ("workflow_checklists"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view company_fiscal_settings from their organization" ON "public"."company_fiscal_settings" FOR SELECT TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can view count items from their org" ON "public"."inventory_count_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."inventory_counts"
  WHERE (("inventory_counts"."id" = "inventory_count_items"."count_id") AND ("inventory_counts"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can view counts from their org" ON "public"."inventory_counts" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view customers from their organization" ON "public"."customers" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view detailed budgets" ON "public"."detailed_budgets" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view diagnostic checklist responses" ON "public"."diagnostic_checklist_responses" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view engines from their organization" ON "public"."engines" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view expense categories for their organization" ON "public"."expense_categories" FOR SELECT USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view fiscal_classifications from their organization" ON "public"."fiscal_classifications" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view form fields" ON "public"."entry_form_fields" FOR SELECT USING (("template_id" IN ( SELECT "entry_form_templates"."id"
   FROM "public"."entry_form_templates"
  WHERE ("entry_form_templates"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view kpi_targets from their organization" ON "public"."kpi_targets" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



COMMENT ON POLICY "Users can view kpi_targets from their organization" ON "public"."kpi_targets" IS 'Permite visualizar metas da organização do usuário (verificação via organization_users)';



CREATE POLICY "Users can view movements from their org" ON "public"."inventory_movements" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view notification types for their organization" ON "public"."notification_types" FOR SELECT USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view notifications for their organization" ON "public"."notifications" FOR SELECT USING ((("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))) AND (("is_global" = true) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view obligation_files from their organization" ON "public"."obligation_files" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."obligations" "o"
  WHERE (("o"."id" = "obligation_files"."obligation_id") AND ("o"."org_id" = "public"."current_org_id"())))));



CREATE POLICY "Users can view obligation_kinds from their organization" ON "public"."obligation_kinds" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view order_status_history from their organization" ON "public"."order_status_history" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view organization themes" ON "public"."organization_themes" FOR SELECT USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can view organizations they belong to" ON "public"."organizations" FOR SELECT USING ("public"."is_org_member"("id"));



CREATE POLICY "Users can view parts from their organization" ON "public"."parts_inventory" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view permissions of their org profiles" ON "public"."profile_page_permissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_profiles" "up"
     JOIN "public"."organization_users" "ou" ON (("ou"."organization_id" = "up"."org_id")))
  WHERE (("up"."id" = "profile_page_permissions"."profile_id") AND ("ou"."user_id" = "auth"."uid"()) AND ("ou"."is_active" = true)))));



CREATE POLICY "Users can view photos for their own orders or admins can view a" ON "public"."order_photos" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."customers" "c" ON (("o"."customer_id" = "c"."id")))
  WHERE (("o"."id" = "order_photos"."order_id") AND (("c"."created_by" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "Users can view profile assignments of their organization" ON "public"."user_profile_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."organization_id" = "user_profile_assignments"."org_id") AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view profiles of their organization" ON "public"."user_profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."organization_id" = "user_profiles"."org_id") AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view quick actions for their organization" ON "public"."quick_actions" FOR SELECT USING ((("org_id" IS NULL) OR ("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))));



CREATE POLICY "Users can view rankings from their organization" ON "public"."performance_rankings" FOR SELECT USING (("org_id" IN ( SELECT "performance_rankings"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view receipt items from their org" ON "public"."purchase_receipt_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_receipts"
  WHERE (("purchase_receipts"."id" = "purchase_receipt_items"."receipt_id") AND ("purchase_receipts"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))))));



CREATE POLICY "Users can view receipts from their org" ON "public"."purchase_receipts" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view report_catalog for their organization" ON "public"."report_catalog" FOR SELECT USING ((("org_id" IS NULL) OR ("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))));



CREATE POLICY "Users can view reports from their organization" ON "public"."reports" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view scores from their organization" ON "public"."user_scores" FOR SELECT USING (("org_id" IN ( SELECT "user_scores"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view search sources for their organization" ON "public"."search_sources" FOR SELECT USING ((("org_id" IS NULL) OR ("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))));



CREATE POLICY "Users can view sectors of their organization" ON "public"."user_sectors" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."organization_id" = "user_sectors"."org_id") AND ("organization_users"."is_active" = true)))));



CREATE POLICY "Users can view status config for their organization" ON "public"."status_config" FOR SELECT USING ((("org_id" IS NULL) OR ("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))));



CREATE POLICY "Users can view supplier suggestions" ON "public"."supplier_suggestions" FOR SELECT USING (("purchase_need_id" IN ( SELECT "purchase_needs"."id"
   FROM "public"."purchase_needs"
  WHERE ("purchase_needs"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view system_config from their organization" ON "public"."system_config" FOR SELECT USING ((("org_id" IS NULL) OR ("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE (("organization_users"."user_id" = "auth"."uid"()) AND ("organization_users"."is_active" = true))))));



CREATE POLICY "Users can view tax_calculations from their organization" ON "public"."tax_calculations" FOR SELECT TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can view tax_ledgers from their organization" ON "public"."tax_ledgers" FOR SELECT TO "authenticated" USING (("org_id" = "public"."current_org_id"()));



CREATE POLICY "Users can view tax_rate_tables from their organization" ON "public"."tax_rate_tables" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view tax_regimes from their organization" ON "public"."tax_regimes" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view tax_rules from their organization" ON "public"."tax_rules" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view tax_types from their organization" ON "public"."tax_types" FOR SELECT TO "authenticated" USING ((("org_id" = "public"."current_org_id"()) OR ("org_id" IS NULL)));



CREATE POLICY "Users can view their org budgets" ON "public"."detailed_budgets" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their org checklist responses" ON "public"."workflow_checklist_responses" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their org diagnostic checklists" ON "public"."diagnostic_checklists" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org diagnostic responses" ON "public"."diagnostic_checklist_responses" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their org engine types" ON "public"."engine_types" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org form submissions" ON "public"."entry_form_submissions" FOR SELECT USING (("template_id" IN ( SELECT "entry_form_templates"."id"
   FROM "public"."entry_form_templates"
  WHERE ("entry_form_templates"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their org form templates" ON "public"."entry_form_templates" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org parts prices" ON "public"."parts_price_table" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org parts reservations" ON "public"."parts_reservations" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org purchase needs" ON "public"."purchase_needs" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org quality history" ON "public"."quality_history" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org report templates" ON "public"."technical_report_templates" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org service prices" ON "public"."service_price_table" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org stock alerts" ON "public"."stock_alerts" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org supplier performance" ON "public"."supplier_performance_history" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org technical reports" ON "public"."technical_reports" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org technical standards" ON "public"."technical_standards_config" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org workflow checklists" ON "public"."workflow_checklists" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org workflow history" ON "public"."workflow_status_history" FOR SELECT USING (("org_id" IN ( SELECT "organization_users"."organization_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their org workflow steps" ON "public"."workflow_steps" FOR SELECT USING (("engine_type_id" IN ( SELECT "engine_types"."id"
   FROM "public"."engine_types"
  WHERE ("engine_types"."org_id" IN ( SELECT "organization_users"."organization_id"
           FROM "public"."organization_users"
          WHERE ("organization_users"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own obligations" ON "public"."obligations" FOR SELECT USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can view their own score history" ON "public"."user_score_history" FOR SELECT USING ((("org_id" IN ( SELECT "user_score_history"."org_id"
   FROM "public"."organization_users"
  WHERE ("organization_users"."user_id" = "auth"."uid"()))) AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."accounts_payable" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."achievement_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alert_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budget_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cash_flow" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cash_flow_projection" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commission_calculations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_fiscal_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consultants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."detailed_budgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diagnostic_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diagnostic_checklist_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diagnostic_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_time_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engine_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entry_form_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entry_form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entry_form_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."environment_reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expense_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fiscal_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fiscal_classifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_count_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_counts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jurisdiction_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpi_targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kpis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_dre" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."obligation_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."obligation_kinds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."obligations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_materials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_warranties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_workflow" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_themes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts_price_table" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts_reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parts_stock_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_rankings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_page_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_efficiency_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_needs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_receipt_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_requisition_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_requisitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quality_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quick_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resource_capacity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_price_table" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."special_environments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_performance_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supplier_suggestions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_calculations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_ledgers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_rate_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_regimes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tax_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."technical_report_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."technical_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."technical_standards_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."time_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_basic_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profile_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_score_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."work_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_checklist_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_steps" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_user_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_user_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_user_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."archive_dismissed_alert"() TO "anon";
GRANT ALL ON FUNCTION "public"."archive_dismissed_alert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_dismissed_alert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_generate_budget_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_budget_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_budget_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_generate_claim_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_claim_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_claim_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_generate_technical_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_technical_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_technical_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_reserve_parts_on_budget_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_reserve_parts_on_budget_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_reserve_parts_on_budget_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_action_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_action_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_action_points"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_budget_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_budget_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_budget_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_checklist_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_checklist_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_checklist_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_kpi_trend"("kpi_code" "text", "organization_id" "uuid", "current_period" "text", "comparison_period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_kpi_trend"("kpi_code" "text", "organization_id" "uuid", "current_period" "text", "comparison_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_kpi_trend"("kpi_code" "text", "organization_id" "uuid", "current_period" "text", "comparison_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_kpi_value"("kpi_code" "text", "organization_id" "uuid", "timeframe" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_kpi_value"("kpi_code" "text", "organization_id" "uuid", "timeframe" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_kpi_value"("kpi_code" "text", "organization_id" "uuid", "timeframe" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_supplier_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_supplier_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_supplier_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_supplier_suggestions"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_supplier_suggestions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_supplier_suggestions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_warranty_rate"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_warranty_rate"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_warranty_rate"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_manage_organizations"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_organizations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_organizations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_workflow_advance"("p_workflow_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_workflow_advance"("p_workflow_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_workflow_advance"("p_workflow_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_achievement_criteria"("p_org_id" "uuid", "p_user_id" "uuid", "p_achievement_key" "text", "p_criteria" "jsonb", "p_action_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."check_achievement_criteria"("p_org_id" "uuid", "p_user_id" "uuid", "p_achievement_key" "text", "p_criteria" "jsonb", "p_action_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_achievement_criteria"("p_org_id" "uuid", "p_user_id" "uuid", "p_achievement_key" "text", "p_criteria" "jsonb", "p_action_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_achievements"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."check_achievements"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_achievements"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_mandatory_checklists_before_workflow_advance"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_mandatory_checklists_before_workflow_advance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_mandatory_checklists_before_workflow_advance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_minimum_stock_levels"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_minimum_stock_levels"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_minimum_stock_levels"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_stock_and_create_purchase_need"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_stock_and_create_purchase_need"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_stock_and_create_purchase_need"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_workflow"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_workflow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_workflow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_inventory_entry_on_receipt"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_inventory_entry_on_receipt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_inventory_entry_on_receipt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_notification_type_id" "uuid", "p_title" "text", "p_message" "text", "p_severity" "text", "p_action_url" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_notification_type_id" "uuid", "p_title" "text", "p_message" "text", "p_severity" "text", "p_action_url" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_org_id" "uuid", "p_user_id" "uuid", "p_notification_type_id" "uuid", "p_title" "text", "p_message" "text", "p_severity" "text", "p_action_url" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_order_warranty"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_order_warranty"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order_warranty"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_stock_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_stock_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stock_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_check_stock_minimum"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_check_stock_minimum"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_check_stock_minimum"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_create_order_warranty"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_create_order_warranty"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_create_order_warranty"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_process_budget_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_process_budget_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_process_budget_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_accounts_receivable"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_accounts_receivable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_accounts_receivable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_budget_number"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_budget_number"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_budget_number"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_inventory_count_number"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_inventory_count_number"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_inventory_count_number"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_receipt_number"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_receipt_number"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_receipt_number"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_requisition_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_requisition_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_requisition_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_technical_report_number"("org_id" "uuid", "report_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_technical_report_number"("org_id" "uuid", "report_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_technical_report_number"("org_id" "uuid", "report_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_warranty_claim_number"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_warranty_claim_number"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_warranty_claim_number"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_super_admins"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_super_admins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_super_admins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_enum_values"("enum_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_enum_values"("enum_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enum_values"("enum_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_users_info"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_users_info"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_users_info"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_workflows_pending_checklists"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_workflows_pending_checklists"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workflows_pending_checklists"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_org_role"("org_id" "uuid", "required_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_org_role"("org_id" "uuid", "required_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_org_role"("org_id" "uuid", "required_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."identify_bosch_components"() TO "anon";
GRANT ALL ON FUNCTION "public"."identify_bosch_components"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."identify_bosch_components"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_org_scores"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_org_scores"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_org_scores"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_default_achievements"("p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_default_achievements"("p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_default_achievements"("p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_super_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_quality_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_quality_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_quality_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid", "p_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid", "p_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_as_read"("p_user_id" "uuid", "p_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("p_notification_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_budget_approved"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_budget_approved"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_budget_approved"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_budget_pending"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_budget_pending"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_budget_pending"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_purchase_need"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_purchase_need"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_purchase_need"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_stock_minimum"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_stock_minimum"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_stock_minimum"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_technical_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_technical_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_technical_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_workflow_blocked_by_checklist"("p_workflow_id" "uuid", "p_checklist_name" "text", "p_order_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_workflow_blocked_by_checklist"("p_workflow_id" "uuid", "p_checklist_name" "text", "p_order_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_workflow_blocked_by_checklist"("p_workflow_id" "uuid", "p_checklist_name" "text", "p_order_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_inventory_count_adjustments"("p_count_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_inventory_count_adjustments"("p_count_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_inventory_count_adjustments"("p_count_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_user_action"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_user_action"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_user_action"("p_org_id" "uuid", "p_user_id" "uuid", "p_action_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."promote_user_to_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_user_to_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_user_to_super_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_user_super_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_user_super_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_user_super_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_budget_approvals_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_budget_approvals_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_budget_approvals_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_customer_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_customer_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_customer_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_detailed_budgets_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_detailed_budgets_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_detailed_budgets_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_diagnostic_response_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_diagnostic_response_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_diagnostic_response_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_parts_inventory_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_parts_inventory_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_parts_inventory_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_po_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_requisition_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_requisition_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_requisition_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_workflow_status_history_org_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_workflow_status_history_org_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_workflow_status_history_org_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_goal_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_goal_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_goal_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_on_movement"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_on_movement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_on_movement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_jurisdiction_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_jurisdiction_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_jurisdiction_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_organization_themes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_organization_themes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_organization_themes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_performance_ranking"("p_org_id" "uuid", "p_period_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_performance_ranking"("p_org_id" "uuid", "p_period_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_performance_ranking"("p_org_id" "uuid", "p_period_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_order_on_receipt"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_order_on_receipt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_order_on_receipt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_status_on_zero"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_status_on_zero"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_status_on_zero"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_supplier_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_supplier_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_supplier_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_bosch_parts"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_bosch_parts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_bosch_parts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_inventory_movement"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_inventory_movement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_inventory_movement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_workflow_advance"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_workflow_advance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_workflow_advance"() TO "service_role";


















GRANT ALL ON TABLE "public"."accounts_payable" TO "anon";
GRANT ALL ON TABLE "public"."accounts_payable" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts_payable" TO "service_role";



GRANT ALL ON TABLE "public"."accounts_receivable" TO "anon";
GRANT ALL ON TABLE "public"."accounts_receivable" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts_receivable" TO "service_role";



GRANT ALL ON TABLE "public"."achievement_configs" TO "anon";
GRANT ALL ON TABLE "public"."achievement_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."achievement_configs" TO "service_role";



GRANT ALL ON TABLE "public"."alert_history" TO "anon";
GRANT ALL ON TABLE "public"."alert_history" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_history" TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."budget_alerts" TO "anon";
GRANT ALL ON TABLE "public"."budget_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."budget_approvals" TO "anon";
GRANT ALL ON TABLE "public"."budget_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."budget_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."budgets" TO "anon";
GRANT ALL ON TABLE "public"."budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."budgets" TO "service_role";



GRANT ALL ON TABLE "public"."cash_flow" TO "anon";
GRANT ALL ON TABLE "public"."cash_flow" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_flow" TO "service_role";



GRANT ALL ON TABLE "public"."cash_flow_projection" TO "anon";
GRANT ALL ON TABLE "public"."cash_flow_projection" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_flow_projection" TO "service_role";



GRANT ALL ON TABLE "public"."commission_calculations" TO "anon";
GRANT ALL ON TABLE "public"."commission_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."company_fiscal_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_fiscal_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_fiscal_settings" TO "service_role";



GRANT ALL ON TABLE "public"."consultants" TO "anon";
GRANT ALL ON TABLE "public"."consultants" TO "authenticated";
GRANT ALL ON TABLE "public"."consultants" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_preferences" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."detailed_budgets" TO "anon";
GRANT ALL ON TABLE "public"."detailed_budgets" TO "authenticated";
GRANT ALL ON TABLE "public"."detailed_budgets" TO "service_role";



GRANT ALL ON TABLE "public"."diagnostic_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."diagnostic_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."diagnostic_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."diagnostic_checklist_responses" TO "anon";
GRANT ALL ON TABLE "public"."diagnostic_checklist_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."diagnostic_checklist_responses" TO "service_role";



GRANT ALL ON TABLE "public"."diagnostic_checklists" TO "anon";
GRANT ALL ON TABLE "public"."diagnostic_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."diagnostic_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."employee_time_tracking" TO "anon";
GRANT ALL ON TABLE "public"."employee_time_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_time_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."engine_types" TO "anon";
GRANT ALL ON TABLE "public"."engine_types" TO "authenticated";
GRANT ALL ON TABLE "public"."engine_types" TO "service_role";



GRANT ALL ON TABLE "public"."engines" TO "anon";
GRANT ALL ON TABLE "public"."engines" TO "authenticated";
GRANT ALL ON TABLE "public"."engines" TO "service_role";



GRANT ALL ON TABLE "public"."entry_form_fields" TO "anon";
GRANT ALL ON TABLE "public"."entry_form_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."entry_form_fields" TO "service_role";



GRANT ALL ON TABLE "public"."entry_form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."entry_form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."entry_form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."entry_form_templates" TO "anon";
GRANT ALL ON TABLE "public"."entry_form_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."entry_form_templates" TO "service_role";



GRANT ALL ON TABLE "public"."environment_reservations" TO "anon";
GRANT ALL ON TABLE "public"."environment_reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."environment_reservations" TO "service_role";



GRANT ALL ON TABLE "public"."expense_categories" TO "anon";
GRANT ALL ON TABLE "public"."expense_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."expense_categories" TO "service_role";



GRANT ALL ON TABLE "public"."fiscal_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."fiscal_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."fiscal_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."fiscal_classifications" TO "anon";
GRANT ALL ON TABLE "public"."fiscal_classifications" TO "authenticated";
GRANT ALL ON TABLE "public"."fiscal_classifications" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_count_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_count_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_count_items" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_counts" TO "anon";
GRANT ALL ON TABLE "public"."inventory_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_counts" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";



GRANT ALL ON TABLE "public"."jurisdiction_config" TO "anon";
GRANT ALL ON TABLE "public"."jurisdiction_config" TO "authenticated";
GRANT ALL ON TABLE "public"."jurisdiction_config" TO "service_role";



GRANT ALL ON TABLE "public"."kpi_targets" TO "anon";
GRANT ALL ON TABLE "public"."kpi_targets" TO "authenticated";
GRANT ALL ON TABLE "public"."kpi_targets" TO "service_role";



GRANT ALL ON TABLE "public"."kpis" TO "anon";
GRANT ALL ON TABLE "public"."kpis" TO "authenticated";
GRANT ALL ON TABLE "public"."kpis" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_dre" TO "anon";
GRANT ALL ON TABLE "public"."monthly_dre" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_dre" TO "service_role";



GRANT ALL ON TABLE "public"."notification_types" TO "anon";
GRANT ALL ON TABLE "public"."notification_types" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_types" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."obligation_files" TO "anon";
GRANT ALL ON TABLE "public"."obligation_files" TO "authenticated";
GRANT ALL ON TABLE "public"."obligation_files" TO "service_role";



GRANT ALL ON TABLE "public"."obligation_kinds" TO "anon";
GRANT ALL ON TABLE "public"."obligation_kinds" TO "authenticated";
GRANT ALL ON TABLE "public"."obligation_kinds" TO "service_role";



GRANT ALL ON TABLE "public"."obligations" TO "anon";
GRANT ALL ON TABLE "public"."obligations" TO "authenticated";
GRANT ALL ON TABLE "public"."obligations" TO "service_role";



GRANT ALL ON TABLE "public"."order_materials" TO "anon";
GRANT ALL ON TABLE "public"."order_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."order_materials" TO "service_role";



GRANT ALL ON TABLE "public"."order_photos" TO "anon";
GRANT ALL ON TABLE "public"."order_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."order_photos" TO "service_role";



GRANT ALL ON TABLE "public"."order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."order_warranties" TO "anon";
GRANT ALL ON TABLE "public"."order_warranties" TO "authenticated";
GRANT ALL ON TABLE "public"."order_warranties" TO "service_role";



GRANT ALL ON TABLE "public"."order_workflow" TO "anon";
GRANT ALL ON TABLE "public"."order_workflow" TO "authenticated";
GRANT ALL ON TABLE "public"."order_workflow" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."organization_themes" TO "anon";
GRANT ALL ON TABLE "public"."organization_themes" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_themes" TO "service_role";



GRANT ALL ON TABLE "public"."organization_users" TO "anon";
GRANT ALL ON TABLE "public"."organization_users" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_users" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."parts_inventory" TO "anon";
GRANT ALL ON TABLE "public"."parts_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."parts_price_table" TO "anon";
GRANT ALL ON TABLE "public"."parts_price_table" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_price_table" TO "service_role";



GRANT ALL ON TABLE "public"."parts_reservations" TO "anon";
GRANT ALL ON TABLE "public"."parts_reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_reservations" TO "service_role";



GRANT ALL ON TABLE "public"."parts_stock_config" TO "anon";
GRANT ALL ON TABLE "public"."parts_stock_config" TO "authenticated";
GRANT ALL ON TABLE "public"."parts_stock_config" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."performance_rankings" TO "anon";
GRANT ALL ON TABLE "public"."performance_rankings" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_rankings" TO "service_role";



GRANT ALL ON TABLE "public"."performance_reviews" TO "anon";
GRANT ALL ON TABLE "public"."performance_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."production_alerts" TO "anon";
GRANT ALL ON TABLE "public"."production_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."production_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."production_schedules" TO "anon";
GRANT ALL ON TABLE "public"."production_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."production_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."profile_page_permissions" TO "anon";
GRANT ALL ON TABLE "public"."profile_page_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_page_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_efficiency_reports" TO "anon";
GRANT ALL ON TABLE "public"."purchase_efficiency_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_efficiency_reports" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_needs" TO "anon";
GRANT ALL ON TABLE "public"."purchase_needs" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_needs" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_receipt_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_receipt_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_receipt_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_receipts" TO "anon";
GRANT ALL ON TABLE "public"."purchase_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_requisition_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_requisition_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_requisition_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_requisitions" TO "anon";
GRANT ALL ON TABLE "public"."purchase_requisitions" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_requisitions" TO "service_role";



GRANT ALL ON TABLE "public"."quality_history" TO "anon";
GRANT ALL ON TABLE "public"."quality_history" TO "authenticated";
GRANT ALL ON TABLE "public"."quality_history" TO "service_role";



GRANT ALL ON TABLE "public"."quick_actions" TO "anon";
GRANT ALL ON TABLE "public"."quick_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_actions" TO "service_role";



GRANT ALL ON TABLE "public"."quotation_items" TO "anon";
GRANT ALL ON TABLE "public"."quotation_items" TO "authenticated";
GRANT ALL ON TABLE "public"."quotation_items" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON TABLE "public"."report_catalog" TO "anon";
GRANT ALL ON TABLE "public"."report_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."report_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."resource_capacity" TO "anon";
GRANT ALL ON TABLE "public"."resource_capacity" TO "authenticated";
GRANT ALL ON TABLE "public"."resource_capacity" TO "service_role";



GRANT ALL ON TABLE "public"."search_sources" TO "anon";
GRANT ALL ON TABLE "public"."search_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."search_sources" TO "service_role";



GRANT ALL ON TABLE "public"."service_price_table" TO "anon";
GRANT ALL ON TABLE "public"."service_price_table" TO "authenticated";
GRANT ALL ON TABLE "public"."service_price_table" TO "service_role";



GRANT ALL ON TABLE "public"."special_environments" TO "anon";
GRANT ALL ON TABLE "public"."special_environments" TO "authenticated";
GRANT ALL ON TABLE "public"."special_environments" TO "service_role";



GRANT ALL ON TABLE "public"."status_config" TO "anon";
GRANT ALL ON TABLE "public"."status_config" TO "authenticated";
GRANT ALL ON TABLE "public"."status_config" TO "service_role";



GRANT ALL ON TABLE "public"."status_prerequisites" TO "anon";
GRANT ALL ON TABLE "public"."status_prerequisites" TO "authenticated";
GRANT ALL ON TABLE "public"."status_prerequisites" TO "service_role";



GRANT ALL ON TABLE "public"."stock_alerts" TO "anon";
GRANT ALL ON TABLE "public"."stock_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_performance_history" TO "anon";
GRANT ALL ON TABLE "public"."supplier_performance_history" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_performance_history" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."supplier_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."system_pages" TO "anon";
GRANT ALL ON TABLE "public"."system_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."system_pages" TO "service_role";



GRANT ALL ON TABLE "public"."tax_calculations" TO "anon";
GRANT ALL ON TABLE "public"."tax_calculations" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_calculations" TO "service_role";



GRANT ALL ON TABLE "public"."tax_ledgers" TO "anon";
GRANT ALL ON TABLE "public"."tax_ledgers" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_ledgers" TO "service_role";



GRANT ALL ON TABLE "public"."tax_rate_tables" TO "anon";
GRANT ALL ON TABLE "public"."tax_rate_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_rate_tables" TO "service_role";



GRANT ALL ON TABLE "public"."tax_regimes" TO "anon";
GRANT ALL ON TABLE "public"."tax_regimes" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_regimes" TO "service_role";



GRANT ALL ON TABLE "public"."tax_rules" TO "anon";
GRANT ALL ON TABLE "public"."tax_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_rules" TO "service_role";



GRANT ALL ON TABLE "public"."tax_types" TO "anon";
GRANT ALL ON TABLE "public"."tax_types" TO "authenticated";
GRANT ALL ON TABLE "public"."tax_types" TO "service_role";



GRANT ALL ON TABLE "public"."technical_report_templates" TO "anon";
GRANT ALL ON TABLE "public"."technical_report_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."technical_report_templates" TO "service_role";



GRANT ALL ON TABLE "public"."technical_reports" TO "anon";
GRANT ALL ON TABLE "public"."technical_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."technical_reports" TO "service_role";



GRANT ALL ON TABLE "public"."technical_standards_config" TO "anon";
GRANT ALL ON TABLE "public"."technical_standards_config" TO "authenticated";
GRANT ALL ON TABLE "public"."technical_standards_config" TO "service_role";



GRANT ALL ON TABLE "public"."time_logs" TO "anon";
GRANT ALL ON TABLE "public"."time_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."time_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_basic_info" TO "anon";
GRANT ALL ON TABLE "public"."user_basic_info" TO "authenticated";
GRANT ALL ON TABLE "public"."user_basic_info" TO "service_role";



GRANT ALL ON TABLE "public"."user_profile_assignments" TO "anon";
GRANT ALL ON TABLE "public"."user_profile_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profile_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_score_history" TO "anon";
GRANT ALL ON TABLE "public"."user_score_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_score_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_scores" TO "anon";
GRANT ALL ON TABLE "public"."user_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_scores" TO "service_role";



GRANT ALL ON TABLE "public"."user_sectors" TO "anon";
GRANT ALL ON TABLE "public"."user_sectors" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sectors" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_checklist_responses" TO "anon";
GRANT ALL ON TABLE "public"."workflow_checklist_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_checklist_responses" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_checklists" TO "anon";
GRANT ALL ON TABLE "public"."workflow_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."v_workflows_with_pending_checklists" TO "anon";
GRANT ALL ON TABLE "public"."v_workflows_with_pending_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."v_workflows_with_pending_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."warranty_claims" TO "anon";
GRANT ALL ON TABLE "public"."warranty_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."warranty_claims" TO "service_role";



GRANT ALL ON TABLE "public"."warranty_indicators" TO "anon";
GRANT ALL ON TABLE "public"."warranty_indicators" TO "authenticated";
GRANT ALL ON TABLE "public"."warranty_indicators" TO "service_role";



GRANT ALL ON TABLE "public"."work_schedules" TO "anon";
GRANT ALL ON TABLE "public"."work_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."work_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."workflow_checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_status_history" TO "anon";
GRANT ALL ON TABLE "public"."workflow_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_steps" TO "anon";
GRANT ALL ON TABLE "public"."workflow_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_steps" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
