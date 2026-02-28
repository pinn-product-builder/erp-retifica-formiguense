import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Warehouse,
  Plus,
  MapPin,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Star,
  Package,
} from 'lucide-react';
import { useWarehouses } from '@/hooks/useWarehouses';
import type { Warehouse as WarehouseType, WarehouseLocation, CreateWarehouseInput, CreateLocationInput } from '@/services/WarehouseService';

function WarehouseForm({
  warehouse,
  onSubmit,
  onCancel,
}: {
  warehouse?: WarehouseType;
  onSubmit: (data: CreateWarehouseInput) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(warehouse?.code ?? '');
  const [name, setName] = useState(warehouse?.name ?? '');
  const [address, setAddress] = useState(warehouse?.address ?? '');
  const [isDefault, setIsDefault] = useState(warehouse?.is_default ?? false);
  const [isActive, setIsActive] = useState(warehouse?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ code, name, address: address || null, is_default: isDefault, is_active: isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wh-code" className="text-xs sm:text-sm">Código *</Label>
          <Input
            id="wh-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ALMOX-01"
            required
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wh-name" className="text-xs sm:text-sm">Nome *</Label>
          <Input
            id="wh-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Almoxarifado Principal"
            required
            className="h-9"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wh-address" className="text-xs sm:text-sm">Endereço</Label>
        <Input
          id="wh-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rua Industrial, 123 - Galpão A"
          className="h-9"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch id="wh-default" checked={isDefault} onCheckedChange={setIsDefault} />
          <Label htmlFor="wh-default" className="text-xs sm:text-sm cursor-pointer">Depósito padrão</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="wh-active" checked={isActive} onCheckedChange={setIsActive} />
          <Label htmlFor="wh-active" className="text-xs sm:text-sm cursor-pointer">Ativo</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm">{warehouse ? 'Salvar' : 'Criar Depósito'}</Button>
      </div>
    </form>
  );
}

function LocationForm({
  warehouseId,
  location,
  onSubmit,
  onCancel,
}: {
  warehouseId: string;
  location?: WarehouseLocation;
  onSubmit: (data: CreateLocationInput) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(location?.code ?? '');
  const [aisle, setAisle] = useState(location?.aisle ?? '');
  const [rack, setRack] = useState(location?.rack ?? '');
  const [bin, setBin] = useState(location?.bin ?? '');
  const [maxCapacity, setMaxCapacity] = useState(location?.max_capacity?.toString() ?? '');
  const [isActive, setIsActive] = useState(location?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      warehouse_id: warehouseId,
      code,
      aisle: aisle || null,
      rack: rack || null,
      bin: bin || null,
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Código *</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="A-01-01"
            required
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Capacidade Máx.</Label>
          <Input
            type="number"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            placeholder="100"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Rua/Corredor</Label>
          <Input value={aisle} onChange={(e) => setAisle(e.target.value)} placeholder="A" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Prateleira</Label>
          <Input value={rack} onChange={(e) => setRack(e.target.value)} placeholder="01" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm">Posição/Bin</Label>
          <Input value={bin} onChange={(e) => setBin(e.target.value)} placeholder="01" className="h-9" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="loc-active" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="loc-active" className="text-xs sm:text-sm cursor-pointer">Ativo</Label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm">{location ? 'Salvar' : 'Criar Localização'}</Button>
      </div>
    </form>
  );
}

function WarehouseCard({
  warehouse,
  onEdit,
  onDelete,
  onAddLocation,
}: {
  warehouse: WarehouseType & { location_count: number };
  onEdit: (w: WarehouseType) => void;
  onDelete: (id: string) => void;
  onAddLocation: (warehouseId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { locations, fetchLocations, deleteLocation } = useWarehouses();

  const handleToggle = async () => {
    if (!open && warehouse.id) {
      await fetchLocations(warehouse.id);
    }
    setOpen((prev) => !prev);
  };

  return (
    <Card className="border">
      <Collapsible open={open} onOpenChange={handleToggle}>
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </Button>
                </CollapsibleTrigger>
                <span className="font-semibold text-sm sm:text-base truncate">{warehouse.name}</span>
                <Badge variant="outline" className="font-mono text-xs">{warehouse.code}</Badge>
                {warehouse.is_default && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    <Star className="w-2.5 h-2.5 mr-0.5" />
                    Padrão
                  </Badge>
                )}
                {!warehouse.is_active && (
                  <Badge variant="secondary" className="text-xs">Inativo</Badge>
                )}
              </div>
              {warehouse.address && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-8">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{warehouse.address}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-8 sm:ml-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Package className="w-3 h-3" />
                {warehouse.location_count} localizações
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(warehouse)}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(warehouse.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
            <div className="border rounded-md">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                <span className="text-xs font-medium text-muted-foreground">Localizações</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 text-xs"
                  onClick={() => onAddLocation(warehouse.id)}
                >
                  <Plus className="w-3 h-3" />
                  Adicionar
                </Button>
              </div>
              {locations.filter((l) => l.warehouse_id === warehouse.id).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma localização cadastrada
                </p>
              ) : (
                <div className="divide-y">
                  {locations
                    .filter((l) => l.warehouse_id === warehouse.id)
                    .map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">{loc.code}</Badge>
                          {loc.aisle && <span className="text-xs text-muted-foreground">Rua {loc.aisle}</span>}
                          {loc.rack && <span className="text-xs text-muted-foreground">/ Prat. {loc.rack}</span>}
                          {loc.bin && <span className="text-xs text-muted-foreground">/ Pos. {loc.bin}</span>}
                          {!loc.is_active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteLocation(loc.id, warehouse.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function WarehousesManager() {
  const { warehouses, loading, createWarehouse, updateWarehouse, deleteWarehouse, createLocation } =
    useWarehouses();

  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [activeLocationWarehouseId, setActiveLocationWarehouseId] = useState<string | null>(null);

  const handleWarehouseSubmit = async (data: CreateWarehouseInput) => {
    let success: boolean;
    if (selectedWarehouse) {
      success = await updateWarehouse(selectedWarehouse.id, data);
    } else {
      success = await createWarehouse(data);
    }
    if (success) {
      setIsWarehouseDialogOpen(false);
      setSelectedWarehouse(null);
    }
  };

  const handleLocationSubmit = async (data: CreateLocationInput) => {
    const success = await createLocation(data);
    if (success) setIsLocationDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Warehouse className="w-4 h-4 sm:w-5 sm:h-5" />
                Depósitos e Localizações
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Gerencie depósitos e a estrutura hierárquica de localizações
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="gap-1.5 self-start"
              onClick={() => {
                setSelectedWarehouse(null);
                setIsWarehouseDialogOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Depósito</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading && warehouses.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Carregando depósitos...</p>
          </CardContent>
        </Card>
      ) : warehouses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Warehouse className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Nenhum depósito cadastrado. Crie o primeiro depósito para organizar seu estoque.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSelectedWarehouse(null);
                setIsWarehouseDialogOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Criar Primeiro Depósito
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {warehouses.map((wh) => (
            <WarehouseCard
              key={wh.id}
              warehouse={wh}
              onEdit={(w) => {
                setSelectedWarehouse(w);
                setIsWarehouseDialogOpen(true);
              }}
              onDelete={(id) => deleteWarehouse(id)}
              onAddLocation={(wid) => {
                setActiveLocationWarehouseId(wid);
                setIsLocationDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={isWarehouseDialogOpen} onOpenChange={(open) => {
        setIsWarehouseDialogOpen(open);
        if (!open) setSelectedWarehouse(null);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWarehouse ? 'Editar Depósito' : 'Novo Depósito'}</DialogTitle>
            <DialogDescription>
              {selectedWarehouse ? 'Atualize as informações do depósito' : 'Preencha os dados para criar um novo depósito'}
            </DialogDescription>
          </DialogHeader>
          <WarehouseForm
            warehouse={selectedWarehouse ?? undefined}
            onSubmit={handleWarehouseSubmit}
            onCancel={() => {
              setIsWarehouseDialogOpen(false);
              setSelectedWarehouse(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Localização</DialogTitle>
            <DialogDescription>
              Adicione uma localização ao depósito selecionado
            </DialogDescription>
          </DialogHeader>
          {activeLocationWarehouseId && (
            <LocationForm
              warehouseId={activeLocationWarehouseId}
              onSubmit={handleLocationSubmit}
              onCancel={() => setIsLocationDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
