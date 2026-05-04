import { describe, expect, it, vi, beforeEach } from 'vitest';

const ORG_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORG_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ORG_C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

import { OrganizationGroupService } from '@/services/financial/organizationGroupService';

describe('OrganizationGroupService.listAccessibleGroupOrgIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('com duas empresas no grupo e usuário em ambas, retorna as duas ordenadas', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [ORG_B, ORG_A],
      error: null,
    });

    const ids = await OrganizationGroupService.listAccessibleGroupOrgIds(ORG_A, [ORG_A, ORG_B]);

    expect(mockSupabase.rpc).toHaveBeenCalledWith('org_ids_in_same_group', { p_org_id: ORG_A });
    expect(ids).toEqual([ORG_A, ORG_B]);
  });

  it('com duas empresas no grupo mas usuário só em uma, retorna só a acessível', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [ORG_A, ORG_B],
      error: null,
    });

    const ids = await OrganizationGroupService.listAccessibleGroupOrgIds(ORG_A, [ORG_A]);

    expect(ids).toEqual([ORG_A]);
  });

  it('RPC vazio ou null cai no fallback da org atual', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

    const ids = await OrganizationGroupService.listAccessibleGroupOrgIds(ORG_A, [ORG_A, ORG_B]);

    expect(ids).toEqual([ORG_A]);
  });

  it('RPC null data cai no fallback da org atual', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const ids = await OrganizationGroupService.listAccessibleGroupOrgIds(ORG_C, [ORG_C]);

    expect(ids).toEqual([ORG_C]);
  });

  it('nenhum id retornado intersecta o acesso do usuário, usa org atual', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [ORG_A, ORG_B],
      error: null,
    });

    const ids = await OrganizationGroupService.listAccessibleGroupOrgIds(ORG_C, [ORG_C]);

    expect(ids).toEqual([ORG_C]);
  });

  it('erro do RPC propaga', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'permission denied for function' },
    });

    await expect(
      OrganizationGroupService.listAccessibleGroupOrgIds(ORG_A, [ORG_A])
    ).rejects.toThrow('permission denied for function');
  });
});
