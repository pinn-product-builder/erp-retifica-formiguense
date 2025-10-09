# Dashboard Principal - Wireframe

## 🎯 Visão Geral

Interface principal do dashboard que apresenta KPIs, alertas, ações rápidas e insights de desempenho em um layout responsivo e intuitivo.

## 🖥️ Layout Desktop

```mermaid
graph TB
    subgraph Header["Header - Full Width"]
        H1[Logo + Organization Selector]
        H2[Global Search]
        H3[Notifications + User Menu]
    end
    
    subgraph MainContent["Main Content - 4 Columns Grid"]
        subgraph Col1["Column 1 - KPIs"]
            K1[KPI Card: Ordens Ativas]
            K2[KPI Card: Taxa Conclusão]
            K3[KPI Card: Tempo Médio]
            K4[KPI Card: Faturamento]
        end
        
        subgraph Col2["Column 2 - KPIs"]
            K5[KPI Card: Produtividade]
            K6[KPI Card: Satisfação]
            K7[KPI Card: Estoque Crítico]
            K8[KPI Card: Compras Pendentes]
        end
        
        subgraph Col3["Column 3 - Alerts & Actions"]
            A1[Alerts Dashboard<br/>Lista de alertas críticos]
            A2[Quick Actions<br/>Botões de ação rápida]
        end
        
        subgraph Col4["Column 4 - Insights"]
            I1[Performance Insights<br/>Análise de desempenho]
            I2[Recent Activity<br/>Atividades recentes]
        end
    end
    
    subgraph Tabs["Tabs Section - Full Width"]
        T1[Dashboard Tab]
        T2[Performance Tab]
        T3[Gamification Tab]
        T4[Purchases Tab]
    end
    
    Header --> MainContent
    MainContent --> Tabs
    
    style Header fill:#e3f2fd
    style Col1 fill:#f1f8e9
    style Col2 fill:#f1f8e9
    style Col3 fill:#fff3e0
    style Col4 fill:#fce4ec
    style Tabs fill:#e8eaf6
```

### Especificações Desktop
- **Grid**: 4 colunas (repeat(4, 1fr))
- **Gap**: 24px entre cards
- **Max Width**: 1920px (centralizado)
- **Padding**: 32px

## 📱 Layout Tablet (768px - 1024px)

```mermaid
graph TB
    subgraph HeaderT["Header"]
        HT1[Logo + Org Selector + Search]
        HT2[Notifications + Menu]
    end
    
    subgraph MainT["Main Content - 2 Columns"]
        subgraph ColT1["Column 1"]
            KT1[KPI Cards<br/>2 columns grid]
        end
        
        subgraph ColT2["Column 2"]
            AT1[Alerts Dashboard]
            AT2[Quick Actions]
        end
        
        IT1[Performance Insights<br/>Full Width]
    end
    
    subgraph TabsT["Tabs"]
        TT1[Horizontal Tabs]
    end
    
    HeaderT --> MainT
    MainT --> TabsT
    
    style HeaderT fill:#e3f2fd
    style ColT1 fill:#f1f8e9
    style ColT2 fill:#fff3e0
    style IT1 fill:#fce4ec
```

### Especificações Tablet
- **Grid KPIs**: 2 colunas (repeat(2, 1fr))
- **Gap**: 16px
- **Padding**: 24px
- **Alerts**: Stack verticalmente

## 📱 Layout Mobile (< 768px)

```mermaid
graph TB
    subgraph HeaderM["Header - Collapsed"]
        HM1[Hamburger Menu]
        HM2[Logo]
        HM3[Notifications]
    end
    
    subgraph MainM["Main Content - 1 Column"]
        KM1[KPI Cards<br/>Horizontal Scroll]
        AM1[Alerts Dashboard<br/>Collapsible]
        QM1[Quick Actions<br/>Grid 2x2]
        IM1[Performance Insights<br/>Accordion]
    end
    
    subgraph TabsM["Bottom Navigation"]
        TM1[Dashboard]
        TM2[Performance]
        TM3[Gamification]
        TM4[More]
    end
    
    HeaderM --> MainM
    MainM --> TabsM
    
    style HeaderM fill:#e3f2fd
    style MainM fill:#f1f8e9
    style TabsM fill:#e8eaf6
```

### Especificações Mobile
- **Grid**: 1 coluna (100%)
- **KPIs**: Horizontal scroll (snap)
- **Gap**: 12px
- **Padding**: 16px
- **Navigation**: Bottom tab bar (fixed)

## 🧩 Componentes Principais

### 1. EnhancedStatCard
**Props**:
- `title: string`
- `value: number | string`
- `trend: { value: number, direction: 'up' | 'down' | 'stable' }`
- `icon: LucideIcon`
- `variant: 'default' | 'success' | 'warning' | 'error'`

**Estados**:
- Loading: Skeleton placeholder
- Loaded: Valor + trend + sparkline
- Error: Mensagem de erro
- Empty: Placeholder "Sem dados"

### 2. AlertsDashboard
**Layout**:
- Header: "Alertas" + contador
- Lista: Máximo 5 alertas visíveis
- Footer: "Ver todos" (link)

**Tipos de Alerta**:
- 🔴 Critical (error)
- 🟡 Warning (warning)
- 🔵 Info (info)
- 🟢 Success (success)

### 3. DynamicQuickActions
**Grid**: 2x2 (mobile) / 3x2 (tablet) / 4x2 (desktop)

**Ações Comuns**:
- Nova Ordem de Serviço
- Novo Orçamento
- Registrar Entrada
- Ver Workflow

### 4. PerformanceInsights
**Seções**:
- Visão Geral (gauge charts)
- Análise de Tendências (line chart)
- Top Performers (ranking)
- Recomendações (list)

## 📊 Estados da Interface

### Loading State
```mermaid
graph LR
    A[Page Load] --> B[Skeleton KPI Cards<br/>Shimmer effect]
    B --> C[Skeleton Alerts]
    C --> D[Skeleton Charts]
    D --> E[Data Loaded<br/>Fade in animation]
    
    style A fill:#e3f2fd
    style E fill:#c8e6c9
```

**Elementos**:
- Skeleton cards com animação shimmer
- Spinners para gráficos
- Duração: 300ms fade-in

### Error State
```mermaid
graph TB
    A[Error Detected] --> B{Error Type}
    B -->|Network| C[Network Error Message<br/>Retry button]
    B -->|Auth| D[Auth Error<br/>Redirect to login]
    B -->|Data| E[Data Error<br/>Partial render]
    
    style A fill:#ffebee
    style C fill:#fff3e0
    style D fill:#fce4ec
    style E fill:#fff3e0
```

**Comportamento**:
- Toast notification para erros gerais
- Inline error para componentes específicos
- Retry button com exponential backoff

### Empty State
```mermaid
graph TB
    A[No Data Available] --> B[Empty State Illustration]
    B --> C[Mensagem Descritiva]
    C --> D[Call to Action Button]
    
    style A fill:#f5f5f5
    style B fill:#e0e0e0
    style C fill:#e0e0e0
    style D fill:#64b5f6
```

**Elementos**:
- Ilustração SVG
- Título: "Nenhum dado disponível"
- Descrição contextual
- CTA para criar primeiro item

## ♿ Acessibilidade

### WCAG 2.1 - Nível AA
- ✅ Contraste mínimo 4.5:1 para texto
- ✅ Contraste 3:1 para elementos UI
- ✅ Labels em todos os inputs
- ✅ ARIA roles adequados
- ✅ Navegação por teclado
- ✅ Focus indicators visíveis
- ✅ Screen reader support

### Semantic HTML
```html
<header role="banner">
  <nav role="navigation" aria-label="Main">
  </nav>
</header>

<main role="main">
  <section aria-labelledby="kpis-heading">
    <h2 id="kpis-heading">Indicadores</h2>
  </section>
</main>
```

## 📱 Responsividade

### Breakpoints
```css
/* Mobile First */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    padding: 32px;
  }
}
```

### Touch Targets
- Mínimo: 44x44px (iOS) / 48x48px (Android)
- Espaçamento entre botões: 8px
- Swipe gestures para tabs (mobile)

## 🎨 Interações

### Animações
- **Page Load**: Fade in + slide up (300ms)
- **Card Hover**: Scale 1.02 + shadow (150ms)
- **Tab Change**: Fade in/out (200ms)
- **Data Update**: Pulse effect (500ms)

### Transições
```css
.stat-card {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## 🔗 Links Relacionados

- [User Journey](../user-flows/dashboard-user-journey.md)
- [Component Architecture](../technical-specs/component-architecture.md)
- [Tabs System](./tabs-interfaces.md)

---

*Última atualização: 2025-10-09*
