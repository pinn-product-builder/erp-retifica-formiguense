import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, AlertCircle, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { DiagnosticService } from '@/services/DiagnosticService';
import type { DetailedBudget } from '@/hooks/useDetailedBudgets';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { useAdditionalServices } from '@/hooks/useAdditionalServices';
import { MaskedInput } from '@/components/ui/masked-input';

interface BudgetFormProps {
  budget?: DetailedBudget;
  orderId?: string;
  onSave: (budgetData: Partial<DetailedBudget>) => Promise<void>;
  onCancel: () => void;
}

interface Service {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  available_stock?: number;
}

export function BudgetForm({ budget, orderId, onSave, onCancel }: BudgetFormProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const { additionalServices, loading: loadingServices } = useAdditionalServices();

  // Estados do formulário
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || budget?.order_id || '');
  const [component, setComponent] = useState<string>(budget?.component || 'bloco');
  const [componentsSelected, setComponentsSelected] = useState<string[]>(budget?.component ? [budget.component] : []);
  const [services, setServices] = useState<Service[]>(budget?.services as unknown as Service[] || []);
  const [parts, setParts] = useState<Part[]>(budget?.parts as unknown as Part[] || []);
  const [laborHours, setLaborHours] = useState<number>(budget?.labor_hours || 0);
  const [laborDescription, setLaborDescription] = useState<string>((budget as { labor_description?: string })?.labor_description || '');
  const [laborRate, setLaborRate] = useState<number>(budget?.labor_rate || 50);
  const [discount, setDiscount] = useState<number>(budget?.discount || 0);
  const [taxPercentage, setTaxPercentage] = useState<number>(budget?.tax_percentage || 0);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(budget?.warranty_months || 3);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState<number>(budget?.estimated_delivery_days || 15);

  // Estados auxiliares
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [partsInventory, setPartsInventory] = useState<Array<Record<string, unknown>>>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const lastLoadedOrderIdRef = useRef<string>('');
  const [saving, setSaving] = useState(false);

  // Estados para campos de texto
  const [laborHoursText, setLaborHoursText] = useState<string>('');
  const [discountText, setDiscountText] = useState<string>('');
  const [taxText, setTaxText] = useState<string>('');
  const [warrantyText, setWarrantyText] = useState<string>('');
  const [deliveryText, setDeliveryText] = useState<string>('');

  // Novo serviço/peça temporário
  const [newService, setNewService] = useState<Partial<Service>>({ description: '', quantity: 1, unit_price: 0 });
  const [selectedService, setSelectedService] = useState<{ id: string; label: string; description: string; value: number } | null>(null);
  const [selectedPart, setSelectedPart] = useState<{ id: string; label: string; part_code: string; part_name: string; unit_cost: number; quantity: number } | null>(null);

  // Função para formatar valores monetários
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Funções de validação e formatação
  const validateAndSetHours = (value: string) => {
    // Permitir vírgula como separador decimal
    let numericValue = value.replace(/[^\d.,]/g, '');
    
    // Se tem vírgula, substituir por ponto para parseFloat
    if (numericValue.includes(',')) {
      numericValue = numericValue.replace(',', '.');
    }
    
    const numValue = parseFloat(numericValue) || 0;
    
    // Limitar a 999 horas
    const limitedValue = Math.min(numValue, 999);
    setLaborHours(limitedValue);
    
    // Manter vírgula na exibição se o usuário digitou vírgula
    const displayValue = value.includes(',') ? limitedValue.toString().replace('.', ',') : limitedValue.toString();
    setLaborHoursText(displayValue);
  };

  const validateAndSetPercentage = (value: string, setter: (value: number) => void, textSetter: (value: string) => void) => {
    // Permitir vírgula como separador decimal
    let numericValue = value.replace(/[^\d.,]/g, '');
    
    // Se tem vírgula, substituir por ponto para parseFloat
    if (numericValue.includes(',')) {
      numericValue = numericValue.replace(',', '.');
    }
    
    const numValue = parseFloat(numericValue) || 0;
    
    // Limitar a 100% e permitir valores decimais como 0,5
    const limitedValue = Math.min(Math.max(numValue, 0), 100);
    setter(limitedValue);
    
    // Manter vírgula na exibição se o usuário digitou vírgula
    const displayValue = value.includes(',') ? limitedValue.toString().replace('.', ',') : limitedValue.toString();
    textSetter(displayValue);
  };

  const validateAndSetInteger = (value: string, setter: (value: number) => void, textSetter: (value: string) => void, max: number = 999) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const numValue = parseInt(numericValue) || 0;
    
    // Limitar ao máximo
    const limitedValue = Math.min(numValue, max);
    setter(limitedValue);
    textSetter(limitedValue.toString());
  };

  // Sincronizar selectedOrderId quando budget ou orderId mudarem (apenas ao montar/mudar props)
  useEffect(() => {
    const newOrderId = orderId || budget?.order_id || '';
    if (newOrderId && newOrderId !== selectedOrderId) {
      console.log('🔄 Sincronizando selectedOrderId:', { newOrderId, selectedOrderId });
      setSelectedOrderId(newOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget?.order_id, orderId]);

  // Inicializar campos de texto com valores dos números
  useEffect(() => {
    setLaborHoursText(laborHours.toString());
    setDiscountText(discount.toString());
    setTaxText(taxPercentage.toString());
    setWarrantyText(warrantyMonths.toString());
    setDeliveryText(estimatedDeliveryDays.toString());
  }, [laborHours, discount, taxPercentage, warrantyMonths, estimatedDeliveryDays]);

  // Carregar dados do diagnóstico quando ordem for selecionada
  useEffect(() => {
    let isMounted = true;
    
    const loadDiagnosticData = async () => {
      console.log('🔍 Verificando carregamento:', { selectedOrderId, orgId: currentOrganization?.id, budgetId: budget?.id, lastLoaded: lastLoadedOrderIdRef.current });
      
      if (!selectedOrderId || !currentOrganization?.id) {
        console.log('❌ Saindo: sem ordem ou org');
        if (!isMounted) return;
        setLoadingDiagnostic(false);
        return;
      }
      
      // Se já tem budget com ID (editando), não recarregar
      if (budget?.id) {
        console.log('❌ Saindo: editando budget existente');
        return;
      }
      
      // Verificar se já carregou esta ordem usando ref (não causa re-render)
      if (selectedOrderId === lastLoadedOrderIdRef.current) {
        console.log('❌ Saindo: ordem já carregada');
        return;
      }
      
      console.log('✅ Carregando diagnóstico...');
      lastLoadedOrderIdRef.current = selectedOrderId;
      
      if (!isMounted) return;
      setLoadingDiagnostic(true);
      
      try {
        const diagnosticResponses = await DiagnosticService.getDiagnosticDataForBudget(
          selectedOrderId,
          currentOrganization.id
        );

        if (!isMounted) return;

        if (diagnosticResponses && diagnosticResponses.length > 0) {
          const allParts: Part[] = [];
          const allServices: Array<Record<string, unknown>> = [];
          const allGeneratedServices: Array<Record<string, unknown>> = [];

          diagnosticResponses.forEach((response: Record<string, unknown>) => {
            const diagnosticParts = (response.additional_parts as Part[]) || [];
            const diagnosticServices = (response.additional_services as Array<Record<string, unknown>>) || [];
            const generatedServices = (response.generated_services as Array<Record<string, unknown>>) || [];

            allParts.push(...diagnosticParts);
            allServices.push(...diagnosticServices);
            allGeneratedServices.push(...generatedServices);
          });

          if (allParts.length > 0 || allServices.length > 0 || allGeneratedServices.length > 0) {
            const loadedParts: Part[] = [];
            const loadedServices: Service[] = [];

            if (allParts.length > 0) {
              const partCodes = allParts.map(p => p.part_code);
              const { data: inventoryData } = await supabase
                .from('parts_inventory')
                .select('part_code, quantity')
                .eq('org_id', currentOrganization.id)
                .in('part_code', partCodes);

              const inventoryMap = new Map(
                (inventoryData || []).map((inv: any) => [inv.part_code, inv.quantity])
              );

              allParts.forEach((part: Part) => {
                loadedParts.push({
                  id: part.id || `part_${Date.now()}_${Math.random()}`,
                  part_code: part.part_code,
                  part_name: part.part_name,
                  quantity: part.quantity,
                  unit_price: part.unit_price,
                  total: part.total,
                  available_stock: inventoryMap.get(part.part_code) || 0
                });
              });
            }

            if (allServices.length > 0) {
              allServices.forEach((service: Record<string, unknown>) => {
                const serviceName = service.name || service.description || 'Serviço do diagnóstico';
                const serviceTotal = (service.total as number) || 0;
                const laborHours = (service.labor_hours as number) || 1;
                
                loadedServices.push({
                  id: (service.id as string) || `service_${Date.now()}_${Math.random()}`,
                  description: String(serviceName),
                  quantity: 1,
                  unit_price: laborHours > 0 ? serviceTotal / laborHours : serviceTotal,
                  total: serviceTotal
                });
              });
            }

            if (allGeneratedServices.length > 0) {
              allGeneratedServices.forEach((service: Record<string, unknown>, index: number) => {
                const serviceName = service.name || service.description || 'Serviço do diagnóstico';
                const serviceTotal = (service.labor_hours as number || 1) * (service.labor_rate as number || 50);
                
                loadedServices.push({
                  id: `generated_service_${Date.now()}_${index}`,
                  description: String(serviceName),
                  quantity: 1,
                  unit_price: serviceTotal,
                  total: serviceTotal
                });
              });
            }

            if (!isMounted) return;

            console.log('💾 Salvando:', { parts: loadedParts.length, services: loadedServices.length });

            if (loadedParts.length > 0) {
              setParts(loadedParts);
              toast({
                title: 'Peças carregadas',
                description: `${loadedParts.length} peça(s) do diagnóstico foram adicionadas`,
              });
            }

            if (loadedServices.length > 0) {
              setServices(loadedServices);
              toast({
                title: 'Serviços carregados',
                description: `${loadedServices.length} serviço(s) do diagnóstico foram adicionados`,
              });
            }
          } else {
            console.log('⚠️ Nenhum dado encontrado');
          }
        } else {
          console.log('⚠️ Sem respostas de diagnóstico');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Erro ao carregar dados do diagnóstico:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar dados do diagnóstico',
          variant: 'destructive',
        });
      } finally {
        if (isMounted) {
          setLoadingDiagnostic(false);
        }
      }
    };
    
    loadDiagnosticData();
    
    return () => {
      isMounted = false;
    };
  }, [selectedOrderId, currentOrganization?.id, budget?.id, toast]);

  // Carregar ordens disponíveis
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentOrganization?.id) return;
      
      setLoadingOrders(true);
      try {
        const orderIdToInclude = budget?.order_id || selectedOrderId;
        
        const { data: activeOrders, error: activeError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            customer_id,
            customers!inner(name),
            diagnostic_checklist_responses!inner(id)
          `)
          .eq('org_id', currentOrganization.id)
          .eq('status', 'ativa')
          .order('created_at', { ascending: false });

        if (activeError) {
          console.error('Erro na query de ordens ativas:', activeError);
          throw activeError;
        }

        let allOrders = activeOrders || [];

        if (orderIdToInclude && !allOrders.find((o: any) => o.id === orderIdToInclude)) {
          const { data: specificOrder, error: specificError } = await supabase
            .from('orders')
            .select(`
              id,
              order_number,
              customer_id,
              customers!inner(name),
              diagnostic_checklist_responses!inner(id)
            `)
            .eq('id', orderIdToInclude)
            .eq('org_id', currentOrganization.id)
            .single();

          if (!specificError && specificOrder) {
            allOrders = [specificOrder, ...allOrders];
          }
        }
        
        console.log('Ordens carregadas:', allOrders);
        console.log('Quantidade de ordens:', allOrders?.length || 0);
        setOrders(allOrders);
      } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as ordens de serviço',
          variant: 'destructive',
        });
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [currentOrganization?.id, budget?.order_id, selectedOrderId, toast]);

  // Buscar componentes da ordem selecionada
  useEffect(() => {
    const fetchOrderComponents = async () => {
      if (!selectedOrderId || !currentOrganization?.id) {
        setComponentsSelected([]);
        setComponent('');
        return;
      }

      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            engine_id,
            engines(
              has_block,
              has_head,
              has_crankshaft,
              has_piston,
              has_connecting_rod,
              reception_form_data
            )
          `)
          .eq('id', selectedOrderId)
          .eq('org_id', currentOrganization.id)
          .single();

        if (orderError) throw orderError;

        const enginesData = orderData?.engines;
        const engine = Array.isArray(enginesData) ? enginesData[0] : enginesData;
        
        const engineTyped = engine as {
          has_block?: boolean;
          has_head?: boolean;
          has_crankshaft?: boolean;
          has_piston?: boolean;
          has_connecting_rod?: boolean;
          reception_form_data?: { selectedComponents?: string[] };
        } | null | undefined;

        if (!engineTyped) {
          setComponentsSelected([]);
          setComponent('');
          return;
        }

        const components: string[] = [];
        
        if (engineTyped.has_block) components.push('bloco');
        if (engineTyped.has_head) components.push('cabecote');
        if (engineTyped.has_crankshaft) components.push('virabrequim');
        if (engineTyped.has_piston) components.push('pistao');
        if (engineTyped.has_connecting_rod) components.push('biela');

        if (engineTyped.reception_form_data?.selectedComponents) {
          const receptionComponents = engineTyped.reception_form_data.selectedComponents;
          receptionComponents.forEach((comp: string) => {
            if (!components.includes(comp)) {
              components.push(comp);
            }
          });
        }

        setComponentsSelected(components);
        setComponent(components[0] || '');
      } catch (error) {
        console.error('Erro ao buscar componentes da ordem:', error);
        toast({
          title: 'Aviso',
          description: 'Não foi possível carregar os componentes da ordem. Selecione manualmente.',
          variant: 'default',
        });
      }
    };

    fetchOrderComponents();
  }, [selectedOrderId, currentOrganization?.id, toast]);


  // Carregar peças do estoque
  useEffect(() => {
    const fetchParts = async () => {
      if (!currentOrganization?.id) return;

      setLoadingParts(true);
      try {
        const { data, error } = await supabase
          .from('parts_inventory')
          .select('*')
          .eq('org_id', currentOrganization.id)
          .order('part_name');

        if (error) throw error;
        setPartsInventory(data || []);
      } catch (error) {
        console.error('Erro ao carregar peças:', error);
      } finally {
        setLoadingParts(false);
      }
    };

    fetchParts();
  }, [currentOrganization?.id]);

  // Cálculos automáticos
  const laborTotal = laborHours * laborRate;
  const servicesTotal = services.reduce((sum, s) => sum + (s.total as number), 0);
  const partsTotal = parts.reduce((sum, p) => sum + (p.total as number), 0);
  const subtotal = laborTotal + servicesTotal + partsTotal;
  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * taxPercentage) / 100;
  const totalAmount = subtotalAfterDiscount + taxAmount;

  // Adicionar serviço
  const addService = () => {
    if (!newService.description || !newService.quantity || !newService.unit_price) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos do serviço',
        variant: 'destructive',
      });
      return;
    }

    const service: Service = {
      id: Date.now().toString(),
      description: newService.description!,
      quantity: newService.quantity!,
      unit_price: newService.unit_price!,
      total: newService.quantity! * newService.unit_price!,
    };

    setServices([...services, service]);
    setNewService({ description: '', quantity: 1, unit_price: 0 });
  };

  // Adicionar serviço do catálogo
  const addServiceFromCatalog = (catalogService: { id: string; description: string; value: number }) => {
    if (!catalogService) return;
    
    const existingService = services.find(s => s.description === catalogService.description);
    if (existingService) {
      toast({
        title: 'Atenção',
        description: 'Este serviço já foi adicionado',
        variant: 'destructive',
      });
      setSelectedService(null);
      return;
    }

    const service: Service = {
      id: `catalog-${Date.now()}`,
      description: catalogService.description,
      quantity: 1,
      unit_price: catalogService.value || 0,
      total: 1 * (catalogService.value || 0),
    };

    setServices([...services, service]);
    setSelectedService(null);
  };

  // Atualizar quantidade do serviço
  const updateServiceQuantity = (id: string, quantity: number) => {
    setServices(services.map(s => 
      s.id === id 
        ? { ...s, quantity, total: quantity * s.unit_price } 
        : s
    ));
  };

  // Atualizar valor unitário do serviço
  const updateServiceUnitPrice = (id: string, unitPrice: number) => {
    setServices(services.map(s => 
      s.id === id 
        ? { ...s, unit_price: unitPrice, total: s.quantity * unitPrice } 
        : s
    ));
  };

  // Remover serviço
  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  // Adicionar peça
  const addPart = (partInventory: { part_code: string; part_name: string; unit_cost: number; quantity: number }) => {
    if (!partInventory) return;
    
    const existingPart = parts.find(p => p.part_code === partInventory.part_code);
    if (existingPart) {
      toast({
        title: 'Atenção',
        description: 'Esta peça já foi adicionada',
        variant: 'destructive',
      });
      setSelectedPart(null);
      return;
    }

    const part: Part = {
      id: Date.now().toString(),
      part_code: partInventory.part_code,
      part_name: partInventory.part_name,
      quantity: 1,
      unit_price: partInventory.unit_cost || 0,
      total: 1 * (partInventory.unit_cost || 0),
      available_stock: partInventory.quantity,
    };

    setParts([...parts, part]);
    setSelectedPart(null);
  };

  // Atualizar quantidade da peça
  const updatePartQuantity = (id: string, quantity: number) => {
    setParts(parts.map(p => 
      p.id === id 
        ? { ...p, quantity, total: quantity * p.unit_price } 
        : p
    ));
  };

  // Remover peça
  const removePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  // Salvar orçamento
  const handleSave = async () => {
    if (!selectedOrderId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma ordem de serviço',
        variant: 'destructive',
      });
      return;
    }

    if (componentsSelected.length === 0) {
      toast({
        title: 'Erro',
        description: 'A ordem de serviço selecionada não possui componentes. Verifique a ordem de serviço.',
        variant: 'destructive',
      });
      return;
    }

    if (services.length === 0 && parts.length === 0 && laborHours === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um serviço, peça ou hora de mão de obra',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const budgetData: Partial<DetailedBudget> = {
        order_id: selectedOrderId,
        component: component as "bloco" | "eixo" | "biela" | "comando" | "cabecote",
        services : services as unknown as Record<string, unknown>[],
        parts : parts as unknown as Record<string, unknown>[],
        labor_hours: laborHours,
        labor_rate: laborRate,
        labor_total: laborTotal,
        labor_description: laborDescription,
        parts_total: partsTotal,
        discount,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        warranty_months: warrantyMonths,
        estimated_delivery_days: estimatedDeliveryDays,
        status: budget?.status === 'reopened' ? 'reopened' : 'draft',
      };

      await onSave(budgetData);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  // Preparar serviços para o autocomplete
  const servicesOptions = useMemo(() => {
    return additionalServices
      .filter((s: any) => s.is_active)
      .map((s: any) => ({
        id: s.id,
        label: s.description,
        description: s.description,
        value: s.value,
      }));
  }, [additionalServices]);

  // Preparar peças para o autocomplete
  const partsOptions = useMemo(() => {
    return partsInventory.map(p => {
      const partData = p as { id: string; part_code: string; part_name: string; unit_cost: number; quantity: number };
      return {
        id: partData.id,
        label: `${partData.part_code} - ${partData.part_name}`,
        part_code: partData.part_code,
        part_name: partData.part_name,
        unit_cost: partData.unit_cost,
        quantity: partData.quantity,
      };
    });
  }, [partsInventory]);

  return (
    <div className="space-y-6">
      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="order">Ordem de Serviço *</Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId} disabled={!!orderId || (!!budget && !!budget.order_id && !!budget.id)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a OS (O diagnóstico deve ter sido realizado)" />
              </SelectTrigger>
              <SelectContent>
                {loadingOrders ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : orders.length === 0 ? (
                  <SelectItem value="empty" disabled>Nenhuma OS disponível</SelectItem>
                ) : (
                  orders.map(order => (
                    <SelectItem key={order.id as string} value={order.id as string}>
                      {order.order_number as string} - {(order.customers as { name: string } | undefined)?.name || 'Cliente não informado'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {loadingDiagnostic && (
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Carregando dados do diagnóstico...
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Buscando peças e serviços adicionais
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mão de Obra */}
      <Card>
        <CardHeader>
          <CardTitle>Mão de Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="laborHours">Horas de Trabalho</Label>
              <Input
                id="laborHours"
                type="text"
                placeholder="Ex: 8.5"
                value={laborHoursText}
                onChange={(e) => validateAndSetHours(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="laborRate">Valor por Hora (R$)</Label>
              <MaskedInput
                id="laborRate"
                mask="currency"
                value={laborRate.toString()}
                onChange={(maskedValue, rawValue) => {
                  setLaborRate(parseFloat(rawValue) || 0);
                }}
              />
            </div>
            <div>
              <Label>Total Mão de Obra</Label>
              <Input value={formatCurrency(laborTotal)} disabled />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="laborDescription">Descrição da Mão de Obra</Label>
            <Textarea
              id="laborDescription"
              placeholder="Ex.: Retífica de cabeçote, montagem, ajustes e testes."
              value={laborDescription}
              onChange={(e) => setLaborDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingDiagnostic && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando serviços do diagnóstico...</span>
            </div>
          )}
          <InfiniteAutocomplete
            options={servicesOptions}
            loading={loadingServices}
            label="Serviço Adicional"
            placeholder="Buscar serviço por descrição..."
            value={selectedService}
            onChange={(_, newValue) => {
              if (newValue) {
                addServiceFromCatalog(newValue as any);
              }
            }}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              const term = inputValue.toLowerCase();
              return options.filter(opt => 
                opt.description?.toLowerCase().includes(term)
              );
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <div className="flex flex-col w-full py-2">
                  <div className="font-medium text-sm">
                    {option.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency((option as any).value || 0)}
                  </div>
                </div>
              </li>
            )}
          />

          {services.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map(service => (
                  <TableRow key={service.id}>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateServiceQuantity(service.id, Math.max(1, service.quantity - 1))}
                        >
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="text"
                          value={service.quantity.toString()}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^\d]/g, '');
                            const quantity = numericValue ? parseInt(numericValue) : 1;
                            updateServiceQuantity(service.id, Math.max(1, quantity));
                          }}
                          className="w-16 sm:w-20 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
                        >
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MaskedInput
                        mask="currency"
                        value={service.unit_price.toString()}
                        onChange={(maskedValue, rawValue) => {
                          const unitPrice = parseFloat(rawValue) || 0;
                          updateServiceUnitPrice(service.id, unitPrice);
                        }}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(service.total)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Peças */}
      <Card>
        <CardHeader>
          <CardTitle>Peças e Materiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingDiagnostic && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando peças do diagnóstico...</span>
            </div>
          )}
          <InfiniteAutocomplete
            options={partsOptions}
            loading={loadingParts}
            label="Peça ou Material"
            placeholder="Buscar peça por código ou nome..."
            value={selectedPart}
            onChange={(_, newValue) => {
              if (newValue) {
                addPart(newValue as any);
              }
            }}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              const term = inputValue.toLowerCase();
              return options.filter(opt => 
                opt.part_code?.toLowerCase().includes(term) ||
                opt.part_name?.toLowerCase().includes(term)
              );
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <div className="flex flex-col w-full py-2">
                  <div className="font-medium text-sm">
                    {option.part_code} - {option.part_name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Estoque: {(option as any).quantity} | {formatCurrency((option as any).unit_cost || 0)}
                  </div>
                </div>
              </li>
            )}
          />

          {parts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map(part => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono">{part.part_code}</TableCell>
                    <TableCell>{part.part_name}</TableCell>
                    <TableCell>
                      {part.available_stock !== undefined && (
                        <Badge variant={part.available_stock >= part.quantity ? 'default' : 'destructive'}>
                          {part.available_stock}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updatePartQuantity(part.id, Math.max(1, part.quantity - 1))}
                        >
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="text"
                          value={part.quantity.toString()}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^\d]/g, '');
                            const quantity = numericValue ? parseInt(numericValue) : 1;
                            updatePartQuantity(part.id, Math.max(1, quantity));
                          }}
                          className="w-16 sm:w-20 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => updatePartQuantity(part.id, part.quantity + 1)}
                        >
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(part.unit_price)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(part.total)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePart(part.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {parts.some(p => p.available_stock !== undefined && p.available_stock < p.quantity) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atenção: Estoque insuficiente</p>
                <p className="text-yellow-700">
                  Algumas peças não possuem estoque suficiente. Será gerada uma necessidade de compra automaticamente.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totais e Condições */}
      <Card>
        <CardHeader>
          <CardTitle>Totais e Condições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Desconto (%)</Label>
              <MaskedInput
                id="discount"
                mask="decimal"
                placeholder="Ex: 10,5"
                value={discountText}
                onChange={(maskedValue, rawValue) => {
                  const numericValue = parseFloat(rawValue) || 0;
                  const limitedValue = Math.min(Math.max(numericValue, 0), 100);
                  setDiscount(limitedValue);
                  setDiscountText(maskedValue);
                }}
              />
            </div>
            <div>
              <Label htmlFor="tax">Impostos (%)</Label>
              <MaskedInput
                id="tax"
                mask="decimal"
                placeholder="Ex: 18,5"
                value={taxText}
                onChange={(maskedValue, rawValue) => {
                  const numericValue = parseFloat(rawValue) || 0;
                  const limitedValue = Math.min(Math.max(numericValue, 0), 100);
                  setTaxPercentage(limitedValue);
                  setTaxText(maskedValue);
                }}
              />
            </div>
            <div>
              <Label htmlFor="warranty">Garantia (meses)</Label>
              <Input
                id="warranty"
                type="text"
                placeholder="Ex: 12"
                value={warrantyText}
                onChange={(e) => validateAndSetInteger(e.target.value, setWarrantyMonths, setWarrantyText, 60)}
              />
            </div>
            <div>
              <Label htmlFor="delivery">Prazo de Entrega (dias)</Label>
              <Input
                id="delivery"
                type="text"
                placeholder="Ex: 30"
                value={deliveryText}
                onChange={(e) => validateAndSetInteger(e.target.value, setEstimatedDeliveryDays, setDeliveryText, 365)}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto ({discount}%):</span>
                <span className="text-red-600">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxPercentage > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impostos ({taxPercentage}%):</span>
                <span>+ {formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={saving} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {budget ? 'Atualizar Orçamento' : 'Criar Orçamento'}
        </Button>
      </div>
    </div>
  );
}

