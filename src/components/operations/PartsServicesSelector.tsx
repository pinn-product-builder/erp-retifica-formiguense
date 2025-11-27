import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Search, Package, Wrench, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { usePartsInventory } from '@/hooks/usePartsInventory';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MaskedInput } from '@/components/ui/masked-input';

interface Part {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Service {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface PartsServicesSelectorProps {
  selectedParts: Part[];
  selectedServices: Service[];
  onPartsChange: (parts: Part[]) => void;
  onServicesChange: (services: Service[]) => void;
}

export function PartsServicesSelector({
  selectedParts,
  selectedServices,
  onPartsChange,
  onServicesChange
}: PartsServicesSelectorProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { getAvailableParts, loading: loadingParts } = usePartsInventory();
  const [partsInventory, setPartsInventory] = useState<Array<{ part_code: string; part_name: string; unit_cost: number; quantity: number }>>([]);
  const [partSelectOpen, setPartSelectOpen] = useState(false);
  const [selectedPartValue, setSelectedPartValue] = useState<string>('');
  
  const [newService, setNewService] = useState<{
    description?: string;
    quantity?: number;
    unit_price?: number;
  }>({
    description: '',
    quantity: 1,
    unit_price: 0
  });

  useEffect(() => {
    const loadParts = async () => {
      if (!currentOrganization?.id) return;
      
      try {
        const parts = await getAvailableParts();
        setPartsInventory(parts.map(p => ({
          part_code: p.part_code || '',
          part_name: p.part_name,
          unit_cost: p.unit_cost,
          quantity: p.quantity
        })));
      } catch (error) {
        console.error('Erro ao carregar peças:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar peças do estoque',
          variant: 'destructive'
        });
      }
    };

    loadParts();
  }, [currentOrganization?.id, getAvailableParts, toast]);

  const addPart = (partInventory: { part_code: string; part_name: string; unit_cost: number; quantity: number }) => {
    const existingPart = selectedParts.find(p => p.part_code === partInventory.part_code);
    if (existingPart) {
      toast({
        title: 'Atenção',
        description: 'Esta peça já foi adicionada',
        variant: 'destructive'
      });
      return;
    }

    const newPart: Part = {
      id: `part_${Date.now()}`,
      part_code: partInventory.part_code,
      part_name: partInventory.part_name,
      quantity: 1,
      unit_price: partInventory.unit_cost,
      total: partInventory.unit_cost
    };

    onPartsChange([...selectedParts, newPart]);
    setSelectedPartValue('');
    setPartSelectOpen(false);
  };

  const removePart = (partId: string) => {
    onPartsChange(selectedParts.filter(p => p.id !== partId));
  };

  const updatePartQuantity = (partId: string, quantity: number) => {
    onPartsChange(selectedParts.map(p => 
      p.id === partId 
        ? { ...p, quantity, total: quantity * p.unit_price } 
        : p
    ));
  };

  const updatePartPrice = (partId: string, price: number) => {
    onPartsChange(selectedParts.map(p => 
      p.id === partId 
        ? { ...p, unit_price: price, total: p.quantity * price } 
        : p
    ));
  };

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
      id: `service_${Date.now()}`,
      description: newService.description!,
      quantity: newService.quantity!,
      unit_price: newService.unit_price!,
      total: newService.quantity! * newService.unit_price!,
    };

    onServicesChange([...selectedServices, service]);
    setNewService({ description: '', quantity: 1, unit_price: 0 });
  };

  const removeService = (serviceId: string) => {
    onServicesChange(selectedServices.filter(s => s.id !== serviceId));
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    onServicesChange(selectedServices.map(s => 
      s.id === serviceId 
        ? { ...s, quantity, total: quantity * s.unit_price } 
        : s
    ));
  };

  const updateServicePrice = (serviceId: string, price: number) => {
    onServicesChange(selectedServices.map(s => 
      s.id === serviceId 
        ? { ...s, unit_price: price, total: s.quantity * price } 
        : s
    ));
  };

  const partsTotal = selectedParts.reduce((sum, p) => sum + p.total, 0);
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      {/* Peças Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Peças Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Peças */}
          <div className="space-y-2">
            <Label>Selecionar Peça</Label>
            <Popover open={partSelectOpen} onOpenChange={setPartSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={partSelectOpen}
                  className="w-full justify-between"
                  disabled={loadingParts}
                >
                  {selectedPartValue
                    ? partsInventory.find(p => `${p.part_code} - ${p.part_name}` === selectedPartValue)?.part_name
                    : "Selecione uma peça..."}
                  {loadingParts ? (
                    <Loader2 className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
                  ) : (
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-96" align="start">
                <Command>
                  <CommandInput placeholder="Buscar peça..." />
                  <CommandEmpty>Nenhuma peça encontrada.</CommandEmpty>
                  <ScrollArea className="h-64">
                    <CommandList>
                      <CommandGroup>
                        {partsInventory.map((part) => (
                          <CommandItem
                            key={part.part_code}
                            value={`${part.part_code} - ${part.part_name}`}
                            onSelect={() => {
                              addPart(part);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedParts.find(p => p.part_code === part.part_code)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{part.part_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Código: {part.part_code} | Estoque: {part.quantity} | Preço: R$ {part.unit_cost.toFixed(2)}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Peças Selecionadas */}
          {selectedParts.length > 0 && (
            <div className="space-y-2">
              <Label>Peças Selecionadas</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peça</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{part.part_name}</p>
                          <p className="text-xs text-muted-foreground">{part.part_code}</p>
                        </div>
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
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={part.unit_price}
                          onChange={(e) => updatePartPrice(part.id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          R$ {part.total.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePart(part.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <Badge variant="secondary" className="text-lg">
                  Total Peças: R$ {partsTotal.toFixed(2)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Serviços Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Serviços Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulário para Adicionar Serviço */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            <div className="md:col-span-6">
              <Label>Descrição do Serviço</Label>
              <Input
                placeholder="Descrição do serviço"
                value={newService.description || ''}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Quantidade</Label>
              <Input
                type="text"
                placeholder="Qtd"
                value={(newService.quantity || 1).toString()}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^\d]/g, '');
                  const quantity = numericValue ? parseInt(numericValue) : 1;
                  setNewService({ ...newService, quantity: Math.max(1, quantity) });
                }}
              />
            </div>
            <div className="md:col-span-3">
              <Label>Valor Unitário</Label>
              <MaskedInput
                mask="currency"
                placeholder="Valor unitário"
                value={''}
                onChange={(maskedValue, rawValue) => {
                  setNewService({ ...newService, unit_price: parseFloat(rawValue) || 0 });
                }}
              />
            </div>
            <div className="md:col-span-1">
              <Button onClick={addService} className="w-full">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Serviços Selecionados */}
          {selectedServices.length > 0 && (
            <div className="space-y-2">
              <Label>Serviços Selecionados</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{service.description}</p>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e) => updateServiceQuantity(service.id, parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={service.unit_price}
                          onChange={(e) => updateServicePrice(service.id, parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          R$ {service.total.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end">
                <Badge variant="secondary" className="text-lg">
                  Total Serviços: R$ {servicesTotal.toFixed(2)}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
