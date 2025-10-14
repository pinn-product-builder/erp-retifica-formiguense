# 📚 Documentação ERP Retífica Formiguense

> Sistema de Gestão para Retíficas Automotivas - Documentação Completa v1.0

[![Status](https://img.shields.io/badge/Status-Homologação-yellow)](https://github.com/pinn-product-builder/erp-retifica-formiguense)
[![Versão](https://img.shields.io/badge/Versão-1.0.0-blue)](https://github.com/pinn-product-builder/erp-retifica-formiguense)
[![Documentação](https://img.shields.io/badge/Docs-Online-green)](https://pinn-product-builder.github.io/erp-retifica-formiguense/)

## 🚀 Acesso Rápido

- **[🎯 Início Rápido](quick-start.md)** - Configure e use o sistema em minutos
- **[📊 Visão Geral do Sistema](system-blueprint.md)** - Entenda a arquitetura completa
- **[✅ Guia de Validação](validation/functional-validation-guide.md)** - Roteiro de homologação
- **[📖 Glossário](glossary.md)** - Termos e definições técnicas
- **[❓ FAQ](faq.md)** - Perguntas frequentes

---

## 📑 Índice Completo

### 🏗️ Arquitetura

Documentação técnica da arquitetura do sistema:

- **[Visão Geral do Sistema](architecture/system-overview.md)** - Arquitetura geral e componentes
- **[Schema do Banco de Dados](architecture/database-schema.md)** - Estrutura completa do banco
- **[Multi-tenancy](architecture/multitenancy.md)** - Sistema multi-organizacional
- **[Modelo de Segurança](architecture/security-model.md)** - RLS e políticas de segurança
- **[Sistema de Perfis e Permissões](architecture/profile-permissions-system.md)** - RBAC e permissões granulares
- **[Stack Técnica](architecture/tech-stack.md)** - Tecnologias utilizadas

### 📖 Regras de Negócio

Processos e regras implementadas:

- **[Autenticação e Multi-tenancy](business-rules/authentication-multitenancy.md)** - Login e organizações
- **[Dashboard e KPIs](business-rules/dashboard-kpis.md)** - Métricas e indicadores
- **[Workflow de Operações](business-rules/operations-workflow.md)** - Fluxo de OS e Kanban
- **[Orçamentos e Aprovação](business-rules/budgets-approval.md)** - Processo de orçamentos
- **[Módulo Fiscal](business-rules/fiscal-module.md)** - Gestão tributária
- **[Módulo Financeiro](business-rules/financial-module.md)** - Contas e fluxo de caixa
- **[Módulo de Estoque](business-rules/inventory-module.md)** - Gestão de peças
- **[Módulo de Compras](business-rules/purchasing-module.md)** - Processo de compras

### 🧩 Módulos

Documentação detalhada de cada módulo:

#### 📈 Dashboard
- **[README](modules/dashboard/README.md)** - Visão geral do módulo
- **[Requisitos do Produto](modules/dashboard/product-specs/product-requirements.md)**
- **[Arquitetura de Componentes](modules/dashboard/technical-specs/component-architecture.md)**
- **[Integração de Dados](modules/dashboard/technical-specs/data-integration.md)**
- **[Sistema Unificado de KPIs](modules/dashboard/unified-kpi-system.md)**
- **[Jornada do Usuário](modules/dashboard/user-flows/dashboard-user-journey.md)**
- **[Wireframes](modules/dashboard/wireframes/)** - Interfaces principais

#### 🔧 Operações
- **[README](modules/operations/README.md)** - Visão geral do módulo
- **[Processo de Ordens de Serviço](modules/operations/business-processes/service-order-process.md)**
- **[Gestão de Workflow](modules/operations/business-processes/workflow-management.md)**
- **[Configuração Dinâmica de Status](modules/operations/business-processes/dynamic-workflow-status-configuration.md)**
- **[Arquitetura de Componentes](modules/operations/technical-specs/component-architecture.md)**
- **[Fluxo Kanban](modules/operations/user-flows/kanban-workflow.md)**
- **[Ciclo de Vida da OS](modules/operations/user-flows/order-lifecycle.md)**
- **[Guia de Configurações](modules/operations/user-guides/operations-configuration-guide.md)**
- **[Wireframes](modules/operations/wireframes/)** - Interfaces do módulo

#### 💰 Orçamentos
- **[README](modules/budgets/README.md)** - Visão geral do módulo
- **[Arquitetura de Componentes](modules/budgets/technical-specs/component-architecture.md)**
- **[Fluxo de Aprovação](modules/budgets/user-flows/budget-approval-flow.md)**
- **[Wireframes](modules/budgets/wireframes/)** - Interfaces de orçamento

#### 📋 Fiscal
- **[README](modules/fiscal/README.md)** - Visão geral do módulo fiscal

#### 📦 Estoque (Inventário)
- **[README](modules/inventory/README.md)** - Visão geral do módulo
- **[Plano de Implementação](modules/inventory/implementation-plan.md)**
- **[Guia de Deploy](modules/inventory/DEPLOYMENT_GUIDE.md)**
- **[Checklist de Implementação](modules/inventory/IMPLEMENTATION_CHECKLIST.md)**
- **[Resumo da Implementação](modules/inventory/IMPLEMENTATION_SUMMARY.md)**

### 👥 Fluxos e Guias do Usuário

- **[Jornadas Completas de Usuário](user-flows/complete-user-journeys.md)** - Fluxos end-to-end
- **[Matriz de Permissões](user-flows/permissions-matrix.md)** - Controle de acesso
- **[Primeiros Passos](user-guides/getting-started.md)** - Guia inicial
- **[Sistema de Temas](user-guides/theme-system-guide.md)** - Personalização visual

### ✅ Validação e Testes

Roteiros para homologação:

- **[Guia de Validação Funcional](validation/functional-validation-guide.md)** - Checklist completo
- **[Guia de Interface](validation/interface-guide.md)** - Validação de UI/UX
- **[Testes End-to-End](testing/end-to-end-test-guide.md)** - Cenários E2E
- **[Matriz de Cenários de Teste](testing/test-scenarios-matrix.md)** - Casos de teste

### 🔧 Desenvolvimento

Guias técnicos para desenvolvedores:

- **[Guia de Configuração](development/setup-guide.md)** - Setup do ambiente
- **[Setup Supabase](api/supabase-setup.md)** - Configuração do backend
- **[Verificação de Banco](guidelines/database-verification.md)** - Checklist de BD

### 📝 Documentação Técnica

Especificações técnicas detalhadas:

- **[Geração de Número de Orçamento](technical/budget-number-generation-explained.md)**
- **[Issue Multi-tenant de Orçamentos](technical/budget-number-multi-tenant-issue.md)**

### 🔄 Fixes e Correções

Documentação de problemas resolvidos:

- **[Fix: Constraint Multi-tenant de Budget](fixes/budget-number-multi-tenant-constraint-fix.md)**
- **[Fix: Race Condition em Budget Number](fixes/budget-number-race-condition-fix.md)**

### 📊 Diagramas

- **[Arquitetura do Sistema](diagrams/system-architecture.mmd)** - Diagrama Mermaid

### 🔄 Releases

- **[CHANGELOG](releases/CHANGELOG.md)** - Histórico de mudanças
- **[Roadmap de Implementação](implementation-roadmap.md)** - Status atual
- **[Melhorias Futuras](future-improvements.md)** - Planejamento futuro

---

## 🎯 Para Homologação do Cliente

### Passo 1: Configuração Inicial
Siga o **[Guia de Primeiros Passos](user-guides/getting-started.md)** para configurar:
- Criar organização
- Adicionar usuários
- Configurar perfis e permissões
- Ajustar configurações básicas

### Passo 2: Validação Funcional
Execute os testes do **[Guia de Validação](validation/functional-validation-guide.md)**:
- ✅ Dashboard e KPIs
- ✅ Workflow Kanban
- ✅ Orçamentos e Aprovações
- ✅ Módulo Fiscal
- ✅ Módulo Financeiro
- ✅ Gestão de Estoque
- ✅ Módulo de Compras

### Passo 3: Testes por Cenário
Consulte a **[Matriz de Cenários](testing/test-scenarios-matrix.md)** para:
- Fluxo completo de OS
- Isolamento multi-tenant
- Controle de permissões
- Integrações entre módulos

---

## 📌 Características Principais

### ✨ Funcionalidades Core
- ✅ **Multi-tenancy** com isolamento completo de dados
- ✅ **Autenticação e Autorização** via Supabase Auth
- ✅ **Sistema de Perfis e Permissões** granular por página
- ✅ **Dashboard Executivo** com KPIs em tempo real
- ✅ **Workflow Kanban** com drag-and-drop
- ✅ **Gestão de Ordens de Serviço** completa
- ✅ **Diagnóstico por Componente** (biela, bloco, cabeçote, comando, eixo)
- ✅ **Orçamentos e Aprovação** com workflow
- ✅ **Módulo Fiscal** com cálculo de impostos
- ✅ **Módulo Financeiro** (Contas a Pagar/Receber, DRE, Fluxo de Caixa)
- ✅ **Gestão de Estoque** com movimentações e contagens
- ✅ **Módulo de Compras** com cotações e recebimentos

### 🎨 Interface e UX
- 📱 **Design Responsivo** (Desktop, Tablet, Mobile)
- 🌓 **Tema Claro/Escuro** configurável
- 🔍 **Busca Global** (Ctrl+K)
- 🔔 **Central de Notificações** em tempo real
- ⚡ **Ações Rápidas** contextuais
- 🎯 **Gamificação** com conquistas e ranking

### 🔐 Segurança
- 🛡️ **Row Level Security (RLS)** em todas as tabelas
- 🔒 **Políticas de Acesso** por organização
- 👥 **Controle de Permissões** por perfil
- 📝 **Auditoria Completa** de ações

### ⚡ Performance
- 🚀 **React Query** para cache inteligente
- 🔄 **WebSocket** para updates em tempo real
- 📦 **Lazy Loading** de componentes
- 🎯 **Memoization** de cálculos pesados

---

## 📚 Stack Técnico

### Frontend
- **React 18** com TypeScript
- **Vite** para build ultra-rápido
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **React Query** para gerenciamento de estado
- **React Router** para navegação

### Backend
- **Supabase** (PostgreSQL + APIs)
- **Row Level Security (RLS)** para segurança
- **Edge Functions** para lógica server-side
- **Supabase Realtime** para updates ao vivo
- **Supabase Storage** para arquivos

---

## 🔗 Links Úteis

- **🌐 Documentação Online**: [GitHub Pages](https://pinn-product-builder.github.io/erp-retifica-formiguense/)
- **📦 Repositório**: [GitHub](https://github.com/pinn-product-builder/erp-retifica-formiguense)

---

**📌 Versão:** 1.0.0  
**📅 Última Atualização:** Janeiro 2025  
**🔗 GitHub:** [erp-retifica-formiguense](https://github.com/pinn-product-builder/erp-retifica-formiguense)