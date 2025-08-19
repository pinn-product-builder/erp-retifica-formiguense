import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface JurisdictionConfig {
  id: string;
  jurisdiction: string;
  badge_color: string;
  text_color: string;
}

export function useJurisdictionConfig() {
  const [jurisdictionConfigs, setJurisdictionConfigs] = useState<JurisdictionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentOrganization } = useOrganization();

  const loadJurisdictionConfigs = async () => {
    if (!currentOrganization) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jurisdiction_config')
        .select('*')
        .eq('org_id', currentOrganization.id);

      if (error) throw error;

      // If no configs found, create defaults
      if (!data || data.length === 0) {
        await createDefaultConfigs();
        return;
      }

      setJurisdictionConfigs(data);
    } catch (error) {
      console.error('Error loading jurisdiction configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfigs = async () => {
    if (!currentOrganization) return;

    const defaultConfigs = [
      {
        org_id: currentOrganization.id,
        jurisdiction: 'federal',
        badge_color: 'hsl(var(--primary))',
        text_color: 'hsl(var(--primary-foreground))'
      },
      {
        org_id: currentOrganization.id,
        jurisdiction: 'estadual',
        badge_color: 'hsl(var(--secondary))',
        text_color: 'hsl(var(--secondary-foreground))'
      },
      {
        org_id: currentOrganization.id,
        jurisdiction: 'municipal',
        badge_color: 'hsl(var(--accent))',
        text_color: 'hsl(var(--accent-foreground))'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('jurisdiction_config')
        .insert(defaultConfigs)
        .select();

      if (error) throw error;
      setJurisdictionConfigs(data);
    } catch (error) {
      console.error('Error creating default jurisdiction configs:', error);
    }
  };

  const updateJurisdictionConfig = async (id: string, updates: Partial<JurisdictionConfig>) => {
    try {
      const { error } = await supabase
        .from('jurisdiction_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setJurisdictionConfigs(prev =>
        prev.map(config => config.id === id ? { ...config, ...updates } : config)
      );
    } catch (error) {
      console.error('Error updating jurisdiction config:', error);
      throw error;
    }
  };

  const getJurisdictionStyle = (jurisdiction: string) => {
    const config = jurisdictionConfigs.find(c => c.jurisdiction === jurisdiction);
    if (!config) {
      // Fallback to defaults if config not found
      switch (jurisdiction) {
        case 'federal': return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' };
        case 'estadual': return { backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--secondary-foreground))' };
        case 'municipal': return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' };
        default: return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' };
      }
    }
    
    return {
      backgroundColor: config.badge_color,
      color: config.text_color
    };
  };

  useEffect(() => {
    loadJurisdictionConfigs();
  }, [currentOrganization]);

  return {
    jurisdictionConfigs,
    loading,
    loadJurisdictionConfigs,
    updateJurisdictionConfig,
    getJurisdictionStyle
  };
}