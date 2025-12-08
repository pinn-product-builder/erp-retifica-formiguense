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
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { Typography, Box } from '@mui/material';
import { Trash2, Package, Wrench, ChevronUp, ChevronDown } from 'lucide-react';
import { usePartsInventory } from '@/hooks/usePartsInventory';
import { useAdditionalServices } from '@/hooks/useAdditionalServices';
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
  macroComponentId?: string;
  engineTypeId?: string;
}

export function PartsServicesSelector({
  selectedParts,
  selectedServices,
  onPartsChange,
  onServicesChange,
  macroComponentId,
  engineTypeId
}: PartsServicesSelectorProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { getAvailableParts, loading: loadingParts } = usePartsInventory();
  const { additionalServices, loading: loadingServices, getServicesByComponent } = useAdditionalServices();
  const [partsInventory, setPartsInventory] = useState<Array<{ id: string; part_code: string; part_name: string; unit_cost: number; quantity: number; label: string }>>([]);
  const [selectedPartValue, setSelectedPartValue] = useState<{ id: string; part_code: string; part_name: string; unit_cost: number; quantity: number; label: string } | null>(null);
  const [selectedServiceValue, setSelectedServiceValue] = useState<{ id: string; description: string; value: number; label: string } | null>(null);
  const [filteredServices, setFilteredServices] = useState(additionalServices.filter(s => s.is_active));

  useEffect(() => {
    const loadParts = async () => {
      if (!currentOrganization?.id) return;
      
      try {
        const parts = await getAvailableParts(undefined, macroComponentId);
        setPartsInventory(parts.map(p => ({
          id: p.id,
          part_code: p.part_code || '',
          part_name: p.part_name,
          unit_cost: p.unit_cost,
          quantity: p.quantity,
          label: `${p.part_code || ''} - ${p.part_name}`
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
  }, [currentOrganization?.id, macroComponentId, getAvailableParts, toast]);

  useEffect(() => {
    const filtered = additionalServices.filter(s => {
      if (!s.is_active) return false;
      
      if (macroComponentId) {
        if (s.macro_component_id && s.macro_component_id !== macroComponentId) return false;
      }
      
      if (engineTypeId) {
        if (s.engine_type_id && s.engine_type_id !== engineTypeId) return false;
      }
      
      return true;
    });
    
    setFilteredServices(filtered);
    console.log('Serviços filtrados para componente:', {
      macroComponentId,
      engineTypeId,
      total: filtered.length,
      services: filtered.map(s => ({ id: s.id, description: s.description, value: s.value }))
    });
  }, [additionalServices, macroComponentId, engineTypeId]);

  const servicesOptions = filteredServices.map(s => ({
    id: s.id,
    label: `${s.description} - R$ ${s.value.toFixed(2)}`,
    description: s.description,
    value: s.value,
    macro_component: s.macro_component
  }));

  const addPart = (partInventory: { id: string; part_code: string; part_name: string; unit_cost: number; quantity: number; label: string }) => {
    const existingPart = selectedParts.find(p => p.part_code === partInventory.part_code);
    if (existingPart) {
      toast({
        title: 'Atenção',
        description: 'Esta peça já foi adicionada',
        variant: 'destructive'
      });
      setSelectedPartValue(null);
      return;
    }

    const newPart: Part = {
      id: partInventory.id || `part_${Date.now()}`,
      part_code: partInventory.part_code,
      part_name: partInventory.part_name,
      quantity: 1,
      unit_price: partInventory.unit_cost,
      total: partInventory.unit_cost
    };

    onPartsChange([...selectedParts, newPart]);
    setSelectedPartValue(null);
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

  const addService = (additionalService: { id: string; description: string; value: number; label: string }) => {
    const existingService = selectedServices.find(s => s.id === additionalService.id);
    if (existingService) {
      toast({
        title: 'Atenção',
        description: 'Este serviço já foi adicionado',
        variant: 'destructive'
      });
      setSelectedServiceValue(null);
      return;
    }

    const service: Service = {
      id: additionalService.id,
      description: additionalService.description,
      quantity: 1,
      unit_price: additionalService.value,
      total: additionalService.value,
    };

    onServicesChange([...selectedServices, service]);
    setSelectedServiceValue(null);
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
            <InfiniteAutocomplete
              options={partsInventory}
              loading={loadingParts}
              label="Buscar peça..."
              placeholder="Digite para buscar ou selecione"
              getOptionLabel={(option) => option.label}
              value={selectedPartValue}
              onChange={(_, newValue) => {
                if (newValue) {
                  addPart(newValue);
                } else {
                  setSelectedPartValue(null);
                }
              }}
              renderOption={(props, option) => {
                const isSelected = selectedParts.some(p => p.part_code === option.part_code);
                return (
                  <li {...props} key={option.id}>
                    <Box sx={{ width: '100%' }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          textDecoration: isSelected ? 'line-through' : 'none',
                          color: isSelected ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {option.part_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        Código: {option.part_code} | Estoque: {option.quantity} | Preço: R$ {option.unit_cost.toFixed(2)}
                        {isSelected && ' (já adicionado)'}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              filterOptions={(options, { inputValue }) => {
                return options.filter(option =>
                  option.part_name.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.part_code.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
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
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => updatePartQuantity(part.id, Math.max(1, part.quantity - 1))}
                          >
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={part.quantity}
                            onChange={(e) => updatePartQuantity(part.id, parseInt(e.target.value) || 1)}
                            className="w-16 sm:w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => updatePartQuantity(part.id, part.quantity + 1)}
                          >
                            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
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
          {/* Seleção de Serviços */}
          <div className="space-y-2">
            <Label>Selecionar Serviço Adicional</Label>
            <InfiniteAutocomplete
              options={filteredServices.map(s => ({
                id: s.id,
                label: `${s.description} - R$ ${s.value.toFixed(2)}`,
                description: s.description,
                value: s.value,
                macro_component: s.macro_component
              }))}
              loading={loadingServices}
              label="Buscar serviço..."
              placeholder="Digite para buscar ou selecione"
              getOptionLabel={(option) => option.label}
              value={selectedServiceValue}
              onChange={(_, newValue) => {
                if (newValue) {
                  addService(newValue);
                } else {
                  setSelectedServiceValue(null);
                }
              }}
              renderOption={(props, option) => {
                const isSelected = selectedServices.some(s => s.id === option.id);
                return (
                  <li {...props} key={option.id}>
                    <Box sx={{ width: '100%' }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          textDecoration: isSelected ? 'line-through' : 'none',
                          color: isSelected ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {option.description}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        Valor: R$ {option.value.toFixed(2)}
                        {option.macro_component && ` | ${option.macro_component.name}`}
                        {isSelected && ' (já adicionado)'}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
              filterOptions={(options, { inputValue }) => {
                return options.filter(option =>
                  option.description.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
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
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => updateServiceQuantity(service.id, Math.max(1, service.quantity - 1))}
                          >
                            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => updateServiceQuantity(service.id, parseInt(e.target.value) || 1)}
                            className="w-16 sm:w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
                          >
                            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
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
