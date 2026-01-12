import { supabase } from '@/integrations/supabase/client';
import { DiagnosticService as DiagnosticServiceClass } from '@/services/DiagnosticService';

export interface OrderOption {
  id: string;
  order_number: string;
  customer_name: string;
}

export interface PartInventory {
  id: string;
  part_code: string;
  part_name: string;
  unit_cost: number;
  quantity: number;
}

export interface OrderComponents {
  components: string[];
  defaultComponent: string;
}

export interface DiagnosticPart {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  available_stock: number;
}

export interface DiagnosticService {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface DiagnosticData {
  parts: DiagnosticPart[];
  services: DiagnosticService[];
}

export const BudgetFormService = {
  async fetchOrders(orgId: string, includeOrderId?: string): Promise<OrderOption[]> {
    const { data: activeOrders, error: activeError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_id,
        customers!inner(name),
        diagnostic_checklist_responses!inner(id)
      `)
      .eq('org_id', orgId)
      .eq('status', 'ativa')
      .order('created_at', { ascending: false });

    if (activeError) throw activeError;

    let allOrders = activeOrders || [];

    if (includeOrderId && !allOrders.find((o) => o.id === includeOrderId)) {
      const { data: specificOrder, error: specificError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          customers!inner(name),
          diagnostic_checklist_responses!inner(id)
        `)
        .eq('id', includeOrderId)
        .eq('org_id', orgId)
        .single();

      if (!specificError && specificOrder) {
        allOrders = [specificOrder, ...allOrders];
      }
    }

    return allOrders.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: (order.customers as { name: string } | undefined)?.name || 'Cliente não informado',
    }));
  },

  async fetchPartsInventory(orgId: string): Promise<PartInventory[]> {
    const { data, error } = await supabase
      .from('parts_inventory')
      .select('id, part_code, part_name, unit_cost, quantity')
      .eq('org_id', orgId)
      .order('part_name');

    if (error) throw error;

    return (data || []).map((p) => ({
      id: p.id,
      part_code: p.part_code,
      part_name: p.part_name,
      unit_cost: p.unit_cost || 0,
      quantity: p.quantity || 0,
    }));
  },

  async fetchOrderComponents(orderId: string, orgId: string): Promise<OrderComponents> {
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
      .eq('id', orderId)
      .eq('org_id', orgId)
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
      return { components: [], defaultComponent: '' };
    }

    const components: string[] = [];

    if (engineTyped.has_block) components.push('bloco');
    if (engineTyped.has_head) components.push('cabecote');
    if (engineTyped.has_crankshaft) components.push('virabrequim');
    if (engineTyped.has_piston) components.push('pistao');
    if (engineTyped.has_connecting_rod) components.push('biela');

    if (engineTyped.reception_form_data?.selectedComponents) {
      engineTyped.reception_form_data.selectedComponents.forEach((comp: string) => {
        if (!components.includes(comp)) {
          components.push(comp);
        }
      });
    }

    return {
      components,
      defaultComponent: components[0] || '',
    };
  },

  async fetchDiagnosticData(orderId: string, orgId: string): Promise<DiagnosticData> {
    const diagnosticResponses = await DiagnosticServiceClass.getDiagnosticDataForBudget(orderId, orgId);

    if (!diagnosticResponses || diagnosticResponses.length === 0) {
      return { parts: [], services: [] };
    }

    const allParts: Array<Record<string, unknown>> = [];
    const allServices: Array<Record<string, unknown>> = [];
    const allGeneratedServices: Array<Record<string, unknown>> = [];

    diagnosticResponses.forEach((response: Record<string, unknown>) => {
      const diagnosticParts = (response.additional_parts as Array<Record<string, unknown>>) || [];
      const diagnosticServices = (response.additional_services as Array<Record<string, unknown>>) || [];
      const generatedServices = (response.generated_services as Array<Record<string, unknown>>) || [];

      allParts.push(...diagnosticParts);
      allServices.push(...diagnosticServices);
      allGeneratedServices.push(...generatedServices);
    });

    const loadedParts: DiagnosticPart[] = [];
    const loadedServices: DiagnosticService[] = [];

    if (allParts.length > 0) {
      const partCodes = allParts.map((p) => String(p.part_code || ''));
      const { data: inventoryData } = await supabase
        .from('parts_inventory')
        .select('part_code, quantity')
        .eq('org_id', orgId)
        .in('part_code', partCodes);

      const inventoryMap = new Map(
        (inventoryData || []).map((inv) => [inv.part_code, Number(inv.quantity) || 0])
      );

      allParts.forEach((part: Record<string, unknown>) => {
        const quantity = Number(part.quantity) || 1;
        const unitPrice = Number(part.unit_price) || 0;
        const total = Number(part.total) || quantity * unitPrice;

        loadedParts.push({
          id: (part.id as string) || `part_${Date.now()}_${Math.random()}`,
          part_code: String(part.part_code || ''),
          part_name: String(part.part_name || ''),
          quantity,
          unit_price: unitPrice,
          total,
          available_stock: inventoryMap.get(String(part.part_code)) || 0,
        });
      });
    }

    if (allServices.length > 0) {
      allServices.forEach((service: Record<string, unknown>) => {
        const serviceName = service.name || service.description || 'Serviço do diagnóstico';
        const quantity = Number(service.quantity) || 1;
        const unitPrice = Number(service.unit_price) || 0;
        const total = Number(service.total) || quantity * unitPrice;

        loadedServices.push({
          id: (service.id as string) || `service_${Date.now()}_${Math.random()}`,
          description: String(serviceName),
          quantity,
          unit_price: unitPrice,
          total,
        });
      });
    }

    if (allGeneratedServices.length > 0) {
      allGeneratedServices.forEach((service: Record<string, unknown>, index: number) => {
        const serviceName = service.name || service.description || 'Serviço do diagnóstico';
        const serviceTotal = ((service.labor_hours as number) || 1) * ((service.labor_rate as number) || 50);

        loadedServices.push({
          id: `generated_service_${Date.now()}_${index}`,
          description: String(serviceName),
          quantity: 1,
          unit_price: serviceTotal,
          total: serviceTotal,
        });
      });
    }

    return { parts: loadedParts, services: loadedServices };
  },
};

