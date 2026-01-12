import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { useAdditionalServices } from '@/hooks/useAdditionalServices';
import { BudgetFormService, type OrderOption, type PartInventory } from '@/services/BudgetFormService';
import type { DetailedBudget } from '@/hooks/useDetailedBudgets';

export interface BudgetService {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface BudgetPart {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  available_stock?: number;
}

interface UseBudgetFormProps {
  budget?: DetailedBudget;
  orderId?: string;
}

export function useBudgetForm({ budget, orderId }: UseBudgetFormProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { additionalServices, loading: loadingServices } = useAdditionalServices();

  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || budget?.order_id || '');
  const [component, setComponent] = useState<string>(budget?.component || 'bloco');
  const [componentsSelected, setComponentsSelected] = useState<string[]>(budget?.component ? [budget.component] : []);
  const [services, setServices] = useState<BudgetService[]>((budget?.services as unknown as BudgetService[]) || []);
  const [parts, setParts] = useState<BudgetPart[]>((budget?.parts as unknown as BudgetPart[]) || []);
  const [discount, setDiscount] = useState<number>(budget?.discount || 0);
  const [taxPercentage, setTaxPercentage] = useState<number>(budget?.tax_percentage || 0);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(budget?.warranty_months || 3);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState<number>(budget?.estimated_delivery_days || 15);
  const [manualTotal, setManualTotal] = useState<number | null>(null);

  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [partsInventory, setPartsInventory] = useState<PartInventory[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastLoadedOrderIdRef = useRef<string>('');
  const budgetLoadedRef = useRef<string | null>(null);
  const initialSnapshotRef = useRef<{
    services: BudgetService[];
    parts: BudgetPart[];
    discount: number;
    taxPercentage: number;
    calculatedTotal: number;
  } | null>(null);

  const servicesTotal = useMemo(() => services.reduce((sum, s) => sum + s.total, 0), [services]);
  const partsTotal = useMemo(() => parts.reduce((sum, p) => sum + p.total, 0), [parts]);
  const subtotal = servicesTotal + partsTotal;
  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * taxPercentage) / 100;
  const calculatedTotal = subtotalAfterDiscount + taxAmount;

  const totalAmount = manualTotal ?? calculatedTotal;
  const manualAdjustment = manualTotal !== null ? manualTotal - calculatedTotal : 0;

  useEffect(() => {
    const newOrderId = orderId || budget?.order_id || '';
    if (newOrderId && newOrderId !== selectedOrderId) {
      setSelectedOrderId(newOrderId);
    }
  }, [budget?.order_id, orderId, selectedOrderId]);

  useEffect(() => {
    if (budget?.id && budgetLoadedRef.current === budget.id) return;

    if (budget?.id && budget?.total_amount !== undefined && budget?.total_amount !== null && budget.total_amount > 0) {
      budgetLoadedRef.current = budget.id;

      const budgetServices = (budget.services as unknown as BudgetService[]) || [];
      const budgetParts = (budget.parts as unknown as BudgetPart[]) || [];

      const loadedServices = budgetServices.map((s) => ({
        ...s,
        total: Number(s.total) || 0,
        unit_price: Number(s.unit_price) || 0,
        quantity: Number(s.quantity) || 1,
      }));

      const loadedParts = budgetParts.map((p) => ({
        ...p,
        total: Number(p.total) || 0,
        unit_price: Number(p.unit_price) || 0,
        quantity: Number(p.quantity) || 1,
      }));

      setServices(loadedServices);
      setParts(loadedParts);

      const servicesSum = loadedServices.reduce((sum, s) => sum + s.total, 0);
      const partsSum = loadedParts.reduce((sum, p) => sum + p.total, 0);
      const sub = servicesSum + partsSum;
      const discAmt = (sub * (budget.discount || 0)) / 100;
      const subAfterDisc = sub - discAmt;
      const taxAmt = (subAfterDisc * (budget.tax_percentage || 0)) / 100;
      const calcTotal = subAfterDisc + taxAmt;

      const savedTotal = Number(budget.total_amount) || 0;

      if (Math.abs(savedTotal - calcTotal) > 0.01) {
        setManualTotal(savedTotal);
      } else {
        setManualTotal(null);
      }
    } else if (!budget?.id) {
      budgetLoadedRef.current = null;
      setManualTotal(null);
    }
  }, [budget?.id, budget?.total_amount, budget?.services, budget?.parts, budget?.discount, budget?.tax_percentage]);

  useEffect(() => {
    if (!currentOrganization?.id) return;

    let isMounted = true;

    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const orderIdToInclude = budget?.order_id || selectedOrderId;
        const data = await BudgetFormService.fetchOrders(currentOrganization.id, orderIdToInclude);
        if (isMounted) setOrders(data);
      } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        toast({ title: 'Erro', description: 'Não foi possível carregar as ordens de serviço', variant: 'destructive' });
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };

    loadOrders();
    return () => { isMounted = false; };
  }, [currentOrganization?.id, budget?.order_id, selectedOrderId, toast]);

  useEffect(() => {
    if (!currentOrganization?.id) return;

    let isMounted = true;

    const loadParts = async () => {
      setLoadingParts(true);
      try {
        const data = await BudgetFormService.fetchPartsInventory(currentOrganization.id);
        if (isMounted) setPartsInventory(data);
      } catch (error) {
        console.error('Erro ao carregar peças:', error);
      } finally {
        if (isMounted) setLoadingParts(false);
      }
    };

    loadParts();
    return () => { isMounted = false; };
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (!selectedOrderId || !currentOrganization?.id) {
      setComponentsSelected([]);
      setComponent('');
      return;
    }

    let isMounted = true;

    const loadComponents = async () => {
      try {
        const data = await BudgetFormService.fetchOrderComponents(selectedOrderId, currentOrganization.id);
        if (isMounted) {
          setComponentsSelected(data.components);
          setComponent(data.defaultComponent);
        }
      } catch (error) {
        console.error('Erro ao buscar componentes:', error);
        toast({ title: 'Aviso', description: 'Não foi possível carregar os componentes da ordem.', variant: 'default' });
      }
    };

    loadComponents();
    return () => { isMounted = false; };
  }, [selectedOrderId, currentOrganization?.id, toast]);

  useEffect(() => {
    if (!selectedOrderId || !currentOrganization?.id || budget?.id) return;
    if (selectedOrderId === lastLoadedOrderIdRef.current) return;

    let isMounted = true;
    lastLoadedOrderIdRef.current = selectedOrderId;

    const loadDiagnostic = async () => {
      setLoadingDiagnostic(true);
      try {
        const data = await BudgetFormService.fetchDiagnosticData(selectedOrderId, currentOrganization.id);
        if (!isMounted) return;

        const loadedParts = data.parts as BudgetPart[];
        const loadedServices = data.services as BudgetService[];

        if (loadedParts.length > 0) {
          setParts(loadedParts);
          toast({ title: 'Peças carregadas', description: `${loadedParts.length} peça(s) do diagnóstico foram adicionadas` });
        }

        if (loadedServices.length > 0) {
          setServices(loadedServices);
          toast({ title: 'Serviços carregados', description: `${loadedServices.length} serviço(s) do diagnóstico foram adicionados` });
        }

        if (loadedParts.length > 0 || loadedServices.length > 0) {
          setTimeout(() => {
            const servicesSum = loadedServices.reduce((sum, s) => sum + s.total, 0);
            const partsSum = loadedParts.reduce((sum, p) => sum + p.total, 0);
            const sub = servicesSum + partsSum;
            const discAmt = (sub * discount) / 100;
            const subAfterDisc = sub - discAmt;
            const taxAmt = (subAfterDisc * taxPercentage) / 100;
            const calcTotal = subAfterDisc + taxAmt;

            initialSnapshotRef.current = {
              services: JSON.parse(JSON.stringify(loadedServices)),
              parts: JSON.parse(JSON.stringify(loadedParts)),
              discount,
              taxPercentage,
              calculatedTotal: calcTotal,
            };
          }, 100);
        }
      } catch (error) {
        console.error('Erro ao carregar diagnóstico:', error);
        toast({ title: 'Erro', description: 'Não foi possível carregar dados do diagnóstico', variant: 'destructive' });
      } finally {
        if (isMounted) setLoadingDiagnostic(false);
      }
    };

    loadDiagnostic();
    return () => { isMounted = false; };
  }, [selectedOrderId, currentOrganization?.id, budget?.id, discount, taxPercentage, toast]);

  useEffect(() => {
    if (!initialSnapshotRef.current) return;
    if (budget?.id) return;

    const currentServicesCount = services.length;
    const currentPartsCount = parts.length;
    const snapshotServicesCount = initialSnapshotRef.current.services.length;
    const snapshotPartsCount = initialSnapshotRef.current.parts.length;

    if (currentServicesCount > snapshotServicesCount || currentPartsCount > snapshotPartsCount) {
      const servicesSum = services.reduce((sum, s) => sum + s.total, 0);
      const partsSum = parts.reduce((sum, p) => sum + p.total, 0);
      const sub = servicesSum + partsSum;
      const discAmt = (sub * discount) / 100;
      const subAfterDisc = sub - discAmt;
      const taxAmt = (subAfterDisc * taxPercentage) / 100;
      const calcTotal = subAfterDisc + taxAmt;

      initialSnapshotRef.current = {
        services: JSON.parse(JSON.stringify(services)),
        parts: JSON.parse(JSON.stringify(parts)),
        discount,
        taxPercentage,
        calculatedTotal: calcTotal,
      };
    }
  }, [services.length, parts.length, budget?.id, discount, taxPercentage, services, parts]);

  const distributeValueChange = useCallback(
    (newTotalValue: number): { services: BudgetService[]; parts: BudgetPart[] } => {
      const currentCalculatedTotal = subtotal - discountAmount + taxAmount;
      const difference = newTotalValue - currentCalculatedTotal;

      if (Math.abs(difference) <= 0.01) {
        return { services, parts };
      }

      const combinedTotal = servicesTotal + partsTotal;

      if (combinedTotal <= 0) {
        const totalItems = services.length + parts.length;
        if (totalItems === 0) return { services, parts };

        const equalShare = difference / totalItems;

        return {
          services: services.map((s) => ({
            ...s,
            total: Math.max(0, s.total + equalShare),
            unit_price: Math.max(0, (s.total + equalShare) / (s.quantity || 1)),
          })),
          parts: parts.map((p) => ({
            ...p,
            total: Math.max(0, p.total + equalShare),
            unit_price: Math.max(0, (p.total + equalShare) / (p.quantity || 1)),
          })),
        };
      }

      return {
        services: services.map((s) => {
          const proportion = s.total / combinedTotal;
          const newTotal = s.total + difference * proportion;
          return {
            ...s,
            total: Math.max(0, newTotal),
            unit_price: Math.max(0, newTotal / (s.quantity || 1)),
          };
        }),
        parts: parts.map((p) => {
          const proportion = p.total / combinedTotal;
          const newTotal = p.total + difference * proportion;
          return {
            ...p,
            total: Math.max(0, newTotal),
            unit_price: Math.max(0, newTotal / (p.quantity || 1)),
          };
        }),
      };
    },
    [services, parts, servicesTotal, partsTotal, subtotal, discountAmount, taxAmount]
  );

  const addServiceFromCatalog = useCallback(
    (catalogService: { id: string; description: string; value: number }) => {
      const existing = services.find((s) => s.description === catalogService.description);
      if (existing) {
        toast({ title: 'Atenção', description: 'Este serviço já foi adicionado', variant: 'destructive' });
        return;
      }

      const service: BudgetService = {
        id: `catalog-${Date.now()}`,
        description: catalogService.description,
        quantity: 1,
        unit_price: catalogService.value || 0,
        total: catalogService.value || 0,
      };

      setServices((prev) => [...prev, service]);
    },
    [services, toast]
  );

  const updateServiceQuantity = useCallback((id: string, quantity: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, quantity, total: quantity * s.unit_price } : s))
    );
  }, []);

  const updateServiceUnitPrice = useCallback((id: string, unitPrice: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, unit_price: unitPrice, total: s.quantity * unitPrice } : s))
    );
  }, []);

  const removeService = useCallback((id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addPart = useCallback(
    (partInventory: { part_code: string; part_name: string; unit_cost: number; quantity: number }) => {
      const existing = parts.find((p) => p.part_code === partInventory.part_code);
      if (existing) {
        toast({ title: 'Atenção', description: 'Esta peça já foi adicionada', variant: 'destructive' });
        return;
      }

      const part: BudgetPart = {
        id: Date.now().toString(),
        part_code: partInventory.part_code,
        part_name: partInventory.part_name,
        quantity: 1,
        unit_price: partInventory.unit_cost || 0,
        total: partInventory.unit_cost || 0,
        available_stock: partInventory.quantity,
      };

      setParts((prev) => [...prev, part]);
    },
    [parts, toast]
  );

  const updatePartQuantity = useCallback((id: string, quantity: number) => {
    setParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity, total: quantity * p.unit_price } : p))
    );
  }, []);

  const removePart = useCallback((id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setManualTotalWithDistribution = useCallback(
    (value: number | null) => {
      if (value !== null && Math.abs(value - calculatedTotal) > 0.01) {
        setManualTotal(value);
        const { services: updatedServices, parts: updatedParts } = distributeValueChange(value);
        setServices(updatedServices);
        setParts(updatedParts);
      } else {
        setManualTotal(null);
      }
    },
    [calculatedTotal, distributeValueChange]
  );

  const clearManualTotal = useCallback(() => {
    setManualTotal(null);
  }, []);

  const getOriginalTotal = useCallback((): number => {
    if (budget?.original_total_amount) {
      return budget.original_total_amount;
    } else if (budget?.id && budget?.total_amount) {
      return budget.total_amount;
    } else if (initialSnapshotRef.current) {
      return initialSnapshotRef.current.calculatedTotal;
    } else {
      return calculatedTotal;
    }
  }, [budget, calculatedTotal]);

  const originalTotal = getOriginalTotal();
  const hasOriginalTotal = (budget?.original_total_amount || initialSnapshotRef.current) && manualTotal !== null;
  const originalDifference = hasOriginalTotal ? (manualTotal ?? calculatedTotal) - originalTotal : 0;

  const validateForm = useCallback((): string | null => {
    if (!selectedOrderId) return 'Selecione uma ordem de serviço';
    if (componentsSelected.length === 0) return 'A ordem de serviço selecionada não possui componentes.';
    if (services.length === 0 && parts.length === 0) return 'Adicione pelo menos um serviço ou peça';
    return null;
  }, [selectedOrderId, componentsSelected, services, parts]);

  const getBudgetData = useCallback((): Partial<DetailedBudget> => {
    const finalTotalAmount = manualTotal ?? totalAmount;
    
    let originalTotal: number;
    
    if (budget?.original_total_amount) {
      originalTotal = budget.original_total_amount;
    } else if (budget?.id && budget?.total_amount) {
      originalTotal = budget.total_amount;
    } else if (initialSnapshotRef.current) {
      originalTotal = initialSnapshotRef.current.calculatedTotal;
    } else {
      originalTotal = calculatedTotal;
    }

    const hasManualAdjustment = manualTotal !== null && Math.abs(manualTotal - calculatedTotal) > 0.01;

    return {
      order_id: selectedOrderId,
      component: component as 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote',
      services: services as unknown as Record<string, unknown>[],
      parts: parts as unknown as Record<string, unknown>[],
      parts_total: partsTotal,
      discount,
      tax_percentage: taxPercentage,
      tax_amount: taxAmount,
      total_amount: finalTotalAmount,
      original_total_amount: hasManualAdjustment && !budget?.original_total_amount ? originalTotal : originalTotal,
      warranty_months: warrantyMonths,
      estimated_delivery_days: estimatedDeliveryDays,
      status: budget?.status === 'reopened' ? 'reopened' : 'draft',
    };
  }, [
    selectedOrderId,
    component,
    services,
    parts,
    partsTotal,
    discount,
    taxPercentage,
    taxAmount,
    totalAmount,
    manualTotal,
    calculatedTotal,
    warrantyMonths,
    estimatedDeliveryDays,
    budget,
  ]);

  const servicesOptions = useMemo(
    () =>
      (additionalServices as Array<{ id: string; description: string; value: number; is_active?: boolean }>)
        .filter((s) => s.is_active)
        .map((s) => ({
          id: s.id,
          label: s.description,
          description: s.description,
          value: s.value,
        })),
    [additionalServices]
  );

  const partsOptions = useMemo(
    () =>
      partsInventory.map((p) => ({
        id: p.id,
        label: `${p.part_code} - ${p.part_name}`,
        part_code: p.part_code,
        part_name: p.part_name,
        unit_cost: p.unit_cost,
        quantity: p.quantity,
      })),
    [partsInventory]
  );

  return {
    selectedOrderId,
    setSelectedOrderId,
    component,
    setComponent,
    componentsSelected,
    services,
    parts,
    discount,
    setDiscount,
    taxPercentage,
    setTaxPercentage,
    warrantyMonths,
    setWarrantyMonths,
    estimatedDeliveryDays,
    setEstimatedDeliveryDays,
    manualTotal,
    setManualTotalWithDistribution,
    clearManualTotal,

    orders,
    loadingOrders,
    loadingParts,
    loadingDiagnostic,
    loadingServices,
    saving,
    setSaving,

    servicesTotal,
    partsTotal,
    subtotal,
    discountAmount,
    taxAmount,
    calculatedTotal,
    totalAmount,
    manualAdjustment,
    originalTotal,
    hasOriginalTotal,
    originalDifference,

    servicesOptions,
    partsOptions,

    addServiceFromCatalog,
    updateServiceQuantity,
    updateServiceUnitPrice,
    removeService,
    addPart,
    updatePartQuantity,
    removePart,
    validateForm,
    getBudgetData,
    
    isEditing: !!budget?.id,
    hasOrderLocked: !!orderId || (!!budget && !!budget.order_id && !!budget.id),
  };
}

