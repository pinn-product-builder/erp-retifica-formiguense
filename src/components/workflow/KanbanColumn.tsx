
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ComponentCard } from './ComponentCard';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  metrologia: 'Metrologia',
  usinagem: 'Usinagem',
  montagem: 'Montagem',
  pronto: 'Pronto',
  garantia: 'Garantia',
  entregue: 'Entregue'
};

  const STATUS_COLORS: Record<string, string> = {
    entrada: 'bg-gray-100 text-gray-800',
    metrologia: 'bg-orange-100 text-orange-800',
    usinagem: 'bg-orange-100 text-orange-800',
    montagem: 'bg-yellow-100 text-yellow-800',
    pronto: 'bg-green-100 text-green-800',
    garantia: 'bg-purple-100 text-purple-800',
    entregue: 'bg-emerald-100 text-emerald-800'
  };

interface KanbanColumnProps {
  status: string;
  workflows: any[];
  componentColor: string;
  statusColors?: Record<string, { bgColor: string; textColor: string }>;
}

export function KanbanColumn({ status, workflows, componentColor, statusColors }: KanbanColumnProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${componentColor}`} />
          <h3 className="font-semibold text-xs sm:text-sm truncate">
            {STATUS_LABELS[status]}
          </h3>
        </div>
        <Badge 
          variant="secondary" 
          className="text-xs px-1.5 py-0.5"
          style={{
            backgroundColor: statusColors?.[status]?.bgColor || (STATUS_COLORS[status]?.includes('bg-') ? STATUS_COLORS[status].split(' ')[0].replace('bg-', '#') : '#f3f4f6'),
            color: statusColors?.[status]?.textColor || '#374151'
          }}
        >
          {workflows.length}
        </Badge>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 sm:space-y-3 min-h-[300px] sm:min-h-[400px] ${
              snapshot.isDraggingOver ? 'bg-primary/10 border-2 border-primary/30 border-dashed rounded-lg' : ''
            }`}
          >
            {workflows.map((workflow, index) => (
              <Draggable 
                key={workflow.id} 
                draggableId={workflow.id} 
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
                    <ComponentCard 
                      workflow={workflow}
                      componentColor={componentColor}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
