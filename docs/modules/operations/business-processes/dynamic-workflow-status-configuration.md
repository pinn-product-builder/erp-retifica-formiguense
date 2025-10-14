# Configuração Dinâmica de Status de Workflow

## Visão Geral

O sistema de Configuração Dinâmica de Status de Workflow permite que administradores personalizem completamente os status de workflow da retífica, adaptando o sistema aos processos específicos de cada organização.

## Funcionalidades Principais

### ✅ Gerenciamento de Status
- **Criar** novos status de workflow personalizados
- **Editar** status existentes (cores, ícones, tempos)
- **Excluir** status não utilizados
- **Visualizar** todos os status configurados
- **Validação** de campos obrigatórios
- **Feedback visual** com toasts de confirmação/erro

### ✅ Personalização Visual
- **Cores personalizadas** para fundo e texto
- **Ícones** para identificação visual
- **Ordem de exibição** no Kanban board
- **Preview em tempo real** das configurações
- **Interface responsiva** para mobile e desktop
- **Seletores de cor** integrados

### ✅ Controle de Processo
- **Tempo estimado** de execução por status
- **Status ativo/inativo** para controle de visibilidade
- **Pré-requisitos** entre status (transições permitidas)
- **Auditoria** de mudanças de status
- **Validação** de transições (origem ≠ destino)
- **Tipos de transição** (manual, automática, com aprovação, condicional)

## Como Acessar

1. **Faça login** como usuário administrador
2. **Navegue** para `Configurações` no menu lateral
3. **Clique** na aba `Status Workflow`

## Guia Passo a Passo

### 1. Visualizar Status Existentes

Na tela principal, você verá:
- **Lista de status** configurados
- **Cores** de cada status
- **Tempo estimado** de execução
- **Status ativo/inativo**
- **Ordem** de exibição

### 2. Criar Novo Status

1. **Clique** no botão `Novo Status`
2. **Preencha** o formulário:
   - **Chave do Status**: Identificador único (ex: `entrada`, `usinagem`)
   - **Nome do Status**: Nome exibido na interface (ex: `Entrada`, `Usinagem`)
   - **Tempo Estimado**: Horas estimadas para execução
   - **Ordem de Exibição**: Posição no Kanban board
   - **Cor de Fundo**: Cor de fundo do status
   - **Cor do Texto**: Cor do texto do status
   
   **Configurações Avançadas de SLA:**
   - **SLA Máximo**: Tempo máximo em horas antes de alertas
   - **Alerta em % do SLA**: Percentual do SLA para disparar alerta (padrão: 80%)
   - **Habilitar Alertas de SLA**: Ativar notificações automáticas
   - **Escalação Automática**: Notificar supervisores automaticamente
   - **Horário Comercial**: Considerar apenas horário comercial nos cálculos
3. **Visualize** o preview das cores
4. **Clique** em `Criar`

### 3. Editar Status Existente

1. **Clique** no ícone de edição (lápis) do status desejado
2. **Modifique** os campos necessários
3. **Visualize** o preview das mudanças
4. **Clique** em `Salvar`

### 4. Excluir Status

1. **Clique** no ícone de exclusão (lixeira) do status
2. **Confirme** a exclusão no diálogo
3. **Status** será removido permanentemente

### 5. Gerenciar Pré-requisitos

#### 5.1 Criar Novo Pré-requisito

1. **Acesse** a aba "Pré-requisitos"
2. **Clique** no botão "Novo Pré-requisito"
3. **Preencha** o formulário:
   - **Status de Origem**: Status de onde a transição parte
   - **Status de Destino**: Status para onde a transição vai
   - **Componente** (opcional): Especificar componente ou "Todos"
   - **Tipo de Transição**: Manual, Automática, Requer Aprovação, Condicional
   - **Ativo**: Marcar se a regra está ativa
4. **Clique** em "Criar"

#### 5.2 Editar Pré-requisito

1. **Clique** no ícone de edição (lápis) do pré-requisito
2. **Modifique** os campos necessários
3. **Clique** em "Salvar"

#### 5.3 Excluir Pré-requisito

1. **Clique** no ícone de exclusão (lixeira) do pré-requisito
2. **Confirme** a exclusão no diálogo
3. **Regra** será removida permanentemente

## Configurações Avançadas

### Aba "Pré-requisitos"
- **Criar** novas regras de transição entre status
- **Editar** pré-requisitos existentes
- **Excluir** regras desnecessárias
- **Visualizar** todas as transições configuradas
- **Configurar** por componente específico
- **Definir** tipos de transição (manual, automática, com aprovação, condicional)
- **Validação** de campos obrigatórios
- **Feedback** com toasts de confirmação/erro

### Configurações de SLA e Tempo (Integradas na Aba Status)
- **Tempos estimados** configuráveis por status
- **SLA máximo** com alertas automáticos
- **Threshold de alerta** configurável (% do SLA)
- **Escalação automática** para supervisores
- **Horário comercial** para cálculos de SLA

### Aba "Auditoria"
- **Histórico** de mudanças de status
- **Usuários** que fizeram alterações
- **Timestamps** das mudanças
- **Configurações** de notificação

## Exemplos de Configuração

### Status Básicos de Retífica

| Chave | Nome | Tempo Est. | SLA Máx. | Alerta | Cor | Ordem |
|-------|------|------------|----------|--------|-----|-------|
| `entrada` | Entrada | 0.5h | 2h | 80% | Vermelho | 1 |
| `metrologia` | Metrologia | 2h | 4h | 80% | Laranja | 2 |
| `usinagem` | Usinagem | 8h | 12h | 75% | Amarelo | 3 |
| `montagem` | Montagem | 4h | 6h | 80% | Verde | 4 |
| `pronto` | Pronto | 1h | 2h | 90% | Azul | 5 |
| `garantia` | Garantia | 0h | - | - | Roxo | 6 |
| `entregue` | Entregue | 0h | - | - | Verde Escuro | 7 |

### Configurações de SLA Recomendadas

#### Tempos de SLA por Tipo de Processo
- **Processos Rápidos** (Entrada, Pronto): SLA = 2-4x tempo estimado
- **Processos Médios** (Metrologia, Montagem): SLA = 1.5-2x tempo estimado  
- **Processos Longos** (Usinagem): SLA = 1.2-1.5x tempo estimado

#### Thresholds de Alerta
- **Processos Críticos**: 75% do SLA
- **Processos Normais**: 80% do SLA
- **Processos Flexíveis**: 90% do SLA

#### Configurações de Escalação
- **Automática**: Para processos críticos com SLA rígido
- **Manual**: Para processos que requerem análise caso a caso
- **Horário Comercial**: Ativar para cálculos mais precisos

### Cores Recomendadas

- **Entrada**: `#fef2f2` (fundo) / `#dc2626` (texto)
- **Processamento**: `#fff7ed` (fundo) / `#ea580c` (texto)
- **Finalização**: `#f0fdf4` (fundo) / `#16a34a` (texto)
- **Concluído**: `#ecfdf5` (fundo) / `#059669` (texto)

## Boas Práticas

### Nomenclatura
- **Chaves**: Use letras minúsculas e underscore (ex: `entrada`, `usinagem_especial`)
- **Nomes**: Use primeira letra maiúscula (ex: `Entrada`, `Usinagem Especial`)
- **Consistência**: Mantenha padrão em toda a organização

### Cores
- **Contraste**: Garanta legibilidade do texto
- **Consistência**: Use paleta de cores harmoniosa
- **Significado**: Cores podem indicar prioridade ou tipo de processo

### Ordem
- **Sequência lógica**: Siga o fluxo natural do processo
- **Agrupamento**: Agrupe status relacionados
- **Flexibilidade**: Permita reordenação conforme necessário

## Troubleshooting

### Problema: Status não aparece no Kanban
**Solução**: Verifique se o status está marcado como "Ativo"

### Problema: Cores não aplicadas
**Solução**: Verifique se as cores estão no formato hexadecimal válido

### Problema: Não consigo excluir status
**Solução**: Verifique se o status não está sendo usado em workflows ativos

### Problema: Transições não funcionam
**Solução**: Verifique os pré-requisitos configurados na aba correspondente

### Problema: Botão "Criar" não funciona
**Solução**: 
1. Verifique se todos os campos obrigatórios estão preenchidos
2. Verifique se a chave do status é única
3. Verifique se o nome do status não está vazio
4. Recarregue a página se necessário

### Problema: Botão "Salvar" de pré-requisitos não funciona
**Solução**:
1. Verifique se os status de origem e destino estão selecionados
2. Verifique se origem e destino são diferentes
3. Verifique se todos os campos obrigatórios estão preenchidos
4. Recarregue a página se necessário

### Problema: Erro 403 ao criar/editar
**Solução**: Verifique se você tem permissões de administrador ou super admin

### Problema: Status não aparecem na lista
**Solução**: 
1. Verifique se há uma organização selecionada
2. Verifique se os status estão marcados como ativos
3. Verifique a conexão com o banco de dados

## Permissões

### Super Admin
- ✅ Criar, editar e excluir status (qualquer organização)
- ✅ Configurar pré-requisitos (qualquer organização)
- ✅ Acessar auditoria completa
- ✅ Modificar configurações de SLA
- ✅ Gerenciar status globais

### Administrador da Organização
- ✅ Criar, editar e excluir status (sua organização)
- ✅ Configurar pré-requisitos (sua organização)
- ✅ Acessar auditoria da organização
- ✅ Modificar configurações de SLA
- ✅ Visualizar status globais

### Usuário Comum
- ❌ Não tem acesso à configuração
- ✅ Visualiza status no Kanban
- ✅ Pode mover itens entre status (se permitido pelos pré-requisitos)

## Integração com Sistema

### Kanban Board
- **Atualização automática** das configurações
- **Cores dinâmicas** baseadas nas configurações
- **Ordem** respeitando display_order
- **Validação** de transições baseada em pré-requisitos

### Auditoria
- **Registro automático** de mudanças
- **Histórico completo** de transições
- **Rastreabilidade** de usuários e timestamps

### Notificações
- **Alertas** de mudanças de status
- **Configuração** por tipo de transição
- **Integração** com sistema de notificações

## Suporte Técnico

Para dúvidas ou problemas:
1. **Consulte** esta documentação
2. **Verifique** os logs do sistema
3. **Entre em contato** com o administrador do sistema
4. **Reporte** bugs através do sistema de tickets

---

**Versão**: 2.1  
**Última atualização**: Setembro 2024  
**Autor**: Sistema ERP Retífica Formiguense

## Changelog

### v2.1 (Setembro 2024)
- ✅ **Remoção da aba "SLA & Tempo"** redundante
- ✅ **Integração de configurações SLA** na aba Status
- ✅ **Configurações avançadas de SLA** (máximo, threshold, alertas)
- ✅ **Escalação automática** para supervisores
- ✅ **Cálculos de horário comercial** para SLA
- ✅ **Interface otimizada** com 3 abas (Status, Pré-requisitos, Auditoria)
- ✅ **Badges informativos** para SLA e alertas na listagem
- ✅ **Documentação atualizada** com exemplos de SLA

### v2.0 (Setembro 2024)
- ✅ **CRUD completo** para pré-requisitos de workflow
- ✅ **Validação de campos** obrigatórios com feedback visual
- ✅ **Interface responsiva** mobile-first
- ✅ **Sistema de toasts** para confirmação/erro
- ✅ **Validação de transições** (origem ≠ destino)
- ✅ **Correção de bugs** nos botões de ação
- ✅ **Políticas RLS** atualizadas para super admins
- ✅ **Logs de debug** para troubleshooting
- ✅ **Tipos de transição** expandidos (manual, automática, aprovação, condicional)
- ✅ **Configuração por componente** específico
