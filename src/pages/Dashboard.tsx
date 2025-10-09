import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { CelebrationAnimations, useCelebration } from "@/components/dashboard/CelebrationAnimations";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useSEO } from "@/hooks/useSEO";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useDashboard } from "@/hooks/useDashboard";
import { motion } from "framer-motion";
import { 
  Filter,
  Download,
  RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const { isMobile } = useBreakpoint();
  const { loading, refetch } = useDashboard();
  const { celebration, hideCelebration } = useCelebration();

  // SEO optimization
  useSEO({
    title: 'Dashboard - Retífica Formiguense',
    description: 'Painel principal do sistema de gestão da Retífica Formiguense. Acompanhe orçamentos, serviços, funcionários e métricas em tempo real.',
    keywords: 'dashboard, painel, retífica, gestão, métricas, orçamentos, serviços'
  });

  return (
    <ThemeProvider>
      <motion.div 
        className=""
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Enhanced Header */}
        <motion.div 
          className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'} mb-6`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-foreground tracking-tight`}>
                Dashboard
              </h1>
              <Badge className="badge-success">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                Online
              </Badge>
            </div>
            <p className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
              Visão geral da retífica em tempo real
            </p>
            {!isMobile && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Última atualização: há 2 minutos</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>Sistema operacional</span>
                </div>
              </div>
            )}
          </div>
          <motion.div 
            className={`flex ${isMobile ? 'flex-col space-y-2' : 'gap-3'}`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              variant="outline" 
              className="hover:bg-primary/10 border-primary/20" 
              size={isMobile ? "sm" : "default"}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button 
              variant="outline" 
              className="hover:bg-primary/10 border-primary/20" 
              size={isMobile ? "sm" : "default"}
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              className="button-primary-enhanced" 
              size={isMobile ? "sm" : "default"}
            >
              <Download className="w-4 h-4 mr-2" />
              Relatório
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard Tabs */}
        <DashboardTabs />

        {/* Celebration Animations */}
        <CelebrationAnimations
          trigger={celebration.show}
          type={celebration.type}
          onComplete={hideCelebration}
        />
      </motion.div>
    </ThemeProvider>
  );
}
