// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Autocomplete, Chip, TextField, Stack, InputAdornment, IconButton } from '@mui/material';
import { KanbanColumn } from './KanbanColumn';
import { ComponentCard } from './ComponentCard';
import { OrderCard } from './OrderCard';
import { useWorkflowUpdate } from '@/hooks/useWorkflowUpdate';
import { useWorkflowStatusConfig, WorkflowStatusConfig, FIXED_WORKFLOW_STATUSES } from '@/hooks/useWorkflowStatusConfig';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { Badge } from '@/components/ui/badge';
import { useMuiTheme } from '@/config/muiTheme';
import { useEmployeesDirectory } from '@/hooks/useEmployeesDirectory';
import { useToast } from '@/hooks/use-toast';
import { Search, X } from 'lucide-react';

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
  const { updateWorkflowStatus, checkAndAdvanceOrderWorkflows } = useWorkflowUpdate();
  const { workflowStatuses, getStatusColors, getNextAllowedStatuses, prerequisites, loading } = useWorkflowStatusConfig();
  const { isMobile, isTablet } = useBreakpoint();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const { employees: employeeDirectory, loading: employeesLoading } = useEmployeesDirectory();
  const { toast } = useToast();
  const theme = useMuiTheme();
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
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

  const orderOptions = useMemo(() => {
    const uniqueOrders = new Set<string>();
    orders.forEach(order => {
      if (order.order_number) {
        uniqueOrders.add(String(order.order_number));
      }
    });
    return Array.from(uniqueOrders);
  }, [orders]);

  const statusConfigMap = useMemo(() => {
    return workflowStatuses.reduce((acc, status) => {
      acc[status.status_key] = status;
      return acc;
    }, {} as Record<string, WorkflowStatusConfig>);
  }, [workflowStatuses]);

  const statusOrder = useMemo(() => {
    const activeStatuses = workflowStatuses
      .filter(status => status.is_active)
      .sort((a, b) => a.display_order - b.display_order);

    const entryStatus = activeStatuses.find(status => status.status_key === 'entrada');
    const deliveredStatus = activeStatuses.find(status => status.status_key === 'entregue');
    const middleStatuses = activeStatuses
      .filter(status => !FIXED_WORKFLOW_STATUSES.includes(status.status_key as (typeof FIXED_WORKFLOW_STATUSES)[number]))
      .map(status => status.status_key);

    const orderedKeys: string[] = [];
    if (entryStatus) {
      orderedKeys.push(entryStatus.status_key);
    } else {
      orderedKeys.push('entrada');
    }

    middleStatuses.forEach(statusKey => {
      if (!orderedKeys.includes(statusKey)) {
        orderedKeys.push(statusKey);
      }
    });

    if (deliveredStatus) {
      orderedKeys.push(deliveredStatus.status_key);
    } else {
      orderedKeys.push('entregue');
    }

    return orderedKeys;
  }, [workflowStatuses]);

  const statusColors = getStatusColors();

  const employeeMap = useMemo(() => {
    return employeeDirectory.reduce<Record<string, string>>((acc, employee) => {
      acc[employee.id] = employee.full_name;
      return acc;
    }, {});
  }, [employeeDirectory]);

  // Função para obter cor do componente
  const getComponentColorById = (component: string) => {
    const componentData = COMPONENTS.find(c => c.id === component);
    return componentData?.color || getComponentColor(component);
  };

  // Organizar workflows por status - agrupar por OS ou mostrar por componente conforme configuração
  const organizeWorkflowsByStatus = () => {
    const workflowsByStatus: Record<string, Array<Record<string, unknown>>> = {};
    const normalizedOrderSearch = orderSearch.trim().toLowerCase();
    
    statusOrder.forEach(status => {
      workflowsByStatus[status] = [];
    });

    orders.forEach(order => {
      const matchesOrderFilter = !normalizedOrderSearch
        || String(order.order_number || '').toLowerCase().includes(normalizedOrderSearch);

      if (!matchesOrderFilter || !order.order_workflow || order.order_workflow.length === 0) {
        return;
      }

      // Agrupar workflows por status para esta OS
      const workflowsByStatusForOrder: Record<string, Array<Record<string, unknown>>> = {};
      
      order.order_workflow.forEach((workflow: any) => {
        const status = workflow.status;
        if (!status) return; // Ignorar workflows sem status
        
        if (!workflowsByStatusForOrder[status]) {
          workflowsByStatusForOrder[status] = [];
        }
        
        const workflowItem = {
          ...workflow,
          order: order,
          orderNumber: order.order_number,
          customerName: order.customers?.name,
          engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
          collectionDate: order.collection_date,
          componentColor: getComponentColorById(workflow.component),
          statusConfig: statusConfigMap[workflow.status],
          assignedEmployeeName: workflow.assignedEmployeeName || employeeMap[workflow.assigned_to] || workflow.assigned_to || null
        };
        
        workflowsByStatusForOrder[status].push(workflowItem);
      });

      // Para cada status que esta OS tem workflows, decidir como exibir
      Object.keys(workflowsByStatusForOrder).forEach(status => {
        // Garantir que o status existe no objeto workflowsByStatus
        if (!workflowsByStatus[status]) {
          workflowsByStatus[status] = [];
        }

        const statusConfig = statusConfigMap[status];
        const allowSplit = statusConfig?.allow_component_split === true;
        const workflowsForStatus = workflowsByStatusForOrder[status];

        if (allowSplit) {
          // Status permite split: mostrar cada componente separadamente
          // Filtrar por componentes selecionados se houver seleção
          const hasComponentFilter = selectedComponents.length > 0;
          workflowsForStatus.forEach((workflow: any) => {
            // Se há filtro de componentes, só incluir se o componente estiver selecionado
            if (hasComponentFilter && !selectedComponents.includes(workflow.component)) {
              return;
            }
            workflowsByStatus[status].push({
              ...workflow,
              type: 'component'
            });
          });
        } else {
          // Status não permite split: mostrar apenas um card por OS
          workflowsByStatus[status].push({
            type: 'order',
            order: order,
            orderId: order.id,
            workflows: workflowsForStatus,
            orderNumber: order.order_number,
            customerName: order.customers?.name,
            engineModel: order.engines ? `${order.engines.brand || ''} ${order.engines.model || ''}`.trim() : 'Motor não informado',
            collectionDate: order.collection_date,
            statusConfig: statusConfig
          });
        }
      });
    });

    // Ordenar por timestamp
    Object.keys(workflowsByStatus).forEach(statusKey => {
      workflowsByStatus[statusKey].sort((a, b) => {
        const getTimestamp = (item: Record<string, unknown>) => {
          if (item.type === 'order') {
            const workflows = item.workflows as Array<Record<string, unknown>>;
            if (workflows && workflows.length > 0) {
              const latest = workflows.reduce((latest: any, current: any) => {
                const latestTime = latest.updated_at || latest.started_at || latest.created_at;
                const currentTime = current.updated_at || current.started_at || current.created_at;
                return new Date(currentTime) > new Date(latestTime) ? current : latest;
              });
              return latest.updated_at || latest.started_at || latest.created_at 
                ? new Date(latest.updated_at || latest.started_at || latest.created_at).getTime() 
                : 0;
            }
            return 0;
          }
          const updated = item.updated_at || item.started_at || item.created_at;
          return updated ? new Date(updated as string).getTime() : 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });
    });

    return workflowsByStatus;
  };

  const handleDragEnd = async (result: unknown) => {
    if (!result.destination) {
      setIsDragging(false);
      return;
    }

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      setIsDragging(false);
      return;
    }

    setIsDragging(true);

    const currentStatus = source.droppableId;
    const newStatus = destination.droppableId;

    // Verificar se é um card de OS (começa com "order-")
    if (draggableId.startsWith('order-')) {
      const orderId = draggableId.replace('order-', '');
      
      // Buscar a OS e todos os seus workflows
      const order = orders.find((o: any) => o.id === orderId);
      if (!order || !order.order_workflow) {
        console.log('Order not found or no workflows:', orderId);
        return;
      }

      console.log('Moving order:', order.order_number, 'from', currentStatus, 'to', newStatus);
      console.log('Order workflows:', order.order_workflow);

      // Para OS agrupada, validar transição sem filtro de componente específico
      const allowedTransitions = getNextAllowedStatuses(currentStatus, undefined);
      
      console.log('Allowed transitions:', allowedTransitions);
      console.log('Prerequisites:', prerequisites);
      
      // Verificar se há pré-requisitos configurados no sistema
      const hasAnyPrerequisites = prerequisites && prerequisites.length > 0;
      
      let isTransitionAllowed = false;
      
      if (hasAnyPrerequisites) {
        // Há pré-requisitos no sistema: verificar se a transição específica está permitida
        if (allowedTransitions.length > 0) {
          isTransitionAllowed = allowedTransitions.some(
            transition => transition.to_status_key === newStatus
          );
        } else {
          // Há pré-requisitos no sistema, mas nenhum para este status específico
          isTransitionAllowed = false;
        }
      } else {
        // Não há pré-requisitos configurados no sistema: permitir qualquer transição
        isTransitionAllowed = true;
      }

      if (!isTransitionAllowed) {
        console.log('Transition not allowed');
        toast({
          title: "Transição não permitida",
          description: "Esta transição de status não é permitida pelas regras configuradas",
          variant: "destructive"
        });
        setIsDragging(false);
        return;
      }

      // Quando arrastar uma OS agrupada, mover TODOS os componentes da OS para o novo status
      const allWorkflowsInOrder = order.order_workflow || [];
      
      if (allWorkflowsInOrder.length === 0) {
        return;
      }

      console.log('Updating workflows:', allWorkflowsInOrder.map((w: any) => w.id));

      // Atualizar todos os workflows
      const updatePromises = allWorkflowsInOrder.map((workflow: any) =>
        updateWorkflowStatus(workflow.id, newStatus, 'OS movida para novo status')
      );

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(r => r === true);

      console.log('Update results:', results);

      if (allSuccess) {
        toast({
          title: "OS movida!",
          description: `${allWorkflowsInOrder.length} componente(s) movido(s) para ${newStatus}`,
        });
        onOrderUpdate();
      } else {
        toast({
          title: "Erro ao mover OS",
          description: "Alguns componentes não puderam ser movidos",
          variant: "destructive"
        });
      }
      
      setIsDragging(false);
      return;
    }

    // Se não é um card de OS, é um componente individual
    const workflowId = draggableId;

    // Validar se a transição é permitida pelos pré-requisitos
    const firstSelected = selectedComponents.length > 0 ? selectedComponents[0] : null;
    const allowedTransitions = getNextAllowedStatuses(currentStatus, firstSelected);
    
    // Verificar se há pré-requisitos configurados no sistema
    const hasAnyPrerequisites = prerequisites && prerequisites.length > 0;
    
    let isTransitionAllowed = false;
    
    if (hasAnyPrerequisites) {
      // Há pré-requisitos no sistema: verificar se a transição específica está permitida
      isTransitionAllowed = allowedTransitions.some(
        transition => transition.to_status_key === newStatus
      );
    } else {
      // Não há pré-requisitos configurados no sistema: permitir qualquer transição
      isTransitionAllowed = true;
    }

    if (!isTransitionAllowed) {
      toast({
        title: "Transição não permitida",
        description: "Esta transição de status não é permitida pelas regras configuradas",
        variant: "destructive"
      });
      setIsDragging(false);
      return;
    }

    // Buscar o workflow para obter order_id
    const workflow = orders
      .flatMap((o: any) => o.order_workflow || [])
      .find((w: any) => w.id === workflowId);

    if (!workflow) {
      return;
    }

    const success = await updateWorkflowStatus(workflowId, newStatus);
    
    if (success) {
      // Verificar se todos os componentes da OS estão finalizados e avançar automaticamente
      if (workflow.order_id) {
        await checkAndAdvanceOrderWorkflows(workflow.order_id, currentStatus);
      }
      
      onOrderUpdate();
    }
    
    setIsDragging(false);
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
    <div className="h-full flex flex-col relative">
      {/* Loading Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm font-medium">Movendo componentes...</p>
          </div>
        </div>
      )}
      
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 space-y-4 mb-6">
        {/* Filters */}
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Autocomplete
            multiple
            options={componentOptions}
            getOptionLabel={(option) => option.label}
            value={componentOptions.filter(opt => selectedComponents.includes(opt.value))}
            onChange={(_, newValue) => {
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
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.grey[900] 
                  : theme.palette.background.paper,
              }
            }}
          />

          <Autocomplete
            freeSolo
            options={orderOptions}
            value={orderSearch}
            onChange={(_, newValue) => setOrderSearch(newValue || '')}
            inputValue={orderSearch}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === 'reset') return;
              setOrderSearch(newInputValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar OS"
                placeholder="Digite o número da OS"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {orderSearch && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setOrderSearch('')}>
                            <X className="w-4 h-4" />
                          </IconButton>
                        </InputAdornment>
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
            sx={{
              flex: 1,
              minWidth: isMobile ? '100%' : 260,
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? theme.palette.grey[900] 
                  : theme.palette.background.paper,
              }
            }}
          />
        </Stack>

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
            Workflow - Ordens de Serviço
            {selectedComponents.length > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                ({selectedComponents.length} componente{selectedComponents.length > 1 ? 's' : ''} selecionado{selectedComponents.length > 1 ? 's' : ''})
              </span>
            )}
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
                    statusConfig={statusConfigMap[status]}
                    onUpdate={onOrderUpdate}
                    employeeOptions={employeeDirectory}
                    employeesLoading={employeesLoading}
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
