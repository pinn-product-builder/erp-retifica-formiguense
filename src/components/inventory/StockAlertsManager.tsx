import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Search,
  Bell,
  BellOff,
  ShoppingCart,
  CheckCircle,
  RefreshCw,
  Package,
} from 'lucide-react';
import { useStockAlerts, type StockAlert, type AlertUrgency } from '@/hooks/useStockAlerts';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const URGENCY_CONFIG: Record<AlertUrgency, { label: string; color: string; badgeClass: string }> = {
  critical: { label: 'Crítico', color: 'text-red-600', badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  high: { label: 'Alto', color: 'text-orange-600', badgeClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  medium: { label: 'Médio', color: 'text-yellow-600', badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  low: { label: 'Baixo', color: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
};

function AlertUrgencyBadge({ urgency }: { urgency?: AlertUrgency }) {
  if (!urgency) return null;
  const cfg = URGENCY_CONFIG[urgency];
  return (
    <Badge className={`${cfg.badgeClass} text-xs font-medium`}>
      {cfg.label}
    </Badge>
  );
}

function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  onCreateNeed,
}: {
  alert: StockAlert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onCreateNeed: (alert: StockAlert) => void;
}) {
  const urgency = alert.urgency ?? 'low';
  const borderColor = {
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-blue-500',
  }[urgency];

  const shortage = Math.max(0, (alert.minimum_stock ?? 0) - alert.current_stock);

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm sm:text-base truncate">{alert.part_name}</span>
              <AlertUrgencyBadge urgency={alert.urgency} />
              {!alert.is_active && (
                <Badge variant="secondary" className="text-xs">Resolvido</Badge>
              )}
            </div>

            {alert.part_code && (
              <p className="text-xs sm:text-sm text-muted-foreground">Código: {alert.part_code}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground">Estoque atual: </span>
                <span className={`font-medium ${alert.current_stock === 0 ? 'text-red-600' : ''}`}>
                  {alert.current_stock}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Estoque mín.: </span>
                <span className="font-medium">{alert.minimum_stock}</span>
              </div>
              {shortage > 0 && (
                <div>
                  <span className="text-muted-foreground">Faltam: </span>
                  <span className="font-medium text-red-600">{shortage}</span>
                </div>
              )}
            </div>

            {alert.acknowledged_at && (
              <p className="text-xs text-muted-foreground">
                Reconhecido em {new Date(alert.acknowledged_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          {alert.is_active && (
            <div className="flex flex-row sm:flex-col gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-7 sm:h-8 text-xs gap-1"
                onClick={() => onCreateNeed(alert)}
                title="Criar necessidade de compra"
              >
                <ShoppingCart className="w-3 h-3" />
                <span className="hidden sm:inline">Comprar</span>
              </Button>
              {!alert.acknowledged_at && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 sm:h-8 text-xs gap-1"
                  onClick={() => onAcknowledge(alert.id)}
                  title="Reconhecer alerta"
                >
                  <Bell className="w-3 h-3" />
                  <span className="hidden sm:inline">Reconhecer</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 sm:h-8 text-xs gap-1"
                onClick={() => onResolve(alert.id)}
                title="Marcar como resolvido"
              >
                <CheckCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Resolver</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StockAlertsManager() {
  const {
    alerts,
    stats,
    pagination,
    loading,
    fetchAlerts,
    acknowledgeAlert,
    resolveAlert,
    createPurchaseNeed,
    applyFilters,
    goToPage,
  } = useStockAlerts();

  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const handleSearch = (value: string) => {
    setSearch(value);
    applyFilters({
      search: value || undefined,
      urgency: urgencyFilter !== 'all' ? (urgencyFilter as AlertUrgency) : undefined,
      is_active: statusFilter === 'active' ? true : statusFilter === 'resolved' ? false : undefined,
    });
  };

  const handleUrgencyChange = (value: string) => {
    setUrgencyFilter(value);
    applyFilters({
      search: search || undefined,
      urgency: value !== 'all' ? (value as AlertUrgency) : undefined,
      is_active: statusFilter === 'active' ? true : statusFilter === 'resolved' ? false : undefined,
    });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    applyFilters({
      search: search || undefined,
      urgency: urgencyFilter !== 'all' ? (urgencyFilter as AlertUrgency) : undefined,
      is_active: value === 'active' ? true : value === 'resolved' ? false : undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Alertas de Estoque</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitore e gerencie alertas de estoque baixo
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAlerts()}
          disabled={loading}
          className="gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Crítico', value: stats.critical, color: 'border-l-red-500', textColor: 'text-red-600' },
          { label: 'Alto', value: stats.high, color: 'border-l-orange-500', textColor: 'text-orange-600' },
          { label: 'Médio', value: stats.medium, color: 'border-l-yellow-500', textColor: 'text-yellow-600' },
          { label: 'Baixo', value: stats.low, color: 'border-l-blue-500', textColor: 'text-blue-600' },
        ].map((item) => (
          <Card key={item.label} className={`border-l-4 ${item.color}`}>
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${item.textColor}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por peça ou código..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={urgencyFilter} onValueChange={handleUrgencyChange}>
              <SelectTrigger className="w-full sm:w-40 h-9">
                <AlertTriangle className="w-3.5 h-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas urgências</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-36 h-9">
                <BellOff className="w-3.5 h-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Carregando alertas...
          </CardContent>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium mb-1">Nenhum alerta encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {search || urgencyFilter !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Não há alertas ativos no momento'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          <CardDescription className="text-xs">
            Mostrando {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.count)} de {pagination.count} alertas
          </CardDescription>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
              onCreateNeed={createPurchaseNeed}
            />
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => goToPage(pagination.page - 1)}
                aria-disabled={pagination.page <= 1}
                className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm px-4 py-2">
                Página {pagination.page} de {pagination.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => goToPage(pagination.page + 1)}
                aria-disabled={pagination.page >= pagination.totalPages}
                className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
