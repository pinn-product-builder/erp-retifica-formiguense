// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Workflow
} from 'lucide-react';
import { useEngineTypes, EngineType, WorkflowStep } from '@/hooks/useEngineTypes';
import { WorkflowStepForm } from './WorkflowStepForm';

const COMPONENTS = [
  { id: 'bloco', name: 'Bloco', color: 'bg-green-500' },
  { id: 'eixo', name: 'Eixo', color: 'bg-orange-500' },
  { id: 'biela', name: 'Biela', color: 'bg-yellow-500' },
  { id: 'comando', name: 'Comando', color: 'bg-purple-500' },
  { id: 'cabecote', name: 'Cabeçote', color: 'bg-red-500' },
];

interface WorkflowStepsManagerProps {
  engineType: EngineType;
  onClose: () => void;
}

export function WorkflowStepsManager({ engineType, onClose }: WorkflowStepsManagerProps) {
  const { 
    workflowSteps, 
    fetchWorkflowSteps, 
    deleteWorkflowStep, 
    reorderWorkflowSteps,
    loading 
  } = useEngineTypes();
  
  const [selectedComponent, setSelectedComponent] = useState<string>('bloco');
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isStepFormOpen, setIsStepFormOpen] = useState(false);
  const [stepFormMode, setStepFormMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    fetchWorkflowSteps(engineType.id);
  }, [engineType.id, fetchWorkflowSteps]);

  const getStepsByComponent = (component: string) => {
    return workflowSteps
      .filter(step => step.component === component)
      .sort((a, b) => a.step_order - b.step_order);
  };

  const handleCreateStep = (component: string) => {
    setSelectedStep(null);
    setSelectedComponent(component);
    setStepFormMode('create');
    setIsStepFormOpen(true);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setSelectedStep(step);
    setSelectedComponent(step.component);
    setStepFormMode('edit');
    setIsStepFormOpen(true);
  };

  const handleDeleteStep = async (stepId: string) => {
    await deleteWorkflowStep(stepId, engineType.id);
  };

  const handleDragEnd = async (result: unknown) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Só permite reordenar dentro do mesmo componente
    if (source.droppableId !== destination.droppableId) return;

    const component = source.droppableId;
    const steps = getStepsByComponent(component);
    
    const reorderedSteps = Array.from(steps);
    const [movedStep] = reorderedSteps.splice(source.index, 1);
    reorderedSteps.splice(destination.index, 0, movedStep);

    await reorderWorkflowSteps(engineType.id, component, reorderedSteps);
  };

  const getComponentData = (componentId: string) => {
    return COMPONENTS.find(c => c.id === componentId) || { id: componentId, name: componentId, color: 'bg-gray-500' };
  };

  const getTotalStepsForComponent = (component: string) => {
    return workflowSteps.filter(step => step.component === component).length;
  };

  const getRequiredStepsForComponent = (component: string) => {
    return workflowSteps.filter(step => step.component === component && step.is_required).length;
  };

  const getTotalHoursForComponent = (component: string) => {
    return workflowSteps
      .filter(step => step.component === component)
      .reduce((total, step) => total + step.estimated_hours, 0);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header com Informações do Tipo de Motor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Workflow className="w-5 h-5" />
                Workflow - {engineType.name}
              </CardTitle>
              <CardDescription className="text-sm">
                Categoria: {engineType.category} • Garantia: {engineType.default_warranty_months} meses
              </CardDescription>
            </div>
            <div className="text-left sm:text-right text-sm text-muted-foreground">
              <div>Total de Etapas: {workflowSteps.length}</div>
              <div>Etapas Obrigatórias: {workflowSteps.filter(s => s.is_required).length}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detailed">Gestão Detalhada</TabsTrigger>
        </TabsList>

        {/* Visão Geral por Componente */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {engineType.required_components.map((componentId) => {
              const component = getComponentData(componentId);
              const totalSteps = getTotalStepsForComponent(componentId);
              const requiredSteps = getRequiredStepsForComponent(componentId);
              const totalHours = getTotalHoursForComponent(componentId);

              return (
                <Card key={componentId} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${component.color}`} />
                        <CardTitle className="text-lg">{component.name}</CardTitle>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCreateStep(componentId)}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Etapa</span>
                        <span className="sm:hidden">+</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{totalSteps}</div>
                        <div className="text-muted-foreground text-xs">Etapas</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">{requiredSteps}</div>
                        <div className="text-muted-foreground text-xs">Obrigatórias</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{totalHours}h</div>
                        <div className="text-muted-foreground text-xs">Estimado</div>
                      </div>
                    </div>

                    {totalSteps > 0 ? (
                      <div className="space-y-2">
                        {getStepsByComponent(componentId).slice(0, 3).map((step) => (
                          <div key={step.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              {step.is_required && <AlertCircle className="w-3 h-3 text-red-500" />}
                              <span className="truncate">{step.step_name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {step.estimated_hours}h
                            </div>
                          </div>
                        ))}
                        {totalSteps > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{totalSteps - 3} etapas adicionais
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Nenhuma etapa configurada
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Gestão Detalhada */}
        <TabsContent value="detailed" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {engineType.required_components.map((componentId) => {
              const component = getComponentData(componentId);
              return (
                <Button
                  key={componentId}
                  variant={selectedComponent === componentId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedComponent(componentId)}
                  className="gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${component.color}`} />
                  {component.name}
                  <Badge variant="secondary" className="ml-1">
                    {getTotalStepsForComponent(componentId)}
                  </Badge>
                </Button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${getComponentData(selectedComponent).color}`} />
                    Etapas - {getComponentData(selectedComponent).name}
                  </CardTitle>
                  <CardDescription>
                    Arraste e solte para reordenar as etapas
                  </CardDescription>
                </div>
                <Button onClick={() => handleCreateStep(selectedComponent)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Etapa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId={selectedComponent}>
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {getStepsByComponent(selectedComponent).map((step, index) => (
                        <Draggable key={step.id} draggableId={step.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 bg-card border rounded-lg ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium truncate">{step.step_name}</h4>
                                    {step.is_required && (
                                      <Badge variant="destructive" className="text-xs">
                                        Obrigatória
                                      </Badge>
                                    )}
                                    {step.quality_checklist_required && (
                                      <Badge variant="outline" className="text-xs">
                                        Checklist
                                      </Badge>
                                    )}
                                    {step.technical_report_required && (
                                      <Badge variant="outline" className="text-xs">
                                        Relatório
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {step.description && (
                                    <p className="text-sm text-muted-foreground truncate mb-2">
                                      {step.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {step.estimated_hours}h estimado
                                    </div>
                                    
                                    {Array.isArray(step.special_equipment) && step.special_equipment.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Settings className="w-3 h-3" />
                                         {step.special_equipment.length} equipamento(s)
                                      </div>
                                    )}
                                    
                                    {Array.isArray(step.prerequisites) && step.prerequisites.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                         {step.prerequisites.length} pré-requisito(s)
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditStep(step)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost" className="text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir a etapa "{step.step_name}"? 
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteStep(step.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {getStepsByComponent(selectedComponent).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-4">Nenhuma etapa configurada para este componente</p>
                          <Button 
                            onClick={() => handleCreateStep(selectedComponent)} 
                            variant="outline" 
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Criar Primeira Etapa
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Formulário de Etapa */}
      <Dialog open={isStepFormOpen} onOpenChange={setIsStepFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {stepFormMode === 'create' ? 'Criar Nova Etapa' : 'Editar Etapa'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da etapa do workflow para {getComponentData(selectedComponent).name}
            </DialogDescription>
          </DialogHeader>
          <WorkflowStepForm
            engineType={engineType}
            component={selectedComponent}
            workflowStep={selectedStep}
            mode={stepFormMode}
            onSuccess={() => setIsStepFormOpen(false)}
            onCancel={() => setIsStepFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
