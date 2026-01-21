import React, { useState, useEffect, useMemo } from 'react';
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
import { Plus, X, Save, Loader2, Search } from 'lucide-react';
import { useEngineTypes, EngineType } from '@/hooks/useEngineTypes';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { useEngineCategories } from '@/hooks/useEngineCategories';
import { useAdditionalServices } from '@/hooks/useAdditionalServices';
import { Json , Database} from '@/integrations/supabase/types';

const TECHNICAL_STANDARDS = [
  'NBR 13032',
  'Bosch RAM',
  'ISO 9001',
  'ISO 14001',
  'ABNT NBR ISO/IEC 17025',
];

const engineTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().optional(),
  technical_standards: z.array(z.string()),
  required_components: z.array(z.string()).min(1, 'Pelo menos um componente é obrigatório'),
  service_ids: z.array(z.string()).optional(),
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
  onSuccess: (createdId?: string) => void;
  onCancel: () => void;
}

export function EngineTypeForm({ engineType, mode, onSuccess, onCancel }: EngineTypeFormProps) {
  const { createEngineType, updateEngineType, loading, saveEngineTypeServices, fetchEngineTypeServices } = useEngineTypes();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const { fetchAllCategories } = useEngineCategories();
  const { additionalServices, loading: servicesLoading } = useAdditionalServices();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; components?: string[] }>>([]);
  const [customStandard, setCustomStandard] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [componentSearchTerm, setComponentSearchTerm] = useState('');
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [categoryChanged, setCategoryChanged] = useState(false);

  const filteredComponents = useMemo(() => {
    if (!componentSearchTerm) return engineComponents;
    
    const term = componentSearchTerm.toLowerCase();
    return engineComponents.filter(comp => 
      comp.label.toLowerCase().includes(term) ||
      comp.value.toLowerCase().includes(term)
    );
  }, [engineComponents, componentSearchTerm]);

  const filteredServices = useMemo(() => {
    if (!serviceSearchTerm) return additionalServices;
    
    const term = serviceSearchTerm.toLowerCase();
    return additionalServices.filter(service => 
      service.description.toLowerCase().includes(term) ||
      (service.value && service.value.toString().includes(term))
    );
  }, [additionalServices, serviceSearchTerm]);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchAllCategories();
      setCategories(cats.map(c => ({ 
        id: c.id, 
        name: c.name,
        components: Array.isArray(c.components) ? c.components as string[] : []
      })));
    };
    loadCategories();
  }, [fetchAllCategories]);

  const form = useForm<EngineTypeFormData>({
    resolver: zodResolver(engineTypeSchema),
    defaultValues: {
      name: '',
      category_id: '',
      description: '',
      technical_standards: [],
      required_components: [],
      service_ids: [],
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
    const loadEngineTypeData = async () => {
      if (engineType && mode === 'edit') {
        const categoryId = (engineType as any).category_id;
        
        // Carregar serviços do tipo de motor
        const services = await fetchEngineTypeServices(engineType.id);
        const serviceIds = services.map((s: any) => s.service_id);
        
        form.reset({
          name: engineType.name,
          category_id: categoryId || '',
          description: engineType.description || '',
          technical_standards: Array.isArray(engineType.technical_standards) ? engineType.technical_standards as string[] : [],
          required_components: Array.isArray(engineType.required_components) ? engineType.required_components as string[] : [],
          service_ids: serviceIds,
          default_warranty_months: engineType.default_warranty_months,
          is_active: engineType.is_active,
          display_order: engineType.display_order,
          special_requirements: {
            ambiente: (engineType.special_requirements as Record<string, unknown>)?.ambiente as string || '',
            equipamentos: (engineType.special_requirements as Record<string, unknown>)?.equipamentos as string[] || [],
            certificacao_required: (engineType.special_requirements as Record<string, unknown>)?.certificacao_required as boolean || false,
            temperatura_controlada: (engineType.special_requirements as Record<string, unknown>)?.temperatura_controlada as boolean || false,
            umidade_controlada: (engineType.special_requirements as Record<string, unknown>)?.umidade_controlada as boolean || false,
            limpeza_especial: (engineType.special_requirements as Record<string, unknown>)?.limpeza_especial as boolean || false,
            rastreabilidade_completa: (engineType.special_requirements as Record<string, unknown>)?.rastreabilidade_completa as boolean || false,
          },
        });
      }
    };
    
    loadEngineTypeData();
  }, [engineType?.id, mode]);

  useEffect(() => {
    if (mode === 'edit' && engineType && categories.length > 0) {
      const categoryId = (engineType as any).category_id;
      if (categoryId) {
        const currentCategoryId = form.getValues('category_id');
        if (currentCategoryId !== categoryId) {
          form.setValue('category_id', categoryId);
        }
      }
    }
  }, [categories.length, mode, engineType?.id]);

  useEffect(() => {
    if (mode === 'edit' && engineType && categories.length > 0 && categoryChanged) {
      const categoryId = form.getValues('category_id');
      const currentComponents = form.getValues('required_components');
      
      if (categoryId) {
        const selectedCategory = categories.find(c => c.id === categoryId);
        
        if (selectedCategory) {
          if (selectedCategory.components && selectedCategory.components.length > 0) {
            const combinedComponents = [...new Set([...currentComponents, ...selectedCategory.components])];
            form.setValue('required_components', combinedComponents);
          }
          setCategoryChanged(false);
        }
      }
    }
  }, [categoryChanged]);

  const onSubmit = async (data: EngineTypeFormData) => {
    try {
      const selectedCategory = categories.find(c => c.id === data.category_id);
      const categoryName = selectedCategory?.name || '';
      
      if (mode === 'create') {
        const created = await createEngineType({
          name: data.name!,
          category: categoryName,
          category_id: data.category_id!,
          description: data.description,
          is_active: data.is_active,
          display_order: data.display_order,
          default_warranty_months: data.default_warranty_months,
          required_components: data.required_components as Database['public']['Enums']['engine_component'][],
          technical_standards: data.technical_standards as string[],
          special_requirements: data.special_requirements as Json ,
        });
        
        // Salvar serviços se houver
        if (created && data.service_ids && data.service_ids.length > 0) {
          await saveEngineTypeServices(created.id, data.service_ids);
        }
        
        onSuccess(created?.id);
      } else if (engineType) {
        await updateEngineType(engineType.id, {
          name: data.name,
          category: categoryName,
          category_id: data.category_id,
          description: data.description,
          is_active: data.is_active,
          display_order: data.display_order,
          default_warranty_months: data.default_warranty_months,
          required_components: data.required_components as Database['public']['Enums']['engine_component'][],
          technical_standards: data.technical_standards as string[],
          special_requirements: data.special_requirements as Json,
        });
        
        // Salvar serviços
        await saveEngineTypeServices(engineType.id, data.service_ids || []);
        
        onSuccess();
      }
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
        <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Informações Básicas</CardTitle>
              <CardDescription className="text-sm">
                Dados fundamentais do tipo de motor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setCategoryChanged(true);
                        
                        const selectedCategory = categories.find(c => c.id === value);
                        if (selectedCategory) {
                          const currentComponents = form.getValues('required_components');
                          
                          if (selectedCategory.components && selectedCategory.components.length > 0) {
                            if (mode === 'create') {
                              form.setValue('required_components', [...selectedCategory.components]);
                            } else {
                              const combinedComponents = [...new Set([...currentComponents, ...selectedCategory.components])];
                              form.setValue('required_components', combinedComponents);
                            }
                          } else if (mode === 'create') {
                            form.setValue('required_components', []);
                          }
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>

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

        <Card>
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
                render={({ field }) => {
                  const selectedComponents = field.value || [];

                  const handleToggleComponent = (componentValue: string, checked: boolean) => {
                    if (checked) {
                      if (!selectedComponents.includes(componentValue)) {
                        field.onChange([...selectedComponents, componentValue]);
                      }
                    } else {
                      field.onChange(selectedComponents.filter((v: string) => v !== componentValue));
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>Componentes Obrigatórios *</FormLabel>
                      <FormControl>
                        {componentsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">
                              Carregando componentes...
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Buscar componente..."
                                value={componentSearchTerm}
                                onChange={(e) => setComponentSearchTerm(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            
                            <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                              {filteredComponents.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  Nenhum componente encontrado
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {filteredComponents.map((component) => {
                                    const isChecked = selectedComponents.includes(component.value);
                                    return (
                                      <div key={component.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`component-${component.value}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            handleToggleComponent(component.value, checked as boolean);
                                          }}
                                        />
                                        <Label
                                          htmlFor={`component-${component.value}`}
                                          className="text-sm font-normal cursor-pointer flex-1"
                                        >
                                          {component.label}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {selectedComponents.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {selectedComponents.length} componente(s) selecionado(s)
                              </div>
                            )}
                          </div>
                        )}
                      </FormControl>
                      <FormDescription>
                        Selecione os componentes que fazem parte deste tipo de motor. Eles aparecerão no checkin.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Serviços do Tipo de Motor</CardTitle>
              <CardDescription className="text-sm">
                Selecione os serviços que compõem este tipo de motor (aparecerão no diagnóstico)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="service_ids"
                render={({ field }) => {
                  const selectedServices = field.value || [];

                  const handleToggleService = (serviceId: string, checked: boolean) => {
                    if (checked) {
                      if (!selectedServices.includes(serviceId)) {
                        field.onChange([...selectedServices, serviceId]);
                      }
                    } else {
                      field.onChange(selectedServices.filter((id: string) => id !== serviceId));
                    }
                  };

                  const handleSelectAll = () => {
                    if (selectedServices.length === filteredServices.length) {
                      field.onChange([]);
                    } else {
                      field.onChange(filteredServices.map(s => s.id));
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>Serviços Disponíveis</FormLabel>
                      <FormControl>
                        {servicesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">
                              Carregando serviços...
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Buscar serviço..."
                                  value={serviceSearchTerm}
                                  onChange={(e) => setServiceSearchTerm(e.target.value)}
                                  className="pl-9"
                                />
                                {serviceSearchTerm && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                                    onClick={() => setServiceSearchTerm('')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {!serviceSearchTerm && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleSelectAll}
                                >
                                  {selectedServices.length === additionalServices.length 
                                    ? 'Desmarcar Todos' 
                                    : 'Selecionar Todos'}
                                </Button>
                              )}
                            </div>
                            
                            <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                              {filteredServices.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  {serviceSearchTerm 
                                    ? 'Nenhum serviço encontrado' 
                                    : 'Nenhum serviço cadastrado'}
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 gap-3">
                                  {filteredServices.map((service) => {
                                    const isChecked = selectedServices.includes(service.id);
                                    return (
                                      <div 
                                        key={service.id} 
                                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                          isChecked 
                                            ? 'bg-primary/5 border-primary' 
                                            : 'bg-muted/30 border-transparent hover:border-muted-foreground/20'
                                        }`}
                                      >
                                        <Checkbox
                                          id={`service-${service.id}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            handleToggleService(service.id, checked as boolean);
                                          }}
                                          className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <Label
                                            htmlFor={`service-${service.id}`}
                                            className="text-sm font-medium cursor-pointer block"
                                          >
                                            {service.description}
                                          </Label>
                                          {service.value && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                              R$ {Number(service.value).toFixed(2)}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {selectedServices.length > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {selectedServices.length} serviço(s) selecionado(s)
                                </span>
                                {selectedServices.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => field.onChange([])}
                                  >
                                    Limpar seleção
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </FormControl>
                      <FormDescription>
                        Serviços selecionados aparecerão como ponto de partida no diagnóstico
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>

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
