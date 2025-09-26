import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { useEngineTypes, EngineType, WorkflowStep } from '@/hooks/useEngineTypes';

const PREDEFINED_STEPS: Record<string, string[]> = {
  bloco: [
    'Desmontagem',
    'Limpeza',
    'Inspeção Visual',
    'Medição Dimensional',
    'Usinagem',
    'Montagem',
    'Teste Final'
  ],
  eixo: [
    'Desmontagem',
    'Limpeza',
    'Inspeção de Trincas',
    'Medição de Ovais',
    'Retífica',
    'Polimento',
    'Balanceamento',
    'Teste de Dureza'
  ],
  biela: [
    'Desmontagem',
    'Limpeza',
    'Inspeção Visual',
    'Medição de Folgas',
    'Usinagem',
    'Montagem',
    'Teste de Torque'
  ],
  comando: [
    'Desmontagem',
    'Limpeza',
    'Inspeção de Came',
    'Medição de Lift',
    'Retífica de Came',
    'Montagem',
    'Sincronização'
  ],
  cabecote: [
    'Desmontagem',
    'Limpeza',
    'Teste de Pressão',
    'Usinagem de Sede',
    'Retífica de Válvulas',
    'Montagem',
    'Teste Final'
  ]
};

const SPECIAL_EQUIPMENT_OPTIONS = [
  'Torno CNC',
  'Retificadora',
  'Fresadora',
  'Máquina de Solda',
  'Balanceadora',
  'Banco de Teste',
  'Máquina de Lavar',
  'Prensa Hidráulica',
  'Medidor de Dureza',
  'Microscópio',
  'Equipamento de Ultrassom',
  'Cabine de Pintura'
];

const workflowStepSchema = z.object({
  step_name: z.string().min(1, 'Nome da etapa é obrigatório'),
  step_key: z.string().min(1, 'Chave da etapa é obrigatória'),
  description: z.string().optional(),
  is_required: z.boolean(),
  estimated_hours: z.number().min(0, 'Horas estimadas deve ser positivo').max(100, 'Máximo 100 horas'),
  prerequisites: z.array(z.string()),
  special_equipment: z.array(z.string()),
  quality_checklist_required: z.boolean(),
  technical_report_required: z.boolean(),
});

type WorkflowStepFormData = z.infer<typeof workflowStepSchema>;

interface WorkflowStepFormProps {
  engineType: EngineType;
  component: string;
  workflowStep?: WorkflowStep | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export function WorkflowStepForm({ 
  engineType, 
  component, 
  workflowStep, 
  mode, 
  onSuccess, 
  onCancel 
}: WorkflowStepFormProps) {
  const { createWorkflowStep, updateWorkflowStep, loading, workflowSteps } = useEngineTypes();
  const [customPrerequisite, setCustomPrerequisite] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');

  const form = useForm<WorkflowStepFormData>({
    resolver: zodResolver(workflowStepSchema),
    defaultValues: {
      step_name: '',
      step_key: '',
      description: '',
      is_required: false,
      estimated_hours: 1,
      prerequisites: [],
      special_equipment: [],
      quality_checklist_required: false,
      technical_report_required: false,
    },
  });

  useEffect(() => {
    if (workflowStep && mode === 'edit') {
      form.reset({
        step_name: workflowStep.step_name,
        step_key: workflowStep.step_key,
        description: workflowStep.description || '',
        is_required: workflowStep.is_required,
        estimated_hours: workflowStep.estimated_hours,
        prerequisites: Array.isArray(workflowStep.prerequisites) ? workflowStep.prerequisites as string[] : [],
        special_equipment: Array.isArray(workflowStep.special_equipment) ? workflowStep.special_equipment as string[] : [],
        quality_checklist_required: workflowStep.quality_checklist_required,
        technical_report_required: workflowStep.technical_report_required,
      });
    }
  }, [workflowStep, mode, form]);

  // Gerar step_key automaticamente baseado no nome
  const generateStepKey = (stepName: string) => {
    return stepName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  };

  const onSubmit = async (data: WorkflowStepFormData) => {
    try {
      // Calcular próxima ordem se for criação
      let stepOrder = 1;
      if (mode === 'create') {
        const componentSteps = workflowSteps.filter(s => s.component === component);
        stepOrder = componentSteps.length + 1;
      }

      const stepData = {
        ...data,
        step_name: data.step_name!,
        step_key: data.step_key!,
        engine_type_id: engineType.id,
        component: component as "bloco" | "eixo" | "biela" | "comando" | "cabecote",
        step_order: mode === 'create' ? stepOrder : workflowStep?.step_order || 1,
      };

      if (mode === 'create') {
        await createWorkflowStep(stepData);
      } else if (workflowStep) {
        await updateWorkflowStep(workflowStep.id, data);
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar etapa do workflow:', error);
    }
  };

  const addCustomPrerequisite = () => {
    if (customPrerequisite.trim()) {
      const currentPrerequisites = form.getValues('prerequisites');
      if (!currentPrerequisites.includes(customPrerequisite.trim())) {
        form.setValue('prerequisites', [...currentPrerequisites, customPrerequisite.trim()]);
      }
      setCustomPrerequisite('');
    }
  };

  const removePrerequisite = (prerequisite: string) => {
    const currentPrerequisites = form.getValues('prerequisites');
    form.setValue('prerequisites', currentPrerequisites.filter(p => p !== prerequisite));
  };

  const addCustomEquipment = () => {
    if (customEquipment.trim()) {
      const currentEquipment = form.getValues('special_equipment');
      if (!currentEquipment.includes(customEquipment.trim())) {
        form.setValue('special_equipment', [...currentEquipment, customEquipment.trim()]);
      }
      setCustomEquipment('');
    }
  };

  const removeEquipment = (equipment: string) => {
    const currentEquipment = form.getValues('special_equipment');
    form.setValue('special_equipment', currentEquipment.filter(e => e !== equipment));
  };

  const addPredefinedStep = (stepName: string) => {
    form.setValue('step_name', stepName);
    form.setValue('step_key', generateStepKey(stepName));
  };

  // Obter etapas existentes para pré-requisitos
  const getAvailablePrerequisites = () => {
    return workflowSteps
      .filter(s => s.component === component && s.id !== workflowStep?.id)
      .map(s => s.step_name);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Informações Básicas */}
          <Card className="order-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Informações da Etapa</CardTitle>
              <CardDescription className="text-sm">
                Dados básicos da etapa do workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Etapas Predefinidas */}
              {mode === 'create' && PREDEFINED_STEPS[component] && (
                <div className="space-y-2">
                  <Label>Etapas Sugeridas</Label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_STEPS[component].map((stepName) => (
                      <Button
                        key={stepName}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addPredefinedStep(stepName)}
                        className="text-xs"
                      >
                        {stepName}
                      </Button>
                    ))}
                  </div>
                  <Separator />
                </div>
              )}

              <FormField
                control={form.control}
                name="step_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Etapa</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Desmontagem, Limpeza, Usinagem..." 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Gerar step_key automaticamente
                          const stepKey = generateStepKey(e.target.value);
                          form.setValue('step_key', stepKey);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="step_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave da Etapa</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: desmontagem, limpeza, usinagem..." 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Identificador único da etapa (gerado automaticamente)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva os procedimentos desta etapa..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horas Estimadas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100"
                        step="0.5"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Tempo estimado para execução desta etapa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
              <CardDescription>
                Requisitos e validações da etapa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Etapa Obrigatória</FormLabel>
                      <FormDescription>
                        Esta etapa deve ser concluída obrigatoriamente
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quality_checklist_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Checklist de Qualidade</FormLabel>
                      <FormDescription>
                        Requer preenchimento de checklist de qualidade
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technical_report_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Relatório Técnico</FormLabel>
                      <FormDescription>
                        Requer geração de relatório técnico
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Pré-requisitos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pré-requisitos</CardTitle>
            <CardDescription>
              Etapas que devem ser concluídas antes desta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {getAvailablePrerequisites().map((stepName) => (
                <FormField
                  key={stepName}
                  control={form.control}
                  name="prerequisites"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={stepName}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value?.includes(stepName)}
                            onChange={(e) => {
                              return e.target.checked
                                ? field.onChange([...field.value, stepName])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== stepName
                                    )
                                  )
                            }}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {stepName}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Pré-requisito Personalizado</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite um pré-requisito personalizado"
                  value={customPrerequisite}
                  onChange={(e) => setCustomPrerequisite(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomPrerequisite();
                    }
                  }}
                />
                <Button type="button" onClick={addCustomPrerequisite} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {form.watch('prerequisites')?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.watch('prerequisites')?.map((prerequisite) => (
                    <Badge key={prerequisite} variant="secondary" className="gap-1">
                      {prerequisite}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removePrerequisite(prerequisite)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos Especiais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equipamentos Especiais</CardTitle>
            <CardDescription>
              Equipamentos necessários para executar esta etapa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SPECIAL_EQUIPMENT_OPTIONS.map((equipment) => (
                <FormField
                  key={equipment}
                  control={form.control}
                  name="special_equipment"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={equipment}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value?.includes(equipment)}
                            onChange={(e) => {
                              return e.target.checked
                                ? field.onChange([...field.value, equipment])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== equipment
                                    )
                                  )
                            }}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          {equipment}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Equipamento Personalizado</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite um equipamento específico"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomEquipment();
                    }
                  }}
                />
                <Button type="button" onClick={addCustomEquipment} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {form.watch('special_equipment')?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.watch('special_equipment')?.map((equipment) => (
                    <Badge key={equipment} variant="outline" className="gap-1">
                      {equipment}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeEquipment(equipment)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === 'create' ? 'Criar Etapa' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
