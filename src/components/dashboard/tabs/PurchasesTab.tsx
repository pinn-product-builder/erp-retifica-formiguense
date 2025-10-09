import React from 'react';
import { PurchaseNeedsDashboard } from "@/components/dashboard/PurchaseNeedsDashboard";
import { motion } from "framer-motion";

export function PurchasesTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <PurchaseNeedsDashboard />
    </motion.div>
  );
}

