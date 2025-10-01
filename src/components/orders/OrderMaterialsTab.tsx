import React from 'react';
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderMaterials } from '@/hooks/useOrderMaterials';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface OrderMaterialsTabProps {
  orderId: string;
}

const STATUS_CONFIG = {
  reserved: { label: 'Reservado', color: 'bg-blue-100 text-blue-800', icon: Clock },
  partial: { label: 'Parcial', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  separated: { label: 'Separado', color: 'bg-purple-100 text-purple-800', icon: Package },
  applied: { label: 'Aplicado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  used: { label: 'Utilizado', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
};

export function OrderMaterialsTab({ orderId }: OrderMaterialsTabProps) {
  const { materials, loading, markAsSeparated, markAsApplied } = useOrderMaterials(orderId);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const handleMarkAsSeparated = async (reservationId: string) => {
    setProcessingId(reservationId);
    const user = await supabase.auth.getUser();
    await markAsSeparated(reservationId, user.data.user?.id || '');
    setProcessingId(null);
  };

  const handleMarkAsApplied = async (reservationId: string) => {
    setProcessingId(reservationId);
    const user = await supabase.auth.getUser();
    await markAsApplied(reservationId, user.data.user?.id || '');
    setProcessingId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTotalCost = () => {
    return materials.reduce((sum, material) => sum + material.total_cost, 0);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum material encontrado</h3>
          <p className="text-muted-foreground text-center">
            Os materiais reservados e utilizados aparecerão aqui após a aprovação do orçamento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalCost())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                materials.reduce((acc, m) => {
                  acc[m.status] = (acc[m.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="text-xs">
                  {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Materiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materiais Reservados e Utilizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => {
                const statusConfig = STATUS_CONFIG[material.status];
                const StatusIcon = statusConfig?.icon || Package;
                
                return (
                  <TableRow key={material.id}>
                    <TableCell className="font-mono text-sm">{material.part_code}</TableCell>
                    <TableCell className="font-medium">{material.part_name}</TableCell>
                    <TableCell className="text-right">{material.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(material.unit_cost)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(material.total_cost)}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig?.label || material.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {material.applied_at
                        ? format(new Date(material.applied_at), 'dd/MM/yyyy', { locale: ptBR })
                        : material.separated_at
                        ? format(new Date(material.separated_at), 'dd/MM/yyyy', { locale: ptBR })
                        : material.reserved_at
                        ? format(new Date(material.reserved_at), 'dd/MM/yyyy', { locale: ptBR })
                        : material.used_at
                        ? format(new Date(material.used_at), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {material.source === 'reservation' && (
                        <div className="flex gap-2">
                          {material.status === 'reserved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsSeparated(material.id)}
                              disabled={processingId === material.id}
                            >
                              {processingId === material.id ? 'Processando...' : 'Separar'}
                            </Button>
                          )}
                          {material.status === 'separated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsApplied(material.id)}
                              disabled={processingId === material.id}
                            >
                              {processingId === material.id ? 'Processando...' : 'Aplicar'}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {materials.some(m => m.notes) && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Observações:</h4>
              {materials
                .filter(m => m.notes)
                .map(m => (
                  <div key={m.id} className="text-sm text-muted-foreground">
                    <span className="font-medium">{m.part_name}:</span> {m.notes}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

