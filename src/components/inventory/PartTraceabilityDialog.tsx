import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PartTraceabilityService,
  type PartTraceability,
} from '@/services/inventory/partTraceabilityService';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import { Activity, ArrowDownToLine, ArrowUpFromLine, ScanLine } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | null;
  partId: string | null;
};

export function PartTraceabilityDialog({ open, onOpenChange, orgId, partId }: Props) {
  const [trace, setTrace] = useState<PartTraceability | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orgId || !partId) {
      setTrace(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    PartTraceabilityService.getTrace(orgId, partId)
      .then((res) => {
        if (!cancelled) setTrace(res);
      })
      .catch(() => {
        if (!cancelled) setTrace(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orgId, partId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-lg sm:text-xl">
            <ScanLine className="h-5 w-5" />
            Rastreio analítico
            {trace?.part && (
              <span className="text-sm font-normal text-muted-foreground">
                · {trace.part.code} · {trace.part.name}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Histórico completo da peça: entradas, saídas, OSs em que foi aplicada.
          </DialogDescription>
        </DialogHeader>

        {loading && !trace && (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando rastreio…</p>
        )}

        {trace && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Estoque atual</p>
                <p className="text-sm sm:text-lg font-semibold">
                  {trace.part?.currentQuantity ?? 0} un
                </p>
              </div>
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total entradas</p>
                <p className="text-sm sm:text-lg font-semibold text-success">+{trace.totals.totalIn}</p>
              </div>
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total saídas</p>
                <p className="text-sm sm:text-lg font-semibold text-destructive">
                  −{trace.totals.totalOut}
                </p>
              </div>
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Aplicado em OSs</p>
                <p className="text-sm sm:text-lg font-semibold">
                  {trace.totals.appliedQty} un · {trace.totals.orderCount} OS
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <h3 className="text-sm sm:text-base font-medium">
                  OSs em que a peça foi aplicada ({trace.appliedInOrders.length})
                </h3>
              </div>
              {trace.appliedInOrders.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground py-2">
                  Nenhuma aplicação registrada.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs">OS</TableHead>
                        <TableHead className="text-xs">Cliente</TableHead>
                        <TableHead className="text-xs text-right">Notado</TableHead>
                        <TableHead className="text-xs text-right">Baixado</TableHead>
                        <TableHead className="text-xs text-right">Preço un.</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trace.appliedInOrders.map((a) => (
                        <TableRow key={a.workshopLineId}>
                          <TableCell className="text-xs">
                            {formatDateBR(a.appliedAt.slice(0, 10))}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {a.orderNumber ?? a.orderId.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-xs">{a.customerName ?? '—'}</TableCell>
                          <TableCell className="text-xs text-right">{a.qtyNoted}</TableCell>
                          <TableCell className="text-xs text-right">{a.qtyReleased}</TableCell>
                          <TableCell className="text-xs text-right whitespace-nowrap">
                            {formatBRL(a.unitPriceApplied)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={a.isExtra ? 'destructive' : 'outline'} className="text-[10px]">
                              {a.isExtra ? 'Extra' : 'Orçamento'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-success" />
                <ArrowUpFromLine className="h-4 w-4 text-destructive" />
                <h3 className="text-sm sm:text-base font-medium">
                  Movimentações de estoque ({trace.movements.length})
                </h3>
              </div>
              {trace.movements.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground py-2">
                  Nenhuma movimentação registrada.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border max-h-80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Data</TableHead>
                        <TableHead className="text-xs">Tipo</TableHead>
                        <TableHead className="text-xs text-right">Qtde</TableHead>
                        <TableHead className="text-xs">OS vinculada</TableHead>
                        <TableHead className="text-xs">Motivo</TableHead>
                        <TableHead className="text-xs text-right">Custo total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trace.movements.map((m) => {
                        const isIn = m.type === 'entrada';
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {formatDateBR(m.date.slice(0, 10))}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isIn ? 'secondary' : 'outline'}
                                className={`text-[10px] ${isIn ? 'text-success' : 'text-destructive'}`}
                              >
                                {m.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right">
                              {isIn ? '+' : '−'}
                              {m.quantity}
                            </TableCell>
                            <TableCell className="text-xs">{m.orderNumber ?? '—'}</TableCell>
                            <TableCell className="text-xs">
                              <span className="block max-w-[200px] truncate">{m.reason ?? '—'}</span>
                            </TableCell>
                            <TableCell className="text-xs text-right whitespace-nowrap">
                              {m.totalCost != null ? formatBRL(m.totalCost) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
