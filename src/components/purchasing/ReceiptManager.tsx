import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Truck,
  FileText
} from 'lucide-react';
import { usePurchaseReceipts } from '@/hooks/usePurchaseReceipts';
import { formatCurrency } from '@/lib/utils';
import { ReceiveOrderModal } from './ReceiveOrderModal';
import { PurchaseOrderDetailsModal } from './PurchaseOrderDetailsModal';

interface PendingPO {
  id: string;
  po_number: string;
  supplier: {
    name: string;
  };
  status: string;
  order_date: string;
  expected_delivery?: string;
  total_value: number;
  items?: Array<{
    id: string;
    item_name: string;
    quantity: number;
    received_quantity: number;
  }>;
}

const STATUS_COLORS = {
  confirmed: 'bg-green-500/20 text-green-700',
  in_transit: 'bg-purple-500/20 text-purple-700',
  delivered: 'bg-emerald-500/20 text-emerald-700',
};

const STATUS_ICONS = {
  confirmed: CheckCircle2,
  in_transit: Truck,
  delivered: Package,
};

const translateStatus = (status: string) => {
  const statusTranslations: Record<string, string> = {
    confirmed: 'Confirmado',
    in_transit: 'Em Trânsito',
    delivered: 'Entregue',
  };
  return statusTranslations[status] || status;
};

export default function ReceiptManager() {
  const { receipts, loading, fetchReceipts, fetchPendingPOs } = usePurchaseReceipts();
  
  const [pendingPOs, setPendingPOs] = useState<PendingPO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPO, setSelectedPO] = useState<string | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPOForDetails, setSelectedPOForDetails] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadData = useCallback(async () => {
    const pos = await fetchPendingPOs();
    setPendingPOs(pos as PendingPO[]);
    await fetchReceipts();
  }, [fetchPendingPOs, fetchReceipts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPOs = pendingPOs.filter(po => {
    const matchesSearch = searchTerm === '' || 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getProgressInfo = (po: PendingPO) => {
    if (!po.items) return { received: 0, total: 0, percentage: 0 };
    
    const total = po.items.reduce((sum, item) => sum + item.quantity, 0);
    const received = po.items.reduce((sum, item) => sum + item.received_quantity, 0);
    const percentage = total > 0 ? (received / total) * 100 : 0;
    
    return { received, total, percentage };
  };

  const isOverdue = (po: PendingPO) => {
    if (!po.expected_delivery) return false;
    const expectedDate = new Date(po.expected_delivery);
    const today = new Date();
    return today > expectedDate && po.status !== 'delivered';
  };

  const handleReceiveOrder = (poId: string) => {
    setSelectedPO(poId);
    setShowReceiveModal(true);
  };

  const handleViewDetails = (poId: string) => {
    setSelectedPOForDetails(poId);
    setShowDetailsModal(true);
  };

  const getDashboardStats = () => {
    const stats = {
      pending_receipt: pendingPOs.filter(po => po.status === 'confirmed').length,
      in_transit: pendingPOs.filter(po => po.status === 'in_transit').length,
      overdue: pendingPOs.filter(po => isOverdue(po)).length,
      total_value: pendingPOs.reduce((sum, po) => sum + po.total_value, 0),
      recent_receipts: receipts.filter(receipt => {
        const receiptDate = new Date(receipt.receipt_date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return receiptDate >= weekAgo;
      }).length,
    };

    return stats;
  };

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando recebimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.pending_receipt}</p>
              <p className="text-sm text-muted-foreground">Aguardando Recebimento</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.in_transit}</p>
              <p className="text-sm text-muted-foreground">Em Trânsito</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-muted-foreground">Atrasados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.total_value)}</p>
              <p className="text-sm text-muted-foreground">Valor Pendente</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.recent_receipts}</p>
              <p className="text-sm text-muted-foreground">Recebidos (7 dias)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Recebimento de Mercadorias</h2>
        <p className="text-muted-foreground">Gerencie o recebimento de pedidos de compra</p>
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
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="in_transit">Em Trânsito</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Purchase Orders */}
      <div className="space-y-4">
        {filteredPOs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Nenhum pedido pendente</p>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há pedidos aguardando recebimento'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPOs.map((po) => {
            const StatusIcon = STATUS_ICONS[po.status as keyof typeof STATUS_ICONS] || Package;
            const overdue = isOverdue(po);
            const progress = getProgressInfo(po);

            return (
              <Card key={po.id} className={overdue ? 'border-red-200 bg-red-50/50' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{po.po_number}</h3>
                        <Badge className={STATUS_COLORS[po.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                          {translateStatus(po.status)}
                        </Badge>
                        {overdue && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Atrasado
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p><strong>Fornecedor:</strong> {po.supplier.name}</p>
                        </div>
                        <div>
                          <p><strong>Data do Pedido:</strong> {new Date(po.order_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Entrega Esperada:</strong> {
                            po.expected_delivery 
                              ? new Date(po.expected_delivery).toLocaleDateString()
                              : 'N/A'
                          }</p>
                        </div>
                        <div>
                          <p><strong>Valor Total:</strong> {formatCurrency(po.total_value)}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {progress.total > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progresso do Recebimento</span>
                            <span>{progress.received}/{progress.total} itens ({progress.percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {po.status === 'confirmed' && (
                        <Button onClick={() => handleReceiveOrder(po.id)}>
                          <Package className="h-4 w-4 mr-2" />
                          Receber Mercadoria
                        </Button>
                      )}
                      
                      {po.status === 'in_transit' && progress.percentage < 100 && (
                        <Button variant="outline" onClick={() => handleReceiveOrder(po.id)}>
                          <Package className="h-4 w-4 mr-2" />
                          Receber Parcial
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(po.id)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Receipts */}
      {receipts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recebimentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {receipts.slice(0, 5).map((receipt) => (
                <div key={receipt.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{receipt.receipt_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {receipt.purchase_order?.po_number} - {receipt.purchase_order?.supplier?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(receipt.receipt_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(receipt.total_value)}</p>
                    <Badge variant={receipt.has_divergence ? 'secondary' : 'default'}>
                      {receipt.status === 'completed' ? 'Completo' : 'Parcial'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receive Order Modal */}
      {selectedPO && (
        <ReceiveOrderModal
          open={showReceiveModal}
          onOpenChange={setShowReceiveModal}
          purchaseOrderId={selectedPO}
          onSuccess={() => {
            loadData();
            setSelectedPO(null);
          }}
        />
      )}

      {/* Purchase Order Details Modal */}
      {selectedPOForDetails && (
        <PurchaseOrderDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          purchaseOrderId={selectedPOForDetails}
        />
      )}
    </div>
  );
}
