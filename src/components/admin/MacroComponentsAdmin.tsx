import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Wrench, Loader2 } from 'lucide-react';
import { useMacroComponents, MacroComponent } from '@/hooks/useMacroComponents';
import { Skeleton } from '@/components/ui/skeleton';

export function MacroComponentsAdmin() {
  const { macroComponents, loading, createMacroComponent, updateMacroComponent, deleteMacroComponent } = useMacroComponents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<MacroComponent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    display_order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDialog = (component?: MacroComponent) => {
    if (component) {
      setEditingComponent(component);
      setFormData({
        name: component.name,
        description: component.description || '',
        is_active: component.is_active,
        display_order: component.display_order
      });
    } else {
      setEditingComponent(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
        display_order: 0
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingComponent(null);
    setFormData({
      name: '',
      description: '',
      is_active: true,
      display_order: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingComponent) {
        await updateMacroComponent(editingComponent.id, formData);
      } else {
        await createMacroComponent(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar componente macro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este componente macro?')) return;
    await deleteMacroComponent(id);
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
          <h3 className="text-lg font-semibold">Componentes Macro</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os componentes macro do sistema (Bloco, Biela, Comando, etc)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Componente
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {macroComponents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum componente macro cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  macroComponents.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">{component.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {component.description || '-'}
                      </TableCell>
                      <TableCell>{component.display_order}</TableCell>
                      <TableCell>
                        <Badge variant={component.is_active ? 'default' : 'secondary'}>
                          {component.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(component)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(component.id)}
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
              {editingComponent ? 'Editar Componente Macro' : 'Novo Componente Macro'}
            </DialogTitle>
            <DialogDescription>
              {editingComponent 
                ? 'Atualize as informações do componente macro'
                : 'Preencha os dados para criar um novo componente macro'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Bloco, Biela, Comando..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do componente macro..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="is_active">Ativo</Label>
                  <p className="text-xs text-muted-foreground">
                    Componentes inativos não aparecerão nas seleções
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
                {editingComponent ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

