import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Clock, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSuppliersList } from '@/hooks/useSuppliers';
import type { CreateConditionalOrderData } from '@/services/ConditionalOrderService';
import { PartSearchInput } from './PartSearchInput';

interface ConditionalItem {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
}

interface NewConditionalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateConditionalOrderData) => Promise<void>;
  loading?: boolean;
}

export function NewConditionalModal({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: NewConditionalModalProps) {
  const { suppliers: activeSuppliers } = useSuppliersList();
  const [formData, setFormData] = useState({
    supplier_id: '',
    analysis_days: '30',
    reference_doc: '',
    notes: '',
  });
  const [items, setItems] = useState<ConditionalItem[]>([
    { id: '1', part_code: '', part_name: '', quantity: 1, unit_price: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateTotal = () =>
    items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), part_code: '', part_name: '', quantity: 1, unit_price: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ConditionalItem, value: string | number) => {
    setItems(prev => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.supplier_id) newErrors.supplier_id = 'Selecione um fornecedor';
    if (!items.some((i) => i.part_name.trim())) newErrors.items = 'Adicione pelo menos um item';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await onSubmit({
      supplier_id: formData.supplier_id,
      analysis_days: parseInt(formData.analysis_days),
      reference_doc: formData.reference_doc || undefined,
      notes: formData.notes || undefined,
      items: items
        .filter((i) => i.part_name.trim())
        .map((i) => ({
          part_code: i.part_code || undefined,
          part_name: i.part_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
    });

    setFormData({ supplier_id: '', analysis_days: '30', reference_doc: '', notes: '' });
    setItems([{ id: '1', part_code: '', part_name: '', quantity: 1, unit_price: 0 }]);
    setErrors({});
    onOpenChange(false);
  };

  const selectedSupplier = activeSuppliers.find((s) => s.id === formData.supplier_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Nova Condicional
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Registre materiais recebidos em regime de condicional para avaliação
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Fornecedor *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(v) => {
                  setFormData({ ...formData, supplier_id: v });
                  setErrors({ ...errors, supplier_id: '' });
                }}
              >
                <SelectTrigger className={errors.supplier_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && (
                <p className="text-xs text-destructive">{errors.supplier_id}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm">Prazo de Avaliação *</Label>
              <Select
                value={formData.analysis_days}
                onValueChange={(v) => setFormData({ ...formData, analysis_days: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs sm:text-sm">Documento de Referência</Label>
              <Input
                value={formData.reference_doc}
                onChange={(e) => setFormData({ ...formData, reference_doc: e.target.value })}
                placeholder="NF, Romaneio, etc."
              />
            </div>
          </div>

          {selectedSupplier && (
            <Card className="bg-muted/50">
              <CardContent className="p-3 flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{selectedSupplier.name}</p>
                  {selectedSupplier.document && (
                    <p className="text-xs text-muted-foreground">{selectedSupplier.document}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">Itens da Condicional</h4>
              {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Adicionar</span>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Código</TableHead>
                  <TableHead className="text-xs">Nome *</TableHead>
                  <TableHead className="text-xs w-[70px]">Qtd</TableHead>
                  <TableHead className="text-xs w-[110px]">Preço Unit.</TableHead>
                  <TableHead className="text-xs w-[100px]">Total</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-2">
                      <Input
                        value={item.part_code}
                        onChange={(e) => updateItem(item.id, 'part_code', e.target.value)}
                        className="w-[90px] h-8 text-xs"
                        placeholder="Cód."
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <PartSearchInput
                        value={item.part_name}
                        onChange={(v) => updateItem(item.id, 'part_name', v)}
                        onSelectPart={({ name, code, unit_cost }) => {
                          setItems(prev => prev.map(i =>
                            i.id === item.id
                              ? { ...i, part_name: name, part_code: code, unit_price: unit_cost > 0 ? unit_cost : i.unit_price }
                              : i
                          ));
                        }}
                        placeholder="Nome da peça"
                        className="min-w-[150px] h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)
                        }
                        className="w-[70px] h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-[110px] h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-2 font-medium text-xs whitespace-nowrap">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="text-right">
              <span className="text-muted-foreground text-sm">Total: </span>
              <span className="font-bold text-base sm:text-lg">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs sm:text-sm">Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="text-sm"
              placeholder="Observações adicionais sobre esta condicional..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Registrar Condicional'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
