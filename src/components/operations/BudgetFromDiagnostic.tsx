// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calculator, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Minus,
  Save,
  Send
} from "lucide-react";
import { useDiagnosticChecklists } from "@/hooks/useDiagnosticChecklists";
import { useBudgets } from "@/hooks/useBudgets";
import { useDetailedBudgets } from "@/hooks/useDetailedBudgets";
import { useToast } from "@/hooks/use-toast";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  labor_hours: number;
  labor_rate: number;
  labor_total: number;
  parts: PartItem[];
  parts_total: number;
  total: number;
  selected: boolean;
  triggered_by: string;
}

interface PartItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  selected: boolean;
}

interface BudgetFromDiagnosticProps {
  diagnosticResponse: unknown;
  orderId: string;
  onBudgetCreated?: (budget: unknown) => void;
}

const BudgetFromDiagnostic = ({ 
  diagnosticResponse, 
  orderId, 
  onBudgetCreated 
}: BudgetFromDiagnosticProps) => {
  const { toast } = useToast();
  const { createBudget, calculateBudgetFromServices } = useBudgets();
  const { checkBudgetExists } = useDetailedBudgets();
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [budgetNotes, setBudgetNotes] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Calcular totais
  const selectedServices = services.filter(s => s.selected);
  const selectedParts = parts.filter(p => p.selected);
  
  const laborTotal = selectedServices.reduce((sum, s) => sum + s.labor_total, 0);
  const partsTotal = selectedParts.reduce((sum, p) => sum + p.total, 0);
  const subtotal = laborTotal + partsTotal;
  const discount = 0; // Desconto será implementado conforme regras de negócio
  const tax = 0; // Impostos serão calculados pelo módulo fiscal
  const total = subtotal - discount + tax;

  useEffect(() => {
    if (diagnosticResponse && isOpen) {
      loadAllData();
    }
  }, [diagnosticResponse, isOpen]);

  const loadAllData = async () => {
    if (!diagnosticResponse) return;

    setIsCalculating(true);
    
    try {
      let allAdditionalParts: unknown[] = [];
      let allAdditionalServices: unknown[] = [];
      let allGeneratedServices: unknown[] = [];

      if (diagnosticResponse.additional_parts) {
        allAdditionalParts = Array.isArray(diagnosticResponse.additional_parts) 
          ? diagnosticResponse.additional_parts 
          : [];
      }

      if (diagnosticResponse.additional_services) {
        allAdditionalServices = Array.isArray(diagnosticResponse.additional_services) 
          ? diagnosticResponse.additional_services 
          : [];
      }

      if (diagnosticResponse.generated_services) {
        allGeneratedServices = Array.isArray(diagnosticResponse.generated_services) 
          ? diagnosticResponse.generated_services 
          : [];
      }

      if (diagnosticResponse.all_responses && Array.isArray(diagnosticResponse.all_responses)) {
        diagnosticResponse.all_responses.forEach((response: unknown) => {
          if (response.additional_parts && Array.isArray(response.additional_parts)) {
            allAdditionalParts = [...allAdditionalParts, ...response.additional_parts];
          }
          if (response.additional_services && Array.isArray(response.additional_services)) {
            allAdditionalServices = [...allAdditionalServices, ...response.additional_services];
          }
          if (response.generated_services && Array.isArray(response.generated_services)) {
            allGeneratedServices = [...allGeneratedServices, ...response.generated_services];
          }
        });
      }

      const partItems: PartItem[] = allAdditionalParts.map((part: unknown, index: number) => ({
        id: `additional_part_${index}`,
        name: part.part_name || part.name || '',
        quantity: part.quantity || 1,
        unit_price: part.unit_price || 0,
        total: part.total || (part.quantity || 1) * (part.unit_price || 0),
        selected: true
      }));

      const additionalServiceItems: ServiceItem[] = allAdditionalServices.map((service: unknown, index: number) => ({
        id: `additional_service_${index}`,
        name: service.description || service.name || `Serviço Adicional ${index + 1}`,
        description: service.description || '',
        labor_hours: service.quantity || 1,
        labor_rate: service.unit_price || 0,
        labor_total: (service.quantity || 1) * (service.unit_price || 0),
        parts: [],
        parts_total: 0,
        total: (service.quantity || 1) * (service.unit_price || 0),
        selected: true,
        triggered_by: 'Diagnóstico - Serviço Adicional'
      }));

      const generatedServiceItems: ServiceItem[] = allGeneratedServices.map((service: unknown, index: number) => ({
        id: `service_${index}`,
        name: service.name || service,
        description: service.description || '',
        labor_hours: service.labor_hours || 1,
        labor_rate: service.labor_rate || 50,
        labor_total: (service.labor_hours || 1) * (service.labor_rate || 50),
        parts: [],
        parts_total: 0,
        total: (service.labor_hours || 1) * (service.labor_rate || 50),
        selected: true,
        triggered_by: service.triggered_by || 'Checklist'
      }));

      setParts(partItems);

      if (generatedServiceItems.length > 0) {
        const calculatedBudget = await calculateBudgetFromServices(generatedServiceItems, []);
        if (calculatedBudget) {
          const updatedServices = generatedServiceItems.map(service => {
            const calculatedService = calculatedBudget.services.find(s => s.name === service.name);
            return calculatedService ? {
              ...service,
              labor_hours: calculatedService.labor_hours,
              labor_rate: calculatedService.labor_rate,
              labor_total: calculatedService.labor_total,
              total: calculatedService.labor_total
            } : service;
          });
          setServices([...updatedServices, ...additionalServiceItems]);
        } else {
          setServices([...generatedServiceItems, ...additionalServiceItems]);
        }
      } else {
        setServices(additionalServiceItems);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do diagnóstico:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, selected: !service.selected }
        : service
    ));
  };

  const handleServiceUpdate = (serviceId: string, field: keyof ServiceItem, value: unknown) => {
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        const updated = { ...service, [field]: value };
        
        // Recalcular totais se necessário
        if (field === 'labor_hours' || field === 'labor_rate') {
          updated.labor_total = updated.labor_hours * updated.labor_rate;
          updated.total = updated.labor_total + updated.parts_total;
        }
        
        return updated;
      }
      return service;
    }));
  };

  const handlePartToggle = (partId: string) => {
    setParts(prev => prev.map(part => 
      part.id === partId 
        ? { ...part, selected: !part.selected }
        : part
    ));
  };

  const handlePartUpdate = (partId: string, field: keyof PartItem, value: unknown) => {
    setParts(prev => prev.map(part => {
      if (part.id === partId) {
        const updated = { ...part, [field]: value };
        
        // Recalcular total se necessário
        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }
        
        return updated;
      }
      return part;
    }));
  };

  const addPart = (serviceId: string) => {
    const newPart: PartItem = {
      id: `part_${Date.now()}`,
      name: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      selected: true
    };
    
    setParts(prev => [...prev, newPart]);
    
    // Adicionar à lista de peças do serviço
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, parts: [...service.parts, newPart] }
        : service
    ));
  };

  const removePart = (partId: string) => {
    setParts(prev => prev.filter(part => part.id !== partId));
    
    // Remover da lista de peças dos serviços
    setServices(prev => prev.map(service => ({
      ...service,
      parts: service.parts.filter(part => part.id !== partId)
    })));
  };

  const handleCreateBudget = async () => {
    if (selectedServices.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um serviço para o orçamento",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Verificar se já existe orçamento para este componente
      const existingBudget = await checkBudgetExists(orderId, diagnosticResponse.component);
      
      if (existingBudget) {
        toast({
          title: "Orçamento já existe",
          description: `Já existe um orçamento para o componente "${diagnosticResponse.component}" nesta ordem de serviço. Orçamento: ${existingBudget.budget_number || 'N/A'} (Status: ${existingBudget.status})`,
          variant: "destructive"
        });
        setIsCreating(false);
        return;
      }

      // Calcular orçamento usando a tabela de preços
      const calculatedBudget = await calculateBudgetFromServices(selectedServices, selectedParts);
      
      if (!calculatedBudget) {
        throw new Error('Erro ao calcular orçamento');
      }

      // Preparar dados do orçamento
      const budgetData = {
        description: `Orçamento baseado em diagnóstico: ${diagnosticResponse.checklist?.name || 'Diagnóstico'}`,
        order_id: orderId,
        component: diagnosticResponse.component,
        labor_hours: calculatedBudget.labor_hours,
        labor_rate: calculatedBudget.labor_rate,
        labor_total: calculatedBudget.labor_total,
        parts_total: calculatedBudget.parts_total,
        discount: calculatedBudget.discount,
        tax_percentage: calculatedBudget.tax_percentage,
        tax_amount: calculatedBudget.tax_amount,
        total_amount: calculatedBudget.total_amount,
        estimated_delivery_days: 7,
        warranty_months: 3,
        status: 'pendente' as const,
        notes: budgetNotes,
        // Campos JSON para armazenar detalhes
        services_detail: JSON.stringify(calculatedBudget.services),
        parts_detail: JSON.stringify(calculatedBudget.parts)
      };

      const createdBudget = await createBudget(budgetData);

      if (createdBudget) {
        toast({
          title: "Sucesso",
          description: "Orçamento criado com sucesso a partir do diagnóstico"
        });

        if (onBudgetCreated) {
          onBudgetCreated(createdBudget);
        }

        setIsOpen(false);
      }
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar orçamento",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Calculator className="w-4 h-4 mr-2" />
          Criar Orçamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Orçamento a partir do Diagnóstico</DialogTitle>
          <DialogDescription>
            Revise e ajuste os serviços identificados pelo checklist para criar um orçamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Diagnóstico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Checklist</Label>
                  <p className="font-medium">{diagnosticResponse.checklist?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {new Date(diagnosticResponse.diagnosed_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Serviços Identificados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Serviços Identificados
                {isCalculating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                )}
              </CardTitle>
              <CardDescription>
                Marque os serviços que devem ser incluídos no orçamento
                {isCalculating && (
                  <span className="text-primary"> (Calculando preços...)</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Incluir</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-24">Horas</TableHead>
                    <TableHead className="w-24">Taxa/h</TableHead>
                    <TableHead className="w-24">Total</TableHead>
                    <TableHead className="w-32">Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <Checkbox
                          checked={service.selected}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={service.name}
                          onChange={(e) => handleServiceUpdate(service.id, 'name', e.target.value)}
                          className="border-0 p-0 h-auto"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={service.description}
                          onChange={(e) => handleServiceUpdate(service.id, 'description', e.target.value)}
                          className="border-0 p-0 h-auto resize-none"
                          rows={2}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={service.labor_hours}
                          onChange={(e) => handleServiceUpdate(service.id, 'labor_hours', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={service.labor_rate}
                          onChange={(e) => handleServiceUpdate(service.id, 'labor_rate', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {service.labor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {service.triggered_by}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Peças/Componentes */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Peças e Componentes</CardTitle>
                  <CardDescription>
                    Adicione peças necessárias para os serviços
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPart('general')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Peça
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {parts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Incluir</TableHead>
                      <TableHead>Peça</TableHead>
                      <TableHead className="w-24">Qtd</TableHead>
                      <TableHead className="w-24">Preço Unit.</TableHead>
                      <TableHead className="w-24">Total</TableHead>
                      <TableHead className="w-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell>
                          <Checkbox
                            checked={part.selected}
                            onCheckedChange={() => handlePartToggle(part.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={part.name}
                            onChange={(e) => handlePartUpdate(part.id, 'name', e.target.value)}
                            placeholder="Nome da peça"
                            className="border-0 p-0 h-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={part.quantity}
                            onChange={(e) => handlePartUpdate(part.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={part.unit_price}
                            onChange={(e) => handlePartUpdate(part.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          R$ {part.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePart(part.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma peça adicionada</p>
                  <p className="text-sm">Clique em "Adicionar Peça" para incluir componentes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo do Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Mão de Obra:</span>
                      <span>R$ {laborTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peças:</span>
                      <span>R$ {partsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>-R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between">
                        <span>Impostos:</span>
                        <span>R$ {tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedServices.length} serviço(s) selecionado(s)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedParts.length} peça(s) selecionada(s)
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="budget_notes">Observações do Orçamento</Label>
                  <Textarea
                    id="budget_notes"
                    value={budgetNotes}
                    onChange={(e) => setBudgetNotes(e.target.value)}
                    placeholder="Observações adicionais para o orçamento..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateBudget}
              disabled={isCreating || selectedServices.length === 0}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Orçamento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetFromDiagnostic;
