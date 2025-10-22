# Changelog

Todas as mudanças notáveis do projeto ERP Retífica serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.2.2] - 2025-01-14

### 🐛 Corrigido

#### 🔧 Módulo Operações e Serviços
- **Modal de Confirmação para Exclusão de Status Workflow**: Implementado modal de confirmação adequado na página de configurações de status de workflow
  - Substituído `confirm()` nativo do browser por modal personalizado do design system
  - Adicionadas mensagens contextuais específicas para cada tipo de exclusão
  - Melhorado tratamento de retorno após exclusão
  - Implementado para exclusão de status e pré-requisitos
  - Botões com variante `destructive` para ações de exclusão
  - Prevenção de exclusões acidentais com avisos sobre consequências
  - **Validação de Dependências**: Verificação automática se existem ordens de serviço utilizando o status antes de permitir exclusão
  - **Bloqueio Inteligente**: Sistema impede exclusão quando há ordens de serviço ativas no status
  - **Mensagens Específicas**: Feedback claro sobre por que a exclusão foi bloqueada e como proceder
  - **Organização Visual Aprimorada**: Modal de confirmação com ícones contextuais e estrutura bem organizada
  - **Informações Detalhadas**: Exibição de dados específicos (nome, chave, tipo de transição) no modal
  - **Fluxo Explicativo**: Explicação clara do processo de verificação e consequências

### 🔧 Melhorias Técnicas
- **Consistência de UI/UX**: Padronização do sistema de confirmação em todo o módulo
- **Reutilização de Componentes**: Aproveitamento do `useConfirmDialog` existente
- **Tratamento de Erros**: Melhor feedback visual para operações de exclusão
- **Validação de Integridade**: Verificação automática de dependências no banco de dados
- **Tipagem Robusta**: Correção de tipos TypeScript e interfaces específicas
- **Performance**: Otimização com `useCallback` para funções de fetch
- **Sistema de Ícones**: Implementação de ícones contextuais no modal de confirmação
- **Layout Responsivo**: Modal com largura máxima adequada para diferentes dispositivos

## [1.2.1] - 2024-01-15

### ✨ Adicionado

#### 🧾 Sistema de Orçamentação Detalhada (US-004)
- **Hook `useDetailedBudgets`**: Gerenciamento completo de orçamentos detalhados
  - CRUD completo com validações frontend e backend
  - Filtros avançados por status, componente e período
  - Duplicação inteligente de orçamentos existentes
  - Integração automática com módulo financeiro

- **Componente `BudgetApprovalModal`**: Interface completa de aprovação
  - ✅ Aprovação Total: Todo o orçamento em uma única ação
  - ⚠️ Aprovação Parcial: Seleção granular de serviços/peças
  - ❌ Rejeição: Processo documentado com justificativas
  - 📱 WhatsApp, 📧 E-mail, ✍️ Assinatura, 🗣️ Verbal como métodos
  - 📎 Upload seguro de documentos comprobatórios

- **Componente `BudgetDetails`**: Visualização detalhada
  - 💰 Resumo financeiro completo (mão de obra + peças)
  - 🔧 Lista detalhada de serviços com horas/valores
  - 📦 Lista de peças com quantidades/preços
  - 📋 Histórico completo de aprovações
  - ⏱️ Prazos de entrega e períodos de garantia

- **Página `Orcamentos`**: Interface principal renovada
  - 📊 Dashboard com estatísticas em tempo real
  - 🔍 Filtros por status (Rascunho/Aprovado/Parcial/Rejeitado)
  - 🏷️ Filtros por componente (Bloco/Cabeçote/Eixo/etc)
  - 📋 Tabela responsiva com ações contextuais
  - 🔄 Integração completa com sistema de aprovações

#### 🔒 Validações e Segurança
- **Zod Schemas**: Validação robusta em todos os formulários
- **Campos Obrigatórios**: Validação antes de criar/aprovar orçamentos
- **Toast System**: Feedback visual para todas as operações
- **Confirmation Modals**: Sistema integrado ao design da aplicação
- **RLS Policies**: Segurança por organização em todas as operações

#### 📊 Integração Financeira Automática
- **Contas a Receber**: Geração automática via trigger SQL
- **Cálculos Precisos**: Labor total + peças + impostos - descontos
- **Numeração Sequencial**: Formato padronizado ORC-YYYY-NNNN
- **Auditoria Completa**: Log detalhado de todas as alterações

### 🚀 Melhorado

#### 📱 Experiência do Usuário
- **Design Responsivo**: Adaptação perfeita mobile/tablet/desktop
- **Acessibilidade**: Navegação por teclado e compatibilidade com screen readers
- **Performance**: Lazy loading otimizado e cache inteligente
- **Loading States**: Indicadores visuais em tempo real

#### 🔄 Fluxos de Processo
- **Documentação Completa**: Rastro detalhado de todas as aprovações
- **Estados Claros**: Draft → Approved/Partially_Approved/Rejected
- **Workflow Seamless**: Integração automática entre módulos
- **Smart Alerts**: Alertas inteligentes para orçamentos pendentes

### 🐛 Corrigido
- **TypeScript**: Correção de tipos para compatibilidade Supabase
- **Import Paths**: Ajuste de caminhos de importação nos componentes
- **Schema Validation**: Compatibilidade total com tipos do banco

### 📚 Documentação

#### 📖 Nova Documentação Técnica
- **`proj_docs/modules/budgets/README.md`**: Visão geral completa do módulo
- **`proj_docs/modules/budgets/technical-specs/component-architecture.md`**: Arquitetura detalhada
- **`proj_docs/modules/budgets/user-flows/budget-approval-flow.md`**: Fluxos completos de usuário

#### 🎯 Regras de Negócio Implementadas

##### ✅ US-004: Orçamentação Detalhada e Aprovação
- **RN016**: ✅ Orçamento inclui serviços, peças, prazos e custos detalhados
- **RN017**: ✅ Cliente pode aprovar total, parcial ou rejeitar orçamento
- **RN018**: ✅ Aprovações documentadas (assinatura, WhatsApp, email)
- **RN019**: ✅ Sistema alerta sobre orçamentos pendentes de aprovação
- **RN020**: ✅ Orçamentos aprovados geram automaticamente contas a receber

##### ✅ Critérios de Aceite Atendidos
- **CA016**: ✅ Sistema gera orçamento detalhado baseado no diagnóstico
- **CA017**: ✅ Interface permite registrar diferentes tipos de aprovação
- **CA018**: ✅ Documentos de aprovação são armazenados no sistema
- **CA019**: ✅ Dashboard mostra orçamentos pendentes com alertas
- **CA020**: ✅ Aprovação gera automaticamente título no financeiro

### 💾 Estruturas de Banco Utilizadas
- **`detailed_budgets`**: Orçamentos com cálculos automáticos e numeração sequencial
- **`budget_approvals`**: Aprovações documentadas com upload de comprovantes
- **`accounts_receivable`**: Integração automática via triggers SQL
- **Storage `reports`**: Armazenamento seguro de documentos comprobatórios

## [Em Desenvolvimento] - 2024-01-16

### 🔮 Próximas Funcionalidades
- 📄 Geração automática de PDF para orçamentos
- ✍️ Assinatura digital integrada na plataforma
- 📧 Notificações automáticas por email
- 📊 Relatórios de conversão e performance de orçamentos

## [1.2.0] - 2024-01-01

### Adicionado
- 🏭 **Módulo PCP (Planejamento e Controle de Produção)**
  - Ordens de produção
  - Centros de trabalho
  - Planejamento de capacidade
  - Relatórios de produção

- 📋 **Sistema de Workflow Kanban**
  - Quadros personalizáveis
  - Drag & drop de tarefas
  - Atribuição de responsáveis
  - Timeline de atividades

- 🔧 **Módulo de Ordens de Serviço**
  - Gestão completa de OS
  - Timeline de progresso
  - Integração com estoque
  - Relatórios de produtividade

### Alterado
- 🎨 **Interface redesenhada**
  - Nova sidebar responsiva
  - Tema escuro/claro aprimorado
  - Componentes shadcn/ui atualizados
  - Animações suaves com Framer Motion

- ⚡ **Performance melhorada**
  - Lazy loading de componentes
  - Otimização de queries
  - Cache inteligente com React Query
  - Code splitting automático

### Corrigido
- 🔒 Políticas RLS aprimoradas para isolamento de dados
- 📱 Melhorias significativas na responsividade
- 🐛 Correções em formulários complexos
- 🔧 Estabilização do sistema de notificações

## [1.1.0] - 2023-12-01

### Adicionado
- 💰 **Módulo Financeiro Completo**
  - Contas a pagar e receber
  - Fluxo de caixa projetado
  - DRE (Demonstrativo de Resultados)
  - Conciliação bancária
  - Centro de custos

- 📊 **Módulo Fiscal Avançado**
  - Apuração de impostos (ICMS, IPI, PIS, COFINS)
  - Gestão de obrigações fiscais
  - Classificações fiscais (NCM, CFOP, CST)
  - Regimes tributários configuráveis
  - Integração com SPED

- 🏢 **Sistema Multitenancy**
  - Isolamento completo de dados por organização
  - Gestão de usuários e permissões
  - Configurações personalizáveis por empresa
  - Auditoria completa de ações

### Alterado
- 🎯 **Dashboard redesenhado** com KPIs mais relevantes
- 🔍 **Busca global** aprimorada com filtros avançados
- 📈 **Relatórios** mais detalhados e personalizáveis
- 🔔 **Sistema de notificações** em tempo real

### Corrigido
- 🔐 Melhorias significativas na segurança
- 📊 Otimização de consultas de dashboard
- 🎨 Correções na consistência visual
- 📱 Aprimoramentos na experiência mobile

## [1.0.0] - 2023-11-01

### Adicionado
- 🚀 **Lançamento inicial do ERP Retífica**
- 🏠 **Dashboard principal** com métricas essenciais
- 👥 **Sistema de autenticação** via Supabase Auth
- 🏢 **Gestão básica de organizações**
- 📋 **Módulo básico de clientes e fornecedores**
- 📦 **Controle básico de estoque**
- 👨‍💼 **Gestão de funcionários**
- ⚙️ **Configurações do sistema**

### Funcionalidades Técnicas
- ⚛️ **React 18** com TypeScript
- 🎨 **Tailwind CSS** com design system
- 🗄️ **Supabase** como backend
- 🔒 **Row Level Security** implementado
- 📱 **Design responsivo** para mobile e desktop
- 🌙 **Modo escuro/claro**

## Tipos de Mudanças

- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para melhorias de segurança

## Convenções de Versionamento

### Versão Maior (X.0.0)
- Mudanças incompatíveis na API
- Grandes reformulações de arquitetura
- Remoção de funcionalidades importantes

### Versão Menor (0.X.0)
- Novas funcionalidades mantendo compatibilidade
- Melhorias significativas na UX
- Novos módulos ou integrações

### Versão de Correção (0.0.X)
- Correções de bugs
- Pequenas melhorias de performance
- Ajustes na documentação

## Roteiro de Desenvolvimento

### Próximas Versões

#### v1.3.0 (Planejado para 2024-02-01)
- 📱 **App Mobile** (React Native)
- 🤖 **Automações avançadas**
- 📊 **BI e Analytics** aprimorados
- 🔗 **Integrações com ERPs externos**

#### v1.4.0 (Planejado para 2024-03-01)
- 🧠 **IA para análise de dados**
- 📞 **Integração com sistemas de telefonia**
- 📧 **Email marketing integrado**
- 🎯 **CRM avançado**

#### v2.0.0 (Planejado para 2024-06-01)
- 🏗️ **Arquitetura de microserviços**
- 🌐 **API GraphQL**
- 🔄 **Sincronização offline**
- 🌍 **Internacionalização completa**

## Suporte a Versões

### Versões Suportadas

| Versão | Status | Data de Lançamento | Fim do Suporte |
|--------|--------|-------------------|----------------|
| 1.2.x  | ✅ Atual | 2024-01-01 | - |
| 1.1.x  | ✅ Suportada | 2023-12-01 | 2024-06-01 |
| 1.0.x  | ⚠️ Legado | 2023-11-01 | 2024-03-01 |

### Política de Suporte

- **Versão Atual**: Recebe todas as atualizações e correções
- **Versão Suportada**: Recebe apenas correções críticas
- **Versão Legado**: Suporte limitado a questões de segurança

## Migração entre Versões

### De v1.1.x para v1.2.x

1. **Backup do banco de dados**
   ```bash
   supabase db dump --file backup_v1.1.sql
   ```

2. **Executar migrações**
   ```bash
   supabase migration up
   ```

3. **Atualizar dependências frontend**
   ```bash
   npm update
   ```

4. **Testar funcionalidades críticas**

### De v1.0.x para v1.1.x

1. **Importante**: Esta versão introduziu breaking changes na estrutura do banco
2. **Executar script de migração** fornecido pela equipe
3. **Revisar permissões de usuários** (novo sistema de roles)
4. **Reconfigurar módulo fiscal** (nova estrutura)

## Reporting de Bugs

Para reportar bugs ou solicitar funcionalidades:

1. **GitHub Issues**: [github.com/org/erp-retifica/issues](https://github.com)
2. **Email**: suporte@retifica-erp.com
3. **Discord**: Canal #bug-reports

### Template de Bug Report

```markdown
**Versão**: 1.2.0
**Browser**: Chrome 120.0.0
**Dispositivo**: Desktop/Mobile
**Descrição**: Descrição clara do problema
**Passos para reproduzir**: 
1. Fazer isso
2. Fazer aquilo
3. Observar o erro

**Comportamento esperado**: O que deveria acontecer
**Screenshots**: Se aplicável
**Logs**: Colar logs do console se disponível
```

---

**Legenda dos Emojis**:
- 🚀 Lançamentos
- ⚡ Performance
- 🐛 Bug fixes
- 🔒 Security
- 🎨 UI/UX
- 📊 Analytics
- 🔧 Config
- 📱 Mobile
- 🏢 Business logic
- 📚 Documentation