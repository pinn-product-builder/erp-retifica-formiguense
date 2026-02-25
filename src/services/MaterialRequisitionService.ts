import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface MaterialRequisitionItem {
  id?: string;
  part_id?: string;
  part_code: string;
  part_name: string;
  quantity_required: number;
  quantity_available: number;
  quantity_reserved: number;
  quantity_to_purchase: number;
  status: 'disponivel' | 'reservado' | 'compra_pendente' | 'aguardando' | 'recebido' | 'pendente';
  expected_delivery_date?: string;
  purchase_order_id?: string;
  purchase_need_id?: string;
  notes?: string;
  created_at?: string;
}

export interface MaterialRequisition {
  id: string;
  org_id: string;
  requisition_number: string;
  service_order_id?: string;
  service_order_number?: string;
  requested_by: string;
  requested_date: string;
  required_date: string;
  status: 'pendente' | 'parcialmente_atendida' | 'atendida' | 'cancelada';
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: MaterialRequisitionItem[];
}

export interface CreateMaterialRequisitionInput {
  service_order_id?: string;
  service_order_number?: string;
  required_date: string;
  notes?: string;
  items: Omit<MaterialRequisitionItem, 'id' | 'created_at'>[];
}

export interface PartAvailability {
  part_id: string;
  part_code: string;
  part_name: string;
  quantity_available: number;
  quantity_reserved: number;
}

class MaterialRequisitionService {
  async listRequisitions(orgId: string): Promise<MaterialRequisition[]> {
    const { data, error } = await db
      .from('material_requisitions')
      .select('*, items:material_requisition_items(*)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as MaterialRequisition[]) ?? [];
  }

  async getRequisition(id: string): Promise<MaterialRequisition | null> {
    const { data, error } = await db
      .from('material_requisitions')
      .select('*, items:material_requisition_items(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as MaterialRequisition;
  }

  async checkPartsAvailability(
    orgId: string,
    partIds: string[]
  ): Promise<Record<string, PartAvailability>> {
    if (partIds.length === 0) return {};

    const { data, error } = await supabase
      .from('parts_inventory')
      .select('id, part_code, part_name, quantity')
      .eq('org_id', orgId)
      .in('id', partIds);

    if (error) throw error;

    const result: Record<string, PartAvailability> = {};
    for (const part of (data ?? [])) {
      result[part.id] = {
        part_id: part.id,
        part_code: part.part_code,
        part_name: part.part_name,
        quantity_available: part.quantity ?? 0,
        quantity_reserved: 0,
      };
    }
    return result;
  }

  async create(
    orgId: string,
    userId: string,
    input: CreateMaterialRequisitionInput
  ): Promise<MaterialRequisition> {
    const { data: req, error: reqErr } = await db
      .from('material_requisitions')
      .insert({
        org_id: orgId,
        requisition_number: '',
        service_order_id: input.service_order_id ?? null,
        service_order_number: input.service_order_number ?? null,
        requested_by: userId,
        requested_date: new Date().toISOString().split('T')[0],
        required_date: input.required_date,
        status: 'pendente',
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (reqErr) throw reqErr;

    if (input.items.length > 0) {
      const rows = input.items.map((item) => ({
        requisition_id: req.id,
        part_id: item.part_id ?? null,
        part_code: item.part_code,
        part_name: item.part_name,
        quantity_required: item.quantity_required,
        quantity_available: item.quantity_available,
        quantity_reserved: item.quantity_reserved,
        quantity_to_purchase: item.quantity_to_purchase,
        status: item.status,
        notes: item.notes ?? null,
      }));

      const { error: itemsErr } = await db
        .from('material_requisition_items')
        .insert(rows);

      if (itemsErr) throw itemsErr;
    }

    return this.getRequisition(req.id) as Promise<MaterialRequisition>;
  }

  async generatePurchaseNeeds(
    orgId: string,
    _userId: string,
    requisitionId: string,
    items: MaterialRequisitionItem[]
  ): Promise<number> {
    const itemsToOrder = items.filter((i) => i.quantity_to_purchase > 0);
    if (itemsToOrder.length === 0) return 0;

    let created = 0;

    for (const item of itemsToOrder) {
      const { data: existing } = await supabase
        .from('purchase_needs')
        .select('id')
        .eq('org_id', orgId)
        .eq('part_code', item.part_code)
        .in('status', ['pending', 'in_quotation', 'ordered'])
        .maybeSingle();

      if (!existing) {
        const { data: insertedNeed, error } = await supabase
          .from('purchase_needs')
          .insert({
            org_id: orgId,
            part_code: item.part_code,
            part_name: item.part_name,
            part_id: item.part_id ?? null,
            required_quantity: Math.ceil(item.quantity_to_purchase),
            available_quantity: Math.floor(item.quantity_available),
            shortage_quantity: Math.ceil(item.quantity_to_purchase),
            priority_level: 'medium',
            need_type: 'project_requirement',
            related_orders: [requisitionId],
            suggested_suppliers: [],
            estimated_cost: 0,
            status: 'pending',
          })
          .select('id')
          .single();

        if (!error && insertedNeed) {
          await db
            .from('material_requisition_items')
            .update({
              purchase_need_id: insertedNeed.id,
              status: 'compra_pendente',
            })
            .eq('requisition_id', requisitionId)
            .eq('part_code', item.part_code);
          created++;
        }
      } else {
        await db
          .from('material_requisition_items')
          .update({
            purchase_need_id: existing.id,
            status: 'compra_pendente',
          })
          .eq('requisition_id', requisitionId)
          .eq('part_code', item.part_code);
      }
    }

    return created;
  }

  async updateStatus(
    id: string,
    status: MaterialRequisition['status']
  ): Promise<void> {
    const { error } = await db
      .from('material_requisitions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}

export const materialRequisitionService = new MaterialRequisitionService();
