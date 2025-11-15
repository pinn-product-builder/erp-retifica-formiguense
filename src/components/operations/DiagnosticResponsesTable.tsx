import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, ClipboardList } from 'lucide-react';
import { translateStatus } from '@/utils/statusTranslations';
import { ResponsiveTable } from '@/components/ui/responsive-table';

export interface DiagnosticRow {
  id: string;
  order_id: string;
  component: string;
  status: 'pending' | 'completed' | 'approved';
  diagnosed_at: string;
  diagnosed_by: string;
  diagnosed_by_name?: string;
  order?: {
    order_number: string;
    customer?: { name: string };
    engine?: { type: string; brand: string; model: string };
  };
  checklist?: { name: string };
}

interface DiagnosticResponsesTableProps {
  responses: DiagnosticRow[];
  onViewDetails: (row: DiagnosticRow) => void;
  onResumeDiagnostic: (orderId: string) => void;
}

const StatusBadge: React.FC<{ status: DiagnosticRow['status'] }> = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
  } as const;
  return (
    <Badge className={`text-xs ${colors[status] as string}`}>{translateStatus(status, 'diagnostic')}</Badge>
  );
};

export function DiagnosticResponsesTable({ responses, onViewDetails, onResumeDiagnostic }: DiagnosticResponsesTableProps) {
  return (
    <ResponsiveTable
      data={responses}
      keyExtractor={(response) => response.id}
      emptyMessage="Nenhum diagnóstico encontrado"
      columns={[
        {
          key: 'order',
          header: 'Ordem',
          mobileLabel: 'Ordem',
          priority: 1,
          minWidth: 100,
          render: (response) => (
            <span className="font-medium text-xs sm:text-sm">{response.order?.order_number || 'N/A'}</span>
          )
        },
        {
          key: 'customer',
          header: 'Cliente',
          mobileLabel: 'Cliente',
          priority: 2,
          minWidth: 150,
          render: (response) => <span className="text-xs sm:text-sm">{response.order?.customer?.name || 'N/A'}</span>
        },
        {
          key: 'engine',
          header: 'Motor',
          mobileLabel: 'Motor',
          priority: 4,
          minWidth: 150,
          hideInMobile: true,
          render: (response) => (
            <div className="text-xs sm:text-sm">
              <div className="font-medium">{response.order?.engine?.brand || 'N/A'}</div>
              <div className="text-muted-foreground">{response.order?.engine?.model || 'N/A'}</div>
            </div>
          )
        },
        {
          key: 'component',
          header: 'Componente',
          mobileLabel: 'Componente',
          priority: 3,
          minWidth: 120,
          render: (response) => (
            <Badge variant="outline" className="text-xs">{response.component}</Badge>
          )
        },
        {
          key: 'checklist',
          header: 'Checklist',
          mobileLabel: 'Checklist',
          priority: 5,
          minWidth: 150,
          hideInMobile: true,
          render: (response) => (
            <span className="text-xs sm:text-sm max-w-xs truncate block">{response.checklist?.name || 'N/A'}</span>
          )
        },
        {
          key: 'status',
          header: 'Status',
          mobileLabel: 'Status',
          priority: 2,
          minWidth: 100,
          render: (response) => <StatusBadge status={response.status} />
        },
        {
          key: 'diagnosed_by',
          header: 'Diagnosticado por',
          mobileLabel: 'Por',
          priority: 6,
          minWidth: 120,
          hideInMobile: true,
          render: (response) => <span className="text-xs sm:text-sm">{response.diagnosed_by_name || response.diagnosed_by || 'N/A'}</span>
        },
        {
          key: 'diagnosed_at',
          header: 'Data',
          mobileLabel: 'Data',
          priority: 5,
          minWidth: 100,
          hideInMobile: true,
          render: (response) => (
            <span className="text-xs sm:text-sm">
              {new Date(response.diagnosed_at).toLocaleDateString('pt-BR')}
            </span>
          )
        },
        {
          key: 'actions',
          header: 'Ações',
          mobileLabel: 'Ações',
          priority: 1,
          minWidth: 120,
          render: (response) => (
            <div className="flex gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" onClick={() => onViewDetails(response)} title="Ver Detalhes">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>
              {response.status === 'pending' && (
                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" onClick={() => onResumeDiagnostic(response.order_id)} title="Retomar">
                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>
          )
        }
      ]}
    />
  );
}


