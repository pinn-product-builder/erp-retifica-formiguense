import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// ─── Schema Zod ──────────────────────────────────────────────────────────────
export const supplierProductSchema = z.object({
  part_id:          z.string().uuid().optional(),
  part_code:        z.string().min(1, 'Código da peça é obrigatório'),
  part_name:        z.string().min(2, 'Nome da peça é obrigatório'),
  supplier_code:    z.string().min(1, 'Código do fornecedor é obrigatório'),
  description:      z.string().optional(),
  unit_price:       z.number().min(0, 'Preço deve ser ≥ 0'),
  minimum_quantity: z.number().positive().optional(),
  lead_time_days:   z.number().int().min(0).optional(),
  is_preferred:     z.boolean().default(false),
  valid_from:       z.string().optional(),
  valid_until:      z.string().optional(),
  is_active:        z.boolean().default(true),
  notes:            z.string().optional(),
});

export type SupplierProductFormData = z.infer<typeof supplierProductSchema>;

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface SupplierProduct {
  id: string;
  supplier_id: string;
  org_id: string;
  part_id?: string;
  part_code: string;
  part_name: string;
  supplier_code: string;
  description?: string;
  unit_price: number;
  minimum_quantity?: number;
  lead_time_days?: number;
  is_preferred: boolean;
  last_purchase_price?: number;
  last_purchase_date?: string;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ValidSupplierPrice extends SupplierProduct {
  supplier_name: string;
  supplier_trade_name?: string;
  supplier_overall_rating?: number;
  supplier_delivery_performance?: number;
  supplier_is_active: boolean;
  supplier_blocked: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────
export const SupplierProductService = {
  async getBySupplier(supplierId: string): Promise<SupplierProduct[]> {
    const { data, error } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('part_name');

    if (error) throw error;
    return (data ?? []) as SupplierProduct[];
  },

  async getSuppliersForPart(
    partCode: string,
    orgId: string
  ): Promise<ValidSupplierPrice[]> {
    const { data, error } = await supabase
      .from('valid_supplier_prices')
      .select('*')
      .eq('part_code', partCode)
      .eq('org_id', orgId)
      .order('is_preferred', { ascending: false })
      .order('unit_price',   { ascending: true });

    if (error) throw error;
    return (data ?? []) as ValidSupplierPrice[];
  },

  async create(
    supplierId: string,
    orgId: string,
    formData: SupplierProductFormData
  ): Promise<SupplierProduct> {
    const { data, error } = await supabase
      .from('supplier_products')
      .insert({
        supplier_id:      supplierId,
        org_id:           orgId,
        part_id:          formData.part_id          || null,
        part_code:        formData.part_code.toUpperCase().trim(),
        part_name:        formData.part_name.trim(),
        supplier_code:    formData.supplier_code.trim(),
        description:      formData.description || null,
        unit_price:       formData.unit_price,
        minimum_quantity: formData.minimum_quantity ?? null,
        lead_time_days:   formData.lead_time_days   ?? null,
        is_preferred:     formData.is_preferred,
        valid_from:       formData.valid_from  || null,
        valid_until:      formData.valid_until || null,
        is_active:        formData.is_active,
        notes:            formData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as SupplierProduct;
  },

  async update(
    id: string,
    formData: Partial<SupplierProductFormData>
  ): Promise<SupplierProduct> {
    const updates: Record<string, unknown> = {};
    if (formData.part_id        !== undefined) updates.part_id        = formData.part_id || null;
    if (formData.part_code      !== undefined) updates.part_code      = formData.part_code.toUpperCase().trim();
    if (formData.part_name      !== undefined) updates.part_name      = formData.part_name.trim();
    if (formData.supplier_code  !== undefined) updates.supplier_code  = formData.supplier_code.trim();
    if (formData.description    !== undefined) updates.description    = formData.description || null;
    if (formData.unit_price     !== undefined) updates.unit_price     = formData.unit_price;
    if (formData.minimum_quantity !== undefined) updates.minimum_quantity = formData.minimum_quantity ?? null;
    if (formData.lead_time_days !== undefined) updates.lead_time_days = formData.lead_time_days ?? null;
    if (formData.is_preferred   !== undefined) updates.is_preferred   = formData.is_preferred;
    if (formData.valid_from     !== undefined) updates.valid_from     = formData.valid_from || null;
    if (formData.valid_until    !== undefined) updates.valid_until    = formData.valid_until || null;
    if (formData.is_active      !== undefined) updates.is_active      = formData.is_active;
    if (formData.notes          !== undefined) updates.notes          = formData.notes || null;

    const { data, error } = await supabase
      .from('supplier_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SupplierProduct;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('supplier_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Marca um fornecedor como preferencial para uma determinada peça.
   * Remove o flag de todos os outros fornecedores que oferecem a mesma peça.
   */
  async setPreferred(
    supplierId: string,
    partCode: string,
    orgId: string
  ): Promise<void> {
    // Remove preferencial dos outros
    const { error: clearError } = await supabase
      .from('supplier_products')
      .update({ is_preferred: false })
      .eq('part_code', partCode)
      .eq('org_id', orgId)
      .neq('supplier_id', supplierId);

    if (clearError) throw clearError;

    // Marca este como preferencial
    const { error: setError } = await supabase
      .from('supplier_products')
      .update({ is_preferred: true })
      .eq('supplier_id', supplierId)
      .eq('part_code', partCode);

    if (setError) throw setError;
  },

  isPriceValid(product: SupplierProduct): boolean {
    const now = new Date();
    if (product.valid_from && new Date(product.valid_from) > now) return false;
    if (product.valid_until && new Date(product.valid_until) < now) return false;
    return true;
  },

  formatPrice(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },
};
