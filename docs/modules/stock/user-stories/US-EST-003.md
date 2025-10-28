# US-EST-003: Movimentações de Estoque

**ID:** US-EST-003  
**Epic:** Estoque  
**Sprint:** 6  
**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** almoxarife  
**Quero** registrar todas as entradas e saídas de estoque  
**Para** manter controle preciso das movimentações e rastreabilidade completa

---

## 🎯 Business Objective

Criar sistema robusto de rastreamento com auditoria completa de todas as movimentações, garantindo precisão do inventário.

---

## 📐 Business Rules

### RN-EST-011: Tipos de Movimentação
```typescript
type MovementType =
  // Entradas
  | 'purchase'           // Compra
  | 'return'             // Devolução de cliente
  | 'adjustment_in'      // Ajuste positivo
  | 'transfer_in'        // Transferência recebida
  | 'production'         // Produção interna
  
  // Saídas
  | 'sale'               // Venda
  | 'consumption'        // Consumo em OS
  | 'adjustment_out'     // Ajuste negativo
  | 'transfer_out'       // Transferência enviada
  | 'loss'               // Perda/quebra
  | 'disposal';          // Descarte

interface InventoryMovement {
  id: string;
  org_id: string;
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  
  // Relacionamentos
  order_id?: string;         // Se consumo em OS
  budget_id?: string;        // Se de orçamento
  purchase_order_id?: string; // Se compra
  
  // Rastreabilidade
  batch_number?: string;
  serial_number?: string;
  manufacture_date?: Date;
  expiration_date?: Date;
  supplier_id?: string;
  
  // Localização
  from_location?: string;
  to_location?: string;
  
  // Auditoria
  notes?: string;
  created_by: string;
  created_at: Date;
}
```

### RN-EST-012: Atualização de Custo Médio
**Custo médio ponderado:**
```typescript
// Ao dar entrada de peça
new_average_cost = (
  (current_stock * current_average_cost) +
  (quantity_in * unit_cost_in)
) / (current_stock + quantity_in)

// Exemplo:
// Estoque: 10 un @ R$ 100 = R$ 1.000
// Entrada: 5 un @ R$ 120 = R$ 600
// Novo custo médio: R$ 1.600 / 15 = R$ 106,67
```

### RN-EST-013: Validações
- **Quantidade**: Deve ser > 0
- **Motivo**: Obrigatório (mín. 3 caracteres)
- **Custo unitário**: Obrigatório em entradas
- **Saída**: Não pode exceder saldo disponível
- **Transferência**: Locais origem/destino diferentes

### RN-EST-014: Motivos Predefinidos
```typescript
const reasonTemplates = {
  purchase: 'Compra conforme NF {invoice_number}',
  return: 'Devolução de cliente OS #{order_number}',
  consumption: 'Consumo na OS #{order_number}',
  adjustment_in: 'Ajuste de inventário - diferença encontrada',
  adjustment_out: 'Ajuste de inventário - diferença encontrada',
  loss: 'Perda por {reason}', // quebra, vencimento, etc.
};
```

---

## ✅ Acceptance Criteria

**AC14:** Formulário de movimentação com todos os tipos  
**AC15:** Entradas atualizam custo médio automaticamente  
**AC16:** Saídas validam disponibilidade antes de processar  
**AC17:** Histórico completo de movimentações por peça  
**AC18:** Filtros por tipo, período e peça funcionam  
**AC19:** Exportação de relatório de movimentações  
**AC20:** Estorno de movimentação incorreta (admin only)

---

## 🛠️ Definition of Done

- [ ] Tabela `inventory_movements` criada
- [ ] Componente `MovementForm.tsx` implementado
- [ ] Hook `useInventoryMovements.ts` criado
- [ ] Trigger de atualização de custo médio
- [ ] Validações implementadas
- [ ] Histórico de movimentações funcional
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/stock/
  ├── MovementForm.tsx             (NEW)
  ├── MovementHistory.tsx          (NEW)
  └── MovementFilters.tsx          (NEW)

src/pages/
  └── MovimentacoesEstoque.tsx     (NEW)

src/hooks/
  └── useInventoryMovements.ts     (UPDATE)
```

---

## 🗄️ Database Schema

```sql
-- Tabela de movimentações
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  part_id UUID REFERENCES parts(id) NOT NULL,
  
  movement_type TEXT NOT NULL CHECK (movement_type IN (
    'purchase', 'return', 'adjustment_in', 'transfer_in', 'production',
    'sale', 'consumption', 'adjustment_out', 'transfer_out', 'loss', 'disposal'
  )),
  
  quantity NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  
  previous_quantity NUMERIC(10,3) NOT NULL,
  new_quantity NUMERIC(10,3) NOT NULL,
  
  reason TEXT NOT NULL,
  
  -- Relacionamentos
  order_id UUID REFERENCES orders(id),
  budget_id UUID REFERENCES detailed_budgets(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  
  -- Rastreabilidade
  batch_number TEXT,
  serial_number TEXT,
  manufacture_date DATE,
  expiration_date DATE,
  supplier_id UUID REFERENCES suppliers(id),
  
  -- Localização
  from_location TEXT,
  to_location TEXT,
  
  -- Metadados
  metadata JSONB,
  notes TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_inventory_movements_org ON inventory_movements(org_id);
CREATE INDEX idx_inventory_movements_part ON inventory_movements(part_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_order ON inventory_movements(order_id);

-- RLS
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view movements of their org"
  ON inventory_movements FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create movements"
  ON inventory_movements FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Função para processar movimentação de entrada
CREATE OR REPLACE FUNCTION process_stock_inbound(
  p_part_id UUID,
  p_movement_type TEXT,
  p_quantity NUMERIC,
  p_unit_cost NUMERIC,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_org_id UUID;
  v_previous_qty NUMERIC;
  v_new_qty NUMERIC;
  v_previous_cost NUMERIC;
  v_new_cost NUMERIC;
  v_movement_id UUID;
BEGIN
  -- Buscar dados da peça
  SELECT org_id, current_stock, average_cost
  INTO v_org_id, v_previous_qty, v_previous_cost
  FROM parts
  WHERE id = p_part_id;
  
  -- Calcular novo saldo
  v_new_qty := v_previous_qty + p_quantity;
  
  -- Calcular novo custo médio
  IF v_new_qty > 0 THEN
    v_new_cost := (
      (v_previous_qty * v_previous_cost) +
      (p_quantity * p_unit_cost)
    ) / v_new_qty;
  ELSE
    v_new_cost := p_unit_cost;
  END IF;
  
  -- Atualizar peça
  UPDATE parts
  SET 
    current_stock = v_new_qty,
    average_cost = v_new_cost,
    last_purchase_price = CASE 
      WHEN p_movement_type = 'purchase' THEN p_unit_cost 
      ELSE last_purchase_price 
    END,
    updated_at = NOW()
  WHERE id = p_part_id;
  
  -- Registrar movimentação
  INSERT INTO inventory_movements (
    org_id, part_id, movement_type, quantity,
    unit_cost, total_cost,
    previous_quantity, new_quantity,
    reason, metadata, created_by
  ) VALUES (
    v_org_id, p_part_id, p_movement_type, p_quantity,
    p_unit_cost, p_quantity * p_unit_cost,
    v_previous_qty, v_new_qty,
    p_reason, p_metadata, auth.uid()
  ) RETURNING id INTO v_movement_id;
  
  RETURN jsonb_build_object(
    'movement_id', v_movement_id,
    'previous_quantity', v_previous_qty,
    'new_quantity', v_new_qty,
    'previous_cost', v_previous_cost,
    'new_cost', v_new_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para processar movimentação de saída
CREATE OR REPLACE FUNCTION process_stock_outbound(
  p_part_id UUID,
  p_movement_type TEXT,
  p_quantity NUMERIC,
  p_reason TEXT,
  p_order_id UUID DEFAULT NULL,
  p_budget_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_org_id UUID;
  v_previous_qty NUMERIC;
  v_new_qty NUMERIC;
  v_avg_cost NUMERIC;
  v_movement_id UUID;
BEGIN
  -- Buscar dados da peça
  SELECT org_id, current_stock, average_cost
  INTO v_org_id, v_previous_qty, v_avg_cost
  FROM parts
  WHERE id = p_part_id;
  
  -- Validar disponibilidade
  IF v_previous_qty < p_quantity THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponível: %, Solicitado: %',
      v_previous_qty, p_quantity;
  END IF;
  
  -- Calcular novo saldo
  v_new_qty := v_previous_qty - p_quantity;
  
  -- Atualizar peça
  UPDATE parts
  SET 
    current_stock = v_new_qty,
    updated_at = NOW()
  WHERE id = p_part_id;
  
  -- Registrar movimentação
  INSERT INTO inventory_movements (
    org_id, part_id, movement_type, quantity,
    unit_cost, total_cost,
    previous_quantity, new_quantity,
    reason, order_id, budget_id, metadata, created_by
  ) VALUES (
    v_org_id, p_part_id, p_movement_type, p_quantity,
    v_avg_cost, p_quantity * v_avg_cost,
    v_previous_qty, v_new_qty,
    p_reason, p_order_id, p_budget_id, p_metadata, auth.uid()
  ) RETURNING id INTO v_movement_id;
  
  RETURN jsonb_build_object(
    'movement_id', v_movement_id,
    'previous_quantity', v_previous_qty,
    'new_quantity', v_new_qty,
    'cost_per_unit', v_avg_cost,
    'total_cost', p_quantity * v_avg_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View de movimentações com detalhes
CREATE OR REPLACE VIEW movement_details AS
SELECT 
  im.*,
  p.code AS part_code,
  p.name AS part_name,
  p.category AS part_category,
  prof.name AS created_by_name,
  o.order_number,
  po.order_number AS purchase_order_number
FROM inventory_movements im
JOIN parts p ON p.id = im.part_id
JOIN profiles prof ON prof.id = im.created_by
LEFT JOIN orders o ON o.id = im.order_id
LEFT JOIN purchase_orders po ON po.id = im.purchase_order_id;

GRANT SELECT ON movement_details TO authenticated;
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Registrar Movimentação de Estoque                   [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  TIPO DE MOVIMENTAÇÃO *                                       │
│  ──────────────────────────────────────────────────────────  │
│  (•) Entrada  [ ] Saída  [ ] Transferência  [ ] Ajuste       │
│                                                               │
│  Tipo Específico: *                                           │
│  [▼ Compra              ]                                     │
│  Opções: Compra, Devolução Cliente, Produção Interna        │
│                                                               │
│  PEÇA *                                                       │
│  ──────────────────────────────────────────────────────────  │
│  [🔍 Buscar peça por código ou nome_____]  [+ Nova Peça]    │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ MOT-PIST-0001 - Pistão 86mm Mercedes OM 906            ││
│  │ Saldo Atual: 10 un | Custo Médio: R$ 245,00            ││
│  │ Estoque Mínimo: 10 un | Máximo: 50 un                  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  QUANTIDADE E CUSTO                                           │
│  ──────────────────────────────────────────────────────────  │
│  Quantidade: *           Unidade de Medida:                  │
│  [20__] un               un (unidade)                         │
│                                                               │
│  Custo Unitário: *       Total:                              │
│  [R$ 250,00_]            R$ 5.000,00                         │
│                                                               │
│  💡 Novo custo médio: R$ 247,50 (após entrada)              │
│                                                               │
│  DOCUMENTO FISCAL (opcional)                                  │
│  ──────────────────────────────────────────────────────────  │
│  Tipo de Documento:      Número:           Data:             │
│  [NF-e ▼]                [12345__]          [27/01/2025]     │
│                                                               │
│  Fornecedor:                                                  │
│  [Auto Peças ABC Ltda ▼]                                     │
│                                                               │
│  RASTREABILIDADE (opcional)                                   │
│  ──────────────────────────────────────────────────────────  │
│  Número do Lote:         Data de Fabricação:                 │
│  [LT20250127_]           [15/01/2025]                        │
│                                                               │
│  Data de Validade (se aplicável):                            │
│  [___________]                                                │
│                                                               │
│  LOCALIZAÇÃO                                                  │
│  ──────────────────────────────────────────────────────────  │
│  Armazenar em:                                                │
│  Almoxarifado: [Principal ▼]  Prateleira: [A3__]  Bin: [15_]│
│                                                               │
│  MOTIVO *                                                     │
│  ──────────────────────────────────────────────────────────  │
│  [Compra conforme NF-e 12345 - Fornecedor Auto Peças ABC   ]│
│  [Lote 20250127                                             ]│
│                                                               │
│  Observações Adicionais:                                      │
│  [____________________________________________________________]│
│  [Peças recebidas em perfeito estado. Armazenadas na A3-15 ]│
│                                                               │
│  RESUMO DA OPERAÇÃO                                           │
│  ──────────────────────────────────────────────────────────  │
│  Saldo Anterior:    10 un                                    │
│  (+) Entrada:       20 un                                    │
│  ─────────────────────────                                   │
│  = Novo Saldo:      30 un  ✅                                │
│                                                               │
│  Custo Anterior:    R$ 245,00/un                             │
│  Novo Custo Médio:  R$ 247,50/un                             │
│                                                               │
│                    [Cancelar]  [💾 Registrar Movimentação]   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📊 Histórico de Movimentações - Pistão 86mm (MOT-001)  [X] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Filtros:                                                     │
│  Período: [Últimos 30 dias ▼]  Tipo: [Todos ▼]             │
│                                            [📥 Exportar CSV] │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Data/Hora      │ Tipo       │ Qtd    │ Saldo │ Usuário  ││
│  ├────────────────┼────────────┼────────┼───────┼──────────┤│
│  │ 27/01 14:35   │ 🟢 Compra  │ +20 un │ 30 un │ Carlos   ││
│  │ NF-e 12345     │ R$ 250/un  │        │       │          ││
│  │ Lote: LT202501 │ [Ver Detalhes]                         ││
│  ├────────────────┼────────────┼────────┼───────┼──────────┤│
│  │ 25/01 10:20   │ 🔴 Consumo │ -5 un  │ 10 un │ João     ││
│  │ OS #1234       │ R$ 245/un  │        │       │          ││
│  │ Retífica biela │ [Ver Detalhes]                         ││
│  ├────────────────┼────────────┼────────┼───────┼──────────┤│
│  │ 20/01 16:45   │ 🟢 Compra  │ +10 un │ 15 un │ Carlos   ││
│  │ NF-e 11890     │ R$ 240/un  │        │       │          ││
│  │                │ [Ver Detalhes]                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  📈 RESUMO DO PERÍODO                                        │
│  ──────────────────────────────────────────────────────────  │
│  Total Entradas:     30 un     R$ 7.450,00                  │
│  Total Saídas:       15 un     R$ 3.675,00                  │
│  Saldo Final:        30 un     R$ 7.375,00                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Entrada por Compra
```gherkin
Given que tenho peça com saldo 10 @ R$ 100,00
When registro entrada de 20 @ R$ 120,00
Then saldo novo é 30 unidades
And custo médio novo é R$ 106,67
And movimentação é registrada
```

### E2E Test 2: Validação de Saída
```gherkin
Given que peça tem 5 unidades disponíveis
When tento registrar saída de 10 unidades
Then erro aparece: "Saldo insuficiente"
And movimentação não é processada
```

### E2E Test 3: Histórico Completo
```gherkin
Given que peça teve várias movimentações
When acesso histórico da peça
Then vejo todas as movimentações ordenadas por data
And cada uma mostra: tipo, quantidade, saldo resultante, usuário
```

### E2E Test 4: Consumo em OS
```gherkin
Given que estou registrando consumo de peça
When vinculo movimentação à OS #1234
Then order_id é gravado
And histórico mostra link para OS
And custo é debitado do estoque
```

### E2E Test 5: Transferência entre Locais
```gherkin
Given que seleciono tipo "Transferência"
When defino origem "Principal" e destino "Filial A"
And registro 10 unidades
Then saída é registrada de "Principal"
And entrada é registrada em "Filial A"
And saldo global permanece o mesmo
```

---

## 🚫 Negative Scope

**Não inclui:**
- Estorno automático de movimentações
- Integração com ERP externo
- Leitura de código de barras (futura)
- Aprovação em múltiplos níveis

---

## 🔗 Dependencies

**Blocks:**
- US-EST-004 (Alertas)
- US-EST-006 (Baixa por OS)

**Blocked by:**
- US-EST-001 (Cadastrar Peças)
- US-EST-002 (Saldo)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
