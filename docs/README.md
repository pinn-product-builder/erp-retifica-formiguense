# Documentação Técnica - ERP Retífica Formiguense

## 📚 Visão Geral

Documentação técnica completa para desenvolvedores e QA do sistema ERP Retífica Formiguense.

## 🗂️ Estrutura de Documentação

### 📂 Raiz (`/docs`)
Documentos comuns a todos os módulos:
- **README.md** (este arquivo) - Índice geral
- **ARCHITECTURE.md** - Arquitetura geral do sistema
- **DATABASE.md** - Estrutura global do banco de dados
- **AUTH_PERMISSIONS.md** - Sistema de autenticação e permissões
- **API_PATTERNS.md** - Padrões de API e integração
- **TESTING.md** - Estratégias de teste E2E e unitários
- **DEPLOYMENT.md** - Guia de deployment e CI/CD

### 📂 Módulos (`/docs/modules`)
Documentação específica por módulo:

| Módulo | Pasta | Descrição |
|--------|-------|-----------|
| **Dashboard** | `/modules/dashboard/` | KPIs e métricas gerenciais |
| **Ordens de Serviço** | `/modules/orders/` | Gestão de OS e workflow |
| **Operações & Serviços** | `/modules/operations/` | Kanban, Metrologia, Produção |
| **Clientes** | `/modules/customers/` | CRM e gestão de clientes |
| **Orçamentos** | `/modules/budgets/` | Orçamentos detalhados |
| **Compras** | `/modules/purchases/` | Pedidos e fornecedores |
| **Estoque** | `/modules/inventory/` | Controle de peças |
| **Fornecedores** | `/modules/suppliers/` | Cadastro e gestão |
| **Fiscal** | `/modules/fiscal/` | Emissão de notas e impostos |
| **Financeiro** | `/modules/financial/` | Contas a pagar/receber |
| **Relatórios** | `/modules/reports/` | Relatórios gerenciais |
| **Gestão de Usuários** | `/modules/users/` | Perfis e permissões |
| **Coleta** | `/modules/collection/` | Solicitações de coleta |

## 📖 Estrutura Padrão de Módulo

Cada módulo segue a estrutura:

```
module-name/
├── README.md                  # Visão geral do módulo
├── user-stories/              # Histórias de usuário (US-XXX-###)
│   ├── US-XXX-001.md
│   └── US-XXX-002.md
├── flows/                     # Fluxos de processo
│   └── main-flow.md
├── diagrams/                  # Diagramas Mermaid
│   ├── workflow.mmd
│   └── database-erd.mmd
├── database/                  # Scripts SQL
│   ├── migrations.sql
│   ├── views.sql
│   ├── functions.sql
│   └── policies.sql
├── technical/                 # Documentação técnica
│   ├── components.md          # Componentes React
│   ├── hooks.md               # Custom hooks
│   ├── utils.md               # Funções utilitárias
│   └── types.md               # TypeScript types
├── api/                       # APIs e integrações
│   ├── edge-functions.md
│   └── queries.md
├── wireframes/                # Wireframes e UI
│   └── screens.md
└── testing/                   # Testes
    ├── e2e-scenarios.md
    └── acceptance-criteria.md
```

## 🚀 Como Usar Esta Documentação

### Para Desenvolvedores Frontend
1. Comece pelo `README.md` do módulo
2. Leia as histórias de usuário em `user-stories/`
3. Consulte `technical/components.md` para arquitetura React
4. Veja `wireframes/` para referência de UI

### Para Desenvolvedores Backend
1. Consulte `database/migrations.sql` para estrutura
2. Veja `database/policies.sql` para RLS
3. Leia `api/edge-functions.md` para lógica de negócio
4. Consulte `database/functions.sql` para procedures

### Para QA/Testers
1. Leia `user-stories/` para entender funcionalidades
2. Consulte `testing/e2e-scenarios.md` para cenários
3. Veja `testing/acceptance-criteria.md` para validação
4. Use `flows/` para entender processos completos

### Para Product Owners
1. Comece pelo `README.md` do módulo
2. Revise `user-stories/` para priorização
3. Consulte `diagrams/` para visualização
4. Leia `flows/` para entender jornadas

## 🔗 Links Rápidos

### Documentação Comum
- [Arquitetura do Sistema](./ARCHITECTURE.md)
- [Banco de Dados Global](./DATABASE.md)
- [Autenticação e Permissões](./AUTH_PERMISSIONS.md)
- [Padrões de API](./API_PATTERNS.md)
- [Guia de Testes](./TESTING.md)

### Módulos Principais
- [Dashboard](./modules/dashboard/README.md)
- [Ordens de Serviço](./modules/orders/README.md)
- [Operações & Serviços](./modules/operations/README.md)
  - [Metrologia](./modules/operations/metrologia/README.md)
- [Clientes](./modules/customers/README.md)
- [Orçamentos](./modules/budgets/README.md)
- [Estoque](./modules/inventory/README.md)

## 📊 Status de Implementação

| Módulo | Documentação | Desenvolvimento | Testes | Status |
|--------|--------------|-----------------|--------|--------|
| Dashboard | ✅ | ✅ | ⚠️ | Produção |
| Ordens de Serviço | ✅ | ✅ | ⚠️ | Produção |
| **Metrologia** | ✅ | 🔨 | ❌ | Em Desenvolvimento |
| Clientes | ✅ | ✅ | ⚠️ | Produção |
| Orçamentos | ✅ | ✅ | ⚠️ | Produção |
| Estoque | ✅ | ✅ | ⚠️ | Produção |
| Fiscal | ✅ | ✅ | ⚠️ | Produção |
| Financeiro | ⏳ | ⏳ | ❌ | Planejamento |

**Legenda**: ✅ Completo | 🔨 Em Desenvolvimento | ⏳ Planejamento | ⚠️ Parcial | ❌ Não Iniciado

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Roteamento**: React Router v6
- **Formulários**: React Hook Form + Zod
- **UI**: Shadcn/ui + Tailwind CSS
- **Estado**: TanStack Query (React Query)
- **Gráficos**: Recharts
- **Drag & Drop**: @hello-pangea/dnd

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Deno (TypeScript)
- **RLS**: Row Level Security

### DevOps
- **CI/CD**: GitHub Actions
- **Hosting**: Lovable (Frontend) + Supabase (Backend)
- **Monitoring**: Supabase Dashboard

## 📝 Convenções

### Nomenclatura de User Stories
- **Formato**: `US-[MÓDULO]-[NÚMERO]`
- **Exemplo**: `US-MET-002` (Metrologia, Story #2)

### Nomenclatura de Branches Git
- **Feature**: `feature/US-XXX-###-descricao`
- **Bugfix**: `bugfix/descricao-curta`
- **Hotfix**: `hotfix/descricao-urgente`

### Commits Semânticos
- `feat: adiciona US-MET-002 identificação do motor`
- `fix: corrige validação de fotos na metrologia`
- `docs: atualiza README do módulo de orçamentos`
- `test: adiciona testes E2E para coleta`

## 🔐 Segurança e Compliance

- **RLS (Row Level Security)**: Obrigatório em todas as tabelas
- **Multitenancy**: Isolamento por `org_id`
- **LGPD**: Anonimização de dados sensíveis
- **Auditoria**: Logs em `audit_logs` para ações críticas

## 📅 Última Atualização

**Data**: 28/10/2025  
**Responsável**: Equipe de Desenvolvimento ERP Retífica  
**Versão**: 2.0.0
