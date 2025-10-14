# Dashboard - Integração de Dados e Supabase

## 🔗 Visão Geral da Integração

O módulo Dashboard integra-se diretamente com o Supabase para buscar, processar e exibir dados em tempo real. Esta integração abrange múltiplas tabelas e utiliza recursos avançados como RLS, triggers e edge functions.

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

<lov-mermaid>
erDiagram
    dashboard_kpis {
        uuid id PK
        uuid organization_id FK
        string code
        string title
        string description
        string icon
        string color
        string query_type
        text query_config
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    dashboard_alerts {
        uuid id PK
        uuid organization_id FK
        string title
        text message
        string severity
        string entity_type
        uuid entity_id
        boolean is_active
        timestamp created_at
        timestamp dismissed_at
    }
    
    dashboard_quick_actions {
        uuid id PK
        uuid organization_id FK
        string title
        string description
        string icon
        string color
        string link
        string permission
        integer sort_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    status_configs {
        uuid id PK
        uuid organization_id FK
        string entity_type
        string status_key
        string label
        string badge_variant
        string color
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    orders {
        uuid id PK
        uuid organization_id FK
        string order_number
        string status
        string priority
        uuid customer_id FK
        decimal total_value
        timestamp created_at
        timestamp updated_at
        timestamp completed_at
    }
    
    dashboard_kpis ||--|| organizations : belongs_to
    dashboard_alerts ||--|| organizations : belongs_to
    dashboard_quick_actions ||--|| organizations : belongs_to
    status_configs ||--|| organizations : belongs_to
    orders ||--|| organizations : belongs_to
</lov-mermaid>

### Estruturas de Dados TypeScript

```typescript
// KPI Configuration
interface KPI {
  id: string
  organization_id: string
  code: string
  title: string
  description: string
  icon: string
  color: string
  query_type: 'count' | 'sum' | 'avg' | 'custom'
  query_config: KPIQueryConfig
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Computed fields
  value?: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
}

interface KPIQueryConfig {
  table: string
  field?: string
  filters?: QueryFilter[]
  timeframe?: 'day' | 'week' | 'month' | 'year'
  comparison_period?: boolean
}

// Dashboard Alerts
interface DashboardAlert {
  id: string
  organization_id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  entity_type: string
  entity_id?: string
  is_active: boolean
  created_at: string
  dismissed_at?: string
}

// Quick Actions
interface QuickAction {
  id: string
  organization_id: string
  title: string
  description: string
  icon: string
  color: string
  link: string
  permission?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Status Configuration
interface StatusConfig {
  id: string
  organization_id: string
  entity_type: string
  status_key: string
  label: string
  badge_variant: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Recent Services
interface RecentService {
  id: string
  order_number: string
  status: string
  priority: string
  customer_name: string
  total_value: number
  created_at: string
  updated_at: string
  completed_at?: string
}
```

## 🔍 Queries e Data Fetching

### 1. KPI Data Fetching

```typescript
const fetchKPIs = async (organizationId: string): Promise<KPI[]> => {
  const { data: kpiConfigs, error } = await supabase
    .from('dashboard_kpis')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Calculate values for each KPI
  const kpisWithValues = await Promise.all(
    kpiConfigs.map(async (kpi) => ({
      ...kpi,
      value: await calculateKPIValue(kpi),
      change: await calculateKPIChange(kpi)
    }))
  )
  
  return kpisWithValues
}

const calculateKPIValue = async (kpi: KPI): Promise<number> => {
  const { query_type, query_config } = kpi
  
  switch (query_type) {
    case 'count':
      return await executeCountQuery(query_config)
    case 'sum':
      return await executeSumQuery(query_config)
    case 'avg':
      return await executeAvgQuery(query_config)
    case 'custom':
      return await executeCustomQuery(query_config)
    default:
      return 0
  }
}
```

### 2. Alerts Management

```typescript
const fetchActiveAlerts = async (organizationId: string): Promise<DashboardAlert[]> => {
  const { data, error } = await supabase
    .from('dashboard_alerts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) throw error
  return data || []
}

const dismissAlert = async (alertId: string): Promise<void> => {
  const { error } = await supabase
    .from('dashboard_alerts')
    .update({ 
      dismissed_at: new Date().toISOString(),
      is_active: false 
    })
    .eq('id', alertId)
  
  if (error) throw error
}
```

### 3. Recent Services Query

```typescript
const fetchRecentServices = async (organizationId: string): Promise<RecentService[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      priority,
      total_value,
      created_at,
      updated_at,
      completed_at,
      customers!inner(name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) throw error
  
  return data.map(order => ({
    ...order,
    customer_name: order.customers.name
  }))
}
```

## 🔄 Real-time Subscriptions

### WebSocket Integration

```typescript
const useRealtimeDashboard = (organizationId: string) => {
  const [alerts, setAlerts] = useState<DashboardAlert[]>([])
  const [orders, setOrders] = useState<RecentService[]>([])
  
  useEffect(() => {
    // Subscribe to alerts changes
    const alertsSubscription = supabase
      .channel('dashboard-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_alerts',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          handleAlertChange(payload)
        }
      )
      .subscribe()
    
    // Subscribe to orders changes
    const ordersSubscription = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          handleOrderChange(payload)
        }
      )
      .subscribe()
    
    return () => {
      alertsSubscription.unsubscribe()
      ordersSubscription.unsubscribe()
    }
  }, [organizationId])
  
  const handleAlertChange = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    switch (eventType) {
      case 'INSERT':
        setAlerts(prev => [newRecord, ...prev])
        break
      case 'UPDATE':
        setAlerts(prev => 
          prev.map(alert => 
            alert.id === newRecord.id ? newRecord : alert
          )
        )
        break
      case 'DELETE':
        setAlerts(prev => 
          prev.filter(alert => alert.id !== oldRecord.id)
        )
        break
    }
  }
  
  return { alerts, orders }
}
```

## 🛡️ Segurança e RLS (Row Level Security)

### Políticas RLS Implementadas

```sql
-- KPIs Policy
CREATE POLICY "Users can view organization KPIs" 
ON dashboard_kpis 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Alerts Policy
CREATE POLICY "Users can view organization alerts" 
ON dashboard_alerts 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can dismiss organization alerts" 
ON dashboard_alerts 
FOR UPDATE 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Quick Actions Policy
CREATE POLICY "Users can view organization quick actions" 
ON dashboard_quick_actions 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);
```

### Permission-based Filtering

```typescript
const fetchQuickActionsWithPermissions = async (
  organizationId: string,
  userPermissions: string[]
): Promise<QuickAction[]> => {
  const { data, error } = await supabase
    .from('dashboard_quick_actions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  
  if (error) throw error
  
  // Filter by user permissions
  return data.filter(action => 
    !action.permission || userPermissions.includes(action.permission)
  )
}
```

## ⚡ Performance e Otimização

### Caching Strategy

```typescript
// React Query integration
const useDashboardData = (organizationId: string) => {
  const queryClient = useQueryClient()
  
  const kpisQuery = useQuery({
    queryKey: ['dashboard', 'kpis', organizationId],
    queryFn: () => fetchKPIs(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
  
  const alertsQuery = useQuery({
    queryKey: ['dashboard', 'alerts', organizationId],
    queryFn: () => fetchActiveAlerts(organizationId),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  })
  
  // Invalidate cache on real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('dashboard-invalidation')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        queryClient.invalidateQueries(['dashboard'])
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [queryClient])
  
  return {
    kpis: kpisQuery.data || [],
    alerts: alertsQuery.data || [],
    isLoading: kpisQuery.isLoading || alertsQuery.isLoading,
    error: kpisQuery.error || alertsQuery.error
  }
}
```

### Database Optimization

```sql
-- Indexes for performance
CREATE INDEX idx_dashboard_kpis_org_active 
ON dashboard_kpis(organization_id, is_active) 
WHERE is_active = true;

CREATE INDEX idx_dashboard_alerts_org_active 
ON dashboard_alerts(organization_id, is_active, created_at) 
WHERE is_active = true AND dismissed_at IS NULL;

CREATE INDEX idx_orders_org_recent 
ON orders(organization_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Materialized view for complex KPIs
CREATE MATERIALIZED VIEW dashboard_kpi_values AS
SELECT 
  k.id,
  k.organization_id,
  k.code,
  CASE 
    WHEN k.query_type = 'count' THEN (
      SELECT COUNT(*) FROM orders o 
      WHERE o.organization_id = k.organization_id
    )
    WHEN k.query_type = 'sum' THEN (
      SELECT COALESCE(SUM(total_value), 0) FROM orders o 
      WHERE o.organization_id = k.organization_id
    )
  END as calculated_value,
  NOW() as calculated_at
FROM dashboard_kpis k
WHERE k.is_active = true;

-- Refresh materialized view every 5 minutes
CREATE OR REPLACE FUNCTION refresh_dashboard_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_kpi_values;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron extension)
SELECT cron.schedule('refresh-dashboard-kpis', '*/5 * * * *', 'SELECT refresh_dashboard_kpis();');
```

## 🔄 Data Transformation

### KPI Value Processing

```typescript
class KPIProcessor {
  static async processKPIValue(kpi: KPI): Promise<ProcessedKPI> {
    const rawValue = await this.calculateRawValue(kpi)
    const formattedValue = this.formatValue(rawValue, kpi.query_type)
    const change = await this.calculateChange(kpi, rawValue)
    const trend = this.determineTrend(change)
    
    return {
      ...kpi,
      value: formattedValue,
      rawValue,
      change,
      trend,
      lastUpdated: new Date().toISOString()
    }
  }
  
  static formatValue(value: number, type: string): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'count':
        return value.toString()
      default:
        return value.toLocaleString('pt-BR')
    }
  }
  
  static determineTrend(change: number): 'up' | 'down' | 'stable' {
    if (Math.abs(change) < 0.01) return 'stable'
    return change > 0 ? 'up' : 'down'
  }
}
```

## 🔧 Edge Functions

### Dashboard Data Aggregation

```typescript
// supabase/functions/dashboard-aggregation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { organizationId } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Parallel data fetching
    const [kpis, alerts, recentOrders, quickActions] = await Promise.all([
      fetchAndCalculateKPIs(supabase, organizationId),
      fetchActiveAlerts(supabase, organizationId),
      fetchRecentOrders(supabase, organizationId),
      fetchQuickActions(supabase, organizationId)
    ])
    
    const dashboardData = {
      kpis,
      alerts,
      recentOrders,
      quickActions,
      lastUpdated: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify(dashboardData),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
```

## 📊 Analytics e Monitoramento

### Data Usage Tracking

```typescript
const trackDashboardUsage = async (action: string, metadata?: any) => {
  await supabase
    .from('analytics_events')
    .insert({
      event_type: 'dashboard_interaction',
      action,
      metadata,
      user_id: auth.user?.id,
      organization_id: currentOrganization?.id,
      timestamp: new Date().toISOString()
    })
}

// Usage examples
trackDashboardUsage('kpi_clicked', { kpiId: 'revenue' })
trackDashboardUsage('alert_dismissed', { alertId, severity })
trackDashboardUsage('quick_action_executed', { actionId, targetModule })
```

### Performance Monitoring

```typescript
const monitorDashboardPerformance = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('dashboard')) {
        supabase
          .from('performance_metrics')
          .insert({
            metric_name: entry.name,
            value: entry.duration,
            timestamp: new Date().toISOString(),
            page: 'dashboard'
          })
      }
    })
  })
  
  observer.observe({ entryTypes: ['measure', 'navigation'] })
}
```

---

**Documentação atualizada**: 2024-12-09
**Versão**: 2.1.0
**Próxima revisão**: 2025-01-09