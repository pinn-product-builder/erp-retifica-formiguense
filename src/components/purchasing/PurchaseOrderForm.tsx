import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { usePurchasing, Supplier, PurchaseOrder, PurchaseOrderItem } from '@/hooks/usePurchasing';
import { useToast } from '@/hooks/use-toast';
import { FormField } from '@/components/ui/form-field';
import { formatCurrency } from '@/lib/utils';
import { type PurchaseNeed } from '@/hooks/usePurchaseNeeds';

interface PurchaseOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId?: string;
  purchaseNeed?: PurchaseNeed | null;
  onSuccess?: () => void;
}

interface POFormData {
  supplier_id: string;
  requisition_id?: string;
  expected_delivery: string;
  terms: string;
  notes: string;
  delivery_address: string;
  items: Array<{
    item_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  taxes: number;
  freight: number;
  discount: number;
  total_value: number;
}

export default function PurchaseOrderForm({ 
  open, 
  onOpenChange, 
  quotationId,
  purchaseNeed,
  onSuccess 
}: PurchaseOrderFormProps) {
  const { suppliers, createPurchaseOrder, loading } = usePurchasing();
  const { toast } = useToast();

  // Função para obter itens iniciais baseado na necessidade de compra
  const getInitialItems = useCallback(() => {
    if (purchaseNeed) {
      return [{
        item_name: purchaseNeed.part_name,
        description: `${purchaseNeed.part_code} - ${purchaseNeed.part_name}`,
        quantity: purchaseNeed.shortage_quantity,
        unit_price: purchaseNeed.estimated_cost / purchaseNeed.shortage_quantity || 0,
        total_price: purchaseNeed.estimated_cost || 0,
      }];
    }
    return [{ item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }];
  }, [purchaseNeed]);

  const [formData, setFormData] = useState<POFormData>(() => {
    const initialItems = purchaseNeed ? [{
      item_name: purchaseNeed.part_name,
      description: `${purchaseNeed.part_code} - ${purchaseNeed.part_name}`,
      quantity: purchaseNeed.shortage_quantity,
      unit_price: purchaseNeed.estimated_cost / purchaseNeed.shortage_quantity || 0,
      total_price: purchaseNeed.estimated_cost || 0,
    }] : [{ item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }];
    
    const initialSubtotal = initialItems.reduce((sum, item) => sum + item.total_price, 0);
    
    return {
      supplier_id: '',
      requisition_id: '',
      expected_delivery: '',
      terms: '',
      notes: '',
      delivery_address: '',
      items: initialItems,
      subtotal: initialSubtotal,
      taxes: 0,
      freight: 0,
      discount: 0,
      total_value: initialSubtotal,
    };
  });

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Reset form when modal opens, mas manter dados da necessidade se houver
  useEffect(() => {
    if (open) {
      const initialItems = getInitialItems();
      const initialSubtotal = initialItems.reduce((sum, item) => sum + item.total_price, 0);
      
      setFormData({
        supplier_id: '',
        requisition_id: '',
        expected_delivery: '',
        terms: '',
        notes: '',
        delivery_address: '',
        items: initialItems,
        subtotal: initialSubtotal,
        taxes: 0,
        freight: 0,
        discount: 0,
        total_value: initialSubtotal,
      });
      setSelectedSupplier(null);
    }
  }, [open, getInitialItems]);

  // Calculate totals whenever items, taxes, freight, or discount change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total_price, 0);
    const total = subtotal + formData.taxes + formData.freight - formData.discount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      total_value: Math.max(0, total),
    }));
  }, [formData.items, formData.taxes, formData.freight, formData.discount]);

  // Update selected supplier when supplier_id changes
  useEffect(() => {
    if (formData.supplier_id) {
      const supplier = suppliers.find(s => s.id === formData.supplier_id);
      setSelectedSupplier(supplier || null);
      
      // Auto-fill delivery terms if available
      if (supplier?.delivery_days) {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + supplier.delivery_days);
        setFormData(prev => ({
          ...prev,
          expected_delivery: deliveryDate.toISOString().split('T')[0],
          terms: supplier.payment_terms || prev.terms,
        }));
      }
    }
  }, [formData.supplier_id, suppliers]);

  const handleInputChange = (field: keyof POFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      [field]: value 
    };

    // Recalculate total price for the item
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.supplier_id) {
      toast({
        title: 'Erro',
        description: 'Selecione um fornecedor',
        variant: 'destructive',
      });
      return;
    }

    if (formData.items.some(item => !item.item_name || item.quantity <= 0)) {
      toast({
        title: 'Erro',
        description: 'Todos os itens devem ter nome e quantidade válida',
        variant: 'destructive',
      });
      return;
    }

    try {
      const orderData: Omit<PurchaseOrder, 'id' | 'po_number' | 'supplier' | 'items' | 'created_at' | 'updated_at'> = {
        supplier_id: formData.supplier_id,
        requisition_id: formData.requisition_id || undefined,
        status: 'draft',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery: formData.expected_delivery || undefined,
        subtotal: formData.subtotal,
        taxes: formData.taxes,
        freight: formData.freight,
        discount: formData.discount,
        total_value: formData.total_value,
        terms: formData.terms || undefined,
        notes: formData.notes || undefined,
        delivery_address: formData.delivery_address || undefined,
        requires_approval: formData.total_value > 5000,
      };

      const items: Omit<PurchaseOrderItem, 'id'>[] = formData.items.map(item => ({
        item_name: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        received_quantity: 0,
      }));

      const result = await createPurchaseOrder(orderData, items);
      
      if (result) {
        onOpenChange(false);
        onSuccess?.();
        
        // Reset form
        setFormData({
          supplier_id: '',
          requisition_id: '',
          expected_delivery: '',
          terms: '',
          notes: '',
          delivery_address: '',
          items: [{ item_name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }],
          subtotal: 0,
          taxes: 0,
          freight: 0,
          discount: 0,
          total_value: 0,
        });
        setSelectedSupplier(null);
      }
    } catch (error) {
      console.error('Error creating purchase order:', error);
    }
  };

  const requiresApproval = formData.total_value > 5000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Pedido de Compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Supplier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fornecedor *</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(value) => handleInputChange('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.is_active).map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Entrega Esperada</Label>
              <Input
                type="date"
                value={formData.expected_delivery}
                onChange={(e) => handleInputChange('expected_delivery', e.target.value)}
              />
            </div>
          </div>

          {/* Supplier Info */}
          {selectedSupplier && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Informações do Fornecedor</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Contato:</strong> {selectedSupplier.contact_person || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedSupplier.email || 'N/A'}</p>
                <p><strong>Telefone:</strong> {selectedSupplier.phone || 'N/A'}</p>
                <p><strong>Prazo de Entrega:</strong> {selectedSupplier.delivery_days} dias</p>
                <p><strong>Condições de Pagamento:</strong> {selectedSupplier.payment_terms || 'N/A'}</p>
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">Itens do Pedido</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Nome do Item *</Label>
                        <Input
                          value={item.item_name || ''}
                          onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                          placeholder="Ex: Rolamento SKF 6203"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Quantidade *</Label>
                        <FormField
                          label=""
                          name={`quantity-${index}`}
                          mask="decimal"
                          value={item.quantity?.toString() || '1'}
                          onChange={(value, rawValue) => handleItemChange(index, 'quantity', parseFloat(rawValue || '1'))}
                          className="space-y-0"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Preço Unitário</Label>
                        <FormField
                          label=""
                          name={`unit_price-${index}`}
                          mask="currency"
                          value={item.unit_price?.toString() || '0'}
                          onChange={(value, rawValue) => handleItemChange(index, 'unit_price', parseFloat(rawValue || '0'))}
                          className="space-y-0"
                        />
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Total</Label>
                          <Input
                            value={formatCurrency(item.total_price)}
                            readOnly
                            className="bg-muted/50 text-foreground"
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Descrição detalhada do item"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Totais do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Subtotal</Label>
                  <Input
                    value={formatCurrency(formData.subtotal)}
                    readOnly
                    className="bg-muted/50 text-foreground"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Impostos</Label>
                  <FormField
                    label=""
                    name="taxes"
                    mask="currency"
                    value={formData.taxes?.toString() || '0'}
                    onChange={(value, rawValue) => handleInputChange('taxes', parseFloat(rawValue || '0'))}
                    className="space-y-0"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Frete</Label>
                  <FormField
                    label=""
                    name="freight"
                    mask="currency"
                    value={formData.freight?.toString() || '0'}
                    onChange={(value, rawValue) => handleInputChange('freight', parseFloat(rawValue || '0'))}
                    className="space-y-0"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Desconto</Label>
                  <FormField
                    label=""
                    name="discount"
                    mask="currency"
                    value={formData.discount?.toString() || '0'}
                    onChange={(value, rawValue) => handleInputChange('discount', parseFloat(rawValue || '0'))}
                    className="space-y-0"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Geral:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(formData.total_value)}
                  </span>
                </div>
                {requiresApproval && (
                  <Badge variant="secondary" className="mt-2">
                    Requer Aprovação {'Valor > R$ 5.000'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Condições de Pagamento</Label>
              <Input
                value={formData.terms || ''}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                placeholder="Ex: 30/60/90 dias"
              />
            </div>
            
            <div>
              <Label>Endereço de Entrega</Label>
              <Input
                value={formData.delivery_address || ''}
                onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                placeholder="Endereço para entrega"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre o pedido"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Pedido de Compra'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
