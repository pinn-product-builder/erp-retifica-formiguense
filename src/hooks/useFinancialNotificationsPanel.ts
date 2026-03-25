import { useCallback, useEffect, useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { FinancialNotificationService } from '@/services/financial';
import type { Database } from '@/integrations/supabase/types';

export type FinancialNotificationRow = Database['public']['Tables']['financial_notifications']['Row'];

export function useFinancialNotificationsPanel() {
  const { currentOrganization } = useOrganization();
  const permissions = usePermissions();
  const orgId = currentOrganization?.id;
  const canShow = permissions.canAccessFinancial();

  const [items, setItems] = useState<FinancialNotificationRow[]>([]);
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!orgId || !canShow) {
      setItems([]);
      setCount(0);
      return;
    }
    const [c, rows] = await Promise.all([
      FinancialNotificationService.countUnread(orgId),
      FinancialNotificationService.listUnread(orgId, 40),
    ]);
    setCount(c);
    setItems(rows);
  }, [orgId, canShow]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markRead = useCallback(
    async (id: string) => {
      if (!orgId) return;
      await FinancialNotificationService.markRead(orgId, id);
      await refresh();
    },
    [orgId, refresh]
  );

  const markAllRead = useCallback(async () => {
    if (!orgId) return;
    await FinancialNotificationService.markAllRead(orgId);
    await refresh();
  }, [orgId, refresh]);

  return { items, count, refresh, markRead, markAllRead, canShow };
}
