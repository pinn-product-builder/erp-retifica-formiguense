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
import { Plus, Edit, Trash2, Save, X, Settings, Clock, Shield, ArrowRight, Search } from 'lucide-react';
import { useWorkflowStatusConfig, WorkflowStatusConfig, StatusPrerequisite, FIXED_WORKFLOW_STATUSES } from '@/hooks/useWorkflowStatusConfig';
import { useWorkflowHistory } from '@/hooks/useWorkflowHistory';
import { useToast } from '@/hooks/use-toast';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';

// Interfaces para tipagem específica
interface SLAConfig {
  max_hours: number;
  warning_threshold: number;
  alerts_enabled: boolean;
  auto_escalation: boolean;
  business_hours_only: boolean;
}

interface VisualConfig {
  bgColor: string;
  textColor: string;
}

const FIXED_STATUS_SET = new Set(FIXED_WORKFLOW_STATUSES);

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
  const { confirm } = useConfirmDialog();
  const { currentOrganization } = useOrganization();
  const isFixedStatusKey = (statusKey: string) => FIXED_STATUS_SET.has(statusKey);
  
  const [editingStatus, setEditingStatus] = useState<WorkflowStatusConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  
  // Estados para pré-requisitos
  const [showPrerequisiteDialog, setShowPrerequisiteDialog] = useState(false);
  const [editingPrerequisite, setEditingPrerequisite] = useState<StatusPrerequisite | null>(null);
  const [isCreatingPrerequisite, setIsCreatingPrerequisite] = useState(false);
  
  // Estados para configurações de auditoria
  const [auditEnabled, setAuditEnabled] = useState(true);
  const [requireReason, setRequireReason] = useState(false);
  const [notificationChanges, setNotificationChanges] = useState(true);
  const [loadingAuditConfig, setLoadingAuditConfig] = useState(false);
  
  // Estado para busca de componentes
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  
  const { history, fetchHistory } = useWorkflowHistory();

  const [formData, setFormData] = useState({
    status_key: '',
    status_label: '',
    badge_variant: 'default',
    color: '',
    icon: '',
    display_order: 0,
    estimated_hours: 0,
    is_active: true,
    allow_component_split: false,
    allowed_components: null as string[] | null,
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
  const isFixedFormStatus = !isCreating && isFixedStatusKey(formData.status_key);

  useEffect(() => {
    if (selectedWorkflowId) {
      fetchHistory(selectedWorkflowId);
    }
  }, [selectedWorkflowId, fetchHistory]);

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
      allow_component_split: false,
      allowed_components: null,
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
    setComponentSearchTerm(''); // Limpar busca
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
    const normalizedStatus = isFixedStatusKey(status.status_key)
      ? { ...status, is_active: true }
      : status;
    setEditingStatus(normalizedStatus);
    setFormData({
      status_key: normalizedStatus.status_key,
      status_label: normalizedStatus.status_label,
      badge_variant: normalizedStatus.badge_variant,
      color: normalizedStatus.color || '',
      icon: normalizedStatus.icon || '',
      display_order: normalizedStatus.display_order || 0,
      estimated_hours: normalizedStatus.estimated_hours || 0,
      is_active: normalizedStatus.is_active,
      allow_component_split: normalizedStatus.allow_component_split || false,
      allowed_components: normalizedStatus.allowed_components || null,
      visual_config: (normalizedStatus.visual_config as unknown as VisualConfig) || {
        bgColor: '#f3f4f6',
        textColor: '#374151'
      },
      notification_config: normalizedStatus.notification_config || {},
      sla_config: (normalizedStatus.sla_config as unknown as SLAConfig) || {
        max_hours: 0,
        warning_threshold: 80,
        alerts_enabled: false,
        auto_escalation: false,
        business_hours_only: false
      },
      automation_rules: (normalizedStatus.automation_rules as unknown[]) || []
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

      if (isFixedStatusKey(formData.status_key)) {
        toast({
          title: "Status reservado",
          description: "Entrada e Entregue já estão configurados automaticamente e não podem ser recriados.",
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
      
      const updates: Partial<WorkflowStatusConfig> = {
        ...formData,
        visual_config: formData.visual_config
      };

      if (isFixedStatusKey(formData.status_key)) {
        updates.is_active = true;
      }

      const success = await updateStatusConfig(editingStatus.id, updates);

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
    const statusToDelete = workflowStatuses.find(status => status.id === statusId);
    const statusName = statusToDelete?.status_label || 'este status';
    const statusKey = statusToDelete?.status_key || '';

    if (statusKey && isFixedStatusKey(statusKey)) {
      toast({
        title: "Status obrigatório",
        description: "Entrada e Entregue são etapas fixas e não podem ser removidas.",
        variant: "destructive",
      });
      return;
    }
    
    const confirmed = await confirm({
      title: 'Excluir Status de Workflow',
      description: `Status: "${statusName}" (${statusKey})

⚠️ ATENÇÃO: Esta ação é irreversível!

O que será verificado:
• Se existem ordens de serviço utilizando este status
• Se há dependências ativas no sistema

Se houver ordens de serviço:
• A exclusão será bloqueada automaticamente
• Você precisará mover as ordens para outro status primeiro
• Uma mensagem específica será exibida

Se não houver dependências:
• O status será excluído permanentemente
• Todas as configurações relacionadas serão removidas

Tem certeza que deseja continuar?`,
      confirmText: 'Verificar e Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
      showIcon: true,
      iconType: 'danger'
    });

    if (confirmed) {
      const success = await deleteStatusConfig(statusId);
      if (success) {
        // A função deleteStatusConfig já chama fetchWorkflowStatuses() internamente
        // e exibe o toast de sucesso, então não precisamos fazer nada adicional aqui
      }
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
        setIsCreatingPrerequisite(false);
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
        setIsCreatingPrerequisite(false);
      }
    }
  };

  const handleDeletePrerequisite = async (prerequisiteId: string) => {
    const prerequisiteToDelete = prerequisites.find(prereq => prereq.id === prerequisiteId);
    const fromStatus = prerequisiteToDelete?.from_status_key || '';
    const toStatus = prerequisiteToDelete?.to_status_key || '';
    const component = prerequisiteToDelete?.component || 'Todos os componentes';
    const transitionType = prerequisiteToDelete?.transition_type || 'manual';
    
    const confirmed = await confirm({
      title: 'Excluir Pré-requisito de Transição',
      description: `Transição: ${fromStatus} → ${toStatus}
Componente: ${component}
Tipo: ${transitionType}

⚠️ ATENÇÃO: Esta ação é irreversível!

O que será verificado:
• Se existem ordens de serviço no status de origem
• Se há dependências ativas que usam esta transição

Se houver ordens no status de origem:
• Você receberá um aviso sobre o possível impacto
• A transição será removida mesmo assim (apenas aviso)
• Ordens podem ficar "presas" sem transições válidas

Se não houver dependências:
• O pré-requisito será excluído permanentemente
• A transição não estará mais disponível no sistema

Tem certeza que deseja continuar?`,
      confirmText: 'Verificar e Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
      showIcon: true,
      iconType: 'warning'
    });

    if (confirmed) {
      const success = await deletePrerequisite(prerequisiteId);
      if (success) {
        // A função deletePrerequisite já chama fetchPrerequisites() internamente
        // e exibe o toast de sucesso, então não precisamos fazer nada adicional aqui
      }
    }
  };

  // Funções para configurações de auditoria
  const loadAuditConfig = async () => {
    if (!currentOrganization) {
      console.log('No organization found, skipping audit config load');
      return;
    }
    
    setLoadingAuditConfig(true);
    try {
      console.log('Loading audit config for org:', currentOrganization.id);
      
      const { data, error } = await supabase
        .from('system_config')
        .select('key, value')
        .eq('org_id', currentOrganization.id)
        .eq('category', 'audit')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching audit config:', error);
        throw error;
      }

      console.log('Loaded audit configs:', data);

      if (data && data.length > 0) {
        data.forEach((config) => {
          const value = config.value === 'true';
          console.log(`Setting ${config.key} to ${value}`);
          switch (config.key) {
            case 'audit_enabled':
              setAuditEnabled(value);
              break;
            case 'require_reason':
              setRequireReason(value);
              break;
            case 'notification_changes':
              setNotificationChanges(value);
              break;
          }
        });
      } else {
        console.log('No audit configs found, using defaults');
      }
    } catch (error) {
      console.error('Error loading audit config:', error);
      // Não exibir toast para erro de carregamento inicial
      // para não ser intrusivo se ainda não existem configurações
    } finally {
      setLoadingAuditConfig(false);
    }
  };

  const saveAuditConfig = async (key: string, value: boolean) => {
    if (!currentOrganization) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return;
    }

    try {
      const configValue = value.toString();
      
      // Verificar se a configuração já existe
      const { data: existing } = await supabase
        .from('system_config')
        .select('id')
        .eq('org_id', currentOrganization.id)
        .eq('key', key)
        .single();

      if (existing) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('system_config')
          .update({ 
            value: configValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('system_config')
          .insert({
            org_id: currentOrganization.id,
            key: key,
            value: configValue,
            category: 'audit',
            description: getAuditConfigDescription(key),
            data_type: 'boolean',
            is_active: true
          });

        if (error) throw error;
      }
      
      // Salvar sem mostrar toast para não ser intrusivo
      console.log('Audit configuration saved:', key, value);
    } catch (error) {
      console.error('Error saving audit config:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar configuração de auditoria: ${(error as Error).message || error}`,
        variant: "destructive",
      });
      // Reverter a mudança em caso de erro
      switch (key) {
        case 'audit_enabled':
          setAuditEnabled(!value);
          break;
        case 'require_reason':
          setRequireReason(!value);
          break;
        case 'notification_changes':
          setNotificationChanges(!value);
          break;
      }
    }
  };

  const getAuditConfigDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      audit_enabled: 'Habilitar auditoria de mudanças de status',
      require_reason: 'Exigir motivo para mudanças de status',
      notification_changes: 'Notificar mudanças de status'
    };
    return descriptions[key] || '';
  };

  useEffect(() => {
    if (currentOrganization) {
      loadAuditConfig();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization]);

  const handleAuditChange = (key: string, value: boolean) => {
    switch (key) {
      case 'audit_enabled':
        setAuditEnabled(value);
        break;
      case 'require_reason':
        setRequireReason(value);
        break;
      case 'notification_changes':
        setNotificationChanges(value);
        break;
    }
    saveAuditConfig(key, value);
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
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Os status <strong>Entrada</strong> e <strong>Entregue</strong> são fixos: aparecem no início e fim do fluxo, não podendo ser desativados ou excluídos.
                    </p>

                    {loading ? (
                      <div className="text-center py-6 sm:py-8 text-sm sm:text-base">Carregando...</div>
                    ) : (
                      <div className="space-y-3">
                        {workflowStatuses.map((status) => {
                          const isFixedStatus = isFixedStatusKey(status.status_key);
                          return (
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
                                {isFixedStatus && (
                                  <Badge variant="outline" className="text-xs border-dashed">
                                    Fixo
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {status.estimated_hours}h estimado
                                </Badge>
                                {((status.sla_config as unknown as SLAConfig)?.max_hours) && (
                                  <Badge variant="secondary" className="text-xs">
                                    SLA: {(status.sla_config as unknown as SLAConfig).max_hours}h
                                  </Badge>
                                )}
                                {((status.sla_config as unknown as SLAConfig)?.alerts_enabled) && (
                                  <Badge variant="default" className="text-xs bg-orange-100 text-orange-800">
                                    Alertas
                                  </Badge>
                                )}
                                {status.allow_component_split && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Por Componente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                Chave: {status.status_key} • Ordem: {status.display_order}
                                {status.icon && ` • Ícone: ${status.icon}`}
                                {((status.sla_config as unknown as SLAConfig)?.warning_threshold) && ` • Alerta: ${(status.sla_config as unknown as SLAConfig).warning_threshold}%`}
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
                                disabled={isFixedStatus}
                                className={`text-destructive hover:text-destructive h-8 w-8 p-0 ${isFixedStatus ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )})}
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
                    <Switch 
                      id="audit-enabled" 
                      checked={auditEnabled}
                      onCheckedChange={(checked) => handleAuditChange('audit_enabled', checked)}
                      disabled={loadingAuditConfig}
                    />
                    <Label htmlFor="audit-enabled">Habilitar auditoria de mudanças</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="require-reason" 
                      checked={requireReason}
                      onCheckedChange={(checked) => handleAuditChange('require_reason', checked)}
                      disabled={loadingAuditConfig}
                    />
                    <Label htmlFor="require-reason">Exigir motivo para mudanças</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="notification-changes" 
                      checked={notificationChanges}
                      onCheckedChange={(checked) => handleAuditChange('notification_changes', checked)}
                      disabled={loadingAuditConfig}
                    />
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
                  disabled={isFixedFormStatus}
                  className="h-9 sm:h-10"
                />
                {isFixedFormStatus && (
                  <p className="text-xs text-muted-foreground">
                    Entrada e Entregue têm posições fixas (início e fim).
                  </p>
                )}
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
                disabled={isFixedFormStatus}
              />
              <Label htmlFor="is_active" className="text-sm font-medium">Status Ativo</Label>
            </div>
            {isFixedFormStatus && (
              <p className="text-xs text-muted-foreground -mt-2">
                Entrada e Entregue são sempre ativos.
              </p>
            )}

            <div className="flex items-center space-x-2 p-3 sm:p-4 bg-muted/30 rounded-lg">
              <Switch
                id="allow_component_split"
                checked={formData.allow_component_split}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_component_split: checked }))}
              />
              <div className="flex-1">
                <Label htmlFor="allow_component_split" className="text-sm font-medium">Permitir Desmembramento por Componente</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Se ativado, este status permitirá que os componentes sejam exibidos separadamente no workflow. Se desativado, mostrará apenas a OS completa.
                </p>
              </div>
            </div>

            {/* Seletor de Componentes Permitidos - Aparece quando desmembramento está ativo */}
            {formData.allow_component_split && (
              <div className="space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Componentes Permitidos no Desmembramento</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecione quais componentes podem ser visualizados separadamente neste status. 
                    Deixe vazio para permitir todos os componentes.
                  </p>
                </div>
                
                {/* Barra de Pesquisa */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar componentes..."
                    value={componentSearchTerm}
                    onChange={(e) => setComponentSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                  {componentSearchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setComponentSearchTerm('')}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {componentsLoading ? (
                    <p className="text-xs text-muted-foreground col-span-full">Carregando componentes...</p>
                  ) : (
                    <>
                      {/* Botão Selecionar/Desmarcar Todos - apenas se não houver busca */}
                      {!componentSearchTerm && (
                        <div className="col-span-full">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allSelected = formData.allowed_components?.length === engineComponents.length;
                              setFormData(prev => ({
                                ...prev,
                                allowed_components: allSelected ? [] : engineComponents.map(c => c.value)
                              }));
                            }}
                            className="w-full"
                          >
                            {formData.allowed_components?.length === engineComponents.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Lista de Componentes Filtrada */}
                      {engineComponents
                        .filter(component => 
                          component.label.toLowerCase().includes(componentSearchTerm.toLowerCase()) ||
                          component.value.toLowerCase().includes(componentSearchTerm.toLowerCase())
                        )
                        .map((component) => {
                          const isSelected = formData.allowed_components === null 
                            || formData.allowed_components.includes(component.value);
                          
                          return (
                            <div
                              key={component.value}
                              className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary' 
                                  : 'bg-background border-muted-foreground/20 hover:border-muted-foreground/40'
                              }`}
                              onClick={() => {
                                setFormData(prev => {
                                  const current = prev.allowed_components || [];
                                  const newValue = current.includes(component.value)
                                    ? current.filter(c => c !== component.value)
                                    : [...current, component.value];
                                  
                                  return {
                                    ...prev,
                                    allowed_components: newValue.length === engineComponents.length ? null : newValue
                                  };
                                });
                              }}
                            >
                              <div className={`w-3 h-3 rounded border flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                              }`}>
                                {isSelected && (
                                  <svg className="w-2 h-2 text-primary-foreground" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs truncate">{component.label}</span>
                            </div>
                          );
                        })}
                      
                      {/* Mensagem quando não há resultados na busca */}
                      {componentSearchTerm && engineComponents.filter(c => 
                        c.label.toLowerCase().includes(componentSearchTerm.toLowerCase()) ||
                        c.value.toLowerCase().includes(componentSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <p className="text-xs text-muted-foreground col-span-full text-center py-4">
                          Nenhum componente encontrado para "{componentSearchTerm}"
                        </p>
                      )}
                    </>
                  )}
                </div>
                
                {/* Avisos e Mensagens */}
                {formData.allowed_components && formData.allowed_components.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Nenhum componente selecionado. Nenhuma OS será mostrada neste status.
                  </p>
                )}
                
                {(formData.allowed_components === null || formData.allowed_components.length === engineComponents.length) && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Todos os componentes estão permitidos
                  </p>
                )}
                
                {formData.allowed_components && formData.allowed_components.length > 0 && formData.allowed_components.length < engineComponents.length && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    📋 {formData.allowed_components.length} de {engineComponents.length} componentes selecionados
                  </p>
                )}
              </div>
            )}

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
          setIsCreatingPrerequisite(false);
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
