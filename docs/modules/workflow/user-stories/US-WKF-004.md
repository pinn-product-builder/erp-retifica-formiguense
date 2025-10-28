# US-WKF-004: Modal de Detalhes do Card

**ID:** US-WKF-004  
**Epic:** Workflow Kanban  
**Sprint:** 2  
**Prioridade:** Média  
**Estimativa:** 3 pontos  
**Status:** Done  

---

## 📋 User Story

**Como** usuário do Kanban  
**Quero** abrir um modal ao clicar no card  
**Para** visualizar resumo rápido da OS sem sair do Kanban

---

## 🎯 Business Objective

Reduzir navegação entre páginas, permitindo acesso rápido a informações essenciais sem perder contexto do Kanban.

---

## 📐 Business Rules

### RN001: Gatilho de Abertura
- Click no card (exceto drag handle)
- Atalho: Ctrl+Click para abrir em nova aba (link para OrderDetails)
- Fechar com ESC ou click no backdrop

### RN002: Informações Exibidas
**Cabeçalho:**
- Número da OS (destaque)
- Status atual
- Badge de prioridade

**Dados Gerais:**
- Cliente (nome, telefone)
- Motor (marca, modelo, série)
- Consultor responsável
- Técnico atribuído
- Prazo de entrega
- Data de criação

**Progresso:**
- Lista de componentes com checkboxes
- Barra de progresso geral (X/Y concluídos)
- Status de checklists (quantos pendentes)

**Ações Rápidas:**
- Botão "Ver Detalhes Completos" (→ OrderDetails)
- Botão "Registrar Tempo"
- Botão "Adicionar Observação"

### RN003: Comportamento
- Modal sobrepõe o Kanban (z-index alto)
- Scroll interno se conteúdo exceder altura
- Botão fechar (X) no canto superior direito
- Transição suave de abertura/fechamento

---

## ✅ Acceptance Criteria

**AC1:** Click no card abre modal centralizado  
**AC2:** Modal exibe informações corretas da OS  
**AC3:** ESC fecha o modal  
**AC4:** Click no backdrop fecha o modal  
**AC5:** Botão "Ver Detalhes" redireciona para OrderDetails  
**AC6:** Modal é responsivo em mobile

---

## 🛠️ Definition of Done

- [x] Componente `OrderCardModal.tsx` criado
- [x] Integrado com Shadcn Dialog
- [x] Fetch de dados da OS ao abrir
- [x] Ações rápidas funcionais
- [x] Responsividade testada
- [x] Testes E2E escritos

---

## 📁 Affected Components

```
src/components/workflow/
  ├── OrderCard.tsx            (UPDATE - onClick handler)
  └── OrderCardModal.tsx       (NEW)

src/hooks/
  └── useOrders.ts             (READ - fetch single order)
```

---

## 🗄️ Database Changes

```sql
-- Nenhuma alteração necessária
-- Utiliza queries existentes de orders
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Workflow Kanban                                                 │
├─────────────────────────────────────────────────────────────────┤
│     ┌─────────────────────────────────────────────────────┐     │
│     │ OS #1234 - Em Metrologia          🔴 Alta       [X] │     │
│     ├─────────────────────────────────────────────────────┤     │
│     │                                                      │     │
│     │ 📋 DADOS GERAIS                                      │     │
│     │ ────────────────────────────────────────────────     │     │
│     │ Cliente:          ABC Motors Ltda                   │     │
│     │ Telefone:         (11) 98765-4321                   │     │
│     │                                                      │     │
│     │ Motor:            Mercedes-Benz OM 906              │     │
│     │ Série:            906985C1234567                    │     │
│     │                                                      │     │
│     │ Consultor:        João Silva                        │     │
│     │ Técnico:          👤 Marcos Pereira                 │     │
│     │ Prazo:            30/01/2025 (3 dias restantes)     │     │
│     │ Criada em:        15/01/2025                        │     │
│     │                                                      │     │
│     │ ⚙️ PROGRESSO DOS COMPONENTES                         │     │
│     │ ────────────────────────────────────────────────     │     │
│     │ [✅] Bloco         [✅] Cabeçote    [✅] Virabrequim │     │
│     │ [⏳] Biela         [⏳] Pistão      [  ] Comando     │     │
│     │ [  ] Eixo                                            │     │
│     │                                                      │     │
│     │ ████████████████░░░░ 5/7 concluídos (71%)          │     │
│     │                                                      │     │
│     │ 📝 CHECKLISTS PENDENTES                              │     │
│     │ ────────────────────────────────────────────────     │     │
│     │ ⚠️ 2 checklists aguardando preenchimento            │     │
│     │                                                      │     │
│     │                                                      │     │
│     │            [Ver Detalhes Completos →]               │     │
│     │     [Registrar Tempo] [Adicionar Observação]        │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Abrir Modal
```gherkin
Given que estou visualizando o Kanban
When clico em um card de OS
Then modal centralizado abre
And informações da OS são exibidas
And modal tem foco (trap focus)
```

### E2E Test 2: Fechar com ESC
```gherkin
Given que o modal está aberto
When pressiono a tecla ESC
Then modal fecha
And foco retorna ao card
```

### E2E Test 3: Ir para Detalhes
```gherkin
Given que o modal está aberto
When clico em "Ver Detalhes Completos"
Then sou redirecionado para /orders/:id
And modal fecha automaticamente
```

### E2E Test 4: Abrir em Nova Aba
```gherkin
Given que estou no Kanban
When seguro Ctrl e clico no card
Then nova aba abre com OrderDetails
And modal não abre
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição inline de campos da OS
- Upload de documentos no modal
- Chat/comentários no modal
- Histórico completo de atividades

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-WKF-001 (Visualizar Kanban)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
