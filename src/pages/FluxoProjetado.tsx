import { useCallback, useEffect, useState } from 'react';
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
import type { OnDemandProjectionDay } from '@/services/financial/projectionService';
import type { Database } from '@/integrations/supabase/types';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const [persisted, setPersisted] = useState<PersistedProjectionRow[]>([]);

  const refresh = useCallback(async () => {
    const bundle = await loadProjectionsDashboard();
    setOnDemand(bundle.onDemand);
    setPersisted(bundle.persisted);
  }, [loadProjectionsDashboard]);

  useEffect(() => {
    if (!orgId) return;
    void refresh();
  }, [orgId, refresh]);

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6 p-1 sm:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Fluxo de caixa projetado</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Projeção de 30 dias por vencimentos de contas a receber e a pagar; série persistida de 90 dias.
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
              <ResponsiveTable<OnDemandProjectionDay>
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
