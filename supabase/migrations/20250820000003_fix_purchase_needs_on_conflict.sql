-- Fix ON CONFLICT constraint mismatch in auto_reserve_parts_on_budget_approval
-- Error: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- The constraint unique_part_need_per_org is (org_id, part_code, status)
-- But the function was using ON CONFLICT (org_id, part_code)

CREATE OR REPLACE FUNCTION public.auto_reserve_parts_on_budget_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    part_record RECORD;
    available_stock INTEGER;
    reservation_quantity INTEGER;
BEGIN
    -- Só processa se a aprovação for total ou parcial
    IF NEW.approval_type IN ('total', 'partial') THEN
        
        -- Para cada peça no orçamento aprovado
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
                AND (
                    NEW.approval_type = 'total' 
                    OR p->>'part_code' = ANY(
                        SELECT jsonb_array_elements_text(NEW.approved_parts)
                    )
                )
        LOOP
            -- Verificar estoque disponível
            SELECT COALESCE(SUM(quantity), 0) INTO available_stock
            FROM parts_inventory 
            WHERE part_code = part_record.part_code 
            AND org_id = (SELECT org_id FROM detailed_budgets WHERE id = NEW.budget_id);
            
            -- Calcular quantidade a reservar (mínimo entre solicitado e disponível)
            reservation_quantity := LEAST(part_record.quantity, available_stock);
            
            IF reservation_quantity > 0 THEN
                -- Criar reserva
                INSERT INTO parts_reservations (
                    order_id,
                    budget_id,
                    part_code,
                    part_name,
                    quantity_reserved,
                    unit_cost,
                    reservation_status,
                    reserved_at,
                    reserved_by,
                    org_id
                ) VALUES (
                    (SELECT order_id FROM detailed_budgets WHERE id = NEW.budget_id),
                    NEW.budget_id,
                    part_record.part_code,
                    part_record.part_name,
                    reservation_quantity,
                    part_record.unit_price,
                    'reserved',
                    NOW(),
                    NEW.registered_by,
                    (SELECT org_id FROM detailed_budgets WHERE id = NEW.budget_id)
                );
                
                -- Se não há estoque suficiente, criar necessidade de compra
                IF part_record.quantity > available_stock THEN
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
                        delivery_urgency_date,
                        status
                    ) VALUES (
                        (SELECT org_id FROM detailed_budgets WHERE id = NEW.budget_id),
                        part_record.part_code,
                        part_record.part_name,
                        part_record.quantity - available_stock,
                        available_stock,
                        CASE 
                            WHEN (part_record.quantity - available_stock) > part_record.quantity * 0.5 
                            THEN 'high' 
                            ELSE 'normal' 
                        END,
                        'planned',
                        jsonb_build_array((SELECT order_id FROM detailed_budgets WHERE id = NEW.budget_id)),
                        part_record.unit_price * (part_record.quantity - available_stock),
                        CURRENT_DATE + INTERVAL '7 days',
                        'pending'
                    )
                    -- FIX: Correct constraint is (org_id, part_code, status)
                    ON CONFLICT (org_id, part_code, status) 
                    DO UPDATE SET
                        required_quantity = purchase_needs.required_quantity + EXCLUDED.required_quantity,
                        estimated_cost = purchase_needs.estimated_cost + EXCLUDED.estimated_cost,
                        updated_at = NOW();
                END IF;
            END IF;
        END LOOP;
        
        -- Criar alerta de estoque se necessário
        INSERT INTO stock_alerts (
            org_id,
            part_code,
            part_name,
            current_stock,
            minimum_stock,
            alert_type,
            alert_level
        )
        SELECT DISTINCT
            pi.org_id,
            pi.part_code,
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
        WHERE pi.org_id = (SELECT org_id FROM detailed_budgets WHERE id = NEW.budget_id)
        AND pi.part_code IN (
            SELECT p->>'part_code'
            FROM detailed_budgets db,
                 jsonb_array_elements(db.parts) as p
            WHERE db.id = NEW.budget_id
        )
        GROUP BY pi.org_id, pi.part_code, pi.part_name, psc.minimum_stock
        HAVING COALESCE(SUM(pi.quantity), 0) < COALESCE(psc.minimum_stock, 5)
        ON CONFLICT (org_id, part_code) DO UPDATE SET
            current_stock = EXCLUDED.current_stock,
            alert_level = EXCLUDED.alert_level,
            created_at = NOW(),
            is_active = true;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_reserve_parts_on_budget_approval() IS 'Reserva peças automaticamente ao aprovar orçamento e cria necessidades de compra. FIX: Corrigido ON CONFLICT para corresponder à constraint (org_id, part_code, status).';

