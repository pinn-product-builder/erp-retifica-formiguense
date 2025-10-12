import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useInventoryMovements, MovementType } from '@/hooks/useInventoryMovements';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
}

interface MovementFormProps {
  onSuccess?: () => void;
  preselectedPartId?: string;
  preselectedOrderId?: string;
}

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'entrada', label: 'Entrada', icon: TrendingUp, color: 'text-green-600' },
  { value: 'saida', label: 'Saída', icon: TrendingDown, color: 'text-red-600' },
  { value: 'ajuste', label: 'Ajuste', icon: RefreshCw, color: 'text-blue-600' },
  { value: 'baixa', label: 'Baixa', icon: AlertCircle, color: 'text-orange-600' },
] as const;

export function MovementForm({ onSuccess, preselectedPartId, preselectedOrderId }: MovementFormProps) {
  const { createMovement, loading } = useInventoryMovements();
  const { currentOrganization } = useOrganization();
  
  const [parts, setParts] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  
  const [formData, setFormData] = useState({
    part_id: preselectedPartId || '',
    movement_type: 'entrada' as MovementType,
    quantity: 1,
    unit_cost: 0,
    order_id: preselectedOrderId || '',
    reason: '',
    notes: '',
  });

  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Buscar peças
  useEffect(() => {
    if (currentOrganization?.id) {
      fetchParts();
    }
  }, [currentOrganization?.id]);

  // Atualizar peça selecionada
  useEffect(() => {
    if (formData.part_id) {
      const part = parts.find(p => p.id === formData.part_id);
      setSelectedPart(part || null);
    } else {
      setSelectedPart(null);
    }
  }, [formData.part_id, parts]);

  const fetchParts = async () => {
    setLoadingParts(true);
    try {
      const { data, error } = await supabase
        .from('parts_inventory')
        .select('id, part_code, part_name, quantity, unit_cost')
        .eq('org_id', currentOrganization?.id)
        .order('part_name');

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoadingParts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.part_id) {
      alert('Selecione uma peça');
      return;
    }

    if (!formData.reason.trim()) {
      alert('Informe o motivo da movimentação');
      return;
    }

    if (formData.quantity <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    const movement = await createMovement({
      part_id: formData.part_id,
      movement_type: formData.movement_type,
      quantity: formData.quantity,
      unit_cost: formData.unit_cost > 0 ? formData.unit_cost : undefined,
      order_id: formData.order_id || undefined,
      reason: formData.reason,
      notes: formData.notes || undefined,
    });

    if (movement) {
      // Limpar formulário
      setFormData({
        part_id: preselectedPartId || '',
        movement_type: 'entrada',
        quantity: 1,
        unit_cost: 0,
        order_id: preselectedOrderId || '',
        reason: '',
        notes: '',
      });
      
      onSuccess?.();
    }
  };

  const showUnitCostField = formData.movement_type === 'entrada';
  const showEstoqueAtual = selectedPart !== null;
  const showEstoqueWarning = 
    selectedPart && 
    (formData.movement_type === 'saida' || formData.movement_type === 'baixa') &&
    formData.quantity > selectedPart.quantity;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Movimentação de Estoque</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Peça */}
          <div>
            <Label htmlFor="part_id">Peça *</Label>
            <Select
              value={formData.part_id}
              onValueChange={(value) => setFormData({ ...formData, part_id: value })}
              disabled={!!preselectedPartId || loadingParts}
            >
              <SelectTrigger id="part_id">
                <SelectValue placeholder="Selecione a peça" />
              </SelectTrigger>
              <SelectContent>
                {parts.map((part) => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.part_code} - {part.part_name} (Est: {part.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estoque Atual */}
          {showEstoqueAtual && selectedPart && (
            <Alert>
              <AlertDescription>
                <strong>Estoque Atual:</strong> {selectedPart.quantity} unidade(s)
              </AlertDescription>
            </Alert>
          )}

          {/* Tipo de Movimentação */}
          <div>
            <Label htmlFor="movement_type">Tipo de Movimentação *</Label>
            <Select
              value={formData.movement_type}
              onValueChange={(value) => setFormData({ ...formData, movement_type: value as MovementType })}
            >
              <SelectTrigger id="movement_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade */}
          <div>
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          {/* Alerta de estoque insuficiente */}
          {showEstoqueWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Atenção: A quantidade solicitada ({formData.quantity}) é maior que o estoque disponível ({selectedPart?.quantity})
              </AlertDescription>
            </Alert>
          )}

          {/* Custo Unitário (apenas para entrada) */}
          {showUnitCostField && (
            <div>
              <Label htmlFor="unit_cost">Custo Unitário (R$)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Motivo */}
          <div>
            <Label htmlFor="reason">Motivo *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Compra de fornecedor, Uso em ordem de serviço, Correção de inventário"
              required
            />
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais (opcional)"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={loading || showEstoqueWarning}>
              {loading ? 'Processando...' : 'Registrar Movimentação'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

