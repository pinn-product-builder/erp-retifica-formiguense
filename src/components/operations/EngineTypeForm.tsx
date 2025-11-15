import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { useEngineTypes, EngineType } from '@/hooks/useEngineTypes';
import { useEngineComponents } from '@/hooks/useEngineComponents';

const CATEGORIES = [
  { value: 'geral', label: 'Geral' },
  { value: 'linha_pesada', label: 'Linha Pesada' },
  { value: 'linha_leve', label: 'Linha Leve' },
  { value: 'bosch', label: 'Bosch' },
  { value: 'bosch_specialized', label: 'Bosch 14 Etapas' },
  { value: 'garantia', label: 'Garantia' },
];

const TECHNICAL_STANDARDS = [
  'NBR 13032',
  'Bosch RAM',
  'ISO 9001',
  'ISO 14001',
  'ABNT NBR ISO/IEC 17025',
];

const engineTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().optional(),
  technical_standards: z.array(z.string()),
  required_components: z.array(z.string()).min(1, 'Pelo menos um componente é obrigatório'),
  default_warranty_months: z.number().min(1, 'Garantia deve ser pelo menos 1 mês').max(60, 'Garantia não pode exceder 60 meses'),
  is_active: z.boolean(),
  display_order: z.number().min(0),
  special_requirements: z.object({
    ambiente: z.string().optional(),
    equipamentos: z.array(z.string()).optional(),
    certificacao_required: z.boolean().optional(),
    temperatura_controlada: z.boolean().optional(),
    umidade_controlada: z.boolean().optional(),
    limpeza_especial: z.boolean().optional(),
    rastreabilidade_completa: z.boolean().optional(),
  }).optional(),
});

type EngineTypeFormData = z.infer<typeof engineTypeSchema>;

interface EngineTypeFormProps {
  engineType?: EngineType | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export function EngineTypeForm({ engineType, mode, onSuccess, onCancel }: EngineTypeFormProps) {
  const { createEngineType, updateEngineType, loading } = useEngineTypes();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const [customStandard, setCustomStandard] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');

  const form = useForm<EngineTypeFormData>({
    resolver: zodResolver(engineTypeSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      technical_standards: [],
      required_components: ['bloco', 'eixo', 'biela', 'comando', 'cabecote'], // Valores padrão iniciais
      default_warranty_months: 3,
      is_active: true,
      display_order: 0,
      special_requirements: {
        ambiente: '',
        equipamentos: [],
        certificacao_required: false,
        temperatura_controlada: false,
        umidade_controlada: false,
        limpeza_especial: false,
        rastreabilidade_completa: false,
      },
    },
  });

  useEffect(() => {
    if (engineType && mode === 'edit') {
      form.reset({
        name: engineType.name,
        category: engineType.category,
        description: engineType.description || '',
        technical_standards: Array.isArray(engineType.technical_standards) ? engineType.technical_standards as string[] : [],
        required_components: Array.isArray(engineType.required_components) ? engineType.required_components as string[] : [],
        default_warranty_months: engineType.default_warranty_months,
        is_active: engineType.is_active,
        display_order: engineType.display_order,
        special_requirements: {
          ambiente: (engineType.special_requirements as Record<string, unknown>)?.ambiente as string || '',
          equipamentos: (engineType.special_requirements as unknown)?.equipamentos || [],
          certificacao_required: (engineType.special_requirements as unknown)?.certificacao_required || false,
          temperatura_controlada: (engineType.special_requirements as unknown)?.temperatura_controlada || false,
          umidade_controlada: (engineType.special_requirements as unknown)?.umidade_controlada || false,
          limpeza_especial: (engineType.special_requirements as unknown)?.limpeza_especial || false,
          rastreabilidade_completa: (engineType.special_requirements as unknown)?.rastreabilidade_completa || false,
        },
      });
    }
  }, [engineType, mode, form]);

  const onSubmit = async (data: EngineTypeFormData) => {
    try {
      if (mode === 'create') {
        await createEngineType({
          name: data.name!,
          category: data.category!,
          description: data.description,
          is_active: data.is_active,
          display_order: data.display_order,
          default_warranty_months: data.default_warranty_months,
          required_components: data.required_components as unknown,
          technical_standards: data.technical_standards as unknown,
          special_requirements: data.special_requirements as unknown,
        });
      } else if (engineType) {
        await updateEngineType(engineType.id, {
          name: data.name,
          category: data.category,
          description: data.description,
          is_active: data.is_active,
          display_order: data.display_order,
          default_warranty_months: data.default_warranty_months,
          required_components: data.required_components as unknown,
          technical_standards: data.technical_standards as unknown,
          special_requirements: data.special_requirements as unknown,
        });
      }
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar tipo de motor:', error);
    }
  };

  const addCustomStandard = () => {
    if (customStandard.trim()) {
      const currentStandards = form.getValues('technical_standards');
      if (!currentStandards.includes(customStandard.trim())) {
        form.setValue('technical_standards', [...currentStandards, customStandard.trim()]);
      }
      setCustomStandard('');
    }
  };

  const removeStandard = (standard: string) => {
    const currentStandards = form.getValues('technical_standards');
    form.setValue('technical_standards', currentStandards.filter(s => s !== standard));
  };

  const addCustomEquipment = () => {
    if (customEquipment.trim()) {
      const currentEquipments = form.getValues('special_requirements.equipamentos') || [];
      if (!currentEquipments.includes(customEquipment.trim())) {
        form.setValue('special_requirements.equipamentos', [...currentEquipments, customEquipment.trim()]);
      }
      setCustomEquipment('');
    }
  };

  const removeEquipment = (equipment: string) => {
    const currentEquipments = form.getValues('special_requirements.equipamentos') || [];
    form.setValue('special_requirements.equipamentos', currentEquipments.filter(e => e !== equipment));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="order-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Informações Básicas</CardTitle>
              <CardDescription className="text-sm">
                Dados fundamentais do tipo de motor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Tipo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Geral, Bosch, Linha Pesada..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        placeholder="Descreva as características deste tipo de motor..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="default_warranty_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garantia (meses)</FormLabel>
                      <FormControl>
                        <Input 
                          type="string" 
                          min="1" 
                          max="60"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Exibição</FormLabel>
                      <FormControl>
                        <Input 
                          type="string" 
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <FormDescription>
                        Tipo de motor disponível para uso
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

          <Card className="order-3 lg:order-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Componentes Obrigatórios</CardTitle>
              <CardDescription className="text-sm">
                Selecione os componentes que fazem parte deste tipo de motor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="required_components"
                render={() => (
                  <FormItem>
                    {componentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          Carregando componentes...
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {engineComponents.map((component) => (
                        <FormField
                          key={component.value}
                          control={form.control}
                          name="required_components"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={component.value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(component.value)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, component.value])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== component.value
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {component.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Normas Técnicas</CardTitle>
            <CardDescription>
              Normas técnicas aplicáveis a este tipo de motor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {TECHNICAL_STANDARDS.map((standard) => (
                <FormField
                  key={standard}
                  control={form.control}
                  name="technical_standards"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={standard}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(standard)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, standard])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== standard
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {standard}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Normas Personalizadas</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma norma técnica personalizada"
                  value={customStandard}
                  onChange={(e) => setCustomStandard(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomStandard();
                    }
                  }}
                />
                <Button type="button" onClick={addCustomStandard} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {form.watch('technical_standards')?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.watch('technical_standards')?.map((standard) => (
                    <Badge key={standard} variant="secondary" className="gap-1">
                      {standard}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeStandard(standard)}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Requisitos Especiais</CardTitle>
            <CardDescription>
              Configurações especiais necessárias para este tipo de motor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="special_requirements.ambiente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ambiente Necessário</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: sala_limpa, oficina_normal, cabine_pintura..."
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Tipo de ambiente necessário para trabalhar com este motor
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Equipamentos Especiais</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite um equipamento necessário"
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
              
              {form.watch('special_requirements.equipamentos')?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.watch('special_requirements.equipamentos')?.map((equipment) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="special_requirements.certificacao_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Certificação Obrigatória</FormLabel>
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
                name="special_requirements.temperatura_controlada"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Temperatura Controlada</FormLabel>
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
                name="special_requirements.umidade_controlada"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Umidade Controlada</FormLabel>
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
                name="special_requirements.limpeza_especial"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Limpeza Especial</FormLabel>
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
                name="special_requirements.rastreabilidade_completa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Rastreabilidade Completa</FormLabel>
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
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="gap-2 w-full sm:w-auto">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {mode === 'create' ? 'Criar Tipo de Motor' : 'Salvar Alterações'}
            </span>
            <span className="sm:hidden">
              {mode === 'create' ? 'Criar' : 'Salvar'}
            </span>
          </Button>
        </div>
      </form>
    </Form>
  );
}
