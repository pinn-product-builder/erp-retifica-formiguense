import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { OrderCard } from './OrderCard';
import { Badge } from '@/components/ui/badge';
import { EmployeeDirectoryEntry } from '@/hooks/useEmployeesDirectory';
import { WorkflowStatusConfig } from '@/hooks/useWorkflowStatusConfig';

interface OrderCardData {
  type: 'order';
  order: any;
  orderId: string;
  workflows: any[];
  orderNumber: string;
  customerName?: string;
  engineModel: string;
  collectionDate?: string;
  statusConfig?: WorkflowStatusConfig;
  allowComponentSplit: boolean;
}

interface KanbanColumnProps {
  status: string;
  workflows: OrderCardData[];
  componentColor: string;
  statusColors?: Record<string, { bgColor: string; textColor: string }>;
  statusConfig?: WorkflowStatusConfig;
  onUpdate?: () => void;
  employeeOptions: EmployeeDirectoryEntry[];
  employeesLoading: boolean;
}

export function KanbanColumn({ status, workflows, componentColor, statusColors, statusConfig, onUpdate, employeeOptions, employeesLoading }: KanbanColumnProps) {
  const statusLabel = statusConfig?.status_label || status;
  
  return (
    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 h-full flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${componentColor}`} />
          <h3 className="font-semibold text-xs sm:text-sm truncate">
            {statusLabel}
          </h3>
        </div>
        <Badge 
          variant="secondary" 
          className="text-xs px-1.5 py-0.5"
          style={{
            backgroundColor: statusColors?.[status]?.bgColor || '#f3f4f6',
            color: statusColors?.[status]?.textColor || '#374151'
          }}
        >
          {workflows.length}
        </Badge>
      </div>

      {/* Droppable Area */}
      <div className="flex-1 overflow-hidden">
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 sm:space-y-3 h-full overflow-y-auto pr-1 ${
                snapshot.isDraggingOver ? 'bg-primary/10 border-2 border-primary/30 border-dashed rounded-lg' : ''
              }`}
            >
              {workflows.map((item, index) => {
                // Se é um card desmembrado (1 workflow apenas), incluir componente no ID
                const componentSuffix = item.allowComponentSplit && item.workflows.length === 1 
                  ? `-${item.workflows[0].component}` 
                  : '';
                const draggableId = `order-${item.orderId}${componentSuffix}`;
                
                return (
                  <Draggable 
                    key={draggableId} 
                    draggableId={draggableId} 
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`${
                          snapshot.isDragging ? 'rotate-3 scale-105' : ''
                        } transition-transform`}
                      >
                        <OrderCard 
                          order={item.order}
                          workflows={item.workflows}
                          statusConfig={item.statusConfig || statusConfig}
                          allowComponentSplit={item.allowComponentSplit}
                          onUpdate={onUpdate}
                          employeeOptions={employeeOptions}
                          employeesLoading={employeesLoading}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
}
