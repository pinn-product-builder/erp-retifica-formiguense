import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { REJECTION_REASON_MIN_LENGTH } from '@/services/PurchaseOrderApprovalService';

interface RejectOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poNumber: string;
  onConfirm: (reason: string) => Promise<boolean>;
}

export function RejectOrderModal({
  open,
  onOpenChange,
  poNumber,
  onConfirm,
}: RejectOrderModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (reason.trim().length < REJECTION_REASON_MIN_LENGTH) return;
    setIsSubmitting(true);
    try {
      const ok = await onConfirm(reason.trim());
      if (ok) {
        setReason('');
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o && !isSubmitting) {
      setReason('');
      onOpenChange(false);
    }
  };

  const isValid = reason.trim().length >= REJECTION_REASON_MIN_LENGTH;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rejeitar Pedido {poNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">
              Motivo da rejeição (mínimo {REJECTION_REASON_MIN_LENGTH} caracteres)
            </Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/{REJECTION_REASON_MIN_LENGTH} caracteres mínimos
            </p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Rejeitando...
              </>
            ) : (
              'Rejeitar Pedido'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
