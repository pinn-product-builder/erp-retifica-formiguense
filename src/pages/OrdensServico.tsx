import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrdersList } from '@/components/orders/OrdersList';
import { OrderDetails } from '@/components/orders/OrderDetails';
import { Order, useOrders } from '@/hooks/useOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';

type ViewMode = 'list' | 'details';

export default function OrdensServico() {
  const { orders, loading } = useOrders();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Detectar parâmetro orderId na URL e abrir modal automaticamente
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl && !loading && orders.length > 0) {
      // Verificar se a ordem existe na lista
      const orderExists = orders.find(order => order.id === orderIdFromUrl);
      if (orderExists) {
        setSelectedOrderId(orderIdFromUrl);
        setViewMode('details');
        // Limpar o parâmetro da URL para evitar reabertura
        navigate('/ordens-servico', { replace: true });
      }
    }
  }, [searchParams, orders, loading, navigate]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setViewMode('details');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedOrderId(null);
  };

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => !['entregue', 'cancelada'].includes(o.status)).length;
  // Incluir tanto 'concluida' quanto 'entregue' como ordens concluídas
  const completedOrders = orders.filter(o => o.status === 'concluida' || o.status === 'entregue').length;
  const delayedOrders = orders.filter(o => 
    o.estimated_delivery && 
    new Date(o.estimated_delivery) < new Date() && 
    !['entregue', 'cancelada'].includes(o.status)
  ).length;

  if (viewMode === 'details' && selectedOrderId) {
    return (
      <OrderDetails 
        orderId={selectedOrderId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">
            Gerencie todas as ordens de serviço da oficina
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/coleta')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova OS
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-7 w-12" /> : totalOrders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS Ativas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? <Skeleton className="h-7 w-12" /> : activeOrders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? <Skeleton className="h-7 w-12" /> : completedOrders}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? <Skeleton className="h-7 w-12" /> : delayedOrders}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <OrdersList 
        orders={orders}
        loading={loading}
        onViewOrder={handleViewOrder}
      />
    </div>
  );
}