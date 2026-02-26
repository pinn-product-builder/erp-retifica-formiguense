import { useNavigate } from 'react-router-dom';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBuyerDashboard } from '@/hooks/useBuyerDashboard';
import { DashboardCounterCards, AlertBanner } from '@/components/purchasing/dashboard/DashboardCounterCards';
import {
  PendingQuotationsList,
  PendingApprovalsList,
  UrgentConditionalsList,
  PurchaseNeedsList,
} from '@/components/purchasing/dashboard/DashboardQuickLists';
import { DashboardMetricsBar } from '@/components/purchasing/dashboard/DashboardMetricsBar';
import { DashboardQuickActions } from '@/components/purchasing/dashboard/DashboardQuickActions';

function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={className ?? 'h-32 w-full rounded-lg'} />;
}

export default function DashboardCompras() {
  const navigate   = useNavigate();
  const { data, isLoading, lastUpdated, refresh } = useBuyerDashboard();

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-5 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
              Dashboard do Comprador
            </h1>
            {lastUpdated && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
          className="self-end sm:self-auto h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>

      {/* Banner de alertas */}
      {!isLoading && <AlertBanner counters={data.counters} />}

      {/* Cards de contadores */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-36 rounded-lg" />)}
        </div>
      ) : (
        <DashboardCounterCards counters={data.counters} onNavigate={navigate} />
      )}

      {/* Ações rápidas */}
      <DashboardQuickActions onNavigate={navigate} />

      {/* 4 listas rápidas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-52 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <PendingQuotationsList
            quotations={data.pending_quotations}
            onNavigate={() => navigate('/cotacoes')}
          />
          <PendingApprovalsList
            orders={data.pending_approvals}
            onNavigate={() => navigate('/pedidos-compra')}
          />
          <UrgentConditionalsList
            conditionals={data.urgent_conditionals}
            onNavigate={() => navigate('/condicionais')}
          />
          <PurchaseNeedsList
            needs={data.purchase_needs}
            onNavigate={() => navigate('/compras')}
          />
        </div>
      )}

      {/* Métricas de performance */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
          {[...Array(3)].map((_, i) => <SkeletonBlock key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <DashboardMetricsBar metrics={data.metrics} />
      )}
    </div>
  );
}
