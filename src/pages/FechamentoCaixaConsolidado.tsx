import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function FechamentoCaixaConsolidado() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
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

  return (
    <FinancialPageShell>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Consolidado de fechamentos</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Soma de todos os caixas fechados na data, por conta.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" asChild className="w-full sm:w-auto">
            <Link to="/fechamento-caixa" className="gap-2 inline-flex items-center">
              <ArrowLeft className="h-4 w-4" />
              Meu fechamento
            </Link>
          </Button>
        </div>

        <Card className="border p-3 sm:p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ccd-date">Data</Label>
              <Input
                id="ccd-date"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label>Totais do dia</Label>
              <div className="flex flex-wrap gap-4 text-sm sm:text-base">
                <span className="whitespace-nowrap">
                  Sistema: <strong>{formatBRL(totals.system)}</strong>
                </span>
                <span className="whitespace-nowrap">
                  Verificado: <strong>{formatBRL(totals.verified)}</strong>
                </span>
                <span className="whitespace-nowrap">
                  Diferença:{' '}
                  <strong className={Math.abs(totals.diff) >= 0.02 ? 'text-destructive' : ''}>
                    {formatBRL(totals.diff)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta / operador</TableHead>
                <TableHead className="text-right">Sistema</TableHead>
                <TableHead className="text-right">Verificado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-sm">
                    Carregando…
                  </TableCell>
                </TableRow>
              )}
              {!loading && lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-sm">
                    Nenhum fechamento nesta data.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                lines.map((r) => {
                  const name = r.bank_accounts?.name ?? '—';
                  const op = r.operator_name;
                  const label = op ? `${name} · ${op}` : name;
                  const divergent = (r.status as string) === 'divergent';
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="max-w-[220px] min-w-0">
                        <span className="text-xs sm:text-sm truncate block" title={label}>
                          {label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                        {formatBRL(Number(r.system_balance ?? r.expected_balance ?? 0))}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                        {formatBRL(Number(r.total_verified ?? r.counted_balance ?? 0))}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                        {formatBRL(Number(r.difference_amount))}
                      </TableCell>
                      <TableCell>
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
        </Card>

        <p className="text-xs text-muted-foreground">
          Data de referência dos lançamentos: {formatDateBR(closingDate)}
        </p>
      </div>
    </FinancialPageShell>
  );
}
