import React, { useState, useEffect, useCallback } from 'react';
import { DiagnosticService } from "@/services/DiagnosticService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Eye,
  Hash,
  Type,
  List,
  X,
  Package,
  Wrench
} from "lucide-react";
import { useDiagnosticChecklistsQuery } from "@/hooks/useDiagnosticChecklists";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import BudgetFromDiagnostic from './BudgetFromDiagnostic';
import DiagnosticValidation from './DiagnosticValidation';
import { PartsServicesSelector } from './PartsServicesSelector';
import type { DiagnosticChecklist, DiagnosticChecklistItem } from '@/hooks/useDiagnosticChecklists';

interface DiagnosticInterfaceProps {
  orderId?: string;
  onComplete?: (response: unknown) => void;
}

interface ChecklistResponse {
  [itemId: string]: {
    value: unknown;
    photos: Array<Record<string, unknown>>;
    notes?: string;
  };
}

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Service {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const DEFAULT_COMPONENTS = [
  { value: 'bloco', label: 'Bloco' },
  { value: 'biela', label: 'Biela' },
  { value: 'virabrequim', label: 'Virabrequim' },
  { value: 'comando', label: 'Comando - Balanceiros' },
  { value: 'volante', label: 'Volante' },
  { value: 'montagem', label: 'Montagem Completa' }
];

const DiagnosticInterface = ({ orderId, onComplete }: DiagnosticInterfaceProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('bloco');
  const [componentChecklists, setComponentChecklists] = useState<Record<string, DiagnosticChecklist>>({});
  const [componentResponses, setComponentResponses] = useState<Record<string, ChecklistResponse>>({});
  const [componentParts, setComponentParts] = useState<Record<string, Part[]>>({});
  const [componentServices, setComponentServices] = useState<Record<string, Service[]>>({});
  const [technicalObservations, setTechnicalObservations] = useState<string>('');
  const [extraServices, setExtraServices] = useState<string>('');
  const [finalOpinion, setFinalOpinion] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [diagnosticResponse, setDiagnosticResponse] = useState<unknown>(null);
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const { currentOrganization } = useOrganization();

  const loadChecklists = useCallback(async () => {
    if (!currentOrganization?.id) return;

    const checklistsMap: Record<string, DiagnosticChecklist> = {};
    
    for (const component of DEFAULT_COMPONENTS) {
      try {
        const data = await DiagnosticService.getChecklistsByComponent(
          currentOrganization.id,
          component.value,
          undefined
        );

        if (data) {
          checklistsMap[component.value] = data;
          setComponentResponses(prev => {
            if (!prev[component.value]) {
              const initialResponses: ChecklistResponse = {};
              data.items?.forEach((item: DiagnosticChecklistItem) => {
                initialResponses[item.id] = {
                  value: item.item_type === 'checkbox' ? false : '',
                  photos: [],
                  notes: ''
                };
              });
              return {
                ...prev,
                [component.value]: initialResponses
              };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error(`Erro ao carregar checklist para ${component.value}:`, error);
      }
    }

    setComponentChecklists(checklistsMap);
  }, [currentOrganization?.id]);

  useEffect(() => {
    loadChecklists();
  }, [loadChecklists]);

  const itemTypeIcons = {
    checkbox: CheckCircle,
    measurement: Hash,
    photo: Camera,
    text: Type,
    select: List
  };

  const handleResponseChange = (component: string, itemId: string, value: unknown) => {
    setComponentResponses(prev => ({
      ...prev,
      [component]: {
        ...prev[component] || {},
        [itemId]: {
          ...(prev[component]?.[itemId] || { photos: [], notes: '' }),
          value
        }
      }
    }));
  };

  const handlePhotoUpload = async (component: string, itemId: string, file: File) => {
    try {
      const responseId = `temp_${Date.now()}`;
      const photoData = await DiagnosticService.uploadChecklistPhoto(file, responseId, itemId);

      if (photoData) {
        setComponentResponses(prev => ({
          ...prev,
          [component]: {
            ...prev[component] || {},
            [itemId]: {
              ...(prev[component]?.[itemId] || { value: '', notes: '' }),
              photos: [...(prev[component]?.[itemId]?.photos || []), photoData]
            }
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da foto",
        variant: "destructive"
      });
    }
  };

  const handleNotesChange = (component: string, itemId: string, notes: string) => {
    setComponentResponses(prev => ({
      ...prev,
      [component]: {
        ...prev[component] || {},
        [itemId]: {
          ...(prev[component]?.[itemId] || { value: '', photos: [] }),
          notes
        }
      }
    }));
  };

  const removePhoto = (component: string, itemId: string, photoIndex: number) => {
    setComponentResponses(prev => ({
      ...prev,
      [component]: {
        ...prev[component] || {},
        [itemId]: {
          ...prev[component]?.[itemId],
          photos: prev[component]?.[itemId]?.photos.filter((_, index) => index !== photoIndex) || []
        }
      }
    }));
  };

  const generateServices = (component: string) => {
    const checklist = componentChecklists[component];
    if (!checklist) return [];

    const services: Array<Record<string, unknown>> = [];
    const responses = componentResponses[component] || {};
    
    checklist.items?.forEach((item: DiagnosticChecklistItem) => {
      const response = responses[item.id];
      if (response?.value && item.triggers_service) {
        item.triggers_service.forEach((service: Record<string, unknown>) => {
          services.push({
            ...service,
            triggered_by: item.item_name,
            item_id: item.id
          });
        });
      }
    });

    return services;
  };

  const handleValidationChange = (valid: boolean, errors: string[], warnings: string[]) => {
    setIsValid(valid);
    setValidationErrors(errors);
    setValidationWarnings(warnings);
  };

  const handleSubmit = async () => {
    if (!orderId) {
      toast({
        title: "Erro",
        description: "Ordem de serviço é obrigatória",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await DiagnosticService.getCurrentUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      const savedResponses = [];
      const lastComponent = DEFAULT_COMPONENTS[DEFAULT_COMPONENTS.length - 1];
      
      for (const component of DEFAULT_COMPONENTS) {
        const checklist = componentChecklists[component.value];
        const responses = componentResponses[component.value] || {};
        const parts = componentParts[component.value] || [];
        const services = componentServices[component.value] || [];

        if (!checklist || Object.keys(responses).length === 0) {
          continue;
        }

        const generatedServices = generateServices(component.value);
        const allPhotos = Object.values(responses).flatMap(r => r.photos || []);

        const isLastComponent = component.value === lastComponent.value;
        const enrichedResponses = isLastComponent && (technicalObservations || extraServices || finalOpinion)
          ? {
              ...responses,
              technical_observations: technicalObservations,
              extra_services: extraServices,
              final_opinion: finalOpinion
            }
          : responses;

        const response = await DiagnosticService.saveChecklistResponse({
          orderId,
          checklistId: checklist.id,
          component: component.value,
          responses: enrichedResponses,
          photos: allPhotos,
          generatedServices,
          diagnosedBy: user.id,
          additionalParts: parts.length > 0 ? parts : undefined,
          additionalServices: services.length > 0 ? services : undefined
        });

        savedResponses.push(response);
      }


      if (savedResponses.length === 0) {
        toast({
          title: "Atenção",
          description: "Nenhum checklist foi preenchido",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Sucesso",
        description: `Diagnóstico salvo com sucesso para ${savedResponses.length} componente(s)`
      });

      const allParts = Object.values(componentParts).flat();
      const allServices = Object.values(componentServices).flat();

      setDiagnosticResponse({
        ...savedResponses[0],
        all_responses: savedResponses,
        additional_parts: allParts,
        additional_services: allServices,
        technical_observations: technicalObservations,
        extra_services: extraServices,
        final_opinion: finalOpinion,
        diagnosed_at: new Date().toISOString()
      });

      if (onComplete) {
        onComplete(savedResponses[0]);
      }
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar diagnóstico. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = (component: string, item: DiagnosticChecklistItem) => {
    const responses = componentResponses[component] || {};
    const response = responses[item.id] || { value: '', photos: [], notes: '' };
    const IconComponent = itemTypeIcons[item.item_type as keyof typeof itemTypeIcons] || CheckCircle;

    return (
      <Card key={item.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="w-5 h-5 text-primary" />
              <div>
                <CardTitle className="text-lg">
                  {item.item_name}
                  {item.is_required && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Obrigatório
                    </Badge>
                  )}
                </CardTitle>
                {item.item_description && (
                  <CardDescription className="mt-1">
                    {item.item_description}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              #{item.display_order}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {item.item_type === 'checkbox' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`item_${item.id}`}
                checked={Boolean(response.value)}
                onCheckedChange={(checked) => handleResponseChange(component, item.id, checked)}
              />
              <Label htmlFor={`item_${item.id}`} className="text-sm">
                Marcar como verificado
              </Label>
            </div>
          )}

          {item.item_type === 'measurement' && (
            <div className="space-y-2">
              <Label htmlFor={`measurement_${item.id}`}>
                Medição (mm)
                {item.expected_values && typeof item.expected_values === 'object' && 'min' in item.expected_values && 'max' in item.expected_values && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Esperado: {String(item.expected_values.min)} - {String(item.expected_values.max)})
                  </span>
                )}
              </Label>
              <Input
                id={`measurement_${item.id}`}
                type="number"
                step="0.01"
                value={typeof response.value === 'number' ? response.value : ''}
                onChange={(e) => handleResponseChange(component, item.id, parseFloat(e.target.value) || 0)}
                placeholder="Digite a medição..."
              />
            </div>
          )}

          {item.item_type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor={`text_${item.id}`}>Observações</Label>
              <Textarea
                id={`text_${item.id}`}
                value={typeof response.value === 'string' ? response.value : ''}
                onChange={(e) => handleResponseChange(component, item.id, e.target.value)}
                placeholder="Digite suas observações..."
                rows={3}
              />
            </div>
          )}

          {item.item_type === 'select' && (
            <div className="space-y-2">
              <Label htmlFor={`select_${item.id}`}>Seleção</Label>
              <Select
                value={String(response.value || '')}
                onValueChange={(value) => handleResponseChange(component, item.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {item.item_options?.map((option: Record<string, unknown> | string, index: number) => {
                    const optionValue = typeof option === 'object' && option !== null && 'value' in option 
                      ? String(option.value) 
                      : String(option);
                    const optionLabel = typeof option === 'object' && option !== null && 'label' in option
                      ? String(option.label)
                      : String(option);
                    return (
                      <SelectItem key={index} value={optionValue}>
                        {optionLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {item.item_type === 'photo' && (
            <div className="space-y-4">
              <div>
                <Label>Fotos</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(component, item.id, file);
                    }}
                    className="hidden"
                    id={`photo_${item.id}`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById(`photo_${item.id}`)?.click()}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Adicionar Foto
                  </Button>
                </div>
              </div>

              {response.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {response.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={String(photo.url || '')}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(component, item.id, index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`notes_${item.id}`}>Observações Adicionais</Label>
            <Textarea
              id={`notes_${item.id}`}
              value={response.notes || ''}
              onChange={(e) => handleNotesChange(component, item.id, e.target.value)}
              placeholder="Observações adicionais sobre este item..."
              rows={2}
            />
          </div>

          {item.help_text && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {item.help_text}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderComponentTab = (component: { value: string; label: string }) => {
    const checklist = componentChecklists[component.value];
    const responses = componentResponses[component.value] || {};

    if (!checklist) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum checklist encontrado para {component.label}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{checklist.name}</CardTitle>
              <CardDescription>
                {checklist.description || "Checklist de diagnóstico"}
              </CardDescription>
              <Badge variant="secondary" className="mt-2">
                {checklist.items?.length || 0} itens
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <DiagnosticValidation
          responses={responses}
          checklist={{
            items: checklist.items?.map(item => ({
              id: item.id,
              item_name: item.item_name,
              item_type: item.item_type,
              is_required: item.is_required,
              expected_values: item.expected_values as { min: number; max: number } | undefined
            }))
          }}
          onValidationChange={handleValidationChange}
        />

        <div className="space-y-4">
          {checklist.items
            ?.sort((a: DiagnosticChecklistItem, b: DiagnosticChecklistItem) => a.display_order - b.display_order)
            .map((item: DiagnosticChecklistItem) => renderItem(component.value, item))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Peças e Serviços Adicionais - {component.label}
            </CardTitle>
            <CardDescription>
              Adicione peças e serviços adicionais específicos deste componente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PartsServicesSelector
              selectedParts={componentParts[component.value] || []}
              selectedServices={componentServices[component.value] || []}
              onPartsChange={(parts) => {
                setComponentParts(prev => ({
                  ...prev,
                  [component.value]: parts
                }));
              }}
              onServicesChange={(services) => {
                setComponentServices(prev => ({
                  ...prev,
                  [component.value]: services
                }));
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Diagnóstico com Checklist</h2>
          <p className="text-muted-foreground">
            Execute diagnóstico padronizado usando checklists por componente
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Diagnóstico
              </>
            )}
          </Button>
        </div>

        {diagnosticResponse && orderId && (
          <BudgetFromDiagnostic
            diagnosticResponse={diagnosticResponse}
            orderId={orderId}
            onBudgetCreated={(budget) => {
              toast({
                title: "Sucesso",
                description: "Orçamento criado com sucesso a partir do diagnóstico"
              });
              setDiagnosticResponse(null);
            }}
          />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8 gap-2 h-auto">
          {DEFAULT_COMPONENTS.map((component) => (
            <TabsTrigger 
              key={component.value} 
              value={component.value}
              className="text-xs sm:text-sm"
            >
              {component.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="observations" className="text-xs sm:text-sm">
            <Wrench className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Observações</span>
            <span className="sm:hidden">Obs</span>
          </TabsTrigger>
        </TabsList>

        {DEFAULT_COMPONENTS.map((component) => (
          <TabsContent key={component.value} value={component.value} className="mt-4">
            {renderComponentTab(component)}
          </TabsContent>
        ))}

        <TabsContent value="observations" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Observações Técnicas</CardTitle>
                <CardDescription>
                  Registre observações técnicas relevantes sobre o diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={technicalObservations}
                  onChange={(e) => setTechnicalObservations(e.target.value)}
                  placeholder="Digite as observações técnicas..."
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Serviços Extras</CardTitle>
                <CardDescription>
                  Descreva serviços extras identificados durante o diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={extraServices}
                  onChange={(e) => setExtraServices(e.target.value)}
                  placeholder="Descreva os serviços extras..."
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parecer Final</CardTitle>
                <CardDescription>
                  Forneça o parecer final sobre o diagnóstico realizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={finalOpinion}
                  onChange={(e) => setFinalOpinion(e.target.value)}
                  placeholder="Digite o parecer final..."
                  className="min-h-[200px]"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização do Diagnóstico</DialogTitle>
            <DialogDescription>
              Resumo das respostas por componente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {DEFAULT_COMPONENTS.map((component) => {
              const checklist = componentChecklists[component.value];
              const responses = componentResponses[component.value] || {};
              
              if (!checklist || Object.keys(responses).length === 0) return null;

              return (
                <div key={component.value}>
                  <h3 className="font-medium mb-3">{component.label}</h3>
                  <div className="space-y-2">
                    {checklist.items?.map((item: DiagnosticChecklistItem) => {
                      const response = responses[item.id];
                      if (!response) return null;

                      return (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="text-sm">{item.item_name}</span>
                          <div className="flex items-center gap-2">
                            {item.item_type === 'checkbox' && (
                              <Badge variant={response?.value ? "default" : "secondary"}>
                                {String(response?.value ? "Sim" : "Não")}
                              </Badge>
                            )}
                            {item.item_type === 'measurement' && (
                              <Badge variant="outline">
                                {String(response?.value)}mm
                              </Badge>
                            )}
                            {item.item_type === 'text' && (
                              <span className="text-sm text-muted-foreground">
                                {String(response?.value || "Sem observação")}
                              </span>
                            )}
                            {item.item_type === 'photo' && (
                              <Badge variant="outline">
                                {response?.photos?.length || 0} foto(s)
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {DEFAULT_COMPONENTS.map((component) => {
              const parts = componentParts[component.value] || [];
              const services = componentServices[component.value] || [];
              
              if (parts.length === 0 && services.length === 0) return null;

              return (
                <div key={`parts-${component.value}`}>
                  <h3 className="font-medium mb-3">Peças e Serviços - {component.label}</h3>
                  {parts.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Peças ({parts.length})</h4>
                      <div className="space-y-1">
                        {parts.map((part) => (
                          <div key={part.id} className="text-sm p-2 bg-muted/50 rounded">
                            {part.part_name} - Qtd: {part.quantity} - Total: R$ {part.total.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {services.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Serviços ({services.length})</h4>
                      <div className="space-y-1">
                        {services.map((service) => (
                          <div key={service.id} className="text-sm p-2 bg-muted/50 rounded">
                            {service.description} - Qtd: {service.quantity} - Total: R$ {service.total.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(technicalObservations || extraServices || finalOpinion) && (
              <div>
                <h3 className="font-medium mb-3">Observações e Parecer</h3>
                {technicalObservations && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Observações Técnicas</h4>
                    <p className="text-sm p-2 bg-muted/50 rounded whitespace-pre-wrap">{technicalObservations}</p>
                  </div>
                )}
                {extraServices && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Serviços Extras</h4>
                    <p className="text-sm p-2 bg-muted/50 rounded whitespace-pre-wrap">{extraServices}</p>
                  </div>
                )}
                {finalOpinion && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Parecer Final</h4>
                    <p className="text-sm p-2 bg-muted/50 rounded whitespace-pre-wrap">{finalOpinion}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DiagnosticInterface;
