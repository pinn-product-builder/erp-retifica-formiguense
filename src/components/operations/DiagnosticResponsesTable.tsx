import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, ClipboardList } from 'lucide-react';
import { translateStatus } from '@/utils/statusTranslations';

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
    <Badge className={colors[status] as string}>{translateStatus(status, 'diagnostic')}</Badge>
  );
};

export function DiagnosticResponsesTable({ responses, onViewDetails, onResumeDiagnostic }: DiagnosticResponsesTableProps) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum diagnóstico encontrado</p>
        <p className="text-sm">Tente ajustar os filtros ou iniciar um novo diagnóstico</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ordem</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Motor</TableHead>
          <TableHead>Componente</TableHead>
          <TableHead>Checklist</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Diagnosticado por</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {responses.map((response) => (
          <TableRow key={response.id}>
            <TableCell className="font-medium">{response.order?.order_number || 'N/A'}</TableCell>
            <TableCell>{response.order?.customer?.name || 'N/A'}</TableCell>
            <TableCell>
              <div className="text-sm">
                <div className="font-medium">{response.order?.engine?.brand || 'N/A'}</div>
                <div className="text-muted-foreground">{response.order?.engine?.model || 'N/A'}</div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{response.component}</Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">{response.checklist?.name || 'N/A'}</TableCell>
            <TableCell>
              <StatusBadge status={response.status} />
            </TableCell>
            <TableCell>{response.diagnosed_by_name || response.diagnosed_by || 'N/A'}</TableCell>
            <TableCell>{new Date(response.diagnosed_at).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onViewDetails(response)} title="Ver Detalhes">
                  <Eye className="w-4 h-4" />
                </Button>
                {response.status === 'pending' && (
                  <Button variant="ghost" size="sm" onClick={() => onResumeDiagnostic(response.order_id)} title="Retomar">
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


