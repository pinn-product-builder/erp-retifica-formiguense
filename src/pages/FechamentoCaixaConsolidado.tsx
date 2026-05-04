import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import {
  CashClosingService,
  type CashClosingConsolidatedEnrichedLine,
} from '@/services/financial/cashClosingService';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import { ArrowLeft, Building2, LayoutGrid, Scale, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { StatCard } from '@/components/StatCard';
import { Separator } from '@/components/ui/separator';

export default function FechamentoCaixaConsolidado() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const orgLabel = currentOrganization?.name?.trim() ?? '';
  const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<CashClosingConsolidatedEnrichedLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    void CashClosingService.listForConsolidatedDateEnriched(orgId, closingDate)
      .then((data) => {
        if (!cancelled) setLines(data);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao carregar consolidado'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, closingDate]);

  const totals = useMemo(() => {
    let system = 0;
    let verified = 0;
    let diff = 0;
    for (const r of lines) {
      system += Number(r.system_balance ?? r.expected_balance ?? 0);
      verified += Number(r.total_verified ?? r.counted_balance ?? 0);
      diff += Number(r.difference_amount ?? 0);
    }
    return { system, verified, diff };
  }, [lines]);

  const divergentCount = useMemo(
    () => lines.filter((r) => (r.status as string) === 'divergent').length,
    [lines]
  );

  return (
    <FinancialPageShell>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Consolidado de fechamentos</h1>
            {orgLabel ? (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 truncate">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{orgLabel}</span>
              </p>
            ) : null}
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Visão gerencial: todos os caixas fechados na data, somando sistema, verificação e diferenças por
              operador/conta.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" asChild className="w-full sm:w-auto shrink-0">
            <Link to="/fechamento-caixa" className="gap-2 inline-flex items-center">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao meu caixa
            </Link>
          </Button>
        </div>

        <Card className="border p-3 sm:p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-6">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="ccd-date">Data de referência</Label>
              <Input
                id="ccd-date"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Mostra apenas fechamentos cuja <span className="font-medium text-foreground">data de fechamento</span>{' '}
                coincide com o dia escolhido.
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[110px] rounded-lg border bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <StatCard
              title="Total sistema"
              value={formatBRL(totals.system)}
              icon={Scale}
              variant="primary"
              calculationInfo="Soma do saldo esperado pelo sistema em cada fechamento do dia."
            />
            <StatCard
              title="Total verificado"
              value={formatBRL(totals.verified)}
              icon={LayoutGrid}
              variant="default"
              calculationInfo="Soma do que foi contado (físico + banco) em cada caixa."
            />
            <StatCard
              title="Diferença líquida"
              value={formatBRL(totals.diff)}
              icon={Math.abs(totals.diff) >= 0.02 ? AlertTriangle : CheckCircle2}
              variant={Math.abs(totals.diff) >= 0.02 ? 'danger' : 'success'}
            />
            <StatCard
              title="Caixas nesta data"
              value={lines.length}
              subtitle={
                divergentCount > 0
                  ? `${divergentCount} com divergência`
                  : lines.length > 0
                    ? 'Todos conferentes'
                    : 'Nenhum fechamento'
              }
              icon={Users}
              variant="warning"
            />
          </div>
        )}

        <Card className="border overflow-hidden">
          <CardHeader className="border-b bg-muted/30 p-3 sm:p-4 space-y-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Detalhamento por conta</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {formatDateBR(closingDate)} · {lines.length} linha{lines.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              {lines.length > 0 && divergentCount > 0 ? (
                <Badge variant="destructive" className="w-fit">
                  {divergentCount} divergente{divergentCount !== 1 ? 's' : ''}
                </Badge>
              ) : lines.length > 0 ? (
                <Badge variant="secondary" className="w-fit">
                  Conferência ok
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta / operador</TableHead>
                  <TableHead className="text-right whitespace-nowrap hidden md:table-cell">
                    Abertura (ref.)
                  </TableHead>
                  <TableHead className="text-right">Sistema</TableHead>
                  <TableHead className="text-right">Verificado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-sm py-10 text-center">
                      Carregando…
                    </TableCell>
                  </TableRow>
                )}
                {!loading && lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-sm py-10 text-center max-w-md mx-auto">
                      Nenhum fechamento registrado nesta data. Os operadores precisam concluir o fechamento no dia em
                      &quot;Fechamento de caixa&quot; para aparecer aqui.
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  lines.map((r) => {
                    const name = r.bank_accounts?.name ?? '—';
                    const op = r.operator_name;
                    const label = op ? `${name} · ${op}` : name;
                    const divergent = (r.status as string) === 'divergent';
                    const opening = r.opening_balance != null ? Number(r.opening_balance) : null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[240px] min-w-0 align-top">
                          <span className="text-xs sm:text-sm font-medium block truncate" title={label}>
                            {label}
                          </span>
                          {opening != null && (
                            <span className="text-xs text-muted-foreground md:hidden mt-0.5 block">
                              Abertura: {formatBRL(opening)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm hidden md:table-cell align-top">
                          {opening != null ? formatBRL(opening) : '—'}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm align-top">
                          {formatBRL(Number(r.system_balance ?? r.expected_balance ?? 0))}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm align-top">
                          {formatBRL(Number(r.total_verified ?? r.counted_balance ?? 0))}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm align-top">
                          {formatBRL(Number(r.difference_amount))}
                        </TableCell>
                        <TableCell className="align-top">
                          {divergent ? (
                            <Badge variant="destructive">Divergente</Badge>
                          ) : (
                            <Badge variant="secondary">Fechado</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {!loading && lines.length > 0 && (
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground">—</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatBRL(totals.system)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatBRL(totals.verified)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {formatBRL(totals.diff)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Separator className="opacity-50" />
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          Os totais consolidam apenas fechamentos já gravados. Para auditar movimentos brutos, use o fluxo de caixa por
          conta.
        </p>
      </div>
    </FinancialPageShell>
  );
}
