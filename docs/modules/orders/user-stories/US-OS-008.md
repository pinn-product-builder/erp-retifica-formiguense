# US-OS-008: Vinculação e Rastreamento de Materiais Aplicados

**ID:** US-OS-008  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 3  
**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Status:** To Do  

---

## 📋 User Story

**Como** técnico ou gerente de produção  
**Quero** registrar quais materiais foram aplicados em cada componente da OS  
**Para** ter rastreabilidade completa e controle de custos

---

## 🎯 Business Objective

Garantir rastreabilidade de peças, calcular custo real da OS e facilitar reposição em caso de reclamações de garantia.

---

## 📐 Business Rules

### RN001: Origem dos Materiais
Materiais podem ser aplicados de 3 formas:
1. **Orçamento Aprovado**: Peças vêm da tabela `budget_details.parts`
2. **Manual**: Técnico adiciona peça não prevista no orçamento
3. **Estoque**: Baixa automática do `parts_inventory`

### RN002: Estrutura do Registro
```typescript
interface OrderMaterial {
  id: string;
  order_id: string;
  workflow_id?: string; // Qual componente recebeu
  part_id: string;
  quantity_applied: number;
  unit_cost: number;
  applied_by: string;
  applied_at: timestamp;
  source: 'budget' | 'manual' | 'inventory';
  budget_id?: string; // Se veio de orçamento
  notes?: string;
  org_id: string;
}
```

### RN003: Validações ao Aplicar
- Quantidade disponível em estoque >= quantidade aplicada
- Se source='budget', verificar se peça consta no orçamento aprovado
- Não permitir duplicatas (mesma peça no mesmo componente)
- Registrar movimentação de estoque automaticamente

### RN004: Impacto no Estoque
Ao aplicar material:
```typescript
1. Criar registro em order_materials
2. Criar movimentação em inventory_movements:
   - movement_type: 'saida_producao'
   - order_id: [id da OS]
   - quantity: [negativo]
   - reason: 'Aplicado em OS #[numero]'
3. Atualizar parts_inventory.current_quantity -= quantity
```

### RN005: Visualização na Tab "Materiais"
**Tabela com colunas:**
| Código | Descrição | Qtd Aplicada | Custo Unit. | Total | Responsável | Data | Ações |

**Totalizadores:**
- Total de Peças: R$ X.XXX,XX
- Mão de Obra: R$ X.XXX,XX (vem do orçamento)
- **Total da OS**: R$ X.XXX,XX

### RN006: Permissões
- **Técnicos**: Podem aplicar materiais em OSs atribuídas a eles
- **Gerentes**: Podem aplicar em qualquer OS
- **Consultores**: Apenas visualização
- **Admins**: Podem editar/excluir aplicações

---

## ✅ Acceptance Criteria

**AC1:** Tab "Materiais" exibe tabela com materiais aplicados  
**AC2:** Botão "Aplicar Material" abre modal de seleção  
**AC3:** Modal lista peças disponíveis em estoque  
**AC4:** Campo quantidade valida estoque disponível  
**AC5:** Ao salvar, estoque é atualizado automaticamente  
**AC6:** Movimentação aparece em `inventory_movements`  
**AC7:** Totalizadores calculam corretamente  
**AC8:** Histórico mostra quem aplicou e quando

---

## 🛠️ Definition of Done

- [ ] Componente `OrderMaterialsTab.tsx` criado
- [ ] Componente `ApplyMaterialModal.tsx` criado
- [ ] Hook `useOrderMaterials.ts` implementado
- [ ] Integração com `useInventoryMovements`
- [ ] Trigger SQL para baixa automática no estoque
- [ ] View `v_order_materials_detailed` criada
- [ ] RLS policies verificadas
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/orders/
  ├── OrderMaterialsTab.tsx       (NEW)
  └── ApplyMaterialModal.tsx      (NEW)

src/hooks/
  ├── useOrderMaterials.ts        (NEW)
  └── useInventoryMovements.ts    (UPDATE)
```

---

## 🗄️ Database Schema

```sql
-- Tabela já existe, mas vamos documentar
CREATE TABLE public.order_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.order_workflow(id),
  part_id UUID NOT NULL REFERENCES public.parts_inventory(id),
  quantity_applied INTEGER NOT NULL CHECK (quantity_applied > 0),
  unit_cost NUMERIC(10,2) NOT NULL,
  applied_by UUID NOT NULL REFERENCES auth.users(id),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('budget', 'manual', 'inventory')),
  budget_id UUID REFERENCES public.detailed_budgets(id),
  notes TEXT,
  org_id UUID NOT NULL
);

-- Indexes
CREATE INDEX idx_order_materials_order ON public.order_materials(order_id);
CREATE INDEX idx_order_materials_part ON public.order_materials(part_id);
CREATE INDEX idx_order_materials_workflow ON public.order_materials(workflow_id);

-- View: Materiais com detalhes
CREATE VIEW v_order_materials_detailed AS
SELECT 
  om.*,
  pi.part_code,
  pi.part_name,
  pi.current_quantity AS stock_quantity,
  p.full_name AS applied_by_name,
  (om.quantity_applied * om.unit_cost) AS total_cost
FROM public.order_materials om
JOIN public.parts_inventory pi ON om.part_id = pi.id
JOIN public.profiles p ON om.applied_by = p.id;

-- Trigger: Baixa automática no estoque
CREATE OR REPLACE FUNCTION handle_material_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar movimentação de estoque
  INSERT INTO public.inventory_movements (
    part_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    reason,
    order_id,
    created_by,
    org_id
  )
  SELECT 
    NEW.part_id,
    'saida_producao',
    -NEW.quantity_applied,
    pi.current_quantity,
    pi.current_quantity - NEW.quantity_applied,
    'Aplicado em OS #' || o.order_number,
    NEW.order_id,
    NEW.applied_by,
    NEW.org_id
  FROM public.parts_inventory pi
  JOIN public.orders o ON o.id = NEW.order_id
  WHERE pi.id = NEW.part_id;

  -- Atualizar quantidade em estoque
  UPDATE public.parts_inventory
  SET current_quantity = current_quantity - NEW.quantity_applied
  WHERE id = NEW.part_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_material_application
AFTER INSERT ON public.order_materials
FOR EACH ROW
EXECUTE FUNCTION handle_material_application();

-- RLS
ALTER TABLE public.order_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org materials"
ON public.order_materials FOR SELECT
USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Technicians can apply materials"
ON public.order_materials FOR INSERT
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')::uuid AND
  applied_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.order_workflow ow
    WHERE ow.order_id = order_materials.order_id
    AND ow.assigned_to = auth.uid()
  )
);

CREATE POLICY "Managers can apply any materials"
ON public.order_materials FOR INSERT
WITH CHECK (
  org_id = (auth.jwt() ->> 'org_id')::uuid AND
  (auth.jwt() ->> 'role' IN ('manager', 'admin'))
);
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Materiais Aplicados                     [🔧 Aplicar Material]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Código  │ Descrição        │ Qtd │ R$ Unit│ Total │ Resp. │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ P-001   │ Pistão Std       │  4  │ 250,00 │ 1.000 │ João  │ │
│  │ P-045   │ Junta Cabeçote   │  1  │ 180,00 │   180 │ João  │ │
│  │ P-120   │ Bronzina Biela   │  8  │  45,00 │   360 │ Maria │ │
│  │ P-089   │ Anel de Segmento │ 12  │  22,00 │   264 │ João  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📊 Resumo de Custos                                          ││
│  │                                                              ││
│  │ Total em Peças:        R$ 1.804,00                          ││
│  │ Mão de Obra:           R$ 3.500,00                          ││
│  │ ─────────────────────────────────────────                  ││
│  │ Total da OS:           R$ 5.304,00                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

Modal: Aplicar Material
┌─────────────────────────────────────────────────────────────────┐
│  Aplicar Material                                            [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Componente:  [Dropdown: Bloco do Motor              ▼]         │
│                                                                   │
│  Peça:        [Autocomplete: Digite código ou nome...   ]       │
│               💡 P-001 - Pistão Std (10 em estoque)              │
│               💡 P-045 - Junta Cabeçote (5 em estoque)           │
│                                                                   │
│  Quantidade:  [Input: 4                              ]          │
│               ℹ️ Disponível: 10 unidades                         │
│                                                                   │
│  Custo Unit.: [R$ 250,00                              ]          │
│               (Custo médio do estoque)                            │
│                                                                   │
│  Total:       R$ 1.000,00                                        │
│                                                                   │
│  Observações: [TextArea: Opcional...                  ]          │
│                                                                   │
│                                      [Cancelar]  [Aplicar Peça]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Aplicar Material
```gherkin
Given que estou na tab "Materiais" de uma OS
And há 10 unidades de "Pistão Std" em estoque
When clico em "Aplicar Material"
And seleciono componente "Bloco"
And busco peça "P-001"
And defino quantidade "4"
And clico em "Aplicar Peça"
Then material aparece na tabela
And estoque de "P-001" fica com 6 unidades
And movimentação é criada em inventory_movements
And toast "Material aplicado com sucesso" é exibido
```

### E2E Test 2: Validação de Estoque Insuficiente
```gherkin
Given que há apenas 2 unidades de "Junta" em estoque
When tento aplicar 5 unidades
And clico em "Aplicar Peça"
Then vejo erro "Estoque insuficiente (disponível: 2)"
And modal permanece aberto
```

### E2E Test 3: Totalizadores
```gherkin
Given que uma OS tem 3 peças aplicadas:
  | Peça      | Qtd | Unit  | Total |
  | Pistão    | 4   | 250   | 1000  |
  | Junta     | 1   | 180   | 180   |
  | Bronzina  | 8   | 45    | 360   |
And mão de obra do orçamento é R$ 3.500
Then "Total em Peças" = R$ 1.540
And "Total da OS" = R$ 5.040
```

---

## 🚫 Negative Scope

**Não inclui:**
- Devolução de materiais ao estoque
- Troca de peças aplicadas
- Controle de lotes/validades
- Cálculo de margem de lucro

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-OS-001 (Criar OS)
- US-OS-004 (Visualizar detalhes)
- Módulo de Estoque (parts_inventory)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
