# Dashboard - Arquitetura de Componentes

## 🏗️ Visão Geral da Arquitetura

O módulo Dashboard segue uma arquitetura baseada em componentes reutilizáveis, hooks personalizados e contextos globais, garantindo escalabilidade e manutenibilidade.

## 📦 Estrutura de Componentes

### Hierarquia Principal

<lov-mermaid>
graph TD
    A[Dashboard Page] --> B[StatCard Grid]
    A --> C[Main Content Grid]
    A --> D[Alert Section]
    
    B --> E[StatCard Component]
    C --> F[Recent Services]
    C --> G[Quick Actions]
    C --> H[Enhanced Insights]
    
    D --> I[Alert Cards]
    
    E --> J[Icon Component]
    E --> K[Value Display]
    E --> L[Trend Indicator]
    
    F --> M[Service List]
    F --> N[Status Badges]
    
    G --> O[Action Buttons]
    G --> P[Navigation Links]
    
    H --> Q[Charts]
    H --> R[Analytics]
    
    I --> S[Severity Icons]
    I --> T[Dismiss Actions]
</lov-mermaid>

## 🎯 Componentes Principais

### 1. Dashboard Container (`src/pages/Dashboard.tsx`)

**Responsabilidades**:
- Orquestração geral da página
- Gerenciamento de estado global
- Coordenação de data fetching
- Layout responsivo

**Props Interface**:
```typescript
interface DashboardProps {
  // Não recebe props - página principal
}
```

**Estado Interno**:
```typescript
interface DashboardState {
  kpis: KPI[]
  alerts: DashboardAlert[]
  recentServices: RecentService[]
  loading: boolean
  error: string | null
}
```

**Hooks Utilizados**:
- `useSEO()` - SEO management
- `useBreakpoint()` - Responsive detection
- `useDashboard()` - Data management

### 2. StatCard Component (`src/components/StatCard.tsx`)

**Responsabilidades**:
- Exibição de KPIs individuais
- Formatação de valores
- Indicadores visuais de tendência
- Interações hover/click

**Props Interface**:
```typescript
interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  variant?: 'default' | 'primary' | 'warning' | 'success' | 'destructive'
  loading?: boolean
  onClick?: () => void
}
```

**Variantes Visuais**:
- **Default**: Cor neutra, uso geral
- **Primary**: Cor principal, KPIs importantes
- **Warning**: Amarelo, indicadores de atenção
- **Success**: Verde, métricas positivas
- **Destructive**: Vermelho, alertas críticos

### 3. QuickActions Component (`src/components/QuickActions.tsx`)

**Responsabilidades**:
- Exibição de ações configuráveis
- Navegação rápida para módulos
- Integração com sistema de permissões

**Props Interface**:
```typescript
interface QuickActionsProps {
  actions: QuickAction[]
  loading?: boolean
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  color: string
  link: string
  permission?: string
}
```

### 4. EnhancedInsights Component (`src/components/EnhancedInsights.tsx`)

**Responsabilidades**:
- Analytics avançados
- Visualizações gráficas
- Tendências e projeções

**Props Interface**:
```typescript
interface EnhancedInsightsProps {
  data: InsightData[]
  loading?: boolean
  period?: 'day' | 'week' | 'month' | 'year'
}
```

## 🔧 Hooks Personalizados

### 1. useDashboard Hook (`src/hooks/useDashboard.ts`)

**Propósito**: Gerenciamento centralizado de dados do dashboard

**API**:
```typescript
interface UseDashboardReturn {
  // Data
  kpis: KPI[]
  alerts: DashboardAlert[]
  recentServices: RecentService[]
  quickActions: QuickAction[]
  statusConfigs: StatusConfig[]
  
  // States
  loading: boolean
  error: string | null
  
  // Actions
  fetchDashboardData: () => Promise<void>
  dismissAlert: (alertId: string) => Promise<void>
  getStatusBadge: (entityType: string, statusKey: string) => string
  getStatusLabel: (entityType: string, statusKey: string) => string
  
  // Utils
  refetch: () => void
}
```

**Funcionalidades**:
- **Data Fetching**: Busca paralela de dados múltiplos
- **KPI Calculation**: Cálculo dinâmico de valores
- **Alert Management**: Gerenciamento de alertas
- **Status Mapping**: Mapeamento de status para badges

### 2. useBreakpoint Hook (`src/hooks/useBreakpoint.tsx`)

**Propósito**: Detecção responsiva para adaptação de layout

**API**:
```typescript
interface UseBreakpointReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  breakpoint: 'mobile' | 'tablet' | 'desktop'
}
```

## 🎨 Sistema de Design

### Tokens de Design

**Cores Semânticas** (definidas em `src/index.css`):
```css
:root {
  /* KPI Variants */
  --kpi-primary: hsl(var(--primary))
  --kpi-warning: hsl(var(--warning))
  --kpi-success: hsl(var(--success))
  --kpi-destructive: hsl(var(--destructive))
  
  /* Alert Severities */
  --alert-info: hsl(var(--info))
  --alert-warning: hsl(var(--warning))
  --alert-error: hsl(var(--destructive))
  --alert-success: hsl(var(--success))
  
  /* Dashboard Specific */
  --dashboard-background: hsl(var(--background))
  --dashboard-card-background: hsl(var(--card))
}
```

### Variantes de Componentes

**StatCard Variants** (configuradas via `class-variance-authority`):
```typescript
const statCardVariants = cva(
  "rounded-lg border p-6 shadow-sm transition-all hover:shadow-md",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        primary: "bg-primary/10 text-primary border-primary/20",
        warning: "bg-warning/10 text-warning border-warning/20",
        success: "bg-success/10 text-success border-success/20",
        destructive: "bg-destructive/10 text-destructive border-destructive/20"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)
```

## 📱 Responsividade

### Grid System

**Desktop Layout** (>= 1024px):
```css
.dashboard-stats-grid {
  @apply grid grid-cols-4 gap-6;
}

.dashboard-main-grid {
  @apply grid grid-cols-3 gap-6;
}
```

**Tablet Layout** (768px - 1023px):
```css
.dashboard-stats-grid {
  @apply grid grid-cols-2 gap-4;
}

.dashboard-main-grid {
  @apply grid grid-cols-2 gap-4;
}
```

**Mobile Layout** (< 768px):
```css
.dashboard-stats-grid {
  @apply grid grid-cols-1 gap-4;
}

.dashboard-main-grid {
  @apply grid grid-cols-1 gap-4;
}
```

### Breakpoint Logic

**Component-level Adaptation**:
```typescript
const getGridColumns = (breakpoint: string) => {
  switch (breakpoint) {
    case 'mobile':
      return 'grid-cols-1'
    case 'tablet':
      return 'grid-cols-2'
    case 'desktop':
      return 'grid-cols-4'
    default:
      return 'grid-cols-1'
  }
}
```

## 🔄 Gestão de Estado

### Estado Local vs Global

**Estado Local** (useState):
- UI states (loading, hover, focus)
- Form inputs temporários
- Animação states

**Estado Global** (Context/Hooks):
- User authentication
- Organization context
- Dashboard data cache

### Data Flow

<lov-mermaid>
sequenceDiagram
    participant Page as Dashboard Page
    participant Hook as useDashboard
    participant API as Supabase Client
    participant DB as Database
    
    Page->>Hook: useEffect mount
    Hook->>API: fetchDashboardData()
    
    par Parallel Requests
        API->>DB: SELECT kpis
        API->>DB: SELECT alerts  
        API->>DB: SELECT quick_actions
        API->>DB: SELECT recent_services
    end
    
    DB-->>API: Return data
    API-->>Hook: Processed data
    Hook-->>Page: State update
    Page->>Page: Re-render components
    
    Note over Page,DB: Total time ~800ms
</lov-mermaid>

## 🚀 Performance

### Otimizações Implementadas

**1. Memoization**:
```typescript
const StatCard = memo(({ title, value, icon, variant }: StatCardProps) => {
  const IconComponent = useMemo(() => getIconComponent(icon), [icon])
  
  return (
    <Card className={statCardVariants({ variant })}>
      {/* Component JSX */}
    </Card>
  )
})
```

**2. Virtual Scrolling** (para listas grandes):
```typescript
const VirtualizedServiceList = () => {
  return (
    <FixedSizeList
      height={400}
      itemCount={services.length}
      itemSize={60}
      itemData={services}
    >
      {ServiceItem}
    </FixedSizeList>
  )
}
```

**3. Lazy Loading**:
```typescript
const EnhancedInsights = lazy(() => import('./EnhancedInsights'))

// No Dashboard component
<Suspense fallback={<InsightsSkeleton />}>
  <EnhancedInsights data={insightsData} />
</Suspense>
```

### Bundle Analysis

**Principais Dependências**:
- React (18.3.1): ~42KB gzipped
- Framer Motion (12.23.6): ~28KB gzipped
- Recharts (2.12.7): ~156KB gzipped
- Lucide React (0.462.0): ~15KB (tree-shaken)

**Otimizações de Bundle**:
- Tree-shaking automático
- Code splitting por rota
- Dynamic imports para componentes pesados

## 🧪 Testes

### Estratégia de Testes

**Unit Tests**:
```typescript
describe('StatCard Component', () => {
  it('renders with correct variant styles', () => {
    render(<StatCard variant="primary" title="Test" value="100" />)
    expect(screen.getByRole('article')).toHaveClass('bg-primary/10')
  })
  
  it('handles loading state correctly', () => {
    render(<StatCard loading title="Test" value="100" />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
```

**Integration Tests**:
```typescript
describe('Dashboard Integration', () => {
  it('fetches and displays KPI data correctly', async () => {
    const mockKPIs = [
      { id: '1', title: 'Orders', value: 150, variant: 'primary' }
    ]
    
    jest.spyOn(api, 'fetchKPIs').mockResolvedValue(mockKPIs)
    
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Orders')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
    })
  })
})
```

### Mocking Strategy

**Supabase Mocking**:
```typescript
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: mockData }))
        }))
      }))
    }))
  }
}))
```

## 📊 Monitoramento

### Métricas de Component Performance

**Core Web Vitals**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**Custom Metrics**:
```typescript
// Performance tracking
const trackComponentRender = (componentName: string) => {
  performance.mark(`${componentName}-start`)
  
  useEffect(() => {
    performance.mark(`${componentName}-end`)
    performance.measure(
      `${componentName}-render`,
      `${componentName}-start`,
      `${componentName}-end`
    )
  })
}
```

### Error Boundaries

```typescript
class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('Dashboard Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <DashboardErrorFallback error={this.state.error} />
    }
    
    return this.props.children
  }
}
```

## 🔧 Configuração e Customização

### Environment Variables

```env
# Dashboard Configuration
REACT_APP_DASHBOARD_REFRESH_INTERVAL=30000
REACT_APP_ENABLE_REALTIME_UPDATES=true
REACT_APP_MAX_ALERTS_DISPLAY=10
REACT_APP_KPI_ANIMATION_DURATION=400

# Performance
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_BUNDLE_ANALYZER=false
```

### Feature Flags

```typescript
interface FeatureFlags {
  enableRealtimeUpdates: boolean
  showAdvancedInsights: boolean
  enableVoiceCommands: boolean
  betaFeatures: boolean
}

const useFeatureFlags = (): FeatureFlags => {
  return {
    enableRealtimeUpdates: true,
    showAdvancedInsights: true,
    enableVoiceCommands: false,
    betaFeatures: false
  }
}
```

---

**Documentação atualizada**: 2024-12-09
**Versão**: 2.1.0
**Próxima revisão**: 2025-01-09