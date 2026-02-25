import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart, FileText, TrendingUp, Users, Printer, RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePurchasingReports, PERIOD_LABELS } from '@/hooks/usePurchasingReports';
import { type PeriodoAnalise } from '@/services/PurchasingReportsService';
import { PurchaseVolumeChart }  from './PurchaseVolumeChart';
import { SupplierRankingTable } from './SupplierRankingTable';
import { LeadTimeAnalysis }     from './LeadTimeAnalysis';
import { SavingsReport }        from './SavingsReport';

const PERIOD_OPTIONS: { value: PeriodoAnalise; label: string }[] = [
  { value: 'hoje',         label: 'Hoje'             },
  { value: 'semana',       label: 'Esta Semana'       },
  { value: 'mes',          label: 'Este Mês'          },
  { value: 'trimestre',    label: 'Último Trimestre'  },
  { value: 'ano',          label: 'Este Ano'          },
  { value: 'personalizado', label: 'Personalizado'    },
];

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-md flex-shrink-0 ${color}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-base sm:text-xl md:text-2xl font-bold truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KPISkeleton() {
  return (
    <div className="h-20 sm:h-24 rounded-lg bg-muted/50 animate-pulse" />
  );
}

export function PurchasingDashboard() {
  const { isLoading, data, filters, fetch, setPeriod, applyFilters, printReport } =
    usePurchasingReports();

  const [localStart, setLocalStart] = useState('');
  const [localEnd,   setLocalEnd]   = useState('');

  useEffect(() => {
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyCustom = () => {
    if (!localStart || !localEnd) return;
    applyFilters({ period: 'personalizado', startDate: localStart, endDate: localEnd });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <Label className="text-xs sm:text-sm">Período</Label>
          <Select
            value={filters.period}
            onValueChange={(v) => setPeriod(v as PeriodoAnalise)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filters.period === 'personalizado' && (
          <>
            <div>
              <Label className="text-xs sm:text-sm">De</Label>
              <Input type="date" className="mt-1" value={localStart} onChange={e => setLocalStart(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Até</Label>
              <Input type="date" className="mt-1" value={localEnd} onChange={e => setLocalEnd(e.target.value)} />
            </div>
            <Button onClick={handleApplyCustom} disabled={!localStart || !localEnd} size="sm">
              Aplicar
            </Button>
          </>
        )}

        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetch()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={printReport}
            disabled={!data || isLoading}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          <>
            <KPICard
              icon={ShoppingCart}
              label="Total de Compras"
              value={formatCurrency(data.kpis.totalValue)}
              sub={`${data.kpis.totalOrders} pedidos`}
              color="bg-blue-100 text-blue-600"
            />
            <KPICard
              icon={FileText}
              label="Ticket Médio"
              value={formatCurrency(data.kpis.averageOrderValue)}
              color="bg-purple-100 text-purple-600"
            />
            <KPICard
              icon={TrendingUp}
              label="Economia Cotações"
              value={formatCurrency(data.kpis.savingsFromQuotations)}
              sub={data.kpis.savingsPercentage > 0 ? `${data.kpis.savingsPercentage.toFixed(1)}% de desconto` : undefined}
              color="bg-green-100 text-green-600"
            />
            <KPICard
              icon={Users}
              label="Fornecedores Ativos"
              value={String(data.kpis.activeSuppliers)}
              color="bg-orange-100 text-orange-600"
            />
          </>
        )}
      </div>

      {/* Gráfico de volume */}
      {isLoading || !data ? (
        <div className="h-64 rounded-lg bg-muted/50 animate-pulse" />
      ) : (
        <PurchaseVolumeChart data={data.volumeByMonth} />
      )}

      {/* Painel inferior: fornecedores + lead time + economia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading || !data ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 rounded-lg bg-muted/50 animate-pulse" />
          ))
        ) : (
          <>
            <SupplierRankingTable data={data.topSuppliers} />
            <LeadTimeAnalysis avgLeadTimeDays={data.kpis.avgLeadTimeDays} />
            <SavingsReport
              savings={data.kpis.savingsFromQuotations}
              savingsPercentage={data.kpis.savingsPercentage}
              returnRate={data.kpis.returnRate}
            />
          </>
        )}
      </div>

      {data && (
        <p className="text-xs text-muted-foreground text-right">
          Período: {PERIOD_LABELS[filters.period]}
          {filters.period === 'personalizado' && filters.startDate && filters.endDate
            ? ` (${new Date(filters.startDate + 'T12:00:00').toLocaleDateString('pt-BR')} — ${new Date(filters.endDate + 'T12:00:00').toLocaleDateString('pt-BR')})`
            : ''}
        </p>
      )}
    </div>
  );
}
