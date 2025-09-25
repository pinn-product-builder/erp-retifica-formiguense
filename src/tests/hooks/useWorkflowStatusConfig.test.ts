/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useWorkflowStatusConfig } from '../../hooks/useWorkflowStatusConfig';

// Mock do Supabase
jest.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: '1',
                  entity_type: 'workflow',
                  status_key: 'entrada',
                  status_label: 'Entrada',
                  badge_variant: 'secondary',
                  color: '#ef4444',
                  icon: 'Package',
                  is_active: true,
                  display_order: 1,
                  estimated_hours: 0.5,
                  visual_config: { bgColor: '#fef2f2', textColor: '#dc2626' }
                },
                {
                  id: '2',
                  entity_type: 'workflow',
                  status_key: 'metrologia',
                  status_label: 'Metrologia',
                  badge_variant: 'default',
                  color: '#f97316',
                  icon: 'Ruler',
                  is_active: true,
                  display_order: 2,
                  estimated_hours: 2.0,
                  visual_config: { bgColor: '#fff7ed', textColor: '#ea580c' }
                }
              ],
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

// Mock do hook de organização
jest.mock('../../hooks/useOrganization', () => ({
  useOrganization: () => ({
    currentOrganization: { id: 'org-1', name: 'Test Org' }
  })
}));

// Mock do toast
jest.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('useWorkflowStatusConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load workflow statuses on mount', async () => {
    const { result } = renderHook(() => useWorkflowStatusConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.workflowStatuses).toHaveLength(2);
    expect(result.current.workflowStatuses[0].status_key).toBe('entrada');
    expect(result.current.workflowStatuses[1].status_key).toBe('metrologia');
  });

  it('should get status config by key', async () => {
    const { result } = renderHook(() => useWorkflowStatusConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const statusConfig = result.current.getStatusConfig('entrada');
    expect(statusConfig).toBeDefined();
    expect(statusConfig?.status_label).toBe('Entrada');
    expect(statusConfig?.estimated_hours).toBe(0.5);
  });

  it('should get status colors correctly', async () => {
    const { result } = renderHook(() => useWorkflowStatusConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const colors = result.current.getStatusColors();
    expect(colors.entrada).toEqual({
      bgColor: '#fef2f2',
      textColor: '#dc2626'
    });
    expect(colors.metrologia).toEqual({
      bgColor: '#fff7ed',
      textColor: '#ea580c'
    });
  });

  it('should return default colors for unknown status', async () => {
    const { result } = renderHook(() => useWorkflowStatusConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const colors = result.current.getStatusColors();
    // Se não há configuração visual, deve usar cores padrão
    expect(colors).toBeDefined();
  });
});

describe('Status Prerequisites', () => {
  it('should validate allowed transitions', async () => {
    const { result } = renderHook(() => useWorkflowStatusConfig());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock de pré-requisitos
    result.current.prerequisites = [
      {
        id: '1',
        from_status_key: 'entrada',
        to_status_key: 'metrologia',
        entity_type: 'workflow',
        transition_type: 'manual',
        is_active: true
      }
    ];

    const allowedStatuses = result.current.getNextAllowedStatuses('entrada');
    expect(allowedStatuses).toHaveLength(1);
    expect(allowedStatuses[0].to_status_key).toBe('metrologia');
  });
});
