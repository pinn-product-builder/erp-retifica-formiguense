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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Calculator,
  Building2,
  AlertCircle,
  Truck,
  Calendar,
} from 'lucide-react';
import { useQuotations, type CreateQuotationData, type QuotationItem } from '@/hooks/useQuotations';
import { usePurchasing } from '@/hooks/usePurchasing';
import { useSupplierEvaluation } from '@/hooks/useSupplierEvaluation';

interface QuotationFormProps {
  onSuccess: () => void;
}

export default function QuotationForm({ onSuccess }: QuotationFormProps) {
  const { createQuotation, loading } = useQuotations();
  const { requisitions, suppliers, fetchRequisitions, fetchSuppliers } = usePurchasing();
  const { suggestSuppliersForPart } = useSupplierEvaluation();

  const [formData, setFormData] = useState({
    requisition_id: '',
    supplier_id: '',
    quote_date: new Date().toISOString().split('T')[0],
    validity_date: '',
    delivery_time: '',
    terms: '',
  });

  const [items, setItems] = useState<Omit<QuotationItem, 'id' | 'quotation_id'>[]>([
    {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    },
  ]);

  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);
  const [suggestedSuppliers, setSuggestedSuppliers] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequisitions();
    fetchSuppliers();
  }, [fetchRequisitions, fetchSuppliers]);

  // Quando uma requisição é selecionada, buscar fornecedores sugeridos
  useEffect(() => {
    if (formData.requisition_id) {
      const requisition = requisitions.find(r => r.id === formData.requisition_id);
      setSelectedRequisition(requisition);
      
      // Pré-preencher itens baseado na requisição
      if (requisition?.items && requisition.items.length > 0) {
        const newItems = requisition.items.map((item: any) => ({
          item_name: item.item_name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: 0,
          total_price: 0,
        }));
        setItems(newItems);
        
        // Buscar fornecedores sugeridos para o primeiro item
        if (newItems[0]?.item_name) {
          suggestSuppliersForPart(newItems[0].item_name).then(suggested => {
            setSuggestedSuppliers(suggested || []);
          });
        }
      }
    }
  }, [formData.requisition_id, requisitions, suggestSuppliersForPart]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalcular total do item se quantidade ou preço unitário mudaram
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? Number(value) : newItems[index].quantity;
      const unitPrice = field === 'unit_price' ? Number(value) : newItems[index].unit_price;
      newItems[index].total_price = quantity * unitPrice;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.requisition_id) {
      newErrors.requisition_id = 'Selecione uma requisição';
    }
    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Selecione um fornecedor';
    }
    if (!formData.quote_date) {
      newErrors.quote_date = 'Data da cotação é obrigatória';
    }

    // Validar itens
    items.forEach((item, index) => {
      if (!item.item_name.trim()) {
        newErrors[`item_${index}_name`] = 'Nome do item é obrigatório';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantidade deve ser maior que zero';
      }
      if (item.unit_price <= 0) {
        newErrors[`item_${index}_price`] = 'Preço deve ser maior que zero';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const quotationData: CreateQuotationData = {
      ...formData,
      delivery_time: formData.delivery_time ? parseInt(formData.delivery_time) : undefined,
      items: items.filter(item => item.item_name.trim()),
    };

    const success = await createQuotation(quotationData);
    if (success) {
      onSuccess();
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.total_price, 0);
  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações da Cotação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requisition">Requisição de Compra *</Label>
              <Select
                value={formData.requisition_id}
                onValueChange={(value) => handleInputChange('requisition_id', value)}
              >
                <SelectTrigger className={errors.requisition_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione uma requisição" />
                </SelectTrigger>
                <SelectContent>
                  {requisitions.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.requisition_number} - {req.justification || 'Requisição'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.requisition_id && (
                <p className="text-sm text-red-500 mt-1">{errors.requisition_id}</p>
              )}
            </div>

            <div>
              <Label htmlFor="supplier">Fornecedor *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => handleInputChange('supplier_id', value)}
              >
                <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{supplier.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ⭐ {supplier.rating?.toFixed(1)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && (
                <p className="text-sm text-red-500 mt-1">{errors.supplier_id}</p>
              )}
            </div>
          </div>

          {/* Fornecedores Sugeridos */}
          {suggestedSuppliers.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Fornecedores sugeridos para este item:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSuppliers.slice(0, 3).map((supplier) => (
                      <Button
                        key={supplier.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInputChange('supplier_id', supplier.id)}
                        className="text-xs"
                      >
                        {supplier.name} (⭐ {supplier.rating?.toFixed(1)})
                      </Button>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quote_date">Data da Cotação *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="quote_date"
                  type="date"
                  value={formData.quote_date}
                  onChange={(e) => handleInputChange('quote_date', e.target.value)}
                  className={`pl-10 ${errors.quote_date ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.quote_date && (
                <p className="text-sm text-red-500 mt-1">{errors.quote_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="validity_date">Data de Validade</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="validity_date"
                  type="date"
                  value={formData.validity_date}
                  onChange={(e) => handleInputChange('validity_date', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="delivery_time">Prazo de Entrega (dias)</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="delivery_time"
                  type="number"
                  min="0"
                  value={formData.delivery_time}
                  onChange={(e) => handleInputChange('delivery_time', e.target.value)}
                  className="pl-10"
                  placeholder={selectedSupplier?.delivery_days?.toString() || '0'}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="terms">Condições e Observações</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => handleInputChange('terms', e.target.value)}
              placeholder="Condições de pagamento, garantias, observações..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Itens da Cotação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Itens da Cotação
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item *</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Qtd *</TableHead>
                  <TableHead>Preço Unit. *</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        placeholder="Nome do item"
                        className={errors[`item_${index}_name`] ? 'border-red-500' : ''}
                      />
                      {errors[`item_${index}_name`] && (
                        <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_name`]}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Descrição"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className={`w-20 ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_quantity`]}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className={`w-24 ${errors[`item_${index}_price`] ? 'border-red-500' : ''}`}
                      />
                      {errors[`item_${index}_price`] && (
                        <p className="text-xs text-red-500 mt-1">{errors[`item_${index}_price`]}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        R$ {item.total_price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total Geral */}
          <div className="flex justify-end mt-4 p-4 bg-muted rounded-lg">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total da Cotação</p>
              <p className="text-2xl font-bold">
                R$ {totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar Cotação'}
        </Button>
      </div>
    </form>
  );
}
