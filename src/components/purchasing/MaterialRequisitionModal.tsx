import React, { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useMaterialRequisitions, type MaterialRequisitionItem } from '@/hooks/useMaterialRequisitions';
import { useOrders } from '@/hooks/useOrders';
import { usePartsInventory, type PartInventory } from '@/hooks/usePartsInventory';
import { useToast } from '@/hooks/use-toast';

interface MaterialRequisitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedPart?: {
    part_id?: string;
    part_code: string;
    part_name: string;
    shortage_quantity: number;
  };
  onSuccess?: () => void;
}

interface DraftItem {
  part_id?: string;
  part_code: string;
  part_name: string;
  quantity_required: number;
  quantity_available: number;
  quantity_to_purchase: number;
  status: MaterialRequisitionItem['status'];
  checked: boolean;
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  disponivel: { label: 'Disponível', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  compra_pendente: { label: 'Comprar', color: 'bg-red-100 text-red-800', icon: ShoppingCart },
  reservado: { label: 'Reservado', color: 'bg-blue-100 text-blue-800', icon: Package },
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  aguardando: { label: 'Aguardando', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  recebido: { label: 'Recebido', color: 'bg-green-200 text-green-900', icon: CheckCircle },
};

export default function MaterialRequisitionModal({
  open,
  onOpenChange,
  preselectedPart,
  onSuccess,
}: MaterialRequisitionModalProps) {
  const { createRequisition, generatePurchaseNeeds, checkPartsAvailability, loading } = useMaterialRequisitions();
  const { orders, fetchOrders } = useOrders();
  const { parts, fetchParts, loading: loadingParts } = usePartsInventory();
  const { toast } = useToast();

  const [serviceOrderId, setServiceOrderId] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [partSearch, setPartSearch] = useState<Record<number, string>>({});
  const [showSearch, setShowSearch] = useState<Record<number, boolean>>({});
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [generatingNeeds, setGeneratingNeeds] = useState(false);
  const [createdRequisitionId, setCreatedRequisitionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchOrders();
      fetchParts({ search: '' });
      setServiceOrderId('');
      setRequiredDate('');
      setNotes('');
      setAvailabilityChecked(false);
      setCreatedRequisitionId(null);

      if (preselectedPart) {
        setItems([{
          part_id: preselectedPart.part_id,
          part_code: preselectedPart.part_code,
          part_name: preselectedPart.part_name,
          quantity_required: preselectedPart.shortage_quantity,
          quantity_available: 0,
          quantity_to_purchase: preselectedPart.shortage_quantity,
          status: 'pendente',
          checked: false,
        }]);
      } else {
        setItems([{
          part_code: '',
          part_name: '',
          quantity_required: 1,
          quantity_available: 0,
          quantity_to_purchase: 1,
          status: 'pendente',
          checked: false,
        }]);
      }
    }
  }, [open, preselectedPart, fetchOrders, fetchParts]);

  const filteredParts = useCallback(
    (search: string) =>
      parts.filter(
        (p) =>
          p.part_name.toLowerCase().includes(search.toLowerCase()) ||
          (p.part_code ?? '').toLowerCase().includes(search.toLowerCase())
      ),
    [parts]
  );

  const handleSelectPart = (index: number, part: PartInventory) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        part_id: part.id,
        part_code: part.part_code ?? '',
        part_name: part.part_name,
        quantity_available: 0,
        quantity_to_purchase: updated[index].quantity_required,
        status: 'pendente',
        checked: false,
      };
      return updated;
    });
    setShowSearch((prev) => ({ ...prev, [index]: false }));
    setAvailabilityChecked(false);
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { part_code: '', part_name: '', quantity_required: 1, quantity_available: 0, quantity_to_purchase: 1, status: 'pendente', checked: false },
    ]);
    setAvailabilityChecked(false);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setAvailabilityChecked(false);
  };

  const updateQuantity = (index: number, value: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const qty = Math.max(1, value);
      updated[index] = {
        ...updated[index],
        quantity_required: qty,
        quantity_to_purchase: Math.max(0, qty - updated[index].quantity_available),
        status: 'pendente',
      };
      return updated;
    });
    setAvailabilityChecked(false);
  };

  const handleCheckAvailability = async () => {
    const validItems = items.filter((i) => i.part_code);
    if (validItems.length === 0) {
      toast({ title: 'Atenção', description: 'Adicione ao menos uma peça para verificar disponibilidade', variant: 'destructive' });
      return;
    }

    setCheckingAvailability(true);
    try {
      const checked = await checkPartsAvailability(
        validItems.map((i) => ({
          part_id: i.part_id,
          part_code: i.part_code,
          part_name: i.part_name,
          quantity_required: i.quantity_required,
        }))
      );

      setItems((prev) => {
        const updated = [...prev];
        checked.forEach((checkedItem, idx) => {
          const originalIdx = prev.findIndex((p) => p.part_code === checkedItem.part_code);
          if (originalIdx !== -1) {
            updated[originalIdx] = {
              ...updated[originalIdx],
              quantity_available: checkedItem.quantity_available ?? 0,
              quantity_to_purchase: checkedItem.quantity_to_purchase ?? updated[originalIdx].quantity_required,
              status: checkedItem.status as MaterialRequisitionItem['status'],
              checked: true,
            };
          }
        });
        return updated;
      });
      setAvailabilityChecked(true);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    if (!requiredDate) {
      toast({ title: 'Atenção', description: 'Informe a data necessária', variant: 'destructive' });
      return;
    }
    const validItems = items.filter((i) => i.part_code && i.quantity_required > 0);
    if (validItems.length === 0) {
      toast({ title: 'Atenção', description: 'Adicione ao menos uma peça', variant: 'destructive' });
      return;
    }

    const selectedOrder = orders.find((o) => o.id === serviceOrderId);

    const result = await createRequisition({
      service_order_id: serviceOrderId || undefined,
      service_order_number: selectedOrder?.order_number,
      required_date: requiredDate,
      notes,
      items: validItems.map((i) => ({
        part_id: i.part_id,
        part_code: i.part_code,
        part_name: i.part_name,
        quantity_required: i.quantity_required,
        quantity_available: i.quantity_available,
        quantity_reserved: 0,
        quantity_to_purchase: i.quantity_to_purchase,
        status: i.status,
      })),
    });

    if (result) {
      setCreatedRequisitionId(result.id);
      setItems((prev) => prev.map((item, idx) => {
        const resultItem = result.items?.[idx];
        return { ...item, ...(resultItem ? { status: resultItem.status as MaterialRequisitionItem['status'] } : {}) };
      }));
    }
  };

  const handleGenerateNeeds = async () => {
    if (!createdRequisitionId) return;

    const itemsToOrder = items
      .filter((i) => i.quantity_to_purchase > 0 && i.part_code)
      .map((i) => ({
        part_id: i.part_id,
        part_code: i.part_code,
        part_name: i.part_name,
        quantity_required: i.quantity_required,
        quantity_available: i.quantity_available,
        quantity_reserved: 0,
        quantity_to_purchase: i.quantity_to_purchase,
        status: i.status,
      }));

    if (itemsToOrder.length === 0) {
      toast({ title: 'Atenção', description: 'Não há itens para comprar', variant: 'destructive' });
      return;
    }

    setGeneratingNeeds(true);
    try {
      await generatePurchaseNeeds(createdRequisitionId, itemsToOrder);
      onSuccess?.();
      onOpenChange(false);
    } finally {
      setGeneratingNeeds(false);
    }
  };

  const toOrderItems = items.filter((i) => i.quantity_to_purchase > 0 && i.checked);
  const availableItems = items.filter((i) => i.quantity_to_purchase === 0 && i.checked);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Requisição de Materiais</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados da OS e data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Ordem de Serviço (opcional)</Label>
              <Select value={serviceOrderId} onValueChange={setServiceOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma OS..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Necessária *</Label>
              <Input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a requisição..."
              rows={2}
            />
          </div>

          {/* Itens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Peças Necessárias</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={!!createdRequisitionId}>
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Adicionar Peça</span>
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const statusConfig = STATUS_LABEL[item.status] ?? STATUS_LABEL.pendente;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={index}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-1 space-y-2">
                          {/* Busca da peça */}
                          <div className="relative">
                            <Label className="text-xs">Buscar Peça</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                              <Input
                                className="pl-10"
                                placeholder="Digite para buscar..."
                                value={showSearch[index] ? (partSearch[index] ?? '') : item.part_name}
                                onChange={(e) => {
                                  setPartSearch((prev) => ({ ...prev, [index]: e.target.value }));
                                  setShowSearch((prev) => ({ ...prev, [index]: true }));
                                }}
                                onFocus={() => setShowSearch((prev) => ({ ...prev, [index]: true }))}
                                disabled={!!createdRequisitionId}
                              />
                              {showSearch[index] && (partSearch[index] ?? '').length > 0 && (
                                <div className="absolute z-20 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {loadingParts ? (
                                    <div className="p-2 text-sm text-muted-foreground">Buscando...</div>
                                  ) : filteredParts(partSearch[index] ?? '').length > 0 ? (
                                    filteredParts(partSearch[index] ?? '').map((part) => (
                                      <div
                                        key={part.id}
                                        className="p-2 hover:bg-accent cursor-pointer border-b"
                                        onClick={() => handleSelectPart(index, part)}
                                      >
                                        <div className="font-medium text-sm">{part.part_name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {part.part_code} • Estoque: {part.quantity}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-2 text-sm text-muted-foreground">Nenhuma peça encontrada</div>
                                  )}
                                </div>
                              )}
                            </div>
                            {item.part_id && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                <Package className="w-3 h-3 mr-1" />
                                Peça do estoque
                              </Badge>
                            )}
                          </div>

                          {/* Quantidade e status */}
                          <div className="flex items-end gap-2 sm:gap-3">
                            <div className="w-28 sm:w-32">
                              <Label className="text-xs">Qtd. Necessária</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity_required}
                                onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                disabled={!!createdRequisitionId}
                              />
                            </div>

                            {item.checked && (
                              <>
                                <div className="w-24 sm:w-28">
                                  <Label className="text-xs">Disponível</Label>
                                  <div className="h-10 px-3 py-2 border rounded-md bg-muted text-sm flex items-center">
                                    {item.quantity_available}
                                  </div>
                                </div>
                                <div className="w-24 sm:w-28">
                                  <Label className="text-xs text-red-600">A Comprar</Label>
                                  <div className="h-10 px-3 py-2 border rounded-md bg-red-50 text-sm flex items-center font-semibold text-red-700">
                                    {item.quantity_to_purchase}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs">Status</Label>
                                  <Badge className={`${statusConfig.color} flex items-center gap-1 mt-1`}>
                                    <StatusIcon className="w-3 h-3" />
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {items.length > 1 && !createdRequisitionId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 mt-5 flex-shrink-0"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Resumo após verificação */}
          {availabilityChecked && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-blue-800">Resumo de Disponibilidade</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-blue-700">
                      <span>
                        <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                        Disponível: <strong>{availableItems.length}</strong> {availableItems.length === 1 ? 'item' : 'itens'}
                      </span>
                      <span>
                        <ShoppingCart className="w-3 h-3 inline mr-1 text-red-600" />
                        A comprar: <strong>{toOrderItems.length}</strong> {toOrderItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerta de necessidades de compra */}
          {createdRequisitionId && toOrderItems.length > 0 && (
            <Alert>
              <ShoppingCart className="h-4 w-4" />
              <AlertDescription>
                <strong>{toOrderItems.length} {toOrderItems.length === 1 ? 'item precisa' : 'itens precisam'} de compra.</strong>
                {' '}Gerar necessidades de compra para o setor de compras?
              </AlertDescription>
            </Alert>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {createdRequisitionId ? 'Fechar' : 'Cancelar'}
            </Button>

            {!createdRequisitionId && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckAvailability}
                  disabled={checkingAvailability || items.every((i) => !i.part_code)}
                  className="w-full sm:w-auto"
                >
                  {checkingAvailability ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4 mr-2" />
                  )}
                  Verificar Disponibilidade
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !requiredDate || items.every((i) => !i.part_code)}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Salvando...' : 'Salvar Requisição'}
                </Button>
              </>
            )}

            {createdRequisitionId && toOrderItems.length > 0 && (
              <Button
                type="button"
                onClick={handleGenerateNeeds}
                disabled={generatingNeeds}
                className="w-full sm:w-auto"
              >
                {generatingNeeds ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                Gerar Necessidades de Compra
              </Button>
            )}

            {createdRequisitionId && toOrderItems.length === 0 && (
              <Button
                type="button"
                onClick={() => {
                  onSuccess?.();
                  onOpenChange(false);
                }}
                className="w-full sm:w-auto"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Concluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
