# Sistema de Alertas de Necessidades de Compra

## Visão Geral

O sistema de alertas inteligentes do dashboard exibe alertas sobre necessidades de compra (`purchase_needs`) que são criados automaticamente quando:
1. Um orçamento é aprovado e há estoque insuficiente
2. O estoque de uma peça fica abaixo do mínimo configurado
3. Uma necessidade de compra é criada manualmente

## Como os Alertas são Registrados

### 1. Criação de Purchase Needs

Os `purchase_needs` são criados através de:

#### a) Aprovação de Orçamento (`fn_process_budget_approval`)
- **Quando**: Quando um orçamento é aprovado e há peças com estoque insuficiente
- **Trigger**: `budget_approvals` → `fn_process_budget_approval`
- **Localização**: `supabase/migrations/20251018000000_fix_duplicate_reservations_on_budget_approval.sql`

**Código relevante**:
```sql
-- Se não há estoque suficiente, criar necessidade de compra
INSERT INTO purchase_needs (
    org_id, part_code, part_name, required_quantity,
    available_quantity, priority_level, need_type,
    related_orders, estimated_cost, delivery_urgency_date, status
) VALUES (
    v_org_id, part_record.part_code, part_record.part_name,
    part_record.quantity - available_stock, available_stock,
    CASE WHEN (part_record.quantity - available_stock) > part_record.quantity * 0.5 
        THEN 'high' ELSE 'normal' END,
    'planned',
    jsonb_build_array((SELECT order_id FROM detailed_budgets WHERE id = NEW.budget_id)),
    part_record.unit_price * (part_record.quantity - available_stock),
    CURRENT_DATE + INTERVAL '7 days', 'pending'
)
ON CONFLICT (org_id, part_code, status) 
DO UPDATE SET
    required_quantity = purchase_needs.required_quantity + EXCLUDED.required_quantity,
    estimated_cost = purchase_needs.estimated_cost + EXCLUDED.estimated_cost,
    updated_at = NOW();
```

#### b) Estoque Mínimo (`check_stock_and_create_purchase_need`)
- **Quando**: Quando o estoque de uma peça fica abaixo do mínimo configurado
- **Trigger**: `parts_inventory` → `check_stock_and_create_purchase_need`
- **Localização**: `dump.sql` (linhas 1443-1498)

**Código relevante**:
```sql
-- Se encontrou config e tem auto-reorder
IF FOUND AND v_config.auto_reorder_enabled THEN
  -- Verificar se atingiu estoque mínimo
  IF NEW.quantity <= v_config.minimum_stock THEN
    INSERT INTO purchase_needs (
      org_id, part_code, part_name, required_quantity,
      available_quantity, priority_level, need_type,
      estimated_cost, status
    ) VALUES (
      NEW.org_id, NEW.part_code, NEW.part_name,
      v_config.economic_order_quantity, NEW.quantity,
      CASE 
        WHEN NEW.quantity = 0 THEN 'critical'
        WHEN NEW.quantity <= (v_config.minimum_stock * 0.5) THEN 'high'
        ELSE 'normal'
      END,
      'auto_reorder', 0, 'pending'
    )
    ON CONFLICT (org_id, part_code, status) DO UPDATE SET
      required_quantity = purchase_needs.required_quantity + EXCLUDED.required_quantity,
      updated_at = NOW();
  END IF;
END IF;
```

#### c) Geração Automática (`generate_purchase_needs_from_low_stock`)
- **Quando**: Função RPC chamada manualmente ou via trigger
- **Localização**: `supabase/migrations/20250117000004_implement_auto_purchase_needs.sql`

### 2. Criação de Alertas na Tabela `alerts`

**Trigger**: `purchase_needs` → `create_purchase_need_alert()`
**Localização**: `supabase/migrations/20251020000000_create_purchase_needs_alerts.sql`

#### Quando o Alerta é Criado:
- **INSERT**: Quando um novo `purchase_need` é criado com status `pending` ou `in_quotation`
- **UPDATE**: Quando um `purchase_need` existente é atualizado e:
  - O status mudou
  - A prioridade mudou
  - A quantidade necessária mudou
  - A quantidade disponível mudou

#### Quando o Alerta é Desativado:
- Quando o status do `purchase_need` muda para:
  - `completed`
  - `cancelled`
  - `ordered`

#### Estrutura do Alerta:
```json
{
  "org_id": "uuid",
  "alert_type": "purchase_need",
  "title": "Necessidade de Compra: [Nome da Peça]",
  "message": "Necessário comprar X unidades de [Nome] (Estoque atual: Y) - Urgência: DD/MM/YYYY",
  "severity": "error|warning|info", // baseado em priority_level
  "is_active": true,
  "is_dismissible": true,
  "action_label": "Ver Necessidades",
  "action_url": "/compras",
  "metadata": {
    "purchase_need_id": "uuid",
    "part_code": "string",
    "part_name": "string",
    "required_quantity": number,
    "available_quantity": number,
    "shortage_quantity": number,
    "priority_level": "critical|high|medium|normal",
    "need_type": "planned|auto_reorder|emergency",
    "status": "pending|in_quotation|ordered|completed|cancelled",
    "estimated_cost": number,
    "delivery_urgency_date": "date"
  },
  "expires_at": "timestamp" // delivery_urgency_date ou 30 dias
}
```

### 3. Mapeamento de Severidade

| Priority Level | Severity no Alerta |
|----------------|-------------------|
| `critical`     | `error`           |
| `high`         | `warning`         |
| `medium`       | `warning`         |
| `normal`       | `info`            |

## Fluxo Completo

```
1. EVENTO (Aprovação de Orçamento / Estoque Baixo / Geração Manual)
   ↓
2. Criação de purchase_need (INSERT)
   ↓
3. Trigger: trg_create_purchase_need_alert_insert
   ↓
4. Função: create_purchase_need_alert()
   ↓
5. INSERT ou UPDATE na tabela alerts
   ↓
6. Componente IntelligentAlerts busca alertas ativos
   ↓
7. Alerta exibido no Dashboard
```

## Atualização dos Alertas

### Quando o purchase_need é atualizado:
- Se o status mudou para `completed`, `cancelled` ou `ordered` → Alerta é desativado
- Se outros campos mudaram → Alerta é atualizado com novas informações

### Quando o purchase_need é resolvido:
- O usuário pode marcar a necessidade como resolvida
- O status muda para `completed` ou `ordered`
- O alerta é automaticamente desativado

## Verificação de Funcionamento

### Verificar se os triggers estão ativos:
```sql
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'purchase_needs';
```

### Verificar alertas criados:
```sql
SELECT 
    a.id,
    a.title,
    a.severity,
    a.is_active,
    a.created_at,
    a.metadata->>'purchase_need_id' as purchase_need_id,
    a.metadata->>'part_name' as part_name,
    a.metadata->>'priority_level' as priority_level
FROM alerts a
WHERE a.alert_type = 'purchase_need'
  AND a.is_active = true
ORDER BY a.created_at DESC;
```

### Verificar purchase_needs pendentes:
```sql
SELECT 
    id,
    part_code,
    part_name,
    required_quantity,
    available_quantity,
    priority_level,
    status,
    created_at
FROM purchase_needs
WHERE status IN ('pending', 'in_quotation')
ORDER BY 
    CASE priority_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    created_at DESC;
```

### Verificar se purchase_needs têm alertas correspondentes:
```sql
SELECT 
    pn.id as purchase_need_id,
    pn.part_name,
    pn.priority_level,
    pn.status as purchase_need_status,
    a.id as alert_id,
    a.is_active as alert_active,
    a.severity
FROM purchase_needs pn
LEFT JOIN alerts a ON (
    a.alert_type = 'purchase_need'
    AND a.metadata->>'purchase_need_id' = pn.id::TEXT
    AND a.org_id = pn.org_id
)
WHERE pn.status IN ('pending', 'in_quotation')
ORDER BY 
    CASE pn.priority_level
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    pn.created_at DESC;
```

## Criação Retroativa de Alertas

Se houver `purchase_needs` existentes que não têm alertas correspondentes (criados antes da instalação dos triggers), você pode criar alertas retroativamente executando:

```sql
-- Criar alertas retroativos para purchase_needs existentes sem alertas
INSERT INTO alerts (
    org_id, alert_type, title, message, severity,
    is_active, is_dismissible, action_label, action_url,
    metadata, expires_at
)
SELECT 
    pn.org_id,
    'purchase_need',
    'Necessidade de Compra: ' || pn.part_name,
    'Necessário comprar ' || pn.required_quantity || ' unidades de ' || pn.part_name ||
    CASE 
        WHEN pn.available_quantity > 0 THEN ' (Estoque atual: ' || pn.available_quantity || ')'
        ELSE ' (Estoque esgotado)'
    END ||
    CASE 
        WHEN pn.delivery_urgency_date IS NOT NULL THEN ' - Urgência: ' || TO_CHAR(pn.delivery_urgency_date, 'DD/MM/YYYY')
        ELSE ''
    END,
    CASE pn.priority_level
        WHEN 'critical' THEN 'error'
        WHEN 'high' THEN 'warning'
        WHEN 'medium' THEN 'warning'
        ELSE 'info'
    END,
    true, true, 'Ver Necessidades', '/compras',
    jsonb_build_object(
        'purchase_need_id', pn.id,
        'part_code', pn.part_code,
        'part_name', pn.part_name,
        'required_quantity', pn.required_quantity,
        'available_quantity', pn.available_quantity,
        'shortage_quantity', pn.shortage_quantity,
        'priority_level', pn.priority_level,
        'need_type', pn.need_type,
        'status', pn.status,
        'estimated_cost', pn.estimated_cost,
        'delivery_urgency_date', pn.delivery_urgency_date
    ),
    CASE 
        WHEN pn.delivery_urgency_date IS NOT NULL THEN pn.delivery_urgency_date
        ELSE NOW() + INTERVAL '30 days'
    END
FROM purchase_needs pn
WHERE pn.status IN ('pending', 'in_quotation')
  AND NOT EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.alert_type = 'purchase_need'
        AND a.metadata->>'purchase_need_id' = pn.id::TEXT
        AND a.org_id = pn.org_id
        AND a.is_active = true
  );
```

## Troubleshooting

### Problema: Alertas não aparecem no dashboard
1. Verificar se os triggers estão ativos: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'purchase_needs';`
2. Verificar se há purchase_needs com status `pending` ou `in_quotation`
3. Verificar se os alertas foram criados na tabela `alerts`
4. Verificar se o componente `IntelligentAlerts` está buscando corretamente
5. Executar a criação retroativa se necessário

### Problema: Alertas não são atualizados
1. Verificar se o trigger `trg_create_purchase_need_alert_update` está ativo
2. Verificar se as condições do trigger estão corretas (status, priority_level, quantidades)
3. Verificar se o status do purchase_need está sendo atualizado corretamente
4. Verificar logs do banco de dados para erros na função

### Problema: Alertas não são desativados
1. Verificar se o status do purchase_need mudou para `completed`, `cancelled` ou `ordered`
2. Verificar se a função `create_purchase_need_alert()` está executando o UPDATE correto
3. Verificar se há políticas RLS bloqueando o UPDATE

### Problema: Função não tem permissão para inserir alertas
- A função usa `SECURITY DEFINER`, então deve ter permissões adequadas
- Verificar se a função está sendo executada corretamente: `SELECT * FROM pg_proc WHERE proname = 'create_purchase_need_alert';`
