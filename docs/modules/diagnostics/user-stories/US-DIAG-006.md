# US-DIAG-006: Visualizar Histórico de Diagnósticos

**ID:** US-DIAG-006  
**Epic:** Diagnósticos  
**Sprint:** 3  
**Prioridade:** Média  
**Estimativa:** 3 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** técnico/gerente  
**Quero** visualizar histórico completo de diagnósticos de uma OS  
**Para** comparar condições ao longo do tempo e rastrear evolução

---

## 🎯 Business Objective

Fornecer rastreabilidade completa, permitindo análise de recorrência de problemas e validação de serviços executados.

---

## 📐 Business Rules

### RN001: Localização do Histórico
**Onde exibir:**
- Tab "Diagnósticos" na página OrderDetails
- Expandível por componente
- Ordenado por data (mais recente primeiro)

### RN002: Informações Exibidas
**Card de Diagnóstico:**
```typescript
interface DiagnosticHistoryCard {
  id: string;
  component: ComponentType;
  diagnosed_at: Date;
  diagnosed_by: Profile;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  approved_by?: Profile;
  approved_at?: Date;
  
  summary: {
    total_items: number;
    answered_items: number;
    completion_percentage: number;
    suggested_services_count: number;
    photos_count: number;
  };
  
  key_findings: string[]; // Principais observações
}
```

### RN003: Visualização Detalhada
**Ao expandir um diagnóstico:**
- Lista completa de campos respondidos
- Fotos anexadas (thumbnail clicável)
- Serviços sugeridos
- Observações técnicas
- Metadados (quem fez, quando, tempo gasto)

### RN004: Comparação entre Diagnósticos
**Se houver múltiplos diagnósticos do mesmo componente:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 COMPARAÇÃO: Bloco                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Campo                │ Atual (27/01) │ Anterior (15/12) │
│ ─────────────────────┼───────────────┼─────────────────│
│ Estado das camisas   │ Ruim          │ Regular          │
│ Possui trincas       │ Sim           │ Não              │
│ Desgaste irregular   │ Sim           │ Sim              │
│ Avaliação usinagem   │ 4 (Pesada)    │ 2 (Leve)         │
│                                                          │
│ ⚠️ Piora detectada em 2 de 4 critérios                 │
└─────────────────────────────────────────────────────────┘
```

### RN005: Filtros
- Por componente
- Por técnico responsável
- Por período (data inicial - data final)
- Por status (pendente, em progresso, completo, aprovado)

### RN006: Permissões
- Todos os usuários da org podem visualizar histórico
- Apenas técnicos/gerentes podem editar diagnósticos não aprovados
- Diagnósticos aprovados são read-only

---

## ✅ Acceptance Criteria

**AC1:** Tab "Diagnósticos" aparece em OrderDetails  
**AC2:** Lista de diagnósticos ordenada por data  
**AC3:** Card exibe resumo do diagnóstico  
**AC4:** Expandir card mostra detalhes completos  
**AC5:** Fotos são clicáveis e abrem lightbox  
**AC6:** Filtros funcionam corretamente

---

## 🛠️ Definition of Done

- [x] Tab "Diagnósticos" adicionada em OrderDetails
- [x] Componente `DiagnosticHistory.tsx` criado
- [x] Componente `DiagnosticCard.tsx` criado
- [x] Hook `useDiagnosticHistory.ts` implementado
- [x] Filtros funcionais
- [x] Comparação entre diagnósticos (opcional)
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/orders/
  └── OrderDetails.tsx             (UPDATE - nova tab)

src/components/diagnostics/
  ├── DiagnosticHistory.tsx        (NEW)
  ├── DiagnosticCard.tsx           (NEW)
  └── DiagnosticComparison.tsx     (NEW - opcional)

src/hooks/
  └── useDiagnosticHistory.ts      (NEW)
```

---

## 🗄️ Database Changes

```sql
-- View para histórico de diagnósticos
CREATE OR REPLACE VIEW v_diagnostic_history AS
SELECT 
  dr.id,
  dr.order_id,
  dr.component,
  dr.checklist_id,
  dr.status,
  dr.diagnosed_at,
  dr.approved_at,
  
  -- Técnico que diagnosticou
  p_diagnosed.full_name AS diagnosed_by_name,
  p_diagnosed.avatar_url AS diagnosed_by_avatar,
  
  -- Quem aprovou
  p_approved.full_name AS approved_by_name,
  p_approved.avatar_url AS approved_by_avatar,
  
  -- Resumo
  COUNT(dri.id) AS total_items,
  COUNT(dri.id) FILTER (WHERE dri.response_value IS NOT NULL) AS answered_items,
  ROUND(
    (COUNT(dri.id) FILTER (WHERE dri.response_value IS NOT NULL)::NUMERIC / 
     COUNT(dri.id)::NUMERIC) * 100
  ) AS completion_percentage,
  
  -- Serviços e fotos
  COUNT(DISTINCT jsonb_array_elements_text(dri.suggested_services)) AS suggested_services_count,
  SUM(array_length(dri.photos, 1)) AS photos_count,
  
  -- Principais observações (primeiras 3 não vazias)
  jsonb_agg(
    dri.notes ORDER BY dri.created_at
  ) FILTER (WHERE dri.notes IS NOT NULL AND dri.notes != '') AS key_findings,
  
  -- Detalhes completos para expansão
  jsonb_agg(
    jsonb_build_object(
      'item_id', dri.id,
      'checklist_item_id', dri.checklist_item_id,
      'item_name', dci.item_name,
      'response_value', dri.response_value,
      'photos', dri.photos,
      'notes', dri.notes,
      'suggested_services', dri.suggested_services
    ) ORDER BY dci.display_order
  ) AS response_details

FROM diagnostic_responses dr
JOIN diagnostic_response_items dri ON dri.response_id = dr.id
JOIN diagnostic_checklist_items dci ON dci.id = dri.checklist_item_id
LEFT JOIN profiles p_diagnosed ON p_diagnosed.id = dr.diagnosed_by
LEFT JOIN profiles p_approved ON p_approved.id = dr.approved_by

GROUP BY 
  dr.id, dr.order_id, dr.component, dr.checklist_id, 
  dr.status, dr.diagnosed_at, dr.approved_at,
  p_diagnosed.full_name, p_diagnosed.avatar_url,
  p_approved.full_name, p_approved.avatar_url;

-- RLS (herda de diagnostic_responses)
-- Nenhuma policy adicional necessária
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  OS #1234 - Mercedes-Benz OM 906                            │
├─────────────────────────────────────────────────────────────┤
│  [Geral] [Metrologia] [Diagnósticos] [Orçamentos] [...]    │
│  ───────────────────────────────────────────────────────────│
│                                                               │
│  📋 HISTÓRICO DE DIAGNÓSTICOS                                │
│                                                               │
│  Filtros: [▼ Componente: Todos] [▼ Técnico: Todos]         │
│           [📅 01/01/2025 - 31/01/2025]                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅ Bloco - Diagnóstico Aprovado               [▼ Ver +] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Diagnosticado por: 👤 João Silva                        ││
│  │ Data: 27/01/2025 14:35                                  ││
│  │ Aprovado por: 👤 Carlos Gerente em 27/01/2025 16:20    ││
│  │                                                          ││
│  │ Resumo:                                                  ││
│  │ • 15/15 campos preenchidos (100%)                       ││
│  │ • 4 serviços sugeridos                                  ││
│  │ • 6 fotos anexadas                                      ││
│  │                                                          ││
│  │ Principais Observações:                                  ││
│  │ ⚠️ Camisa 1 apresenta desgaste acentuado                ││
│  │ ⚠️ Trinca visível no bloco próximo à camisa 3          ││
│  │                                                          ││
│  │ [Ver Detalhes Completos]                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅ Cabeçote - Diagnóstico Aprovado            [▼ Ver +] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Diagnosticado por: 👤 Marcos Pereira                    ││
│  │ Data: 26/01/2025 10:15                                  ││
│  │                                                          ││
│  │ Resumo:                                                  ││
│  │ • 12/12 campos preenchidos (100%)                       ││
│  │ • 2 serviços sugeridos                                  ││
│  │ • 4 fotos anexadas                                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⏳ Virabrequim - Em Progresso                 [▼ Ver +] ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Diagnosticado por: 👤 João Silva                        ││
│  │ Data: 27/01/2025 09:00 (em andamento)                   ││
│  │                                                          ││
│  │ Resumo:                                                  ││
│  │ • 7/10 campos preenchidos (70%)                         ││
│  │ • 1 serviço sugerido                                    ││
│  │ • 2 fotos anexadas                                      ││
│  │                                                          ││
│  │ [Continuar Diagnóstico]                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ DETALHES EXPANDIDOS (ao clicar "Ver +") ───────────────┐│
│  │                                                     [▲]  ││
│  │ RESPOSTAS DETALHADAS:                                   ││
│  │                                                          ││
│  │ 1. Estado das camisas: Ruim                             ││
│  │    → Sugeriu: BLC001 - Retífica de camisa              ││
│  │                                                          ││
│  │ 2. Possui trincas visíveis: Sim                         ││
│  │    → Sugeriu: BLC002 - Soldagem de trinca              ││
│  │                                                          ││
│  │ 3. Fotos das camisas:                                   ││
│  │    [🖼️ IMG_001] [🖼️ IMG_002] [🖼️ IMG_003]              ││
│  │                                                          ││
│  │ 4. Observações gerais:                                  ││
│  │    Camisa 1 apresenta desgaste acentuado na parte      ││
│  │    superior. Recomenda-se retífica. Trinca visível     ││
│  │    próximo à camisa 3 requer atenção especial.         ││
│  │                                                          ││
│  │ ... (restante dos campos)                               ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Visualizar Histórico
```gherkin
Given que estou em OrderDetails da OS #1234
And OS possui 3 diagnósticos (2 aprovados, 1 em progresso)
When clico na tab "Diagnósticos"
Then vejo lista com 3 cards
And cards estão ordenados por data (mais recente primeiro)
And cada card mostra resumo correto
```

### E2E Test 2: Expandir Detalhes
```gherkin
Given que estou vendo histórico de diagnósticos
When clico em "Ver +" no card de Bloco
Then card expande
And mostra todas as respostas detalhadas
And fotos são exibidas em thumbnail
And posso clicar nas fotos para abrir lightbox
```

### E2E Test 3: Filtrar por Componente
```gherkin
Given que histórico tem diagnósticos de 7 componentes
When seleciono filtro "Componente: Bloco"
Then apenas diagnósticos de Bloco são exibidos
And contador mostra "1 diagnóstico"
```

### E2E Test 4: Continuar Diagnóstico em Progresso
```gherkin
Given que há diagnóstico "Em Progresso" de Virabrequim
When clico em "Continuar Diagnóstico"
Then sou redirecionado para wizard de diagnóstico
And wizard abre no componente Virabrequim
And campos já preenchidos permanecem salvos
```

---

## 🚫 Negative Scope

**Não inclui:**
- Exportação de histórico em PDF
- Gráficos de evolução de componentes
- Comparação automática com diagnósticos anteriores (apenas visualização)
- Edição de diagnósticos aprovados

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-DIAG-002 (Responder Diagnóstico)
- US-DIAG-005 (Aprovar Diagnóstico)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
