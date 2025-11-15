import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Users, FileText, Package, Plus, Star, TrendingUp, Award, Check, X } from 'lucide-react';
import { usePurchasing } from '@/hooks/usePurchasing';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import SupplierEvaluation from '@/components/purchasing/SupplierEvaluation';
import SuppliersManager from '@/components/purchasing/SuppliersManager';
import QuotationManager from '@/components/purchasing/QuotationManager';
import PurchaseNeedsManager from '@/components/purchasing/PurchaseNeedsManager';
import PurchaseOrderManager from '@/components/purchasing/PurchaseOrderManager';
import ReceiptManager from '@/components/purchasing/ReceiptManager';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-700',
  approved: 'bg-green-500/20 text-green-700',
  rejected: 'bg-red-500/20 text-red-700',
  cancelled: 'bg-gray-500/20 text-gray-700',
  sent: 'bg-blue-500/20 text-blue-700',
  confirmed: 'bg-green-600/20 text-green-800',
};

const translateStatus = (status: string) => {
  const statusTranslations: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    cancelled: 'Cancelada',
    sent: 'Enviada',
    confirmed: 'Confirmada',
    completed: 'Concluída',
    in_progress: 'Em Andamento',
    draft: 'Rascunho',
  };
  return statusTranslations[status] || status;
};

const translatePriority = (priority: string) => {
  const priorityTranslations: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
    urgent: 'Urgente',
  };
  return priorityTranslations[priority] || priority;
};

export default function Compras() {
  const { 
    requisitions, 
    purchaseOrders, 
    loading, 
    createRequisition,
    updateRequisitionStatus,
    createPurchaseOrder
  } = usePurchasing();
  const { toast } = useToast();

  const [showRequisitionDialog, setShowRequisitionDialog] = useState(false);
  const [newRequisition, setNewRequisition] = useState({
    department: '',
    priority: 'medium',
    justification: '',
    items: [{ item_name: '', description: '', quantity: 1, unit_price: 0 }],
  });

  const handleCreateRequisition = async () => {
    if (!newRequisition.department || newRequisition.items.length === 0) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, preencha o departamento e adicione pelo menos um item.",
      });
      return;
    }
    
    try {
      const totalValue = newRequisition.items.reduce((sum, item) => 
        sum + (item.quantity * (item.unit_price || 0)), 0
      );

      await createRequisition(
        {
          ...newRequisition,
          total_estimated_value: totalValue,
          status: 'pending',
        },
        newRequisition.items.map(item => ({
          ...item,
          total_price: item.quantity * (item.unit_price || 0),
        }))
      );
      
      setNewRequisition({
        department: '',
        priority: 'medium',
        justification: '',
        items: [{ item_name: '', description: '', quantity: 1, unit_price: 0 }],
      });
      
      setShowRequisitionDialog(false);

      toast({
        title: "Requisição criada",
        description: "Requisição de compra criada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar requisição:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar requisição",
        description: "Não foi possível criar a requisição. Tente novamente.",
      });
    }
  };

  const addRequisitionItem = () => {
    setNewRequisition({
      ...newRequisition,
      items: [...newRequisition.items, { item_name: '', description: '', quantity: 1, unit_price: 0 }],
    });
  };

  const updateRequisitionItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...newRequisition.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewRequisition({ ...newRequisition, items: updatedItems });
  };

  const removeRequisitionItem = (index: number) => {
    const updatedItems = newRequisition.items.filter((_, i) => i !== index);
    setNewRequisition({ ...newRequisition, items: updatedItems });
  };

  const getPendingRequisitionsValue = () => {
    return requisitions
      .filter(req => req.status === 'pending')
      .reduce((sum, req) => sum + req.total_estimated_value, 0);
  };

  const getActiveOrdersValue = () => {
    return purchaseOrders
      .filter(po => ['pending', 'sent', 'confirmed'].includes(po.status))
      .reduce((sum, po) => sum + po.total_value, 0);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sistema de Compras</h1>
          <p className="text-muted-foreground">Gerencie fornecedores, requisições e pedidos de compra</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Fornecedores Ativos</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Requisições Pendentes</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{requisitions.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Pedidos Ativos</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold truncate">{purchaseOrders.filter(po => ['pending', 'sent', 'confirmed'].includes(po.status)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Valor em Pedidos</p>
                <p className="text-xs sm:text-sm md:text-base font-bold truncate">{formatCurrency(getActiveOrdersValue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requisitions" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex lg:grid lg:grid-cols-7">
          <TabsTrigger value="needs" className="flex-shrink-0 text-xs sm:text-sm">Necessidades</TabsTrigger>
          <TabsTrigger value="requisitions" className="flex-shrink-0 text-xs sm:text-sm">Requisições</TabsTrigger>
          <TabsTrigger value="orders" className="flex-shrink-0 text-xs sm:text-sm">Pedidos</TabsTrigger>
          <TabsTrigger value="receipts" className="flex-shrink-0 text-xs sm:text-sm">Recebimentos</TabsTrigger>
          <TabsTrigger value="suppliers" className="flex-shrink-0 text-xs sm:text-sm">Fornecedores</TabsTrigger>
          <TabsTrigger value="quotations" className="flex-shrink-0 text-xs sm:text-sm">Cotações</TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-1 sm:gap-2 flex-shrink-0 text-xs sm:text-sm">
            <Award className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Avaliações</span>
            <span className="sm:hidden">Aval.</span>
          </TabsTrigger>
        </TabsList>

        {/* Purchase Needs Tab */}
        <TabsContent value="needs" className="space-y-4">
          <PurchaseNeedsManager />
        </TabsContent>

        {/* Requisitions Tab */}
        <TabsContent value="requisitions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Requisições de Compra</h2>
            <Dialog open={showRequisitionDialog} onOpenChange={setShowRequisitionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Requisição
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Requisição de Compra</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Departamento</Label>
                      <Input
                        value={newRequisition.department}
                        onChange={(e) => setNewRequisition({...newRequisition, department: e.target.value})}
                        placeholder="Ex: Produção, Manutenção"
                      />
                    </div>
                    <div>
                      <Label>Prioridade</Label>
                      <Select 
                        value={newRequisition.priority} 
                        onValueChange={(value) => setNewRequisition({...newRequisition, priority: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Justificativa</Label>
                    <Textarea
                      value={newRequisition.justification}
                      onChange={(e) => setNewRequisition({...newRequisition, justification: e.target.value})}
                      placeholder="Justifique a necessidade da compra"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Itens da Requisição</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addRequisitionItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Item
                      </Button>
                    </div>
                    
                    {newRequisition.items.map((item, index) => (
                      <div key={index} className="border p-3 rounded space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Nome do Item</Label>
                            <Input
                              value={item.item_name}
                              onChange={(e) => updateRequisitionItem(index, 'item_name', e.target.value)}
                              placeholder="Ex: Rolamento SKF"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Quantidade</Label>
                            <Input
                              type="text"
                              value={item.quantity.toString()}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^\d]/g, '');
                                const quantity = numericValue ? parseInt(numericValue) : 1;
                                updateRequisitionItem(index, 'quantity', Math.max(1, quantity));
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Descrição</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateRequisitionItem(index, 'description', e.target.value)}
                            placeholder="Descrição detalhada do item"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="w-32">
                            <Label className="text-xs">Preço Unitário</Label>
                            <Input
                              type="text"
                              value={item.unit_price.toString()}
                              onChange={(e) => {
                                // Permitir vírgula como separador decimal
                                let numericValue = e.target.value.replace(/[^\d.,]/g, '');
                                if (numericValue.includes(',')) {
                                  numericValue = numericValue.replace(',', '.');
                                }
                                const price = parseFloat(numericValue) || 0;
                                updateRequisitionItem(index, 'unit_price', Math.max(0, price));
                              }}
                              placeholder="0,00"
                            />
                          </div>
                          {newRequisition.items.length > 1 && (
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="sm"
                              onClick={() => removeRequisitionItem(index)}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total Estimado: {formatCurrency(
                        newRequisition.items.reduce((sum, item) => 
                          sum + (item.quantity * (item.unit_price || 0)), 0
                        )
                      )}
                    </p>
                  </div>

                  <Button onClick={handleCreateRequisition} className="w-full">
                    Criar Requisição
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Carregando requisições...</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <ResponsiveTable
                  data={requisitions}
                  keyExtractor={(requisition) => requisition.id}
                  emptyMessage="Nenhuma requisição encontrada"
                  columns={[
                  {
                    key: 'requisition_number',
                    header: 'Número',
                    mobileLabel: 'Número',
                    priority: 1,
                    minWidth: 120,
                    render: (requisition) => (
                      <span className="font-medium text-xs sm:text-sm">{requisition.requisition_number}</span>
                    )
                  },
                  {
                    key: 'department',
                    header: 'Departamento',
                    mobileLabel: 'Depto',
                    priority: 3,
                    minWidth: 120,
                    render: (requisition) => <span className="text-xs sm:text-sm">{requisition.department}</span>
                  },
                  {
                    key: 'priority',
                    header: 'Prioridade',
                    mobileLabel: 'Prioridade',
                    priority: 2,
                    minWidth: 100,
                    render: (requisition) => (
                      <Badge variant="outline" className="text-xs">
                        {translatePriority(requisition.priority)}
                      </Badge>
                    )
                  },
                  {
                    key: 'total_estimated_value',
                    header: 'Valor Estimado',
                    mobileLabel: 'Valor',
                    priority: 2,
                    minWidth: 120,
                    render: (requisition) => (
                      <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(requisition.total_estimated_value)}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    mobileLabel: 'Status',
                    priority: 2,
                    minWidth: 100,
                    render: (requisition) => (
                      <Badge className={`text-xs ${STATUS_COLORS[requisition.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}`}>
                        {translateStatus(requisition.status)}
                      </Badge>
                    )
                  },
                  {
                    key: 'created_at',
                    header: 'Data',
                    mobileLabel: 'Data',
                    priority: 4,
                    minWidth: 100,
                    hideInMobile: true,
                    render: (requisition) => (
                      <span className="text-xs sm:text-sm">
                        {new Date(requisition.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    )
                  },
                  {
                    key: 'actions',
                    header: 'Ações',
                    mobileLabel: 'Ações',
                    priority: 1,
                    minWidth: 150,
                    render: (requisition) => (
                      <div className="flex gap-1 sm:gap-2">
                        {requisition.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="text-xs h-7 px-2 sm:px-3"
                              onClick={() => updateRequisitionStatus(requisition.id, 'approved')}
                            >
                              <Check className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Aprovar</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="text-xs h-7 px-2 sm:px-3"
                              onClick={() => updateRequisitionStatus(requisition.id, 'rejected')}
                            >
                              <X className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Rejeitar</span>
                            </Button>
                          </>
                        )}
                      </div>
                    )
                  }
                ]}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <SuppliersManager />
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <PurchaseOrderManager />
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <ReceiptManager />
        </TabsContent>

        {/* Quotations Tab */}
        <TabsContent value="quotations" className="space-y-4">
          <QuotationManager />
        </TabsContent>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations" className="space-y-4">
          <SupplierEvaluation />
        </TabsContent>
      </Tabs>
    </div>
  );
}