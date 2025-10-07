
import React from 'react';
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicQuickActions } from "@/components/dashboard/DynamicQuickActions";
import { RecentServicesMonitor } from "@/components/dashboard/RecentServicesMonitor";
import { EnhancedInsights } from "@/components/EnhancedInsights";
import { PurchaseNeedsDashboard } from "@/components/dashboard/PurchaseNeedsDashboard";
import { PerformanceInsights } from "@/components/dashboard/PerformanceInsights";
import { IntelligentAlerts } from "@/components/dashboard/IntelligentAlerts";
import { GoalsManager } from "@/components/dashboard/GoalsManager";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useSEO } from "@/hooks/useSEO";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useDashboard } from "@/hooks/useDashboard";
import { motion } from "framer-motion";
import { 
  Users, 
  Wrench, 
  Calendar,
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Activity,
  LucideIcon
} from "lucide-react";

export default function Dashboard() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { 
    kpis, 
    alerts, 
    loading, 
    error, 
    dismissAlert,
    refetch 
  } = useDashboard();

  // SEO optimization
  useSEO({
    title: 'Dashboard - Retífica Formiguense',
    description: 'Painel principal do sistema de gestão da Retífica Formiguense. Acompanhe orçamentos, serviços, funcionários e métricas em tempo real.',
    keywords: 'dashboard, painel, retífica, gestão, métricas, orçamentos, serviços'
  });

  // Convert KPIs to stats format
  const stats = kpis.map(kpi => ({
    title: kpi.name,
    value: kpi.formattedValue || kpi.value || 0, // Usar valor formatado
    subtitle: kpi.subtitle || kpi.description,
    icon: getIconComponent(kpi.icon),
    variant: getVariantFromColor(kpi.color),
    trend: kpi.trend,
    calculationInfo: kpi.calculationInfo // Informação sobre o cálculo
  }));

  // Helper function to get icon component from string
  function getIconComponent(iconName: string) {
    const iconMap: Record<string, LucideIcon> = {
      Calendar, Wrench, Users, TrendingUp, AlertTriangle, CheckCircle,
      Package: Calendar, Clock: Wrench, AlertCircle: AlertTriangle
    };
    return iconMap[iconName] || TrendingUp;
  }

  // Helper function to convert color to variant
  function getVariantFromColor(color: string) {
    const colorMap: Record<string, "default" | "warning" | "primary" | "success"> = {
      blue: "primary",
      orange: "warning", 
      green: "success",
      yellow: "warning",
      red: "warning",
      primary: "primary"
    };
    return colorMap[color] || "default";
  }

  const getStatsGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-4';
  };

  const getMainGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    return 'lg:grid-cols-3';
  };

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
          <Button variant="outline" className="hover:bg-primary/10 border-primary/20" size={isMobile ? "sm" : "default"}>
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
          <Button className="button-primary-enhanced" size={isMobile ? "sm" : "default"}>
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className={`grid gap-${isMobile ? '3' : '4'} ${getStatsGridCols()} mb-0`}>
        {loading ? (
          // Loading skeleton for stats - 10 cards para manter layout
          Array.from({ length: 10 }).map((_, index) => (
            <motion.div 
              key={index}
              className="min-h-[110px] bg-card rounded-lg border border-border/50 animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            />
          ))
        ) : (
          stats.map((stat, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 0.1 + index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              y: -5,
              transition: { duration: 0.2 }
            }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              variant={stat.variant}
              trend={stat.trend}
              calculationInfo={stat.calculationInfo}
            />
          </motion.div>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className={`grid gap-${isMobile ? '4' : '6'} ${getMainGridCols()} mt-6`}>
        {/* Serviços Recentes - 2/3 em desktop, full em mobile */}
        <motion.div
          className={`${isDesktop ? 'lg:col-span-2' : ''}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecentServicesMonitor />
        </motion.div>

        {/* Sidebar - 1/3 em desktop, full em mobile */}
        <motion.div 
          className={`space-y-${isMobile ? '4' : '6'} min-h-0`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DynamicQuickActions />
        </motion.div>
      </div>

      {/* Intelligent Alerts Section */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <IntelligentAlerts />
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <PerformanceInsights />
      </motion.div>

      {/* Goals Manager */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <GoalsManager />
      </motion.div>

      {/* Purchase Needs Dashboard */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <PurchaseNeedsDashboard />
      </motion.div>
      </motion.div>
    </ThemeProvider>
  );
}
