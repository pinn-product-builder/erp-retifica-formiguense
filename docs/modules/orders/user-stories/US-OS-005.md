# US-OS-005: Timeline e Histórico de Status da OS

**ID:** US-OS-005  
**Epic:** Gestão de Ordens de Serviço  
**Sprint:** 2  
**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Status:** To Do  

---

## 📋 User Story

**Como** usuário do sistema  
**Quero** visualizar o histórico cronológico de eventos de uma OS  
**Para** rastrear todas as mudanças e entender o progresso

---

## 🎯 Business Objective

Garantir rastreabilidade completa de todas as ações realizadas em uma ordem de serviço, facilitando auditorias e resolução de problemas.

---

## 📐 Business Rules

### RN001: Eventos Registrados
- Criação da OS
- Mudanças de status
- Edições de dados gerais
- Transições de workflow
- Aprovações de orçamento
- Aplicação de materiais
- Finalizações de etapas
- Entregas
- Ativação de garantia

### RN002: Estrutura do Evento
- **Timestamp**: Data/hora exata
- **Ação**: Tipo de evento (created, status_changed, edited, etc)
- **Usuário**: Quem realizou a ação
- **Detalhes**: Descrição legível do que mudou
- **Metadata**: Dados adicionais em JSON

### RN003: Ordenação
- Eventos exibidos do mais recente para o mais antigo
- Agrupamento por data (Hoje, Ontem, [Data])
- Paginação a cada 50 eventos

### RN004: Ícones e Cores por Tipo
```typescript
const EVENT_ICONS = {
  created: { icon: Plus, color: 'text-blue-600' },
  status_changed: { icon: ArrowRight, color: 'text-purple-600' },
  edited: { icon: Edit, color: 'text-yellow-600' },
  workflow_transition: { icon: Workflow, color: 'text-green-600' },
  budget_approved: { icon: CheckCircle2, color: 'text-emerald-600' },
  material_applied: { icon: Package, color: 'text-orange-600' },
  delivered: { icon: Truck, color: 'text-indigo-600' },
  warranty_activated: { icon: Shield, color: 'text-cyan-600' }
};
```

---

## ✅ Acceptance Criteria

**AC1:** Tab "Timeline" carrega histórico da tabela `order_status_history`  
**AC2:** Eventos exibidos em ordem cronológica reversa  
**AC3:** Cada evento mostra ícone, timestamp, usuário e descrição  
**AC4:** Cards de eventos expansíveis para ver metadata  
**AC5:** Agrupamento por data implementado  
**AC6:** Paginação funcional (Load More)  
**AC7:** Loading state ao carregar mais eventos

---

## 🛠️ Definition of Done

- [ ] Componente `OrderTimelineTab.tsx` criado
- [ ] Componente `TimelineEvent.tsx` criado
- [ ] Hook `useOrderHistory.ts` implementado
- [ ] Query Supabase com join em `profiles`
- [ ] Paginação implementada
- [ ] Ícones e cores dinâmicas
- [ ] Testes E2E escritos
- [ ] Documentação técnica

---

## 📁 Affected Components

```
src/components/orders/
  ├── OrderTimelineTab.tsx        (NEW)
  └── TimelineEvent.tsx           (NEW)

src/hooks/
  └── useOrderHistory.ts          (NEW)
```

---

## 🗄️ Database Query

```typescript
// Hook useOrderHistory.ts
const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
  queryKey: ['order-history', orderId],
  queryFn: async ({ pageParam = 0 }) => {
    const { data, error } = await supabase
      .from('order_status_history')
      .select(`
        *,
        profiles!order_status_history_changed_by_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq('order_id', orderId)
      .order('changed_at', { ascending: false })
      .range(pageParam * 50, (pageParam + 1) * 50 - 1);

    if (error) throw error;
    return data;
  },
  getNextPageParam: (lastPage, allPages) => {
    return lastPage.length === 50 ? allPages.length : undefined;
  }
});
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Timeline                                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  HOJE                                                             │
│  ●───────────────────────────────────────────────────────────   │
│  │  ✓ Orçamento Aprovado                      14:35             │
│  │  Cliente aprovou orçamento via WhatsApp                      │
│  │  Por: João Silva                                              │
│  │  [Ver detalhes ▼]                                            │
│  │                                                               │
│  ●───────────────────────────────────────────────────────────   │
│  │  ✏️ OS Editada                              09:12             │
│  │  Prazo de entrega alterado de 20/01 para 25/01              │
│  │  Por: Maria Santos                                            │
│  │                                                               │
│  ONTEM                                                            │
│  ●───────────────────────────────────────────────────────────   │
│  │  🔀 Workflow Atualizado                     16:45             │
│  │  Cabecote: Metrologia → Usinagem                            │
│  │  Por: Carlos Técnico                                          │
│  │                                                               │
│  15/01/2025                                                       │
│  ●───────────────────────────────────────────────────────────   │
│  │  ➕ OS Criada                                10:00             │
│  │  Ordem #1234 criada                                           │
│  │  Por: Ana Consultora                                          │
│  │                                                               │
│                                       [Carregar Mais Eventos]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Test Scenarios

### E2E Test 1: Visualização de Timeline
```gherkin
Given que estou visualizando uma OS com 10 eventos
When clico na tab "Timeline"
Then vejo 10 eventos ordenados cronologicamente
And eventos estão agrupados por "Hoje", "Ontem" e datas
And cada evento mostra ícone, hora, usuário e descrição
```

### E2E Test 2: Expansão de Detalhes
```gherkin
Given que estou na timeline
When clico em "Ver detalhes" de um evento
Then metadata JSON é exibida em formato legível
```

### E2E Test 3: Paginação
```gherkin
Given que a OS tem 75 eventos
When rolo até o final da lista
And clico em "Carregar Mais"
Then próximos 50 eventos são carregados
And botão desaparece se não houver mais eventos
```

---

## 🚫 Negative Scope

**Não inclui:**
- Edição de eventos do histórico
- Exclusão de eventos
- Filtros por tipo de evento
- Exportação de timeline

---

## 🔗 Dependencies

**Blocks:**
- Nenhuma

**Blocked by:**
- US-OS-001 (Criar OS)
- US-OS-004 (Visualizar detalhes)

---

**Última atualização:** 2025-01-27  
**Versão:** 1.0
