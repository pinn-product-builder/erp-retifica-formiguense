import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Copy, Tag } from 'lucide-react';
import { usePartsInventory, type PartInventory, type ComponentType, type PartStatus } from '@/hooks/usePartsInventory';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { useMacroComponents, type MacroComponent } from '@/hooks/useMacroComponents';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

interface PartFormProps {
  part?: PartInventory;
  onSuccess: () => void;
  onClone?: (partId: string) => void;
}

const SECTION_OPTIONS = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'otto', label: 'Otto' },
  { value: 'bosch', label: 'Bosch' },
];

export const PartForm: React.FC<PartFormProps> = ({ part, onSuccess, onClone }) => {
  const { createPart, updatePart, clonePart, loading } = usePartsInventory();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const { macroComponents, loading: macroComponentsLoading } = useMacroComponents();

  const isEditing = !!part;

  const [formData, setFormData] = useState({
    part_name: '',
    part_code: '',
    quantity: isEditing ? 1 : 0,
    unit_cost: 0,
    supplier: '',
    component: undefined as ComponentType | undefined,
    macro_component_id: '',
    status: 'disponivel' as PartStatus,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (part) {
      setFormData({
        part_name: part.part_name,
        part_code: part.part_code ?? '',
        quantity: part.quantity,
        unit_cost: part.unit_cost ?? 0,
        supplier: part.supplier ?? '',
        component: part.component ?? undefined,
        macro_component_id: (part as { macro_component_id?: string }).macro_component_id ?? '',
        status: (part.status as PartStatus) ?? 'disponivel',
        notes: part.notes ?? '',
      });
    }
  }, [part]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.part_name.trim()) {
      newErrors.part_name = 'Nome da peça é obrigatório';
    }

    if (formData.unit_cost < 0) {
      newErrors.unit_cost = 'Valor unitário não pode ser negativo';
    }

    if (isEditing && formData.quantity < 0) {
      newErrors.quantity = 'Quantidade não pode ser negativa';
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
      quantity: isEditing ? formData.quantity : 0,
      unit_cost: formData.unit_cost,
      supplier: formData.supplier || undefined,
      component: formData.component || undefined,
      macro_component_id: formData.macro_component_id || undefined,
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

  const handleClone = async () => {
    if (!part) return;
    const ok = await clonePart(part.id);
    if (ok && onClone) {
      onClone(part.id);
    } else if (ok) {
      onSuccess();
    }
  };

  const handlePrintLabel = () => {
    const labelContent = `
      <html><body style="font-family:monospace;padding:16px;">
        <h3 style="margin:0">${formData.part_name}</h3>
        <p style="margin:4px 0">Código: <strong>${formData.part_code || 'N/A'}</strong></p>
        <p style="margin:4px 0">Custo: <strong>${formatCurrency(formData.unit_cost)}</strong></p>
        <p style="margin:4px 0">Status: <strong>${formData.status}</strong></p>
      </body></html>
    `;
    const win = window.open('', '_blank', 'width=400,height=300');
    if (win) {
      win.document.write(labelContent);
      win.document.close();
      win.print();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEditing && (
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          <Button type="button" variant="outline" size="sm" onClick={handleClone} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            Clonar Peça
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handlePrintLabel} className="gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Imprimir Etiqueta
          </Button>
          <Badge variant="outline" className="ml-auto text-xs py-1">
            ID: {part?.id?.slice(0, 8)}…
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="part_name">
            Nome da Peça <span className="text-red-500">*</span>
          </Label>
          <Input
            id="part_name"
            value={formData.part_name}
            onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
            placeholder="Ex: Junta do Cabeçote"
          />
          {errors.part_name && <p className="text-xs text-red-500 mt-1">{errors.part_name}</p>}
        </div>

        <div>
          <Label htmlFor="part_code">Código da Peça</Label>
          <Input
            id="part_code"
            value={formData.part_code}
            onChange={(e) => setFormData({ ...formData, part_code: e.target.value })}
            placeholder="Ex: JNT-CAB-001"
          />
        </div>

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

        <div>
          <Label htmlFor="component">Componente</Label>
          <Select
            value={formData.component || 'none'}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                component: value === 'none' ? undefined : (value as ComponentType),
              })
            }
          >
            <SelectTrigger id="component">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {componentsLoading ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : (
                engineComponents.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="macro_component_id">Componente Macro</Label>
          <Select
            value={formData.macro_component_id || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, macro_component_id: value === 'none' ? '' : value })
            }
          >
            <SelectTrigger id="macro_component_id">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {macroComponentsLoading ? (
                <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : (
                (macroComponents as MacroComponent[])
                  .filter((mc) => mc.is_active)
                  .map((mc) => (
                    <SelectItem key={mc.id} value={mc.id}>{mc.name}</SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="unit_cost">
            Valor Unitário (R$) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="unit_cost"
            type="text"
            value={formData.unit_cost.toString()}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
              setFormData({ ...formData, unit_cost: Math.max(0, parseFloat(raw) || 0) });
            }}
            placeholder="0,00"
          />
          {errors.unit_cost && <p className="text-xs text-red-500 mt-1">{errors.unit_cost}</p>}
        </div>

        {isEditing && (
          <>
            <div>
              <Label htmlFor="quantity">
                Quantidade <span className="text-muted-foreground text-xs">(não editável)</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div>
              <Label htmlFor="supplier">
                Fornecedor <span className="text-muted-foreground text-xs">(não editável)</span>
              </Label>
              <Input
                id="supplier"
                value={formData.supplier}
                disabled
                className="bg-muted cursor-not-allowed"
                placeholder="Ex: Fornecedor XYZ"
              />
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Seção (Diesel/Otto/Bosch), NCM, código de barras ou outras observações..."
            rows={3}
          />
        </div>
      </div>

      {(isEditing || formData.unit_cost > 0) && (
        <div className="bg-muted p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground">Valor Total do Estoque desta Peça:</p>
          <p className="text-xl sm:text-2xl font-bold">
            {formatCurrency(formData.quantity * formData.unit_cost)}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : part ? (
            'Atualizar Peça'
          ) : (
            'Adicionar Peça'
          )}
        </Button>
      </div>
    </form>
  );
};
