import React from 'react';
import { UserLevelProgress } from "@/components/dashboard/UserLevelProgress";
import { AchievementSystem } from "@/components/dashboard/AchievementSystem";
import { PerformanceRanking } from "@/components/dashboard/PerformanceRanking";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { motion } from "framer-motion";

export function GamificationTab() {
  const { isMobile, isDesktop } = useBreakpoint();

  const getMainGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    return 'lg:grid-cols-3';
  };

  return (
    <div className="space-y-8">
      {/* User Level Progress & Achievement System */}
      <div className={`grid gap-${isMobile ? '4' : '6'} ${getMainGridCols()}`}>
        {/* User Level Progress */}
        <motion.div
          className={`${isDesktop ? 'lg:col-span-1' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <UserLevelProgress />
        </motion.div>

        {/* Achievement System */}
        <motion.div
          className={`${isDesktop ? 'lg:col-span-2' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AchievementSystem />
        </motion.div>
      </div>

      {/* Performance Ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <PerformanceRanking />
      </motion.div>
    </div>
  );
}

