import { arReportDefinition } from './arReport';
import { apReportDefinition } from './apReport';
import { dreReportDefinition } from './dreReport';
import { cashFlowReportDefinition } from './cashFlowReport';
import { inventoryReportDefinition } from './inventoryReport';
import type { ReportDefinition } from '../types';

export const ALL_REPORTS: ReportDefinition[] = [
  dreReportDefinition,
  arReportDefinition,
  apReportDefinition,
  cashFlowReportDefinition,
  inventoryReportDefinition,
];

export function getReportById(id: string): ReportDefinition | undefined {
  return ALL_REPORTS.find((r) => r.id === id);
}

export function reportsByCategory() {
  const map = new Map<string, ReportDefinition[]>();
  for (const r of ALL_REPORTS) {
    const arr = map.get(r.category) ?? [];
    arr.push(r);
    map.set(r.category, arr);
  }
  return map;
}

export {
  arReportDefinition,
  apReportDefinition,
  dreReportDefinition,
  cashFlowReportDefinition,
  inventoryReportDefinition,
};
