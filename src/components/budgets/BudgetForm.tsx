import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertCircle, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MaskedInput } from '@/components/ui/masked-input';
import { useBudgetForm } from '@/hooks/useBudgetForm';
import type { DetailedBudget } from '@/hooks/useDetailedBudgets';

interface BudgetFormProps {
  budget?: DetailedBudget;
  orderId?: string;
  onSave: (budgetData: Partial<DetailedBudget>) => Promise<void>;
  onCancel: () => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function BudgetForm({ budget, orderId, onSave, onCancel }: BudgetFormProps) {
  const { toast } = useToast();
  const [discountText, setDiscountText] = useState<string>((budget?.discount || 0).toString());
  const [taxText, setTaxText] = useState<string>((budget?.tax_percentage || 0).toString());
  const [warrantyText, setWarrantyText] = useState<string>((budget?.warranty_months || 3).toString());
  const [deliveryText, setDeliveryText] = useState<string>((budget?.estimated_delivery_days || 15).toString());
  const [manualTotalText, setManualTotalText] = useState<string>('');

  const {
    selectedOrderId,
    setSelectedOrderId,
    services,
    parts,
    discount,
    setDiscount,
    taxPercentage,
    setTaxPercentage,
    warrantyMonths,
    setWarrantyMonths,
    estimatedDeliveryDays,
    setEstimatedDeliveryDays,
    manualTotal,
    setManualTotalWithDistribution,
    clearManualTotal,
    orders,
    loadingOrders,
    loadingParts,
    loadingDiagnostic,
    loadingServices,
    saving,
    setSaving,
    subtotal,
    discountAmount,
    taxAmount,
    calculatedTotal,
    manualAdjustment,
    originalTotal,
    hasOriginalTotal,
    originalDifference,
    servicesOptions,
    partsOptions,
    addServiceFromCatalog,
    updateServiceQuantity,
    updateServiceUnitPrice,
    removeService,
    addPart,
    updatePartQuantity,
    removePart,
    validateForm,
    getBudgetData,
    hasOrderLocked,
  } = useBudgetForm({ budget, orderId });

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await onSave(getBudgetData());
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const validateAndSetInteger = (value: string, setter: (v: number) => void, textSetter: (v: string) => void, max: number = 999) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const numValue = parseInt(numericValue) || 0;
    const limitedValue = Math.min(numValue, max);
    setter(limitedValue);
    textSetter(limitedValue.toString());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="order">Ordem de Serviço *</Label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId} disabled={hasOrderLocked}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a OS (O diagnóstico deve ter sido realizado)" />
              </SelectTrigger>
              <SelectContent>
                {loadingOrders ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : orders.length === 0 ? (
                  <SelectItem value="empty" disabled>Nenhuma OS disponível</SelectItem>
                ) : (
                  orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - {order.customer_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {loadingDiagnostic && (
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Carregando dados do diagnóstico...</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Buscando peças e serviços</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingDiagnostic && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando serviços do diagnóstico...</span>
            </div>
          )}
          <InfiniteAutocomplete
            options={servicesOptions}
            loading={loadingServices}
            label="Serviço Adicional"
            placeholder="Buscar serviço por descrição..."
            value={null}
            onChange={(_, newValue) => {
              if (newValue) addServiceFromCatalog(newValue as { id: string; description: string; value: number });
            }}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              const term = inputValue.toLowerCase();
              return options.filter((opt) => opt.description?.toLowerCase().includes(term));
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <div className="flex flex-col w-full py-2">
                  <div className="font-medium text-sm">{option.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatCurrency(option.value || 0)}</div>
                </div>
              </li>
            )}
          />

          {services.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateServiceQuantity(service.id, Math.max(1, service.quantity - 1))}>
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="text"
                          value={service.quantity.toString()}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^\d]/g, '');
                            const quantity = numericValue ? parseInt(numericValue) : 1;
                            updateServiceQuantity(service.id, Math.max(1, quantity));
                          }}
                          className="w-16 sm:w-20 text-center"
                        />
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}>
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MaskedInput
                        mask="currency"
                        value={service.unit_price.toString()}
                        onChange={(_, rawValue) => {
                          const unitPrice = parseFloat(rawValue) || 0;
                          updateServiceUnitPrice(service.id, unitPrice);
                        }}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(service.total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeService(service.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peças e Materiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingDiagnostic && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Carregando peças do diagnóstico...</span>
            </div>
          )}
          <InfiniteAutocomplete
            options={partsOptions}
            loading={loadingParts}
            label="Peça ou Material"
            placeholder="Buscar peça por código ou nome..."
            value={null}
            onChange={(_, newValue) => {
              if (newValue) addPart(newValue as { part_code: string; part_name: string; unit_cost: number; quantity: number });
            }}
            getOptionLabel={(option) => option.label || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              const term = inputValue.toLowerCase();
              return options.filter((opt) => opt.part_code?.toLowerCase().includes(term) || opt.part_name?.toLowerCase().includes(term));
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <div className="flex flex-col w-full py-2">
                  <div className="font-medium text-sm">{option.part_code} - {option.part_name}</div>
                  <div className="text-xs text-gray-500 mt-1">Estoque: {option.quantity} | {formatCurrency(option.unit_cost || 0)}</div>
                </div>
              </li>
            )}
          />

          {parts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono">{part.part_code}</TableCell>
                    <TableCell>{part.part_name}</TableCell>
                    <TableCell>
                      {part.available_stock !== undefined && (
                        <Badge variant={part.available_stock >= part.quantity ? 'default' : 'destructive'}>{part.available_stock}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updatePartQuantity(part.id, Math.max(1, part.quantity - 1))}>
                          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="text"
                          value={part.quantity.toString()}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^\d]/g, '');
                            const quantity = numericValue ? parseInt(numericValue) : 1;
                            updatePartQuantity(part.id, Math.max(1, quantity));
                          }}
                          className="w-16 sm:w-20 text-center"
                        />
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => updatePartQuantity(part.id, part.quantity + 1)}>
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(part.unit_price)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(part.total)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removePart(part.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {parts.some((p) => p.available_stock !== undefined && p.available_stock < p.quantity) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atenção: Estoque insuficiente</p>
                <p className="text-yellow-700">Algumas peças não possuem estoque suficiente. Será gerada uma necessidade de compra automaticamente.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totais e Condições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Desconto (%)</Label>
              <MaskedInput
                id="discount"
                mask="decimal"
                placeholder="Ex: 10,5"
                value={discountText}
                onChange={(maskedValue, rawValue) => {
                  const numericValue = parseFloat(rawValue) || 0;
                  const limitedValue = Math.min(Math.max(numericValue, 0), 100);
                  setDiscount(limitedValue);
                  setDiscountText(maskedValue);
                }}
              />
            </div>
            <div>
              <Label htmlFor="tax">Impostos (%)</Label>
              <MaskedInput
                id="tax"
                mask="decimal"
                placeholder="Ex: 18,5"
                value={taxText}
                onChange={(maskedValue, rawValue) => {
                  const numericValue = parseFloat(rawValue) || 0;
                  const limitedValue = Math.min(Math.max(numericValue, 0), 100);
                  setTaxPercentage(limitedValue);
                  setTaxText(maskedValue);
                }}
              />
            </div>
            <div>
              <Label htmlFor="warranty">Garantia (meses)</Label>
              <Input
                id="warranty"
                type="text"
                placeholder="Ex: 12"
                value={warrantyText}
                onChange={(e) => validateAndSetInteger(e.target.value, setWarrantyMonths, setWarrantyText, 60)}
              />
            </div>
            <div>
              <Label htmlFor="delivery">Prazo de Entrega (dias)</Label>
              <Input
                id="delivery"
                type="text"
                placeholder="Ex: 30"
                value={deliveryText}
                onChange={(e) => validateAndSetInteger(e.target.value, setEstimatedDeliveryDays, setDeliveryText, 365)}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto ({discount}%):</span>
                <span className="text-red-600">- {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxPercentage > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impostos ({taxPercentage}%):</span>
                <span>+ {formatCurrency(taxAmount)}</span>
              </div>
            )}
            {manualTotal !== null && Math.abs(manualAdjustment) > 0.01 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Calculado:</span>
                  <span>{formatCurrency(calculatedTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ajuste Manual {manualAdjustment > 0 ? '(Acréscimo)' : '(Desconto)'}:</span>
                  <span className={manualAdjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                    {manualAdjustment > 0 ? '+' : ''}{formatCurrency(manualAdjustment)}
                  </span>
                </div>
              </>
            )}
            {hasOriginalTotal && Math.abs(originalDifference) > 0.01 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-blue-900 dark:text-blue-100">Valor Original (sem ajustes):</span>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(originalTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-blue-900 dark:text-blue-100">Diferença Total:</span>
                  <span className={`font-semibold ${originalDifference > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {originalDifference > 0 ? '+' : ''}{formatCurrency(originalDifference)}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="manualTotal" className="text-base font-semibold">Total Final:</Label>
                <div className="flex items-center gap-2">
                  <MaskedInput
                    id="manualTotal"
                    mask="currency"
                    placeholder={formatCurrency(calculatedTotal)}
                    value={manualTotalText || formatCurrency(calculatedTotal)}
                    onChange={(maskedValue, rawValue) => {
                      const numericValue = parseFloat(rawValue) || 0;
                      if (numericValue > 0 && Math.abs(numericValue - calculatedTotal) > 0.01) {
                        setManualTotalWithDistribution(numericValue);
                        setManualTotalText(maskedValue);
                      } else {
                        clearManualTotal();
                        setManualTotalText('');
                      }
                    }}
                    className="w-40 sm:w-48 text-right font-bold"
                  />
                  {manualTotal !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearManualTotal();
                        setManualTotalText('');
                      }}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      title="Usar total calculado"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {manualTotal === null && (
                <p className="text-xs text-muted-foreground text-right">Clique no valor para ajustar manualmente</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={saving} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {budget ? 'Atualizar Orçamento' : 'Criar Orçamento'}
        </Button>
      </div>
    </div>
  );
}
