import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Package, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  Truck,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/utils';

interface PurchaseOrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrderId: string;
}

interface PurchaseOrderDetails {
  id: string;
  po_number: string;
  status: string;
  order_date: string;
  expected_delivery?: string;
  actual_delivery?: string;
  total_value: number;
  terms?: string;
  notes?: string;
  delivery_address?: string;
  created_at: string;
  supplier: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    contact_person?: string;
  };
  items: Array<{
    id: string;
    item_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    received_quantity: number;
  }>;
  receipts: Array<{
    id: string;
    receipt_number: string;
    receipt_date: string;
    status: string;
    total_value: number;
    has_divergence: boolean;
  }>;
}

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: FileText },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  sent: { label: 'Enviado', color: 'bg-purple-100 text-purple-800', icon: Truck },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  in_transit: { label: 'Em Trânsito', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export function PurchaseOrderDetailsModal({
  open,
  onOpenChange,
  purchaseOrderId,
}: PurchaseOrderDetailsModalProps) {
  const { currentOrganization } = useOrganization();
  const [orderDetails, setOrderDetails] = useState<PurchaseOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && purchaseOrderId) {
      fetchOrderDetails();
    }
  }, [open, purchaseOrderId]);

  const fetchOrderDetails = async () => {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);

      // Buscar dados do pedido de compra
      const { data: orderData, error: orderError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('id', purchaseOrderId)
        .eq('org_id', currentOrganization.id)
        .single();

      if (orderError) throw orderError;

      // Buscar itens do pedido
      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('po_id', purchaseOrderId);

      if (itemsError) throw itemsError;

      // Buscar recebimentos relacionados
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('purchase_receipts')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('created_at', { ascending: false });

      if (receiptsError) throw receiptsError;

      // Buscar quantidades recebidas por item
      const { data: receivedData, error: receivedError } = await supabase
        .from('purchase_receipt_items')
        .select(`
          purchase_order_item_id,
          received_quantity
        `)
        .in('purchase_order_item_id', itemsData.map(item => item.id));

      if (receivedError) throw receivedError;

      // Calcular quantidades recebidas por item
      const receivedQuantities = receivedData.reduce((acc, item) => {
        acc[item.purchase_order_item_id] = (acc[item.purchase_order_item_id] || 0) + item.received_quantity;
        return acc;
      }, {} as Record<string, number>);

      // Montar dados completos
      const details: PurchaseOrderDetails = {
        ...orderData,
        items: itemsData.map(item => ({
          ...item,
          received_quantity: receivedQuantities[item.id] || 0,
        })),
        receipts: (receiptsData || []).map(receipt => ({
          id: receipt.id,
          receipt_number: receipt.receipt_number,
          receipt_date: receipt.receipt_date,
          status: receipt.status,
          total_value: 0, // Calculate if needed or get from another source
          has_divergence: receipt.has_divergence,
        })),
      };

      setOrderDetails(details);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  };

  const getTotalProgress = () => {
    if (!orderDetails?.items) return { received: 0, total: 0, percentage: 0 };
    
    const total = orderDetails.items.reduce((sum, item) => sum + item.quantity, 0);
    const received = orderDetails.items.reduce((sum, item) => sum + item.received_quantity, 0);
    const percentage = total > 0 ? (received / total) * 100 : 0;
    
    return { received, total, percentage };
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Carregando detalhes do pedido...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!orderDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p>Não foi possível carregar os detalhes do pedido</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusConfig = getStatusConfig(orderDetails.status);
  const StatusIcon = statusConfig.icon;
  const progress = getTotalProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes do Pedido de Compra - {orderDetails.po_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  Status do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={statusConfig.color}>
                  {statusConfig.label}
                </Badge>
                <div className="space-y-2 text-sm">
                  <p><strong>Data do Pedido:</strong> {new Date(orderDetails.order_date).toLocaleDateString()}</p>
                  {orderDetails.expected_delivery && (
                    <p><strong>Entrega Esperada:</strong> {new Date(orderDetails.expected_delivery).toLocaleDateString()}</p>
                  )}
                  {orderDetails.actual_delivery && (
                    <p><strong>Entrega Realizada:</strong> {new Date(orderDetails.actual_delivery).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {orderDetails.supplier.name}</p>
                {orderDetails.supplier.contact_person && (
                  <p><strong>Contato:</strong> {orderDetails.supplier.contact_person}</p>
                )}
                {orderDetails.supplier.email && (
                  <p><strong>Email:</strong> {orderDetails.supplier.email}</p>
                )}
                {orderDetails.supplier.phone && (
                  <p><strong>Telefone:</strong> {orderDetails.supplier.phone}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progresso de Recebimento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progresso de Recebimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Itens Recebidos</span>
                  <span>{progress.received} de {progress.total} ({progress.percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itens do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Qtd. Pedida</TableHead>
                    <TableHead className="text-right">Qtd. Recebida</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderDetails.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.received_quantity === item.quantity ? 'text-green-600' : 'text-orange-600'}>
                          {item.received_quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total: {formatCurrency(orderDetails.total_value)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recebimentos */}
          {orderDetails.receipts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Histórico de Recebimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Divergência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails.receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                        <TableCell>{new Date(receipt.receipt_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={receipt.status === 'completed' ? 'default' : 'secondary'}>
                            {receipt.status === 'completed' ? 'Completo' : 
                             receipt.status === 'partial' ? 'Parcial' : receipt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(receipt.total_value)}</TableCell>
                        <TableCell>
                          {receipt.has_divergence ? (
                            <Badge variant="destructive">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Informações Adicionais */}
          {(orderDetails.terms || orderDetails.notes || orderDetails.delivery_address) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {orderDetails.terms && (
                  <div>
                    <strong>Termos:</strong>
                    <p className="mt-1 text-muted-foreground">{orderDetails.terms}</p>
                  </div>
                )}
                {orderDetails.delivery_address && (
                  <div>
                    <strong>Endereço de Entrega:</strong>
                    <p className="mt-1 text-muted-foreground">{orderDetails.delivery_address}</p>
                  </div>
                )}
                {orderDetails.notes && (
                  <div>
                    <strong>Observações:</strong>
                    <p className="mt-1 text-muted-foreground">{orderDetails.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
