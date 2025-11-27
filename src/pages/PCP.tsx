import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, Users, Settings, Plus } from 'lucide-react';
import { usePCP, ProductionSchedule } from '@/hooks/usePCP';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OrderSelect } from '@/components/ui/order-select';
import { useToast } from '@/hooks/use-toast';

import { SCHEDULE_STATUS, translateStatus, translateAction, translateMessage } from '@/utils/statusTranslations';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useModuleGuard } from "@/hooks/useRoleGuard";

const STATUS_COLORS = {
  planned: 'bg-blue-500/20 text-blue-700',
  in_progress: 'bg-yellow-500/20 text-yellow-700',
  completed: 'bg-green-500/20 text-green-700',
  delayed: 'bg-red-500/20 text-red-700',
};

const ALERT_COLORS = {
  info: 'bg-blue-500/20 text-blue-700',
  warning: 'bg-yellow-500/20 text-yellow-700',
  error: 'bg-red-500/20 text-red-700',
  critical: 'bg-red-600 text-white',
};

export default function PCP() {
  const { hasPermission, permissions } = useModuleGuard('production', 'read', { blockAccess: true });
  
  const { schedules, resources, alerts, loading, totalCount, createSchedule, updateSchedule, markAlertRead, fetchSchedules } = usePCP();
  const { toast } = useToast();
  
  const canEdit = permissions.canEditModule('production');
  const [selectedSchedule, setSelectedSchedule] = useState<ProductionSchedule | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [newSchedule, setNewSchedule] = useState({
    order_id: '',
    planned_start_date: '',
    planned_end_date: '',
    estimated_hours: 0,
    priority: 1,
    assigned_to: '',
    notes: '',
  });

  const resetForm = () => {
    setNewSchedule({
      order_id: '',
      planned_start_date: '',
      planned_end_date: '',
      estimated_hours: 0,
      priority: 1,
      assigned_to: '',
      notes: '',
    });
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm(); // Limpar formulário quando modal fechar
    }
  };

  const handleCreateSchedule = async () => {
    if (!newSchedule.order_id) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, selecione uma ordem de serviço.",
      });
      return;
    }
    
    setCreateLoading(true);
    try {
      const result = await createSchedule({
        ...newSchedule,
        component: null,
        status: 'planned',
      });

      if (result) {
        resetForm(); // Limpar formulário
        setIsDialogOpen(false); // Fechar o modal

        toast({
          title: "Cronograma criado",
          description: "Cronograma de produção criado com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao criar cronograma:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar cronograma",
        description: "Não foi possível criar o cronograma. Tente novamente.",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const updates: { status: string; actual_start_date?: string; actual_end_date?: string } = { status };
    
    if (status === 'in_progress' && !selectedSchedule?.actual_start_date) {
      updates.actual_start_date = new Date().toISOString().split('T')[0];
    }
    
    if (status === 'completed' && !selectedSchedule?.actual_end_date) {
      updates.actual_end_date = new Date().toISOString().split('T')[0];
    }
    
    await updateSchedule(id, updates);
  };

  const getTotalCapacity = () => {
    return resources.reduce((total, resource) => total + resource.daily_capacity_hours, 0);
  };

  const getScheduledHours = () => {
    const today = new Date().toISOString().split('T')[0];
    return schedules
      .filter(schedule => 
        schedule.planned_start_date <= today && 
        schedule.planned_end_date >= today &&
        schedule.status !== 'completed'
      )
      .reduce((total, schedule) => total + schedule.estimated_hours, 0);
  };

  useEffect(() => {
    fetchSchedules(currentPage, pageSize);
  }, [currentPage, pageSize, fetchSchedules]);

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">PCP - Planejamento e Controle da Produção</h1>
          <p className="text-muted-foreground">Gerencie cronogramas, recursos e monitore a produção</p>
        </div>
        
        {canEdit && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {translateAction('new')} Cronograma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{translateAction('create')} Cronograma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <OrderSelect
                label="Ordem de Serviço"
                value={newSchedule.order_id}
                onValueChange={(orderId) => setNewSchedule({...newSchedule, order_id: orderId})}
                filterByApprovedBudget="aprovado"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={newSchedule.planned_start_date}
                    onChange={(e) => setNewSchedule({...newSchedule, planned_start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={newSchedule.planned_end_date}
                    onChange={(e) => setNewSchedule({...newSchedule, planned_end_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label>Horas Estimadas</Label>
                  <Input
                    type="string"
                    value={newSchedule.estimated_hours}
                    onChange={(e) => setNewSchedule({...newSchedule, estimated_hours: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Prioridade (1-5)</Label>
                  <Input
                    type="string"
                    min="1"
                    max="5"
                    value={newSchedule.priority}
                    onChange={(e) => setNewSchedule({...newSchedule, priority: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label>Responsável</Label>
                <Input
                  value={newSchedule.assigned_to}
                  onChange={(e) => setNewSchedule({...newSchedule, assigned_to: e.target.value})}
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({...newSchedule, notes: e.target.value})}
                  placeholder="Observações adicionais"
                />
              </div>
              <Button 
                onClick={handleCreateSchedule} 
                className="w-full"
                disabled={createLoading || !newSchedule.order_id}
              >
                {createLoading ? translateMessage('creating') : `${translateAction('create')} Cronograma`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cronogramas Ativos</p>
                <p className="text-2xl font-bold">{schedules.filter(s => s.status !== 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Capacidade Total</p>
                <p className="text-2xl font-bold">{getTotalCapacity()}h/dia</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Horas Agendadas Hoje</p>
                <p className="text-2xl font-bold">{getScheduledHours()}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg ${ALERT_COLORS[alert.severity as keyof typeof ALERT_COLORS] || 'bg-gray-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm opacity-90">{alert.message}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAlertRead(alert.id)}
                    >
                      Marcar Lido
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Cronogramas de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p>{translateMessage('loading')} cronogramas...</p>
            ) : schedules.length === 0 ? (
              <p className="text-muted-foreground">{translateMessage('no_data')}</p>
            ) : (
              <>
                {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {schedule.order?.order_number || `OS-${schedule.order_id.slice(-4)}`}
                        </p>
                        <Badge className={STATUS_COLORS[schedule.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                          {translateStatus(schedule.status, 'schedule')}
                        </Badge>
                        <Badge variant="outline">
                          Prioridade {schedule.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {schedule.estimated_hours}h estimadas
                      </p>
                      <p className="text-sm">
                        {new Date(schedule.planned_start_date).toLocaleDateString()} - {new Date(schedule.planned_end_date).toLocaleDateString()}
                      </p>
                      {schedule.assigned_to && (
                        <p className="text-sm text-muted-foreground">
                          Responsável: {schedule.assigned_to}
                        </p>
                      )}
                    </div>
                    
                    {canEdit && (
                    <div className="flex gap-1">
                      {schedule.status === 'planned' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(schedule.id, 'in_progress');
                          }}
                        >
                          {translateAction('start')}
                        </Button>
                      )}
                      {schedule.status === 'in_progress' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(schedule.id, 'completed');
                          }}
                        >
                          {translateAction('complete')}
                        </Button>
                      )}
                    </div>
                    )}
                  </div>
                </div>
                ))}
                {totalCount > 0 && (
                  <div className="mt-4">
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) {
                                  setCurrentPage(currentPage - 1);
                                }
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPage(page);
                                    }}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            return null;
                          })}
                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) {
                                  setCurrentPage(currentPage + 1);
                                }
                              }}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} cronogramas
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Recursos de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{resource.resource_name}</h3>
                  <Badge variant="outline">{resource.resource_type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Capacidade: {resource.daily_capacity_hours}h/dia
                </p>
              </div>
            ))}
            {resources.length === 0 && (
              <p className="text-muted-foreground col-span-full">Nenhum recurso cadastrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}