import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// ─── Categorias padrão ───────────────────────────────────────────────────────
export const SUPPLIER_CATEGORIES = [
  { value: 'pecas_motor',   label: 'Peças de Motor' },
  { value: 'rolamentos',    label: 'Rolamentos' },
  { value: 'retentores',    label: 'Retentores' },
  { value: 'juntas',        label: 'Juntas e Vedações' },
  { value: 'ferramentas',   label: 'Ferramentas' },
  { value: 'consumiveis',   label: 'Consumíveis' },
  { value: 'embalagens',    label: 'Embalagens' },
  { value: 'servicos',      label: 'Serviços' },
  { value: 'logistica',     label: 'Logística e Transporte' },
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  { value: '0',   label: 'À vista' },
  { value: '7',   label: '7 dias' },
  { value: '15',  label: '15 dias' },
  { value: '30',  label: '30 dias' },
  { value: '45',  label: '45 dias' },
  { value: '60',  label: '60 dias' },
  { value: '90',  label: '90 dias' },
];

export const PAYMENT_METHODS_OPTIONS = [
  { value: 'boleto',         label: 'Boleto' },
  { value: 'pix',            label: 'PIX' },
  { value: 'transferencia',  label: 'Transferência' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'cartao_debito',  label: 'Cartão de Débito' },
  { value: 'cheque',         label: 'Cheque' },
  { value: 'dinheiro',       label: 'Dinheiro' },
];

// ─── Validação de CNPJ ───────────────────────────────────────────────────────
export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1+$/.test(clean)) return false;

  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(clean[12]) !== d1) return false;

  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(clean[13]) === d2;
}

// ─── Schema Zod ──────────────────────────────────────────────────────────────
const addressSchema = z.object({
  street:       z.string().min(3, 'Endereço é obrigatório'),
  number:       z.string().min(1, 'Número é obrigatório'),
  complement:   z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city:         z.string().min(2, 'Cidade é obrigatória'),
  state:        z.string().length(2, 'UF deve ter 2 caracteres'),
  postal_code:  z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
}).optional();

export const supplierSchema = z.object({
  trade_name:              z.string().min(3, 'Nome fantasia é obrigatório'),
  legal_name:              z.string().min(3, 'Razão social é obrigatória'),
  document:                z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .refine(v => validateCNPJ(v.replace(/\D/g, '')), 'CNPJ inválido'),
  state_registration:      z.string().optional(),
  municipal_registration:  z.string().optional(),
  email:                   z.string().email('Email inválido').optional().or(z.literal('')),
  phone:                   z.string().min(10, 'Telefone inválido').max(15),
  whatsapp:                z.string().optional(),
  website:                 z.string().url('URL inválida').optional().or(z.literal('')),
  contact_person:          z.string().optional(),
  address_jsonb:           addressSchema,
  payment_terms:           z.string().optional(),
  payment_methods:         z.array(z.string()).min(1, 'Selecione ao menos um método'),
  credit_limit:            z.number().min(0).optional(),
  discount_percentage:     z.number().min(0).max(100).optional(),
  categories:              z.array(z.string()).min(1, 'Selecione ao menos uma categoria'),
  delivery_days:           z.number().int().min(0).optional(),
  is_active:               z.boolean().default(true),
  notes:                   z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  org_id: string;
  code: string;
  name: string;
  trade_name?: string;
  legal_name?: string;
  document?: string;
  cnpj?: string;
  state_registration?: string;
  municipal_registration?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  contact_person?: string;
  address?: string;
  address_jsonb?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
  };
  payment_terms?: string;
  payment_methods?: string[];
  credit_limit?: number;
  discount_percentage?: number;
  categories?: string[];
  brands?: string[];
  delivery_days: number;
  delivery_performance?: number;
  quality_rating?: number;
  price_rating?: number;
  service_rating?: number;
  overall_rating?: number;
  rating: number;
  on_time_delivery_rate?: number;
  total_orders?: number;
  is_active: boolean;
  is_preferred?: boolean;
  blocked?: boolean;
  blocked_reason?: string;
  blocked_at?: string;
  notes?: string;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  isBlocked?: boolean;
}

export interface PaginatedSuppliers {
  data: Supplier[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────
export const SupplierService = {
  async getSuppliers(
    orgId: string,
    filters: SupplierFilters = {},
    page = 1,
    pageSize = 10
  ): Promise<PaginatedSuppliers> {
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('trade_name', { ascending: true });

    if (filters.search) {
      query = query.or(
        `trade_name.ilike.%${filters.search}%,legal_name.ilike.%${filters.search}%,name.ilike.%${filters.search}%,document.ilike.%${filters.search}%,code.ilike.%${filters.search}%`
      );
    }
    if (filters.category) {
      query = query.contains('categories', [filters.category]);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.isBlocked !== undefined) {
      query = query.eq('blocked', filters.isBlocked);
    }

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data ?? []) as Supplier[],
      count: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  async getSupplierById(id: string, orgId: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) throw error;
    return data as Supplier | null;
  },

  async getAllActive(orgId: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, trade_name, code, rating, overall_rating, categories, delivery_days, is_preferred')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .eq('blocked', false)
      .order('trade_name');

    if (error) throw error;
    return (data ?? []) as Supplier[];
  },

  async checkDuplicateCNPJ(
    document: string,
    orgId: string,
    excludeId?: string
  ): Promise<boolean> {
    const clean = document.replace(/\D/g, '');
    let query = supabase
      .from('suppliers')
      .select('id')
      .eq('org_id', orgId)
      .eq('document', clean);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query.limit(1);
    return (data ?? []).length > 0;
  },

  async createSupplier(
    formData: SupplierFormData,
    orgId: string,
    createdBy?: string
  ): Promise<Supplier> {
    const cleanDoc = formData.document.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        org_id:                 orgId,
        name:                   formData.trade_name,
        trade_name:             formData.trade_name,
        legal_name:             formData.legal_name,
        document:               cleanDoc,
        cnpj:                   cleanDoc,
        state_registration:     formData.state_registration,
        municipal_registration: formData.municipal_registration,
        email:                  formData.email || null,
        phone:                  formData.phone,
        whatsapp:               formData.whatsapp || null,
        website:                formData.website || null,
        contact_person:         formData.contact_person || null,
        address_jsonb:          formData.address_jsonb || null,
        payment_terms:          formData.payment_terms || null,
        payment_methods:        formData.payment_methods,
        credit_limit:           formData.credit_limit ?? null,
        discount_percentage:    formData.discount_percentage ?? null,
        categories:             formData.categories,
        delivery_days:          formData.delivery_days ?? 0,
        is_active:              formData.is_active,
        notes:                  formData.notes || null,
        created_by:             createdBy ?? null,
        rating:                 5.0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Supplier;
  },

  async updateSupplier(
    id: string,
    orgId: string,
    formData: Partial<SupplierFormData>
  ): Promise<Supplier> {
    const updates: Record<string, unknown> = {};

    if (formData.trade_name   !== undefined) { updates.trade_name = formData.trade_name; updates.name = formData.trade_name; }
    if (formData.legal_name   !== undefined) updates.legal_name   = formData.legal_name;
    if (formData.document     !== undefined) {
      const clean = formData.document.replace(/\D/g, '');
      updates.document = clean;
      updates.cnpj     = clean;
    }
    if (formData.state_registration     !== undefined) updates.state_registration     = formData.state_registration;
    if (formData.municipal_registration !== undefined) updates.municipal_registration = formData.municipal_registration;
    if (formData.email        !== undefined) updates.email        = formData.email || null;
    if (formData.phone        !== undefined) updates.phone        = formData.phone;
    if (formData.whatsapp     !== undefined) updates.whatsapp     = formData.whatsapp || null;
    if (formData.website      !== undefined) updates.website      = formData.website || null;
    if (formData.contact_person !== undefined) updates.contact_person = formData.contact_person || null;
    if (formData.address_jsonb  !== undefined) updates.address_jsonb  = formData.address_jsonb || null;
    if (formData.payment_terms  !== undefined) updates.payment_terms  = formData.payment_terms || null;
    if (formData.payment_methods !== undefined) updates.payment_methods = formData.payment_methods;
    if (formData.credit_limit   !== undefined) updates.credit_limit   = formData.credit_limit ?? null;
    if (formData.discount_percentage !== undefined) updates.discount_percentage = formData.discount_percentage ?? null;
    if (formData.categories    !== undefined) updates.categories    = formData.categories;
    if (formData.delivery_days !== undefined) updates.delivery_days = formData.delivery_days ?? 0;
    if (formData.is_active     !== undefined) updates.is_active     = formData.is_active;
    if (formData.notes         !== undefined) updates.notes         = formData.notes || null;

    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as Supplier;
  },

  async toggleActive(id: string, orgId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  },

  async blockSupplier(id: string, orgId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({
        blocked:        true,
        blocked_reason: reason,
        blocked_at:     new Date().toISOString(),
        is_active:      false,
      })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  },

  async unblockSupplier(id: string, orgId: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({
        blocked:        false,
        blocked_reason: null,
        blocked_at:     null,
        is_active:      true,
      })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
  },

  async getPurchaseHistory(supplierId: string, orgId: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_number, order_date, status, total_value,
        items:purchase_order_items(id, item_name, quantity, unit_price, total_price)
      `)
      .eq('supplier_id', supplierId)
      .eq('org_id', orgId)
      .order('order_date', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data ?? [];
  },

  formatCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return cnpj;
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  },
};
