import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartsReservationManager } from '@/components/materials/PartsReservationManager';
import { PurchaseNeedsManager } from '@/components/materials/PurchaseNeedsManager';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  BarChart3,
  Clock
} from 'lucide-react';

export default function GestaoMateriais() {
  const [activeTab, setActiveTab] = useState('reservations');

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Gestão Inteligente de Materiais
          </h1>
          <p className="text-gray-600 mt-1">
            Controle automatizado de reservas, estoque e compras
          </p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Peças Reservadas</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas de Estoque</p>
                <p className="text-2xl font-bold text-orange-600">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Peças abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compras Planejadas</p>
                <p className="text-2xl font-bold text-green-600">0%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              vs emergenciais este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              dias para entrega
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Reserva de Peças
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Controle de Compras
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reservations" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Sistema de Reserva Automática</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Reservado</span>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Separado</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Aplicado</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Gerencie reservas automáticas de peças por ordem de serviço. 
                  O sistema bloqueia peças quando orçamentos são aprovados e permite 
                  controle completo da separação física e aplicação.
                </p>
                <PartsReservationManager />
              </div>
            </TabsContent>

            <TabsContent value="purchases" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Controle Inteligente de Compras</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics Habilitado</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Identificação automática de necessidades de compra com sugestões 
                  inteligentes de fornecedores baseadas em histórico de preços, 
                  prazos e qualidade.
                </p>
                <PurchaseNeedsManager />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Features Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Funcionalidades de Reserva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Reserva automática quando orçamento é aprovado
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Alertas visuais para estoque insuficiente
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Controle de separação física de peças
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Baixa automática no estoque na aplicação
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Rastreabilidade completa por usuário
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Funcionalidades de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Identificação automática de necessidades
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Sugestões de fornecedores por custo-benefício
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Prevenção de compras duplicadas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Relatórios de eficiência (planejada vs emergencial)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Dashboard de performance de fornecedores
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
