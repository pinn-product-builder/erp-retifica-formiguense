import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ArrowRightLeft, CheckCircle2, BarChart3, AlertTriangle } from 'lucide-react';
import MovementManager from '@/components/inventory/MovementManager';
import ApprovalManager from '@/components/inventory/ApprovalManager';
import InventoryCountManager from '@/components/inventory/InventoryCountManager';
import InventoryDashboard from '@/components/inventory/InventoryDashboard';
import MovementHistory from '@/components/inventory/MovementHistory';

export default function Inventario() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Inventário</h1>
          <p className="text-muted-foreground">
            Controle completo de movimentações, contagens e aprovações de estoque
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Movimentações
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Aprovações
          </TabsTrigger>
          <TabsTrigger value="counts" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Contagens
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <InventoryDashboard />
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <MovementManager />
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <ApprovalManager />
        </TabsContent>

        {/* Counts Tab */}
        <TabsContent value="counts" className="space-y-4">
          <InventoryCountManager />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <MovementHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}