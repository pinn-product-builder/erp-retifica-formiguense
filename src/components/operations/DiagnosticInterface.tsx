import React, { useState, useEffect } from 'react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Send,
  Eye,
  Hash,
  Type,
  List,
  Upload,
  X,
  Calculator
} from "lucide-react";
import { useDiagnosticChecklists, useDiagnosticChecklistsQuery, useDiagnosticChecklistMutations } from "@/hooks/useDiagnosticChecklists";
import { useEngineTypes } from "@/hooks/useEngineTypes";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import BudgetFromDiagnostic from './BudgetFromDiagnostic';
import DiagnosticValidation from './DiagnosticValidation';

interface DiagnosticInterfaceProps {
  orderId?: string;
  onComplete?: (response: any) => void;
}

interface ChecklistResponse {
  [itemId: string]: {
    value: any;
    photos: any[];
    notes?: string;
  };
}

const DiagnosticInterface = ({ orderId, onComplete }: DiagnosticInterfaceProps) => {
  const { toast } = useToast();
  const [selectedEngineType, setSelectedEngineType] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<string>('');
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [responses, setResponses] = useState<ChecklistResponse>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [diagnosticResponse, setDiagnosticResponse] = useState<any>(null);
  const [isValid, setIsValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const { engineTypes } = useEngineTypes();
  const { data: checklists } = useDiagnosticChecklistsQuery(selectedEngineType, selectedComponent);
  const { orders } = useOrders();
  const mutations = useDiagnosticChecklistMutations();

  const componentOptions = [
    { value: 'bloco', label: 'Bloco' },
    { value: 'eixo', label: 'Eixo' },
    { value: 'biela', label: 'Biela' },
    { value: 'comando', label: 'Comando' },
    { value: 'cabecote', label: 'Cabeçote' }
  ];

  const itemTypeIcons = {
    checkbox: CheckCircle,
    measurement: Hash,
    photo: Camera,
    text: Type,
    select: List
  };

  const handleChecklistSelect = (checklist: any) => {
    setSelectedChecklist(checklist);
    // Initialize responses for all items
    const initialResponses: ChecklistResponse = {};
    checklist.items?.forEach((item: any) => {
      initialResponses[item.id] = {
        value: item.item_type === 'checkbox' ? false : '',
        photos: [],
        notes: ''
      };
    });
    setResponses(initialResponses);
  };

  const handleResponseChange = (itemId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        value
      }
    }));
  };

  const handlePhotoUpload = async (itemId: string, file: File) => {
    try {
      const responseId = `temp_${Date.now()}`;
      const photoData = await mutations.uploadPhoto.mutateAsync({
        file,
        responseId,
        itemId
      });

      if (photoData) {
        setResponses(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            photos: [...(prev[itemId]?.photos || []), photoData]
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
    }
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }));
  };

  const removePhoto = (itemId: string, photoIndex: number) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: prev[itemId]?.photos.filter((_, index) => index !== photoIndex) || []
      }
    }));
  };

  const generateServices = () => {
    if (!selectedChecklist) return [];

    const services: any[] = [];
    
    selectedChecklist.items?.forEach((item: any) => {
      const response = responses[item.id];
      if (response?.value && item.triggers_service) {
        item.triggers_service.forEach((service: any) => {
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
    if (!selectedChecklist || !orderId) {
      toast({
        title: "Erro",
        description: "Checklist e ordem de serviço são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!isValid) {
      toast({
        title: "Erro",
        description: "Corrija os erros de validação antes de salvar",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedServices = generateServices();
      
      const response = await mutations.saveResponse.mutateAsync({
        order_id: orderId,
        checklist_id: selectedChecklist.id,
        component: selectedChecklist.component,
        responses,
        photos: Object.values(responses).flatMap(r => r.photos),
        generated_services: generatedServices,
        diagnosed_by: 'current_user_id', // TODO: usar usuário logado
        status: 'completed'
      });

      toast({
        title: "Sucesso",
        description: "Diagnóstico salvo com sucesso"
      });

      // Store diagnostic response for budget creation
      setDiagnosticResponse({
        ...response,
        generated_services: generatedServices,
        component: selectedChecklist.component,
        checklist: selectedChecklist,
        diagnosed_at: new Date().toISOString()
      });

      if (onComplete) {
        onComplete(response);
      }
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = (item: any) => {
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
          {/* Render based on item type */}
          {item.item_type === 'checkbox' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`item_${item.id}`}
                checked={response.value}
                onCheckedChange={(checked) => handleResponseChange(item.id, checked)}
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
                {item.expected_values && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Esperado: {item.expected_values.min} - {item.expected_values.max})
                  </span>
                )}
              </Label>
              <Input
                id={`measurement_${item.id}`}
                type="number"
                step="0.01"
                value={response.value}
                onChange={(e) => handleResponseChange(item.id, parseFloat(e.target.value) || 0)}
                placeholder="Digite a medição..."
              />
            </div>
          )}

          {item.item_type === 'text' && (
            <div className="space-y-2">
              <Label htmlFor={`text_${item.id}`}>Observações</Label>
              <Textarea
                id={`text_${item.id}`}
                value={response.value}
                onChange={(e) => handleResponseChange(item.id, e.target.value)}
                placeholder="Digite suas observações..."
                rows={3}
              />
            </div>
          )}

          {item.item_type === 'select' && (
            <div className="space-y-2">
              <Label htmlFor={`select_${item.id}`}>Seleção</Label>
              <Select
                value={response.value}
                onValueChange={(value) => handleResponseChange(item.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  {item.item_options?.map((option: any, index: number) => (
                    <SelectItem key={index} value={option.value || option}>
                      {option.label || option}
                    </SelectItem>
                  ))}
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
                      if (file) handlePhotoUpload(item.id, file);
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
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(item.id, index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes field for all item types */}
          <div className="space-y-2">
            <Label htmlFor={`notes_${item.id}`}>Observações Adicionais</Label>
            <Textarea
              id={`notes_${item.id}`}
              value={response.notes || ''}
              onChange={(e) => handleNotesChange(item.id, e.target.value)}
              placeholder="Observações adicionais sobre este item..."
              rows={2}
            />
          </div>

          {/* Help text */}
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

  const generatedServices = generateServices();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Diagnóstico com Checklist</h2>
          <p className="text-muted-foreground">
            Execute diagnóstico padronizado usando checklists configurados
          </p>
        </div>
        
        {selectedChecklist && (
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
              disabled={isSubmitting || !isValid}
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
        )}

        {diagnosticResponse && orderId && (
          <div className="flex gap-2">
            <BudgetFromDiagnostic
              diagnosticResponse={diagnosticResponse}
              orderId={orderId}
              onBudgetCreated={(budget) => {
                toast({
                  title: "Sucesso",
                  description: "Orçamento criado com sucesso a partir do diagnóstico"
                });
                setDiagnosticResponse(null); // Reset after budget creation
              }}
            />
          </div>
        )}
      </div>

      {/* Checklist Selection */}
      {!selectedChecklist && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Checklist</CardTitle>
            <CardDescription>
              Escolha o tipo de motor e componente para carregar o checklist apropriado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="engine_type">Tipo de Motor</Label>
                <Select value={selectedEngineType} onValueChange={setSelectedEngineType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de motor" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="component">Componente</Label>
                <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o componente" />
                  </SelectTrigger>
                  <SelectContent>
                    {componentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {checklists && checklists.length > 0 && (
              <div className="space-y-2">
                <Label>Checklists Disponíveis</Label>
                <div className="grid gap-2">
                  {checklists.map((checklist) => (
                    <Card
                      key={checklist.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleChecklistSelect(checklist)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{checklist.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {checklist.description || "Sem descrição"}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">
                                {componentOptions.find(c => c.value === checklist.component)?.label}
                              </Badge>
                              <Badge variant="secondary">
                                {checklist.items?.length || 0} itens
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Selecionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {checklists && checklists.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum checklist encontrado para os critérios selecionados</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Checklist Execution */}
      {selectedChecklist && (
        <div className="space-y-6">
          {/* Checklist Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedChecklist.name}</CardTitle>
                  <CardDescription>
                    {selectedChecklist.description || "Checklist de diagnóstico"}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {componentOptions.find(c => c.value === selectedChecklist.component)?.label}
                    </Badge>
                    <Badge variant="secondary">
                      {selectedChecklist.items?.length || 0} itens
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedChecklist(null)}
                >
                  Trocar Checklist
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Generated Services Preview */}
          {generatedServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Serviços Identificados
                </CardTitle>
                <CardDescription>
                  Baseado nas respostas do checklist, os seguintes serviços foram identificados:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generatedServices.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded border">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{service.name || service}</span>
                      <Badge variant="outline" className="text-xs">
                        {service.triggered_by}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validação */}
          <DiagnosticValidation
            responses={responses}
            checklist={selectedChecklist}
            onValidationChange={handleValidationChange}
          />

          {/* Checklist Items */}
          <div className="space-y-4">
            {selectedChecklist.items
              ?.sort((a: any, b: any) => a.display_order - b.display_order)
              .map((item: any) => renderItem(item))}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização do Diagnóstico</DialogTitle>
            <DialogDescription>
              Resumo das respostas e serviços identificados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Responses Summary */}
            <div>
              <h3 className="font-medium mb-3">Respostas</h3>
              <div className="space-y-2">
                {selectedChecklist?.items?.map((item: any) => {
                  const response = responses[item.id];
                  return (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-sm">{item.item_name}</span>
                      <div className="flex items-center gap-2">
                        {item.item_type === 'checkbox' && (
                          <Badge variant={response?.value ? "default" : "secondary"}>
                            {response?.value ? "Sim" : "Não"}
                          </Badge>
                        )}
                        {item.item_type === 'measurement' && (
                          <Badge variant="outline">
                            {response?.value}mm
                          </Badge>
                        )}
                        {item.item_type === 'text' && (
                          <span className="text-sm text-muted-foreground">
                            {response?.value || "Sem observação"}
                          </span>
                        )}
                        {item.item_type === 'select' && (
                          <Badge variant="outline">
                            {response?.value || "Não selecionado"}
                          </Badge>
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

            {/* Generated Services */}
            {generatedServices.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Serviços Identificados</h3>
                <div className="space-y-2">
                  {generatedServices.map((service, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded border">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{service.name || service}</span>
                        <Badge variant="outline" className="text-xs">
                          {service.triggered_by}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagnosticInterface;
