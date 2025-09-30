# Guia de Configurações do Módulo Operações e Serviços

## 📋 Visão Geral

A página de **Configurações do Módulo Operações e Serviços** centraliza todas as configurações operacionais do sistema, permitindo que administradores e gerentes personalizem tipos de motor, checklists de diagnóstico e status de workflow.

## 🔐 Controle de Acesso

### Perfis com Acesso
- **Administradores**: Acesso completo a todas as configurações
- **Gerentes**: Acesso a tipos de motor e checklists (limitado em status de workflow)

### Restrições
- **Status de Workflow**: Apenas administradores podem gerenciar
- **Usuários comuns**: Não têm acesso à página de configurações

## 🚀 Como Acessar

### Via Navegação Principal
1. Faça login no sistema
2. No menu lateral, acesse **"Operações & Serviços"**
3. Clique em **"Configurações Operações"**

### Via URL Direta
- Acesse: `/configuracoes/operacoes`

## 📑 Abas de Configuração

### 1. Tipos de Motor
**Funcionalidade**: Gerenciar tipos de motor disponíveis no sistema

**Recursos Disponíveis**:
- ✅ Criar novos tipos de motor
- ✅ Editar tipos existentes
- ✅ Definir componentes por tipo
- ✅ Configurar especificações técnicas
- ✅ Ativar/desativar tipos

**Permissões**: Administradores e Gerentes

### 2. Checklists de Diagnóstico
**Funcionalidade**: Configurar checklists personalizados para diagnóstico

**Recursos Disponíveis**:
- ✅ Criar checklists por componente
- ✅ Associar checklists a tipos de motor
- ✅ Definir itens de verificação
- ✅ Configurar critérios de aprovação
- ✅ Versionamento de checklists

**Permissões**: Administradores e Gerentes

### 3. Status de Workflow
**Funcionalidade**: Personalizar status do fluxo operacional

**Recursos Disponíveis**:
- ✅ Criar status personalizados
- ✅ Configurar cores e ícones
- ✅ Definir ordem de exibição
- ✅ Estabelecer pré-requisitos
- ✅ Sistema de auditoria

**Permissões**: Apenas Administradores

## 🎯 Casos de Uso Comuns

### Configurar Novo Tipo de Motor
1. Acesse a aba **"Tipos de Motor"**
2. Clique em **"Adicionar Tipo"**
3. Preencha as informações básicas
4. Defina os componentes suportados
5. Salve as configurações

### Criar Checklist Personalizado
1. Acesse a aba **"Checklists de Diagnóstico"**
2. Selecione **"Novo Checklist"**
3. Escolha o tipo de motor e componente
4. Adicione itens de verificação
5. Configure critérios de aprovação
6. Publique o checklist

### Personalizar Status de Workflow
1. Acesse a aba **"Status de Workflow"** (apenas admin)
2. Clique em **"Adicionar Status"**
3. Defina nome, cor e ícone
4. Configure pré-requisitos se necessário
5. Defina ordem de exibição
6. Ative o status

## ⚠️ Considerações Importantes

### Impacto nas Operações
- Alterações podem afetar ordens de serviço em andamento
- Coordene mudanças com a equipe operacional
- Teste configurações em ambiente controlado

### Boas Práticas
- **Backup**: Sempre faça backup antes de grandes alterações
- **Comunicação**: Informe a equipe sobre mudanças
- **Testes**: Valide configurações antes de aplicar em produção
- **Documentação**: Mantenha registro das alterações

### Auditoria
- Todas as alterações são registradas
- Histórico completo de mudanças disponível
- Rastreabilidade por usuário e timestamp

## 🔧 Solução de Problemas

### Acesso Negado
**Problema**: Usuário não consegue acessar a página
**Solução**: Verificar se o perfil é admin ou gerente

### Configurações Não Salvam
**Problema**: Alterações não são persistidas
**Solução**: 
1. Verificar conexão com internet
2. Validar permissões do usuário
3. Verificar logs do sistema

### Status Não Aparecem no Workflow
**Problema**: Novos status não aparecem no Kanban
**Solução**:
1. Verificar se status está ativo
2. Confirmar ordem de exibição
3. Atualizar página do workflow

## 📊 Métricas e Monitoramento

### Indicadores de Uso
- Número de tipos de motor configurados
- Quantidade de checklists ativos
- Status de workflow personalizados
- Frequência de uso por configuração

### Relatórios Disponíveis
- Histórico de alterações
- Uso de configurações por período
- Performance de checklists
- Eficiência de status personalizados

## 🔄 Integração com Outros Módulos

### Módulos Relacionados
- **Workflow**: Usa status configurados
- **Diagnósticos**: Aplica checklists configurados
- **Ordens de Serviço**: Utiliza tipos de motor
- **Relatórios**: Inclui métricas de configuração

### APIs Relacionadas
- `/api/engine-types`: Gestão de tipos de motor
- `/api/diagnostic-checklists`: Checklists de diagnóstico
- `/api/workflow-status`: Status de workflow
- `/api/operations-config`: Configurações gerais

---

## 📝 Changelog

### Versão 1.0.0 (Setembro 2024)
- ✅ Criação da página centralizada de configurações
- ✅ Implementação de controle de acesso por perfil
- ✅ Integração com componentes existentes
- ✅ Interface responsiva mobile-first
- ✅ Sistema de permissões granulares

---

*Última atualização: 30/09/2024*
*Versão do documento: 1.0.0*
