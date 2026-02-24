import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateEngineTemplate,
  useUpdateEngineTemplate,
  useUsedEngineBrandModels,
  useEngineTemplates,
} from '@/hooks/useEngineTemplates';
import { usePartsInventory } from '@/hooks/usePartsInventory';
import { useAdditionalServices, AdditionalService } from '@/hooks/useAdditionalServices';
import { useEngines } from '@/hooks/useEngines';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Minus, X, Copy, Save } from 'lucide-react';
import { EngineTemplate, CreateTemplateData } from '@/services/EngineTemplateService';
import { formatCurrency } from '@/utils/masks';

const templateSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  labor_cost: z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        value.trim() === '' ||
        !Number.isNaN(Number(value)),
      'Valor inválido'
    ),
  engine_brand: z.string().min(2, 'Marca é obrigatória'),
  engine_model: z.string().min(2, 'Modelo é obrigatório'),
  engine_type_id: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface SelectedPart {
  part_id: string;
  part_code: string;
  part_name: string;
  unit_cost: number;
  quantity: number;
  notes?: string;
}

interface SelectedService {
  service_id: string;
  description: string;
  value: number;
  custom_value: number | null;
  quantity: number;
  notes?: string;
}

interface EngineTemplateFormProps {
  open: boolean;
  onClose: () => void;
  template?: EngineTemplate | null;
  mode: 'create' | 'edit' | 'duplicate' | 'import';
  importTemplate?: EngineTemplate | null;
}

export function EngineTemplateForm({
  open,
  onClose,
  template,
  mode,
  importTemplate,
}: EngineTemplateFormProps) {
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [partsSearchTerm, setPartsSearchTerm] = useState('');
  const [servicesSearchTerm, setServicesSearchTerm] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSearchTerm, setImportSearchTerm] = useState('');
  const [useExistingEngine, setUseExistingEngine] = useState(false);
  const [selectedEngineId, setSelectedEngineId] = useState<string>('');
  const lastInitKeyRef = useRef('');

  const { parts, loading: loadingParts } = usePartsInventory();
  const { additionalServices, loading: loadingServices } = useAdditionalServices();
  const services = additionalServices as AdditionalService[];
  const { engines, loading: loadingEngines } = useEngines({ page: 1, pageSize: 1000 });
  const { usedSet } = useUsedEngineBrandModels();
  const { templates: allTemplates } = useEngineTemplates({ pageSize: 1000 });

  const enginesWithoutTemplate =
    mode === 'create' || mode === 'duplicate'
      ? (engines || []).filter((e) => !usedSet.has(`${e.brand}|${e.model}`))
      : engines || [];

  const createMutation = useCreateEngineTemplate();
  const updateMutation = useUpdateEngineTemplate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
    setError,
    clearErrors,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
  });

  useEffect(() => {
    if (selectedParts.length > 0 && selectedServices.length > 0 && errors.root) {
      clearErrors('root');
    }
  }, [selectedParts.length, selectedServices.length, errors.root, clearErrors]);

  useEffect(() => {
    if (!open) {
      lastInitKeyRef.current = '';
      return;
    }

    const initKey = `${mode}-${template?.id || ''}-${importTemplate?.id || ''}`;
    if (lastInitKeyRef.current === initKey) {
      return;
    }
    lastInitKeyRef.current = initKey;

    if (open) {
      if (mode === 'edit' && template) {
        setValue('name', template.name);
        setValue('description', template.description || '');
        setValue('engine_brand', template.engine_brand);
        setValue('engine_model', template.engine_model);
        setValue('labor_cost', template.labor_cost ? String(template.labor_cost) : '');
        setValue('engine_type_id', template.engine_type_id || '');

        setSelectedParts(
          template.parts?.map((p) => ({
            part_id: p.part_id,
            part_code: p.part?.part_code || '',
            part_name: p.part?.part_name || '',
            unit_cost: p.part?.unit_cost || 0,
            quantity: p.quantity,
            notes: p.notes || undefined,
          })) || []
        );

        setSelectedServices(
          template.services?.map((s) => ({
            service_id: s.service_id,
            description: s.service?.description || '',
            value: s.service?.value || 0,
            custom_value: s.custom_value ?? null,
            quantity: s.quantity,
            notes: s.notes || undefined,
          })) || []
        );
      } else if (mode === 'duplicate' && template) {
        setValue('name', `${template.name} (Cópia)`);
        setValue('description', template.description || '');
        setValue('engine_brand', template.engine_brand);
        setValue('engine_model', `${template.engine_model} (Cópia ${Date.now()})`);
        setValue('labor_cost', template.labor_cost ? String(template.labor_cost) : '');
        setValue('engine_type_id', template.engine_type_id || '');

        setSelectedParts(
          template.parts?.map((p) => ({
            part_id: p.part_id,
            part_code: p.part?.part_code || '',
            part_name: p.part?.part_name || '',
            unit_cost: p.part?.unit_cost || 0,
            quantity: p.quantity,
            notes: p.notes || undefined,
          })) || []
        );

        setSelectedServices(
          template.services?.map((s) => ({
            service_id: s.service_id,
            description: s.service?.description || '',
            value: s.service?.value || 0,
            custom_value: s.custom_value ?? null,
            quantity: s.quantity,
            notes: s.notes || undefined,
          })) || []
        );
      } else if (mode === 'import' && importTemplate) {
        setValue('labor_cost', importTemplate.labor_cost ? String(importTemplate.labor_cost) : '');
        setSelectedParts(
          importTemplate.parts?.map((p) => ({
            part_id: p.part_id,
            part_code: p.part?.part_code || '',
            part_name: p.part?.part_name || '',
            unit_cost: p.part?.unit_cost || 0,
            quantity: p.quantity,
            notes: p.notes || undefined,
          })) || []
        );

        setSelectedServices(
          importTemplate.services?.map((s) => ({
            service_id: s.service_id,
            description: s.service?.description || '',
            value: s.service?.value || 0,
            custom_value: s.custom_value ?? null,
            quantity: s.quantity,
            notes: s.notes || undefined,
          })) || []
        );
      } else {
        reset();
        setSelectedParts([]);
        setSelectedServices([]);
        setUseExistingEngine(false);
        setSelectedEngineId('');
      }
    }
  }, [open, mode, template, importTemplate, setValue, reset]);

  const handleEngineSelect = (engineId: string) => {
    setSelectedEngineId(engineId);
    const selectedEngine = engines?.find((e) => e.id === engineId);
    if (selectedEngine) {
      setValue('engine_brand', selectedEngine.brand);
      setValue('engine_model', selectedEngine.model);
      setValue('engine_type_id', selectedEngine.engine_type_id || '');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedParts([]);
    setSelectedServices([]);
    setPartsSearchTerm('');
    setServicesSearchTerm('');
    onClose();
  };

  const handleImportFromTemplate = (source: EngineTemplate) => {
    const importedParts = (source.parts || []).map((p) => ({
      part_id: p.part_id,
      part_code: p.part?.part_code ?? '',
      part_name: p.part?.part_name ?? '',
      unit_cost: p.part?.unit_cost ?? 0,
      quantity: p.quantity,
      notes: p.notes,
    }));
    const importedServices = (source.services || []).map((s) => ({
      service_id: s.service_id,
      description: s.service?.description ?? '',
      value: s.service?.value ?? 0,
      custom_value: s.custom_value ?? null,
      quantity: s.quantity,
      notes: s.notes,
    }));
    setSelectedParts(importedParts);
    setSelectedServices(importedServices);
    setShowImportDialog(false);
    setImportSearchTerm('');
  };

  const onSubmit = async (data: TemplateFormData) => {
    clearErrors('root');
    if (selectedParts.length === 0 || selectedServices.length === 0) {
      setError('root', {
        type: 'manual',
        message:
          selectedParts.length === 0 && selectedServices.length === 0
            ? 'Adicione pelo menos uma peça e um serviço ao template.'
            : selectedParts.length === 0
              ? 'Adicione pelo menos uma peça ao template.'
              : 'Adicione pelo menos um serviço ao template.',
      });
      return;
    }

    const parsedLaborCost =
      data.labor_cost && data.labor_cost.trim() !== ''
        ? Number(data.labor_cost)
        : 0;

    const templateData: CreateTemplateData = {
      name: data.name,
      description: data.description,
      labor_cost: Number.isFinite(parsedLaborCost) ? parsedLaborCost : 0,
      engine_brand: data.engine_brand,
      engine_model: data.engine_model,
      engine_type_id: data.engine_type_id,
      parts: selectedParts.map((p) => ({
        part_id: p.part_id,
        quantity: p.quantity,
        notes: p.notes,
      })),
      services: selectedServices.map((s) => ({
        service_id: s.service_id,
        quantity: s.quantity,
        custom_value: s.custom_value ?? null,
        notes: s.notes,
      })),
    };

    try {
      if (mode === 'edit' && template) {
        await updateMutation.mutateAsync({
          templateId: template.id,
          templateData,
        });
      } else if (mode === 'duplicate') {
        await createMutation.mutateAsync(templateData);
      } else {
        await createMutation.mutateAsync(templateData);
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const togglePart = useCallback(
    (part: { id: string; part_code?: string | null; part_name?: string | null; unit_cost: number }) => {
      setSelectedParts((prev) => {
        const exists = prev.find((p) => p.part_id === part.id);
        if (exists) {
          return prev.filter((p) => p.part_id !== part.id);
        }
        return [
          ...prev,
          {
            part_id: part.id,
            part_code: part.part_code ?? '',
            part_name: part.part_name ?? '',
            unit_cost: part.unit_cost,
            quantity: 1,
          },
        ];
      });
    },
    []
  );

  const toggleService = useCallback(
    (service: { id: string; description: string; value: number }) => {
      setSelectedServices((prev) => {
        const exists = prev.find((s) => s.service_id === service.id);
        if (exists) {
          return prev.filter((s) => s.service_id !== service.id);
        }
        return [
          ...prev,
          {
            service_id: service.id,
            description: service.description,
            value: service.value,
            custom_value: null,
            quantity: 1,
          },
        ];
      });
    },
    []
  );

  const updateServiceCustomValue = useCallback((serviceId: string, rawValue: string) => {
    setSelectedServices((prev) =>
      prev.map((s) => {
        if (s.service_id !== serviceId) return s;
        const parsed = parseFloat(rawValue.replace(',', '.'));
        return { ...s, custom_value: rawValue.trim() === '' || Number.isNaN(parsed) ? null : parsed };
      })
    );
  }, []);

  const updatePartQuantity = useCallback((partId: string, delta: number) => {
    setSelectedParts((prev) =>
      prev.map((p) =>
        p.part_id === partId ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p
      )
    );
  }, []);

  const updateServiceQuantity = useCallback((serviceId: string, delta: number) => {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.service_id === serviceId ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
      )
    );
  }, []);

  const removePart = useCallback((partId: string) => {
    setSelectedParts((prev) => prev.filter((p) => p.part_id !== partId));
  }, []);

  const removeService = useCallback((serviceId: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.service_id !== serviceId));
  }, []);

  const filteredParts = (parts || []).filter(
    (part) =>
      (part.part_code ?? '').toLowerCase().includes(partsSearchTerm.toLowerCase()) ||
      (part.part_name ?? '').toLowerCase().includes(partsSearchTerm.toLowerCase())
  );

  const filteredServices = (services || []).filter((service) =>
    (service.description ?? '').toLowerCase().includes(servicesSearchTerm.toLowerCase())
  );

  const totalPartsValue = selectedParts.reduce(
    (sum, p) => sum + p.unit_cost * p.quantity,
    0
  );
  const totalServicesValue = selectedServices.reduce(
    (sum, s) => sum + (s.custom_value ?? s.value) * s.quantity,
    0
  );
  const laborCostValue = Number(watch('labor_cost') || 0);
  const totalValue = totalPartsValue + totalServicesValue + (Number.isFinite(laborCostValue) ? laborCostValue : 0);

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {mode === 'edit' && 'Editar Template'}
            {mode === 'create' && 'Novo Template'}
            {mode === 'duplicate' && 'Duplicar Template'}
            {mode === 'import' && 'Criar Template (Importando)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Informações do Template</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">
                  Nome do Template *
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ex: Fire 1.0 Completo"
                  className="text-sm"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {mode === 'create' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useExistingEngine"
                      checked={useExistingEngine}
                      onCheckedChange={(checked) => {
                        setUseExistingEngine(checked as boolean);
                        if (!checked) {
                          setSelectedEngineId('');
                          setValue('engine_brand', '');
                          setValue('engine_model', '');
                          setValue('engine_type_id', '');
                        }
                      }}
                    />
                    <Label
                      htmlFor="useExistingEngine"
                      className="text-xs sm:text-sm font-normal cursor-pointer"
                    >
                      Selecionar motor já cadastrado
                    </Label>
                  </div>

                  {useExistingEngine && (
                    <div className="space-y-2">
                      <Label htmlFor="existingEngine" className="text-xs sm:text-sm">
                        Motor Cadastrado
                      </Label>
                      <Select value={selectedEngineId} onValueChange={handleEngineSelect}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione um motor..." />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {loadingEngines ? (
                              <SelectItem value="loading" disabled>
                                Carregando...
                              </SelectItem>
                            ) : enginesWithoutTemplate.length > 0 ? (
                              enginesWithoutTemplate.map((engine) => (
                                <SelectItem key={engine.id} value={engine.id}>
                                  {engine.brand} - {engine.model}
                                  {engine.serial_number && ` (${engine.serial_number})`}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>
                                {engines && engines.length > 0
                                  ? 'Todos os motores já possuem lista de serviços'
                                  : 'Nenhum motor cadastrado'}
                              </SelectItem>
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="engine_brand" className="text-xs sm:text-sm">
                    Marca do Motor *
                  </Label>
                  <Input
                    id="engine_brand"
                    {...register('engine_brand')}
                    placeholder="Ex: Fiat"
                    className="text-sm"
                    disabled={useExistingEngine && mode === 'create'}
                  />
                  {errors.engine_brand && (
                    <p className="text-xs text-destructive">{errors.engine_brand.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engine_model" className="text-xs sm:text-sm">
                    Modelo do Motor *
                  </Label>
                  <Input
                    id="engine_model"
                    {...register('engine_model')}
                    placeholder="Ex: Fire 1.0"
                    className="text-sm"
                    disabled={useExistingEngine && mode === 'create'}
                  />
                  {errors.engine_model && (
                    <p className="text-xs text-destructive">{errors.engine_model.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labor_cost" className="text-xs sm:text-sm">
                    Mão de obra (R$)
                  </Label>
                  <Controller
                    control={control}
                    name="labor_cost"
                    render={({ field }) => (
                      <MaskedInput
                        id="labor_cost"
                        mask="currency"
                        value={field.value || ''}
                        onChange={(_, rawValue) => field.onChange(rawValue)}
                        className="text-sm"
                      />
                    )}
                  />
                  {errors.labor_cost && (
                    <p className="text-xs text-destructive">{errors.labor_cost.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descrição opcional do template..."
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base sm:text-lg">Peças e Serviços *</CardTitle>
                {mode === 'create' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportDialog(true)}
                    className="gap-2 text-xs"
                  >
                    <Copy className="h-3 w-3" />
                    Importar de Template
                  </Button>
                )}
              </div>
              {errors.root?.message && (
                <p className="text-xs text-destructive mt-1">{errors.root.message}</p>
              )}
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <Tabs defaultValue="parts" className="w-full">
                <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
                  <TabsTrigger value="parts" className="text-xs sm:text-sm">
                    Peças ({selectedParts.length})
                  </TabsTrigger>
                  <TabsTrigger value="services" className="text-xs sm:text-sm">
                    Serviços ({selectedServices.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="parts" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar peças..."
                      value={partsSearchTerm}
                      onChange={(e) => setPartsSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>

                  {selectedParts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold">
                        Peças Selecionadas
                      </Label>
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        <div className="space-y-2">
                          {selectedParts.map((part) => (
                            <div
                              key={part.part_id}
                              className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-xs sm:text-sm font-medium truncate">
                                  {part.part_code ?? '-'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {part.part_name ?? '-'}
                                </div>
                                <div className="text-xs font-semibold">
                                  {formatCurrency(part.unit_cost * part.quantity)}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updatePartQuantity(part.part_id, -1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs w-6 text-center">{part.quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updatePartQuantity(part.part_id, 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePart(part.part_id)}
                                  className="h-6 w-6 p-0 text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold">
                      Adicionar Peças
                    </Label>
                    <ScrollArea className="h-[250px] border rounded-md p-2">
                      {loadingParts ? (
                        <div className="text-center text-sm text-muted-foreground p-4">
                          Carregando peças...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredParts.map((part) => {
                            const isSelected = selectedParts.some(
                              (p) => p.part_id === part.id
                            );
                            return (
                              <div
                                key={part.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => togglePart(part)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium truncate">
                                    {part.part_code ?? '-'}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {part.part_name ?? '-'}
                                  </div>
                                </div>
                                <div className="text-xs font-semibold whitespace-nowrap">
                                  {formatCurrency(part.unit_cost)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar serviços..."
                      value={servicesSearchTerm}
                      onChange={(e) => setServicesSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>

                  {selectedServices.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold">
                        Serviços Selecionados
                      </Label>
                      <ScrollArea className="h-[200px] border rounded-md p-2">
                        <div className="space-y-2">
                          {selectedServices.map((service) => (
                            <div
                              key={service.service_id}
                              className="flex flex-col gap-1.5 p-2 bg-muted rounded-md"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium truncate">
                                    {service.description}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Padrão: {formatCurrency(service.value)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateServiceQuantity(service.service_id, -1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-xs w-6 text-center">
                                    {service.quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateServiceQuantity(service.service_id, 1)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeService(service.service_id)}
                                    className="h-6 w-6 p-0 text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                  Valor para lista:
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={String(service.value)}
                                  value={service.custom_value ?? ''}
                                  onChange={(e) =>
                                    updateServiceCustomValue(service.service_id, e.target.value)
                                  }
                                  className="h-6 text-xs w-28 px-2"
                                />
                                <span className="text-xs font-semibold whitespace-nowrap">
                                  = {formatCurrency((service.custom_value ?? service.value) * service.quantity)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold">
                      Adicionar Serviços
                    </Label>
                    <ScrollArea className="h-[250px] border rounded-md p-2">
                      {loadingServices ? (
                        <div className="text-center text-sm text-muted-foreground p-4">
                          Carregando serviços...
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredServices.map((service) => {
                            const isSelected = selectedServices.some(
                              (s) => s.service_id === service.id
                            );
                            return (
                              <div
                                key={service.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleService(service)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-medium truncate">
                                    {service.description}
                                  </div>
                                </div>
                                <div className="text-xs font-semibold whitespace-nowrap">
                                  {formatCurrency(service.value)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Total de Peças:
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Total de Serviços:
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Mão de obra:
                  </div>
                  <div className="text-sm sm:text-base font-semibold">Valor Total:</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-xs sm:text-sm font-medium">
                    {formatCurrency(totalPartsValue)}
                  </div>
                  <div className="text-xs sm:text-sm font-medium">
                    {formatCurrency(totalServicesValue)}
                  </div>
                  <div className="text-xs sm:text-sm font-medium">
                    {formatCurrency(Number.isFinite(laborCostValue) ? laborCostValue : 0)}
                  </div>
                  <div className="text-base sm:text-lg font-bold text-primary">
                    {formatCurrency(totalValue)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="text-sm">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="gap-2 text-sm"
            >
              <Save className="h-4 w-4" />
              {mode === 'edit' ? 'Atualizar' : 'Salvar'} Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog open={showImportDialog} onOpenChange={(open) => {
      setShowImportDialog(open);
      if (!open) setImportSearchTerm('');
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Importar Peças e Serviços de Template</DialogTitle>
        </DialogHeader>

        <div className="relative my-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar template por nome ou motor..."
            value={importSearchTerm}
            onChange={(e) => setImportSearchTerm(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
          <div className="space-y-2 pr-1">
            {allTemplates
              .filter((t) => {
                if (!importSearchTerm.trim()) return true;
                const term = importSearchTerm.toLowerCase();
                return (
                  t.name.toLowerCase().includes(term) ||
                  t.engine_brand.toLowerCase().includes(term) ||
                  t.engine_model.toLowerCase().includes(term)
                );
              })
              .map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleImportFromTemplate(t)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors space-y-1"
                >
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.engine_brand} — {t.engine_model}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{t.parts?.length ?? 0} peça(s)</span>
                    <span>{t.services?.length ?? 0} serviço(s)</span>
                  </div>
                </button>
              ))}
            {allTemplates.filter((t) => {
              if (!importSearchTerm.trim()) return true;
              const term = importSearchTerm.toLowerCase();
              return (
                t.name.toLowerCase().includes(term) ||
                t.engine_brand.toLowerCase().includes(term) ||
                t.engine_model.toLowerCase().includes(term)
              );
            }).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum template encontrado
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="mt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowImportDialog(false);
              setImportSearchTerm('');
            }}
            className="text-sm"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
