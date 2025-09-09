import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';

interface AuditLog {
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  record_id?: string;
  old_values?: any;
  new_values?: any;
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
      
      // Try to get IP address (this is basic, in production you'd use a service)
      let ipAddress = 'unknown';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (error) {
        console.warn('Could not fetch IP address:', error);
      }

      await supabase.from('fiscal_audit_log').insert({
        org_id: currentOrganization.id,
        table_name: logData.table_name,
        operation: logData.operation,
        record_id: logData.record_id,
        old_values: logData.old_values,
        new_values: logData.new_values,
        user_id: user.id,
        user_agent: userAgent,
        ip_address: ipAddress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const logAuthAction = async (action: string, metadata?: any) => {
    if (!user) return;

    try {
      const userAgent = navigator.userAgent;
      
      let ipAddress = 'unknown';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (error) {
        console.warn('Could not fetch IP address:', error);
      }

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
        ip_address: ipAddress,
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