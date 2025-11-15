import React, { useRef, useMemo } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTableWidth } from '@/hooks/useTableWidth';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  mobileLabel?: string; // Label para exibir em mobile
  hideInMobile?: boolean; // Ocultar esta coluna em mobile
  priority?: number; // Prioridade da coluna (1 = mais importante, maior número = menos importante). Colunas sem priority são consideradas menos importantes
  minWidth?: number; // Largura mínima estimada da coluna em pixels
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveTableColumn<T>[];
  renderMobileCard?: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  renderMobileCard,
  keyExtractor,
  emptyMessage = 'Nenhum item encontrado',
  className = ''
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useBreakpoint();
  const tableRef = useRef<HTMLDivElement>(null);
  const tableWidth = useTableWidth(tableRef);

  // Calcular quais colunas mostrar baseado na largura disponível
  const visibleColumns = useMemo(() => {
    if (isMobile || isTablet) {
      // Em mobile/tablet, usar a lógica existente
      return columns.filter(col => !col.hideInMobile);
    }

    // Em desktop, calcular baseado na largura disponível
    if (tableWidth === 0) {
      // Ainda não temos a largura, mostrar todas
      return columns;
    }

    // Ordenar colunas por prioridade (menor número = maior prioridade)
    const sortedColumns = [...columns].sort((a, b) => {
      const priorityA = a.priority ?? 999; // Colunas sem priority são menos importantes
      const priorityB = b.priority ?? 999;
      return priorityA - priorityB;
    });

    // Calcular largura mínima necessária
    const minColumnWidth = 100; // Largura mínima padrão
    let totalWidth = 0;
    const visible: typeof columns = [];

    for (const column of sortedColumns) {
      const columnWidth = column.minWidth ?? minColumnWidth;
      if (totalWidth + columnWidth <= tableWidth) {
        visible.push(column);
        totalWidth += columnWidth;
      } else {
        // Não há espaço para mais colunas
        break;
      }
    }

    // Garantir que pelo menos uma coluna seja mostrada
    if (visible.length === 0 && columns.length > 0) {
      return [columns[0]];
    }

    // Manter a ordem original das colunas visíveis
    return columns.filter(col => visible.includes(col));
  }, [columns, tableWidth, isMobile, isTablet]);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Renderização mobile/tablet como cards
  if (isMobile || isTablet) {
    // Se houver renderização customizada, usar ela
    if (renderMobileCard) {
      return (
        <div className={`space-y-3 ${className}`}>
          {data.map((item) => (
            <Card key={keyExtractor(item)}>
              <CardContent className="p-4">
                {renderMobileCard(item)}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Renderização padrão: mostrar colunas como linhas
    return (
      <div className={`space-y-2 sm:space-y-3 ${className}`}>
        {data.map((item) => (
          <Card key={keyExtractor(item)}>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-1.5 sm:space-y-2">
                {visibleColumns.map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-2">
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground min-w-[80px] sm:min-w-[100px]">
                        {column.mobileLabel || column.header}:
                      </span>
                      <div className="text-xs sm:text-sm text-right flex-1 break-words">
                        {column.render(item)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Renderização desktop como tabela normal
  return (
    <div ref={tableRef} className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.key} className="text-xs sm:text-sm font-medium py-2 px-2 sm:px-4">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={keyExtractor(item)}>
              {visibleColumns.map((column) => (
                <TableCell key={column.key} className="text-xs sm:text-sm py-2 px-2 sm:px-4">
                  {column.render(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

