import React, { createContext, useContext, useState, useEffect } from 'react';
import { useOrganization } from './OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationTheme {
  id: string;
  themeName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

interface ThemeContextType {
  currentTheme: OrganizationTheme | null;
  isLoading: boolean;
  error: string | null;
  applyTheme: (theme: OrganizationTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentOrganization } = useOrganization();
  const [currentTheme, setCurrentTheme] = useState<OrganizationTheme | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar tema da organização
  useEffect(() => {
    const loadOrganizationTheme = async () => {
      if (!currentOrganization) {
        setCurrentTheme(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: themeError } = await supabase
          .from('organization_themes')
          .select('*')
          .eq('org_id', currentOrganization.id)
          .eq('is_active', true)
          .single();

        if (themeError) throw themeError;

        if (data) {
          const theme: OrganizationTheme = {
            id: data.id,
            themeName: data.theme_name,
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color,
            accentColor: data.accent_color,
            successColor: data.success_color,
            warningColor: data.warning_color,
            errorColor: data.error_color,
            infoColor: data.info_color,
          };

          setCurrentTheme(theme);
          applyTheme(theme);
        } else {
          // Usar tema padrão
          setCurrentTheme(null);
        }
      } catch (err) {
        console.error('Error loading organization theme:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar tema');
        setCurrentTheme(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganizationTheme();
  }, [currentOrganization]);

  // Aplicar tema no CSS
  const applyTheme = (theme: OrganizationTheme) => {
    const root = document.documentElement;
    
    root.style.setProperty('--primary', theme.primaryColor);
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--success', theme.successColor);
    root.style.setProperty('--warning', theme.warningColor);
    root.style.setProperty('--destructive', theme.errorColor);
    root.style.setProperty('--info', theme.infoColor);
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      isLoading,
      error,
      applyTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
