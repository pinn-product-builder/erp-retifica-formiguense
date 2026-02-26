import React, { useState } from 'react';
import { Package, CheckCircle, Clock, AlertCircle, RotateCcw, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderMaterials } from '@/hooks/useOrderMaterials';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { ConsumptionService } from '@/services/ConsumptionService';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

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
  const { materials, loading, markAsSeparated, markAsApplied, fetchMaterials } = useOrderMaterials(orderId);
  const { currentOrganization } = useOrganization();
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Estorno de consumo (US-036 AC05)
  const [reversalTarget, setReversalTarget] = useState<{ id: string; name: string } | null>(null);
  const [reversalReason,  setReversalReason]  = useState('');
  const [reversing, setReversing] = useState(false);

  // Consumo direto (US-036 AC01 - fora de reserva)
  const [showDirectConsumption, setShowDirectConsumption] = useState(false);
  const [directForm, setDirectForm] = useState({ partCode: '', partName: '', quantity: 1, notes: '' });
  const [addingDirect, setAddingDirect] = useState(false);

  const handleReversal = async () => {
    if (!reversalTarget || !reversalReason.trim() || !currentOrganization?.id) return;
    setReversing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await ConsumptionService.reverseConsumption({
        orgId:      currentOrganization.id,
        movementId: reversalTarget.id,
        quantity:   1,
        reversedBy: user?.id ?? '',
        reason:     reversalReason,
      });
      toast.success('Estorno registrado com sucesso');
      setReversalTarget(null);
      setReversalReason('');
      fetchMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao estornar consumo');
    } finally {
      setReversing(false);
    }
  };

  const handleDirectConsumption = async () => {
    if (!currentOrganization?.id || !directForm.partCode.trim() || !directForm.partName.trim()) return;
    setAddingDirect(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await ConsumptionService.recordDirectConsumption({
        orgId:      currentOrganization.id,
        orderId,
        partId:     directForm.partCode,
        partCode:   directForm.partCode,
        partName:   directForm.partName,
        quantity:   directForm.quantity,
        consumedBy: user?.id ?? '',
        notes:      directForm.notes || undefined,
      });
      toast.success('Consumo registrado com sucesso');
      setShowDirectConsumption(false);
      setDirectForm({ partCode: '', partName: '', quantity: 1, notes: '' });
      fetchMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar consumo');
    } finally {
      setAddingDirect(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materiais Reservados e Utilizados
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowDirectConsumption(true)} className="h-8 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Apontamento direto
            </Button>
          </div>
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
                      <div className="flex gap-1.5 flex-wrap">
                        {material.source === 'reservation' && (
                          <>
                            {material.status === 'reserved' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleMarkAsSeparated(material.id)}
                                disabled={processingId === material.id}
                              >
                                {processingId === material.id ? 'Processando...' : 'Separar'}
                              </Button>
                            )}
                            {material.status === 'separated' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleMarkAsApplied(material.id)}
                                disabled={processingId === material.id}
                              >
                                {processingId === material.id ? 'Processando...' : 'Aplicar'}
                              </Button>
                            )}
                          </>
                        )}
                        {(material.status === 'applied' || material.status === 'used') && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground gap-1"
                            onClick={() => setReversalTarget({ id: material.id, name: material.part_name })}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Estornar
                          </Button>
                        )}
                      </div>
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

      {/* Modal de Estorno — US-036 AC05 */}
      <Dialog open={!!reversalTarget} onOpenChange={v => { if (!v) setReversalTarget(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <RotateCcw className="h-4 w-4" />
              Estornar Consumo — {reversalTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ao confirmar, a peça retornará ao estoque e o custo da OS será ajustado.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm">Justificativa <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Ex: Peça não utilizada, peça trocada por outra..."
                value={reversalReason}
                onChange={e => setReversalReason(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setReversalTarget(null)}>Cancelar</Button>
            <Button size="sm" variant="destructive"
              onClick={handleReversal}
              disabled={!reversalReason.trim() || reversing}
            >
              {reversing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Consumo Direto — US-036 AC01 */}
      <Dialog open={showDirectConsumption} onOpenChange={setShowDirectConsumption}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" />
              Apontamento de Consumo Direto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Registre o consumo de peças que não foram previamente reservadas para esta OS.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Código da Peça *</Label>
                <Input
                  value={directForm.partCode}
                  onChange={e => setDirectForm(f => ({ ...f, partCode: e.target.value }))}
                  placeholder="Ex: PART-001"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantidade *</Label>
                <Input
                  type="number"
                  min={1}
                  value={directForm.quantity}
                  onChange={e => setDirectForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Peça *</Label>
              <Input
                value={directForm.partName}
                onChange={e => setDirectForm(f => ({ ...f, partName: e.target.value }))}
                placeholder="Ex: Rolamento 6205"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea
                value={directForm.notes}
                onChange={e => setDirectForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Opcional..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDirectConsumption(false)}>Cancelar</Button>
            <Button size="sm"
              onClick={handleDirectConsumption}
              disabled={!directForm.partCode.trim() || !directForm.partName.trim() || directForm.quantity < 1 || addingDirect}
            >
              {addingDirect ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Registrar Consumo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

