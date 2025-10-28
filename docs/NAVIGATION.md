# 🗺️ Navegação da Documentação

Índice completo de todos os módulos e funcionalidades documentadas.

---

## 📦 Estrutura Geral

```
docs/
├── README.md                    # Visão geral do projeto
├── NAVIGATION.md                # Este arquivo (índice)
├── ARCHITECTURE.md              # Arquitetura do sistema
└── modules/                     # Módulos funcionais
    ├── clientes/                # Gestão de Clientes
    ├── financeiro/              # Gestão Financeira
    ├── compras/                 # Gestão de Compras
    ├── estoque/                 # Gestão de Estoque
    ├── pcp/                     # Planejamento e Controle de Produção
    ├── coleta/                  # Logística de Coleta
    ├── operations/              # Operações e Workflow
    ├── employees/               # Recursos Humanos
    ├── consultants/             # Consultores/Vendedores
    ├── budgets/                 # Orçamentos
    ├── orders/                  # Ordens de Serviço
    ├── dashboard/               # Dashboard e Analytics
    └── fiscal/                  # Gestão Fiscal
```

---

## 🧭 Índice por Módulo

### 👥 [Clientes](./modules/clientes/)

**Funcionalidades:**
- [Cadastro Pessoa Física](./modules/clientes/cadastro-pessoa-fisica/) ✅ COMPLETO
  - User Story, Wireframe, Flows, ERD, SQL completos

---

### 💰 [Financeiro](./modules/financeiro/)

**Funcionalidades:**
- [Contas a Pagar](./modules/financeiro/contas-pagar/) ✅ COMPLETO
  - User Story, Wireframe, Flows, ERD, SQL completos
- [Contas a Receber](./modules/financeiro/contas-receber/) ✅ COMPLETO
  - User Story, Wireframe, Flows, ERD, SQL completos
- [Fluxo de Caixa](./modules/financeiro/fluxo-caixa/) 🔄 Em andamento
- [Categorias de Despesa](./modules/financeiro/user-stories/US-FIN-007.md) 📋 User Story
- [DRE](./modules/financeiro/user-stories/US-FIN-008.md) 📋 User Story
- [Alertas de Vencimento](./modules/financeiro/user-stories/US-FIN-009.md) 📋 User Story
- [Relatório de Inadimplência](./modules/financeiro/user-stories/US-FIN-010.md) 📋 User Story
- [Previsão de Caixa](./modules/financeiro/user-stories/US-FIN-011.md) 📋 User Story
- [Exportar Relatórios](./modules/financeiro/user-stories/US-FIN-012.md) 📋 User Story

---

### 🛒 [Compras](./modules/compras/)

**Funcionalidades:**
- [Cadastro de Fornecedor](./modules/compras/cadastro-fornecedor/) 🔄 Em andamento
- [Cotação de Preços](./modules/compras/cotacao/) 🔄 Em andamento
- [Ordem de Compra](./modules/compras/user-stories/) 📋 User Story
- [Recebimento](./modules/compras/user-stories/) 📋 User Story

---

### 📦 [Estoque](./modules/estoque/)

**Funcionalidades:**
- [Cadastro de Peça](./modules/estoque/cadastro-peca/) 🔄 Em andamento
- [Movimentação](./modules/estoque/movimentacao/) 🔄 Em andamento
- [Inventário](./modules/estoque/user-stories/) 📋 User Story
- [Alertas de Estoque](./modules/estoque/user-stories/) 📋 User Story

---

### ⚙️ [PCP - Planejamento e Controle de Produção](./modules/pcp/)

**Funcionalidades:**
- [Ordem de Serviço](./modules/pcp/ordem-servico/) 🔄 Em andamento
- [Sequenciamento](./modules/pcp/user-stories/) 📋 User Story
- [Apontamento de Produção](./modules/pcp/user-stories/) 📋 User Story

---

### 🚚 [Coleta](./modules/coleta/)

**Funcionalidades:**
- [Agendar Coleta](./modules/coleta/agendar-coleta/) 🔄 Em andamento
- [Executar Coleta](./modules/coleta/user-stories/) 📋 User Story
- [Rastreamento](./modules/coleta/user-stories/) 📋 User Story

---

### 🔧 [Operations](./modules/operations/)

**Funcionalidades:**
- [Workflow Kanban](./modules/operations/) ✅ Implementado
- [Status Dinâmicos](./modules/operations/) ✅ Implementado
- [Metrologia](./modules/operations/metrologia/) ✅ COMPLETO

---

### 👷 [Employees](./modules/employees/)

**Funcionalidades:**
- [Cadastro de Funcionário](./modules/employees/user-stories/) 📋 User Story
- [Ponto Eletrônico](./modules/employees/user-stories/) 📋 User Story
- [Férias](./modules/employees/user-stories/) 📋 User Story
- [Comissões](./modules/employees/user-stories/) 📋 User Story

---

### 🎯 [Consultants](./modules/consultants/)

**Funcionalidades:**
- [Cadastro de Consultor](./modules/consultants/user-stories/) 📋 User Story
- [Rotas](./modules/consultants/user-stories/) 📋 User Story
- [Comissões](./modules/consultants/user-stories/) 📋 User Story

---

### 📋 [Budgets](./modules/budgets/)

**Funcionalidades:**
- [Orçamento Detalhado](./modules/budgets/) ✅ Implementado
- [Aprovações](./modules/budgets/) ✅ Implementado
- [Histórico](./modules/budgets/) ✅ Implementado

---

### 📊 [Dashboard](./modules/dashboard/)

**Funcionalidades:**
- [KPIs](./modules/dashboard/) ✅ Implementado
- [Alertas](./modules/dashboard/) ✅ Implementado
- [Ações Rápidas](./modules/dashboard/) ✅ Implementado

---

### 🧾 [Fiscal](./modules/fiscal/)

**Funcionalidades:**
- [Cálculo de Tributos](./modules/fiscal/) ✅ Implementado
- [NFSe](./modules/fiscal/) ✅ Implementado

---

## 📊 Status da Documentação

### Legenda
- ✅ **COMPLETO**: User Story + Wireframe + Flows + ERD + SQL
- 🔄 **Em Andamento**: User Story criada, elementos visuais em progresso
- 📋 **User Story**: Apenas user story documentada
- ⚪ **Não Iniciado**: Sem documentação

### Resumo por Módulo

| Módulo | Total Funcionalidades | Completas | Em Andamento | Apenas US | Não Iniciadas |
|--------|----------------------|-----------|--------------|-----------|---------------|
| Clientes | 3 | 1 | 0 | 2 | 0 |
| Financeiro | 8 | 2 | 1 | 5 | 0 |
| Compras | 4 | 0 | 2 | 2 | 0 |
| Estoque | 4 | 0 | 2 | 2 | 0 |
| PCP | 3 | 0 | 1 | 2 | 0 |
| Coleta | 3 | 0 | 1 | 2 | 0 |
| Operations | 3 | 3 | 0 | 0 | 0 |
| **TOTAL** | **28** | **6** | **7** | **15** | **0** |

---

## 🔍 Busca Rápida

### Por Tipo de Documento

**User Stories:**
- `docs/modules/*/user-story.md`
- `docs/modules/*/user-stories/*.md`

**Wireframes:**
- `docs/modules/*/wireframe.md`

**Fluxos de Usuário:**
- `docs/modules/*/flow-usuario.mmd`

**Fluxos de Dados:**
- `docs/modules/*/flow-dados.mmd`

**ERDs:**
- `docs/modules/*/erd.mmd`

**SQL:**
- `docs/modules/*/schema.sql`
- `docs/modules/*/indexes.sql`
- `docs/modules/*/triggers.sql`
- `docs/modules/*/rls.sql`
- `docs/modules/*/views.sql`
- `docs/modules/*/seed.sql`

---

## 🎯 Próximos Passos

1. ✅ Completar documentação visual de **Financeiro**
2. 🔄 Completar documentação visual de **Compras**
3. 🔄 Completar documentação visual de **Estoque**
4. ⏳ Completar documentação visual de **PCP**
5. ⏳ Completar documentação visual de **Coleta**

---

**Última atualização:** 2025-01-28  
**Versão:** 2.0
