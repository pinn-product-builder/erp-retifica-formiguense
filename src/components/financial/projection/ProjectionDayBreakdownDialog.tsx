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
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import type { ProjectionDayBreakdown, ProjectionDayEntry } from '@/services/financial/projectionService';
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: ProjectionDayBreakdown | null;
  loading: boolean;
  dateYmd: string | null;
};

function EntryTable({
  rows,
  tone,
  emptyMessage,
}: {
  rows: ProjectionDayEntry[];
  tone: 'income' | 'expense';
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="text-xs sm:text-sm text-muted-foreground py-2">{emptyMessage}</p>;
  }
  const topAmount = rows[0]?.amount ?? 0;
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">{tone === 'income' ? 'Cliente' : 'Fornecedor'}</TableHead>
            <TableHead className="text-xs text-right whitespace-nowrap">Valor</TableHead>
            <TableHead className="text-xs">Forma</TableHead>
            <TableHead className="text-xs">Empresa</TableHead>
            <TableHead className="text-xs">Venc.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const isTop = r.amount === topAmount && rows.length > 1;
            return (
              <TableRow key={r.id} className={isTop ? 'bg-muted/40' : undefined}>
                <TableCell className="text-xs sm:text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium truncate max-w-[180px] sm:max-w-[240px]">{r.partyName}</span>
                    {r.invoiceNumber ? (
                      <span className="text-[10px] sm:text-xs text-muted-foreground">NF {r.invoiceNumber}</span>
                    ) : r.description ? (
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-[240px]">
                        {r.description}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell
                  className={`text-right whitespace-nowrap text-xs sm:text-sm font-medium ${
                    tone === 'income' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {formatBRL(r.amount)}
                </TableCell>
                <TableCell className="text-xs sm:text-sm">{r.paymentMethodLabel}</TableCell>
                <TableCell className="text-xs sm:text-sm truncate max-w-[140px]">{r.organizationName}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span>{formatDateBR(r.dueDate)}</span>
                    {r.overdueFromBucketed && (
                      <Badge variant="destructive" className="h-4 px-1.5 text-[9px] sm:text-[10px] gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> atrasado
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectionDayBreakdownDialog({ open, onOpenChange, breakdown, loading, dateYmd }: Props) {
  const net = (breakdown?.totalIncome ?? 0) - (breakdown?.totalExpense ?? 0);
  const isToday =
    dateYmd != null && dateYmd === new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-left text-lg sm:text-xl">
            Composição do dia {dateYmd ? formatDateBR(dateYmd) : ''}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Recebimentos e pagamentos projetados para esta data.
            {isToday ? ' Inclui títulos vencidos sem baixa (empurrados para hoje).' : ''}
          </DialogDescription>
        </DialogHeader>

        {loading && !breakdown && (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        )}

        {breakdown && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Entradas</p>
                <p className="text-sm sm:text-lg font-semibold text-success whitespace-nowrap">
                  {formatBRL(breakdown.totalIncome)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{breakdown.receivables.length} tít.</p>
              </div>
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Saídas</p>
                <p className="text-sm sm:text-lg font-semibold text-destructive whitespace-nowrap">
                  {formatBRL(breakdown.totalExpense)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{breakdown.payables.length} tít.</p>
              </div>
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Líquido</p>
                <p
                  className={`text-sm sm:text-lg font-semibold whitespace-nowrap ${
                    net < 0 ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {formatBRL(net)}
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-success" />
                <h3 className="text-sm sm:text-base font-medium">Recebimentos</h3>
                {breakdown.receivables.length > 1 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">(linha destacada = maior valor)</span>
                )}
              </div>
              <EntryTable
                rows={breakdown.receivables}
                tone="income"
                emptyMessage="Sem recebimentos projetados para este dia."
              />
            </section>

            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-destructive" />
                <h3 className="text-sm sm:text-base font-medium">Pagamentos</h3>
                {breakdown.payables.length > 1 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">(linha destacada = maior valor — alvo de negociação)</span>
                )}
              </div>
              <EntryTable
                rows={breakdown.payables}
                tone="expense"
                emptyMessage="Sem pagamentos projetados para este dia."
              />
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
