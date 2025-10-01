import React from 'react';
import { AlertCircle, Package, DollarSign, ShoppingCart, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlertsDashboard } from '@/hooks/useAlertsDashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function AlertsDashboard() {
  const { alerts, loading } = useAlertsDashboard();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Atenção</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Central de Alertas</h2>
          <p className="text-muted-foreground">
            {alerts.totalAlerts} {alerts.totalAlerts === 1 ? 'alerta ativo' : 'alertas ativos'}
          </p>
        </div>
      </div>

      {/* Resumo de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.stockAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {alerts.stockAlerts.filter(a => a.alert_level === 'critical').length} críticos
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Orçamentos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.budgetAlerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Necessidades de Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.purchaseNeeds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {alerts.purchaseNeeds.filter(p => p.priority_level === 'critical').length} urgentes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Workflows Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.workflowPending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Checklists obrigatórios
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Estoque */}
      {alerts.stockAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Alertas de Estoque ({alerts.stockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.stockAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.alert_level || 'info')}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(alert.alert_level || 'info')}
                        <span className="font-semibold">{alert.part_name}</span>
                      </div>
                      <p className="text-sm">
                        Código: {alert.part_code} | Estoque atual: {alert.current_stock} | 
                        Mínimo: {alert.minimum_stock}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/estoque')}>
                      Ver Estoque
                    </Button>
                  </div>
                </div>
              ))}
              {alerts.stockAlerts.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/estoque')}
                >
                  Ver todos os {alerts.stockAlerts.length} alertas
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orçamentos Pendentes */}
      {alerts.budgetAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Orçamentos Pendentes ({alerts.budgetAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.budgetAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg border-l-4 border-l-yellow-500 bg-yellow-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-yellow-500">Pendente</Badge>
                        <span className="font-semibold">{alert.alert_message}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/orcamentos')}>
                      Ver Orçamento
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Necessidades de Compra */}
      {alerts.purchaseNeeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Necessidades de Compra ({alerts.purchaseNeeds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.purchaseNeeds.slice(0, 5).map((need) => (
                <div
                  key={need.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    need.priority_level === 'critical'
                      ? 'border-l-red-500 bg-red-50'
                      : need.priority_level === 'high'
                      ? 'border-l-orange-500 bg-orange-50'
                      : 'border-l-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={need.priority_level === 'critical' ? 'destructive' : 'secondary'}
                        >
                          {need.priority_level === 'critical' ? 'Urgente' : 
                           need.priority_level === 'high' ? 'Alta' : 'Normal'}
                        </Badge>
                        <span className="font-semibold">{need.part_name}</span>
                      </div>
                      <p className="text-sm">
                        Necessário: {need.required_quantity} | Disponível: {need.available_quantity} | 
                        Falta: {need.shortage_quantity}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tipo: {need.need_type === 'emergency' ? 'Emergencial' : 'Planejada'} | 
                        Criado em {format(new Date(need.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/compras')}>
                      Comprar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows Pendentes */}
      {alerts.workflowPending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Workflows Aguardando Checklist ({alerts.workflowPending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.workflowPending.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-4 rounded-lg border-l-4 border-l-purple-500 bg-purple-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">Pendente</Badge>
                        <span className="font-semibold">
                          Componente: {workflow.component} | Status: {workflow.status}
                        </span>
                      </div>
                      <p className="text-sm">
                        Ordem: {workflow.order_number} | 
                        Iniciado em {format(new Date(workflow.started_at || workflow.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/workflows')}>
                      Ver Workflow
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há alertas */}
      {alerts.totalAlerts === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum alerta ativo</h3>
            <p className="text-muted-foreground text-center">
              Tudo funcionando perfeitamente! Não há alertas ou pendências no momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

