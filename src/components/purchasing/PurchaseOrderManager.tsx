import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Send, 
  Check, 
  X, 
  Clock, 
  Truck,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { usePurchasing, PurchaseOrder } from '@/hooks/usePurchasing';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import PurchaseOrderForm from './PurchaseOrderForm';

const STATUS_COLORS = {
  draft: 'bg-gray-500/20 text-gray-700',
  pending_approval: 'bg-yellow-500/20 text-yellow-700',
  approved: 'bg-green-500/20 text-green-700',
  sent: 'bg-blue-500/20 text-blue-700',
  confirmed: 'bg-green-600/20 text-green-800',
  in_transit: 'bg-purple-500/20 text-purple-700',
  delivered: 'bg-emerald-500/20 text-emerald-700',
  cancelled: 'bg-red-500/20 text-red-700',
};

const STATUS_ICONS = {
  draft: FileText,
  pending_approval: AlertTriangle,
  approved: CheckCircle2,
  sent: Send,
  confirmed: Check,
  in_transit: Truck,
  delivered: CheckCircle2,
  cancelled: X,
};

const translateStatus = (status: string) => {
  const statusTranslations: Record<string, string> = {
    draft: 'Rascunho',
    pending_approval: 'Aguardando Aprovação',
    approved: 'Aprovado',
    sent: 'Enviado',
    confirmed: 'Confirmado',
    in_transit: 'Em Trânsito',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };
  return statusTranslations[status] || status;
};

export default function PurchaseOrderManager() {
  const { 
    purchaseOrders, 
    suppliers,
    loading,
    approvePurchaseOrder,
    sendPurchaseOrder,
    confirmPurchaseOrder,
    cancelPurchaseOrder,
    fetchPurchaseOrders
  } = usePurchasing();
  
  const { toast } = useToast();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);

  // Apply filters
  useEffect(() => {
    let filtered = purchaseOrders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (supplierFilter !== 'all') {
      filtered = filtered.filter(order => order.supplier_id === supplierFilter);
    }

    setFilteredOrders(filtered);
  }, [purchaseOrders, searchTerm, statusFilter, supplierFilter]);

  const handleApprove = async (orderId: string) => {
    const success = await approvePurchaseOrder(orderId);
    if (success) {
      await fetchPurchaseOrders();
    }
  };

  const handleSend = async (orderId: string) => {
    const success = await sendPurchaseOrder(orderId);
    if (success) {
      await fetchPurchaseOrders();
    }
  };

  const handleConfirm = async (orderId: string) => {
    const success = await confirmPurchaseOrder(orderId);
    if (success) {
      await fetchPurchaseOrders();
    }
  };

  const handleCancel = async (orderId: string) => {
    const success = await cancelPurchaseOrder(orderId);
    if (success) {
      await fetchPurchaseOrders();
    }
  };

  const getStatusActions = (order: PurchaseOrder) => {
    const actions = [];

    switch (order.status) {
      case 'draft':
        actions.push(
          <Button
            key="send"
            size="sm"
            variant="outline"
            onClick={() => handleSend(order.id)}
          >
            <Send className="h-3 w-3 mr-1" />
            Enviar
          </Button>
        );
        break;

      case 'pending_approval':
        actions.push(
          <Button
            key="approve"
            size="sm"
            onClick={() => handleApprove(order.id)}
          >
            <Check className="h-3 w-3 mr-1" />
            Aprovar
          </Button>
        );
        break;

      case 'approved':
        actions.push(
          <Button
            key="send"
            size="sm"
            variant="outline"
            onClick={() => handleSend(order.id)}
          >
            <Send className="h-3 w-3 mr-1" />
            Enviar
          </Button>
        );
        break;

      case 'sent':
        actions.push(
          <Button
            key="confirm"
            size="sm"
            variant="outline"
            onClick={() => handleConfirm(order.id)}
          >
            <Check className="h-3 w-3 mr-1" />
            Confirmar
          </Button>
        );
        break;
    }

    // Cancel option for non-final statuses
    if (!['delivered', 'cancelled'].includes(order.status)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="destructive"
          onClick={() => handleCancel(order.id)}
        >
          <X className="h-3 w-3 mr-1" />
          Cancelar
        </Button>
      );
    }

    return actions;
  };

  const getDashboardStats = () => {
    const stats = {
      total: purchaseOrders.length,
      pending_approval: purchaseOrders.filter(po => po.status === 'pending_approval').length,
      sent: purchaseOrders.filter(po => po.status === 'sent').length,
      in_transit: purchaseOrders.filter(po => po.status === 'in_transit').length,
      overdue: purchaseOrders.filter(po => {
        if (!po.expected_delivery) return false;
        const expectedDate = new Date(po.expected_delivery);
        const today = new Date();
        return expectedDate < today && !['delivered', 'cancelled'].includes(po.status);
      }).length,
      total_value: purchaseOrders
        .filter(po => !['cancelled'].includes(po.status))
        .reduce((sum, po) => sum + po.total_value, 0),
    };

    return stats;
  };

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando pedidos de compra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Total de POs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{stats.pending_approval}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Aguardando Aprovação</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{stats.sent}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Enviados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{stats.in_transit}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Em Trânsito</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Atrasados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm md:text-base font-bold text-green-600 truncate">{formatCurrency(stats.total_value)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Valor Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pedidos de Compra</h2>
          <p className="text-muted-foreground">Gerencie e acompanhe seus pedidos de compra</p>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número do PO ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending_approval">Aguardando Aprovação</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="in_transit">Em Trânsito</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Fornecedores</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Nenhum pedido encontrado</p>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || supplierFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie seu primeiro pedido de compra'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && supplierFilter === 'all' && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Pedido
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status as keyof typeof STATUS_ICONS] || FileText;
            const isOverdue = order.expected_delivery && 
              new Date(order.expected_delivery) < new Date() && 
              !['delivered', 'cancelled'].includes(order.status);

            return (
              <Card key={order.id} className={isOverdue ? 'border-red-200 bg-red-50/50' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{order.po_number}</h3>
                        <Badge className={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                          {translateStatus(order.status)}
                        </Badge>
                        {order.requires_approval && order.status === 'pending_approval' && (
                          <Badge variant="secondary">
                            Requer Aprovação
                          </Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="destructive">
                            Atrasado
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><strong>Fornecedor:</strong> {order.supplier?.name}</p>
                        </div>
                        <div>
                          <p><strong>Data do Pedido:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Entrega Esperada:</strong> {
                            order.expected_delivery 
                              ? new Date(order.expected_delivery).toLocaleDateString()
                              : 'N/A'
                          }</p>
                        </div>
                        <div>
                          <p><strong>Valor Total:</strong> {formatCurrency(order.total_value)}</p>
                        </div>
                      </div>

                      {order.notes && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Observações:</strong> {order.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {getStatusActions(order)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Purchase Order Form */}
      <PurchaseOrderForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={() => {
          fetchPurchaseOrders();
          toast({
            title: 'Sucesso',
            description: 'Pedido de compra criado com sucesso',
          });
        }}
      />
    </div>
  );
}
