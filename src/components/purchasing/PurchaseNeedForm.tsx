import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  AlertCircle,
  Calendar,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { usePurchaseNeeds, type CreatePurchaseNeedData } from '@/hooks/usePurchaseNeeds';
import { usePartsInventory } from '@/hooks/usePartsInventory';

interface PurchaseNeedFormProps {
  onSuccess: () => void;
}

export default function PurchaseNeedForm({ onSuccess }: PurchaseNeedFormProps) {
  const { createNeed, loading } = usePurchaseNeeds();
  const { parts, fetchParts } = usePartsInventory();

  const [formData, setFormData] = useState({
    part_code: '',
    part_name: '',
    required_quantity: '',
    available_quantity: '',
    priority_level: 'medium' as const,
    need_type: 'manual_request' as const,
    delivery_urgency_date: '',
    estimated_cost: '',
    notes: '',
  });

  const [selectedPart, setSelectedPart] = useState<unknown>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Quando uma peça é selecionada, pré-preencher dados
  useEffect(() => {
    if (formData.part_code) {
      const part = parts.find(p => p.part_code === formData.part_code);
      if (part) {
        setSelectedPart(part);
        setFormData(prev => ({
          ...prev,
          part_name: part.part_name,
          available_quantity: part.quantity.toString(),
          estimated_cost: (part.unit_cost * parseInt(prev.required_quantity || '1')).toString(),
        }));
      }
    }
  }, [formData.part_code, parts]);

  // Recalcular custo estimado quando quantidade muda
  useEffect(() => {
    if (selectedPart && formData.required_quantity) {
      const quantity = parseInt(formData.required_quantity) || 0;
      const estimatedCost = selectedPart.unit_cost * quantity;
      setFormData(prev => ({
        ...prev,
        estimated_cost: estimatedCost.toString(),
      }));
    }
  }, [formData.required_quantity, selectedPart]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.part_code.trim()) {
      newErrors.part_code = 'Código da peça é obrigatório';
    }
    if (!formData.part_name.trim()) {
      newErrors.part_name = 'Nome da peça é obrigatório';
    }
    if (!formData.required_quantity || parseInt(formData.required_quantity) <= 0) {
      newErrors.required_quantity = 'Quantidade necessária deve ser maior que zero';
    }
    if (!formData.available_quantity || parseInt(formData.available_quantity) < 0) {
      newErrors.available_quantity = 'Quantidade disponível deve ser informada';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const needData: CreatePurchaseNeedData = {
      part_code: formData.part_code.trim(),
      part_name: formData.part_name.trim(),
      required_quantity: parseInt(formData.required_quantity),
      available_quantity: parseInt(formData.available_quantity),
      priority_level: formData.priority_level,
      need_type: formData.need_type,
      delivery_urgency_date: formData.delivery_urgency_date || undefined,
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
    };

    const success = await createNeed(needData);
    if (success) {
      onSuccess();
    }
  };

  const getShortageQuantity = () => {
    const required = parseInt(formData.required_quantity) || 0;
    const available = parseInt(formData.available_quantity) || 0;
    return Math.max(0, required - available);
  };

  const getPriorityDescription = (priority: string) => {
    const descriptions = {
      critical: 'Parada de produção ou cliente esperando',
      high: 'Impacto significativo nas operações',
      medium: 'Necessário para operação normal',
      low: 'Reposição de estoque preventiva',
    };
    return descriptions[priority as keyof typeof descriptions] || '';
  };

  const getTypeDescription = (type: string) => {
    const descriptions = {
      auto_reorder: 'Gerada automaticamente pelo sistema',
      manual_request: 'Solicitação manual do usuário',
      project_requirement: 'Necessária para projeto específico',
      maintenance: 'Manutenção preventiva ou corretiva',
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações da Peça */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Informações da Peça
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="part_code">Código da Peça *</Label>
              <Select
                value={formData.part_code}
                onValueChange={(value) => handleInputChange('part_code', value)}
              >
                <SelectTrigger className={errors.part_code ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione uma peça" />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((part) => (
                    <SelectItem key={part.id} value={part.part_code || ''}>
                      <div className="flex items-center justify-between w-full">
                        <span>{part.part_code} - {part.part_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          Estoque: {part.quantity}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.part_code && (
                <p className="text-sm text-red-500 mt-1">{errors.part_code}</p>
              )}
            </div>

            <div>
              <Label htmlFor="part_name">Nome da Peça *</Label>
              <Input
                id="part_name"
                value={formData.part_name}
                onChange={(e) => handleInputChange('part_name', e.target.value)}
                placeholder="Nome da peça"
                className={errors.part_name ? 'border-red-500' : ''}
                disabled={!!selectedPart}
              />
              {errors.part_name && (
                <p className="text-sm text-red-500 mt-1">{errors.part_name}</p>
              )}
            </div>
          </div>

          {selectedPart && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Informações da Peça Selecionada:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Estoque Atual:</span>
                      <span className="font-medium ml-1">{selectedPart.quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custo Unit.:</span>
                      <span className="font-medium ml-1">R$ {selectedPart.unit_cost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fornecedor:</span>
                      <span className="font-medium ml-1">{selectedPart.supplier || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium ml-1">{selectedPart.status}</span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Quantidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Análise de Necessidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="required_quantity">Quantidade Necessária *</Label>
              <Input
                id="required_quantity"
                type="number"
                min="1"
                value={formData.required_quantity}
                onChange={(e) => handleInputChange('required_quantity', e.target.value)}
                placeholder="0"
                className={errors.required_quantity ? 'border-red-500' : ''}
              />
              {errors.required_quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.required_quantity}</p>
              )}
            </div>

            <div>
              <Label htmlFor="available_quantity">Quantidade Disponível *</Label>
              <Input
                id="available_quantity"
                type="number"
                min="0"
                value={formData.available_quantity}
                onChange={(e) => handleInputChange('available_quantity', e.target.value)}
                placeholder="0"
                className={errors.available_quantity ? 'border-red-500' : ''}
                disabled={!!selectedPart}
              />
              {errors.available_quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.available_quantity}</p>
              )}
            </div>

            <div>
              <Label>Quantidade em Falta</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                <span className="font-semibold text-red-600">
                  {getShortageQuantity()}
                </span>
              </div>
            </div>
          </div>

          {getShortageQuantity() > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Será necessário comprar <strong>{getShortageQuantity()} unidades</strong> para atender a necessidade.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Configurações da Necessidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority_level">Nível de Prioridade *</Label>
              <Select
                value={formData.priority_level}
                onValueChange={(value) => handleInputChange('priority_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Crítica</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {getPriorityDescription(formData.priority_level)}
              </p>
            </div>

            <div>
              <Label htmlFor="need_type">Tipo de Necessidade *</Label>
              <Select
                value={formData.need_type}
                onValueChange={(value) => handleInputChange('need_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual_request">Solicitação Manual</SelectItem>
                  <SelectItem value="project_requirement">Projeto</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="auto_reorder">Reposição Automática</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {getTypeDescription(formData.need_type)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_urgency_date">Data Limite (Opcional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="delivery_urgency_date"
                  type="date"
                  value={formData.delivery_urgency_date}
                  onChange={(e) => handleInputChange('delivery_urgency_date', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimated_cost">Custo Estimado</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="estimated_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => handleInputChange('estimated_cost', e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  disabled={!!selectedPart}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Informações adicionais sobre a necessidade..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {formData.part_name && formData.required_quantity && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Resumo da Necessidade</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Peça:</span>
                  <p className="font-medium">{formData.part_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Falta:</span>
                  <p className="font-medium text-red-600">{getShortageQuantity()} unidades</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioridade:</span>
                  <p className="font-medium">{formData.priority_level}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Custo Est.:</span>
                  <p className="font-medium">R$ {parseFloat(formData.estimated_cost || '0').toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Necessidade'}
        </Button>
      </div>
    </form>
  );
}
