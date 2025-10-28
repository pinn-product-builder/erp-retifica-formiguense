# US-MET-003: Etapa 2 - Registro de Componentes Recebidos

**ID:** US-MET-003  
**Epic:** Metrologia Digital  
**Sprint:** 2  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** To Do  

---

## 📋 User Story

**Como** metrologista  
**Quero** registrar quais componentes foram fisicamente recebidos para análise  
**Para** documentar o estado de chegada e componentes presentes

---

## 🎯 Business Objective

Criar checklist digital de componentes recebidos, substituindo o formulário em papel e garantindo rastreabilidade desde a entrada.

---

## 📐 Business Rules

### RN001: Componentes Possíveis
Lista completa de componentes de um motor:
- Bloco do Motor
- Cabeçote(s)
- Virabrequim
- Pistões
- Bielas
- Comando de Válvulas
- Eixo Balanceador
- Carter
- Tampa de Válvulas
- Coletor de Admissão
- Coletor de Escape
- Volante do Motor

### RN002: Informações por Componente
Para cada componente marcado como presente:
```typescript
interface ReceivedComponent {
  component_name: string;
  is_present: boolean;
  quantity?: number; // Ex: 4 pistões, 2 cabeçotes
  condition: 'bom' | 'regular' | 'ruim';
  visual_notes?: string;
  requires_analysis: boolean;
}
```

### RN003: Fotos Obrigatórias
- Mínimo 1 foto geral do conjunto
- Recomendado: 1 foto por componente principal
- Upload via drag & drop ou câmera
- Vinculação automática à inspeção

### RN004: Validações
- Pelo menos 1 componente deve estar presente
- Se componente marcado como "requer análise", obrigatório adicionar nota visual
- Fotos obrigatórias antes de avançar

### RN005: Dados Salvos no JSONB
```json
{
  "received_components": [
    {
      "component_name": "bloco",
      "is_present": true,
      "quantity": 1,
      "condition": "regular",
      "visual_notes": "Riscos superficiais na superfície de vedação",
      "requires_analysis": true
    },
    {
      "component_name": "pistoes",
      "is_present": true,
      "quantity": 4,
      "condition": "ruim",
      "visual_notes": "Desgaste severo nas saias",
      "requires_analysis": true
    }
  ],
  "general_photos": [
    "https://supabase.co/storage/v1/.../photo1.jpg",
    "https://supabase.co/storage/v1/.../photo2.jpg"
  ]
}
```

---

## ✅ Acceptance Criteria

**AC1:** Stepper mostra Etapa 2/5 ativa  
**AC2:** Lista de componentes com checkboxes visuais  
**AC3:** Ao marcar componente, campos de detalhes aparecem  
**AC4:** Upload de fotos funcional (mínimo 1)  
**AC5:** Botão "Salvar Rascunho" persiste dados  
**AC6:** Botão "Próxima Etapa" valida e avança para US-MET-004  
**AC7:** Dados salvos em `metrology_inspections.received_components`

---

## 🛠️ Definition of Done

- [ ] Componente `Step2ReceivedComponents.tsx` criado
- [ ] Hook `useMetrologyStep2.ts` implementado
- [ ] Schema de validação Zod criado
- [ ] Integração com Supabase Storage
- [ ] Atualização de JSONB no banco
- [ ] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/metrology/
  ├── steps/
  │   └── Step2ReceivedComponents.tsx  (NEW)
  └── ComponentCheckbox.tsx            (NEW)

src/hooks/
  └── useMetrologyStep2.ts             (NEW)
```

---

## 🗄️ Database Changes

```sql
-- Já está implementado em US-MET-001
-- Campo JSONB: motor_identification

-- Apenas adicionar campo para received_components
ALTER TABLE public.metrology_inspections
ADD COLUMN IF NOT EXISTS received_components JSONB;

-- Exemplo de dados:
/*
{
  "received_components": [
    {
      "component_name": "bloco",
      "is_present": true,
      "quantity": 1,
      "condition": "regular",
      "visual_notes": "Riscos superficiais",
      "requires_analysis": true
    }
  ],
  "general_photos": [
    "url1.jpg",
    "url2.jpg"
  ]
}
*/
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Inspeção #MET-2025-0042                                   [X]   │
├─────────────────────────────────────────────────────────────────┤
│  ●───●───○───○───○                                               │
│  1   2   3   4   5                                               │
│  ✓  [2/5] Componentes Recebidos                                  │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📦 Componentes Presentes                                        │
│                                                                   │
│  [✓] Bloco do Motor                                              │
│       Quantidade: [1         ]  Condição: [Regular    ▼]        │
│       Observações: [Riscos superficiais na face...    ]         │
│       [✓] Requer análise dimensional                             │
│                                                                   │
│  [✓] Pistões                                                     │
│       Quantidade: [4         ]  Condição: [Ruim       ▼]        │
│       Observações: [Desgaste severo nas saias...      ]         │
│       [✓] Requer análise dimensional                             │
│                                                                   │
│  [✓] Bielas                                                      │
│       Quantidade: [4         ]  Condição: [Regular    ▼]        │
│       [ ] Requer análise dimensional                             │
│                                                                   │
│  [ ] Virabrequim                                                 │
│  [ ] Cabeçote                                                    │
│  [ ] Comando de Válvulas                                         │
│  [ ] Eixo Balanceador                                            │
│  [ ] Carter                                                      │
│                                                                   │
│  📷 Fotos Gerais (2)                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐                                        │
│  │ 🖼️  │ │ 🖼️  │ │  +  │  Adicionar fotos                      │
│  └─────┘ └─────┘ └─────┘                                        │
│                                                                   │
│                                                                   │
│                  [← Etapa Anterior] [Salvar Rascunho]           │
│                                     [Próxima Etapa →]            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Registro de Componentes
```gherkin
Given que estou na Etapa 2 da inspeção MET-2025-0042
When marco checkbox "Bloco do Motor"
And preencho quantidade "1"
And seleciono condição "Regular"
And adiciono nota "Riscos superficiais"
And marco "Requer análise"
And faço upload de 2 fotos
And clico em "Próxima Etapa"
Then dados são salvos em received_components
And avanço para Etapa 3 (US-MET-004)
```

### E2E Test 2: Validação de Fotos Obrigatórias
```gherkin
Given que marquei 3 componentes
And não fiz upload de nenhuma foto
When clico em "Próxima Etapa"
Then vejo erro "Adicione pelo menos 1 foto geral"
And permaneço na Etapa 2
```

### E2E Test 3: Salvar Rascunho
```gherkin
Given que preenchi parcialmente a etapa
When clico em "Salvar Rascunho"
Then dados são persistidos
And toast "Rascunho salvo" é exibido
And posso sair e voltar depois
```

---

## 🚫 Negative Scope

**Não inclui:**
- Análise dimensional nesta etapa
- Geração de relatório
- Integração com orçamento
- Histórico de inspeções anteriores do motor

---

## 🔗 Dependencies

**Blocks:**
- US-MET-004 (Etapa 3)

**Blocked by:**
- US-MET-001 (Iniciar inspeção)
- US-MET-002 (Etapa 1 - Identificação)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
