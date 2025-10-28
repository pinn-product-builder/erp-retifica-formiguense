# US-WKF-001: Visualizar Kanban com 14 Colunas

**ID:** US-WKF-001  
**Epic:** Workflow Kanban  
**Sprint:** 2  
**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** gerente de produção  
**Quero** visualizar todas as OSs em formato Kanban com 14 colunas  
**Para** acompanhar o fluxo completo de trabalho em tempo real

---

## 🎯 Business Objective

Fornecer visão consolidada do pipeline produtivo, facilitando identificação de gargalos e gestão de capacidade.

---

## 📐 Business Rules

### RN001: Estrutura do Kanban
**14 Colunas (Stages):**
1. Nova OS
2. Aguardando Coleta
3. Em Transporte
4. Recepção/Check-in
5. Aguardando Metrologia
6. Em Metrologia
7. Aguardando Diagnóstico
8. Em Diagnóstico
9. Aguardando Orçamento
10. Orçamento em Aprovação
11. Aguardando Produção
12. Em Produção
13. Finalizado - Aguardando Entrega
14. Entregue

### RN002: Cards
**Cada card exibe:**
- Número da OS (destaque)
- Nome do cliente
- Marca/Modelo do motor
- Badge de prioridade (Alta/Média/Baixa)
- Avatar do técnico responsável
- Contador de componentes (ex: 3/7 concluídos)
- Indicador de atraso (se prazo vencido)
- Badge de status de checklist

### RN003: Regras de Exibição
- Scroll horizontal para navegar entre colunas
- Máximo 50 cards por coluna antes de carregar mais
- Loading skeleton durante carregamento
- Atualização em tempo real via subscriptions

### RN004: Permissões de Visualização
- **Admin/Gerente:** Vê todos os cards
- **Consultor:** Vê apenas OSs que criou ou está atribuído
- **Técnico:** Vê apenas OSs atribuídas a ele
- **Financeiro:** Vê todas, mas sem detalhes técnicos

---

## ✅ Acceptance Criteria

**AC1:** Kanban renderiza 14 colunas horizontalmente  
**AC2:** Cards exibem informações corretas da OS  
**AC3:** Badges de prioridade têm cores distintas  
**AC4:** Indicador de atraso aparece em OSs vencidas  
**AC5:** Scroll horizontal funciona suavemente  
**AC6:** Cards são filtrados por permissão do usuário

---

## 🛠️ Definition of Done

- [x] Componente `KanbanBoard.tsx` criado
- [x] Hook `useOrderWorkflow.ts` implementado
- [x] Integração com view `v_workflows_with_pending_checklists`
- [x] Subscriptions em tempo real configuradas
- [x] Responsividade mobile testada
- [x] Permissões RLS validadas
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── KanbanBoard.tsx          (EXISTS)
  ├── KanbanColumn.tsx         (EXISTS)
  └── OrderCard.tsx            (EXISTS)

src/hooks/
  └── useOrderWorkflow.ts      (EXISTS)
```

---

## 🗄️ Database Schema

```sql
-- View v_workflows_with_pending_checklists (já existe)
CREATE OR REPLACE VIEW v_workflows_with_pending_checklists AS
SELECT 
  ow.*,
  o.order_number,
  o.priority,
  o.deadline,
  c.name AS customer_name,
  e.brand || ' ' || e.model AS engine_info,
  p.full_name AS assigned_technician,
  COUNT(DISTINCT dc.id) FILTER (WHERE dc.status = 'pending') AS pending_checklists
FROM order_workflow ow
JOIN orders o ON o.id = ow.order_id
JOIN customers c ON c.id = o.customer_id
JOIN engines e ON e.id = o.engine_id
LEFT JOIN profiles p ON p.id = ow.assigned_to
LEFT JOIN diagnostic_checklists dc ON dc.order_id = o.id
GROUP BY ow.id, o.id, c.id, e.id, p.id;

-- RLS Policies (já configuradas)
-- Políticas respeitam org_id e role do usuário
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Workflow Kanban                                      [Filtros ▼] [Busca 🔍] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ◀ ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────── ▶  │
│    │ Nova OS │ Ag.Col. │Em Trans.│Check-in │Ag.Metro │Em Metro │Ag.Diag.    │
│    │   (3)   │   (5)   │   (2)   │   (4)   │   (1)   │   (6)   │   (2)      │
│    ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────    │
│    │┌───────┐│┌───────┐│┌───────┐│┌───────┐│┌───────┐│┌───────┐│┌───────   │
│    ││ #1234 │││ #1230 │││ #1228 │││ #1225 │││ #1220 │││ #1215 │││ #1210    │
│    ││🔴 Alta│││🟡 Méd.│││🟢 Bx. │││🔴 Alta│││🟡 Méd.│││🔴 Alta│││🟢 Bx.     │
│    ││       │││       │││       │││       │││       │││       │││          │
│    ││ABC Mot│││XYZ Ltd│││Fast Co│││Turbo  │││Power  │││Speed  │││Auto      │
│    ││OM 906 │││Scania │││MWM    │││Cummins│││Volvo  │││Detroit│││Iveco     │
│    ││       │││       │││       │││       │││       │││       │││          │
│    ││👤 João│││👤 Mrca│││👤 João│││👤 Crls│││👤 Mrca│││👤 João│││👤 Crls   │
│    ││⚙️ 3/7 │││⚙️ 0/5 │││⚙️ 1/6 │││⚙️ 4/7 │││⚙️ 2/4 │││⚙️ 5/7 │││⚙️ 3/6    │
│    ││       │││       │││       │││⏰ATRSO│││       │││       │││          │
│    │└───────┘│└───────┘│└───────┘│└───────┘│└───────┘│└───────┘│└───────   │
│    │         │         │         │         │         │         │            │
│    │┌───────┐│┌───────┐│┌───────┐│┌───────┐│         │┌───────┐│            │
│    ││ #1233 │││ #1229 │││ #1227 │││ #1224 │││         ││ #1214 │││            │
│    ││🟡 Méd.│││🔴 Alta│││🟡 Méd.│││🟢 Bx. │││         ││🟡 Méd.│││            │
│    │└───────┘│└───────┘│└───────┘│└───────┘│         │└───────┘│            │
│    │         │         │         │         │         │         │            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Carregar Kanban Inicial
```gherkin
Given que estou autenticado como gerente
When acesso a página de Workflow Kanban
Then vejo 14 colunas renderizadas
And cada coluna mostra contador de cards
And cards são carregados corretamente
```

### E2E Test 2: Filtro por Permissão
```gherkin
Given que estou autenticado como técnico
When acesso o Kanban
Then vejo apenas OSs atribuídas a mim
And não vejo OSs de outros técnicos
```

### E2E Test 3: Indicador de Atraso
```gherkin
Given que existe OS com prazo vencido
When visualizo o Kanban
Then card da OS mostra badge vermelho de atraso
And badge exibe "X dias de atraso"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Drag & drop (ver US-WKF-002)
- Filtros avançados (ver US-WKF-003)
- Modal de detalhes (ver US-WKF-004)
- Edição inline de campos

---

## 🔗 Dependencies

**Blocks:**
- US-WKF-002 (Drag & Drop)
- US-WKF-003 (Filtros)

**Blocked by:**
- US-OS-001 (Criar OS)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
