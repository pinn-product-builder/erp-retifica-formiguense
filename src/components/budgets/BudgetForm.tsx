import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import type { DetailedBudget } from '@/hooks/useDetailedBudgets';

interface BudgetFormProps {
  budget?: DetailedBudget;
  orderId?: string;
  onSave: (budgetData: Partial<DetailedBudget>) => Promise<void>;
  onCancel: () => void;
}

interface Service {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  available_stock?: number;
}

export function BudgetForm({ budget, orderId, onSave, onCancel }: BudgetFormProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  // Estados do formulário
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || budget?.order_id || '');
  const [component, setComponent] = useState<string>(budget?.component || 'bloco');
  const [services, setServices] = useState<Service[]>(budget?.services || []);
  const [parts, setParts] = useState<Part[]>(budget?.parts || []);
  const [laborHours, setLaborHours] = useState<number>(budget?.labor_hours || 0);
  const [laborRate, setLaborRate] = useState<number>(budget?.labor_rate || 50);
  const [discount, setDiscount] = useState<number>(budget?.discount || 0);
  const [taxPercentage, setTaxPercentage] = useState<number>(budget?.tax_percentage || 0);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(budget?.warranty_months || 3);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState<number>(budget?.estimated_delivery_days || 15);

  // Estados auxiliares
  const [orders, setOrders] = useState<any[]>([]);
  const [partsInventory, setPartsInventory] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingParts, setLoadingParts] = useState(false);
  const [saving, setSaving] = useState(false);

  // Novo serviço/peça temporário
  const [newService, setNewService] = useState<Partial<Service>>({ description: '', quantity: 1, unit_price: 0 });
  const [searchPartTerm, setSearchPartTerm] = useState('');

  // Carregar ordens disponíveis
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentOrganization?.id) return;
      
      setLoadingOrders(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, 
            order_number, 
            customer_id,
            customers!inner(name)
          `)
          .eq('org_id', currentOrganization.id)
          .eq('status', 'ativa')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro na query de ordens:', error);
          throw error;
        }
        
        console.log('Ordens carregadas:', data);
        setOrders(data || []);
      } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as ordens de serviço',
          variant: 'destructive',
        });
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [currentOrganization?.id, toast]);

  // Carregar peças do estoque
  useEffect(() => {
    const fetchParts = async () => {
      if (!currentOrganization?.id) return;

      setLoadingParts(true);
      try {
        const { data, error } = await supabase
          .from('parts_inventory')
          .select('*')
          .eq('org_id', currentOrganization.id)
          .order('part_name');

        if (error) throw error;
        setPartsInventory(data || []);
      } catch (error) {
        console.error('Erro ao carregar peças:', error);
      } finally {
        setLoadingParts(false);
      }
    };

    fetchParts();
  }, [currentOrganization?.id]);

  // Cálculos automáticos
  const laborTotal = laborHours * laborRate;
  const servicesTotal = services.reduce((sum, s) => sum + s.total, 0);
  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const subtotal = laborTotal + servicesTotal + partsTotal;
  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * taxPercentage) / 100;
  const totalAmount = subtotalAfterDiscount + taxAmount;

  // Adicionar serviço
  const addService = () => {
    if (!newService.description || !newService.quantity || !newService.unit_price) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos do serviço',
        variant: 'destructive',
      });
      return;
    }

    const service: Service = {
      id: Date.now().toString(),
      description: newService.description!,
      quantity: newService.quantity!,
      unit_price: newService.unit_price!,
      total: newService.quantity! * newService.unit_price!,
    };

    setServices([...services, service]);
    setNewService({ description: '', quantity: 1, unit_price: 0 });
  };

  // Remover serviço
  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  // Adicionar peça
  const addPart = (partInventory: any) => {
    const existingPart = parts.find(p => p.part_code === partInventory.part_code);
    if (existingPart) {
      toast({
        title: 'Atenção',
        description: 'Esta peça já foi adicionada',
        variant: 'destructive',
      });
      return;
    }

    const part: Part = {
      id: Date.now().toString(),
      part_code: partInventory.part_code,
      part_name: partInventory.part_name,
      quantity: 1,
      unit_price: partInventory.unit_cost || 0,
      total: 1 * (partInventory.unit_cost || 0),
      available_stock: partInventory.quantity,
    };

    setParts([...parts, part]);
    setSearchPartTerm('');
  };

  // Atualizar quantidade da peça
  const updatePartQuantity = (id: string, quantity: number) => {
    setParts(parts.map(p => 
      p.id === id 
        ? { ...p, quantity, total: quantity * p.unit_price } 
        : p
    ));
  };

  // Remover peça
  const removePart = (id: string) => {
    setParts(parts.filter(p => p.id !== id));
  };

  // Salvar orçamento
  const handleSave = async () => {
    if (!selectedOrderId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma ordem de serviço',
        variant: 'destructive',
      });
      return;
    }

    if (services.length === 0 && parts.length === 0 && laborHours === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um serviço, peça ou hora de mão de obra',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const budgetData: Partial<DetailedBudget> = {
        order_id: selectedOrderId,
        component: component as any,
        services,
        parts,
        labor_hours: laborHours,
        labor_rate: laborRate,
        labor_total: laborTotal,
        parts_total: partsTotal,
        discount,
        tax_percentage: taxPercentage,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        warranty_months: warrantyMonths,
        estimated_delivery_days: estimatedDeliveryDays,
        status: 'draft',
      };

      await onSave(budgetData);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredParts = partsInventory.filter(p =>
    p.part_code.toLowerCase().includes(searchPartTerm.toLowerCase()) ||
    p.part_name.toLowerCase().includes(searchPartTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Dados Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="order">Ordem de Serviço *</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId} disabled={!!orderId || !!budget}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a OS" />
                </SelectTrigger>
                <SelectContent>
                  {loadingOrders ? (
                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                  ) : orders.length === 0 ? (
                    <SelectItem value="empty" disabled>Nenhuma OS disponível</SelectItem>
                  ) : (
                    orders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - {order.customers?.name || 'Cliente não informado'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="component">Componente *</Label>
              <Select value={component} onValueChange={setComponent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bloco">Bloco</SelectItem>
                  <SelectItem value="cabecote">Cabeçote</SelectItem>
                  <SelectItem value="eixo">Eixo</SelectItem>
                  <SelectItem value="biela">Biela</SelectItem>
                  <SelectItem value="comando">Comando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mão de Obra */}
      <Card>
        <CardHeader>
          <CardTitle>Mão de Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="laborHours">Horas de Trabalho</Label>
              <Input
                id="laborHours"
                type="number"
                step="0.5"
                value={laborHours}
                onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="laborRate">Valor por Hora (R$)</Label>
              <Input
                id="laborRate"
                type="number"
                step="0.01"
                value={laborRate}
                onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Total Mão de Obra</Label>
              <Input value={`R$ ${laborTotal.toFixed(2)}`} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-6">
              <Input
                placeholder="Descrição do serviço"
                value={newService.description || ''}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                type="number"
                placeholder="Qtd"
                value={newService.quantity || 1}
                onChange={(e) => setNewService({ ...newService, quantity: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="md:col-span-3">
              <Input
                type="number"
                step="0.01"
                placeholder="Valor unitário"
                value={newService.unit_price || 0}
                onChange={(e) => setNewService({ ...newService, unit_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="md:col-span-1">
              <Button onClick={addService} className="w-full">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

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
                {services.map(service => (
                  <TableRow key={service.id}>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>{service.quantity}</TableCell>
                    <TableCell>R$ {service.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">R$ {service.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(service.id)}
                      >
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

      {/* Peças */}
      <Card>
        <CardHeader>
          <CardTitle>Peças e Materiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar peça por código ou nome..."
              value={searchPartTerm}
              onChange={(e) => setSearchPartTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchPartTerm && filteredParts.length > 0 && (
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {filteredParts.map(part => (
                <div
                  key={part.id}
                  className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center"
                  onClick={() => addPart(part)}
                >
                  <div>
                    <p className="font-medium">{part.part_code} - {part.part_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Estoque: {part.quantity} | R$ {part.unit_cost?.toFixed(2)}
                    </p>
                  </div>
                  <Plus className="h-4 w-4" />
                </div>
              ))}
            </div>
          )}

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
                {parts.map(part => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono">{part.part_code}</TableCell>
                    <TableCell>{part.part_name}</TableCell>
                    <TableCell>
                      {part.available_stock !== undefined && (
                        <Badge variant={part.available_stock >= part.quantity ? 'success' : 'destructive'}>
                          {part.available_stock}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => updatePartQuantity(part.id, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>R$ {part.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">R$ {part.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePart(part.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {parts.some(p => p.available_stock !== undefined && p.available_stock < p.quantity) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atenção: Estoque insuficiente</p>
                <p className="text-yellow-700">
                  Algumas peças não possuem estoque suficiente. Será gerada uma necessidade de compra automaticamente.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totais e Condições */}
      <Card>
        <CardHeader>
          <CardTitle>Totais e Condições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discount">Desconto (%)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="tax">Impostos (%)</Label>
              <Input
                id="tax"
                type="number"
                step="0.01"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="warranty">Garantia (meses)</Label>
              <Input
                id="warranty"
                type="number"
                min="1"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(parseInt(e.target.value) || 3)}
              />
            </div>
            <div>
              <Label htmlFor="delivery">Prazo de Entrega (dias)</Label>
              <Input
                id="delivery"
                type="number"
                min="1"
                value={estimatedDeliveryDays}
                onChange={(e) => setEstimatedDeliveryDays(parseInt(e.target.value) || 15)}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto ({discount}%):</span>
                <span className="text-red-600">- R$ {discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxPercentage > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impostos ({taxPercentage}%):</span>
                <span>+ R$ {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>R$ {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {budget ? 'Atualizar Orçamento' : 'Criar Orçamento'}
        </Button>
      </div>
    </div>
  );
}

