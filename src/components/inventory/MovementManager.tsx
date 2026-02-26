import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ArrowRightLeft,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useInventoryMovements, type MovementType, type InventoryMovement } from '@/hooks/useInventoryMovements';
import { usePartsInventory, type PartInventory } from '@/hooks/usePartsInventory';
import { formatCurrency } from '@/lib/utils';
import { ENTRY_REASONS, EXIT_REASONS, WRITEOFF_REASONS } from '@/services/StockMovementService';
import type { StockAlert } from '@/services/StockAlertService';

interface MovementFormData {
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number;
  reason: string;
  notes: string;
  warehouse_location: string;
}

const MOVEMENT_TYPES = [
  { value: 'entrada' as MovementType, label: 'Entrada Manual', icon: ArrowUp, color: 'text-green-600' },
  { value: 'saida' as MovementType, label: 'Saída Manual', icon: ArrowDown, color: 'text-red-600' },
  { value: 'ajuste' as MovementType, label: 'Ajuste de Inventário', icon: RotateCcw, color: 'text-blue-600' },
  { value: 'transferencia' as MovementType, label: 'Transferência', icon: ArrowRightLeft, color: 'text-purple-600' },
  { value: 'baixa' as MovementType, label: 'Baixa/Descarte', icon: XCircle, color: 'text-red-700' },
];

const ADJUSTMENT_REASONS = [
  { code: 'AJU-001', label: 'Ajuste de inventário' },
  { code: 'AJU-002', label: 'Correção de sistema' },
  { code: 'AJU-003', label: 'Contagem física' },
  { code: 'AJU-004', label: 'Outro' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-700',
  approved: 'bg-green-500/20 text-green-700',
  rejected: 'bg-red-500/20 text-red-700',
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

function translateStatus(status: string): string {
  return { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado' }[status] ?? status;
}

function translateMovementType(type: MovementType): string {
  return {
    entrada: 'Entrada',
    saida: 'Saída',
    ajuste: 'Ajuste',
    transferencia: 'Transferência',
    reserva: 'Reserva',
    baixa: 'Baixa',
  }[type] ?? type;
}

const DEFAULT_FORM: MovementFormData = {
  part_id: '',
  movement_type: 'entrada',
  quantity: 1,
  unit_cost: 0,
  reason: '',
  notes: '',
  warehouse_location: '',
};

export default function MovementManager() {
  const { movements, loading, fetchMovements, createMovement, fetchStockAlerts } = useInventoryMovements();
  const { parts, fetchParts } = usePartsInventory();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [formData, setFormData] = useState<MovementFormData>(DEFAULT_FORM);

  const loadData = useCallback(async () => {
    const alerts = await fetchStockAlerts();
    setStockAlerts(alerts as StockAlert[]);
    await fetchMovements();
    await fetchParts();
  }, [fetchStockAlerts, fetchMovements, fetchParts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = <K extends keyof MovementFormData>(field: K, value: MovementFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSelectedPart = (): PartInventory | undefined =>
    parts.find((p) => p.id === formData.part_id);

  const getReasonOptions = () => {
    switch (formData.movement_type) {
      case 'entrada':
        return ENTRY_REASONS;
      case 'saida':
        return EXIT_REASONS;
      case 'baixa':
        return WRITEOFF_REASONS;
      default:
        return ADJUSTMENT_REASONS;
    }
  };

  const validateForm = (): string | null => {
    if (!formData.part_id) return 'Selecione uma peça';
    if (formData.quantity <= 0) return 'Quantidade deve ser maior que zero';
    if (!formData.reason) return 'Informe o motivo da movimentação';

    const selectedPart = getSelectedPart();
    if (selectedPart && ['saida', 'baixa'].includes(formData.movement_type)) {
      if (formData.quantity > selectedPart.quantity) {
        return `Quantidade insuficiente. Disponível: ${selectedPart.quantity}`;
      }
    }
    return null;
  };

  const calculateMovementValue = (): number => formData.quantity * formData.unit_cost;

  const willRequireApproval = (): boolean => {
    const selectedPart = getSelectedPart();
    const movementValue = calculateMovementValue();

    if (formData.movement_type === 'entrada' && movementValue > 1000) return true;
    if (['saida', 'baixa'].includes(formData.movement_type)) {
      if (movementValue > 500) return true;
      if (selectedPart && selectedPart.quantity > 0) {
        return (formData.quantity / selectedPart.quantity) * 100 > 20;
      }
    }
    if (formData.movement_type === 'ajuste') return true;
    return false;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    const result = await createMovement({
      part_id: formData.part_id,
      movement_type: formData.movement_type,
      quantity:
        formData.movement_type === 'ajuste'
          ? formData.quantity
          : formData.quantity,
      unit_cost: formData.unit_cost || undefined,
      reason: formData.reason,
      notes: formData.notes || undefined,
      metadata: formData.warehouse_location
        ? { warehouse_location: formData.warehouse_location }
        : undefined,
    });

    if (result) {
      setShowCreateForm(false);
      setFormData(DEFAULT_FORM);
      await loadData();
    }
  };

  const dashboardStats = {
    total_movements: movements.length,
    pending_approval: movements.filter((m) => m.approval_status === 'pending').length,
    entries_today: movements.filter((m) => {
      const today = new Date().toDateString();
      return new Date(m.created_at).toDateString() === today && m.movement_type === 'entrada';
    }).length,
    exits_today: movements.filter((m) => {
      const today = new Date().toDateString();
      return (
        new Date(m.created_at).toDateString() === today &&
        ['saida', 'baixa'].includes(m.movement_type)
      );
    }).length,
    stock_alerts: stockAlerts.length,
    total_value_today: movements
      .filter((m) => {
        const today = new Date().toDateString();
        return new Date(m.created_at).toDateString() === today && m.approval_status === 'approved';
      })
      .reduce((sum, m) => sum + m.quantity * (m.unit_cost ?? 0), 0),
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: dashboardStats.total_movements, color: '' },
          { label: 'Aguardando', value: dashboardStats.pending_approval, color: 'text-yellow-600' },
          { label: 'Entradas Hoje', value: dashboardStats.entries_today, color: 'text-green-600' },
          { label: 'Saídas Hoje', value: dashboardStats.exits_today, color: 'text-red-600' },
          { label: 'Alertas', value: dashboardStats.stock_alerts, color: 'text-orange-600' },
          { label: 'Valor Hoje', value: formatCurrency(dashboardStats.total_value_today), color: 'text-blue-600', isString: true },
        ].map(({ label, value, color, isString }) => (
          <Card key={label}>
            <CardContent className="p-3 sm:p-4 text-center">
              <p className={`text-lg sm:text-2xl font-bold truncate ${color}`}>
                {isString ? value : value}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stockAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium text-sm">Alertas de Estoque Baixo:</p>
              {stockAlerts.slice(0, 3).map((alert) => (
                <p key={alert.id} className="text-xs sm:text-sm">
                  • {alert.part_name} — Estoque: {alert.current_stock} (Mín: {alert.minimum_stock})
                </p>
              ))}
              {stockAlerts.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  ... e mais {stockAlerts.length - 3} alertas
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Movimentações de Estoque</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie entradas, saídas e ajustes manuais
          </p>
        </div>

        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Movimentação de Estoque</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <Label>Tipo de Movimentação <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.movement_type}
                  onValueChange={(value) => {
                    handleInputChange('movement_type', value as MovementType);
                    handleInputChange('reason', '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Peça <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.part_id}
                  onValueChange={(value) => handleInputChange('part_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma peça" />
                  </SelectTrigger>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id}>
                        <div className="flex justify-between items-center w-full gap-2">
                          <span className="truncate">{part.part_name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            Estoque: {part.quantity}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {getSelectedPart() && (
                <Card>
                  <CardContent className="p-3">
                    <div className="text-xs sm:text-sm grid grid-cols-2 gap-1">
                      <span className="text-muted-foreground">Peça:</span>
                      <span className="font-medium truncate">{getSelectedPart()?.part_name}</span>
                      <span className="text-muted-foreground">Código:</span>
                      <span>{getSelectedPart()?.part_code ?? 'N/A'}</span>
                      <span className="text-muted-foreground">Estoque Atual:</span>
                      <span className="font-medium">{getSelectedPart()?.quantity}</span>
                      <span className="text-muted-foreground">Custo Unit.:</span>
                      <span>{formatCurrency(getSelectedPart()?.unit_cost ?? 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade <span className="text-red-500">*</span></Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleInputChange('quantity', Math.max(1, formData.quantity - 1))}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange('quantity', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-16 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleInputChange('quantity', formData.quantity + 1)}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Custo Unitário</Label>
                  <Input
                    type="text"
                    value={formData.unit_cost.toString()}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                      handleInputChange('unit_cost', Math.max(0, parseFloat(raw) || 0));
                    }}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <Label>Motivo <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => handleInputChange('reason', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getReasonOptions().map((r) => (
                      <SelectItem key={r.code} value={`${r.code} — ${r.label}`}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{r.code}</span>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Localização no Estoque</Label>
                <Input
                  value={formData.warehouse_location}
                  onChange={(e) => handleInputChange('warehouse_location', e.target.value)}
                  placeholder="Ex: Prateleira A1, Setor B"
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              <Card>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor da Movimentação:</span>
                    <span className="font-semibold">{formatCurrency(calculateMovementValue())}</span>
                  </div>
                  {willRequireApproval() && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Esta movimentação requer aprovação de supervisor.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Movimentação'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {movements.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-base font-medium mb-1">Nenhuma movimentação encontrada</p>
                <p className="text-sm text-muted-foreground">Crie sua primeira movimentação de estoque</p>
              </div>
            ) : (
              movements.slice(0, 10).map((movement: InventoryMovement) => {
                const approvalStatus = (movement.approval_status ?? 'approved') as string;
                const StatusIcon = STATUS_ICONS[approvalStatus] ?? Clock;
                const movementTypeCfg = MOVEMENT_TYPES.find((t) => t.value === movement.movement_type);
                const MovementIcon = movementTypeCfg?.icon ?? Package;

                return (
                  <div
                    key={movement.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 border rounded-lg gap-2"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                      <MovementIcon
                        className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 ${movementTypeCfg?.color ?? 'text-gray-500'}`}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{movement.part_name ?? 'Peça'}</p>
                        <p className="text-xs text-muted-foreground">
                          {translateMovementType(movement.movement_type as MovementType)} — {movement.quantity} unid.
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {movement.reason} · {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="h-3.5 w-3.5" />
                        <Badge
                          className={`text-xs ${STATUS_COLORS[approvalStatus] ?? 'bg-gray-100'}`}
                        >
                          {translateStatus(approvalStatus)}
                        </Badge>
                      </div>
                      {movement.unit_cost != null && (
                        <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                          {formatCurrency(movement.quantity * movement.unit_cost)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
