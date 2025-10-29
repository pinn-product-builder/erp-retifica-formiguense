# Componente OrderSelect

## 📋 Visão Geral

O componente `OrderSelect` é um seletor especializado para ordens de serviço que permite buscar e selecionar ordens com orçamento aprovado.

## 🎯 Funcionalidades

### Filtros Implementados
- **Orçamento Aprovado**: Filtro opcional por orçamento com status `aprovado` (controlado por parâmetro)
- **Busca por Texto**: Filtro por número da OS, nome do cliente, marca ou modelo do motor
- **Multi-tenancy**: Filtro automático por organização do usuário

### Interface
- **Modal de Seleção**: Interface intuitiva com busca em tempo real
- **Preview da Ordem**: Exibe informações do cliente e motor selecionado
- **Feedback Visual**: Estados de carregamento e mensagens informativas

## 🔧 Implementação Técnica

### Camada de Service
O componente utiliza o `OrderService` para todas as operações de busca:

```typescript
// Service centralizado para operações de ordens
export class OrderService {
  static async searchOrders(params: OrderSearchParams): Promise<OrderSearchResult>
  static async getOrderById(orderId: string, orgId: string): Promise<OrderWithDetails | null>
  static async getOrdersWithApprovedBudget(orgId: string): Promise<OrderSearchResult>
}
```

### Query de Dados com Relações
```typescript
// Query completa com relações de orçamento e aprovações
const query = supabase
  .from('orders')
  .select(`
    id,
    order_number,
    created_at,
    status,
    customer:customers(name),
    engine:engines(brand, model, type),
    detailed_budgets(
      id,
      budget_number,
      status,
      total_amount,
      created_at,
      budget_approvals(
        id,
        approval_type,
        approved_amount,
        approved_at,
        approved_by_customer,
        customer_signature
      )
    )
  `)
  .eq('org_id', orgId);

// Filtro condicional por status do orçamento
if (budgetStatus) {
  query = query.eq('detailed_budgets.status', budgetStatus);
}
```

### Paginação Implementada
- **Limite**: 20 ordens por página
- **Navegação**: Botões anterior/próxima
- **Contador**: Exibe página atual e total
- **Reset**: Volta para página 1 ao buscar

## 📊 Estados do Orçamento

O componente filtra pelos seguintes status de orçamento:
- ✅ **aprovado**: Orçamento totalmente aprovado pelo cliente
- ❌ **pendente**: Orçamento aguardando aprovação
- ❌ **reprovado**: Orçamento rejeitado pelo cliente
- ❌ **em_producao**: Orçamento em execução

## 🎨 Interface do Usuário

### Placeholder Padrão
```
// Sem filtro: "Selecionar Ordem"
// Com filtro: "Selecionar Ordem com Orçamento Aprovado"
```

### Campo de Busca
```
// Sem filtro: "Buscar por número da OS, cliente, marca..."
// Com filtro: "Buscar por número da OS, cliente, marca... (apenas com orçamento aprovado)"
```

### Mensagem de Estado Vazio
```
// Sem filtro: "Nenhuma ordem encontrada"
// Com filtro: "Nenhuma ordem com orçamento aprovado encontrada"
// Com filtro: "Apenas ordens com orçamento aprovado são exibidas"
```

## 🔄 Fluxo de Uso

1. **Abertura do Modal**: Carrega automaticamente ordens (com ou sem filtro por orçamento)
2. **Busca**: Filtro em tempo real por texto
3. **Seleção**: Clique na ordem desejada
4. **Confirmação**: Toast de sucesso e fechamento do modal
5. **Preview**: Exibição da ordem selecionada com opção de alterar

## 🛡️ Segurança

### Row Level Security (RLS)
- Acesso restrito por organização
- Validação de permissões do usuário
- Filtro automático por `org_id`

### Validações
- Verificação de organização ativa
- Tratamento de erros de conexão
- Fallback para estados de erro

## 📝 Props da Interface

```typescript
interface OrderSelectProps {
  value?: string;                    // ID da ordem selecionada
  onValueChange: (orderId: string, order?: Order) => void;
  placeholder?: string;              // Texto do placeholder
  label?: string;                   // Label do campo
  required?: boolean;               // Campo obrigatório
  disabled?: boolean;               // Campo desabilitado
  className?: string;               // Classes CSS adicionais
  filterByApprovedBudget?: boolean; // Filtro por orçamento aprovado (padrão: false)
}
```

## 💡 Exemplos de Uso

### Uso Básico (Sem Filtro)
```tsx
<OrderSelect
  value={selectedOrderId}
  onValueChange={(orderId, order) => {
    setSelectedOrderId(orderId);
    console.log('Ordem selecionada:', order);
  }}
  placeholder="Selecionar Ordem de Serviço"
  label="Ordem"
/>
```

### Uso com Filtro por Orçamento Aprovado
```tsx
<OrderSelect
  value={selectedOrderId}
  onValueChange={(orderId, order) => {
    setSelectedOrderId(orderId);
    console.log('Ordem com orçamento aprovado:', order);
  }}
  filterByApprovedBudget={true}
  placeholder="Selecionar Ordem com Orçamento Aprovado"
  label="Ordem Aprovada"
  required={true}
/>
```

## 🔗 Integrações

### Tabelas Relacionadas
- `orders`: Dados da ordem de serviço
- `customers`: Informações do cliente
- `engines`: Dados do motor
- `detailed_budgets`: Orçamentos detalhados com status
- `budget_approvals`: Aprovações específicas dos orçamentos

### Hooks Utilizados
- `useOrganization`: Contexto da organização
- `useToast`: Feedback visual para o usuário

## 🚀 Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Filtro por período de criação
- [ ] Ordenação por diferentes critérios
- [ ] Cache de resultados para performance
- [ ] Paginação para grandes volumes
- [ ] Filtro por status da ordem
- [ ] Integração com sistema de alertas

### Otimizações
- [ ] Lazy loading de dados
- [ ] Debounce na busca
- [ ] Memoização de componentes
- [ ] Virtualização de lista

## 📋 Changelog

### v1.3.0 (Atual)
- ✅ Camada de service `OrderService` implementada
- ✅ Paginação completa com navegação e contadores
- ✅ Query com relações completas de orçamento e aprovações
- ✅ Busca otimizada com filtros de texto no banco
- ✅ Performance melhorada com limite de 20 itens por página

### v1.2.0 (Anterior)
- ✅ Parâmetro `filterByApprovedBudget` adicionado para controle opcional do filtro
- ✅ Interface condicional baseada no parâmetro
- ✅ Queries otimizadas com campos condicionais
- ✅ Compatibilidade mantida com implementações existentes

### v1.1.0 (Anterior)
- ✅ Filtro por orçamento aprovado implementado
- ✅ Interface atualizada com mensagens específicas
- ✅ Query otimizada com inner join
- ✅ Validação de estados do orçamento

### v1.0.0 (Anterior)
- ✅ Componente base implementado
- ✅ Busca por texto funcional
- ✅ Modal de seleção
- ✅ Preview da ordem selecionada
