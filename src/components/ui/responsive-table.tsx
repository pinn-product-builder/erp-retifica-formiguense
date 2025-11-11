import React from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  mobileLabel?: string; // Label para exibir em mobile
  hideInMobile?: boolean; // Ocultar esta coluna em mobile
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
  const { isMobile } = useBreakpoint();

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Renderização mobile como cards
  if (isMobile) {
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
      <div className={`space-y-3 ${className}`}>
        {data.map((item) => (
          <Card key={keyExtractor(item)}>
            <CardContent className="p-4">
              <div className="space-y-2">
                {columns
                  .filter(col => !col.hideInMobile)
                  .map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground min-w-[100px]">
                        {column.mobileLabel || column.header}:
                      </span>
                      <div className="text-sm text-right flex-1">
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
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={keyExtractor(item)}>
              {columns.map((column) => (
                <TableCell key={column.key}>
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

