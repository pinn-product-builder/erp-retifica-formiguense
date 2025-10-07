# Troubleshooting: Metas não Aparecem no Dashboard

## 🐛 Problema Resolvido

**Sintoma:** Meta criada com sucesso no `GoalsManager`, mas não aparece no `PerformanceInsights`

---

## 🔍 Causas Identificadas e Soluções

### 1. **RLS Policies Muito Restritivas** ✅ RESOLVIDO

#### Problema:
- Policies antigas exigiam `kpi_id` NOT NULL
- Não suportavam metas customizadas
- Requeriam role `admin`

#### Solução:
```sql
-- Policies atualizadas para permitir:
- kpi_id NULL (metas customizadas)
- Todos os usuários da organização (não apenas admins)
- Verificação por organization_users
```

**Migration:** `fix_kpi_targets_policies`

---

### 2. **Constraint NOT NULL em kpi_id** ✅ RESOLVIDO

#### Problema:
```
ERROR: null value in column "kpi_id" violates not-null constraint
```

#### Solução:
```sql
ALTER TABLE public.kpi_targets 
  ALTER COLUMN kpi_id DROP NOT NULL;
```

**Migration:** `allow_null_kpi_id`

---

### 3. **Falta de WebSocket para Atualização em Tempo Real** ✅ RESOLVIDO

#### Problema:
- `PerformanceInsights` não recarregava após criar meta
- Necessário refresh manual da página

#### Solução:
```typescript
// Adicionado WebSocket no useEffect
const channel = supabase
  .channel(`performance-goals-${currentOrganization.id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'kpi_targets',
    filter: `org_id=eq.${currentOrganization.id}`
  }, (payload) => {
    // Recarregar apenas as metas
    fetchGoals().then(goalsData => setGoals(goalsData));
  })
  .subscribe();
```

---

## ✅ Checklist de Verificação

Quando uma meta não aparece, verificar:

- [ ] **RLS Policies**: Usuário tem permissão?
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'kpi_targets';
  ```

- [ ] **Meta foi criada?**
  ```sql
  SELECT * FROM kpi_targets 
  WHERE org_id = 'YOUR_ORG_ID' 
  ORDER BY created_at DESC 
  LIMIT 5;
  ```

- [ ] **org_id correto?**
  - Verificar se a meta tem o mesmo `org_id` do usuário logado

- [ ] **WebSocket conectado?**
  - Verificar console: `"Performance goals WebSocket status: SUBSCRIBED"`

- [ ] **Filtros corretos no fetch?**
  ```typescript
  .eq('org_id', currentOrganization.id)
  .order('priority', { ascending: false })
  .limit(3)
  ```

---

## 🔄 Fluxo Completo

```
1. Usuário cria meta no GoalsManager
   ↓
2. INSERT na tabela kpi_targets
   ↓
3. RLS Policy verifica permissão
   ↓
4. Trigger update_goal_status() calcula status
   ↓
5. WebSocket notifica mudança
   ↓
6. PerformanceInsights recebe evento
   ↓
7. fetchGoals() busca metas atualizadas
   ↓
8. setGoals() atualiza estado
   ↓
9. Componente re-renderiza
   ↓
10. Meta aparece no dashboard ✅
```

---

## 🎯 Estrutura de Metas

### Campos Obrigatórios:
```typescript
{
  org_id: UUID,           // Organização
  goal_type: 'kpi' | 'custom' | 'project',
  target_value: number,   // Meta a atingir
  progress_unit: 'currency' | 'percentage' | 'number',
  target_period_end: date,
  priority: 'low' | 'medium' | 'high' | 'critical'
}
```

### Campos Opcionais:
```typescript
{
  kpi_id: UUID | null,           // NULL para metas customizadas
  description: string,
  progress_current: number,      // Default: 0
  status: string,                // Calculado por trigger
  milestones: JSONB,
  assigned_to: UUID[]
}
```

---

## 🚀 Performance

### Índices Criados:
```sql
CREATE INDEX idx_kpi_targets_org_id ON kpi_targets(org_id);
CREATE INDEX idx_kpi_targets_status ON kpi_targets(status);
CREATE INDEX idx_kpi_targets_priority ON kpi_targets(priority);
CREATE INDEX idx_kpi_targets_goal_type ON kpi_targets(goal_type);
```

### Query Otimizada:
```typescript
const { data: targets } = await supabase
  .from('kpi_targets')
  .select('*')
  .eq('org_id', currentOrganization.id)  // Usa índice
  .order('priority', { ascending: false }) // Usa índice
  .order('target_period_end', { ascending: true })
  .limit(3); // Limita resultado
```

---

## 📝 Logs de Debug

### Console do Frontend:
```javascript
// Sucesso na criação
"Meta criada com sucesso"

// WebSocket conectado
"Performance goals WebSocket status: SUBSCRIBED"

// Meta atualizada
"Meta atualizada: { eventType: 'INSERT', new: {...} }"
```

### Supabase Logs:
```sql
-- Verificar logs de INSERT
SELECT * FROM kpi_targets 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

---

## ✅ Status Atual

- [x] RLS Policies corrigidas
- [x] Constraint NOT NULL removida
- [x] WebSocket implementado
- [x] Metas aparecem em tempo real
- [x] Suporte a metas customizadas
- [x] Suporte a metas baseadas em KPI
- [x] Placeholders para manter layout

---

**Todas as correções foram aplicadas! Metas agora aparecem imediatamente após criação.** ✅
