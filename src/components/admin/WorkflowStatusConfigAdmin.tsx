import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Save, X, Settings, Clock, Shield, ArrowRight } from 'lucide-react';
import { useWorkflowStatusConfig, WorkflowStatusConfig, StatusPrerequisite } from '@/hooks/useWorkflowStatusConfig';
import { useWorkflowHistory } from '@/hooks/useWorkflowHistory';
import { useToast } from '@/hooks/use-toast';
import { useEngineComponents } from '@/hooks/useEngineComponents';

export const WorkflowStatusConfigAdmin = () => {
  const {
    workflowStatuses,
    prerequisites,
    loading,
    createStatusConfig,
    updateStatusConfig,
    deleteStatusConfig,
    createPrerequisite,
    updatePrerequisite,
    deletePrerequisite,
    getStatusColors,
    fetchWorkflowStatuses
  } = useWorkflowStatusConfig();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const { toast } = useToast();
  
  const [editingStatus, setEditingStatus] = useState<WorkflowStatusConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  
  // Estados para pré-requisitos
  const [showPrerequisiteDialog, setShowPrerequisiteDialog] = useState(false);
  const [editingPrerequisite, setEditingPrerequisite] = useState<StatusPrerequisite | null>(null);
  const [isCreatingPrerequisite, setIsCreatingPrerequisite] = useState(false);
  
  const { history, fetchHistory } = useWorkflowHistory(selectedWorkflowId);

  const [formData, setFormData] = useState({
    status_key: '',
    status_label: '',
    badge_variant: 'default',
    color: '',
    icon: '',
    display_order: 0,
    estimated_hours: 0,
    is_active: true,
    visual_config: {
      bgColor: '#f3f4f6',
      textColor: '#374151'
    },
    notification_config: {},
    sla_config: {
      max_hours: 0,
      warning_threshold: 80,
      alerts_enabled: false,
      auto_escalation: false,
      business_hours_only: false
    },
    automation_rules: []
  });

  const [prerequisiteFormData, setPrerequisiteFormData] = useState({
    from_status_key: '',
    to_status_key: '',
    component: '',
    transition_type: 'manual' as 'automatic' | 'manual' | 'approval_required' | 'conditional',
    is_active: true
  });

  const statusColors = getStatusColors();

  // Debug: monitorar mudanças no estado isCreating
  useEffect(() => {
    console.log('isCreating state changed to:', isCreating);
  }, [isCreating]);

  // Debug: monitorar mudanças no estado isCreatingPrerequisite
  useEffect(() => {
    console.log('isCreatingPrerequisite state changed to:', isCreatingPrerequisite);
  }, [isCreatingPrerequisite]);

  const resetForm = (resetCreating = false) => {
    setFormData({
      status_key: '',
      status_label: '',
      badge_variant: 'default',
      color: '',
      icon: '',
      display_order: 0,
      estimated_hours: 0,
      is_active: true,
      visual_config: {
        bgColor: '#f3f4f6',
        textColor: '#374151'
      },
      notification_config: {},
      sla_config: {
        max_hours: 0,
        warning_threshold: 80,
        alerts_enabled: false,
        auto_escalation: false,
        business_hours_only: false
      },
      automation_rules: []
    });
    setEditingStatus(null);
    if (resetCreating) {
      setIsCreating(false);
    }
  };

  const openCreateDialog = () => {
    console.log('openCreateDialog called');
    setIsCreating(true);
    setEditingStatus(null);
    resetForm();
    setIsDialogOpen(true);
    console.log('Dialog should be open, isCreating set to true');
    
    // Verificar o estado após um pequeno delay
    setTimeout(() => {
      console.log('State after openCreateDialog - isCreating:', isCreating);
    }, 100);
  };

  const openEditDialog = (status: WorkflowStatusConfig) => {
    setIsCreating(false);
    setEditingStatus(status);
    setFormData({
      status_key: status.status_key,
      status_label: status.status_label,
      badge_variant: status.badge_variant,
      color: status.color || '',
      icon: status.icon || '',
      display_order: status.display_order || 0,
      estimated_hours: status.estimated_hours || 0,
      is_active: status.is_active,
      visual_config: status.visual_config || {
        bgColor: '#f3f4f6',
        textColor: '#374151'
      },
      notification_config: status.notification_config || {},
      sla_config: status.sla_config || {
        max_hours: 0,
        warning_threshold: 80,
        alerts_enabled: false,
        auto_escalation: false,
        business_hours_only: false
      },
      automation_rules: status.automation_rules || []
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    console.log('handleSave called - isCreating:', isCreating, 'editingStatus:', editingStatus);
    
    if (isCreating) {
      // Validação dos campos obrigatórios
      if (!formData.status_key.trim()) {
        toast({
          title: "Erro",
          description: "Chave do status é obrigatória",
          variant: "destructive",
        });
        return;
      }

      if (!formData.status_label.trim()) {
        toast({
          title: "Erro",
          description: "Nome do status é obrigatório",
          variant: "destructive",
        });
        return;
      }

      console.log('Saving new status with formData:', formData);
      
      const statusData = {
        ...formData,
        entity_type: 'workflow',
        visual_config: formData.visual_config
      };
      
      console.log('Final status data to send:', statusData);
      
      const success = await createStatusConfig(statusData);

      if (success) {
        toast({
          title: "Sucesso",
          description: "Status de workflow criado com sucesso",
        });
        setIsDialogOpen(false);
        resetForm(true);
      }
    } else if (editingStatus) {
      console.log('Updating status with formData:', formData);
      
      const success = await updateStatusConfig(editingStatus.id, {
        ...formData,
        visual_config: formData.visual_config
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Status de workflow atualizado com sucesso",
        });
        setIsDialogOpen(false);
        resetForm(true);
      }
    }
  };

  const handleDelete = async (statusId: string) => {
    if (confirm('Tem certeza que deseja excluir este status?')) {
      await deleteStatusConfig(statusId);
    }
  };

  // Funções para pré-requisitos
  const resetPrerequisiteForm = () => {
    setPrerequisiteFormData({
      from_status_key: '',
      to_status_key: '',
      component: '',
      transition_type: 'manual',
      is_active: true
    });
    setEditingPrerequisite(null);
    setIsCreatingPrerequisite(false);
  };

  const openCreatePrerequisiteDialog = () => {
    console.log('openCreatePrerequisiteDialog called');
    setIsCreatingPrerequisite(true);
    setEditingPrerequisite(null);
    resetPrerequisiteForm();
    setShowPrerequisiteDialog(true);
    console.log('Prerequisite dialog should be open, isCreatingPrerequisite set to true');
  };

  const openEditPrerequisiteDialog = (prerequisite: StatusPrerequisite) => {
    setIsCreatingPrerequisite(false);
    setEditingPrerequisite(prerequisite);
    setPrerequisiteFormData({
      from_status_key: prerequisite.from_status_key,
      to_status_key: prerequisite.to_status_key,
      component: prerequisite.component || '',
      transition_type: prerequisite.transition_type,
      is_active: prerequisite.is_active
    });
    setShowPrerequisiteDialog(true);
  };

  const handleSavePrerequisite = async () => {
    console.log('handleSavePrerequisite called - isCreatingPrerequisite:', isCreatingPrerequisite, 'editingPrerequisite:', editingPrerequisite);
    
    if (isCreatingPrerequisite) {
      // Validação dos campos obrigatórios
      if (!prerequisiteFormData.from_status_key.trim()) {
        toast({
          title: "Erro",
          description: "Status de origem é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!prerequisiteFormData.to_status_key.trim()) {
        toast({
          title: "Erro",
          description: "Status de destino é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (prerequisiteFormData.from_status_key === prerequisiteFormData.to_status_key) {
        toast({
          title: "Erro",
          description: "Status de origem e destino não podem ser iguais",
          variant: "destructive",
        });
        return;
      }

      console.log('Saving new prerequisite with formData:', prerequisiteFormData);
      
      const success = await createPrerequisite({
        from_status_key: prerequisiteFormData.from_status_key,
        to_status_key: prerequisiteFormData.to_status_key,
        component: prerequisiteFormData.component || undefined,
        transition_type: prerequisiteFormData.transition_type,
        is_active: prerequisiteFormData.is_active,
        entity_type: 'workflow'
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Pré-requisito criado com sucesso",
        });
        setShowPrerequisiteDialog(false);
        resetPrerequisiteForm();
      }
    } else if (editingPrerequisite) {
      console.log('Updating prerequisite with formData:', prerequisiteFormData);
      
      const success = await updatePrerequisite(editingPrerequisite.id, {
        from_status_key: prerequisiteFormData.from_status_key,
        to_status_key: prerequisiteFormData.to_status_key,
        component: prerequisiteFormData.component || undefined,
        transition_type: prerequisiteFormData.transition_type,
        is_active: prerequisiteFormData.is_active
      });

      if (success) {
        toast({
          title: "Sucesso",
          description: "Pré-requisito atualizado com sucesso",
        });
        setShowPrerequisiteDialog(false);
        resetPrerequisiteForm();
      }
    }
  };

  const handleDeletePrerequisite = async (prerequisiteId: string) => {
    if (confirm('Tem certeza que deseja excluir este pré-requisito?')) {
      await deletePrerequisite(prerequisiteId);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                Configuração de Status de Workflow
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure status personalizados, cores, ícones e regras para workflows
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6">
          <Tabs defaultValue="statuses" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="statuses" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Status</span>
              </TabsTrigger>
              <TabsTrigger value="prerequisites" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Pré-requisitos</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Auditoria</span>
              </TabsTrigger>
            </TabsList>

                <TabsContent value="statuses" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-medium">Status Configurados</h3>
                      <Button 
                        onClick={openCreateDialog} 
                        className="flex items-center gap-2 w-full sm:w-auto h-9 sm:h-10"
                      >
                        <Plus className="w-4 h-4" />
                        Novo Status
                      </Button>
                    </div>

                    {loading ? (
                      <div className="text-center py-6 sm:py-8 text-sm sm:text-base">Carregando...</div>
                    ) : (
                      <div className="space-y-3">
                        {workflowStatuses.map((status) => (
                          <div key={status.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <div
                                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: statusColors[status.status_key]?.bgColor || '#f3f4f6' }}
                                />
                                <h4 className="font-medium text-sm sm:text-base truncate">{status.status_label}</h4>
                                <Badge variant={status.is_active ? "default" : "secondary"} className="text-xs">
                                  {status.is_active ? "Ativo" : "Inativo"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {status.estimated_hours}h estimado
                                </Badge>
                                {status.sla_config?.max_hours && (
                                  <Badge variant="secondary" className="text-xs">
                                    SLA: {status.sla_config.max_hours}h
                                  </Badge>
                                )}
                                {status.sla_config?.alerts_enabled && (
                                  <Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
                                    Alertas
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                Chave: {status.status_key} • Ordem: {status.display_order}
                                {status.icon && ` • Ícone: ${status.icon}`}
                                {status.sla_config?.warning_threshold && ` • Alerta: ${status.sla_config.warning_threshold}%`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(status)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(status.id)}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

            <TabsContent value="prerequisites" className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium">Pré-requisitos de Transição</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Regras que definem as transições permitidas entre status
                    </p>
                  </div>
                  <Button 
                    onClick={openCreatePrerequisiteDialog}
                    className="flex items-center gap-2 w-full sm:w-auto h-9 sm:h-10"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Pré-requisito
                  </Button>
                </div>
                
                {loading ? (
                  <div className="text-center py-6 sm:py-8 text-sm sm:text-base">Carregando...</div>
                ) : (
                  <div className="space-y-3">
                    {prerequisites.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum pré-requisito configurado</p>
                        <p className="text-sm">Clique em "Novo Pré-requisito" para começar</p>
                      </div>
                    ) : (
                      prerequisites.map((prereq) => (
                        <div key={prereq.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg gap-3">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Badge 
                              variant="outline"
                              style={{
                                backgroundColor: statusColors[prereq.from_status_key]?.bgColor,
                                color: statusColors[prereq.from_status_key]?.textColor
                              }}
                              className="text-xs"
                            >
                              {prereq.from_status_key}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <Badge 
                              variant="outline"
                              style={{
                                backgroundColor: statusColors[prereq.to_status_key]?.bgColor,
                                color: statusColors[prereq.to_status_key]?.textColor
                              }}
                              className="text-xs"
                            >
                              {prereq.to_status_key}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {prereq.transition_type}
                            </Badge>
                            {prereq.component && (
                              <Badge variant="outline" className="text-xs">
                                {prereq.component}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditPrerequisiteDialog(prereq)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePrerequisite(prereq.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </TabsContent>


            <TabsContent value="audit" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Sistema de Auditoria
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="audit-enabled" defaultChecked />
                    <Label htmlFor="audit-enabled">Habilitar auditoria de mudanças</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="require-reason" />
                    <Label htmlFor="require-reason">Exigir motivo para mudanças</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="notification-changes" defaultChecked />
                    <Label htmlFor="notification-changes">Notificar mudanças de status</Label>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Histórico Recente</h4>
                  {history.length > 0 ? (
                    <div className="space-y-2">
                      {history.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {entry.from_status} → {entry.to_status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum histórico disponível</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          // Só resetar quando fechar o dialog
          setIsDialogOpen(false);
          resetForm(true); // Resetar isCreating também
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 sm:pb-6">
            <DialogTitle className="text-lg sm:text-xl">
              {isCreating ? 'Criar Novo Status' : `Editar Status: ${editingStatus?.status_label}`}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {isCreating 
                ? 'Configure as propriedades do novo status de workflow'
                : 'Configure as propriedades visuais e comportamentais do status'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status_key" className="text-sm font-medium">Chave do Status</Label>
                <Input
                  id="status_key"
                  value={formData.status_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, status_key: e.target.value }))}
                  placeholder="ex: entrada, usinagem"
                  disabled={!isCreating}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status_label" className="text-sm font-medium">Nome do Status</Label>
                <Input
                  id="status_label"
                  value={formData.status_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, status_label: e.target.value }))}
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours" className="text-sm font-medium">Tempo Estimado (horas)</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) }))}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order" className="text-sm font-medium">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            {/* Configurações Avançadas de SLA e Tempo */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h4 className="font-medium text-sm sm:text-base">Configurações de SLA e Tempo</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sla_max_hours" className="text-sm font-medium">SLA Máximo (horas)</Label>
                  <Input
                    id="sla_max_hours"
                    type="number"
                    step="0.5"
                    value={formData.sla_config?.max_hours || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sla_config: { 
                        ...prev.sla_config, 
                        max_hours: parseFloat(e.target.value) || 0 
                      }
                    }))}
                    placeholder="Ex: 24"
                    className="h-9 sm:h-10"
                  />
                  <p className="text-xs text-muted-foreground">Tempo máximo antes de alertas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warning_threshold" className="text-sm font-medium">Alerta em % do SLA</Label>
                  <Input
                    id="warning_threshold"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.sla_config?.warning_threshold || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sla_config: { 
                        ...prev.sla_config, 
                        warning_threshold: parseInt(e.target.value) || 80 
                      }
                    }))}
                    placeholder="80"
                    className="h-9 sm:h-10"
                  />
                  <p className="text-xs text-muted-foreground">% do SLA para disparar alerta</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sla_alerts_enabled"
                    checked={formData.sla_config?.alerts_enabled || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      sla_config: { 
                        ...prev.sla_config, 
                        alerts_enabled: checked 
                      }
                    }))}
                  />
                  <Label htmlFor="sla_alerts_enabled" className="text-sm font-medium">Habilitar Alertas de SLA</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_escalation"
                    checked={formData.sla_config?.auto_escalation || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      sla_config: { 
                        ...prev.sla_config, 
                        auto_escalation: checked 
                      }
                    }))}
                  />
                  <Label htmlFor="auto_escalation" className="text-sm font-medium">Escalação Automática</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="business_hours_only"
                    checked={formData.sla_config?.business_hours_only || false}
                    onCheckedChange={(checked) => setFormData(prev => ({
                      ...prev,
                      sla_config: { 
                        ...prev.sla_config, 
                        business_hours_only: checked 
                      }
                    }))}
                  />
                  <Label htmlFor="business_hours_only" className="text-sm font-medium">Considerar Apenas Horário Comercial</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bg_color" className="text-sm font-medium">Cor de Fundo</Label>
                <Input
                  id="bg_color"
                  type="color"
                  value={formData.visual_config.bgColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visual_config: { ...prev.visual_config, bgColor: e.target.value }
                  }))}
                  className="h-9 sm:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="text_color" className="text-sm font-medium">Cor do Texto</Label>
                <Input
                  id="text_color"
                  type="color"
                  value={formData.visual_config.textColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    visual_config: { ...prev.visual_config, textColor: e.target.value }
                  }))}
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 sm:p-4 bg-muted/30 rounded-lg">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">Status Ativo</Label>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="p-3 sm:p-4 border rounded-lg bg-muted/20">
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: formData.visual_config.bgColor,
                    color: formData.visual_config.textColor,
                    borderColor: formData.visual_config.textColor
                  }}
                  className="text-sm"
                >
                  {formData.status_label || 'Nome do Status'}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-4 sm:pt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Pré-requisitos */}
      <Dialog open={showPrerequisiteDialog} onOpenChange={(open) => {
        if (!open) {
          // Só resetar quando fechar o dialog
          setShowPrerequisiteDialog(false);
          resetPrerequisiteForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 sm:pb-6">
            <DialogTitle className="text-lg sm:text-xl">
              {isCreatingPrerequisite ? 'Criar Novo Pré-requisito' : `Editar Pré-requisito`}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {isCreatingPrerequisite 
                ? 'Configure uma nova regra de transição entre status'
                : 'Modifique a regra de transição existente'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_status" className="text-sm font-medium">Status de Origem</Label>
                <Select
                  value={prerequisiteFormData.from_status_key}
                  onValueChange={(value) => setPrerequisiteFormData(prev => ({ ...prev, from_status_key: value }))}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Selecione o status de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowStatuses.map((status) => (
                      <SelectItem key={status.status_key} value={status.status_key}>
                        {status.status_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_status" className="text-sm font-medium">Status de Destino</Label>
                <Select
                  value={prerequisiteFormData.to_status_key}
                  onValueChange={(value) => setPrerequisiteFormData(prev => ({ ...prev, to_status_key: value }))}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Selecione o status de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowStatuses.map((status) => (
                      <SelectItem key={status.status_key} value={status.status_key}>
                        {status.status_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="component" className="text-sm font-medium">Componente (Opcional)</Label>
                <Select
                  value={prerequisiteFormData.component || "todos"}
                  onValueChange={(value) => setPrerequisiteFormData(prev => ({ ...prev, component: value === "todos" ? "" : value }))}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Selecione o componente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os componentes</SelectItem>
                    {componentsLoading ? (
                      <SelectItem value="loading" disabled>Carregando componentes...</SelectItem>
                    ) : (
                      engineComponents.map((component) => (
                        <SelectItem key={component.value} value={component.value}>
                          {component.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transition_type" className="text-sm font-medium">Tipo de Transição</Label>
                <Select
                  value={prerequisiteFormData.transition_type}
                  onValueChange={(value: 'automatic' | 'manual' | 'approval_required' | 'conditional') => setPrerequisiteFormData(prev => ({ ...prev, transition_type: value }))}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automática</SelectItem>
                    <SelectItem value="approval_required">Requer Aprovação</SelectItem>
                    <SelectItem value="conditional">Condicional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 sm:p-4 bg-muted/30 rounded-lg">
              <Switch
                id="prerequisite_active"
                checked={prerequisiteFormData.is_active}
                onCheckedChange={(checked) => setPrerequisiteFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="prerequisite_active" className="text-sm font-medium">Pré-requisito Ativo</Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-4 sm:pt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowPrerequisiteDialog(false)}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePrerequisite}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreatingPrerequisite ? 'Criar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
