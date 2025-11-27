// @ts-nocheck

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Camera, Save, Play, Pause, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkflowUpdate } from '@/hooks/useWorkflowUpdate';
import { useWorkflowHistory } from '@/hooks/useWorkflowHistory';
import { Autocomplete, TextField } from '@mui/material';
import { EmployeeDirectoryEntry } from '@/hooks/useEmployeesDirectory';

interface WorkflowModalProps {
  workflow: unknown;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  employeeOptions?: EmployeeDirectoryEntry[];
  employeesLoading?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  metrologia: 'Metrologia',
  usinagem: 'Usinagem',
  montagem: 'Montagem',
  pronto: 'Pronto',
  garantia: 'Garantia',
  entregue: 'Entregue'
};

export function WorkflowModal({ workflow, open, onClose, onUpdate, employeeOptions = [], employeesLoading = false }: WorkflowModalProps) {
  const { updateWorkflowDetails, startWorkflow, completeWorkflow, advanceToNextStatus } = useWorkflowUpdate();
  const [notes, setNotes] = useState(workflow.notes || '');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(workflow.assigned_to || '');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { history, loading: historyLoading, fetchHistory, clearHistory } = useWorkflowHistory();

  useEffect(() => {
    if (open) {
      setNotes(workflow.notes || '');
      setAssignedEmployeeId(workflow.assigned_to || '');
      if (workflow.id) {
        fetchHistory(workflow.id);
      }
    } else {
      clearHistory();
    }
  }, [open, workflow.id, fetchHistory, clearHistory]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateWorkflowDetails(workflow.id, {
      notes,
      assigned_to: assignedEmployeeId || null
    });
    
    if (success) {
      onUpdate?.(); // Atualizar o board
      onClose();
    }
    setSaving(false);
  };

  const handleStart = async () => {
    const success = await startWorkflow(workflow.id);
    if (success) {
      onUpdate?.(); // Atualizar o board
      onClose();
    }
  };

  const handleComplete = async (autoAdvance: boolean = true) => {
    setCompleting(true);
    const success = await completeWorkflow(workflow.id, autoAdvance);
    if (success) {
      onUpdate?.(); // Atualizar o board
      onClose();
    }
    setCompleting(false);
  };

  const canStartStage = !workflow.started_at || Boolean(workflow.completed_at);
  const isRunning = Boolean(workflow.started_at && !workflow.completed_at);
  const startLabel = !workflow.started_at ? 'Iniciar etapa' : 'Retomar etapa';
  const isEntryStage = workflow.status === 'entrada';
  const isDeliveredStage = workflow.status === 'entregue';
  const slaConfig = workflow.statusConfig?.sla_config as { max_hours?: number; warning_threshold?: number } | undefined;
  const warningThreshold = slaConfig?.warning_threshold
    ? Number(slaConfig.warning_threshold)
    : 80;

  const entryElapsedMs = useMemo(() => {
    const startDate = workflow.created_at ? new Date(workflow.created_at) : null;
    if (!startDate) return 0;
    const endDate = workflow.completed_at ? new Date(workflow.completed_at) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs < 0 ? 0 : diffMs;
  }, [workflow.created_at, workflow.completed_at, open]);

  const entrySlaState = useMemo(() => {
    if (!isEntryStage || !slaConfig?.max_hours || entryElapsedMs <= 0) {
      return null;
    }
    const elapsedHours = entryElapsedMs / (1000 * 60 * 60);
    const percent = (elapsedHours / Number(slaConfig.max_hours)) * 100;
    if (!Number.isFinite(percent)) return null;
    if (percent >= 100) return { status: 'breached', percent };
    if (percent >= (warningThreshold || 80)) return { status: 'warning', percent };
    return { status: 'ok', percent };
  }, [entryElapsedMs, isEntryStage, slaConfig?.max_hours, warningThreshold]);

  const entrySlaStyles = entrySlaState?.status === 'breached'
    ? 'border-red-200 bg-red-50 text-red-700'
    : entrySlaState?.status === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';

  const entrySlaPercent = entrySlaState ? Math.round(entrySlaState.percent) : null;
  const showStageActions = !isEntryStage && !isDeliveredStage;

  const formatDuration = (ms: number) => {
    if (ms <= 0) return '0m';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const timelineEntries = useMemo(() => {
    if (!history || history.length === 0) {
      const fallbackStart = workflow.started_at || workflow.created_at || workflow.updated_at;
      return fallbackStart
        ? [{
            id: 'current',
            status: workflow.status,
            changedAt: fallbackStart,
            durationMs: (workflow.completed_at
              ? new Date(workflow.completed_at).getTime()
              : Date.now()) - new Date(fallbackStart).getTime(),
            isCurrent: true
          }]
        : [];
    }

      const chronological = [...history].sort(
      (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );

      const entries = chronological.map((entry, index) => {
      const nextEntry = chronological[index + 1];
      const exitTime = nextEntry
        ? new Date(nextEntry.changed_at)
        : workflow.completed_at
          ? new Date(workflow.completed_at)
          : new Date();

      return {
        id: entry.id,
        status: entry.new_status,
          changedAt: entry.changed_at,
          durationMs: exitTime.getTime() - new Date(entry.changed_at).getTime(),
        isCurrent: index === chronological.length - 1 && entry.new_status === workflow.status
      };
    });

    const hasCurrent = entries.some(entry => entry.status === workflow.status);
    if (!hasCurrent) {
      entries.push({
        id: 'current',
        status: workflow.status,
        changedAt: workflow.started_at || workflow.updated_at || new Date().toISOString(),
        durationMs: (workflow.completed_at
          ? new Date(workflow.completed_at).getTime()
          : Date.now()) - new Date(workflow.started_at || new Date()).getTime(),
        isCurrent: true
      });
    }

    return entries.sort(
      (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
    );
  }, [history, workflow.status, workflow.started_at, workflow.completed_at, workflow.updated_at, workflow.created_at]);

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const workflowOrderId = workflow.order_id || workflow.order?.id;
  const selectedEmployee = useMemo(() => {
    if (!assignedEmployeeId) return null;
    return employeeOptions.find(employee => employee.id === assignedEmployeeId) || null;
  }, [assignedEmployeeId, employeeOptions]);
  const assignedDisplayName = selectedEmployee?.full_name || workflow.assignedEmployeeName || null;

  const handleEntryAdvance = async () => {
    const success = await advanceToNextStatus({
      id: workflow.id,
      status: workflow.status,
      component: workflow.component,
      order_id: workflowOrderId
    });
    if (success) {
      onUpdate?.();
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      entrada: 'bg-gray-100 text-gray-800',
      metrologia: 'bg-orange-100 text-orange-800',
      usinagem: 'bg-orange-100 text-orange-800',
      montagem: 'bg-yellow-100 text-yellow-800',
      pronto: 'bg-green-100 text-green-800',
      garantia: 'bg-purple-100 text-purple-800',
      entregue: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Workflow - {workflow.component.toUpperCase()}</span>
            <Badge className={getStatusColor(workflow.status)}>
              {workflow.status.toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da OS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Número da OS</Label>
                <p className="font-semibold">{workflow.orderNumber}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Cliente</Label>
                <p>{workflow.customerName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Motor</Label>
                <p>{workflow.engineModel}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Data da Coleta</Label>
                <p>{formatDateTime(workflow.collectionDate)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status do Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflow.started_at && (
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-green-600" />
                  <div>
                    <Label className="text-sm text-gray-600">Iniciado em</Label>
                    <p>{formatDateTime(workflow.started_at)}</p>
                  </div>
                </div>
              )}
              
              {workflow.completed_at && (
                <div className="flex items-center gap-2">
                  <Pause className="w-4 h-4 text-orange-600" />
                  <div>
                    <Label className="text-sm text-gray-600">Concluído em</Label>
                    <p>{formatDateTime(workflow.completed_at)}</p>
                  </div>
                </div>
              )}

              {isEntryStage && (
                <div className={`p-3 rounded-md border ${entrySlaState ? entrySlaStyles : 'border-muted bg-muted/30 text-muted-foreground'}`}>
                  <div className="flex items-center gap-2">
                    {entrySlaState && entrySlaState.status !== 'ok' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <div>
                      <Label className="text-sm text-gray-600">Tempo em Entrada</Label>
                      <p className="text-xs">
                        {formatDuration(entryElapsedMs)}
                        {entrySlaState
                          ? ` • ${entrySlaPercent}% do SLA (máx ${slaConfig?.max_hours}h)`
                          : ' • Configure o SLA desta etapa para habilitar alertas'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showStageActions && (
                <div className="pt-3 space-y-3">
                  {canStartStage && (
                    <Button onClick={handleStart} className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      {startLabel}
                    </Button>
                  )}
                  
                  {isRunning && (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleComplete(true)} 
                        className="w-full"
                        disabled={completing}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        {completing ? "Concluindo..." : "Concluir e avançar"}
                      </Button>
                      <Button 
                        onClick={() => handleComplete(false)} 
                        variant="outline" 
                        className="w-full"
                        disabled={completing}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar etapa
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {isEntryStage && (
                <div className="pt-3 space-y-2">
                  <Button onClick={handleEntryAdvance} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Enviar para próxima etapa
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Esta etapa é apenas de triagem. Ao avançar, o item sai da fila de Entrada.
                  </p>
                </div>
              )}

              {isDeliveredStage && (
                <div className="pt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Workflow concluído. Nenhuma ação adicional é necessária.</span>
                </div>
              )}
          {/* Timeline */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg">Linha do tempo da etapa</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Carregando histórico...</div>
              ) : timelineEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum histórico registrado.</div>
              ) : (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                  {timelineEntries.map((entry, index) => (
                    <div key={`${entry.id}-${index}`} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${entry.isCurrent ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">
                            {STATUS_LABELS[entry.status] || entry.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(entry.changedAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tempo nesta etapa: {formatDuration(entry.durationMs)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Funcionário Responsável</Label>
                  <Autocomplete
                    options={employeeOptions}
                    value={selectedEmployee}
                    onChange={(_, newValue) => setAssignedEmployeeId(newValue?.id || '')}
                    getOptionLabel={(option) => option.full_name}
                    loading={employeesLoading}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="Nenhum funcionário encontrado"
                    fullWidth
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Digite para buscar"
                        label="Buscar funcionário"
                      />
                    )}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {assignedDisplayName
                      ? `Responsável atual: ${assignedDisplayName}`
                      : 'Nenhum funcionário atribuído'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setAssignedEmployeeId('')}
                    disabled={!assignedEmployeeId}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas do Processo</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre esta etapa..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
