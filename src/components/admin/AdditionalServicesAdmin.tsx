import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Wrench, Loader2 } from 'lucide-react';
import { useAdditionalServices, AdditionalService } from '@/hooks/useAdditionalServices';
import { useMacroComponents } from '@/hooks/useMacroComponents';
import { useEngineTypes } from '@/hooks/useEngineTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { MaskedInput } from '@/components/ui/masked-input';

export function AdditionalServicesAdmin() {
  const { additionalServices, loading, createAdditionalService, updateAdditionalService, deleteAdditionalService } = useAdditionalServices();
  const { macroComponents } = useMacroComponents();
  const { engineTypes } = useEngineTypes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<AdditionalService | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    value: 0,
    valueFormatted: 'R$ 0,00',
    macro_component_id: '',
    engine_type_id: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDialog = (service?: AdditionalService) => {
    if (service) {
      setEditingService(service);
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(service.value);
      setFormData({
        description: service.description,
        value: service.value,
        valueFormatted: formattedValue,
        macro_component_id: service.macro_component_id || '',
        engine_type_id: service.engine_type_id || '',
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({
        description: '',
        value: 0,
        valueFormatted: 'R$ 0,00',
        macro_component_id: '',
        engine_type_id: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
    setFormData({
      description: '',
      value: 0,
      valueFormatted: 'R$ 0,00',
      macro_component_id: '',
      engine_type_id: '',
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        description: formData.description,
        value: formData.value,
        macro_component_id: formData.macro_component_id || undefined,
        engine_type_id: formData.engine_type_id || undefined,
        is_active: formData.is_active
      };

      if (editingService) {
        await updateAdditionalService(editingService.id, submitData);
      } else {
        await createAdditionalService(submitData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar serviço adicional:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço adicional?')) return;
    await deleteAdditionalService(id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Serviços Adicionais</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os serviços adicionais disponíveis para diagnósticos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Componente Macro</TableHead>
                  <TableHead>Tipo de Motor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {additionalServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum serviço adicional cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  additionalServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.description}</TableCell>
                      <TableCell>{formatCurrency(service.value)}</TableCell>
                      <TableCell>
                        {service.macro_component ? (
                          <Badge variant="outline">{service.macro_component.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.engine_type ? (
                          <Badge variant="outline">{service.engine_type.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                          {service.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(service)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {editingService ? 'Editar Serviço Adicional' : 'Novo Serviço Adicional'}
            </DialogTitle>
            <DialogDescription>
              {editingService 
                ? 'Atualize as informações do serviço adicional'
                : 'Preencha os dados para criar um novo serviço adicional'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Retífica de bloco, Usinagem de biela..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valor *</Label>
                <MaskedInput
                  id="value"
                  mask="currency"
                  value={formData.valueFormatted}
                  onChange={(formattedValue, rawValue) => {
                    const numericValue = parseFloat(rawValue) || 0;
                    setFormData({ 
                      ...formData, 
                      value: numericValue,
                      valueFormatted: formattedValue
                    });
                  }}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="macro_component_id">Componente Macro</Label>
                <Select
                  value={formData.macro_component_id || "__none__"}
                  onValueChange={(value) => setFormData({ ...formData, macro_component_id: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um componente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {macroComponents
                      .filter(mc => mc.is_active)
                      .map((component) => (
                        <SelectItem key={component.id} value={component.id}>
                          {component.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine_type_id">Tipo de Motor</Label>
                <Select
                  value={formData.engine_type_id || "__none__"}
                  onValueChange={(value) => setFormData({ ...formData, engine_type_id: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo de motor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {engineTypes.map((engineType) => (
                      <SelectItem key={engineType.id} value={engineType.id}>
                        {engineType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Se não selecionar, o serviço será aplicado a todos os tipos de motor
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="is_active">Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Serviços inativos não aparecerão nas seleções
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingService ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

