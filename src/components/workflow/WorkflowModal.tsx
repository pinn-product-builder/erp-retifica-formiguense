
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Camera, Save, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkflowUpdate } from '@/hooks/useWorkflowUpdate';

interface WorkflowModalProps {
  workflow: any;
  open: boolean;
  onClose: () => void;
}

export function WorkflowModal({ workflow, open, onClose }: WorkflowModalProps) {
  const { updateWorkflowDetails, startWorkflow, completeWorkflow } = useWorkflowUpdate();
  const [notes, setNotes] = useState(workflow.notes || '');
  const [assignedTo, setAssignedTo] = useState(workflow.assigned_to || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateWorkflowDetails(workflow.id, {
      notes,
      assigned_to: assignedTo
    });
    
    if (success) {
      onClose();
    }
    setSaving(false);
  };

  const handleStart = async () => {
    const success = await startWorkflow(workflow.id);
    if (success) {
      onClose();
    }
  };

  const handleComplete = async () => {
    const success = await completeWorkflow(workflow.id);
    if (success) {
      onClose();
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      entrada: 'bg-gray-100 text-gray-800',
      metrologia: 'bg-blue-100 text-blue-800',
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
                  <Pause className="w-4 h-4 text-blue-600" />
                  <div>
                    <Label className="text-sm text-gray-600">Concluído em</Label>
                    <p>{formatDateTime(workflow.completed_at)}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 space-y-2">
                {!workflow.started_at && (
                  <Button onClick={handleStart} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Etapa
                  </Button>
                )}
                
                {workflow.started_at && !workflow.completed_at && (
                  <Button onClick={handleComplete} className="w-full">
                    <Pause className="w-4 h-4 mr-2" />
                    Concluir Etapa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="assigned">Funcionário Responsável</Label>
                <Input
                  id="assigned"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Nome do funcionário"
                />
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
