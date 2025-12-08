// @ts-nocheck
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Package, Upload, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { usePurchaseReceipts } from '@/hooks/usePurchaseReceipts';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/utils';

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
  part_id?: string; // ID da peça no estoque
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier?: {
    id: string;
    name: string;
  };
  expected_delivery?: string;
  total_value: number;
}

interface ReceiptItem {
  purchase_order_item_id: string;
  part_id?: string; // ID da peça no estoque (vem do purchase_order_item)
  received_quantity: number;
  approved_quantity: number;
  rejected_quantity: number;
  rejection_reason?: string;
  unit_cost?: number;
  quality_status: string;
  quality_notes?: string;
  lot_number?: string;
  expiry_date?: string;
  warehouse_location?: string;
}

export function ReceiveOrderModal({
  open,
  onOpenChange,
  purchaseOrderId,
  onSuccess,
}: ReceiveOrderModalProps) {
  const { createReceipt, evaluateSupplier, loading } = usePurchaseReceipts();
  const { currentOrganization } = useOrganization();
  
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [receiptData, setReceiptData] = useState({
    receipt_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    invoice_date: '',
    invoice_url: '',
    notes: '',
  });
  
  const [receiptItems, setReceiptItems] = useState<Record<string, ReceiptItem>>({});
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluation, setEvaluation] = useState({
    delivery_rating: 5,
    quality_rating: 5,
    price_rating: 5,
    service_rating: 5,
    delivered_on_time: true,
    had_quality_issues: false,
    comments: '',
  });

  useEffect(() => {
    if (open && purchaseOrderId) {
      fetchOrderData();
    }
  }, [open, purchaseOrderId]);

  const fetchOrderData = async () => {
    try {
      // Fetch purchase order details
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name)
        `)
        .eq('id', purchaseOrderId)
        .single();

      if (poError) throw poError;
      setPurchaseOrder(poData);

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', purchaseOrderId);

      if (itemsError) throw itemsError;

      // Fetch received quantities for each item and initialize receipt items
      let itemsWithReceived: OrderItem[] = [];
      
      if (itemsData && itemsData.length > 0) {
        const itemIds = itemsData.map(item => item.id);
        
        const { data: receivedData, error: receivedError } = await supabase
          .from('purchase_receipt_items')
          .select(`
            purchase_order_item_id,
            received_quantity
          `)
          .in('purchase_order_item_id', itemIds);

        if (receivedError) throw receivedError;

        // Calculate total received quantities per item
        const receivedQuantities = (receivedData || []).reduce((acc, item) => {
          acc[item.purchase_order_item_id] = (acc[item.purchase_order_item_id] || 0) + item.received_quantity;
          return acc;
        }, {} as Record<string, number>);

        // Add received quantities to items
        itemsWithReceived = itemsData.map(item => ({
          ...item,
          received_quantity: receivedQuantities[item.id] || 0
        })) as OrderItem[];

        setOrderItems(itemsWithReceived);

        // Initialize receipt items with remaining quantities
        const initialItems: Record<string, ReceiptItem> = {};
        itemsWithReceived.forEach((item) => {
          const remaining = Math.max(0, item.quantity - item.received_quantity);
          initialItems[item.id] = {
            purchase_order_item_id: item.id,
            part_id: item.part_id, // Incluir part_id do pedido
            received_quantity: remaining,
            approved_quantity: remaining,
            rejected_quantity: 0,
            rejection_reason: '',
            unit_cost: item.unit_price,
            quality_status: 'under_review',
            quality_notes: '',
            lot_number: '',
            expiry_date: '',
            warehouse_location: '',
          };
        });
        setReceiptItems(initialItems);
      } else {
        setOrderItems([]);
        setReceiptItems({});
      }

      // Check if delivery is on time
      if (poData.expected_delivery) {
        const expectedDate = new Date(poData.expected_delivery);
        const today = new Date();
        setEvaluation(prev => ({
          ...prev,
          delivered_on_time: today <= expectedDate,
        }));
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
    }
  };

  const handleReceive = async () => {
    const items = Object.values(receiptItems).filter(item => item.received_quantity > 0);

    if (items.length === 0) {
      alert('Informe pelo menos um item a receber');
      return;
    }

    const receipt = await createReceipt({
      purchase_order_id: purchaseOrderId,
      receipt_date: receiptData.receipt_date,
      invoice_number: receiptData.invoice_number || undefined,
      invoice_date: receiptData.invoice_date || undefined,
      invoice_url: receiptData.invoice_url || undefined,
      notes: receiptData.notes || undefined,
      items,
    });

    if (receipt) {
      setShowEvaluation(true);
    }
  };

  const handleEvaluationSubmit = async () => {
    if (purchaseOrder?.supplier?.id) {
      await evaluateSupplier({
        supplier_id: purchaseOrder.supplier.id,
        purchase_order_id: purchaseOrderId,
        delivery_rating: evaluation.delivery_rating,
        quality_rating: evaluation.quality_rating,
        price_rating: evaluation.price_rating,
        service_rating: evaluation.service_rating,
        delivered_on_time: evaluation.delivered_on_time,
        had_quality_issues: evaluation.had_quality_issues,
        comments: evaluation.comments,
      });
    }

    onOpenChange(false);
    onSuccess?.();
  };

  const updateReceiptItem = (itemId: string, field: keyof ReceiptItem, value: unknown) => {
    setReceiptItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));

    // Auto-calculate approved quantity when received quantity changes
    if (field === 'received_quantity') {
      const rejectedQty = receiptItems[itemId]?.rejected_quantity || 0;
      setReceiptItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          approved_quantity: Math.max(0, value - rejectedQty),
        },
      }));
    }

    // Auto-calculate approved quantity when rejected quantity changes
    if (field === 'rejected_quantity') {
      const receivedQty = receiptItems[itemId]?.received_quantity || 0;
      setReceiptItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          approved_quantity: Math.max(0, receivedQty - value),
        },
      }));
    }
  };

  const totalToReceive = Object.values(receiptItems).reduce(
    (sum, item) => sum + item.received_quantity,
    0
  );

  const totalValue = Object.values(receiptItems).reduce(
    (sum, item) => sum + (item.received_quantity * (item.unit_cost || 0)),
    0
  );

  const hasDivergences = orderItems.some(item => {
    const remaining = item.quantity - item.received_quantity;
    const receiptItem = receiptItems[item.id];
    return receiptItem?.received_quantity !== remaining || receiptItem?.rejected_quantity > 0;
  });

  const hasQualityIssues = Object.values(receiptItems).some(
    item => item.quality_status === 'rejected' || item.rejected_quantity > 0
  );

  if (showEvaluation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avaliar Fornecedor
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg font-medium">Recebimento registrado com sucesso!</p>
              <p className="text-muted-foreground">
                Avalie o fornecedor {purchaseOrder?.supplier?.name} para este pedido
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pontualidade de Entrega (1-5)</Label>
                <Select 
                  value={evaluation.delivery_rating.toString()} 
                  onValueChange={(value) => setEvaluation(prev => ({ ...prev, delivery_rating: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} estrela{rating > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Qualidade dos Produtos (1-5)</Label>
                <Select 
                  value={evaluation.quality_rating.toString()} 
                  onValueChange={(value) => setEvaluation(prev => ({ ...prev, quality_rating: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} estrela{rating > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Competitividade de Preço (1-5)</Label>
                <Select 
                  value={evaluation.price_rating.toString()} 
                  onValueChange={(value) => setEvaluation(prev => ({ ...prev, price_rating: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} estrela{rating > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Atendimento (1-5)</Label>
                <Select 
                  value={evaluation.service_rating.toString()} 
                  onValueChange={(value) => setEvaluation(prev => ({ ...prev, service_rating: Number(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} estrela{rating > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="on_time"
                  checked={evaluation.delivered_on_time}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, delivered_on_time: e.target.checked }))}
                />
                <Label htmlFor="on_time">Entrega foi pontual</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="quality_issues"
                  checked={evaluation.had_quality_issues}
                  onChange={(e) => setEvaluation(prev => ({ ...prev, had_quality_issues: e.target.checked }))}
                />
                <Label htmlFor="quality_issues">Houve problemas de qualidade</Label>
              </div>
            </div>

            <div>
              <Label>Comentários</Label>
              <Textarea
                value={evaluation.comments}
                onChange={(e) => setEvaluation(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Comentários adicionais sobre o fornecedor..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowEvaluation(false); onOpenChange(false); onSuccess?.(); }}>
                Pular Avaliação
              </Button>
              <Button onClick={handleEvaluationSubmit} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Avaliação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receber Pedido de Compra - {purchaseOrder?.po_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Purchase Order Info */}
          {purchaseOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Fornecedor:</strong> {purchaseOrder.supplier?.name}</p>
                <p><strong>Valor Total:</strong> {formatCurrency(purchaseOrder.total_value)}</p>
                {purchaseOrder.expected_delivery && (
                  <p><strong>Entrega Esperada:</strong> {new Date(purchaseOrder.expected_delivery).toLocaleDateString()}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Progress Summary */}
          {orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo do Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totalOrdered = orderItems.reduce((sum, item) => sum + item.quantity, 0);
                  const totalReceived = orderItems.reduce((sum, item) => sum + item.received_quantity, 0);
                  const totalRemaining = totalOrdered - totalReceived;
                  const progressPercentage = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
                  
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{totalOrdered}</div>
                          <div className="text-muted-foreground">Total Pedido</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{totalReceived}</div>
                          <div className="text-muted-foreground">Já Recebido</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{totalRemaining}</div>
                          <div className="text-muted-foreground">Restante</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso Geral</span>
                          <span className="font-medium">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Receipt Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Data do Recebimento *</Label>
              <Input
                type="date"
                value={receiptData.receipt_date}
                onChange={(e) => setReceiptData(prev => ({ ...prev, receipt_date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Número da Nota Fiscal</Label>
              <Input
                value={receiptData.invoice_number}
                onChange={(e) => setReceiptData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="Ex: NF-123456"
              />
            </div>
            
            <div>
              <Label>Data da Nota Fiscal</Label>
              <Input
                type="date"
                value={receiptData.invoice_date}
                onChange={(e) => setReceiptData(prev => ({ ...prev, invoice_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>URL da Nota Fiscal (PDF/Foto)</Label>
            <div className="flex gap-2">
              <Input
                value={receiptData.invoice_url}
                onChange={(e) => setReceiptData(prev => ({ ...prev, invoice_url: e.target.value }))}
                placeholder="https://... ou link do arquivo"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </div>

          {/* Alerts */}
          {hasDivergences && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Há divergências entre as quantidades pedidas e recebidas. Verifique os itens abaixo.
              </AlertDescription>
            </Alert>
          )}

          {hasQualityIssues && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Itens com problemas de qualidade foram identificados. Revise as rejeições.
              </AlertDescription>
            </Alert>
          )}

          {/* Items List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Conferência Item por Item</h3>
            
            {orderItems.map((item) => {
              const remaining = item.quantity - item.received_quantity;
              const receiptItem = receiptItems[item.id];
              const hasDivergence = receiptItem?.received_quantity !== remaining || receiptItem?.rejected_quantity > 0;

              return (
                <Card key={item.id} className={hasDivergence ? 'border-yellow-200 bg-yellow-50/50' : ''}>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Item Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.item_name}</h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                          <div className="space-y-2 mt-2">
                            {/* Quantity Summary */}
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Pedido:</span>
                                <span className="ml-1 font-medium">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Recebido:</span>
                                <span className="ml-1 font-medium text-green-600">{item.received_quantity}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Restante:</span>
                                <span className="ml-1 font-semibold text-blue-600">{remaining}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Preço:</span>
                                <span className="ml-1 font-medium">{formatCurrency(item.unit_price)}</span>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progresso do Item</span>
                                <span>{item.quantity > 0 ? Math.round((item.received_quantity / item.quantity) * 100) : 0}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${item.quantity > 0 ? (item.received_quantity / item.quantity) * 100 : 0}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        {hasDivergence && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
                            Divergência
                          </Badge>
                        )}
                      </div>

                      {/* Quantities */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs">Quantidade Recebida *</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => {
                                const newValue = Math.max(0, (receiptItem?.received_quantity || 0) - 1);
                                updateReceiptItem(item.id, 'received_quantity', newValue);
                              }}
                            >
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              max={remaining}
                              value={receiptItem?.received_quantity || 0}
                              onChange={(e) => updateReceiptItem(item.id, 'received_quantity', Number(e.target.value))}
                              className={`w-16 sm:w-20 text-center ${receiptItem?.received_quantity > remaining ? 'border-red-300' : ''}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => {
                                const newValue = Math.min(remaining, (receiptItem?.received_quantity || 0) + 1);
                                updateReceiptItem(item.id, 'received_quantity', newValue);
                              }}
                              disabled={(receiptItem?.received_quantity || 0) >= remaining}
                            >
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                          {receiptItem?.received_quantity > remaining && (
                            <p className="text-xs text-red-600 mt-1">
                              Quantidade não pode ser maior que o restante ({remaining})
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label className="text-xs">Quantidade Aprovada</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => {
                                const newValue = Math.max(0, (receiptItem?.approved_quantity || 0) - 1);
                                updateReceiptItem(item.id, 'approved_quantity', newValue);
                              }}
                            >
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={receiptItem?.approved_quantity || 0}
                              onChange={(e) => updateReceiptItem(item.id, 'approved_quantity', Number(e.target.value))}
                              className="w-16 sm:w-20 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => {
                                const newValue = (receiptItem?.approved_quantity || 0) + 1;
                                updateReceiptItem(item.id, 'approved_quantity', newValue);
                              }}
                            >
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Quantidade Rejeitada</Label>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => {
                                const newValue = Math.max(0, (receiptItem?.rejected_quantity || 0) - 1);
                                updateReceiptItem(item.id, 'rejected_quantity', newValue);
                              }}
                            >
                              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={receiptItem?.rejected_quantity || 0}
                              onChange={(e) => updateReceiptItem(item.id, 'rejected_quantity', Number(e.target.value))}
                              className="w-16 sm:w-20 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => {
                                const newValue = (receiptItem?.rejected_quantity || 0) + 1;
                                updateReceiptItem(item.id, 'rejected_quantity', newValue);
                              }}
                            >
                              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Status de Qualidade</Label>
                          <Select 
                            value={receiptItem?.quality_status || 'under_review'} 
                            onValueChange={(value) => updateReceiptItem(item.id, 'quality_status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="under_review">Em Análise</SelectItem>
                              <SelectItem value="approved">Aprovado</SelectItem>
                              <SelectItem value="rejected">Rejeitado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Additional Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">Número do Lote</Label>
                          <Input
                            value={receiptItem?.lot_number || ''}
                            onChange={(e) => updateReceiptItem(item.id, 'lot_number', e.target.value)}
                            placeholder="Ex: LOTE-2025-001"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Data de Validade</Label>
                          <Input
                            type="date"
                            value={receiptItem?.expiry_date || ''}
                            onChange={(e) => updateReceiptItem(item.id, 'expiry_date', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Localização no Estoque</Label>
                          <Input
                            value={receiptItem?.warehouse_location || ''}
                            onChange={(e) => updateReceiptItem(item.id, 'warehouse_location', e.target.value)}
                            placeholder="Ex: Prateleira A1"
                          />
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {(receiptItem?.rejected_quantity || 0) > 0 && (
                        <div>
                          <Label className="text-xs">Motivo da Rejeição *</Label>
                          <Input
                            value={receiptItem?.rejection_reason || ''}
                            onChange={(e) => updateReceiptItem(item.id, 'rejection_reason', e.target.value)}
                            placeholder="Ex: Produto danificado, especificação incorreta..."
                          />
                        </div>
                      )}

                      {/* Quality Notes */}
                      <div>
                        <Label className="text-xs">Observações de Qualidade</Label>
                        <Textarea
                          value={receiptItem?.quality_notes || ''}
                          onChange={(e) => updateReceiptItem(item.id, 'quality_notes', e.target.value)}
                          placeholder="Observações sobre a qualidade do item..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* General Notes */}
          <div>
            <Label>Observações Gerais do Recebimento</Label>
            <Textarea
              value={receiptData.notes}
              onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações gerais sobre o recebimento..."
              rows={3}
            />
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo do Recebimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total de itens a receber:</span>
                <span className="font-semibold">{totalToReceive} unidade(s)</span>
              </div>
              <div className="flex justify-between">
                <span>Valor total estimado:</span>
                <span className="font-semibold">{formatCurrency(totalValue)}</span>
              </div>
              {hasDivergences && (
                <div className="flex justify-between text-yellow-700">
                  <span>Status:</span>
                  <span className="font-semibold">Recebimento com Divergências</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
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

