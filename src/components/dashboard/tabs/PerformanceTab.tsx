import React from 'react';
import { PerformanceInsights } from "@/components/dashboard/PerformanceInsights";
import { GoalsManager } from "@/components/dashboard/GoalsManager";
import { motion } from "framer-motion";

export function PerformanceTab() {
  return (
    <div className="space-y-8">
      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <PerformanceInsights />
      </motion.div>

      {/* Goals Manager */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GoalsManager />
      </motion.div>
    </div>
  );
}

