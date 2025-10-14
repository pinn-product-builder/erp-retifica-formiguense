# ERP Retífica Formiguense - Documentação

![Status](https://img.shields.io/badge/status-em%20homologação-yellow)
![Versão](https://img.shields.io/badge/versão-1.0.0-blue)
![Licença](https://img.shields.io/badge/licença-proprietária-red)

Sistema completo de gestão para retíficas automotivas com módulos integrados para operações, financeiro, fiscal, estoque e compras.

## 🚀 Acesso Rápido

- **[Documentação Web](https://pinn-product-builder.github.io/erp-retifica-formiguense/)** - Acesse a documentação completa online
- **[Início Rápido](quick-start.md)** - Comece a usar o sistema em minutos
- **[Visão Geral](system-blueprint.md)** - Entenda a arquitetura do sistema
- **[Guia de Validação](validation/functional-validation-guide.md)** - Guia completo para homologação

## 📋 Índice

### 🏗️ Arquitetura
- [Visão Geral do Sistema](architecture/system-overview.md)
- [Schema do Banco de Dados](architecture/database-schema.md)
- [Sistema Multi-tenant](architecture/multitenancy.md)
- [Modelo de Segurança](architecture/security-model.md)
- [Stack Tecnológica](architecture/tech-stack.md)
- [Sistema de Perfis e Permissões](architecture/profile-permissions-system.md)

### 📖 Regras de Negócio
- [Autenticação e Multi-tenancy](business-rules/authentication-multitenancy.md)
- [Workflow de Operações](business-rules/operations-workflow.md)
- [Dashboard e KPIs](business-rules/dashboard-kpis.md)
- [Módulo Financeiro](business-rules/financial-module.md)
- [Módulo Fiscal](business-rules/fiscal-module.md)
- [Módulo de Estoque](business-rules/inventory-module.md) 📦
- [Módulo de Compras](business-rules/purchasing-module.md) 🛒
- [Orçamentos e Aprovação](business-rules/budgets-approval.md)

### 🧩 Módulos

#### Dashboard
- [README](modules/dashboard/README.md)
- [Requisitos do Produto](modules/dashboard/product-specs/product-requirements.md)
- [Arquitetura de Componentes](modules/dashboard/technical-specs/component-architecture.md)
- [Integração de Dados](modules/dashboard/technical-specs/data-integration.md)
- [Sistema de Tabs](modules/dashboard/tabs-system-implementation.md)
- [Sistema de KPIs Unificado](modules/dashboard/unified-kpi-system.md)

#### Operações
- [README](modules/operations/README.md)
- [Processo de Ordem de Serviço](modules/operations/business-processes/service-order-process.md)
- [Gestão de Workflow](modules/operations/business-processes/workflow-management.md)
- [Configuração Dinâmica de Status](modules/operations/business-processes/dynamic-workflow-status-configuration.md)
- [Arquitetura de Componentes](modules/operations/technical-specs/component-architecture.md)
- [Jornada do Usuário](modules/operations/user-flows/operations-user-journey.md)
- [Ciclo de Vida da Ordem](modules/operations/user-flows/order-lifecycle.md)

#### Fiscal
- [README](modules/fiscal/README.md)

#### Estoque (Inventário)
- [README](modules/inventory/README.md) 📦
- [Plano de Implementação](modules/inventory/implementation-plan.md)
- [Guia de Deploy](modules/inventory/DEPLOYMENT_GUIDE.md)
- [Checklist de Implementação](modules/inventory/IMPLEMENTATION_CHECKLIST.md)
- [Resumo da Implementação](modules/inventory/IMPLEMENTATION_SUMMARY.md)

### 👥 Guias do Usuário
- [Começando](user-guides/getting-started.md)
- [Guia do Sistema de Temas](user-guides/theme-system-guide.md)
- [Guia da Interface](validation/interface-guide.md)

### ✅ Validação e Testes
- [Guia de Validação Funcional](validation/functional-validation-guide.md)
- [Matriz de Cenários de Teste](testing/test-scenarios-matrix.md)
- [Guia de Testes End-to-End](testing/end-to-end-test-guide.md)

### 🔧 API e Integrações
- [Configuração do Supabase](api/supabase-setup.md)

### 📊 Diagramas
- [Arquitetura do Sistema](diagrams/system-architecture.mmd)

### 🚀 Desenvolvimento
- [Guia de Setup](development/setup-guide.md)

### 📝 Outros
- [Glossário](glossary.md)
- [FAQ](faq.md)
- [Melhorias Futuras](future-improvements.md)
- [Changelog](releases/CHANGELOG.md)

## 🎯 Status de Implementação

### ✅ Módulos Implementados
- ✅ Dashboard com KPIs e Sistema de Tabs
- ✅ Operações e Workflow (Ordens de Serviço)
- ✅ Diagnósticos
- ✅ Orçamentos com Aprovação
- ✅ Financeiro (Contas a Pagar/Receber, DRE, Fluxo de Caixa)
- ✅ Fiscal (Base implementada)
- ✅ Sistema de Perfis e Permissões
- ✅ Multi-tenancy Completo

### 🚧 Em Desenvolvimento/Pendente
- 🚧 Módulo de Compras Completo (cotações, POs, recebimento)
- 🚧 Movimentação de Estoque (entrada/saída)
- 🚧 Inventário Físico
- 🚧 Relatórios Avançados

## 🏢 Características Principais

### Multi-tenant
Sistema preparado para múltiplas organizações com total isolamento de dados através de Row Level Security (RLS).

### Segurança
- RLS implementado em todas as tabelas
- Sistema de perfis e permissões granular
- Autenticação via Supabase Auth

### Responsivo
Interface adaptada para desktop, tablet e mobile com breakpoints otimizados.

### Tempo Real
Atualizações em tempo real utilizando Supabase Realtime para:
- Notificações
- KPIs do Dashboard
- Status de Ordens de Serviço

### Temas
Suporte completo a tema claro/escuro com sistema de tokens CSS customizáveis.

### Gamificação
Sistema de pontos, conquistas e ranking de performance para engajamento dos usuários.

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Componentes
- **React Router** - Navegação
- **TanStack Query** - Data fetching
- **Recharts** - Gráficos

### Backend
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL - Banco de dados
  - Row Level Security - Segurança
  - Realtime - Atualizações em tempo real
  - Edge Functions - Lógica serverless
  - Storage - Armazenamento de arquivos

## 📚 Documentação para Homologação

Para iniciar a homologação do sistema, recomendamos seguir esta ordem:

1. **[Início Rápido](quick-start.md)** - Configure o ambiente e faça o primeiro acesso
2. **[Guia de Validação Funcional](validation/functional-validation-guide.md)** - Siga os cenários de teste
3. **[Matriz de Cenários de Teste](testing/test-scenarios-matrix.md)** - Checklist completo de funcionalidades
4. **[Guia da Interface](validation/interface-guide.md)** - Entenda a navegação e componentes

## 🔗 Links Úteis

- **GitHub:** [https://github.com/pinn-product-builder/erp-retifica-formiguense](https://github.com/pinn-product-builder/erp-retifica-formiguense)
- **Documentação Web:** [https://pinn-product-builder.github.io/erp-retifica-formiguense/](https://pinn-product-builder.github.io/erp-retifica-formiguense/)

## 📞 Suporte

Para dúvidas, sugestões ou problemas:
- **Email:** suporte@retificaformiguense.com.br
- **Issues GitHub:** [Criar issue](https://github.com/pinn-product-builder/erp-retifica-formiguense/issues)

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2025  
**Status:** Em Homologação

© 2025 Retífica Formiguense. Todos os direitos reservados.