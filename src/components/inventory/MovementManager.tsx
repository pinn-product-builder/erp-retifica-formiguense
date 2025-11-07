// @ts-nocheck
import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import { useInventoryMovements, MovementType, InventoryMovement } from '@/hooks/useInventoryMovements';
import { usePartsInventory } from '@/hooks/usePartsInventory';
import { formatCurrency } from '@/lib/utils';

interface MovementFormData {
  part_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number;
  reason: string;
  notes?: string;
  warehouse_location?: string;
}

const MOVEMENT_TYPES = [
  { value: 'entrada', label: 'Entrada Manual', icon: ArrowUp, color: 'text-green-600' },
  { value: 'saida', label: 'Saída Manual', icon: ArrowDown, color: 'text-red-600' },
  { value: 'ajuste', label: 'Ajuste de Inventário', icon: RotateCcw, color: 'text-blue-600' },
  { value: 'transferencia', label: 'Transferência', icon: ArrowRightLeft, color: 'text-purple-600' },
  { value: 'baixa', label: 'Baixa/Descarte', icon: XCircle, color: 'text-red-700' },
] as const;

const ENTRY_REASONS = [
  'Devolução de cliente',
  'Devolução de fornecedor', 
  'Doação',
  'Encontrado (peça perdida)',
  'Ajuste de inventário',
  'Transferência de outra unidade',
  'Outro'
];

const EXIT_REASONS = [
  'Perda',
  'Quebra/Dano',
  'Vencido (validade expirada)',
  'Venda avulsa',
  'Doação',
  'Amostra/Teste',
  'Transferência para outra unidade',
  'Outro'
];

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-700',
  approved: 'bg-green-500/20 text-green-700',
  rejected: 'bg-red-500/20 text-red-700',
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

const translateStatus = (status: string) => {
  const statusTranslations: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  };
  return statusTranslations[status] || status;
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

export default function MovementManager() {
  const { 
    movements, 
    loading, 
    fetchMovements, 
    createMovement,
    fetchStockAlerts
  } = useInventoryMovements();
  
  const { parts, fetchParts } = usePartsInventory();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<Array<Record<string, unknown>>>([]);
  const [formData, setFormData] = useState<MovementFormData>({
    part_id: '',
    movement_type: 'entrada',
    quantity: 1,
    unit_cost: 0,
    reason: '',
    notes: '',
    warehouse_location: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchMovements(),
      fetchParts(),
      loadStockAlerts(),
    ]);
  };

  const loadStockAlerts = async () => {
    const alerts = await fetchStockAlerts();
    setStockAlerts(alerts);
  };

  const handleInputChange = (field: keyof MovementFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSelectedPart = () => {
    return parts.find(part => part.id === formData.part_id);
  };

  const getReasonOptions = () => {
    switch (formData.movement_type) {
      case 'entrada':
        return ENTRY_REASONS;
      case 'saida':
      case 'baixa':
        return EXIT_REASONS;
      default:
        return ['Ajuste de inventário', 'Correção de sistema', 'Outro'];
    }
  };

  const validateForm = () => {
    if (!formData.part_id) {
      return 'Selecione uma peça';
    }
    if (formData.quantity <= 0) {
      return 'Quantidade deve ser maior que zero';
    }
    if (!formData.reason) {
      return 'Informe o motivo da movimentação';
    }

    const selectedPart = getSelectedPart();
    if (selectedPart && ['saida', 'baixa'].includes(formData.movement_type)) {
      if (formData.quantity > selectedPart.quantity) {
        return `Quantidade insuficiente. Disponível: ${selectedPart.quantity}`;
      }
    }

    return null;
  };

  const calculateMovementValue = () => {
    return formData.quantity * (formData.unit_cost || 0);
  };

  const willRequireApproval = () => {
    const selectedPart = getSelectedPart();
    const movementValue = calculateMovementValue();
    
    if (formData.movement_type === 'entrada' && movementValue > 1000) {
      return true;
    }
    
    if (['saida', 'baixa'].includes(formData.movement_type)) {
      if (movementValue > 500) return true;
      if (selectedPart && selectedPart.quantity > 0) {
        const percentage = (formData.quantity / selectedPart.quantity) * 100;
        if (percentage > 20) return true;
      }
    }
    
    if (formData.movement_type === 'ajuste') {
      return true;
    }
    
    return false;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      const movementData = {
        part_id: formData.part_id,
        movement_type: formData.movement_type,
        quantity: formData.movement_type === 'ajuste' ? 
          (formData.quantity > 0 ? formData.quantity : -Math.abs(formData.quantity)) : 
          formData.quantity,
        unit_cost: formData.unit_cost || undefined,
        reason: formData.reason,
        notes: formData.notes || undefined,
        metadata: formData.warehouse_location ? { warehouse_location: formData.warehouse_location } : undefined,
      };

      const result = await createMovement(movementData);
      
      if (result) {
        setShowCreateForm(false);
        setFormData({
          part_id: '',
          movement_type: 'entrada',
          quantity: 1,
          unit_cost: 0,
          reason: '',
          notes: '',
          warehouse_location: '',
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error creating movement:', error);
    }
  };

  const getDashboardStats = () => {
    const stats = {
      total_movements: movements.length,
      pending_approval: movements.filter(m => m.approval_status === 'pending').length,
      entries_today: movements.filter(m => {
        const today = new Date().toDateString();
        const movementDate = new Date(m.created_at).toDateString();
        return movementDate === today && m.movement_type === 'entrada';
      }).length,
      exits_today: movements.filter(m => {
        const today = new Date().toDateString();
        const movementDate = new Date(m.created_at).toDateString();
        return movementDate === today && ['saida', 'baixa'].includes(m.movement_type);
      }).length,
      stock_alerts: stockAlerts.length,
      total_value_today: movements
        .filter(m => {
          const today = new Date().toDateString();
          const movementDate = new Date(m.created_at).toDateString();
          return movementDate === today && m.approval_status === 'approved';
        })
        .reduce((sum, m) => sum + (m.quantity * (m.unit_cost || 0)), 0),
    };

    return stats;
  };

  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total_movements}</p>
              <p className="text-sm text-muted-foreground">Total Movimentações</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_approval}</p>
              <p className="text-sm text-muted-foreground">Aguardando Aprovação</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.entries_today}</p>
              <p className="text-sm text-muted-foreground">Entradas Hoje</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.exits_today}</p>
              <p className="text-sm text-muted-foreground">Saídas Hoje</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.stock_alerts}</p>
              <p className="text-sm text-muted-foreground">Alertas de Estoque</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.total_value_today)}</p>
              <p className="text-sm text-muted-foreground">Valor Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Alertas de Estoque Baixo:</p>
              {stockAlerts.slice(0, 3).map((alert, index) => (
                <p key={index} className="text-sm">
                  • {alert.part?.part_name} - Estoque: {alert.current_stock} (Mín: {alert.min_stock})
                </p>
              ))}
              {stockAlerts.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  ... e mais {stockAlerts.length - 3} alertas
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Movimentações de Estoque</h2>
          <p className="text-muted-foreground">Gerencie entradas, saídas e ajustes manuais</p>
        </div>

        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Movimentação de Estoque</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Movement Type */}
              <div>
                <Label>Tipo de Movimentação *</Label>
                <Select 
                  value={formData.movement_type} 
                  onValueChange={(value) => handleInputChange('movement_type', value as MovementType)}
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

              {/* Part Selection */}
              <div>
                <Label>Peça *</Label>
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
                        <div className="flex justify-between items-center w-full">
                          <span>{part.part_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            Estoque: {part.quantity}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Part Info */}
              {getSelectedPart() && (
                <Card>
                  <CardContent className="p-3">
                    <div className="text-sm space-y-1">
                      <p><strong>Peça:</strong> {getSelectedPart()?.part_name}</p>
                      <p><strong>Código:</strong> {getSelectedPart()?.part_code || 'N/A'}</p>
                      <p><strong>Estoque Atual:</strong> {getSelectedPart()?.quantity}</p>
                      <p><strong>Custo Unitário:</strong> {formatCurrency(getSelectedPart()?.unit_cost || 0)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quantity and Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantidade *</Label>
                  <Input
                    type="text"
                    value={formData.quantity.toString()}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^\d]/g, '');
                      const quantity = numericValue ? parseInt(numericValue) : 1;
                      handleInputChange('quantity', Math.max(1, quantity));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Custo Unitário</Label>
                  <Input
                    type="text"
                    value={formData.unit_cost.toString()}
                    onChange={(e) => {
                      // Permitir vírgula como separador decimal
                      let numericValue = e.target.value.replace(/[^\d.,]/g, '');
                      if (numericValue.includes(',')) {
                        numericValue = numericValue.replace(',', '.');
                      }
                      const cost = parseFloat(numericValue) || 0;
                      handleInputChange('unit_cost', Math.max(0, cost));
                    }}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label>Motivo *</Label>
                <Select 
                  value={formData.reason} 
                  onValueChange={(value) => handleInputChange('reason', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {getReasonOptions().map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warehouse Location */}
              <div>
                <Label>Localização no Estoque</Label>
                <Input
                  value={formData.warehouse_location}
                  onChange={(e) => handleInputChange('warehouse_location', e.target.value)}
                  placeholder="Ex: Prateleira A1, Setor B"
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais sobre a movimentação..."
                  rows={3}
                />
              </div>

              {/* Movement Summary */}
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Valor da Movimentação:</span>
                    <span className="font-semibold">{formatCurrency(calculateMovementValue())}</span>
                  </div>
                  {willRequireApproval() && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Esta movimentação requer aprovação de supervisor.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
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

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Nenhuma movimentação encontrada</p>
                <p className="text-muted-foreground">Crie sua primeira movimentação de estoque</p>
              </div>
            ) : (
              movements.slice(0, 10).map((movement) => {
                const StatusIcon = STATUS_ICONS[movement.approval_status as keyof typeof STATUS_ICONS] || Clock;
                const movementType = MOVEMENT_TYPES.find(t => t.value === movement.movement_type);
                const MovementIcon = movementType?.icon || Package;

                return (
                  <div key={movement.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MovementIcon className={`h-5 w-5 ${movementType?.color || 'text-gray-500'}`} />
                      <div>
                        <p className="font-medium">{movement.part_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {translateMovementType(movement.movement_type)} - {movement.quantity} unidades
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movement.reason} • {new Date(movement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className="h-4 w-4" />
                        <Badge className={STATUS_COLORS[movement.approval_status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                          {translateStatus(movement.approval_status || 'approved')}
                        </Badge>
                      </div>
                      {movement.unit_cost && (
                        <p className="text-sm font-medium">
                          {formatCurrency(movement.quantity * movement.unit_cost)}
                        </p>
                      )}
                      {movement.requires_approval && movement.approval_status === 'pending' && (
                        <p className="text-xs text-yellow-600">Aguardando aprovação</p>
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
