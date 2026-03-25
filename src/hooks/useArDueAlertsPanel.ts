import { useCallback, useEffect, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ArDueAlertService,
  type ArDueAlertWithDetails,
} from '@/services/financial/arDueAlertService';

export function useArDueAlertsPanel() {
  const { currentOrganization } = useOrganization();
  const permissions = usePermissions();
  const orgId = currentOrganization?.id;
  const canShow = permissions.canAccessFinancial();

  const [items, setItems] = useState<ArDueAlertWithDetails[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!orgId || !canShow) {
      setItems([]);
      setCount(0);
      return;
    }
    setLoading(true);
    try {
      const ref = new Date().toISOString().slice(0, 10);
      await ArDueAlertService.syncForOrg(orgId, ref);
      const [c, rows] = await Promise.all([
        ArDueAlertService.countActive(orgId),
        ArDueAlertService.listWithDetails(orgId),
      ]);
      setCount(c);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [orgId, canShow]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      if (!orgId) return;
      await ArDueAlertService.markRead(orgId, id);
      await refresh();
    },
    [orgId, refresh]
  );

  const setInNegotiation = useCallback(
    async (id: string) => {
      if (!orgId) return;
      await ArDueAlertService.setInNegotiation(orgId, id);
      await refresh();
    },
    [orgId, refresh]
  );

  const markAllRead = useCallback(async () => {
    if (!orgId) return;
    await ArDueAlertService.markAllRead(orgId);
    await refresh();
  }, [orgId, refresh]);

  return {
    items,
    count,
    loading,
    refresh,
    markRead,
    setInNegotiation,
    markAllRead,
    canShow,
  };
}
