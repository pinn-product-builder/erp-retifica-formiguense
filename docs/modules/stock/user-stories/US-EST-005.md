# US-EST-005: Reservar Peças para Orçamento

**ID:** US-EST-005  
**Epic:** Estoque  
**Sprint:** 7  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** reservar peças automaticamente quando orçamento for aprovado  
**Para** garantir disponibilidade e evitar venda sem estoque

---

## 🎯 Business Objective

Sincronizar orçamentos aprovados com estoque através de sistema de reservas automático.

---

## 📐 Business Rules

### RN-EST-018: Reserva Automática
```typescript
interface StockReservation {
  id: string;
  budget_id: string;
  part_id: string;
  quantity: number;
  status: 'active' | 'released' | 'consumed';
  reserved_at: Date;
  expires_at: Date;        // Validade do orçamento
  released_at?: Date;
  consumed_at?: Date;
  created_by: string;
}
```

### RN-EST-019: Gatilhos
- **Criar reserva**: Quando orçamento → 'approved'
- **Liberar reserva**: Quando orçamento → 'rejected'
- **Consumir reserva**: Quando OS inicia produção

---

## 🗄️ Database Schema

```sql
CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES detailed_budgets(id) NOT NULL,
  part_id UUID REFERENCES parts(id) NOT NULL,
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'released', 'consumed')
  ),
  
  reserved_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para criar reservas ao aprovar orçamento
CREATE OR REPLACE FUNCTION create_stock_reservations()
RETURNS TRIGGER AS $$
DECLARE
  v_part RECORD;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    FOR v_part IN 
      SELECT 
        (item->>'part_id')::UUID AS part_id,
        (item->>'quantity')::NUMERIC AS quantity
      FROM jsonb_array_elements(NEW.parts) AS item
    LOOP
      INSERT INTO stock_reservations (
        budget_id, part_id, quantity,
        expires_at, created_by
      ) VALUES (
        NEW.id,
        v_part.part_id,
        v_part.quantity,
        NEW.valid_until,
        NEW.created_by
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_stock_reservations
  AFTER UPDATE OF status ON detailed_budgets
  FOR EACH ROW
  EXECUTE FUNCTION create_stock_reservations();
```

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
