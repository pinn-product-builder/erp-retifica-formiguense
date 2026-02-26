import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Badge }    from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RotateCcw, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSupplierReturns } from '@/hooks/useSupplierReturns';
import {
  RETURN_STATUS_LABELS, RETURN_STATUS_COLORS,
  type ReturnStatus, type SupplierReturn,
} from '@/services/SupplierReturnService';
import { SupplierCreditService } from '@/services/SupplierCreditService';

const NEXT_STATUSES: Record<ReturnStatus, ReturnStatus[]> = {
  pendente:  ['enviada', 'recusada'],
  enviada:   ['aceita',  'recusada'],
  aceita:    [],
  recusada:  [],
};

interface ReturnStatusModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  supplierReturn: SupplierReturn | null;
  onSuccess?:   () => void;
}

export function ReturnStatusModal({
  open, onOpenChange, supplierReturn, onSuccess,
}: ReturnStatusModalProps) {
  const { updateStatus } = useSupplierReturns();
  const { currentOrganization } = useOrganization();
  const [newStatus,        setNewStatus]        = useState<ReturnStatus | ''>('');
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [creditNoteDate,   setCreditNoteDate]   = useState('');
  const [saving,           setSaving]           = useState(false);

  if (!supplierReturn) return null;

  const allowedStatuses = NEXT_STATUSES[supplierReturn.status];
  const needsCreditNote = newStatus === 'aceita';

  const handleSave = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      const ok = await updateStatus(
        supplierReturn.id,
        newStatus,
        needsCreditNote ? creditNoteNumber || undefined : undefined,
        needsCreditNote ? creditNoteDate   || undefined : undefined,
      );

      if (ok && newStatus === 'aceita' && currentOrganization?.id && supplierReturn.total_amount > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        await SupplierCreditService.createFromReturn({
          orgId:       currentOrganization.id,
          supplierId:  supplierReturn.supplier_id,
          returnId:    supplierReturn.id,
          amount:      supplierReturn.total_amount,
          description: `Crédito por devolução ${supplierReturn.return_number}${creditNoteNumber ? ` — NC ${creditNoteNumber}` : ''}`,
          createdBy:   user?.id ?? '',
        });
      }

      if (ok) { onSuccess?.(); onOpenChange(false); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <RotateCcw className="w-4 h-4" />
            Atualizar Status da Devolução
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-xs sm:text-sm space-y-1">
            <p><span className="text-muted-foreground">Devolução:</span> <strong>{supplierReturn.return_number}</strong></p>
            <p><span className="text-muted-foreground">Fornecedor:</span> <strong>{supplierReturn.supplier?.name ?? '—'}</strong></p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Status atual:</span>
              <Badge className={`text-[10px] ${RETURN_STATUS_COLORS[supplierReturn.status]}`}>
                {RETURN_STATUS_LABELS[supplierReturn.status]}
              </Badge>
            </p>
          </div>

          {allowedStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              Esta devolução já está em status final e não pode ser alterada.
            </p>
          ) : (
            <>
              <div>
                <Label className="text-xs sm:text-sm">Novo Status *</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as ReturnStatus)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o novo status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedStatuses.map(s => (
                      <SelectItem key={s} value={s}>
                        <Badge className={`text-[10px] mr-2 ${RETURN_STATUS_COLORS[s]}`}>{RETURN_STATUS_LABELS[s]}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {needsCreditNote && (
                <div className="space-y-3 border rounded-lg p-3 bg-green-50/50 border-green-200">
                  <p className="text-xs font-medium text-green-700">Nota de Crédito do Fornecedor</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Número da Nota de Crédito</Label>
                      <Input
                        value={creditNoteNumber}
                        onChange={e => setCreditNoteNumber(e.target.value)}
                        placeholder="NC-12345"
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data da Nota de Crédito</Label>
                      <Input
                        type="date"
                        value={creditNoteDate}
                        onChange={e => setCreditNoteDate(e.target.value)}
                        className="mt-1 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {allowedStatuses.length > 0 && (
            <Button size="sm" onClick={handleSave} disabled={saving || !newStatus}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Atualizar Status
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
