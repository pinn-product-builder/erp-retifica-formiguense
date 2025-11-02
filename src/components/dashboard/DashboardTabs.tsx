import React, { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardTabs } from "@/hooks/useDashboardTabs";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// Lazy load dos componentes das abas para melhor performance
const DashboardTab = lazy(() => import('./tabs/DashboardTab').then(m => ({ default: m.DashboardTab })));
const PerformanceTab = lazy(() => import('./tabs/PerformanceTab').then(m => ({ default: m.PerformanceTab })));
//const GamificationTab = lazy(() => import('./tabs/GamificationTab').then(m => ({ default: m.GamificationTab })));
const PurchasesTab = lazy(() => import('./tabs/PurchasesTab').then(m => ({ default: m.PurchasesTab })));

// Loading component
const TabLoading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </motion.div>
  </div>
);

export function DashboardTabs() {
  const { tabs, activeTab, setActiveTab } = useDashboardTabs();
  const { isMobile } = useBreakpoint();

  // Mapeamento de IDs para componentes
  const tabComponents: Record<string, React.ReactNode> = {
    dashboard: <DashboardTab />,
    performance: <PerformanceTab />,
    //gamification: <GamificationTab />,
    purchases: <PurchasesTab />
  };

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full"
    >
      {/* Tabs List */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TabsList 
          className={`
            w-full 
            ${isMobile ? 'grid grid-cols-2 h-auto' : 'inline-flex'} 
            bg-muted/50 
            p-1 
            rounded-lg 
            border 
            border-border/50
          `}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`
                  ${isMobile ? 'flex-col gap-1 py-2 px-2' : 'gap-2'}
                  data-[state=active]:bg-background
                  data-[state=active]:text-primary
                  data-[state=active]:shadow-sm
                  transition-all
                  duration-200
                `}
              >
                <Icon className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
                <span className={isMobile ? 'text-xs' : 'text-sm font-medium'}>
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </motion.div>

      {/* Tabs Content */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="m-0"
              forceMount={activeTab === tab.id ? true : undefined}
            >
              {activeTab === tab.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Suspense fallback={<TabLoading />}>
                    {tabComponents[tab.id]}
                  </Suspense>
                </motion.div>
              )}
            </TabsContent>
          ))}
        </AnimatePresence>
      </div>
    </Tabs>
  );
}

