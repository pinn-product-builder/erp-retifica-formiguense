// @ts-nocheck
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';

interface AuditLog {
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  record_id?: string;
  old_values?: unknown;
  new_values?: unknown;
  user_agent?: string;
  ip_address?: string;
}

export function useAudit() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const logAction = async (logData: AuditLog) => {
    if (!user || !currentOrganization) return;

    try {
      // Get client info
      const userAgent = navigator.userAgent;

      await supabase.from('fiscal_audit_log').insert({
        org_id: currentOrganization.id,
        table_name: logData.table_name,
        operation: logData.operation,
        record_id: logData.record_id,
        old_values: logData.old_values,
        new_values: logData.new_values,
        user_id: user.id,
        user_agent: userAgent,
        ip_address: null, // Will be set to null for client-side auditing
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const logAuthAction = async (action: string, metadata?: unknown) => {
    if (!user) return;

    try {
      const userAgent = navigator.userAgent;

      await supabase.from('fiscal_audit_log').insert({
        org_id: currentOrganization?.id || null,
        table_name: 'auth_actions',
        operation: 'INSERT',
        record_id: crypto.randomUUID(),
        new_values: {
          action,
          metadata,
          timestamp: new Date().toISOString()
        },
        user_id: user.id,
        user_agent: userAgent,
        ip_address: null, // Will be set to null for client-side auditing
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging auth action:', error);
    }
  };

  return {
    logAction,
    logAuthAction
  };
}