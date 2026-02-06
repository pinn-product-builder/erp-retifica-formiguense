import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DiagnosticService } from "@/services/DiagnosticService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Eye,
  Wrench
} from "lucide-react";
import { useDiagnosticChecklistsQuery } from "@/hooks/useDiagnosticChecklists";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useMacroComponents } from "@/hooks/useMacroComponents";
import { useAdditionalServices } from "@/hooks/useAdditionalServices";
import { useEngineTemplateByEngine } from "@/hooks/useEngineTemplates";
import BudgetFromDiagnostic from './BudgetFromDiagnostic';
import { DiagnosticComponentTab } from './DiagnosticComponentTab';
import { DiagnosticObservationsTab } from './DiagnosticObservationsTab';
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

const mapMacroComponentToEnum = (macroComponentName: string): string => {
  const mapping: Record<string, string> = {
    'Bloco': 'bloco',
    'Biela': 'biela',
    'Virabrequim': 'virabrequim',
    'Comando': 'comando',
    'Volante': 'volante',
    'Cabecote': 'cabecote',
    'Montagem Completa': 'montagem'
  };
  
  return mapping[macroComponentName] || macroComponentName.toLowerCase().replace(/\s+/g, '_');
};

const DiagnosticInterface = ({ orderId, onComplete }: DiagnosticInterfaceProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('');
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
  const { macroComponents } = useMacroComponents();
  const { getServicesByComponent } = useAdditionalServices();
  const [orderEngineTypeId, setOrderEngineTypeId] = useState<string | null>(null);
  const [engineBrand, setEngineBrand] = useState<string | undefined>(undefined);
  const [engineModel, setEngineModel] = useState<string | undefined>(undefined);
  
  const { template: engineTemplate } = useEngineTemplateByEngine(engineBrand, engineModel);

  const activeMacroComponents = React.useMemo(() => {
    if (!Array.isArray(macroComponents)) return [];
    return macroComponents
      .filter(mc => mc.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(mc => ({
        id: mc.id,
        name: mc.name,
        value: mapMacroComponentToEnum(mc.name),
        label: mc.name
      }));
  }, [macroComponents]);

  const loadChecklists = useCallback(async () => {
    if (!currentOrganization?.id || !Array.isArray(macroComponents) || macroComponents.length === 0 || !orderId) return;

    const activeComponents = macroComponents
      .filter(mc => mc.is_active)
      .sort((a, b) => a.display_order - b.display_order)
      .map(mc => ({
        id: mc.id,
        name: mc.name,
        value: mapMacroComponentToEnum(mc.name),
        label: mc.name
      }));

    if (activeComponents.length === 0) return;

    const checklistsMap: Record<string, DiagnosticChecklist> = {};
    
    for (const component of activeComponents) {
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
  }, [currentOrganization?.id, macroComponents, orderId]);

  useEffect(() => {
    if (activeMacroComponents.length > 0 && !activeTab) {
      setActiveTab(activeMacroComponents[0].value);
    }
  }, [activeMacroComponents, activeTab]);

  useEffect(() => {
    if (macroComponents.length > 0 && currentOrganization?.id && orderId) {
      loadChecklists();
    }
  }, [loadChecklists, macroComponents.length, currentOrganization?.id, orderId]);

  useEffect(() => {
    const loadOrderEngineType = async () => {
      if (!orderId || !currentOrganization?.id) return;
      
      try {
        const engineTypeId = await DiagnosticService.getOrderEngineType(orderId, currentOrganization.id);
        if (engineTypeId) {
          setOrderEngineTypeId(engineTypeId);
        }
      } catch (error) {
        console.error('Erro ao carregar tipo de motor da ordem:', error);
      }
    };

    loadOrderEngineType();
  }, [orderId, currentOrganization?.id]);

  useEffect(() => {
    const loadEngineInfo = async () => {
      if (!orderId || !currentOrganization?.id) return;
      
      try {
        const engineInfo = await DiagnosticService.getOrderEngineInfo(orderId, currentOrganization.id);
        if (engineInfo) {
          setEngineBrand(engineInfo.brand);
          setEngineModel(engineInfo.model);
        }
      } catch (error) {
        console.error('Erro ao carregar informações do motor:', error);
      }
    };

    loadEngineInfo();
  }, [orderId, currentOrganization?.id]);



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

  const validateAllComponents = useCallback(() => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    activeMacroComponents.forEach(component => {
      const checklist = componentChecklists[component.value];
      const responses = componentResponses[component.value] || {};

      if (!checklist?.items) return;

      checklist.items.forEach((item: DiagnosticChecklistItem) => {
        const response = responses[item.id] || { value: '', photos: [], notes: '' };
        const validation = validateItem(item, response);

        if (item.is_required && !validation.isValid) {
          allErrors.push(`"${item.item_name}" é obrigatório`);
        }

        if (item.item_type === 'measurement' && item.expected_values && response?.value) {
          const expectedValues = item.expected_values as { min: number; max: number };
          const value = parseFloat(String(response.value));
          if (expectedValues.min !== undefined && expectedValues.max !== undefined) {
            if (value < expectedValues.min || value > expectedValues.max) {
              allWarnings.push(`"${item.item_name}" está fora do padrão esperado (${expectedValues.min} - ${expectedValues.max}mm)`);
            }
          }
        }
      });
    });

    const isValid = allErrors.length === 0;
    setIsValid(isValid);
    setValidationErrors(allErrors);
    setValidationWarnings(allWarnings);
  }, [activeMacroComponents, componentChecklists, componentResponses]);

  useEffect(() => {
    if (activeMacroComponents.length > 0 && Object.keys(componentChecklists).length > 0) {
      validateAllComponents();
    }
  }, [validateAllComponents, activeMacroComponents.length, componentChecklists]);

  const handleSubmit = async () => {
    // Validar se orderId existe e é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!orderId || orderId === "none" || !uuidRegex.test(orderId)) {
      toast({
        title: "Erro",
        description: "Ordem de serviço inválida. Por favor, selecione uma ordem válida.",
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
      const lastComponent = activeMacroComponents[activeMacroComponents.length - 1];
      const hasAnyChecklist = activeMacroComponents.some(component => {
        const checklist = componentChecklists[component.value];
        const responses = componentResponses[component.value] || {};
        return checklist && Object.keys(responses).length > 0;
      });
      
      for (const component of activeMacroComponents) {
        const checklist = componentChecklists[component.value];
        const responses = componentResponses[component.value] || {};
        const parts = componentParts[component.value] || [];
        const services = componentServices[component.value] || [];

        const hasChecklistResponses = checklist && Object.keys(responses).length > 0;
        const hasPartsOrServices = parts.length > 0 || services.length > 0;

        if (hasChecklistResponses) {
          const generatedServices = generateServices(component.value);
          const allPhotos = Object.values(responses).flatMap(r => r.photos || []);

          const isLastComponent = component.value === lastComponent.value;

          const response = await DiagnosticService.saveChecklistResponse({
            orderId,
            checklistId: checklist.id,
            component: component.value,
            responses,
            photos: allPhotos,
            generatedServices,
            diagnosedBy: user.id,
            additionalParts: parts.length > 0 ? parts : undefined,
            additionalServices: services.length > 0 ? services : undefined,
            technicalObservations: isLastComponent ? technicalObservations : undefined,
            extraServices: isLastComponent ? extraServices : undefined,
            finalOpinion: isLastComponent ? finalOpinion : undefined
          });

          savedResponses.push(response);
        } else if (hasPartsOrServices) {
          const isLastComponent = component.value === lastComponent.value;
          
          const response = await DiagnosticService.saveAdditionalPartsAndServices({
            orderId,
            component: component.value,
            diagnosedBy: user.id,
            orgId: currentOrganization?.id || '',
            additionalParts: parts.length > 0 ? parts : undefined,
            additionalServices: services.length > 0 ? services : undefined,
            technicalObservations: isLastComponent ? technicalObservations : undefined,
            extraServices: isLastComponent ? extraServices : undefined,
            finalOpinion: isLastComponent ? finalOpinion : undefined,
          });

          if (response) {
            savedResponses.push(response);
          }
        }
      }

      if (savedResponses.length === 0 && !hasAnyChecklist) {
        const hasAnyPartsOrServices = activeMacroComponents.some(component => {
          const parts = componentParts[component.value] || [];
          const services = componentServices[component.value] || [];
          return parts.length > 0 || services.length > 0;
        });

        if (!hasAnyPartsOrServices) {
          toast({
            title: "Atenção",
            description: "Adicione pelo menos um checklist preenchido ou peças/serviços",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }

      const allParts = Object.values(componentParts).flat();
      const allServices = Object.values(componentServices).flat();

      const enrichedResponses = await Promise.all(
        savedResponses.map(async (response: any) => {
          const { data: parts } = await supabase
            .from('diagnostic_additional_parts' as any)
            .select('*')
            .eq('diagnostic_response_id', response.id)
            .eq('org_id', currentOrganization?.id || '');

          const { data: services } = await supabase
            .from('diagnostic_additional_services' as any)
            .select('*')
            .eq('diagnostic_response_id', response.id)
            .eq('org_id', currentOrganization?.id || '');

          return {
            ...response,
            additional_parts: parts || [],
            additional_services: services || []
          };
        })
      );

      toast({
        title: "Sucesso",
        description: `Diagnóstico salvo com sucesso para ${savedResponses.length} componente(s)`
      });

      setDiagnosticResponse({
        ...enrichedResponses[0],
        all_responses: enrichedResponses,
        additional_parts: allParts,
        additional_services: allServices,
        labor_cost: engineTemplate?.labor_cost ?? 0,
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

  const validateItem = (item: DiagnosticChecklistItem, response: { value: unknown; photos: unknown[]; notes?: string }) => {
    if (!item.is_required) return { isValid: true, message: '' };

    const isEmpty = !response || 
      (typeof response.value === 'boolean' && !response.value) ||
      (typeof response.value === 'string' && response.value.trim() === '') ||
      (typeof response.value === 'number' && response.value === 0) ||
      (item.item_type === 'photo' && (!response.photos || response.photos.length === 0)) ||
      (item.item_type === 'select' && (!response.value || response.value === ''));

    if (isEmpty) {
      return { isValid: false, message: 'Obrigatório' };
    }

    if (item.item_type === 'measurement' && item.expected_values && response?.value) {
      const expectedValues = item.expected_values as { min: number; max: number };
      const value = parseFloat(String(response.value));
      if (expectedValues.min !== undefined && expectedValues.max !== undefined) {
        if (value < expectedValues.min || value > expectedValues.max) {
          return { isValid: false, message: 'Fora do padrão' };
        }
      }
    }

    return { isValid: true, message: '' };
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

      {activeMacroComponents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum componente macro cadastrado. Configure os componentes em Configurações → Componentes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full gap-2 h-auto ${
            activeMacroComponents.length <= 3 
              ? 'grid-cols-2 sm:grid-cols-3' 
              : activeMacroComponents.length <= 5
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
          }`}>
            {activeMacroComponents.map((component) => (
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

          {activeMacroComponents.map((component) => (
            <TabsContent key={component.value} value={component.value} className="mt-4">
              <DiagnosticComponentTab
                component={component}
                checklist={componentChecklists[component.value]}
                responses={componentResponses[component.value] || {}}
                parts={componentParts[component.value] || []}
                services={componentServices[component.value] || []}
                onResponseChange={(itemId, value) => handleResponseChange(component.value, itemId, value)}
                onPhotoUpload={(itemId, file) => handlePhotoUpload(component.value, itemId, file)}
                onPhotoRemove={(itemId, photoIndex) => removePhoto(component.value, itemId, photoIndex)}
                onNotesChange={(itemId, notes) => handleNotesChange(component.value, itemId, notes)}
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
                macroComponentId={component.id}
                engineTypeId={orderEngineTypeId || undefined}
                engineTemplate={engineTemplate}
                validateItem={validateItem}
              />
            </TabsContent>
          ))}

          <TabsContent value="observations" className="mt-4">
          <DiagnosticObservationsTab
            technicalObservations={technicalObservations}
            extraServices={extraServices}
            finalOpinion={finalOpinion}
            laborCost={engineTemplate?.labor_cost ?? 0}
            onTechnicalObservationsChange={setTechnicalObservations}
            onExtraServicesChange={setExtraServices}
            onFinalOpinionChange={setFinalOpinion}
          />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização do Diagnóstico</DialogTitle>
            <DialogDescription>
              Resumo das respostas por componente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {activeMacroComponents.map((component) => {
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

            {activeMacroComponents.map((component) => {
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
