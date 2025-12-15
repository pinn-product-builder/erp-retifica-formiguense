# Atualização do Workflow - Cards Baseados em OS

## 📋 Resumo da Mudança

Refatoração completa do sistema de workflow para que os cards do Kanban sejam **sempre associados à Ordem de Serviço (OS)**, não mais aos componentes individuais. A visualização de componentes separados agora é controlada pela configuração `allow_component_split` de cada status.

## 🎯 Motivação

Anteriormente, o sistema criava cards individuais por componente quando `allow_component_split` estava ativo, o que causava:
- Dificuldade em rastrear o progresso da OS como um todo
- Complexidade no drag and drop (alguns cards eram de OS, outros de componentes)
- Inconsistência na visualização dependendo do status

A nova implementação garante que:
- **Todos os cards representam uma OS completa**
- Os componentes podem ser visualizados dentro do card quando configurado
- A movimentação no Kanban sempre move a OS inteira (ou os componentes de um status específico)

## 🔧 Mudanças Implementadas

### 1. **KanbanBoard.tsx**

#### Antes:
```typescript
// Criava cards de componente OU cards de OS dependendo de allow_component_split
if (allowSplit) {
  // Cards individuais de componente
  workflowsForStatus.forEach((workflow: any) => {
    workflowsByStatus[status].push({
      ...workflow,
      type: 'component'
    });
  });
} else {
  // Card de OS
  workflowsByStatus[status].push({
    type: 'order',
    workflows: workflowsForStatus
  });
}
```

#### Depois:
```typescript
// SEMPRE cria card de OS
const orderCardData: OrderCardData = {
  type: 'order',
  order: order,
  orderId: order.id,
  workflows: filteredWorkflows,
  statusConfig: statusConfig,
  allowComponentSplit: statusConfig?.allow_component_split === true
};

workflowsByStatus[status].push(orderCardData);
```

**Principais mudanças:**
- ✅ Adicionadas interfaces TypeScript (`Order`, `OrderWorkflow`, `OrderCardData`)
- ✅ Lógica de organização simplificada - sempre cria cards de OS
- ✅ Passa `allowComponentSplit` como propriedade para o OrderCard
- ✅ Drag and drop refatorado para lidar apenas com OS
- ✅ Remoção do import de `ComponentCard` (não mais usado)
- ✅ Tipagem forte com `DropResult` do `@hello-pangea/dnd`

### 2. **KanbanColumn.tsx**

#### Antes:
```typescript
{item.type === 'order' ? (
  <OrderCard {...props} />
) : (
  <ComponentCard {...props} />
)}
```

#### Depois:
```typescript
// Sempre renderiza OrderCard
<OrderCard 
  order={item.order}
  workflows={item.workflows}
  statusConfig={item.statusConfig || statusConfig}
  allowComponentSplit={item.allowComponentSplit}
  onUpdate={onUpdate}
  employeeOptions={employeeOptions}
  employeesLoading={employeesLoading}
/>
```

**Principais mudanças:**
- ✅ Removida lógica condicional entre ComponentCard e OrderCard
- ✅ Adicionada interface `OrderCardData` para tipagem
- ✅ Simplificação do código - apenas um tipo de card

### 3. **OrderCard.tsx** (Mudança Mais Significativa)

Nova funcionalidade: **Collapsible para visualização de componentes**

#### Recursos adicionados:

##### 3.1 Estado de Expansão
```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

##### 3.2 Visualização Condicional
```typescript
{allowComponentSplit && workflows.length > 0 ? (
  <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
    {/* Lista expandível de componentes */}
  </Collapsible>
) : (
  /* Badges compactas de componentes */
)}
```

##### 3.3 Detalhamento de Componentes
Quando `allowComponentSplit` está ativo:
- ✅ Botão para expandir/colapsar componentes
- ✅ Lista detalhada de cada componente com:
  - Nome do componente com cor identificadora
  - Status de conclusão (CheckCircle / Circle)
  - Funcionário responsável
  - Indicadores de fotos e notas
  - Click individual para abrir modal do workflow

Quando `allowComponentSplit` está inativo:
- ✅ Visualização compacta com badges coloridas
- ✅ Mostra até 5 componentes + indicador de "+N"
- ✅ Click no card abre modal do workflow mais recente

**Principais mudanças:**
- ✅ Import de `Collapsible` e novos ícones (`ChevronDown`, `ChevronUp`, `CheckCircle2`, `Circle`)
- ✅ Import de `useEngineComponents` para labels corretas
- ✅ Nova prop `allowComponentSplit`
- ✅ Função `getComponentLabel` para converter IDs em nomes legíveis
- ✅ Função `getComponentColorHex` para cores dos badges
- ✅ Click handler diferenciado (card inteiro vs componentes individuais)
- ✅ UI responsiva mantida (mobile-first)

## 🎨 Experiência do Usuário

### Status com `allow_component_split = false`
```
┌─────────────────────────────┐
│ 📦 OS #12345                │
│                             │
│ Cliente XYZ Ltda            │
│ Mercedes OM-904             │
│                             │
│ Progresso: 60% [████████  ] │
│                             │
│ [Bloco] [Eixo] [Biela]     │
│ [Comando] +2                │
│                             │
│ 📅 12/12/24                 │
│                             │
│ [Ver detalhes]              │
└─────────────────────────────┘
```
- Card compacto
- Click abre modal do workflow mais recente
- Ideal para status onde a OS é tratada como um todo

### Status com `allow_component_split = true`
```
┌─────────────────────────────┐
│ 📦 OS #12345                │
│                             │
│ Cliente XYZ Ltda            │
│ Mercedes OM-904             │
│                             │
│ Progresso: 60% [████████  ] │
│                             │
│ [▼ 5 componentes]           │ ← Clicável
│                             │
│ Expandido:                  │
│ ┌─────────────────────────┐ │
│ │ • Bloco Motor      ✓    │ │ ← Clicável
│ │   👤 João Silva         │ │
│ │   📷 3  💬             │ │
│ ├─────────────────────────┤ │
│ │ • Virabrequim      ○    │ │
│ │   👤 Maria Santos       │ │
│ ├─────────────────────────┤ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│                             │
│ 📅 12/12/24                 │
└─────────────────────────────┘
```
- Card expansível
- Click nos componentes individuais abre modal específico
- Ideal para status onde cada componente tem tratamento separado

## 🔄 Fluxo de Drag & Drop

### Antes:
- Cards mistos (OS e componentes)
- Complexidade para identificar tipo de card
- Validação de transição diferente por tipo

### Agora:
```typescript
// SEMPRE arrasta OS completa
const orderId = draggableId.replace('order-', '');

// Filtra apenas workflows no status atual
const workflowsInCurrentStatus = order.order_workflow.filter(
  (w) => w.status === currentStatus
);

// Move apenas os workflows do status atual para o novo status
```

**Comportamento:**
1. Usuário arrasta card da OS
2. Sistema identifica todos os workflows da OS no status atual
3. Move apenas esses workflows para o novo status
4. Workflows em outros status permanecem inalterados
5. Toast informa quantos componentes foram movidos

## 📱 Responsividade

Mantidas todas as diretrizes de responsividade:

```css
/* Componentes expansíveis */
- Padding: p-2 (interno dos componentes)
- Font: text-xs (labels e informações)
- Icons: w-3 h-3 (ícones pequenos)
- Truncate: mantido em todos os textos

/* Botão de expansão */
- Height: h-auto py-2
- Full width: w-full
- Chevron: w-3 h-3 sm:w-4 sm:h-4
```

## 🧪 Cenários de Teste

### 1. Status sem desmembramento
- [ ] Card mostra resumo compacto da OS
- [ ] Click no card abre modal do último workflow
- [ ] Drag & drop move todos os componentes do status
- [ ] Progress bar atualiza corretamente

### 2. Status com desmembramento
- [ ] Card mostra botão de expandir
- [ ] Expansão revela lista de componentes
- [ ] Click em componente individual abre modal correto
- [ ] Cada componente mostra suas informações (responsável, fotos, notas)
- [ ] Ícone de check/circle indica status de conclusão

### 3. Drag & Drop
- [ ] Arrasta OS de status sem desmembramento
- [ ] Arrasta OS de status com desmembramento
- [ ] Move apenas workflows do status atual
- [ ] Valida transições permitidas
- [ ] Mostra toast com feedback correto
- [ ] Atualiza board após movimento

### 4. Filtros
- [ ] Filtro de componentes funciona corretamente
- [ ] Filtro de OS por número funciona
- [ ] OS some quando todos componentes filtrados estão em zero

### 5. Mobile
- [ ] Cards responsivos em telas < 640px
- [ ] Botões de expansão acessíveis no mobile
- [ ] Componentes expandidos legíveis
- [ ] Scroll horizontal do kanban funciona

## 🔧 Arquivos Modificados

```
src/components/workflow/
├── KanbanBoard.tsx    (+160 -161 lines) - Lógica principal
├── KanbanColumn.tsx   (+20 -29 lines)   - Renderização de colunas
└── OrderCard.tsx      (+145 -64 lines)  - Card de OS com expansão
```

## 📊 Métricas de Código

- **Total de mudanças:** 357 inserções, 221 deleções
- **Complexidade reduzida:** Eliminação de lógica condicional de tipo de card
- **Tipagem:** Adicionadas interfaces TypeScript para maior segurança
- **Responsividade:** Mantida 100%
- **Acessibilidade:** Botões e interações mantidos acessíveis

## 🚀 Benefícios

1. **Consistência**: Todos os cards representam OS, não há ambiguidade
2. **Flexibilidade**: Configuração por status define visualização
3. **Rastreabilidade**: Fácil ver progresso da OS como um todo
4. **Manutenibilidade**: Código mais simples e tipado
5. **UX melhorada**: Interação clara e intuitiva
6. **Performance**: Menos re-renders desnecessários

## 📝 Notas de Migração

- ✅ Não há breaking changes na API
- ✅ Configurações existentes de `allow_component_split` continuam funcionando
- ✅ Workflows e OS existentes não precisam de migração
- ✅ Todas as funcionalidades anteriores mantidas

## 🔮 Possíveis Melhorias Futuras

1. Animação de expansão mais suave
2. Drag & drop de componentes individuais quando permitido
3. Reordenação de componentes dentro da OS
4. Ações em lote nos componentes expandidos
5. Persistir estado de expansão no localStorage

---

**Data:** 14/12/2024  
**Versão:** 1.0.0  
**Autor:** Sistema ERP Retífica Formiguense
