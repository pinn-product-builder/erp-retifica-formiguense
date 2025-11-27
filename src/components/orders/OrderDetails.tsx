import React, { useState, useEffect, useCallback } from 'react';
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
  Camera,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Order, useOrders } from '@/hooks/useOrders';
import { usePrintOrder } from '@/hooks/usePrintOrder';
import { OrderTimeline } from './OrderTimeline';
import { OrderPhotosTab } from './OrderPhotosTab';
import { OrderMaterialsTab } from './OrderMaterialsTab';
import { OrderWarrantyTab } from './OrderWarrantyTab';
import { OrderDocumentsTab } from './OrderDocumentsTab';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { EngineTypeSelect } from '@/components/ui/EngineTypeSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [markingAsDelivered, setMarkingAsDelivered] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [engineDialogOpen, setEngineDialogOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [selectedEngineTypeId, setSelectedEngineTypeId] = useState<string | undefined>(undefined);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingEngine, setSavingEngine] = useState(false);
  const { fetchOrderDetails, markOrderAsDelivered, updateOrderCustomerData, updateOrderEngineType } = useOrders();
  const { printOrder } = usePrintOrder();
  const { toast } = useToast();
  const permissions = usePermissions();
  const canEditSensitiveData = permissions.canEditOrderIdentity();

  useEffect(() => {
    const loadOrderDetails = async () => {
      setLoading(true);
      const orderData = await fetchOrderDetails(orderId);
      setOrder(orderData);
      setLoading(false);
    };

    loadOrderDetails();
  }, [orderId, fetchOrderDetails]);

  useEffect(() => {
    if (order?.customer) {
      setCustomerForm({
        name: order.customer.name || '',
        phone: order.customer.phone || '',
        email: order.customer.email || '',
        address: order.customer.address || ''
      });
    }
    if (order?.engine) {
      setSelectedEngineTypeId(order.engine.engine_type_id || undefined);
    }
  }, [order?.customer, order?.engine]);

  const refreshOrderDetails = useCallback(async () => {
    const updated = await fetchOrderDetails(orderId);
    setOrder(updated);
  }, [fetchOrderDetails, orderId]);

  const handleMarkAsDelivered = async () => {
    if (!order) return;

    setMarkingAsDelivered(true);
    try {
      const success = await markOrderAsDelivered(orderId, deliveryNotes || undefined);
      if (success) {
        setShowDeliveryDialog(false);
        setDeliveryNotes('');
        // Recarregar detalhes da ordem
        const orderData = await fetchOrderDetails(orderId);
        setOrder(orderData);
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
    } finally {
      setMarkingAsDelivered(false);
    }
  };

  const canMarkAsDelivered = order && 
    order.status !== 'entregue' && 
    order.status !== 'cancelada' &&
    (order.status === 'concluida' || order.status === 'em_producao' || order.status === 'aprovada');

  const handleSaveCustomer = async () => {
    if (!order?.customer?.id) return;

    setSavingCustomer(true);
    const success = await updateOrderCustomerData(order.customer.id, {
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      email: customerForm.email.trim(),
      address: customerForm.address.trim(),
    });
    setSavingCustomer(false);

    if (success) {
      await refreshOrderDetails();
      setCustomerDialogOpen(false);
    }
  };

  const handleSaveEngineType = async () => {
    if (!order?.engine?.id || !selectedEngineTypeId) {
      toast({
        title: "Selecione um tipo",
        description: "Escolha um tipo de motor antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    setSavingEngine(true);
    const success = await updateOrderEngineType(order.engine.id, selectedEngineTypeId);
    setSavingEngine(false);

    if (success) {
      await refreshOrderDetails();
      setEngineDialogOpen(false);
    }
  };

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
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => printOrder(order)}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          
          {canMarkAsDelivered && (
            <Button 
              size="sm" 
              variant="default"
              onClick={() => setShowDeliveryDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Entregue
            </Button>
          )}
          
          {onEdit && order.status !== 'entregue' && (
            <Button size="sm" onClick={() => onEdit(order)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="materials" className="text-xs sm:text-sm">Materiais</TabsTrigger>
          <TabsTrigger value="warranties" className="text-xs sm:text-sm">Garantias</TabsTrigger>
          <TabsTrigger value="photos" className="text-xs sm:text-sm">Fotos</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </CardTitle>
                {canEditSensitiveData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomerDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
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
                {order.customer?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customer.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engine Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Informações do Motor
                </CardTitle>
                {canEditSensitiveData && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEngineDialogOpen(true)}
                    disabled={!order.engine}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Alterar Tipo
                  </Button>
                )}
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
          <OrderTimeline orderId={orderId} enabled={activeTab === 'timeline'} />
        </TabsContent>

        <TabsContent value="materials">
          <OrderMaterialsTab orderId={orderId} />
        </TabsContent>

        <TabsContent value="warranties">
          <OrderWarrantyTab orderId={orderId} />
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

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderDocumentsTab orderId={orderId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={(open) => setCustomerDialogOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar dados do cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações principais do cliente desta ordem.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customer-name">Nome</Label>
              <Input
                id="customer-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="customer-phone">Telefone</Label>
              <Input
                id="customer-phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="customer-email">E-mail</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <Label htmlFor="customer-address">Endereço</Label>
              <Textarea
                id="customer-address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialogOpen(false)} disabled={savingCustomer}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCustomer} disabled={savingCustomer}>
              {savingCustomer ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Engine Type Dialog */}
      <Dialog open={engineDialogOpen} onOpenChange={(open) => setEngineDialogOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alterar tipo de motor</DialogTitle>
            <DialogDescription>
              Selecione o tipo de motor correto para esta OS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo de motor</Label>
              <EngineTypeSelect
                value={selectedEngineTypeId}
                onChange={setSelectedEngineTypeId}
                placeholder="Selecione um tipo de motor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEngineDialogOpen(false)} disabled={savingEngine}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEngineType} disabled={savingEngine}>
              {savingEngine ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Entrega */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Confirmar Entrega
            </DialogTitle>
            <DialogDescription>
              Confirme que a ordem de serviço foi entregue ao cliente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Ao confirmar, o sistema irá:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Marcar o status como "Entregue"</li>
                <li>Registrar data e hora da entrega</li>
                <li>Atualizar o histórico da ordem</li>
              </ul>
            </div>

            <div>
              <Label htmlFor="delivery-notes">Observações (Opcional)</Label>
              <Textarea
                id="delivery-notes"
                placeholder="Adicione observações sobre a entrega, como método de entrega, responsável, etc."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeliveryDialog(false);
                setDeliveryNotes('');
              }}
              disabled={markingAsDelivered}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsDelivered}
              disabled={markingAsDelivered}
            >
              {markingAsDelivered ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Entrega
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}