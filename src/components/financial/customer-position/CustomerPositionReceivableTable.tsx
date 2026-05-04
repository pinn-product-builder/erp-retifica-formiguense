import { useState } from 'react';
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBRL, formatDateBR, paymentMethodLabel } from '@/lib/financialFormat';
import type { CustomerArLine } from '@/services/financial/customerArPositionService';

type CustomerPositionReceivableTableProps = {
  loading?: boolean;
  rows: CustomerArLine[];
  emptyMessage?: string;
};

function statusBadgeVariant(display: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (display === 'Vencido') return 'destructive';
  if (display === 'Pago' || display === 'Adiantado') return 'secondary';
  if (display === 'Pendente') return 'outline';
  return 'default';
}

export function CustomerPositionReceivableTable({
  loading = false,
  rows,
  emptyMessage = 'Nenhum título encontrado para este documento.',
}: CustomerPositionReceivableTableProps) {
  const [dialogLine, setDialogLine] = useState<CustomerArLine | null>(null);

  const columns: ResponsiveTableColumn<CustomerArLine>[] = [
    {
      key: 'org',
      header: 'Empresa',
      priority: 1,
      minWidth: 120,
      render: (r) => <span className="font-medium truncate block max-w-[160px]">{r.organizationName}</span>,
      mobileLabel: 'Empresa',
    },
    {
      key: 'issue',
      header: 'Emissão',
      priority: 3,
      minWidth: 96,
      render: (r) => formatDateBR(r.issueDate),
    },
    {
      key: 'due',
      header: 'Vencimento',
      priority: 2,
      minWidth: 104,
      render: (r) => formatDateBR(r.dueDate),
    },
    {
      key: 'pay',
      header: 'Pagamento',
      priority: 4,
      minWidth: 104,
      render: (r) => formatDateBR(r.paymentDate),
    },
    {
      key: 'orig',
      header: 'Original',
      priority: 5,
      minWidth: 100,
      render: (r) => <span className="whitespace-nowrap">{formatBRL(r.originalAmount)}</span>,
    },
    {
      key: 'pend',
      header: 'Pendente',
      priority: 6,
      minWidth: 100,
      render: (r) => <span className="whitespace-nowrap">{formatBRL(r.pendingAmount)}</span>,
    },
    {
      key: 'pago',
      header: 'Pago',
      priority: 7,
      minWidth: 100,
      render: (r) => <span className="whitespace-nowrap">{formatBRL(r.paidAmount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      priority: 2,
      minWidth: 110,
      render: (r) => (
        <Badge variant={statusBadgeVariant(r.displayStatus)} className="text-xs whitespace-nowrap">
          {r.displayStatus}
        </Badge>
      ),
    },
    {
      key: 'pm',
      header: 'Forma',
      priority: 8,
      minWidth: 120,
      hideInMobile: true,
      render: (r) => <span className="truncate block max-w-[140px]">{r.paymentMethodLabel}</span>,
    },
    {
      key: 'hist',
      header: '',
      priority: 9,
      minWidth: 108,
      render: (r) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setDialogLine(r)}
        >
          Recebimentos
        </Button>
      ),
    },
  ];

  if (loading && rows.length === 0) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground text-sm">Carregando títulos…</div>
    );
  }

  return (
    <>
      <ResponsiveTable
        data={rows}
        columns={columns}
        keyExtractor={(r) => r.id}
        emptyMessage={emptyMessage}
        className="min-w-0"
        renderMobileCard={(r) => (
          <div className="rounded-lg border p-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2 min-w-0">
              <span className="font-medium truncate">{r.organizationName}</span>
              <Badge variant={statusBadgeVariant(r.displayStatus)} className="shrink-0 text-xs">
                {r.displayStatus}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:text-sm">
              <span className="text-muted-foreground">Emissão</span>
              <span>{formatDateBR(r.issueDate)}</span>
              <span className="text-muted-foreground">Venc.</span>
              <span>{formatDateBR(r.dueDate)}</span>
              <span className="text-muted-foreground">Pag.</span>
              <span>{formatDateBR(r.paymentDate)}</span>
              <span className="text-muted-foreground">Pendente</span>
              <span className="whitespace-nowrap">{formatBRL(r.pendingAmount)}</span>
              <span className="text-muted-foreground">Pago</span>
              <span className="whitespace-nowrap">{formatBRL(r.paidAmount)}</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => setDialogLine(r)}
            >
              Ver recebimentos ({r.receiptLines.length})
            </Button>
          </div>
        )}
      />

      <Dialog open={dialogLine != null} onOpenChange={(o) => !o && setDialogLine(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-left text-lg sm:text-xl">Recebimentos do título</DialogTitle>
          </DialogHeader>
          {dialogLine && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {dialogLine.organizationName} · Venc. {formatDateBR(dialogLine.dueDate)}
              </p>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Forma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dialogLine.receiptLines.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{formatDateBR(h.received_at)}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatBRL(h.amount_received)}
                        </TableCell>
                        <TableCell>{paymentMethodLabel(h.payment_method)}</TableCell>
                      </TableRow>
                    ))}
                    {dialogLine.receiptLines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground">
                          Sem lançamentos em recebimentos (valores podem estar só no título).
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogLine(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
