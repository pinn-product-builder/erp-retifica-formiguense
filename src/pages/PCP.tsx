import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, Users, Settings, Plus } from 'lucide-react';
import { usePCP } from '@/hooks/usePCP';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EngineComponent } from '@/hooks/usePCP';

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
  const { schedules, resources, alerts, loading, createSchedule, updateSchedule, markAlertRead } = usePCP();
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [newSchedule, setNewSchedule] = useState({
    order_id: '',
    component: '' as EngineComponent | '',
    planned_start_date: '',
    planned_end_date: '',
    estimated_hours: 0,
    priority: 1,
    assigned_to: '',
    notes: '',
  });

  const handleCreateSchedule = async () => {
    if (!newSchedule.order_id || !newSchedule.component) return;
    
    await createSchedule({
      ...newSchedule,
      component: newSchedule.component as EngineComponent,
      status: 'planned',
    });
    
    setNewSchedule({
      order_id: '',
      component: '' as EngineComponent | '',
      planned_start_date: '',
      planned_end_date: '',
      estimated_hours: 0,
      priority: 1,
      assigned_to: '',
      notes: '',
    });
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">PCP - Planejamento e Controle da Produção</h1>
          <p className="text-muted-foreground">Gerencie cronogramas, recursos e monitore a produção</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cronograma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Cronograma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Ordem de Serviço</Label>
                <Input
                  value={newSchedule.order_id}
                  onChange={(e) => setNewSchedule({...newSchedule, order_id: e.target.value})}
                  placeholder="ID da OS"
                />
              </div>
              <div>
                <Label>Componente</Label>
                        <Select 
                          value={newSchedule.component} 
                          onValueChange={(value) => setNewSchedule({...newSchedule, component: value as EngineComponent})}
                        >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o componente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bloco">Bloco</SelectItem>
                    <SelectItem value="cabecote">Cabeçote</SelectItem>
                    <SelectItem value="virabrequim">Virabrequim</SelectItem>
                    <SelectItem value="pistao">Pistão</SelectItem>
                    <SelectItem value="biela">Biela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <div>
                  <Label>Horas Estimadas</Label>
                  <Input
                    type="number"
                    value={newSchedule.estimated_hours}
                    onChange={(e) => setNewSchedule({...newSchedule, estimated_hours: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Prioridade (1-5)</Label>
                  <Input
                    type="number"
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
              <Button onClick={handleCreateSchedule} className="w-full">
                Criar Cronograma
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p>Carregando cronogramas...</p>
            ) : schedules.length === 0 ? (
              <p className="text-muted-foreground">Nenhum cronograma encontrado</p>
            ) : (
              schedules.map((schedule) => (
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
                          {schedule.status}
                        </Badge>
                        <Badge variant="outline">
                          Prioridade {schedule.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Componente: {schedule.component} | {schedule.estimated_hours}h estimadas
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
                    
                    <div className="flex gap-1">
                      {schedule.status === 'planned' && (
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(schedule.id, 'in_progress');
                          }}
                        >
                          Iniciar
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
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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