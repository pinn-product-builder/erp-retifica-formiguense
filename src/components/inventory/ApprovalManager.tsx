import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ArrowRightLeft,
  Package,
  User,
  Calendar
} from 'lucide-react';
import { useInventoryMovements, InventoryMovement, MovementType } from '@/hooks/useInventoryMovements';
import { formatCurrency } from '@/lib/utils';

const MOVEMENT_ICONS = {
  entrada: ArrowUp,
  saida: ArrowDown,
  ajuste: RotateCcw,
  transferencia: ArrowRightLeft,
  reserva: Package,
  baixa: XCircle,
};

const MOVEMENT_COLORS = {
  entrada: 'text-green-600',
  saida: 'text-red-600',
  ajuste: 'text-blue-600',
  transferencia: 'text-purple-600',
  reserva: 'text-orange-600',
  baixa: 'text-red-700',
};

const translateMovementType = (type: MovementType) => {
  const typeTranslations: Record<MovementType, string> = {
    entrada: 'Entrada',
    saida: 'Saída',
    ajuste: 'Ajuste',
    transferencia: 'Transferência',
    reserva: 'Reserva',
    baixa: 'Baixa',
  };
  return typeTranslations[type] || type;
};

export default function ApprovalManager() {
  const { 
    loading, 
    fetchPendingApprovals, 
    approveMovement, 
    rejectMovement,
    fetchMovements
  } = useInventoryMovements();
  
  const [pendingMovements, setPendingMovements] = useState<InventoryMovement[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    const pending = await fetchPendingApprovals();
    setPendingMovements(pending);
  };

  const handleApprove = async (movementId: string) => {
    const success = await approveMovement(movementId);
    if (success) {
      await loadPendingApprovals();
    }
  };

  const handleRejectClick = (movement: InventoryMovement) => {
    setSelectedMovement(movement);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedMovement || !rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    const success = await rejectMovement(selectedMovement.id, rejectionReason);
    if (success) {
      setShowRejectDialog(false);
      setSelectedMovement(null);
      setRejectionReason('');
      await loadPendingApprovals();
    }
  };

  const getApprovalReason = (movement: InventoryMovement) => {
    const reasons = [];
    const movementValue = movement.quantity * (movement.unit_cost || 0);
    
    if (movement.movement_type === 'entrada' && movementValue > 1000) {
      reasons.push(`Entrada > R$ 1.000 (${formatCurrency(movementValue)})`);
    }
    
    if (['saida', 'baixa'].includes(movement.movement_type)) {
      if (movementValue > 500) {
        reasons.push(`Valor > R$ 500 (${formatCurrency(movementValue)})`);
      }
      if (movement.part?.quantity && movement.part.quantity > 0) {
        const percentage = (movement.quantity / movement.part.quantity) * 100;
        if (percentage > 20) {
          reasons.push(`> 20% do estoque (${percentage.toFixed(1)}%)`);
        }
      }
    }
    
    if (movement.movement_type === 'ajuste') {
      reasons.push('Ajuste de inventário');
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Requer aprovação';
  };

  const getImpactAnalysis = (movement: InventoryMovement) => {
    const currentStock = movement.part?.quantity || 0;
    const minStock = movement.part?.min_stock || 0;
    let newStock = currentStock;

    switch (movement.movement_type) {
      case 'entrada':
        newStock = currentStock + movement.quantity;
        break;
      case 'saida':
      case 'baixa':
      case 'transferencia':
        newStock = currentStock - movement.quantity;
        break;
      case 'ajuste':
        newStock = currentStock + movement.quantity; // quantity can be negative for adjustments
        break;
    }

    const willBeBelowMin = newStock < minStock;
    const willBeNegative = newStock < 0;

    return {
      currentStock,
      newStock,
      minStock,
      willBeBelowMin,
      willBeNegative,
    };
  };

  const getDashboardStats = () => {
    const stats = {
      total_pending: pendingMovements.length,
      high_value: pendingMovements.filter(m => {
        const value = m.quantity * (m.unit_cost || 0);
        return value > 1000;
      }).length,
      stock_impact: pendingMovements.filter(m => {
        const impact = getImpactAnalysis(m);
        return impact.willBeBelowMin || impact.willBeNegative;
      }).length,
      total_value: pendingMovements.reduce((sum, m) => 
        sum + (m.quantity * (m.unit_cost || 0)), 0
      ),
      oldest_pending: pendingMovements.length > 0 ? 
        Math.max(...pendingMovements.map(m => 
          Math.floor((Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24))
        )) : 0,
    };

    return stats;
  };

  const stats = getDashboardStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando aprovações pendentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.total_pending}</p>
              <p className="text-sm text-muted-foreground">Aguardando Aprovação</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.high_value}</p>
              <p className="text-sm text-muted-foreground">Alto Valor</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.stock_impact}</p>
              <p className="text-sm text-muted-foreground">Impacto no Estoque</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.total_value)}</p>
              <p className="text-sm text-muted-foreground">Valor Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.oldest_pending}</p>
              <p className="text-sm text-muted-foreground">Dias (Mais Antiga)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Aprovações Pendentes</h2>
        <p className="text-muted-foreground">
          Revise e aprove movimentações que requerem autorização
        </p>
      </div>

      {/* Pending Movements */}
      <div className="space-y-4">
        {pendingMovements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium mb-2">Nenhuma aprovação pendente</p>
              <p className="text-muted-foreground">
                Todas as movimentações estão aprovadas ou não requerem aprovação
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingMovements.map((movement) => {
            const MovementIcon = MOVEMENT_ICONS[movement.movement_type] || Package;
            const movementColor = MOVEMENT_COLORS[movement.movement_type] || 'text-gray-500';
            const impact = getImpactAnalysis(movement);
            const movementValue = movement.quantity * (movement.unit_cost || 0);
            const daysAgo = Math.floor((Date.now() - new Date(movement.created_at).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <Card key={movement.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <MovementIcon className={`h-6 w-6 ${movementColor}`} />
                        <div>
                          <h3 className="font-semibold text-lg">
                            {translateMovementType(movement.movement_type)} - {movement.part?.part_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {movement.quantity} unidades • {movement.reason}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {daysAgo === 0 ? 'Hoje' : `${daysAgo} dia${daysAgo > 1 ? 's' : ''}`}
                        </Badge>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="space-y-2">
                        <p><strong>Solicitante:</strong> {movement.created_by_user?.name || 'N/A'}</p>
                        <p><strong>Data:</strong> {new Date(movement.created_at).toLocaleDateString()}</p>
                        <p><strong>Código da Peça:</strong> {movement.part?.part_code || 'N/A'}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p><strong>Estoque Atual:</strong> {impact.currentStock} unidades</p>
                        <p><strong>Estoque Após:</strong> {impact.newStock} unidades</p>
                        <p><strong>Estoque Mínimo:</strong> {impact.minStock} unidades</p>
                      </div>
                      
                      <div className="space-y-2">
                        <p><strong>Valor Unitário:</strong> {formatCurrency(movement.unit_cost || 0)}</p>
                        <p><strong>Valor Total:</strong> {formatCurrency(movementValue)}</p>
                        <p><strong>Motivo da Aprovação:</strong></p>
                        <p className="text-xs text-muted-foreground">{getApprovalReason(movement)}</p>
                      </div>
                    </div>

                    {/* Alerts */}
                    {(impact.willBeNegative || impact.willBeBelowMin) && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {impact.willBeNegative && (
                              <p>⚠️ Esta movimentação resultará em estoque negativo!</p>
                            )}
                            {impact.willBeBelowMin && !impact.willBeNegative && (
                              <p>⚠️ Esta movimentação deixará o estoque abaixo do mínimo!</p>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Notes */}
                    {movement.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm"><strong>Observações:</strong></p>
                        <p className="text-sm text-muted-foreground">{movement.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        onClick={() => handleApprove(movement.id)}
                        disabled={loading}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      
                      <Button 
                        variant="destructive"
                        onClick={() => handleRejectClick(movement)}
                        disabled={loading}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Movimentação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedMovement && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">
                  {translateMovementType(selectedMovement.movement_type)} - {selectedMovement.part?.part_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedMovement.quantity} unidades • {selectedMovement.reason}
                </p>
              </div>
            )}

            <div>
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique o motivo da rejeição desta movimentação..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectConfirm}
                disabled={loading || !rejectionReason.trim()}
              >
                {loading ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
