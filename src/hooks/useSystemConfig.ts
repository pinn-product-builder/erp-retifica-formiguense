import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useOrganization } from '@/contexts/OrganizationContext';

// Use direct client to avoid type issues with new table
const supabaseClient = createClient(
  "https://citibygettyzjgaewfca.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdGlieWdldHR5empnYWV3ZmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NjQ3OTUsImV4cCI6MjA2ODQ0MDc5NX0.__NwcDz6CfyRZ0PViXcugbH3FBaffiwcZJb6pbjPeqw"
);

interface SystemConfig {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_active: boolean;
}

export function useSystemConfig() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentOrganization } = useOrganization();

  const fetchConfigs = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabaseClient
        .from('system_config')
        .select('*')
        .eq('org_id', currentOrganization.id)
        .eq('is_active', true);

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching system configs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [currentOrganization]);

  const getConfig = (key: string, defaultValue?: any) => {
    const config = configs.find(c => c.key === key);
    if (!config) return defaultValue;

    // Parse value based on data type
    switch (config.data_type) {
      case 'number':
        return Number(config.value);
      case 'boolean':
        return Boolean(config.value);
      case 'json':
        try {
          return JSON.parse(config.value);
        } catch {
          return defaultValue;
        }
      default:
        return config.value;
    }
  };

  const setConfig = async (key: string, value: any, category: string, dataType: SystemConfig['data_type'] = 'string') => {
    if (!currentOrganization) return;

    try {
      let processedValue = value;
      if (dataType === 'json') {
        processedValue = JSON.stringify(value);
      }

      const { error } = await supabaseClient
        .from('system_config')
        .upsert({
          org_id: currentOrganization.id,
          key,
          value: processedValue,
          category,
          data_type: dataType,
          is_active: true
        }, {
          onConflict: 'org_id,key'
        });

      if (error) throw error;
      await fetchConfigs();
    } catch (error) {
      console.error('Error setting system config:', error);
      throw error;
    }
  };

  return {
    configs,
    loading,
    getConfig,
    setConfig,
    refetch: fetchConfigs
  };
}