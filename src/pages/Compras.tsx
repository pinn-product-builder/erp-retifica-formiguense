import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Users, FileText, Package, Plus, Star, TrendingUp, Award } from 'lucide-react';
import { usePurchasing } from '@/hooks/usePurchasing';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
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
          <h1 className="text-2xl font-bold">Sistema de Compras</h1>
          <p className="text-muted-foreground">Gerencie fornecedores, requisições e pedidos de compra</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Fornecedores Ativos</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Requisições Pendentes</p>
                <p className="text-2xl font-bold">{requisitions.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Ativos</p>
                <p className="text-2xl font-bold">{purchaseOrders.filter(po => ['pending', 'sent', 'confirmed'].includes(po.status)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Valor em Pedidos</p>
                <p className="text-2xl font-bold">{formatCurrency(getActiveOrdersValue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requisitions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="needs">Necessidades</TabsTrigger>
          <TabsTrigger value="requisitions">Requisições</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="receipts">Recebimentos</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="quotations">Cotações</TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Avaliações
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

          <div className="space-y-4">
            {loading ? (
              <p>Carregando requisições...</p>
            ) : requisitions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma requisição encontrada</p>
                </CardContent>
              </Card>
            ) : (
              requisitions.map((requisition) => (
                <Card key={requisition.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{requisition.requisition_number}</p>
                          <Badge className={STATUS_COLORS[requisition.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                            {translateStatus(requisition.status)}
                          </Badge>
                          <Badge variant="outline">
                            {translatePriority(requisition.priority)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Departamento: {requisition.department}
                        </p>
                        <p className="text-sm">
                          Valor Estimado: {formatCurrency(requisition.total_estimated_value)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Criado em: {new Date(requisition.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        {requisition.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => updateRequisitionStatus(requisition.id, 'approved')}
                            >
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateRequisitionStatus(requisition.id, 'rejected')}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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