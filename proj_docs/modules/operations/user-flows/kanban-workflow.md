# Workflow do Kanban Board

Esta documentação detalha o funcionamento completo do sistema Kanban para gestão visual de workflows operacionais no módulo Operações & Serviços.

## 🎯 Visão Geral do Kanban

O sistema Kanban oferece uma interface visual drag-and-drop para acompanhar o progresso de cada componente do motor através das diferentes etapas do processo produtivo.

### Biblioteca Utilizada
- **@hello-pangea/dnd**: Biblioteca React para drag-and-drop
- **Responsividade**: Adaptação automática para diferentes tamanhos de tela
- **Performance**: Otimização para grandes volumes de dados

## 🔄 Estados do Workflow

<lov-mermaid>
flowchart LR
    A[Entrada] --> B[Metrologia]
    B --> C[Usinagem]
    C --> D[Montagem]
    D --> E[Pronto]
    E --> F[Garantia]
    F --> G[Entregue]
    
    style A fill:#ff9999
    style B fill:#ffcc99
    style C fill:#ffff99
    style D fill:#ccff99
    style E fill:#99ffcc
    style F fill:#99ccff
    style G fill:#cc99ff
</lov-mermaid>

### 📋 Detalhamento dos Estados

#### 1. **Entrada** 🚪
- **Cor**: Vermelho claro (#ff9999)
- **Descrição**: Recebimento inicial do componente
- **Ações Típicas**:
  - Catalogação da peça
  - Registro de entrada no sistema
  - Atribuição de número de ordem
  - Documentação fotográfica inicial

#### 2. **Metrologia** 📏
- **Cor**: Laranja claro (#ffcc99)
- **Descrição**: Medição e análise dimensional
- **Ações Típicas**:
  - Medição dimensional
  - Análise de desgaste
  - Definição de processo necessário
  - Orçamento de materiais

#### 3. **Usinagem** ⚙️
- **Cor**: Amarelo (#ffff99)
- **Descrição**: Processos de corte e acabamento
- **Ações Típicas**:
  - Operações de torneamento
  - Fresamento e retífica
  - Soldas e reparos
  - Controle dimensional

#### 4. **Montagem** 🔧
- **Cor**: Verde claro (#ccff99)
- **Descrição**: Montagem de componentes e subconjuntos
- **Ações Típicas**:
  - Montagem de subconjuntos
  - Instalação de vedações
  - Torques especificados
  - Teste funcional

#### 5. **Pronto** ✅
- **Cor**: Verde água (#99ffcc)
- **Descrição**: Finalização e controle de qualidade
- **Ações Típicas**:
  - Inspeção final
  - Teste de qualidade
  - Limpeza e embalagem
  - Documentação de entrega

#### 6. **Garantia** 🛡️
- **Cor**: Azul claro (#99ccff)
- **Descrição**: Período de garantia técnica
- **Ações Típicas**:
  - Registro de garantia
  - Acompanhamento pós-entrega
  - Atendimento de reclamações
  - Análise de performance

#### 7. **Entregue** 📦
- **Cor**: Roxo claro (#cc99ff)
- **Descrição**: Entrega final ao cliente
- **Ações Típicas**:
  - Confirmação de entrega
  - Documentação fiscal
  - Satisfação do cliente
  - Arquivo da ordem

## 🎨 Componentes do Sistema

### Seletor de Componentes

<lov-mermaid>
flowchart TD
    A[Seletor de Componentes] --> B[Bloco]
    A --> C[Eixo]
    A --> D[Biela]
    A --> E[Comando]
    A --> F[Cabeçote]
    
    B --> G[Kanban Board - Bloco]
    C --> H[Kanban Board - Eixo]
    D --> I[Kanban Board - Biela]
    E --> J[Kanban Board - Comando]
    F --> K[Kanban Board - Cabeçote]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#fce4ec
    style F fill:#e0f2f1
</lov-mermaid>

### Interface Responsiva

#### Desktop (> 1024px)
- **Layout**: 7 colunas (uma por estado)
- **Altura**: Cards com altura fixa
- **Interação**: Drag-and-drop completo

#### Tablet (768px - 1024px)
- **Layout**: Scroll horizontal
- **Colunas**: 4-5 visíveis simultaneamente
- **Touch**: Gestos otimizados

#### Mobile (< 768px)
- **Layout**: Uma coluna por vez
- **Navegação**: Swipe entre estados
- **Cards**: Altura adaptativa

## 🔄 Fluxo de Drag & Drop

<lov-mermaid>
sequenceDiagram
    participant U as Usuário
    participant C as ComponentCard
    participant K as KanbanColumn
    participant H as useWorkflowUpdate
    participant S as Supabase
    
    U->>C: Inicia drag
    C->>K: onDragStart
    U->>K: Drop na nova coluna
    K->>H: updateWorkflowStatus
    H->>S: UPDATE order_workflow
    S-->>H: Confirmação
    H-->>K: Status atualizado
    K-->>U: Feedback visual
    
    Note over U,S: Atualização em tempo real
</lov-mermaid>

### Estados do Drag

1. **Drag Start**: Card ganha opacidade reduzida
2. **Drag Over**: Coluna de destino recebe destaque
3. **Drop Success**: Animação de confirmação
4. **Drop Error**: Retorno à posição original

## 📊 Component Card

### Informações Exibidas

<lov-mermaid>
graph TD
    A[Component Card] --> B[Header Info]
    A --> C[Status Info]
    A --> D[Action Buttons]
    A --> E[Progress Indicators]
    
    B --> B1[Número da Ordem]
    B --> B2[Nome do Cliente]
    B --> B3[Modelo do Motor]
    
    C --> C1[Data de Entrada]
    C --> C2[Data de Coleta]
    C --> C3[Dias no Status]
    C --> C4[Usuário Responsável]
    
    D --> D1[Ver Mais]
    D --> D2[Adicionar Foto]
    D --> D3[Observações]
    
    E --> E1[Indicador de Fotos]
    E --> E2[Indicador de Notas]
    E --> E3[Progresso de Tempo]
</lov-mermaid>

### Códigos de Cor por Tempo

```typescript
const getProgressColor = (days: number): string => {
  if (days <= 2) return 'bg-green-500'    // Verde: No prazo
  if (days <= 5) return 'bg-yellow-500'   // Amarelo: Atenção
  if (days <= 10) return 'bg-orange-500'  // Laranja: Atraso leve
  return 'bg-red-500'                     // Vermelho: Atraso crítico
}
```

## ⚡ Performance e Otimizações

### Virtualization
- **React Window**: Renderização apenas de cards visíveis
- **Lazy Loading**: Carregamento sob demanda
- **Memoization**: Cache de componentes pesados

### Estado Local vs Global
- **Estado Local**: Posição atual do drag
- **Estado Global**: Dados persistentes das ordens
- **Sincronização**: Debounce para atualizações de API

### Atualizações em Tempo Real
```typescript
// Padrão de atualização otimística
const handleDragEnd = async (result) => {
  // 1. Atualização otimística (UI)
  updateLocalState(result)
  
  // 2. Atualização no servidor
  try {
    await updateWorkflowStatus(result)
  } catch (error) {
    // 3. Rollback em caso de erro
    revertLocalState(result)
    showErrorToast(error)
  }
}
```

## 🎯 Métricas de UX

### Tempo de Resposta
- **Drag Start**: < 16ms (60fps)
- **Drop Animation**: 300ms
- **API Response**: < 2s

### Taxa de Sucesso
- **Drop Success Rate**: > 99%
- **Error Recovery**: Automático
- **User Satisfaction**: NPS > 8.5

### Acessibilidade
- **Keyboard Navigation**: Suporte completo
- **Screen Readers**: ARIA labels
- **High Contrast**: Temas alternativos

## 🔍 Debugging e Logs

### Console Logs
```typescript
// Debug mode para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('Drag started:', {
    orderId: draggableId,
    source: source.droppableId,
    destination: destination?.droppableId
  })
}
```

### Error Tracking
- **Sentry Integration**: Captura de erros
- **Performance Monitoring**: Métricas de performance
- **User Feedback**: Sistema de feedback integrado

---

*Última atualização: 23/09/2025*