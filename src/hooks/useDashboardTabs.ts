import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Trophy, 
  ShoppingCart,
  LucideIcon 
} from 'lucide-react';

export interface DashboardTab {
  id: string;
  label: string;
  icon: LucideIcon;
  isDefault?: boolean;
  description?: string;
}

const TABS: DashboardTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    isDefault: true,
    description: 'Visão geral e métricas principais'
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: TrendingUp,
    description: 'Insights, metas e desempenho'
  },
  {
    id: 'gamification',
    label: 'Gamificação',
    icon: Trophy,
    description: 'Progresso, conquistas e ranking'
  },
  {
    id: 'purchases',
    label: 'Compras',
    icon: ShoppingCart,
    description: 'Necessidades de compras pendentes'
  }
];

const STORAGE_KEY = 'dashboard_active_tab';

export function useDashboardTabs() {
  const [activeTab, setActiveTabState] = useState<string>(() => {
    // Tentar recuperar do localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TABS.find(tab => tab.id === saved)) {
      return saved;
    }
    // Fallback para a aba padrão
    return TABS.find(tab => tab.isDefault)?.id || 'dashboard';
  });

  // Sincronizar com URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl && TABS.find(tab => tab.id === tabFromUrl)) {
      setActiveTabState(tabFromUrl);
    }
  }, []);

  // Atualizar localStorage e URL quando a aba mudar
  const setActiveTab = useCallback((tabId: string) => {
    if (!TABS.find(tab => tab.id === tabId)) {
      console.warn(`Tab "${tabId}" não encontrada`);
      return;
    }

    setActiveTabState(tabId);
    localStorage.setItem(STORAGE_KEY, tabId);

    // Atualizar URL sem recarregar a página
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url);
  }, []);

  return {
    tabs: TABS,
    activeTab,
    setActiveTab
  };
}

