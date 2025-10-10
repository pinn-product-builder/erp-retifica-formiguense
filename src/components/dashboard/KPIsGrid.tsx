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
          Erro ao carregar KPIs: {String(error)}
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
