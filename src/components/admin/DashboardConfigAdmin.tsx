import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KPIAdmin } from './KPIAdmin';
import { QuickActionsAdmin } from './QuickActionsAdmin';
import { StatusConfigAdmin } from './StatusConfigAdmin';
import { SearchSourcesAdmin } from './SearchSourcesAdmin';
import { ReportCatalogAdmin } from './ReportCatalogAdmin';

export const DashboardConfigAdmin = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuração do Dashboard</h1>
        <p className="text-muted-foreground">
          Configure KPIs, ações rápidas, status e fontes de busca do sistema
        </p>
      </div>

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="search">Busca</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis">
          <KPIAdmin />
        </TabsContent>

        <TabsContent value="actions">
          <QuickActionsAdmin />
        </TabsContent>

        <TabsContent value="status">
          <StatusConfigAdmin />
        </TabsContent>

        <TabsContent value="search">
          <SearchSourcesAdmin />
        </TabsContent>

        <TabsContent value="reports">
          <ReportCatalogAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
};