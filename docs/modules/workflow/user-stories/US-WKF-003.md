# US-WKF-003: Filtros Avançados no Kanban

**ID:** US-WKF-003  
**Epic:** Workflow Kanban  
**Sprint:** 2  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** gerente de produção  
**Quero** filtrar OSs no Kanban por múltiplos critérios  
**Para** focar em subconjuntos específicos de trabalho

---

## 🎯 Business Objective

Aumentar produtividade permitindo visualização focada de OSs relevantes sem perder contexto geral.

---

## 📐 Business Rules

### RN001: Filtros Disponíveis
**Filtros Principais:**
- **Componente:** Bloco, Cabeçote, Virabrequim, Biela, Pistão, Comando, Eixo
- **Técnico Responsável:** Lista de técnicos ativos
- **Prioridade:** Alta, Média, Baixa
- **Cliente:** Busca por nome
- **Período:** Criadas em (data inicial - data final)
- **Status de Atraso:** Apenas atrasadas, Apenas no prazo, Todas

### RN002: Comportamento dos Filtros
- Filtros são cumulativos (AND logic)
- Persiste no localStorage entre sessões
- Badge mostra quantidade de filtros ativos
- Botão "Limpar Filtros" reseta tudo
- Contador de cards atualiza dinamicamente

### RN003: UI dos Filtros
```
┌─────────────────────────────────────────────┐
│ Filtros (3 ativos) [X Limpar]               │
├─────────────────────────────────────────────┤
│ Componente:  [▼ Bloco          ]            │
│ Técnico:     [▼ João Silva     ]            │
│ Prioridade:  [▼ Alta           ]            │
│ Cliente:     [_______________🔍]            │
│ Período:     [10/01] até [31/01]            │
│ Atraso:      [ ] Apenas atrasadas           │
└─────────────────────────────────────────────┘
```

### RN004: Performance
- Filtros aplicados client-side após fetch inicial
- Para grandes volumes (>500 cards), usar query server-side
- Debounce de 300ms na busca por cliente
- Loading skeleton durante aplicação de filtros

---

## ✅ Acceptance Criteria

**AC1:** Painel de filtros acessível no header do Kanban  
**AC2:** Todos os 6 tipos de filtro funcionam corretamente  
**AC3:** Badge mostra quantidade de filtros ativos  
**AC4:** Limpar filtros reseta todos os campos  
**AC5:** Filtros persistem após refresh da página  
**AC6:** Contador de cards atualiza por coluna

---

## 🛠️ Definition of Done

- [x] Componente `KanbanFilters.tsx` criado
- [x] Hook `useKanbanFilters.ts` implementado
- [x] Persistência em localStorage
- [x] Lógica de filtro cumulativo
- [x] Debounce em busca de texto
- [x] Testes E2E para combinações de filtros

---

## 📁 Affected Components

```
src/components/workflow/
  ├── KanbanBoard.tsx          (UPDATE - integrar filtros)
  └── KanbanFilters.tsx        (NEW)

src/hooks/
  └── useKanbanFilters.ts      (NEW)
```

---

## 🗄️ Database Changes

```sql
-- Nenhuma alteração necessária
-- Filtros aplicados na query principal
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Workflow Kanban            [Filtros 🔽] (3)  [Busca 🔍]        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Filtros Ativos (3)                     [Limpar Tudo]       ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                             ││
│  │ Componente:                                                 ││
│  │ [▼ Bloco                           ] [X]                   ││
│  │                                                             ││
│  │ Técnico Responsável:                                        ││
│  │ [▼ João Silva                      ] [X]                   ││
│  │                                                             ││
│  │ Prioridade:                                                 ││
│  │ [▼ Alta                            ] [X]                   ││
│  │                                                             ││
│  │ Cliente:                                                    ││
│  │ [_____________________________ 🔍]                         ││
│  │                                                             ││
│  │ Período de Criação:                                         ││
│  │ De: [01/01/2025] Até: [31/01/2025]                         ││
│  │                                                             ││
│  │ Status de Prazo:                                            ││
│  │ ( ) Todas  (•) Apenas atrasadas  ( ) Apenas no prazo      ││
│  │                                                             ││
│  │                                   [Aplicar Filtros]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Mostrando 12 OSs de 47 totais                                  │
│                                                                  │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐           │
│  │ Nova OS │ Ag.Col. │Em Trans.│Check-in │Ag.Metro │           │
│  │   (2)   │   (3)   │   (1)   │   (4)   │   (2)   │           │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Filtro por Componente
```gherkin
Given que estou no Kanban
When abro o painel de filtros
And seleciono "Bloco" no dropdown de componentes
And clico em "Aplicar Filtros"
Then vejo apenas OSs com componente Bloco
And contador de filtros ativos mostra "(1)"
```

### E2E Test 2: Filtros Cumulativos
```gherkin
Given que já filtrei por "Bloco"
When adiciono filtro de prioridade "Alta"
And aplico filtros
Then vejo apenas OSs de Bloco com prioridade Alta
And contador mostra "(2)"
```

### E2E Test 3: Persistência de Filtros
```gherkin
Given que apliquei filtros múltiplos
When faço refresh da página
Then filtros permanecem ativos
And cards filtrados são exibidos
```

### E2E Test 4: Limpar Filtros
```gherkin
Given que tenho 3 filtros ativos
When clico em "Limpar Tudo"
Then todos os campos são resetados
And todas as OSs são exibidas novamente
And contador mostra "(0)"
```

---

## 🚫 Negative Scope

**Não inclui:**
- Filtros salvos/favoritos
- Compartilhamento de filtros entre usuários
- Filtros avançados com operadores lógicos complexos
- Exportação de resultados filtrados

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-WKF-001 (Visualizar Kanban)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
