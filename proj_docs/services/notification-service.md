# NotificationService

Serviço responsável por gerenciar notificações do sistema, incluindo criação, busca, marcação como lida e exclusão.

## Funcionalidades

### ✅ Implementadas

- **Busca de Notificações**: Busca notificações do usuário e globais da organização
- **Marcar como Lida**: Marca notificações individuais como lidas
- **Marcar Todas como Lidas**: Marca todas as notificações não lidas como lidas
- **Exclusão**: Remove notificações do sistema
- **Criação**: Cria novas notificações
- **Real-time Updates**: Subscription para atualizações em tempo real

## Interfaces

### Notification
```typescript
type Notification = Database['public']['Tables']['notifications']['Row'] & {
  notification_type?: Database['public']['Tables']['notification_types']['Row'];
};
```

### NotificationSearchParams
```typescript
interface NotificationSearchParams {
  orgId: string;
  userId?: string;
  includeGlobal?: boolean;
  limit?: number;
  offset?: number;
}
```

### NotificationSearchResult
```typescript
interface NotificationSearchResult {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}
```

## Métodos

### getNotifications(params)
Busca notificações com filtros e paginação.

**Parâmetros:**
- `orgId`: ID da organização
- `userId`: ID do usuário (opcional)
- `includeGlobal`: Incluir notificações globais (padrão: true)
- `limit`: Limite de resultados (padrão: 50)
- `offset`: Offset para paginação (padrão: 0)

**Retorno:**
- `notifications`: Lista de notificações
- `totalCount`: Total de notificações
- `unreadCount`: Contagem de não lidas

### markAsRead(notificationId, orgId)
Marca uma notificação específica como lida.

**Parâmetros:**
- `notificationId`: ID da notificação
- `orgId`: ID da organização

**Retorno:** `boolean` - Sucesso da operação

### markAllAsRead(orgId, userId?)
Marca todas as notificações não lidas como lidas.

**Parâmetros:**
- `orgId`: ID da organização
- `userId`: ID do usuário (opcional)

**Retorno:**
- `success`: Sucesso da operação
- `count`: Número de notificações marcadas

### deleteNotification(notificationId, orgId)
Exclui uma notificação.

**Parâmetros:**
- `notificationId`: ID da notificação
- `orgId`: ID da organização

**Retorno:** `boolean` - Sucesso da operação

### createNotification(notification)
Cria uma nova notificação.

**Parâmetros:**
```typescript
{
  orgId: string;
  userId?: string;
  notificationTypeId: string;
  title: string;
  message: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  isGlobal?: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}
```

**Retorno:** `Notification` - Notificação criada

### subscribeToNotifications(orgId, onNotificationChange)
Configura subscription para real-time updates.

**Parâmetros:**
- `orgId`: ID da organização
- `onNotificationChange`: Callback para mudanças

**Retorno:** Subscription object

## Políticas RLS

### ✅ Corrigidas

As políticas RLS foram atualizadas para permitir:

1. **UPDATE em Notificações Globais**: Usuários podem marcar notificações globais (`is_global = true`) como lidas
2. **UPDATE em Notificações Próprias**: Usuários podem marcar suas próprias notificações como lidas
3. **DELETE**: Usuários podem excluir notificações globais e próprias

### Políticas Implementadas

```sql
-- UPDATE
CREATE POLICY "Users can update notifications"
ON public.notifications
FOR UPDATE
USING (
  org_id IN (
    SELECT organization_users.organization_id
    FROM organization_users
    WHERE organization_users.user_id = auth.uid() 
    AND organization_users.is_active = true
  )
  AND (
    user_id = auth.uid() 
    OR is_global = true
  )
);

-- DELETE
CREATE POLICY "Users can delete notifications"
ON public.notifications
FOR DELETE
USING (
  org_id IN (
    SELECT organization_users.organization_id
    FROM organization_users
    WHERE organization_users.user_id = auth.uid() 
    AND organization_users.is_active = true
  )
  AND (
    user_id = auth.uid() 
    OR is_global = true
  )
);
```

## Uso no Hook

O hook `useNotifications` foi atualizado para usar o `NotificationService`:

```typescript
// Antes (diretamente com Supabase)
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);

// Depois (usando serviço)
await NotificationService.markAsRead(notificationId, currentOrganization.id);
```

## Benefícios

### ✅ Melhorias Implementadas

1. **Camada de Abstração**: Separação clara entre lógica de negócio e acesso ao banco
2. **Tratamento de Erros**: Centralizado e consistente
3. **Tipagem Forte**: Interfaces bem definidas
4. **Reutilização**: Métodos podem ser usados em diferentes contextos
5. **Testabilidade**: Mais fácil de testar e mockar
6. **Manutenibilidade**: Código mais organizado e fácil de manter

### 🔧 Problemas Resolvidos

1. **Notificações Globais**: Agora podem ser marcadas como lidas
2. **Políticas RLS**: Corrigidas para permitir UPDATE/DELETE em notificações globais
3. **Consistência**: Todas as operações passam pelo serviço
4. **Performance**: Queries otimizadas com filtros adequados

## Testes Realizados

### ✅ Validações

1. **Criação de Notificação**: ✅ Funcionando
2. **UPDATE em Notificação Global**: ✅ Funcionando
3. **Políticas RLS**: ✅ Funcionando corretamente
4. **Build do Projeto**: ✅ Sem erros
5. **Tipagem TypeScript**: ✅ Sem erros

## Próximos Passos

- [ ] Implementar testes unitários para o serviço
- [ ] Adicionar cache para melhorar performance
- [ ] Implementar notificações push (opcional)
- [ ] Adicionar filtros avançados (por tipo, severidade, etc.)
