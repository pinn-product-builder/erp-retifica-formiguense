import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package } from 'lucide-react';
import { usePurchaseReceipts } from '@/hooks/usePurchaseReceipts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

interface ReceiveOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrderId: string;
  onSuccess?: () => void;
}

interface OrderItem {
  id: string;
  item_name: string;
  description?: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
}

export function ReceiveOrderModal({
  open,
  onOpenChange,
  purchaseOrderId,
  onSuccess,
}: ReceiveOrderModalProps) {
  const { createReceipt, loading } = usePurchaseReceipts();
  const { currentOrganization } = useOrganization();
  
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [receiptData, setReceiptData] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  
  const [itemsToReceive, setItemsToReceive] = useState<Record<string, {
    received: number;
    notes: string;
  }>>({});

  useEffect(() => {
    if (open && purchaseOrderId) {
      fetchOrderItems();
    }
  }, [open, purchaseOrderId]);

  const fetchOrderItems = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', purchaseOrderId);

      if (error) throw error;

      setOrderItems((data || []) as OrderItem[]);
      
      // Inicializar quantidades a receber
      const initial: Record<string, { received: number; notes: string }> = {};
      (data || []).forEach((item: OrderItem) => {
        const remaining = item.quantity - item.received_quantity;
        initial[item.id] = {
          received: remaining,
          notes: '',
        };
      });
      setItemsToReceive(initial);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const handleReceive = async () => {
    const items = orderItems
      .filter(item => itemsToReceive[item.id]?.received > 0)
      .map(item => ({
        purchase_order_item_id: item.id,
        ordered_quantity: item.quantity,
        received_quantity: itemsToReceive[item.id].received,
        unit_cost: item.unit_price,
        divergence_reason: itemsToReceive[item.id].received !== (item.quantity - item.received_quantity)
          ? itemsToReceive[item.id].notes || 'Divergência na quantidade'
          : undefined,
        quality_status: 'approved' as const,
      }));

    if (items.length === 0) {
      alert('Informe pelo menos um item a receber');
      return;
    }

    const receipt = await createReceipt({
      purchase_order_id: purchaseOrderId,
      receipt_date: receiptData.receipt_date,
      notes: receiptData.notes,
      items,
    });

    if (receipt) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setItemsToReceive(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        received: Math.max(0, quantity),
      },
    }));
  };

  const totalToReceive = orderItems.reduce(
    (sum, item) => sum + (itemsToReceive[item.id]?.received || 0),
    0
  );

  const hasDivergences = orderItems.some(
    item => {
      const remaining = item.quantity - item.received_quantity;
      return itemsToReceive[item.id]?.received !== remaining;
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receber Pedido de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data do Recebimento */}
          <div>
            <Label htmlFor="receipt_date">Data do Recebimento</Label>
            <Input
              id="receipt_date"
              type="date"
              value={receiptData.receipt_date}
              onChange={(e) =>
                setReceiptData({ ...receiptData, receipt_date: e.target.value })
              }
            />
          </div>

          {/* Alerta de Divergências */}
          {hasDivergences && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Há divergências entre as quantidades pedidas e recebidas. Adicione observações se necessário.
              </AlertDescription>
            </Alert>
          )}

          {/* Lista de Itens */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Itens do Pedido</h3>
            {orderItems.map((item) => {
              const remaining = item.quantity - item.received_quantity;
              const toReceive = itemsToReceive[item.id]?.received || 0;
              const hasDivergence = toReceive !== remaining;

              return (
                <div key={item.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{item.item_name}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <div className="flex gap-4 text-sm mt-1">
                        <span>Pedido: {item.quantity}</span>
                        <span>Já recebido: {item.received_quantity}</span>
                        <span className="font-semibold">Restante: {remaining}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <Label className="text-xs">Receber</Label>
                        <Input
                          type="number"
                          min="0"
                          max={remaining}
                          value={toReceive}
                          onChange={(e) =>
                            updateItemQuantity(item.id, parseInt(e.target.value) || 0)
                          }
                          className="text-right"
                        />
                      </div>
                      {hasDivergence && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                          Divergência
                        </Badge>
                      )}
                    </div>
                  </div>

                  {hasDivergence && (
                    <div className="mt-2">
                      <Label className="text-xs">Motivo da Divergência</Label>
                      <Input
                        placeholder="Ex: Produto danificado, quantidade incorreta..."
                        value={itemsToReceive[item.id]?.notes || ''}
                        onChange={(e) =>
                          setItemsToReceive(prev => ({
                            ...prev,
                            [item.id]: {
                              ...prev[item.id],
                              notes: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Observações Gerais */}
          <div>
            <Label htmlFor="notes">Observações Gerais</Label>
            <Textarea
              id="notes"
              value={receiptData.notes}
              onChange={(e) =>
                setReceiptData({ ...receiptData, notes: e.target.value })
              }
              placeholder="Observações sobre o recebimento..."
              rows={3}
            />
          </div>

          {/* Resumo */}
          <Alert>
            <AlertDescription>
              <div className="flex justify-between">
                <span>Total de itens a receber:</span>
                <span className="font-semibold">{totalToReceive} unidade(s)</span>
              </div>
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReceive} disabled={loading || totalToReceive === 0}>
              {loading ? 'Processando...' : 'Confirmar Recebimento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

