import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FinancialPageShell } from '@/components/financial/FinancialPageShell';
import { useOrganization } from '@/hooks/useOrganization';
import { FinAccountingIntegrationService } from '@/services/financial/finAccountingIntegrationService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function IntegracaoContabil() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await FinAccountingIntegrationService.listPending(orgId);
      setRows(data as Record<string, unknown>[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao carregar pendências');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <FinancialPageShell>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Integração contábil/fiscal</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Fila de lançamentos contábeis pendentes (idempotente por evento).
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled={!orgId || loading} onClick={() => void load()}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>

        <Card className="border p-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Pendências</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 pt-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Débito</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={String(r.id)}>
                    <TableCell className="text-xs sm:text-sm">{String(r.event_type ?? '—')}</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {String(r.source_type ?? '—')} {String(r.source_id ?? '').slice(0, 8)}…
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{String(r.account_code ?? '—')}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                      {Number(r.debit ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs sm:text-sm">
                      {Number(r.credit ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{String(r.status ?? '—')}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-xs sm:text-sm">
                      Nenhuma pendência no momento.
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

