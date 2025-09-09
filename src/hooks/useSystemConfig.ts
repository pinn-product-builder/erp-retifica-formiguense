import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

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
      const { data, error } = await supabase
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

      const { error } = await supabase
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