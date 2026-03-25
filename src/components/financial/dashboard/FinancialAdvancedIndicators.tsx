import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdvancedIndicatorsService,
  type AdvancedFinancialIndicators,
} from '@/services/financial';
import { BarChart3, Gauge, Percent, Timer } from 'lucide-react';

type Props = {
  orgId: string;
};

export function FinancialAdvancedIndicators({ orgId }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<AdvancedFinancialIndicators | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await AdvancedIndicatorsService.compute(orgId, year, month);
      setData(r);
    } finally {
      setLoading(false);
    }
  }, [orgId, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];

  const fmtPct = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  const fmtDays = (n: number | null) => (n == null ? '—' : `${n} d`);
  const fmtMoney = (n: number | null) =>
    n == null
      ? '—'
      : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

  return (
    <Card>
      <CardHeader className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base sm:text-lg">Indicadores avançados (período)</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs sm:text-sm shrink-0">Ano</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="h-8 w-[88px] text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs sm:text-sm shrink-0">Mês</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="h-8 w-[100px] text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {monthNames[m - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : data ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-lg border p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Percent className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm truncate">Inadimplência</span>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums">{fmtPct(data.inadimplenciaPercent)}</p>
            </div>
            <div className="rounded-lg border p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Timer className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm truncate">PMR</span>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums">{fmtDays(data.pmrDays)}</p>
            </div>
            <div className="rounded-lg border p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Timer className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm truncate">PMP</span>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums">{fmtDays(data.pmpDays)}</p>
            </div>
            <div className="rounded-lg border p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Gauge className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm truncate">Ticket médio</span>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums whitespace-nowrap truncate">
                {fmtMoney(data.ticketMedio)}
              </p>
            </div>
            <div className="rounded-lg border p-3 sm:p-4 min-w-0 col-span-2 md:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="text-xs sm:text-sm truncate">Giro de caixa</span>
              </div>
              <p className="text-lg sm:text-xl font-bold tabular-nums">{fmtDays(data.giroCaixaDias)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados.</p>
        )}
      </CardContent>
    </Card>
  );
}
