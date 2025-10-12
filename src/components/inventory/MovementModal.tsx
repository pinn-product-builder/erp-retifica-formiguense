import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MovementForm } from './MovementForm';

interface MovementModalProps {
  trigger?: React.ReactNode;
  partId?: string;
  orderId?: string;
  onSuccess?: () => void;
}

/**
 * Modal para criar movimentações de estoque rapidamente
 * Pode ser usado com trigger customizado ou botão padrão
 */
export function MovementModal({ 
  trigger, 
  partId, 
  orderId, 
  onSuccess 
}: MovementModalProps) {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação de Estoque</DialogTitle>
        </DialogHeader>
        <MovementForm 
          preselectedPartId={partId}
          preselectedOrderId={orderId}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

