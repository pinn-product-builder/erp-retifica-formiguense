# US-EST-002: Controlar Saldo de Estoque

**ID:** US-EST-002  
**Epic:** Estoque  
**Sprint:** 6  
**Prioridade:** Crítica  
**Estimativa:** 3 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente de estoque  
**Quero** visualizar saldo atualizado em tempo real de cada peça  
**Para** tomar decisões sobre compras e atendimento de pedidos

---

## 🎯 Business Objective

Garantir precisão e atualização automática de saldos, prevenindo vendas sem estoque e otimizando reposição.

---

## 📐 Business Rules

### RN-EST-007: Cálculo de Saldo
```typescript
interface StockBalance {
  part_id: string;
  physical_stock: number;        // Saldo físico
  reserved_stock: number;        // Reservado (orçamentos aprovados)
  available_stock: number;       // Disponível = físico - reservado
  in_transit: number;            // Em trânsito (pedidos de compra)
  committed: number;             // Comprometido (OS em execução)
}

// Fórmula
available_stock = physical_stock - reserved_stock - committed
```

### RN-EST-008: Atualização Automática
**Saldo é atualizado quando:**
- Entrada de mercadoria (compra, devolução, ajuste positivo)
- Saída de mercadoria (venda, consumo, ajuste negativo)
- Reserva de peça para orçamento
- Liberação de reserva (orçamento rejeitado)
- Baixa por OS (consumo efetivo)

### RN-EST-009: Validação de Saldo Negativo
```sql
-- Trigger que impede saldo negativo
CREATE OR REPLACE FUNCTION prevent_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock < 0 THEN
    RAISE EXCEPTION 'Saldo não pode ser negativo. Saldo atual: %, Tentativa: %',
      OLD.current_stock, NEW.current_stock;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### RN-EST-010: Visualização Multi-Local
**Se empresa possui múltiplos almoxarifados:**
```typescript
interface MultiLocationStock {
  part_id: string;
  locations: {
    location_id: string;
    location_name: string;
    physical_stock: number;
    reserved_stock: number;
    available_stock: number;
  }[];
  total_physical: number;
  total_available: number;
}
```

---

## ✅ Acceptance Criteria

**AC8:** Card de resumo mostra totais de estoque  
**AC9:** Lista de peças exibe saldo físico e disponível  
**AC10:** Badge visual indica status (ok, baixo, crítico, zerado)  
**AC11:** Trigger impede movimentações que resultem em saldo negativo  
**AC12:** Saldo é atualizado em tempo real após cada movimentação  
**AC13:** Filtro "Apenas com estoque" funciona corretamente

---

## 🛠️ Definition of Done

- [ ] View `stock_balance` criada
- [ ] Trigger `prevent_negative_stock` implementado
- [ ] Componente `StockBalanceCard.tsx` criado
- [ ] Badge de status visual implementado
- [ ] Atualização em tempo real testada
- [ ] Testes E2E de validações escritos

---

## 📁 Affected Components

```
src/components/stock/
  ├── StockBalanceCard.tsx         (NEW)
  ├── StockStatusBadge.tsx         (NEW)
  └── PartList.tsx                 (UPDATE)

src/hooks/
  └── useStockBalance.ts           (NEW)
```

---

## 🗄️ Database Schema

```sql
-- View consolidada de saldo
CREATE OR REPLACE VIEW stock_balance AS
SELECT 
  p.id AS part_id,
  p.org_id,
  p.code,
  p.name,
  p.category,
  p.current_stock AS physical_stock,
  
  -- Estoque reservado (orçamentos aprovados)
  COALESCE((
    SELECT SUM(sr.quantity)
    FROM stock_reservations sr
    WHERE sr.part_id = p.id
    AND sr.status = 'active'
  ), 0) AS reserved_stock,
  
  -- Estoque disponível
  p.current_stock - COALESCE((
    SELECT SUM(sr.quantity)
    FROM stock_reservations sr
    WHERE sr.part_id = p.id
    AND sr.status = 'active'
  ), 0) AS available_stock,
  
  -- Em trânsito (pedidos de compra)
  COALESCE((
    SELECT SUM(poi.quantity - poi.received_quantity)
    FROM purchase_order_items poi
    JOIN purchase_orders po ON po.id = poi.order_id
    WHERE poi.part_id = p.id
    AND po.status IN ('approved', 'in_transit')
  ), 0) AS in_transit,
  
  -- Comprometido (OS em execução)
  COALESCE((
    SELECT SUM((item->>'quantity')::NUMERIC)
    FROM detailed_budgets db
    CROSS JOIN jsonb_array_elements(db.parts) AS item
    JOIN orders o ON o.id = db.order_id
    WHERE (item->>'part_id')::UUID = p.id
    AND db.status = 'approved'
    AND o.status IN ('in_progress', 'awaiting_parts')
  ), 0) AS committed,
  
  p.minimum_stock,
  p.maximum_stock,
  p.average_cost,
  
  -- Status do estoque
  CASE 
    WHEN p.current_stock = 0 THEN 'out_of_stock'
    WHEN p.current_stock <= p.reorder_point THEN 'critical'
    WHEN p.current_stock <= p.minimum_stock THEN 'low'
    WHEN p.current_stock >= p.maximum_stock THEN 'high'
    ELSE 'ok'
  END AS stock_status
FROM parts p
WHERE p.active = true;

-- Permissões
GRANT SELECT ON stock_balance TO authenticated;

-- Trigger para impedir saldo negativo
CREATE OR REPLACE FUNCTION prevent_negative_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock < 0 THEN
    RAISE EXCEPTION 'Operação resultaria em saldo negativo. Peça: %, Saldo atual: %, Tentativa: %',
      (SELECT name FROM parts WHERE id = NEW.id),
      OLD.current_stock,
      NEW.current_stock
    USING HINT = 'Verifique a disponibilidade antes de realizar a operação';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_negative_stock
  BEFORE UPDATE OF current_stock ON parts
  FOR EACH ROW
  WHEN (NEW.current_stock < 0)
  EXECUTE FUNCTION prevent_negative_stock();

-- Função para verificar disponibilidade
CREATE OR REPLACE FUNCTION check_stock_availability(
  p_part_id UUID,
  p_quantity NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_available NUMERIC;
  v_physical NUMERIC;
  v_reserved NUMERIC;
BEGIN
  SELECT 
    physical_stock,
    reserved_stock,
    available_stock
  INTO v_physical, v_reserved, v_available
  FROM stock_balance
  WHERE part_id = p_part_id;
  
  RETURN jsonb_build_object(
    'available', v_available >= p_quantity,
    'physical_stock', v_physical,
    'reserved_stock', v_reserved,
    'available_stock', v_available,
    'requested_quantity', p_quantity,
    'shortage', CASE 
      WHEN v_available < p_quantity 
      THEN p_quantity - v_available 
      ELSE 0 
    END
  );
END;
$$ LANGUAGE plpgsql;

-- View para dashboard de estoque
CREATE OR REPLACE VIEW stock_dashboard AS
SELECT 
  org_id,
  COUNT(*) AS total_parts,
  COUNT(*) FILTER (WHERE stock_status = 'out_of_stock') AS out_of_stock_count,
  COUNT(*) FILTER (WHERE stock_status = 'critical') AS critical_count,
  COUNT(*) FILTER (WHERE stock_status = 'low') AS low_count,
  COUNT(*) FILTER (WHERE stock_status = 'ok') AS ok_count,
  COUNT(*) FILTER (WHERE stock_status = 'high') AS high_count,
  SUM(physical_stock * average_cost) AS total_stock_value,
  SUM(available_stock * average_cost) AS available_stock_value
FROM stock_balance
GROUP BY org_id;

GRANT SELECT ON stock_dashboard TO authenticated;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard de Estoque                                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Valor Total │  │ Disponível  │  │ Em Trânsito │         │
│  │ R$ 125.450  │  │ R$ 98.320   │  │ R$ 15.230   │         │
│  │ 100% (+2%)  │  │ 78%         │  │ 12%         │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 🔴 Zerados  │  │ 🟠 Críticos │  │ 🟡 Baixos   │         │
│  │ 5 itens     │  │ 12 itens    │  │ 23 itens    │         │
│  │ [Ver Lista] │  │ [Ver Lista] │  │ [Ver Lista] │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📦 Lista de Peças com Saldo                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Código    │ Nome              │ Físico│ Reserv│ Disponív││
│  ├───────────┼───────────────────┼───────┼───────┼─────────┤│
│  │ MOT-001   │ Pistão 86mm      │ 25 un │ 10 un │ 15 un   ││
│  │           │ ✅ OK             │       │       │         ││
│  ├───────────┼───────────────────┼───────┼───────┼─────────┤│
│  │ BRO-052   │ Bronzina biela   │ 8 un  │ 5 un  │ 3 un    ││
│  │           │ 🔴 CRÍTICO        │       │       │         ││
│  ├───────────┼───────────────────┼───────┼───────┼─────────┤│
│  │ JUN-015   │ Junta cabeçote   │ 0 un  │ 0 un  │ 0 un    ││
│  │           │ ⚫ ZERADO         │       │       │         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Detalhes de Saldo - Pistão 86mm (MOT-001)             [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SALDOS                                                       │
│  ──────────────────────────────────────────────────────────  │
│  Estoque Físico:         25 un                               │
│  (-) Reservado:          10 un  [Ver Reservas]              │
│  (-) Comprometido:        0 un                               │
│  ────────────────────────────                                │
│  = Disponível:           15 un  ✅ OK                        │
│                                                               │
│  Em Trânsito:             5 un  [Ver Pedidos]               │
│  Estoque Futuro:         20 un  (Físico + Em Trânsito)      │
│                                                               │
│  LIMITES                                                      │
│  ──────────────────────────────────────────────────────────  │
│  Estoque Mínimo:         10 un                               │
│  Estoque Máximo:         50 un                               │
│  Ponto de Pedido:        15 un  ⚠️ Atingido!                │
│                                                               │
│  VALORAÇÃO                                                    │
│  ──────────────────────────────────────────────────────────  │
│  Custo Médio Unitário:   R$ 245,00                          │
│  Valor do Estoque Físico: R$ 6.125,00                       │
│  Valor Disponível:        R$ 3.675,00                        │
│                                                               │
│                                                   [Fechar]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Visualizar Saldo Consolidado
```gherkin
Given que tenho peças cadastradas
When acesso listagem de estoque
Then vejo para cada peça:
  - Saldo físico
  - Saldo reservado
  - Saldo disponível
And badge visual indica status correto
```

### E2E Test 2: Impedir Saldo Negativo
```gherkin
Given que peça tem saldo físico de 5 unidades
When tento registrar saída de 10 unidades
Then trigger bloqueia operação
And erro aparece: "Operação resultaria em saldo negativo"
And saldo permanece em 5
```

### E2E Test 3: Cálculo de Disponível
```gherkin
Given que peça tem:
  - Saldo físico: 25 un
  - Reservado: 10 un
  - Comprometido: 0 un
When visualizo detalhes de saldo
Then disponível é calculado: 25 - 10 = 15 un
And exibido corretamente
```

### E2E Test 4: Atualização em Tempo Real
```gherkin
Given que tenho tela de estoque aberta
When outra aba registra entrada de 10 unidades
Then saldo é atualizado automaticamente na tela
And não preciso recarregar página
```

### E2E Test 5: Dashboard de Resumo
```gherkin
Given que tenho peças com diferentes status
When acesso dashboard de estoque
Then vejo cards com totais:
  - Valor total do estoque
  - Quantidade de itens críticos
  - Quantidade de itens zerados
And valores correspondem aos dados da view
```

### E2E Test 6: Verificar Disponibilidade
```gherkin
Given que peça tem 15 unidades disponíveis
When verifico disponibilidade para 20 unidades
Then função retorna:
  - available: false
  - shortage: 5 un
And sugere quantidade de reposição
```

---

## 🚫 Negative Scope

**Não inclui:**
- Saldo por lote (FIFO/LIFO)
- Histórico de saldos (snapshot diário)
- Previsão de demanda
- Análise de sazonalidade

---

## 🔗 Dependencies

**Blocks:**
- US-EST-003 (Movimentações)
- US-EST-005 (Reservas)

**Blocked by:**
- US-EST-001 (Cadastrar Peças)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
