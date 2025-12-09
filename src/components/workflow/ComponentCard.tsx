// @ts-nocheck

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Camera, MessageSquare, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkflowModal } from './WorkflowModal';
import { EmployeeDirectoryEntry } from '@/hooks/useEmployeesDirectory';
import { useEngineComponents } from '@/hooks/useEngineComponents';

interface ComponentCardProps {
  workflow: Record<string, any>;
  componentColor: string;
  onUpdate?: () => void;
  employeeOptions: EmployeeDirectoryEntry[];
  employeesLoading: boolean;
}

export function ComponentCard({ workflow, componentColor, onUpdate, employeeOptions, employeesLoading }: ComponentCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { components: engineComponents } = useEngineComponents();

  const getComponentLabel = (componentValue: string) => {
    const component = engineComponents.find(c => c.value === componentValue);
    return component?.label || componentValue;
  };

  const getComponentColorHex = (tailwindColor: string): string => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-orange-500': '#f97316',
      'bg-yellow-500': '#eab308',
      'bg-purple-500': '#a855f7',
      'bg-red-500': '#ef4444',
      'bg-cyan-500': '#06b6d4',
      'bg-pink-500': '#ec4899',
      'bg-rose-500': '#f43f5e',
      'bg-indigo-500': '#6366f1',
      'bg-teal-500': '#14b8a6',
      'bg-violet-500': '#8b5cf6',
      'bg-blue-600': '#2563eb',
      'bg-blue-700': '#1d4ed8',
      'bg-sky-500': '#0ea5e9',
      'bg-fuchsia-500': '#d946ef',
      'bg-emerald-500': '#10b981',
      'bg-amber-500': '#f59e0b',
      'bg-lime-500': '#84cc16',
      'bg-green-600': '#16a34a',
      'bg-stone-500': '#78716c',
      'bg-gray-500': '#6b7280'
    };
    return colorMap[tailwindColor] || '#6b7280';
  };

  const componentLabel = workflow.component ? getComponentLabel(workflow.component) : '';
  const componentColorHex = getComponentColorHex(componentColor);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getElapsedMs = () => {
    const startDate = workflow.started_at ? new Date(workflow.started_at) : 
                     workflow.created_at ? new Date(workflow.created_at) : null;
    if (!startDate) return 0;
    const endDate = workflow.completed_at ? new Date(workflow.completed_at) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs < 0 ? 0 : diffMs;
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return '0m';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const slaConfig = workflow.statusConfig?.sla_config as { max_hours?: number; warning_threshold?: number } | undefined;
  const warningThreshold = slaConfig?.warning_threshold
    ? Number(slaConfig.warning_threshold)
    : 80;

  const getEntrySlaState = (elapsedMs: number) => {
    if (!slaConfig?.max_hours) return null;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const percent = (elapsedHours / Number(slaConfig.max_hours)) * 100;

    if (!Number.isFinite(percent)) return null;

    if (percent >= 100) {
      return { status: 'breached', percent };
    }
    if (percent >= (warningThreshold || 80)) {
      return { status: 'warning', percent };
    }
    return { status: 'ok', percent };
  };

  const elapsedMsValue = getElapsedMs();
  const statusDuration = formatDuration(elapsedMsValue);
  const entrySlaState = workflow.status === 'entrada' ? getEntrySlaState(elapsedMsValue) : null;
  const entrySlaColor = entrySlaState?.status === 'breached'
    ? 'text-red-600'
    : entrySlaState?.status === 'warning'
      ? 'text-amber-600'
      : 'text-emerald-600';

  const getProgressColor = () => {
    const days = Math.floor(elapsedMsValue / (1000 * 60 * 60 * 24));
    if (days > 5) return 'text-red-600';
    if (days > 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-md transition-all duration-200 bg-card border hover:border-primary/20"
        onClick={() => setShowModal(true)}
      >
        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${componentColor} flex-shrink-0`} />
              <span className="font-semibold text-xs sm:text-sm truncate">
                {workflow.orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {componentLabel && (
                <Badge 
                  className="text-xs px-1.5 py-0.5 text-white border-0 font-medium"
                  style={{ backgroundColor: componentColorHex }}
                >
                  {componentLabel}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                OS #{workflow.order?.id?.slice(-4) || workflow.order_id?.slice(-4) || 'N/A'}
              </Badge>
            </div>
          </div>

          {/* Customer & Engine */}
          <div className="space-y-1">
            <p className="font-medium text-xs sm:text-sm truncate" title={workflow.customerName}>
              {workflow.customerName}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={workflow.engineModel}>
              {workflow.engineModel}
            </p>
          </div>

          {/* Status Info */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-1 text-muted-foreground min-w-0 flex-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{formatDate(workflow.collectionDate)}</span>
              </div>
              {elapsedMsValue > 0 && (
                <div className={`flex items-center gap-1 ${getProgressColor()} flex-shrink-0`}>
                  <Clock className="w-3 h-3" />
                  <span>{statusDuration}</span>
                </div>
              )}
            </div>

            {entrySlaState && (
              <div className={`flex items-center gap-1 text-xs ${entrySlaColor}`}>
                {entrySlaState.status === 'ok' ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span className="truncate">
                  {entrySlaState.status === 'breached'
                    ? 'SLA estourado'
                    : entrySlaState.status === 'warning'
                      ? 'SLA em risco'
                      : 'Dentro do SLA'} • {Math.round(entrySlaState.percent)}%
                </span>
              </div>
            )}
          </div>

          {/* Assigned To */}
          {(workflow.assignedEmployeeName || workflow.assigned_to) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {workflow.assignedEmployeeName || workflow.assigned_to}
              </span>
            </div>
          )}

          {/* Action Indicators */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 min-w-0">
              {workflow.photos?.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 flex-shrink-0">
                  <Camera className="w-3 h-3" />
                  <span>{workflow.photos.length}</span>
                </div>
              )}
              {workflow.notes && (
                <div className="flex items-center gap-1 text-xs text-green-600 flex-shrink-0">
                  <MessageSquare className="w-3 h-3" />
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-5 sm:h-6 px-1 sm:px-2 text-xs flex-shrink-0"
            >
              <span className="hidden sm:inline">Ver mais</span>
              <span className="sm:hidden">Ver</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <WorkflowModal
        workflow={workflow}
        open={showModal}
        onClose={() => setShowModal(false)}
        onUpdate={onUpdate}
        employeeOptions={employeeOptions}
        employeesLoading={employeesLoading}
      />
    </>
  );
}
