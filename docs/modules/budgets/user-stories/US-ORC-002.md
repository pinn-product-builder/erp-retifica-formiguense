# US-ORC-002: Adicionar Serviços e Peças ao Orçamento

**ID:** US-ORC-002  
**Epic:** Orçamentos  
**Sprint:** 4  
**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Status:** Backlog  

---

## 📋 User Story

**Como** gerente comercial  
**Quero** adicionar serviços e peças ao orçamento de forma detalhada  
**Para** compor proposta completa com todos os itens necessários

---

## 🎯 Business Objective

Permitir composição detalhada do orçamento com serviços e peças, incluindo quantidades, valores unitários e descrições técnicas.

---

## 📐 Business Rules

### RN007: Estrutura de Serviços
**Campos obrigatórios por serviço:**
```typescript
interface ServiceItem {
  service_code: string;        // Código único do serviço
  service_name: string;         // Nome do serviço
  description: string;          // Descrição detalhada
  quantity: number;             // Quantidade (geralmente 1)
  unit_price: number;          // Valor unitário
  total_price: number;         // Calculado: quantity * unit_price
  estimated_hours: number;     // Horas estimadas de trabalho
}
```

### RN008: Estrutura de Peças
**Campos obrigatórios por peça:**
```typescript
interface PartItem {
  part_id: string;             // ID da peça no estoque
  part_code: string;           // Código da peça
  part_name: string;           // Nome/descrição da peça
  quantity: number;            // Quantidade necessária
  unit_price: number;          // Valor unitário
  total_price: number;         // Calculado: quantity * unit_price
  in_stock: boolean;           // Disponível no estoque?
  supplier?: string;           // Fornecedor (se não em estoque)
  lead_time_days?: number;     // Prazo de entrega (se não em estoque)
}
```

### RN009: Validações de Entrada
- **Quantidade:** Maior que zero
- **Valor unitário:** Maior ou igual a zero
- **Descrição:** Mínimo 10 caracteres para serviços
- **Peça:** Deve existir no catálogo ou ser cadastrada

### RN010: Verificação de Estoque
- Sistema verifica disponibilidade em tempo real
- Se peça não disponível, exibe:
  - Fornecedores disponíveis
  - Prazo de entrega estimado
  - Sugestão de alternativas (se houver)

### RN011: Cálculo Automático de Totais
```typescript
// Para cada item
item.total_price = item.quantity * item.unit_price;

// Subtotal do orçamento
subtotal = sum(services.total_price) + sum(parts.total_price);
```

### RN012: Sugestões Inteligentes
**Baseado em diagnóstico:**
- Se existe `diagnostic_response_id`, sistema sugere:
  - Serviços recomendados no diagnóstico
  - Peças identificadas como necessárias
  - Serviços complementares comuns

### RN013: Limites e Validações
- **Máximo de itens:** 100 serviços + 200 peças por orçamento
- **Valor mínimo do item:** R$ 0,01
- **Duplicação:** Sistema alerta sobre itens duplicados

---

## ✅ Acceptance Criteria

**AC7:** Botão "Adicionar Serviço" abre modal de seleção  
**AC8:** Modal permite buscar serviços do catálogo  
**AC9:** Campos quantidade e preço são editáveis  
**AC10:** Total do item é calculado automaticamente  
**AC11:** Botão "Adicionar Peça" verifica estoque  
**AC12:** Lista mostra itens adicionados com ações (editar/remover)  
**AC13:** Subtotal é atualizado em tempo real  
**AC14:** Sugestões de diagnóstico aparecem destacadas

---

## 🛠️ Definition of Done

- [ ] Componente `ServiceItemForm.tsx` implementado
- [ ] Componente `PartItemForm.tsx` implementado
- [ ] Hook `useServiceCatalog.ts` criado
- [ ] Hook `usePartsCatalog.ts` criado
- [ ] Validações Zod para itens
- [ ] Verificação de estoque em tempo real
- [ ] Cálculos automáticos funcionais
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/budgets/
  ├── BudgetWizard.tsx             (UPDATE - Step 2 e 3)
  ├── ServiceItemForm.tsx          (NEW)
  ├── PartItemForm.tsx             (NEW)
  ├── ServiceSelector.tsx          (NEW)
  └── PartSelector.tsx             (NEW)

src/hooks/
  ├── useServiceCatalog.ts         (NEW)
  └── usePartsCatalog.ts           (NEW)
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Orçamento ORC-2025-0004-BIELA - Passo 2/5: Serviços   [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  💡 SUGESTÕES DO DIAGNÓSTICO (DR-2025-0001)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✓ Retífica de bielas                                    ││
│  │   Horas: 4h | Valor sugerido: R$ 450,00                 ││
│  │   [+ Adicionar]                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  SERVIÇOS ADICIONADOS (1)                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ SRV-001 | Retífica de bielas                            ││
│  │ Descrição: Retífica com alinhamento a laser             ││
│  │                                                          ││
│  │ Qtd: [1] × R$ 450,00 = R$ 450,00                        ││
│  │ Horas estimadas: 4h                                      ││
│  │                                                          ││
│  │ [✏️ Editar] [🗑️ Remover]                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [+ Adicionar Outro Serviço]                                 │
│                                                               │
│  ┌─ MODAL: Adicionar Serviço ──────────────────────────────┐│
│  │                                                       [X] ││
│  │ Buscar serviço:                                          ││
│  │ [🔍 retífica de biela_____________________________]      ││
│  │                                                          ││
│  │ Resultados (3):                                          ││
│  │ ┌────────────────────────────────────────────────────┐  ││
│  │ │ (•) SRV-001 - Retífica de bielas              R$ 450││
│  │ │     Horas: 4h                                       │  ││
│  │ │ [ ] SRV-002 - Retífica de biela com bronzina  R$ 580││
│  │ │     Horas: 5h                                       │  ││
│  │ │ [ ] SRV-015 - Balanceamento de bielas         R$ 120││
│  │ │     Horas: 1h                                       │  ││
│  │ └────────────────────────────────────────────────────┘  ││
│  │                                                          ││
│  │ Código: *                                                ││
│  │ [SRV-001                    ]                            ││
│  │                                                          ││
│  │ Nome do Serviço: *                                       ││
│  │ [Retífica de bielas         ]                            ││
│  │                                                          ││
│  │ Descrição: *                                             ││
│  │ [Retífica com alinhamento a laser e verificação         ]││
│  │ [dimensional completa                                   ]││
│  │                                                          ││
│  │ Quantidade: *        Valor Unitário: *                   ││
│  │ [1    ]              [R$ 450,00    ]                     ││
│  │                                                          ││
│  │ Horas Estimadas: *   Total:                              ││
│  │ [4      ]            R$ 450,00                           ││
│  │                                                          ││
│  │                            [Cancelar]  [Adicionar Item]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  SUBTOTAL SERVIÇOS: R$ 450,00                                │
│                                                               │
│                   [← Voltar]  [Próximo: Peças →]             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Orçamento ORC-2025-0004-BIELA - Passo 3/5: Peças      [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  💡 SUGESTÕES DO DIAGNÓSTICO (DR-2025-0001)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⚠️ Jogo de bronzinas de biela 0.50mm                    ││
│  │   Estoque: 2 unidades | Preço: R$ 380,00                ││
│  │   [+ Adicionar]                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  PEÇAS ADICIONADAS (2)                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ PCA-1523 | Jogo de bronzinas de biela 0.50mm  ✅ Estoque││
│  │                                                          ││
│  │ Qtd: [1] × R$ 380,00 = R$ 380,00                        ││
│  │ Disponível: 2 unidades                                   ││
│  │                                                          ││
│  │ [✏️ Editar] [🗑️ Remover]                                ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ PCA-2801 | Parafusos de biela (conjunto)      ⚠️ Pedido ││
│  │                                                          ││
│  │ Qtd: [1] × R$ 95,00 = R$ 95,00                          ││
│  │ Fornecedor: Auto Peças XYZ                               ││
│  │ Prazo: 3-5 dias úteis                                    ││
│  │                                                          ││
│  │ [✏️ Editar] [🗑️ Remover]                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  [+ Adicionar Outra Peça]                                    │
│                                                               │
│  RESUMO:                                                      │
│  • Subtotal Serviços: R$ 450,00                              │
│  • Subtotal Peças:    R$ 475,00                              │
│  • SUBTOTAL:          R$ 925,00                              │
│                                                               │
│  ⚠️ 1 peça requer pedido ao fornecedor (prazo: 3-5 dias)    │
│                                                               │
│              [← Voltar]  [Próximo: Cálculos →]               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Adicionar Serviço do Catálogo
```gherkin
Given que estou no passo 2 do wizard
When busco por "retífica"
And seleciono "SRV-001 - Retífica de bielas"
And preencho quantidade "1"
And clico em "Adicionar Item"
Then serviço aparece na lista
And subtotal é atualizado para R$ 450,00
```

### E2E Test 2: Validação de Quantidade Inválida
```gherkin
Given que estou adicionando um serviço
When preencho quantidade "0"
And clico em "Adicionar Item"
Then erro de validação aparece
And mensagem: "Quantidade deve ser maior que zero"
```

### E2E Test 3: Adicionar Peça em Estoque
```gherkin
Given que estou no passo 3 do wizard
When busco por "bronzina"
And seleciono "PCA-1523 - Jogo de bronzinas"
Then sistema mostra badge "✅ Estoque"
And exibe "Disponível: 2 unidades"
And não solicita prazo de entrega
```

### E2E Test 4: Adicionar Peça Sem Estoque
```gherkin
Given que estou adicionando uma peça
When seleciono peça sem estoque
Then sistema mostra badge "⚠️ Pedido"
And exibe fornecedores disponíveis
And solicita prazo de entrega
And alerta aparece no resumo
```

### E2E Test 5: Sugestões do Diagnóstico
```gherkin
Given que orçamento está vinculado a diagnóstico
When abro passo de serviços
Then seção "💡 SUGESTÕES" aparece no topo
And lista serviços recomendados no diagnóstico
And botão [+ Adicionar] permite adicionar rapidamente
```

### E2E Test 6: Editar Item Adicionado
```gherkin
Given que tenho serviço adicionado
When clico em "✏️ Editar"
Then modal abre com dados preenchidos
When altero quantidade para "2"
And clico em "Salvar"
Then item é atualizado
And total é recalculado
```

### E2E Test 7: Remover Item
```gherkin
Given que tenho 2 serviços adicionados
When clico em "🗑️ Remover" no primeiro
Then confirmação aparece
When confirmo exclusão
Then item é removido da lista
And subtotal é recalculado
```

---

## 🚫 Negative Scope

**Não inclui:**
- Importação em massa de itens (CSV/Excel)
- Criação de novos serviços inline (deve usar catálogo)
- Negociação de preços com fornecedor
- Reserva automática de estoque

---

## 🔗 Dependencies

**Blocks:**
- US-ORC-003 (Cálculos)

**Blocked by:**
- US-ORC-001 (Criar Orçamento)

**Related:**
- US-EST-005 (Catálogo de Peças)
- US-DIAG-004 (Sugestões de Serviços)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
