import React from 'react';
import { StatCard } from "@/components/StatCard";
import { DynamicQuickActions } from "@/components/dashboard/DynamicQuickActions";
import { RecentServicesMonitor } from "@/components/dashboard/RecentServicesMonitor";
import { IntelligentAlerts } from "@/components/dashboard/IntelligentAlerts";
import { useDashboard } from "@/hooks/useDashboard";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Wrench, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  LucideIcon
} from "lucide-react";

export function DashboardTab() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { kpis, loading } = useDashboard();

  // Helper function to get icon component from string
  function getIconComponent(iconName: string): LucideIcon {
    const iconMap: Record<string, LucideIcon> = {
      Calendar, 
      Wrench, 
      Users, 
      TrendingUp, 
      AlertTriangle, 
      CheckCircle,
      Package: Calendar, 
      Clock: Wrench, 
      AlertCircle: AlertTriangle
    };
    return iconMap[iconName] || TrendingUp;
  }

  // Helper function to convert color to variant
  function getVariantFromColor(color: string): "default" | "warning" | "primary" | "success" {
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

  // Convert KPIs to stats format
  const stats = kpis.map(kpi => ({
    title: kpi.name,
    value: kpi.formattedValue || kpi.value || 0,
    subtitle: kpi.subtitle || kpi.description,
    icon: getIconComponent(kpi.icon),
    variant: getVariantFromColor(kpi.color),
    trend: kpi.trend,
    calculationInfo: kpi.calculationInfo
  }));

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
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className={`grid gap-${isMobile ? '3' : '4'} ${getStatsGridCols()}`}>
        {loading ? (
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
      <div className={`grid gap-${isMobile ? '4' : '6'} ${getMainGridCols()}`}>
        {/* Serviços Recentes */}
        <motion.div
          className={`${isDesktop ? 'lg:col-span-2' : ''}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecentServicesMonitor />
        </motion.div>

        {/* Sidebar - Ações Rápidas */}
        <motion.div 
          className={`space-y-${isMobile ? '4' : '6'} min-h-0`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DynamicQuickActions />
        </motion.div>
      </div>

      {/* Alertas Inteligentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <IntelligentAlerts />
      </motion.div>
    </div>
  );
}

