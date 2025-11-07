import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { usePartsInventory, type PartInventory, type ComponentType, type PartStatus } from "@/hooks/usePartsInventory";
import { useEngineComponents } from '@/hooks/useEngineComponents';

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

interface PartFormProps {
  part?: PartInventory;
  onSuccess: () => void;
}

export const PartForm: React.FC<PartFormProps> = ({ part, onSuccess }) => {
  const { createPart, updatePart, loading } = usePartsInventory();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  
  const [formData, setFormData] = useState({
    part_name: '',
    part_code: '',
    quantity: 1,
    unit_cost: 0,
    supplier: '',
    component: undefined as ComponentType | undefined,
    status: 'disponivel' as PartStatus,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (part) {
      setFormData({
        part_name: part.part_name,
        part_code: part.part_code || '',
        quantity: part.quantity,
        unit_cost: part.unit_cost,
        supplier: part.supplier || '',
        component: part.component || undefined,
        status: part.status,
        notes: part.notes || '',
      });
    }
  }, [part]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.part_name.trim()) {
      newErrors.part_name = 'Nome da peça é obrigatório';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantidade não pode ser negativa';
    }

    if (formData.unit_cost < 0) {
      newErrors.unit_cost = 'Valor unitário não pode ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const dataToSend = {
      part_name: formData.part_name,
      part_code: formData.part_code || undefined,
      quantity: formData.quantity,
      unit_cost: formData.unit_cost,
      supplier: formData.supplier || undefined,
      component: formData.component || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    };

    const success = part 
      ? await updatePart(part.id, dataToSend)
      : await createPart(dataToSend);

    if (success) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nome da Peça */}
        <div className="col-span-2">
          <Label htmlFor="part_name">
            Nome da Peça <span className="text-red-500">*</span>
          </Label>
          <Input
            id="part_name"
            value={formData.part_name}
            onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
            placeholder="Ex: Junta do Cabeçote"
          />
          {errors.part_name && (
            <p className="text-sm text-red-500 mt-1">{errors.part_name}</p>
          )}
        </div>

        {/* Código da Peça */}
        <div>
          <Label htmlFor="part_code">Código da Peça</Label>
          <Input
            id="part_code"
            value={formData.part_code}
            onChange={(e) => setFormData({ ...formData, part_code: e.target.value })}
            placeholder="Ex: JNT-CAB-001"
          />
        </div>

        {/* Componente */}
        <div>
          <Label htmlFor="component">Componente</Label>
          <Select
            value={formData.component || 'none'}
            onValueChange={(value: string) => setFormData({ 
              ...formData, 
              component: value === 'none' ? undefined : value as ComponentType 
            })}
          >
            <SelectTrigger id="component">
              <SelectValue placeholder="Selecione um componente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {componentsLoading ? (
                <SelectItem value="loading" disabled>Carregando componentes...</SelectItem>
              ) : (
                engineComponents.map((component) => (
                  <SelectItem key={component.value} value={component.value}>
                    {component.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Quantidade */}
        <div>
          <Label htmlFor="quantity">
            Quantidade <span className="text-red-500">*</span>
          </Label>
          <Input
            id="quantity"
            type="text"
            value={formData.quantity.toString()}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/[^\d]/g, '');
              const quantity = numericValue ? parseInt(numericValue) : 0;
              setFormData({ ...formData, quantity: Math.max(0, quantity) });
            }}
          />
          {errors.quantity && (
            <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>
          )}
        </div>

        {/* Valor Unitário */}
        <div>
          <Label htmlFor="unit_cost">
            Valor Unitário (R$) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="unit_cost"
            type="text"
            value={formData.unit_cost.toString()}
            onChange={(e) => {
              // Permitir vírgula como separador decimal
              let numericValue = e.target.value.replace(/[^\d.,]/g, '');
              if (numericValue.includes(',')) {
                numericValue = numericValue.replace(',', '.');
              }
              const cost = parseFloat(numericValue) || 0;
              setFormData({ ...formData, unit_cost: Math.max(0, cost) });
            }}
            placeholder="0,00"
          />
          {errors.unit_cost && (
            <p className="text-sm text-red-500 mt-1">{errors.unit_cost}</p>
          )}
        </div>

        {/* Fornecedor */}
        <div>
          <Label htmlFor="supplier">Fornecedor</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="Ex: Fornecedor XYZ"
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: PartStatus) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="reservado">Reservado</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Observações */}
        <div className="col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observações adicionais sobre a peça..."
            rows={3}
          />
        </div>
      </div>

      {/* Valor Total */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">Valor Total do Estoque desta Peça:</p>
        <p className="text-2xl font-bold">
          {formatCurrency(formData.quantity * formData.unit_cost)}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            part ? 'Atualizar Peça' : 'Adicionar Peça'
          )}
        </Button>
      </div>
    </form>
  );
};

