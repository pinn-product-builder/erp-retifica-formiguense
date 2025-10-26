import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  type: string;
  icon: string;
  relevance: number;
}

export interface SearchSource {
  id: string;
  source_name: string;
  source_type: string;
  table_name?: string;
  search_fields: string[];
  display_fields: string[];
  result_template?: string;
  weight: number;
  is_active: boolean;
}

export const useGlobalSearch = () => {
  const { currentOrganization } = useOrganization();
  const [searchSources, setSearchSources] = useState<SearchSource[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch search sources configuration
  const fetchSearchSources = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('search_sources')
        .select('*')
        .eq('is_active', true)
        .order('weight', { ascending: false });

      if (fetchError) throw fetchError;

      setSearchSources((data || []).map(source => ({
        ...source,
        search_fields: Array.isArray(source.search_fields) ? source.search_fields as string[] : [],
        display_fields: Array.isArray(source.display_fields) ? source.display_fields as string[] : [],
      })));
    } catch (error: unknown) {
      console.error('Error fetching search sources:', error);
    }
  };

  // Perform search across configured sources
  const search = async (query: string) => {
    if (!query.trim() || searchSources.length === 0) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchPromises = searchSources.map(async (source) => {
        if (source.source_type !== 'table' || !source.table_name) {
          return [];
        }

        try {
          // Build search query for each source
          let supabaseQuery = supabase.from(source.table_name as unknown).select('*');

          // Add search conditions for each search field
          if (source.search_fields.length > 0) {
            const searchConditions = source.search_fields
              .map(field => `${field}.ilike.%${query}%`)
              .join(',');
            supabaseQuery = supabaseQuery.or(searchConditions);
          }

          const { data, error } = await supabaseQuery.limit(10);

          if (error) {
            console.error(`Error searching ${source.source_name}:`, error);
            return [];
          }

          // Format results according to source configuration
          return (data || []).map((item: unknown) => {
            let title = item.name || item.title || item.order_number || 'Item';
            let subtitle = '';
            const url = `/${source.source_name}/${item.id}`;

            // Use display fields to build title and subtitle
            if (source.display_fields.length > 0) {
              const displayValues = source.display_fields
                .map(field => item[field])
                .filter(Boolean);
              
              if (displayValues.length > 0) {
                title = displayValues[0];
                if (displayValues.length > 1) {
                  subtitle = displayValues.slice(1).join(' - ');
                }
              }
            }

            // Use result template if available
            if (source.result_template) {
              title = source.result_template.replace(
                /\{(\w+)\}/g,
                (match, fieldName) => item[fieldName] || match
              );
            }

            return {
              id: `${source.source_name}-${item.id}`,
              title,
              subtitle,
              url,
              type: source.source_name,
              icon: getSourceIcon(source.source_name),
              relevance: source.weight,
            };
          });
        } catch (error) {
          console.error(`Error searching ${source.source_name}:`, error);
          return [];
        }
      });

      const allResults = await Promise.all(searchPromises);
      const flatResults = allResults.flat();

      // Sort by relevance (weight) and limit results
      const sortedResults = flatResults
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 20);

      setResults(sortedResults);
    } catch (error: unknown) {
      setError(error.message);
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for source type
  const getSourceIcon = (sourceName: string): string => {
    const iconMap: Record<string, string> = {
      pedidos: 'Package',
      clientes: 'Users',
      motores: 'Cog',
      funcionarios: 'UserCheck',
      consultores: 'UserCog',
      estoque: 'Package2',
      default: 'Search',
    };

    return iconMap[sourceName] || iconMap.default;
  };

  // Clear search results
  const clearResults = () => {
    setResults([]);
  };

  useEffect(() => {
    fetchSearchSources();
  }, [currentOrganization]);

  return {
    search,
    results,
    loading,
    error,
    clearResults,
    refetch: fetchSearchSources,
  };
};