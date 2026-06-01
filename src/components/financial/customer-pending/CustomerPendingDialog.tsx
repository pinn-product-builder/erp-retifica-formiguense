import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';
import type { CustomerPendingResult } from '@/services/financial/customerPendingService';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CustomerPendingResult | null;
  customerName?: string | null;
  /** "Abertura de OS", "Emissão de NF", etc. */
  contextLabel: string;
  /** True quando o usuário atual pode sobrescrever o bloqueio (gestor). */
  canOverride: boolean;
  /** Chamado quando o gestor confirma a autorização. Recebe o motivo. */
  onAuthorize: (reason: string) => void | Promise<void>;
};

export function CustomerPendingDialog({
  open,
  onOpenChange,
  result,
  customerName,
  contextLabel,
  canOverride,
  onAuthorize,
}: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasPending = !!result?.hasPending;

  const handleAuthorize = async () => {
    if (!reason.trim() || reason.trim().length < 5) return;
    try {
      setSubmitting(true);
      await onAuthorize(reason.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason('');
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left text-lg sm:text-xl">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Pendências financeiras
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {customerName ? <span className="font-medium text-foreground">{customerName}</span> : 'Este cliente'}{' '}
            possui títulos em aberto. {contextLabel} requer autorização do gestor para prosseguir.
          </DialogDescription>
        </DialogHeader>

        {hasPending && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total em aberto</p>
                <p className="text-sm sm:text-lg font-semibold whitespace-nowrap">{formatBRL(result.totalOpen)}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{result.items.length} título(s)</p>
              </div>
              <div className="rounded-lg border p-2 sm:p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Vencido</p>
                <p className="text-sm sm:text-lg font-semibold text-destructive whitespace-nowrap">
                  {formatBRL(result.totalOverdue)}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {result.items.filter((i) => i.isOverdue).length} título(s)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-md border max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Venc.</TableHead>
                    <TableHead className="text-xs">NF</TableHead>
                    <TableHead className="text-xs text-right whitespace-nowrap">Valor</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="text-xs whitespace-nowrap">{formatDateBR(it.dueDate)}</TableCell>
                      <TableCell className="text-xs">{it.invoiceNumber ?? '—'}</TableCell>
                      <TableCell className="text-xs text-right whitespace-nowrap">
                        {formatBRL(it.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={it.isOverdue ? 'destructive' : 'outline'}
                          className="text-[10px] sm:text-xs"
                        >
                          {it.isOverdue ? 'Vencido' : 'Em aberto'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {canOverride ? (
              <div className="space-y-2 rounded-lg border border-warning/60 bg-warning/10 p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <p className="text-sm font-medium">Autorização do gestor</p>
                </div>
                <Label htmlFor="cust-pending-reason" className="text-xs">
                  Motivo (mínimo 5 caracteres)
                </Label>
                <Textarea
                  id="cust-pending-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex.: cliente já regularizou via PIX hoje, comprovante anexado em outro canal."
                  rows={3}
                />
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Você não tem permissão para autorizar. Solicite a um gestor responsável.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {hasPending && canOverride && (
            <Button
              type="button"
              variant="destructive"
              disabled={submitting || reason.trim().length < 5}
              onClick={() => void handleAuthorize()}
            >
              {submitting ? 'Autorizando…' : 'Autorizar e prosseguir'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
