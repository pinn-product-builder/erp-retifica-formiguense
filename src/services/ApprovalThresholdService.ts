import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export type ApprovalType = 'auto' | 'single' | 'multiple' | 'chain';

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  auto:     'Automático',
  single:   'Qualquer aprovador',
  multiple: 'Todos os aprovadores',
  chain:    'Sequencial',
};

export const APPROVAL_TYPE_DESCRIPTIONS: Record<ApprovalType, string> = {
  auto:     'Aprovado automaticamente, sem necessidade de aprovador humano',
  single:   'Qualquer um dos aprovadores pode aprovar',
  multiple: 'Todos os aprovadores devem aprovar',
  chain:    'Aprovação sequencial: primeiro → segundo → ...',
};

export interface ApprovalThreshold {
  id:            string;
  org_id:        string;
  min_value:     number;
  max_value:     number | null;
  approval_type: ApprovalType;
  approvers:     string[];
  label:         string | null;
  is_active:     boolean;
  created_at:    string;
  updated_at:    string;
}

export const thresholdSchema = z.object({
  min_value:     z.number().min(0, 'Valor mínimo deve ser >= 0'),
  max_value:     z.number().positive('Valor máximo deve ser positivo').nullable(),
  approval_type: z.enum(['auto', 'single', 'multiple', 'chain']),
  approvers:     z.array(z.string().uuid()).default([]),
  label:         z.string().max(100).nullable().optional(),
}).refine(
  (d) => d.max_value === null || d.max_value > d.min_value,
  { message: 'Valor máximo deve ser maior que o mínimo', path: ['max_value'] },
);

export type ThresholdFormData = z.infer<typeof thresholdSchema>;

function detectOverlap(
  thresholds: ApprovalThreshold[],
  candidate: { min_value: number; max_value: number | null },
  excludeId?: string,
): ApprovalThreshold | null {
  for (const t of thresholds) {
    if (t.id === excludeId) continue;
    if (!t.is_active) continue;

    const tMax = t.max_value ?? Infinity;
    const cMax = candidate.max_value ?? Infinity;

    const overlaps =
      candidate.min_value < tMax && cMax > t.min_value;

    if (overlaps) return t;
  }
  return null;
}

export const ApprovalThresholdService = {
  async list(orgId: string): Promise<ApprovalThreshold[]> {
    const { data, error } = await supabase
      .from('approval_thresholds' as never)
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('min_value', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ApprovalThreshold[];
  },

  async create(
    orgId: string,
    input: ThresholdFormData,
    existingThresholds: ApprovalThreshold[],
  ): Promise<ApprovalThreshold> {
    const validated = thresholdSchema.parse(input);

    const overlap = detectOverlap(existingThresholds, {
      min_value: validated.min_value,
      max_value: validated.max_value,
    });
    if (overlap) {
      throw new Error(
        `Faixa sobrepõe com existente: R$ ${overlap.min_value.toLocaleString('pt-BR')} - ${
          overlap.max_value ? `R$ ${overlap.max_value.toLocaleString('pt-BR')}` : 'sem limite'
        }`,
      );
    }

    const { data, error } = await supabase
      .from('approval_thresholds' as any)
      .insert({
        org_id:        orgId,
        min_value:     validated.min_value,
        max_value:     validated.max_value,
        approval_type: validated.approval_type,
        approvers:     validated.approvers,
        label:         validated.label ?? null,
        is_active:     true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ApprovalThreshold;
  },

  async update(
    id: string,
    input: ThresholdFormData,
    existingThresholds: ApprovalThreshold[],
  ): Promise<ApprovalThreshold> {
    const validated = thresholdSchema.parse(input);

    const overlap = detectOverlap(
      existingThresholds,
      { min_value: validated.min_value, max_value: validated.max_value },
      id,
    );
    if (overlap) {
      throw new Error(
        `Faixa sobrepõe com existente: R$ ${overlap.min_value.toLocaleString('pt-BR')} - ${
          overlap.max_value ? `R$ ${overlap.max_value.toLocaleString('pt-BR')}` : 'sem limite'
        }`,
      );
    }

    const { data, error } = await supabase
      .from('approval_thresholds' as any)
      .update({
        min_value:     validated.min_value,
        max_value:     validated.max_value,
        approval_type: validated.approval_type,
        approvers:     validated.approvers,
        label:         validated.label ?? null,
        updated_at:    new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ApprovalThreshold;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('approval_thresholds' as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getApprovalTypeForValue(orgId: string, value: number): Promise<ApprovalType> {
    const { data, error } = await supabase.rpc(
      'get_approval_level_for_value' as any,
      { p_org_id: orgId, p_value: value } as any,
    );
    if (error || !data) {
      if (value < 1000) return 'auto';
      if (value < 5000) return 'single';
      return 'single';
    }
    return data as ApprovalType;
  },

  detectOverlap,
};
