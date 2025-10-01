import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Edit,
  Calendar,
  User,
  Wrench,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Package,
  Shield,
  FileText,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Order, useOrders } from '@/hooks/useOrders';
import { OrderTimeline } from './OrderTimeline';
import { OrderPhotosTab } from './OrderPhotosTab';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
  onEdit?: (order: Order) => void;
}

const STATUS_COLORS: Record<string, string> = {
  'ativa': 'bg-blue-100 text-blue-800',
  'em_analise': 'bg-yellow-100 text-yellow-800',
  'aprovada': 'bg-orange-100 text-orange-800',
  'em_producao': 'bg-purple-100 text-purple-800',
  'concluida': 'bg-green-100 text-green-800',
  'entregue': 'bg-gray-100 text-gray-800',
  'cancelada': 'bg-red-100 text-red-800'
};

const STATUS_LABELS: Record<string, string> = {
  'ativa': 'Ativa',
  'em_analise': 'Em Análise',
  'aprovada': 'Aprovada',
  'em_producao': 'Em Produção',
  'concluida': 'Concluída',
  'entregue': 'Entregue',
  'cancelada': 'Cancelada'
};

const PRIORITY_LABELS = {
  1: 'Normal',
  2: 'Alta',
  3: 'Urgente'
};

export function OrderDetails({ orderId, onBack, onEdit }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchOrderDetails } = useOrders();

  useEffect(() => {
    const loadOrderDetails = async () => {
      setLoading(true);
      const orderData = await fetchOrderDetails(orderId);
      setOrder(orderData);
      setLoading(false);
    };

    loadOrderDetails();
  }, [orderId, fetchOrderDetails]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ordem de serviço não encontrada.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">OS #{order.order_number}</h1>
            <p className="text-muted-foreground">
              Criado em {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant="secondary" 
            className={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}
          >
            {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
          </Badge>
          
          <Badge variant="outline">
            Prioridade {PRIORITY_LABELS[order.priority as keyof typeof PRIORITY_LABELS]}
          </Badge>
          
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(order)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="materials">Materiais</TabsTrigger>
          <TabsTrigger value="warranties">Garantias</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Nome:</span>
                  <p>{order.customer?.name || 'N/A'}</p>
                </div>
                {order.customer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer.phone}</span>
                  </div>
                )}
                {order.customer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engine Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Informações do Motor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.engine ? (
                  <>
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <p>{order.engine.type}</p>
                    </div>
                    <div>
                      <span className="font-medium">Marca:</span>
                      <p>{order.engine.brand}</p>
                    </div>
                    <div>
                      <span className="font-medium">Modelo:</span>
                      <p>{order.engine.model}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Informações do motor não disponíveis
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cronograma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Criado:</span>
                  <span>
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                
                {order.estimated_delivery && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Previsão de entrega:</span>
                    <span>
                      {format(new Date(order.estimated_delivery), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}

                {order.actual_delivery && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Entregue em:</span>
                    <span>
                      {format(new Date(order.actual_delivery), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Consultor Responsável
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.consultant ? (
                  <p>{order.consultant.full_name}</p>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum consultor atribuído
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <OrderTimeline statusHistory={order.status_history || []} />
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Materiais Utilizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.materials && order.materials.length > 0 ? (
                <div className="space-y-4">
                  {order.materials.map((material) => (
                    <div key={material.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{material.part_name}</p>
                        {material.part_code && (
                          <p className="text-sm text-muted-foreground">
                            Código: {material.part_code}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {material.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          R$ {material.total_cost.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Unit: R$ {material.unit_cost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum material registrado ainda.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warranties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Garantias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.warranties && order.warranties.length > 0 ? (
                <div className="space-y-4">
                  {order.warranties.map((warranty) => (
                    <div key={warranty.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant={warranty.is_active ? "default" : "secondary"}>
                          {warranty.warranty_type === 'total' ? 'Garantia Total' : 
                           warranty.warranty_type === 'pecas' ? 'Garantia de Peças' : 
                           'Garantia de Serviço'}
                        </Badge>
                        <Badge variant={warranty.is_active ? "default" : "secondary"}>
                          {warranty.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Período:</strong> {format(new Date(warranty.start_date), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(warranty.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        {warranty.terms && (
                          <p>
                            <strong>Termos:</strong> {warranty.terms}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma garantia registrada.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Registro Fotográfico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderPhotosTab orderId={orderId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}