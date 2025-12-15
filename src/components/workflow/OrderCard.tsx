import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package } from 'lucide-react';
import { WorkflowModal } from './WorkflowModal';
import { EmployeeDirectoryEntry } from '@/hooks/useEmployeesDirectory';
import { useComponentHelpers } from '@/hooks/useComponentHelpers';
import { getComponentColorHex } from '@/utils/componentColors';
import { formatDateShort } from '@/utils/dateFormat';

interface OrderCardProps {
  order: Record<string, any>;
  workflows: Array<Record<string, any>>;
  statusConfig?: any;
  allowComponentSplit?: boolean;
  onUpdate?: () => void;
  employeeOptions: EmployeeDirectoryEntry[];
  employeesLoading: boolean;
}

export function OrderCard({ 
  order, 
  workflows, 
  statusConfig, 
  allowComponentSplit = false, 
  onUpdate, 
  employeeOptions, 
  employeesLoading 
}: OrderCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Record<string, any> | null>(null);
  const { getComponentLabel } = useComponentHelpers();

  const completedComponents = workflows.filter((w: any) => w.completed_at).length;
  const totalComponents = workflows.length;
  const progressPercent = totalComponents > 0 ? Math.round((completedComponents / totalComponents) * 100) : 0;

  const getLatestWorkflow = () => {
    if (workflows.length === 0) return null;
    return workflows.reduce((latest: any, current: any) => {
      const latestTime = latest.updated_at || latest.started_at || latest.created_at;
      const currentTime = current.updated_at || current.started_at || current.created_at;
      return new Date(currentTime) > new Date(latestTime) ? current : latest;
    });
  };

  const latestWorkflow = getLatestWorkflow();

  const handleWorkflowClick = (workflow: Record<string, any>, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWorkflow(workflow);
    setShowModal(true);
  };

  const handleCardClick = () => {
    if (!allowComponentSplit && latestWorkflow) {
      setSelectedWorkflow(latestWorkflow);
      setShowModal(true);
    }
  };

  return (
    <>
      <Card 
        className="hover:shadow-md transition-all duration-200 bg-card border hover:border-primary/20"
      >
        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-xs sm:text-sm truncate">
                OS #{order.order_number}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {totalComponents > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {completedComponents}/{totalComponents}
                </Badge>
              )}
            </div>
          </div>

          {/* Customer & Engine */}
          <div className="space-y-1">
            <p className="font-medium text-xs sm:text-sm truncate" title={order.customers?.name}>
              {order.customers?.name || 'Cliente não informado'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado'}
            </p>
          </div>

          {/* Progress Bar */}
          {totalComponents > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Components List - Conditional Rendering */}
          {allowComponentSplit && workflows.length > 0 ? (
            // Quando permite desmembramento, mostrar badge destacado do componente
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {workflows.map((w: any) => (
                <Badge 
                  key={w.id} 
                  className="text-sm px-3 py-1.5 font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: getComponentColorHex(w.componentColor || 'bg-gray-500'),
                    color: 'white'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWorkflowClick(w, e);
                  }}
                >
                  {getComponentLabel(w.component)}
                </Badge>
              ))}
            </div>
          ) : (
            // Compact component badges when not allowing split
            <div className="flex flex-wrap gap-1">
              {workflows.slice(0, 5).map((w: any) => (
                <Badge 
                  key={w.id} 
                  variant={w.completed_at ? "default" : "secondary"}
                  className="text-xs px-1.5 py-0.5"
                  style={{
                    backgroundColor: w.completed_at 
                      ? getComponentColorHex(w.componentColor || 'bg-gray-500')
                      : undefined,
                    color: w.completed_at ? 'white' : undefined
                  }}
                >
                  {getComponentLabel(w.component)}
                </Badge>
              ))}
              {workflows.length > 5 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{workflows.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Collection Date */}
          {order.collection_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{formatDateShort(order.collection_date)}</span>
            </div>
          )}

          {/* Action Button */}
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-5 sm:h-6 px-1 sm:px-2 text-xs w-full"
            onClick={() => {
              if (latestWorkflow) {
                setSelectedWorkflow(latestWorkflow);
                setShowModal(true);
              }
            }}
          >
            Ver detalhes
          </Button>
        </CardContent>
      </Card>

      {selectedWorkflow && (
        <WorkflowModal
          workflow={selectedWorkflow}
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedWorkflow(null);
          }}
          onUpdate={onUpdate}
          employeeOptions={employeeOptions}
          employeesLoading={employeesLoading}
        />
      )}
    </>
  );
}