import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { OrganizationGroupService } from '@/services/financial/organizationGroupService';

export type FinancialScopeSelection = string | 'all';

/**
 * Escopo financeiro: organizações do mesmo grupo econômico que o usuário pode ver,
 * com opção "Todas" para consolidar leituras (lista/KPIs).
 */
export function useFinancialOrgScope() {
  const { currentOrganization, userOrganizations } = useOrganization();
  const currentOrgId = currentOrganization?.id ?? '';

  const userOrgIds = useMemo(() => userOrganizations.map((o) => o.id), [userOrganizations]);

  const [groupOrgIds, setGroupOrgIds] = useState<string[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!currentOrgId) {
      setGroupOrgIds([]);
      return;
    }
    setLoadingGroup(true);
    try {
      const ids = await OrganizationGroupService.listAccessibleGroupOrgIds(currentOrgId, userOrgIds);
      setGroupOrgIds(ids);
    } catch {
      setGroupOrgIds([currentOrgId]);
    } finally {
      setLoadingGroup(false);
    }
  }, [currentOrgId, userOrgIds]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const showGroupFilter = groupOrgIds.length > 1;

  const [scopeSelection, setScopeSelection] = useState<FinancialScopeSelection>('');

  useEffect(() => {
    if (!currentOrgId) return;
    setScopeSelection((prev) => {
      if (prev === 'all' && groupOrgIds.length > 1) return 'all';
      if (typeof prev === 'string' && prev !== 'all' && groupOrgIds.includes(prev)) return prev;
      return currentOrgId;
    });
  }, [currentOrgId, groupOrgIds]);

  const effectiveOrgIds = useMemo(() => {
    if (!currentOrgId) return [];
    if (scopeSelection === 'all') return groupOrgIds;
    if (scopeSelection && groupOrgIds.includes(scopeSelection)) return [scopeSelection];
    return [currentOrgId];
  }, [currentOrgId, scopeSelection, groupOrgIds]);

  const isConsolidatedView = scopeSelection === 'all';

  const orgLabel = useCallback(
    (id: string) => userOrganizations.find((o) => o.id === id)?.name ?? id.slice(0, 8),
    [userOrganizations]
  );

  return {
    groupOrgIds,
    effectiveOrgIds,
    scopeSelection,
    setScopeSelection,
    showGroupFilter,
    isConsolidatedView,
    loadingGroup,
    orgLabel,
    refreshGroup: loadGroup,
  };
}
