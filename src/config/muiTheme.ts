import { createTheme, ThemeOptions } from '@mui/material/styles';
import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// Função para criar tema MUI baseado no tema do sistema
export const createMuiTheme = (mode: 'light' | 'dark' = 'light') => {
  // Cores baseadas no sistema de design atual
  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#3b82f6' : '#3b82f6', // blue-500
        light: mode === 'dark' ? '#60a5fa' : '#60a5fa',
        dark: mode === 'dark' ? '#2563eb' : '#2563eb',
      },
      secondary: {
        main: mode === 'dark' ? '#8b5cf6' : '#8b5cf6', // violet-500
        light: mode === 'dark' ? '#a78bfa' : '#a78bfa',
        dark: mode === 'dark' ? '#7c3aed' : '#7c3aed',
      },
      success: {
        main: mode === 'dark' ? '#10b981' : '#10b981', // green-500
        light: mode === 'dark' ? '#34d399' : '#34d399',
        dark: mode === 'dark' ? '#059669' : '#059669',
      },
      warning: {
        main: mode === 'dark' ? '#f59e0b' : '#f59e0b', // amber-500
        light: mode === 'dark' ? '#fbbf24' : '#fbbf24',
        dark: mode === 'dark' ? '#d97706' : '#d97706',
      },
      error: {
        main: mode === 'dark' ? '#ef4444' : '#ef4444', // red-500
        light: mode === 'dark' ? '#f87171' : '#f87171',
        dark: mode === 'dark' ? '#dc2626' : '#dc2626',
      },
      info: {
        main: mode === 'dark' ? '#06b6d4' : '#06b6d4', // cyan-500
        light: mode === 'dark' ? '#22d3ee' : '#22d3ee',
        dark: mode === 'dark' ? '#0891b2' : '#0891b2',
      },
      background: {
        default: mode === 'dark' ? '#0a0a0a' : '#ffffff',
        paper: mode === 'dark' ? '#1a1a1a' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#fafafa' : '#0a0a0a',
        secondary: mode === 'dark' ? '#a3a3a3' : '#525252',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.875rem',
        fontWeight: 700,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '0.5rem',
            fontWeight: 500,
            padding: '0.5rem 1rem',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '0.75rem',
            boxShadow: mode === 'dark' 
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.24)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '0.5rem',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Hook para usar tema MUI sincronizado com next-themes
export const useMuiTheme = () => {
  const { theme, systemTheme } = useNextTheme();
  const [muiTheme, setMuiTheme] = useState(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    return createMuiTheme(currentTheme === 'dark' ? 'dark' : 'light');
  });

  useEffect(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    setMuiTheme(createMuiTheme(currentTheme === 'dark' ? 'dark' : 'light'));
  }, [theme, systemTheme]);

  return muiTheme;
};

