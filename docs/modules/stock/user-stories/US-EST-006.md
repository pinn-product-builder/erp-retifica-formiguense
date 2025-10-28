# US-EST-006: Baixa de Peças por OS

**ID:** US-EST-006  
**Epic:** Estoque  
**Sprint:** 7  
**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** almoxarife  
**Quero** dar baixa automática de peças quando OS iniciar produção  
**Para** manter estoque sincronizado com consumo real

---

## 🎯 Business Objective

Automatizar baixa de estoque baseado em orçamentos aprovados, consumindo reservas e atualizando saldos.

---

## 📐 Business Rules

### RN-EST-020: Baixa Automática
```typescript
// Quando OS muda para 'in_progress'
1. Buscar reservas ativas do orçamento
2. Para cada peça reservada:
   - Dar saída no estoque
   - Marcar reserva como 'consumed'
   - Registrar movimentação tipo 'consumption'
3. Atualizar custo da OS
```

### RN-EST-021: Baixa Manual
- Permite ajustes de quantidade consumida
- Registra diferença entre reservado e consumido
- Justificativa obrigatória para diferenças

---

## 🗄️ Database Schema

```sql
-- Função para processar baixa por OS
CREATE OR REPLACE FUNCTION process_order_consumption(
  p_order_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_budget_id UUID;
  v_reservation RECORD;
  v_total_cost NUMERIC := 0;
BEGIN
  -- Buscar orçamento aprovado da OS
  SELECT id INTO v_budget_id
  FROM detailed_budgets
  WHERE order_id = p_order_id
  AND status = 'approved';
  
  IF v_budget_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum orçamento aprovado encontrado para esta OS';
  END IF;
  
  -- Processar cada reserva
  FOR v_reservation IN
    SELECT * FROM stock_reservations
    WHERE budget_id = v_budget_id
    AND status = 'active'
  LOOP
    -- Dar saída no estoque
    PERFORM process_stock_outbound(
      v_reservation.part_id,
      'consumption',
      v_reservation.quantity,
      'Consumo na OS #' || (SELECT order_number FROM orders WHERE id = p_order_id),
      p_order_id,
      v_budget_id
    );
    
    -- Marcar reserva como consumida
    UPDATE stock_reservations
    SET 
      status = 'consumed',
      consumed_at = NOW()
    WHERE id = v_reservation.id;
    
    -- Acumular custo
    v_total_cost := v_total_cost + (
      v_reservation.quantity * 
      (SELECT average_cost FROM parts WHERE id = v_reservation.part_id)
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'items_consumed', (
      SELECT COUNT(*) FROM stock_reservations
      WHERE budget_id = v_budget_id AND status = 'consumed'
    ),
    'total_cost', v_total_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
