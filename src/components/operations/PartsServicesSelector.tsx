import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Trash2, Package, Wrench, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { usePartsInventory } from '@/hooks/usePartsInventory';
import { useAdditionalServices } from '@/hooks/useAdditionalServices';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MaskedInput } from '@/components/ui/masked-input';
import type { EngineTemplate } from '@/services/EngineTemplateService';

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
  engineTemplate?: EngineTemplate | null;
}

export function PartsServicesSelector({
  selectedParts,
  selectedServices,
  onPartsChange,
  onServicesChange,
  macroComponentId,
  engineTypeId,
  engineTemplate
}: PartsServicesSelectorProps) {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const { getAvailableParts, loading: loadingParts } = usePartsInventory();
  const { additionalServices, loading: loadingServices } = useAdditionalServices();
  const [partsInventory, setPartsInventory] = useState<Array<{ id: string; part_code: string; part_name: string; unit_cost: number; quantity: number; label: string }>>([]);
  const [selectedPartValue, setSelectedPartValue] = useState<{ id: string; part_code: string; part_name: string; unit_cost: number; quantity: number; label: string } | null>(null);
  const [selectedServiceValue, setSelectedServiceValue] = useState<{ id: string; description: string; value: number; label: string } | null>(null);
  const [filteredServices, setFilteredServices] = useState(additionalServices.filter(s => s.is_active));
  const [partsSearchTerm, setPartsSearchTerm] = useState('');
  const [servicesSearchTerm, setServicesSearchTerm] = useState('');

  useEffect(() => {
    const loadParts = async () => {
      if (engineTemplate) {
        const templateParts = (engineTemplate.parts || [])
          .filter(tp => !macroComponentId || tp.part?.macro_component_id === macroComponentId)
          .map(tp => ({
          id: tp.part_id,
          part_code: tp.part?.part_code || '',
          part_name: tp.part?.part_name || '',
          unit_cost: tp.part?.unit_cost || 0,
          quantity: tp.quantity,
          label: `${tp.part?.part_code || ''} - ${tp.part?.part_name || ''}`
          }));
        setPartsInventory(templateParts);
        return;
      }

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
  }, [currentOrganization?.id, macroComponentId, getAvailableParts, toast, engineTemplate]);

  useEffect(() => {
    if (engineTemplate) {
      const templateServices = (engineTemplate.services || [])
        .filter(ts => !macroComponentId || ts.service?.macro_component_id === macroComponentId)
        .map(ts => {
          const effectiveValue = ts.custom_value ?? ts.service?.value ?? 0;
          return {
            id: ts.service_id,
            description: ts.service?.description || '',
            value: effectiveValue,
            is_active: true,
            macro_component_id: ts.service?.macro_component_id,
            engine_type_id: undefined,
            label: `${ts.service?.description || ''} - R$ ${effectiveValue.toFixed(2)}`
          };
        });
      setFilteredServices(templateServices);
      return;
    }

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
  }, [additionalServices, macroComponentId, engineTypeId, engineTemplate]);

  const servicesOptions = filteredServices.map(s => ({
    id: s.id,
    label: `${s.description} - R$ ${s.value.toFixed(2)}`,
    description: s.description,
    value: s.value,
    macro_component: s.macro_component
  }));

  const togglePart = (partInventory: { id: string; part_code: string; part_name: string; unit_cost: number; quantity: number; label: string }) => {
    const existingPart = selectedParts.find(p => p.part_code === partInventory.part_code);
    
    if (existingPart) {
      onPartsChange(selectedParts.filter(p => p.part_code !== partInventory.part_code));
    } else {
      const newPart: Part = {
        id: partInventory.id || `part_${Date.now()}`,
        part_code: partInventory.part_code,
        part_name: partInventory.part_name,
        quantity: 1,
        unit_price: partInventory.unit_cost,
        total: partInventory.unit_cost
      };
      onPartsChange([...selectedParts, newPart]);
    }
  };

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

  const filteredParts = partsInventory.filter(part =>
    part.part_name.toLowerCase().includes(partsSearchTerm.toLowerCase()) ||
    part.part_code.toLowerCase().includes(partsSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Peças Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecionar Peças</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={partsSearchTerm}
                onChange={(e) => setPartsSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loadingParts ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando peças...
            </div>
          ) : filteredParts.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredParts.map((part) => {
                  const isChecked = selectedParts.some(p => p.part_code === part.part_code);
                  return (
                    <div 
                      key={part.id} 
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
                        isChecked ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        id={`part-${part.id}`}
                        checked={isChecked}
                        onCheckedChange={() => togglePart(part)}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`part-${part.id}`} 
                        className="flex-1 cursor-pointer space-y-1"
                      >
                        <div className="font-medium text-sm">{part.part_name}</div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>Código: {part.part_code}</div>
                          <div className="flex items-center justify-between">
                            <span>Estoque: {part.quantity}</span>
                            <span className="font-medium text-primary">
                              R$ {part.unit_cost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {partsSearchTerm ? 'Nenhuma peça encontrada' : 'Nenhuma peça disponível'}
            </div>
          )}

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecionar Serviços</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição..."
                value={servicesSearchTerm}
                onChange={(e) => setServicesSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loadingServices ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando serviços...
            </div>
          ) : filteredServices.filter(service =>
              service.description.toLowerCase().includes(servicesSearchTerm.toLowerCase())
            ).length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredServices
                  .filter(service =>
                    service.description.toLowerCase().includes(servicesSearchTerm.toLowerCase())
                  )
                  .map((service) => {
                    const isChecked = selectedServices.some(s => s.id === service.id);
                    return (
                      <div 
                        key={service.id} 
                        className={cn(
                          "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
                          isChecked ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={isChecked}
                          onCheckedChange={() => {
                            if (isChecked) {
                              removeService(service.id);
                            } else {
                              addService({
                                id: service.id,
                                description: service.description,
                                value: service.value,
                                label: `${service.description} - R$ ${service.value.toFixed(2)}`
                              });
                            }
                          }}
                          className="mt-1"
                        />
                        <Label 
                          htmlFor={`service-${service.id}`} 
                          className="flex-1 cursor-pointer space-y-1"
                        >
                          <div className="font-medium text-sm">{service.description}</div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {service.macro_component && (
                              <div>Componente: {service.macro_component.name}</div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-primary">
                                R$ {service.value.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {servicesSearchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço disponível'}
            </div>
          )}

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
