import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  Camera,
  FileText,
  Shield,
  Settings,
  User,
  Ruler,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface WorkflowChecklist {
  id: string;
  engine_type_id: string;
  workflow_step_id: string;
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  step_key: string;
  checklist_name: string;
  description: string;
  technical_standard: string;
  is_mandatory: boolean;
  requires_supervisor_approval: boolean;
  supervisor_roles: string[];
  blocks_workflow_advance: boolean;
  version: number;
  is_active: boolean;
  items: WorkflowChecklistItem[];
}

interface WorkflowChecklistItem {
  id: string;
  checklist_id: string;
  item_code: string;
  item_name: string;
  item_description: string;
  item_type: 'checkbox' | 'measurement' | 'photo' | 'text' | 'select';
  measurement_unit?: string;
  expected_value?: number;
  tolerance_min?: number;
  tolerance_max?: number;
  item_options: string[];
  is_critical: boolean;
  is_required: boolean;
  requires_photo: boolean;
  requires_supervisor_check: boolean;
  validation_rules: Record<string, any>;
  display_order: number;
  help_text?: string;
  technical_reference?: string;
}

interface ChecklistResponse {
  id: string;
  order_workflow_id: string;
  checklist_id: string;
  order_id: string;
  component: string;
  step_key: string;
  responses: Record<string, any>;
  measurements: Record<string, number>;
  photos: string[];
  non_conformities: NonConformity[];
  corrective_actions: CorrectiveAction[];
  overall_status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'approved';
  completion_percentage: number;
  filled_by: string;
  filled_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  supervisor_approved_by?: string;
  supervisor_approved_at?: string;
  notes?: string;
  order?: {
    order_number: string;
    customer: { name: string };
  };
  checklist?: WorkflowChecklist;
}

interface NonConformity {
  item_code: string;
  item_name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  corrective_action_required: boolean;
}

interface CorrectiveAction {
  non_conformity_item: string;
  action_description: string;
  responsible: string;
  target_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
}

export function QualityChecklistManager() {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  
  const [responses, setResponses] = useState<ChecklistResponse[]>([]);
  const [checklists, setChecklists] = useState<WorkflowChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('responses');
  const [selectedResponse, setSelectedResponse] = useState<ChecklistResponse | null>(null);
  const [currentResponses, setCurrentResponses] = useState<Record<string, any>>({});
  const [currentMeasurements, setCurrentMeasurements] = useState<Record<string, number>>({});
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);

  useEffect(() => {
    loadChecklistResponses();
    loadChecklists();
  }, []);

  const loadChecklistResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_checklist_responses')
        .select(`
          *,
          order:orders(
            order_number,
            customer:customers(name)
          ),
          checklist:workflow_checklists(
            checklist_name,
            technical_standard,
            is_mandatory,
            requires_supervisor_approval
          )
        `)
        .order('filled_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Erro ao carregar respostas de checklist:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as respostas dos checklists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChecklists = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_checklists')
        .select(`
          *,
          items:workflow_checklist_items(*)
        `)
        .eq('is_active', true)
        .order('step_key', { ascending: true });

      if (error) throw error;
      setChecklists(data || []);
    } catch (error) {
      console.error('Erro ao carregar checklists:', error);
    }
  };

  const handleResponseSubmit = async (responseId: string) => {
    try {
      const completionPercentage = calculateCompletionPercentage();
      const overallStatus = determineOverallStatus();

      const { error } = await supabase
        .from('workflow_checklist_responses')
        .update({
          responses: currentResponses,
          measurements: currentMeasurements,
          photos: currentPhotos,
          non_conformities: nonConformities,
          corrective_actions: correctiveActions,
          overall_status: overallStatus,
          completion_percentage: completionPercentage,
          filled_at: new Date().toISOString(),
          filled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', responseId);

      if (error) throw error;

      // Se há não conformidades críticas, bloquear avanço do workflow
      const criticalNonConformities = nonConformities.filter(nc => nc.severity === 'critical');
      if (criticalNonConformities.length > 0) {
        await supabase.rpc('block_workflow_advance', {
          response_id: responseId,
          reason: 'Não conformidades críticas encontradas'
        });
      }

      toast({
        title: "Sucesso",
        description: "Checklist preenchido com sucesso",
        variant: "default"
      });

      loadChecklistResponses();
      setSelectedResponse(null);
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o checklist",
        variant: "destructive"
      });
    }
  };

  const handleSupervisorApproval = async (responseId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('workflow_checklist_responses')
        .update({
          supervisor_approved_by: (await supabase.auth.getUser()).data.user?.id,
          supervisor_approved_at: new Date().toISOString(),
          overall_status: approved ? 'approved' : 'failed'
        })
        .eq('id', responseId);

      if (error) throw error;

      if (approved) {
        // Liberar avanço do workflow se aprovado
        await supabase.rpc('unblock_workflow_advance', {
          response_id: responseId
        });
      }

      toast({
        title: "Sucesso",
        description: `Checklist ${approved ? 'aprovado' : 'reprovado'} pelo supervisor`,
        variant: "default"
      });

      loadChecklistResponses();
    } catch (error) {
      console.error('Erro na aprovação do supervisor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a aprovação",
        variant: "destructive"
      });
    }
  };

  const calculateCompletionPercentage = (): number => {
    if (!selectedResponse?.checklist?.items) return 0;
    
    const totalItems = selectedResponse.checklist.items.length;
    const completedItems = selectedResponse.checklist.items.filter(item => {
      const response = currentResponses[item.item_code];
      return response !== undefined && response !== null && response !== '';
    }).length;

    return Math.round((completedItems / totalItems) * 100);
  };

  const determineOverallStatus = (): string => {
    const criticalNonConformities = nonConformities.filter(nc => nc.severity === 'critical');
    const completionPercentage = calculateCompletionPercentage();

    if (criticalNonConformities.length > 0) return 'failed';
    if (completionPercentage < 100) return 'in_progress';
    if (selectedResponse?.checklist?.requires_supervisor_approval) return 'completed';
    return 'approved';
  };

  const handleItemResponse = (itemCode: string, value: any, item: WorkflowChecklistItem) => {
    setCurrentResponses(prev => ({
      ...prev,
      [itemCode]: value
    }));

    // Verificar se o valor está dentro da tolerância (para medições)
    if (item.item_type === 'measurement' && item.expected_value !== undefined) {
      const numValue = parseFloat(value);
      const isOutOfTolerance = 
        (item.tolerance_min !== undefined && numValue < item.tolerance_min) ||
        (item.tolerance_max !== undefined && numValue > item.tolerance_max);

      if (isOutOfTolerance) {
        const nonConformity: NonConformity = {
          item_code: itemCode,
          item_name: item.item_name,
          severity: item.is_critical ? 'critical' : 'medium',
          description: `Valor fora da tolerância: ${numValue} (esperado: ${item.expected_value} ±${item.tolerance_min}-${item.tolerance_max})`,
          corrective_action_required: item.is_critical
        };

        setNonConformities(prev => [
          ...prev.filter(nc => nc.item_code !== itemCode),
          nonConformity
        ]);
      } else {
        setNonConformities(prev => prev.filter(nc => nc.item_code !== itemCode));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      in_progress: { label: 'Em Andamento', variant: 'default' as const, icon: AlertCircle },
      completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Reprovado', variant: 'destructive' as const, icon: XCircle },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge variant={config?.variant || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  const renderChecklistItem = (item: WorkflowChecklistItem) => {
    const currentValue = currentResponses[item.item_code] || '';

    return (
      <div key={item.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{item.item_name}</h4>
              {item.is_critical && (
                <Badge variant="destructive" className="text-xs">Crítico</Badge>
              )}
              {item.is_required && (
                <Badge variant="outline" className="text-xs">Obrigatório</Badge>
              )}
            </div>
            {item.item_description && (
              <p className="text-sm text-gray-600 mb-2">{item.item_description}</p>
            )}
            {item.help_text && (
              <p className="text-xs text-blue-600 mb-2">{item.help_text}</p>
            )}
          </div>
        </div>

        {/* Renderizar input baseado no tipo */}
        <div className="space-y-2">
          {item.item_type === 'checkbox' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={item.item_code}
                checked={currentValue === true}
                onCheckedChange={(checked) => handleItemResponse(item.item_code, checked, item)}
              />
              <Label htmlFor={item.item_code}>Conforme</Label>
            </div>
          )}

          {item.item_type === 'measurement' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Valor esperado: ${item.expected_value || 'N/A'}`}
                  value={currentValue}
                  onChange={(e) => handleItemResponse(item.item_code, e.target.value, item)}
                  className="flex-1"
                />
                {item.measurement_unit && (
                  <span className="text-sm text-gray-500 min-w-fit">{item.measurement_unit}</span>
                )}
              </div>
              {item.tolerance_min !== undefined && item.tolerance_max !== undefined && (
                <p className="text-xs text-gray-500">
                  Tolerância: {item.tolerance_min} - {item.tolerance_max} {item.measurement_unit}
                </p>
              )}
            </div>
          )}

          {item.item_type === 'text' && (
            <Textarea
              placeholder="Digite suas observações..."
              value={currentValue}
              onChange={(e) => handleItemResponse(item.item_code, e.target.value, item)}
            />
          )}

          {item.item_type === 'select' && (
            <Select value={currentValue} onValueChange={(value) => handleItemResponse(item.item_code, value, item)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {item.item_options.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {item.requires_photo && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Foto obrigatória</p>
              <Button variant="outline" size="sm" className="mt-2">
                Adicionar Foto
              </Button>
            </div>
          )}
        </div>

        {item.technical_reference && (
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Referência técnica: {item.technical_reference}
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Checklists de Qualidade por Etapa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="responses">Checklists Ativos</TabsTrigger>
              <TabsTrigger value="templates">Configurar Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="responses" className="space-y-6">
              <div className="space-y-4">
                {responses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum checklist ativo</h3>
                    <p>Checklists aparecerão aqui quando ordens de serviço estiverem em produção.</p>
                  </div>
                ) : (
                  responses.map((response) => (
                    <Card key={response.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{response.checklist?.checklist_name}</h3>
                              {getStatusBadge(response.overall_status)}
                              {response.checklist?.technical_standard && (
                                <Badge variant="outline" className="text-xs">
                                  {response.checklist.technical_standard}
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <p className="font-medium text-gray-900">OS</p>
                                <p>{response.order?.order_number}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Cliente</p>
                                <p>{response.order?.customer?.name}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Componente</p>
                                <p className="capitalize">{response.component}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Etapa</p>
                                <p className="capitalize">{response.step_key.replace('_', ' ')}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">Progresso</span>
                                  <span className="text-sm text-gray-600">{response.completion_percentage}%</span>
                                </div>
                                <Progress value={response.completion_percentage} className="h-2" />
                              </div>
                            </div>

                            {response.non_conformities && response.non_conformities.length > 0 && (
                              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-800">
                                    {response.non_conformities.length} não conformidade(s)
                                  </span>
                                </div>
                                {response.non_conformities.slice(0, 2).map((nc, index) => (
                                  <p key={index} className="text-xs text-red-700">
                                    • {nc.item_name}: {nc.description}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            {response.overall_status === 'pending' || response.overall_status === 'in_progress' ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" onClick={() => {
                                    setSelectedResponse(response);
                                    setCurrentResponses(response.responses || {});
                                    setCurrentMeasurements(response.measurements || {});
                                    setCurrentPhotos(response.photos || []);
                                    setNonConformities(response.non_conformities || []);
                                    setCorrectiveActions(response.corrective_actions || []);
                                  }}>
                                    Preencher
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {response.checklist?.checklist_name} - {response.order?.order_number}
                                    </DialogTitle>
                                  </DialogHeader>
                                  
                                  <div className="space-y-4">
                                    {selectedResponse?.checklist?.items?.map(renderChecklistItem)}
                                    
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                      <Button variant="outline" onClick={() => setSelectedResponse(null)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={() => handleResponseSubmit(response.id)}>
                                        Salvar Checklist
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : response.overall_status === 'completed' && response.checklist?.requires_supervisor_approval ? (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSupervisorApproval(response.id, false)}
                                >
                                  Reprovar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleSupervisorApproval(response.id, true)}
                                >
                                  Aprovar
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                {response.overall_status === 'approved' ? 'Aprovado' : 'Finalizado'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuração de Templates</h3>
                <p className="text-gray-600 mb-4">
                  Configure checklists personalizados por etapa do workflow e norma técnica.
                </p>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Templates
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
