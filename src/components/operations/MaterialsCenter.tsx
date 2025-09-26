import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartsReservationManager } from '@/components/materials/PartsReservationManager';
import { PurchaseNeedsManager } from '@/components/materials/PurchaseNeedsManager';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  DollarSign
} from 'lucide-react';

interface OrderContext {
  id?: string;
  number?: string;
  customer?: string;
  status?: string;
  progress?: number;
  currentStep?: string;
}

interface MaterialsCenterProps {
  orderContext?: OrderContext;
}

export function MaterialsCenter({ orderContext }: MaterialsCenterProps) {
  const [activeTab, setActiveTab] = useState('reservation');

  // Dados simulados para demonstração
  const materialsStats = {
    pecasReservadas: 0,
    alertasEstoque: 0,
    comprasPlanejadas: 0,
    tempoMedio: 0,
    valorEstoque: 0,
    fornecedoresAtivos: 0
  };

  const reservedParts = [
    {
      id: '1',
      orderNumber: orderContext?.number || 'RF-2025-001',
      partCode: 'PIV-001',
      partName: 'Pistão 1.0 8V',
      quantity: 4,
      reservedAt: '2025-09-26T08:00:00',
      status: 'reserved'
    },
    {
      id: '2',
      orderNumber: orderContext?.number || 'RF-2025-001',
      partCode: 'BIE-002',
      partName: 'Biela Corsa 1.4',
      quantity: 4,
      reservedAt: '2025-09-26T08:30:00',
      status: 'applied'
    }
  ];

  const purchaseNeeds = [
    {
      id: '1',
      partCode: 'VAL-003',
      partName: 'Válvula Admissão',
      currentStock: 5,
      minStock: 20,
      suggestedQuantity: 50,
      priority: 'high',
      estimatedCost: 615.00,
      suggestedSupplier: 'Válvulas Brasil'
    },
    {
      id: '2',
      partCode: 'RET-004',
      partName: 'Retentor Válvula',
      currentStock: 3,
      minStock: 15,
      suggestedQuantity: 100,
      priority: 'medium',
      estimatedCost: 280.00,
      suggestedSupplier: 'Vedações Tech'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      case 'applied':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com contexto da ordem */}
      {orderContext?.number && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-900">
                  Gestão de Materiais - OS: {orderContext.number}
                </h3>
                <p className="text-sm text-orange-700">
                  Cliente: {orderContext.customer}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="border-orange-300 text-orange-800">
                  <Package className="h-3 w-3 mr-1" />
                  Materiais em Análise
                </Badge>
                {orderContext.progress && (
                  <div className="mt-2 w-32">
                    <Progress value={orderContext.progress} className="bg-orange-100" />
                    <p className="text-xs text-orange-600 mt-1">
                      {orderContext.progress}% concluído
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard de Materiais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peças Reservadas</p>
                <p className="text-2xl font-bold text-blue-600">{materialsStats.pecasReservadas}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Para ordens ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas de Estoque</p>
                <p className="text-2xl font-bold text-orange-600">{materialsStats.alertasEstoque}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compras Planejadas</p>
                <p className="text-2xl font-bold text-green-600">{materialsStats.comprasPlanejadas}%</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              vs emergenciais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-purple-600">{materialsStats.tempoMedio}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              dias para entrega
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor em Estoque</p>
                <p className="text-2xl font-bold text-indigo-600">R$ {materialsStats.valorEstoque.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Inventário total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fornecedores</p>
                <p className="text-2xl font-bold text-teal-600">{materialsStats.fornecedoresAtivos}</p>
              </div>
              <div className="h-8 w-8 bg-teal-100 rounded-full flex items-center justify-center">
                <Truck className="h-4 w-4 text-teal-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Ativos no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo da Ordem Atual */}
      {orderContext?.number && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Peças Reservadas - {orderContext.number}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reservedParts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{part.partName}</p>
                      <p className="text-sm text-gray-600">
                        Código: {part.partCode} | Qtd: {part.quantity}
                      </p>
                    </div>
                    <Badge className={getStatusColor(part.status)}>
                      {part.status === 'reserved' ? 'Reservado' : 'Aplicado'}
                    </Badge>
                  </div>
                ))}
                
                {reservedParts.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma peça reservada para esta ordem</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
                Necessidades de Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchaseNeeds.map((need) => (
                  <div key={need.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{need.partName}</p>
                      <Badge className={getPriorityColor(need.priority)}>
                        {need.priority === 'high' ? 'Alta' : need.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Estoque: {need.currentStock} | Mínimo: {need.minStock}</p>
                      <p>Sugestão: {need.suggestedQuantity} unidades</p>
                      <p>Fornecedor: {need.suggestedSupplier}</p>
                      <p className="font-medium text-green-600">
                        Valor estimado: R$ {need.estimatedCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {purchaseNeeds.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Estoque adequado para produção</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conteúdo Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Centro de Gestão de Materiais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reservation" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Reserva de Peças
              </TabsTrigger>
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Controle de Compras
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reservation" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Reserva Automática de Peças por OS</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Sistema inteligente de reserva automática quando orçamento é aprovado, 
                      com alertas para estoque insuficiente e controle de separação física.
                    </p>
                  </div>
                </div>
              </div>
              <PartsReservationManager />
            </TabsContent>

            <TabsContent value="purchase" className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-900">Controle de Compras Inteligente</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Identificação automática de necessidades de compra, sugestões de fornecedores 
                      por histórico e prevenção de compras duplicadas.
                    </p>
                  </div>
                </div>
              </div>
              <PurchaseNeedsManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resumo de Processos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Fluxo de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Aprovação do Orçamento</p>
                  <p className="text-sm text-gray-600">Reserva automática é acionada</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Verificação de Estoque</p>
                  <p className="text-sm text-gray-600">Alertas para itens insuficientes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Separação Física</p>
                  <p className="text-sm text-gray-600">Peças bloqueadas para a OS</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              Processo de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-red-600">1</span>
                </div>
                <div>
                  <p className="font-medium">Identificação Automática</p>
                  <p className="text-sm text-gray-600">Necessidades detectadas pelo sistema</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-yellow-600">2</span>
                </div>
                <div>
                  <p className="font-medium">Sugestão de Fornecedores</p>
                  <p className="text-sm text-gray-600">Baseada no histórico de compras</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">3</span>
                </div>
                <div>
                  <p className="font-medium">Prevenção de Duplicatas</p>
                  <p className="text-sm text-gray-600">Controle inteligente de pedidos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
