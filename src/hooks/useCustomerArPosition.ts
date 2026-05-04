import { useCallback, useMemo, useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  CustomerArPositionService,
  type CustomerArLine,
  type CustomerArMatch,
  type CustomerArSummary,
  type OrganizationRef,
} from '@/services/financial/customerArPositionService';

export type CustomerArPositionStatusFilter = 'all' | 'open' | 'paid';

export function useCustomerArPosition() {
  const { userOrganizations } = useOrganization();

  const accessibleOrgs: OrganizationRef[] = useMemo(
    () => userOrganizations.map((o) => ({ id: o.id, name: o.name })),
    [userOrganizations]
  );

  const [matches, setMatches] = useState<CustomerArMatch[]>([]);
  const [lines, setLines] = useState<CustomerArLine[]>([]);
  const [summary, setSummary] = useState<CustomerArSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDocument, setLastDocument] = useState<string | null>(null);

  const search = useCallback(
    async (document: string) => {
      setLoading(true);
      setError(null);
      setLastDocument(document.trim());
      try {
        const res = await CustomerArPositionService.load({
          accessibleOrgs,
          document: document.trim(),
        });
        setMatches(res.matches);
        setLines(res.lines);
        setSummary(res.summary);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Falha ao consultar';
        setError(msg);
        setMatches([]);
        setLines([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    [accessibleOrgs]
  );

  const clear = useCallback(() => {
    setMatches([]);
    setLines([]);
    setSummary(null);
    setError(null);
    setLastDocument(null);
  }, []);

  return {
    accessibleOrgs,
    matches,
    lines,
    summary,
    loading,
    error,
    lastDocument,
    search,
    clear,
  };
}
