# Fase 1: Fundação e KPIs em Tempo Real - Especificações Detalhadas

## 🎯 Objetivos da Fase 1

### História 1: Visão Geral de KPIs em Tempo Real
**Como gestor de retífica, eu quero visualizar os principais indicadores de performance (KPIs) em tempo real para que eu possa tomar decisões rápidas baseadas em dados atualizados.**

## 📋 Tarefas Detalhadas

### 1. Backend - Sistema de Cálculo de KPIs

#### 1.1 Função de Cálculo Dinâmico
```sql
-- supabase/migrations/20241209000001_create_kpi_calculation_functions.sql
CREATE OR REPLACE FUNCTION calculate_kpi_value(
  kpi_code TEXT,
  org_id UUID,
  timeframe TEXT DEFAULT 'current'
) RETURNS NUMERIC AS $$
DECLARE
  result NUMERIC := 0;
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
BEGIN
  -- Definir período baseado no timeframe
  CASE timeframe
    WHEN 'current' THEN
      start_date := DATE_TRUNC('day', NOW());
      end_date := NOW();
    WHEN 'yesterday' THEN
      start_date := DATE_TRUNC('day', NOW() - INTERVAL '1 day');
      end_date := DATE_TRUNC('day', NOW());
    WHEN 'week' THEN
      start_date := DATE_TRUNC('week', NOW());
      end_date := NOW();
    WHEN 'month' THEN
      start_date := DATE_TRUNC('month', NOW());
      end_date := NOW();
    ELSE
      start_date := DATE_TRUNC('day', NOW());
      end_date := NOW();
  END CASE;

  -- Calcular KPI baseado no código
  CASE kpi_code
    WHEN 'total_orders' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = $2
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'orders_in_progress' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = $2
      AND status IN ('ativa', 'em_andamento')
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'completed_orders' THEN
      SELECT COUNT(*) INTO result
      FROM orders
      WHERE org_id = $2
      AND status = 'concluida'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'pending_budget_approvals' THEN
      SELECT COUNT(*) INTO result
      FROM budgets
      WHERE org_id = $2
      AND status = 'pendente'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'revenue_current_month' THEN
      SELECT COALESCE(SUM(total_value), 0) INTO result
      FROM orders
      WHERE org_id = $2
      AND status = 'concluida'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'average_order_value' THEN
      SELECT COALESCE(AVG(total_value), 0) INTO result
      FROM orders
      WHERE org_id = $2
      AND status = 'concluida'
      AND created_at >= start_date
      AND created_at <= end_date;
    
    WHEN 'customer_satisfaction' THEN
      -- Placeholder para métrica futura
      SELECT 85.0 INTO result;
    
    ELSE
      result := 0;
  END CASE;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.2 Função de Cálculo de Tendência
```sql
CREATE OR REPLACE FUNCTION calculate_kpi_trend(
  kpi_code TEXT,
  org_id UUID,
  current_period TEXT DEFAULT 'current',
  comparison_period TEXT DEFAULT 'previous'
) RETURNS TABLE (
  current_value NUMERIC,
  previous_value NUMERIC,
  change_percentage NUMERIC,
  trend_direction TEXT
) AS $$
DECLARE
  current_val NUMERIC;
  previous_val NUMERIC;
  change_pct NUMERIC;
  trend_dir TEXT;
BEGIN
  -- Calcular valor atual
  SELECT calculate_kpi_value(kpi_code, org_id, current_period) INTO current_val;
  
  -- Calcular valor anterior
  SELECT calculate_kpi_value(kpi_code, org_id, comparison_period) INTO previous_val;
  
  -- Calcular mudança percentual
  IF previous_val = 0 THEN
    change_pct := CASE WHEN current_val > 0 THEN 100 ELSE 0 END;
  ELSE
    change_pct := ((current_val - previous_val) / previous_val) * 100;
  END IF;
  
  -- Determinar direção da tendência
  IF ABS(change_pct) < 1 THEN
    trend_dir := 'stable';
  ELSIF change_pct > 0 THEN
    trend_dir := 'up';
  ELSE
    trend_dir := 'down';
  END IF;
  
  RETURN QUERY SELECT current_val, previous_val, change_pct, trend_dir;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.3 Tabela de Configuração de Temas por Organização
```sql
-- supabase/migrations/20241209000002_create_organization_themes.sql
CREATE TABLE organization_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  theme_name TEXT NOT NULL DEFAULT 'default',
  primary_color TEXT NOT NULL DEFAULT '#FF6B35',
  secondary_color TEXT NOT NULL DEFAULT '#004E89',
  accent_color TEXT NOT NULL DEFAULT '#00A8CC',
  success_color TEXT NOT NULL DEFAULT '#28A745',
  warning_color TEXT NOT NULL DEFAULT '#FFC107',
  error_color TEXT NOT NULL DEFAULT '#DC3545',
  info_color TEXT NOT NULL DEFAULT '#17A2B8',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, theme_name)
);

-- RLS Policy
ALTER TABLE organization_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization themes"
ON organization_themes FOR SELECT
USING (org_id = current_org_id());

CREATE POLICY "Admins can manage organization themes"
ON organization_themes FOR ALL
USING (
  org_id = current_org_id() AND
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role IN ('owner', 'admin')
  )
);
```

### 2. Frontend - Hook de KPIs em Tempo Real

#### 2.1 Hook Principal
```typescript
// src/hooks/useRealtimeKPIs.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface KPIValue {
  id: string;
  code: string;
  name: string;
  value: number;
  previousValue: number;
  changePercentage: number;
  trendDirection: 'up' | 'down' | 'stable';
  lastUpdated: string;
  icon: string;
  color: string;
  unit: string;
}

interface KPITrend {
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trendDirection: 'up' | 'down' | 'stable';
}

export const useRealtimeKPIs = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  // Buscar configuração de KPIs
  const { data: kpiConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['kpis', 'config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];
      
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Calcular valores dos KPIs
  const calculateKPIValues = useCallback(async (configs: any[]): Promise<KPIValue[]> => {
    if (!currentOrganization || !configs.length) return [];

    const kpiValues = await Promise.all(
      configs.map(async (config) => {
        try {
          // Buscar valor atual e tendência
          const { data: trendData, error: trendError } = await supabase
            .rpc('calculate_kpi_trend', {
              kpi_code: config.code,
              org_id: currentOrganization.id,
              current_period: 'current',
              comparison_period: 'previous'
            });

          if (trendError) throw trendError;

          const trend = trendData?.[0] as KPITrend;

          return {
            id: config.id,
            code: config.code,
            name: config.name,
            value: trend?.currentValue || 0,
            previousValue: trend?.previousValue || 0,
            changePercentage: trend?.changePercentage || 0,
            trendDirection: trend?.trendDirection || 'stable',
            lastUpdated: new Date().toISOString(),
            icon: config.icon,
            color: config.color,
            unit: config.unit
          };
        } catch (error) {
          console.error(`Error calculating KPI ${config.code}:`, error);
          return {
            id: config.id,
            code: config.code,
            name: config.name,
            value: 0,
            previousValue: 0,
            changePercentage: 0,
            trendDirection: 'stable' as const,
            lastUpdated: new Date().toISOString(),
            icon: config.icon,
            color: config.color,
            unit: config.unit
          };
        }
      })
    );

    return kpiValues;
  }, [currentOrganization]);

  // Query principal para valores dos KPIs
  const { data: kpiValues, isLoading: valuesLoading, error } = useQuery({
    queryKey: ['kpis', 'values', currentOrganization?.id],
    queryFn: () => calculateKPIValues(kpiConfigs || []),
    enabled: !!kpiConfigs?.length && !!currentOrganization,
    refetchInterval: 2 * 60 * 1000, // 2 minutos
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  // WebSocket para atualizações em tempo real
  useEffect(() => {
    if (!currentOrganization) return;

    const channel = supabase
      .channel('kpi-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `org_id=eq.${currentOrganization.id}`
        },
        (payload) => {
          // Invalidar cache quando houver mudanças nas ordens
          queryClient.invalidateQueries(['kpis', 'values', currentOrganization.id]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `org_id=eq.${currentOrganization.id}`
        },
        (payload) => {
          // Invalidar cache quando houver mudanças nos orçamentos
          queryClient.invalidateQueries(['kpis', 'values', currentOrganization.id]);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization, queryClient]);

  // Função para refresh manual
  const refreshKPIs = useCallback(() => {
    queryClient.invalidateQueries(['kpis', 'values', currentOrganization?.id]);
  }, [queryClient, currentOrganization?.id]);

  return {
    kpis: kpiValues || [],
    isLoading: configsLoading || valuesLoading,
    error,
    isConnected,
    refreshKPIs,
    lastUpdated: kpiValues?.[0]?.lastUpdated
  };
};
```

#### 2.2 Context de Temas por Organização
```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useOrganization } from './OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationTheme {
  id: string;
  themeName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

interface ThemeContextType {
  currentTheme: OrganizationTheme | null;
  isLoading: boolean;
  error: string | null;
  applyTheme: (theme: OrganizationTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentOrganization } = useOrganization();
  const [currentTheme, setCurrentTheme] = useState<OrganizationTheme | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar tema da organização
  useEffect(() => {
    const loadOrganizationTheme = async () => {
      if (!currentOrganization) {
        setCurrentTheme(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: themeError } = await supabase
          .from('organization_themes')
          .select('*')
          .eq('org_id', currentOrganization.id)
          .eq('is_active', true)
          .single();

        if (themeError) throw themeError;

        if (data) {
          const theme: OrganizationTheme = {
            id: data.id,
            themeName: data.theme_name,
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color,
            accentColor: data.accent_color,
            successColor: data.success_color,
            warningColor: data.warning_color,
            errorColor: data.error_color,
            infoColor: data.info_color,
          };

          setCurrentTheme(theme);
          applyTheme(theme);
        } else {
          // Usar tema padrão
          setCurrentTheme(null);
        }
      } catch (err) {
        console.error('Error loading organization theme:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar tema');
        setCurrentTheme(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganizationTheme();
  }, [currentOrganization]);

  // Aplicar tema no CSS
  const applyTheme = (theme: OrganizationTheme) => {
    const root = document.documentElement;
    
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--success', theme.successColor);
    root.style.setProperty('--warning', theme.warningColor);
    root.style.setProperty('--destructive', theme.errorColor);
    root.style.setProperty('--info', theme.infoColor);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      isLoading,
      error,
      applyTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### 3. Componentes - StatCard Aprimorado

#### 3.1 EnhancedStatCard Component
```typescript
// src/components/dashboard/EnhancedStatCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EnhancedStatCardProps {
  kpi: {
    id: string;
    code: string;
    name: string;
    value: number;
    previousValue: number;
    changePercentage: number;
    trendDirection: 'up' | 'down' | 'stable';
    lastUpdated: string;
    icon: string;
    color: string;
    unit: string;
  };
  showTrend?: boolean;
  showComparison?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

export const EnhancedStatCard: React.FC<EnhancedStatCardProps> = ({
  kpi,
  showTrend = true,
  showComparison = true,
  autoRefresh = true,
  className
}) => {
  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('pt-BR');
      default:
        return value.toString();
    }
  };

  const getTrendIcon = () => {
    switch (kpi.trendDirection) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (kpi.trendDirection) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getIconComponent = (iconName: string) => {
    // Mapear ícones - implementar conforme necessário
    const iconMap: Record<string, any> = {
      Calendar: '📅',
      Wrench: '🔧',
      Users: '👥',
      TrendingUp: '📈',
      AlertTriangle: '⚠️',
      CheckCircle: '✅',
      Package: '📦',
      Clock: '🕐',
      AlertCircle: '🔴'
    };
    return iconMap[iconName] || '📊';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('h-full', className)}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {kpi.name}
          </CardTitle>
          <div className="text-2xl">
            {getIconComponent(kpi.icon)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {formatValue(kpi.value, kpi.unit)}
            </div>
            
            {showTrend && (
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', getTrendColor())}
                >
                  {getTrendIcon()}
                  <span className="ml-1">
                    {kpi.changePercentage > 0 ? '+' : ''}
                    {kpi.changePercentage.toFixed(1)}%
                  </span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  vs. anterior
                </span>
              </div>
            )}

            {showComparison && (
              <div className="text-xs text-muted-foreground">
                Anterior: {formatValue(kpi.previousValue, kpi.unit)}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Atualizado: {new Date(kpi.lastUpdated).toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
```

#### 3.2 Grid de KPIs Responsivo
```typescript
// src/components/dashboard/KPIsGrid.tsx
import React from 'react';
import { EnhancedStatCard } from './EnhancedStatCard';
import { useRealtimeKPIs } from '@/hooks/useRealtimeKPIs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export const KPIsGrid: React.FC = () => {
  const { kpis, isLoading, error, isConnected, refreshKPIs } = useRealtimeKPIs();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    if (isDesktop) return 'grid-cols-4';
    return 'grid-cols-1';
  };

  if (isLoading) {
    return (
      <div className={`grid ${getGridCols()} gap-4`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erro ao carregar KPIs: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status de Conexão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshKPIs}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Grid de KPIs */}
      <div className={`grid ${getGridCols()} gap-4`}>
        {kpis.map((kpi) => (
          <EnhancedStatCard
            key={kpi.id}
            kpi={kpi}
            showTrend={true}
            showComparison={true}
            autoRefresh={true}
          />
        ))}
      </div>
    </div>
  );
};
```

### 4. Integração no Dashboard Principal

#### 4.1 Atualização do Dashboard
```typescript
// src/pages/Dashboard.tsx - Atualizações necessárias
import { KPIsGrid } from '@/components/dashboard/KPIsGrid';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function Dashboard() {
  // ... código existente ...

  return (
    <ThemeProvider>
      <motion.div 
        className={`space-y-${isMobile ? '4' : '6'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header existente */}
        {/* ... */}

        {/* KPIs em Tempo Real */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">KPIs em Tempo Real</h2>
            <Badge variant="outline" className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Atualização automática</span>
            </Badge>
          </div>
          <KPIsGrid />
        </section>

        {/* Resto do dashboard existente */}
        {/* ... */}
      </motion.div>
    </ThemeProvider>
  );
}
```

## 🧪 Testes

### Testes Unitários
```typescript
// src/hooks/__tests__/useRealtimeKPIs.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeKPIs } from '../useRealtimeKPIs';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useRealtimeKPIs', () => {
  it('should load KPIs successfully', async () => {
    const { result } = renderHook(() => useRealtimeKPIs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.kpis).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
```

### Testes de Integração
```typescript
// src/components/dashboard/__tests__/KPIsGrid.test.tsx
import { render, screen } from '@testing-library/react';
import { KPIsGrid } from '../KPIsGrid';

// Mock do hook
jest.mock('@/hooks/useRealtimeKPIs', () => ({
  useRealtimeKPIs: () => ({
    kpis: [
      {
        id: '1',
        code: 'total_orders',
        name: 'Total de Pedidos',
        value: 150,
        previousValue: 120,
        changePercentage: 25,
        trendDirection: 'up',
        lastUpdated: '2024-12-09T10:00:00Z',
        icon: 'Package',
        color: 'blue',
        unit: 'number'
      }
    ],
    isLoading: false,
    error: null,
    isConnected: true,
    refreshKPIs: jest.fn()
  })
}));

describe('KPIsGrid', () => {
  it('renders KPIs correctly', () => {
    render(<KPIsGrid />);
    
    expect(screen.getByText('Total de Pedidos')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('+25.0%')).toBeInTheDocument();
  });
});
```

## 📊 Critérios de Aceite - Fase 1

### ✅ Funcionais
- [ ] KPIs são calculados automaticamente com base em dados reais
- [ ] Valores são atualizados a cada 2 minutos
- [ ] Exibição responsiva adaptada para desktop, tablet e mobile
- [ ] Indicadores de tendência (alta/baixa) com percentuais
- [ ] Cores e ícones configuráveis por organização
- [ ] Loading states durante carregamento de dados
- [ ] WebSocket para atualizações em tempo real
- [ ] Temas personalizados por organização

### ✅ Técnicos
- [ ] Funções SQL para cálculo de KPIs implementadas
- [ ] Hook useRealtimeKPIs funcionando
- [ ] Componente EnhancedStatCard implementado
- [ ] Context de temas por organização funcionando
- [ ] Testes unitários e de integração passando
- [ ] Performance < 2s para carregamento inicial
- [ ] Responsividade em 320px-1920px

### ✅ UX/UI
- [ ] Interface intuitiva e clara
- [ ] Animações suaves sem impactar performance
- [ ] Feedback visual adequado para estados de loading
- [ ] Indicadores de conexão em tempo real
- [ ] Botão de refresh manual
- [ ] Formatação adequada de valores (moeda, percentual, etc.)

---

**Documentação criada**: 2024-12-09
**Versão**: 1.0.0
**Fase**: 1 - Fundação e KPIs em Tempo Real
