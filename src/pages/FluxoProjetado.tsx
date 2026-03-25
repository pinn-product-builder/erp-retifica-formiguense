import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { useFinancial } from '@/hooks/useFinancial';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import type { OnDemandProjectionDay, ProjectionScenarioKey, ScenarioProjectionResult } from '@/services/financial/projectionService';
import type { Database } from '@/integrations/supabase/types';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProjectionService } from '@/services/financial/projectionService';

type PersistedProjectionRow = Database['public']['Tables']['cash_flow_projection']['Row'];

const onDemandColumns: ResponsiveTableColumn<OnDemandProjectionDay>[] = [
  {
    key: 'date',
    header: 'Data',
    priority: 1,
    minWidth: 100,
    render: (r) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatDateBR(r.projection_date)}</span>,
  },
  {
    key: 'in',
    header: 'Receitas projetadas',
    priority: 2,
    minWidth: 120,
    render: (r) => (
      <span className="text-xs sm:text-sm md:text-base whitespace-nowrap text-success">
        {formatBRL(r.projected_income)}
      </span>
    ),
  },
  {
    key: 'out',
    header: 'Despesas projetadas',
    priority: 3,
    minWidth: 120,
    render: (r) => (
      <span className="text-xs sm:text-sm md:text-base whitespace-nowrap text-destructive">
        {formatBRL(r.projected_expenses)}
      </span>
    ),
  },
  {
    key: 'bal',
    header: 'Saldo',
    priority: 4,
    minWidth: 110,
    render: (r) => (
      <span
        className={`font-medium text-xs sm:text-sm md:text-base whitespace-nowrap ${
          r.projected_balance < 0 ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {formatBRL(r.projected_balance)}
      </span>
    ),
  },
];

export default function FluxoProjetado() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const { loadProjectionsDashboard, loading } = useFinancial();
  const [onDemand, setOnDemand] = useState<{
    days: OnDemandProjectionDay[];
    hasNegativeDay: boolean;
    minBalance: number;
    openingBalance: number;
  } | null>(null);
  const [scenarioKey, setScenarioKey] = useState<ProjectionScenarioKey>('realistic');
  const [recommendedMin, setRecommendedMin] = useState('10000');
  const [scenario90d, setScenario90d] = useState<ScenarioProjectionResult | null>(null);
  const recMinNumber = useMemo(() => Math.max(0, Number(recommendedMin.replace(',', '.')) || 0), [recommendedMin]);
  const [persisted, setPersisted] = useState<PersistedProjectionRow[]>([]);

  const refresh = useCallback(async () => {
    const bundle = await loadProjectionsDashboard();
    setOnDemand(bundle.onDemand);
    setPersisted(bundle.persisted);
    setScenario90d(bundle.scenarios90d);
  }, [loadProjectionsDashboard]);

  const refreshScenario = useCallback(async () => {
    if (!orgId) return;
    const res = await ProjectionService.computeScenario90dFromArAp(orgId, scenarioKey, recMinNumber || 10000);
    setScenario90d(res);
  }, [orgId, scenarioKey, recMinNumber]);

  useEffect(() => {
    if (!orgId) return;
    void refresh();
  }, [orgId, refresh]);

  useEffect(() => {
    if (!orgId) return;
    void refreshScenario();
  }, [orgId, refreshScenario]);

  const scenarioLabel = (k: ProjectionScenarioKey) => {
    if (k === 'optimistic') return 'Otimista';
    if (k === 'pessimistic') return 'Pessimista';
    return 'Realista';
  };

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6 p-1 sm:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Fluxo de caixa projetado</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Projeção de 30 dias por vencimentos de contas a receber e a pagar; simulação 90 dias com cenários; série persistida (quando houver rotina gravando).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto shrink-0"
            disabled={loading || !orgId}
            onClick={() => void refresh()}
          >
            {loading ? 'Atualizando…' : 'Recalcular'}
          </Button>
        </div>

        {!orgId && (
          <p className="text-sm text-muted-foreground">Selecione uma organização.</p>
        )}

        {onDemand && onDemand.hasNegativeDay && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            <div>
              <AlertTitle className="text-sm sm:text-base">Saldo negativo previsto</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Nos próximos 30 dias o saldo acumulado fica abaixo de zero em ao menos um dia. Menor saldo
                projetado:{' '}
                <span className="font-semibold whitespace-nowrap">{formatBRL(onDemand.minBalance)}</span>.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {onDemand && (
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-base sm:text-lg">Próximos 30 dias (on-demand)</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                Saldo inicial (fluxo de caixa até hoje):{' '}
                <span className="font-medium text-foreground whitespace-nowrap">
                  {formatBRL(onDemand.openingBalance)}
                </span>
                . Títulos vencidos sem baixa entram no dia de hoje.
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 min-w-0">
              <ResponsiveTable
                data={onDemand.days}
                columns={onDemandColumns}
                keyExtractor={(r) => r.projection_date}
                emptyMessage="Sem títulos no horizonte — cadastre contas a receber e a pagar."
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Projeção 90 dias (cenários)</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              Ajuste de cenário aplica fatores nas entradas/saídas previstas por vencimento (AR/AP). Use como simulação.
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>Cenário</Label>
                <Select value={scenarioKey} onValueChange={(v) => setScenarioKey(v as ProjectionScenarioKey)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000]">
                    <SelectItem value="optimistic">{scenarioLabel('optimistic')}</SelectItem>
                    <SelectItem value="realistic">{scenarioLabel('realistic')}</SelectItem>
                    <SelectItem value="pessimistic">{scenarioLabel('pessimistic')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-alert">Alerta saldo mínimo (R$)</Label>
                <Input
                  id="min-alert"
                  inputMode="decimal"
                  value={recommendedMin}
                  onChange={(e) => setRecommendedMin(e.target.value)}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={!orgId}
                  onClick={() => void refreshScenario()}
                >
                  Recalcular cenário
                </Button>
              </div>
            </div>

            {scenario90d && scenario90d.belowRecommended && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <AlertTitle className="text-sm sm:text-base">Abaixo do mínimo recomendado</AlertTitle>
                  <AlertDescription className="text-xs sm:text-sm">
                    No cenário <span className="font-medium">{scenarioLabel(scenario90d.scenario)}</span> o menor saldo
                    em 90 dias fica em{' '}
                    <span className="font-semibold whitespace-nowrap">{formatBRL(scenario90d.minBalance)}</span>, abaixo
                    de <span className="font-semibold whitespace-nowrap">{formatBRL(scenario90d.recommendedMinimum)}</span>.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {scenario90d && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm sm:text-base">Resumo mensal</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-4 pt-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Entradas</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Saídas</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Saldo fim</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scenario90d.monthly.map((m) => (
                          <TableRow key={m.month}>
                            <TableCell className="text-xs sm:text-sm">{m.month}</TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm text-success">
                              {formatBRL(m.income)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm text-destructive">
                              {formatBRL(m.expense)}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm font-medium">
                              {formatBRL(m.endBalance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm sm:text-base">Dias (primeiros 20)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-4 pt-0">
                    <ResponsiveTable
                      data={scenario90d.days.slice(0, 20)}
                      columns={onDemandColumns}
                      keyExtractor={(r) => r.projection_date}
                      emptyMessage="Sem títulos no horizonte."
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Série persistida (90 dias)</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              Registros da tabela de projeção persistida no banco (quando houver rotina gravando esses dados).
            </p>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 pt-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Data</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">
                    Projetado receitas
                  </TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">
                    Projetado despesas
                  </TableHead>
                  <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {persisted.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs sm:text-sm">{formatDateBR(r.projection_date)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm md:text-base">
                      {formatBRL(Number(r.projected_income ?? 0))}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm md:text-base">
                      {formatBRL(Number(r.projected_expenses ?? 0))}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm md:text-base">
                      {formatBRL(Number(r.projected_balance ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
                {persisted.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-xs sm:text-sm">
                      Sem linhas persistidas no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </FinancialPageShell>
  );
}
