// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { KanbanColumn } from './KanbanColumn';
import { ComponentCard } from './ComponentCard';
import { useWorkflowUpdate } from '@/hooks/useWorkflowUpdate';
import { useWorkflowStatusConfig } from '@/hooks/useWorkflowStatusConfig';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { Badge } from '@/components/ui/badge';
import { useMuiTheme } from '@/config/muiTheme';

// Função para obter cor do componente
const getComponentColor = (componentId: string): string => {
  const colorMap: Record<string, string> = {
    'todos': 'bg-blue-500',
    'bloco': 'bg-green-500',
    'eixo': 'bg-orange-500',
    'biela': 'bg-yellow-500',
    'comando': 'bg-purple-500',
    'cabecote': 'bg-red-500',
    'virabrequim': 'bg-cyan-500',
    'pistao': 'bg-pink-500',
    'pistao_com_anel': 'bg-rose-500',
    'anel': 'bg-indigo-500',
    'camisas': 'bg-teal-500',
    'bucha_comando': 'bg-violet-500',
    'retentores_dianteiro': 'bg-blue-600',
    'retentores_traseiro': 'bg-blue-700',
    'pista_virabrequim': 'bg-sky-500',
    'selo_comando': 'bg-fuchsia-500',
    'gaxeta': 'bg-emerald-500',
    'selo_dagua': 'bg-amber-500',
    'borrachas_camisa': 'bg-lime-500',
    'calco_camisas': 'bg-green-600',
    'bujao_carter': 'bg-stone-500',
    'tubo_bloco': 'bg-gray-500'
  };
  return colorMap[componentId] || 'bg-gray-500';
};

// STATUS_ORDER será obtido dinamicamente das configurações

interface KanbanBoardProps {
  orders: Array<Record<string, unknown>>;
  onOrderUpdate: () => void;
}

export function KanbanBoard({ orders, onOrderUpdate }: KanbanBoardProps) {
  const { updateWorkflowStatus } = useWorkflowUpdate();
  const { workflowStatuses, getStatusColors, getNextAllowedStatuses, loading } = useWorkflowStatusConfig();
  const { isMobile, isTablet } = useBreakpoint();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const theme = useMuiTheme();
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  
  // Função para converter cor Tailwind para hex (simplificada - usa cores Material UI)
  const getColorHex = (tailwindColor: string): string => {
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

  // Construir lista de componentes (sem "todos", pois multiselect já permite selecionar todos)
  const COMPONENTS = useMemo(() => {
    return engineComponents.map(comp => ({
      id: comp.value,
      name: comp.label,
      color: getComponentColor(comp.value)
    }));
  }, [engineComponents]);

  // Opções para o Autocomplete (formato que Material UI espera)
  const componentOptions = useMemo(() => {
    return COMPONENTS.map(comp => ({
      value: comp.id,
      label: comp.name,
      color: getColorHex(comp.color)
    }));
  }, [COMPONENTS]);

  // Obter ordem dos status das configurações
  const statusOrder = workflowStatuses
    .filter(status => status.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map(status => status.status_key);

  const statusColors = getStatusColors();

  // Função para obter cor do componente
  const getComponentColorById = (component: string) => {
    const componentData = COMPONENTS.find(c => c.id === component);
    return componentData?.color || getComponentColor(component);
  };

  // Organizar workflows por status para os componentes selecionados
  const organizeWorkflowsByStatus = () => {
    const workflowsByStatus: Record<string, Array<Record<string, unknown>>> = {};
    
    statusOrder.forEach(status => {
      workflowsByStatus[status] = [];
    });

    const hasSelections = selectedComponents.length > 0;

    orders.forEach(order => {
      if (order.order_workflow) {
        if (!hasSelections) {
          // Nenhum componente selecionado = mostrar todos
          order.order_workflow.forEach((workflow: unknown) => {
            const workflowItem = {
              ...workflow,
              order: order,
              orderNumber: order.order_number,
              customerName: order.customers?.name,
              engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
              collectionDate: order.collection_date,
              componentColor: getComponentColorById(workflow.component)
            };
            
            workflowsByStatus[workflow.status]?.push(workflowItem);
          });
        } else {
          // Filtrar pelos componentes selecionados
          order.order_workflow.forEach((workflow: unknown) => {
            if (selectedComponents.includes(workflow.component)) {
              const workflowItem = {
                ...workflow,
                order: order,
                orderNumber: order.order_number,
                customerName: order.customers?.name,
                engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
                collectionDate: order.collection_date,
                componentColor: getComponentColorById(workflow.component)
              };
              
              workflowsByStatus[workflow.status]?.push(workflowItem);
            }
          });
        }
      }
    });

    return workflowsByStatus;
  };

  const handleDragEnd = async (result: unknown) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const workflowId = draggableId;
    const currentStatus = source.droppableId;
    const newStatus = destination.droppableId;

    // Validar se a transição é permitida pelos pré-requisitos
    // Para multiselect, usar o primeiro componente selecionado ou null
    const firstSelected = selectedComponents.length > 0 ? selectedComponents[0] : null;
    const allowedTransitions = getNextAllowedStatuses(currentStatus, firstSelected);
    const isTransitionAllowed = allowedTransitions.some(
      transition => transition.to_status_key === newStatus
    );

    if (!isTransitionAllowed) {
      // Mostrar toast de erro sobre transição não permitida
      return;
    }

    const success = await updateWorkflowStatus(workflowId, newStatus);
    
    if (success) {
      onOrderUpdate();
    }
  };

  const workflowsByStatus = organizeWorkflowsByStatus();
  
  // Para exibição no header: mostrar "Todos" se nenhum selecionado, ou lista dos selecionados
  const selectedComponentsLabels = useMemo(() => {
    if (selectedComponents.length === 0) {
      return ['Todos'];
    }
    return selectedComponents.map(id => {
      const comp = COMPONENTS.find(c => c.id === id);
      return comp?.name || id;
    });
  }, [selectedComponents, COMPONENTS]);

  const displayText = selectedComponents.length === 0 
    ? 'Todos' 
    : selectedComponents.length === 1
      ? selectedComponentsLabels[0]
      : `${selectedComponents.length} componentes`;

  const getKanbanGridCols = () => {
    const columnCount = statusOrder.length;
    if (isMobile) {
      return 'flex overflow-x-auto space-x-4 pb-4';
    }
    if (isTablet) {
      // Em tablet, mostra até 3 colunas lado a lado, depois quebra linha
      return `grid grid-cols-${Math.min(columnCount, 3)} gap-3`;
    }
    // Desktop: sempre lado a lado com scroll horizontal se necessário
    return `flex gap-4 overflow-x-auto pb-2`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 space-y-4 mb-6">
        {/* Component Selector - Material UI Autocomplete */}
        <div className="w-full">
          <Autocomplete
            multiple
            options={componentOptions}
            getOptionLabel={(option) => option.label}
            value={componentOptions.filter(opt => selectedComponents.includes(opt.value))}
            onChange={(event, newValue) => {
              setSelectedComponents(newValue.map(v => v.value));
            }}
            loading={componentsLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrar por Componentes"
                placeholder={selectedComponents.length === 0 ? "Selecione componentes (deixe vazio para Todos)" : "Componentes selecionados"}
                variant="outlined"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.label}
                    {...tagProps}
                    sx={{
                      backgroundColor: option.color,
                      color: 'white',
                      '& .MuiChip-deleteIcon': {
                        color: 'white'
                      }
                    }}
                  />
                );
              })
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.grey[900] 
                  : theme.palette.background.paper,
              }
            }}
          />
        </div>

        {/* Component Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
            Workflow - {displayText}
          </h2>
          <Badge variant="secondary" className={isMobile ? "text-xs" : ""}>
            {Object.values(workflowsByStatus).flat().length} itens
          </Badge>
        </div>
      </div>

      {/* Kanban Board - Scrollable */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">Carregando configurações...</div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className={`${getKanbanGridCols()} h-full`}>
              {statusOrder.map(status => (
                <div 
                  key={status} 
                  className={
                    isMobile 
                      ? 'min-w-[280px] flex-shrink-0' 
                      : isTablet 
                        ? 'h-full' 
                        : 'min-w-[300px] flex-shrink-0 h-full'
                  }
                >
                  <KanbanColumn
                    status={status}
                    workflows={workflowsByStatus[status] || []}
                    componentColor="bg-gray-500"
                    statusColors={statusColors}
                    onUpdate={onOrderUpdate}
                  />
                </div>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
