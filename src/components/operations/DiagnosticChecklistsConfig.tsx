import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, ClipboardList, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useDiagnosticChecklists, useDiagnosticChecklistsQuery, useDiagnosticChecklistMutations } from '@/hooks/useDiagnosticChecklists';
import { useEngineTypes } from '@/hooks/useEngineTypes';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { z } from 'zod';

// Schemas de validação
const checklistSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z.string().optional(),
  component: z.enum(['bloco', 'eixo', 'biela', 'comando', 'cabecote'], {
    required_error: "Componente é obrigatório",
    invalid_type_error: "Componente inválido"
  }),
  engine_type_id: z.string().min(1, "Tipo de motor é obrigatório"),
  version: z.number().min(1, "Versão deve ser maior que 0").default(1),
  is_active: z.boolean().default(true)
});

const checklistItemSchema = z.object({
  item_name: z.string().trim().min(2, "Nome do item deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  item_description: z.string().optional(),
  item_type: z.enum(['checkbox', 'measurement', 'photo', 'text', 'select'], {
    required_error: "Tipo de item é obrigatório",
    invalid_type_error: "Tipo de item inválido"
  }),
  is_required: z.boolean().default(false),
  help_text: z.string().optional(),
  display_order: z.number().min(0, "Ordem deve ser maior ou igual a 0").default(0),
  item_options: z.array(z.string()).optional().default([])
});

type ChecklistFormData = z.infer<typeof checklistSchema>;
type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;

export default function DiagnosticChecklistsConfig() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();
  const { components: engineComponents, loading: componentsLoading } = useEngineComponents();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Hooks para dados
  const { data: checklists = [], isLoading } = useDiagnosticChecklistsQuery();
  const { engineTypes } = useEngineTypes();
  const mutations = useDiagnosticChecklistMutations();

  // Debug: Log dos dados carregados
  React.useEffect(() => {
    console.log('DiagnosticChecklistsConfig - checklists:', checklists);
    console.log('DiagnosticChecklistsConfig - isLoading:', isLoading);
    console.log('DiagnosticChecklistsConfig - engineTypes:', engineTypes);
  }, [checklists, isLoading, engineTypes]);

  // Estados para formulários com valores iniciais corretos
  const [checklistForm, setChecklistForm] = useState<ChecklistFormData>({
    name: '',
    description: '',
    component: 'bloco',
    engine_type_id: '',
    version: 1,
    is_active: true
  });

  const [itemForm, setItemForm] = useState<ChecklistItemFormData>({
    item_name: '',
    item_description: '',
    item_type: 'checkbox',
    is_required: false,
    help_text: '',
    display_order: 0,
    item_options: []
  });

  // Função para limpar formulários
  const clearForm = () => {
    setChecklistForm({
      name: '',
      description: '',
      component: 'bloco',
      engine_type_id: '',
      version: 1,
      is_active: true
    });
    setValidationErrors({});
  };

  const clearItemForm = () => {
    setItemForm({
      item_name: '',
      item_description: '',
      item_type: 'checkbox',
      is_required: false,
      help_text: '',
      display_order: 0,
      item_options: []
    });
    setValidationErrors({});
  };

  // Validação e criação de checklist
  const handleCreateChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    try {
      // Validar dados do formulário
      const validatedData = checklistSchema.parse(checklistForm);
      
      // Criar checklist
      const success = await mutations.createChecklist.mutateAsync({
        name: validatedData.name,
        description: validatedData.description,
        component: validatedData.component,
        engine_type_id: validatedData.engine_type_id,
        version: validatedData.version,
        is_active: validatedData.is_active,
        org_id: currentOrganization?.id || ''
      } as unknown);

      if (success) {
        toast({
          title: "Sucesso",
          description: "Checklist criado com sucesso"
        });
        clearForm();
        setIsDialogOpen(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path.join('.')] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Erro de validação",
          description: "Verifique os campos obrigatórios",
          variant: "destructive"
        });
      } else {
        console.error('Erro ao criar checklist:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar checklist",
          variant: "destructive"
        });
      }
    }
  };

  // Validação e criação de item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (!selectedChecklistId) {
      toast({
        title: "Erro",
        description: "Nenhum checklist selecionado",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validar dados do formulário
      const validatedData = checklistItemSchema.parse(itemForm);
      
      // Criar item
      const success = await mutations.createItem.mutateAsync({
        checklist_id: selectedChecklistId,
        item_name: validatedData.item_name,
        item_description: validatedData.item_description,
        item_type: validatedData.item_type,
        is_required: validatedData.is_required,
        help_text: validatedData.help_text,
        display_order: validatedData.display_order,
        item_options: validatedData.item_options
      } as unknown);

      if (success) {
        toast({
          title: "Sucesso",
          description: "Item adicionado com sucesso"
        });
        clearItemForm();
        setIsItemDialogOpen(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errors[err.path.join('.')] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Erro de validação",
          description: "Verifique os campos obrigatórios",
          variant: "destructive"
        });
      } else {
        console.error('Erro ao criar item:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar item",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja remover este checklist?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });
    
    if (confirmed) {
      try {
        await mutations.deleteChecklist.mutateAsync(id);
        toast({
          title: "Sucesso",
          description: "Checklist removido com sucesso"
        });
      } catch (error) {
        console.error('Erro ao excluir checklist:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover checklist",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja remover este item?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });
    
    if (confirmed) {
      try {
        await mutations.deleteItem.mutateAsync(id);
        toast({
          title: "Sucesso",
          description: "Item removido com sucesso"
        });
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        toast({
          title: "Erro",
          description: "Erro ao remover item",
          variant: "destructive"
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando checklists...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Configuração de Checklists</h3>
          <p className="text-sm text-muted-foreground">
            Configure e gerencie os checklists de diagnóstico para cada tipo de motor e componente
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhum checklist encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro checklist de diagnóstico
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Checklist
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {checklists.map((checklist) => (
            <Card key={checklist.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {checklist.name}
                      <Badge variant={checklist.is_active ? 'default' : 'secondary'}>
                        {checklist.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </CardTitle>
                    {checklist.description && (
                      <CardDescription>{checklist.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedChecklistId(checklist.id);
                        setIsItemDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Item
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteChecklist(checklist.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Componente</Label>
                    <p className="font-medium">{checklist.component}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Versão</Label>
                    <p className="font-medium">v{checklist.version}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Itens</Label>
                    <p className="font-medium">{checklist.items?.length || 0}</p>
                  </div>
                </div>
                
                {checklist.items && checklist.items.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Itens do Checklist</Label>
                    <div className="grid gap-2">
                      {checklist.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{item.item_name}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>Tipo: {item.item_type}</span>
                              {item.is_required && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar checklist */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Checklist</DialogTitle>
            <DialogDescription>
              Crie um novo checklist de diagnóstico
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateChecklist}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={checklistForm.name}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, name: e.target.value }))}
                  className={validationErrors.name ? 'border-red-500' : ''}
                  placeholder="Nome do checklist"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={checklistForm.description}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do checklist"
                />
              </div>
              <div>
                <Label htmlFor="component">Componente *</Label>
                <Select 
                  value={checklistForm.component} 
                  onValueChange={(value) => setChecklistForm(prev => ({ ...prev, component: value as unknown }))}
                >
                  <SelectTrigger className={validationErrors.component ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecionar componente" />
                  </SelectTrigger>
                  <SelectContent>
                    {componentsLoading ? (
                      <SelectItem value="loading" disabled>Carregando componentes...</SelectItem>
                    ) : (
                      engineComponents.map((component) => (
                        <SelectItem key={component.value} value={component.value}>
                          {component.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {validationErrors.component && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.component}</p>
                )}
              </div>
              <div>
                <Label htmlFor="engine_type">Tipo de Motor *</Label>
                <Select 
                  value={checklistForm.engine_type_id} 
                  onValueChange={(value) => setChecklistForm(prev => ({ ...prev, engine_type_id: value }))}
                >
                  <SelectTrigger className={validationErrors.engine_type_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecionar tipo de motor" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.engine_type_id && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.engine_type_id}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={checklistForm.is_active}
                  onCheckedChange={(checked) => setChecklistForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutations.createChecklist.isPending}>
                {mutations.createChecklist.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar item */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Item</DialogTitle>
            <DialogDescription>
              Adicione um novo item ao checklist
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateItem}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="item_name">Nome do Item *</Label>
                <Input
                  id="item_name"
                  value={itemForm.item_name}
                  onChange={(e) => setItemForm(prev => ({ ...prev, item_name: e.target.value }))}
                  className={validationErrors.item_name ? 'border-red-500' : ''}
                  placeholder="Nome do item"
                />
                {validationErrors.item_name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.item_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="item_description">Descrição</Label>
                <Textarea
                  id="item_description"
                  value={itemForm.item_description}
                  onChange={(e) => setItemForm(prev => ({ ...prev, item_description: e.target.value }))}
                  placeholder="Descrição do item"
                />
              </div>
              <div>
                <Label htmlFor="item_type">Tipo *</Label>
                <Select 
                  value={itemForm.item_type} 
                  onValueChange={(value) => setItemForm(prev => ({ ...prev, item_type: value as unknown }))}
                >
                  <SelectTrigger className={validationErrors.item_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="measurement">Medição</SelectItem>
                    <SelectItem value="photo">Foto</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="select">Seleção</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.item_type && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.item_type}</p>
                )}
              </div>
              <div>
                <Label htmlFor="help_text">Texto de Ajuda</Label>
                <Textarea
                  id="help_text"
                  value={itemForm.help_text}
                  onChange={(e) => setItemForm(prev => ({ ...prev, help_text: e.target.value }))}
                  placeholder="Texto de ajuda para o usuário"
                />
              </div>
              <div>
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={itemForm.display_order}
                  onChange={(e) => setItemForm(prev => ({ ...prev, display_order: Number(e.target.value) || 0 }))}
                  className={validationErrors.display_order ? 'border-red-500' : ''}
                  min="0"
                />
                {validationErrors.display_order && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.display_order}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={itemForm.is_required}
                  onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_required: checked }))}
                />
                <Label htmlFor="is_required">Campo obrigatório</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutations.createItem.isPending}>
                {mutations.createItem.isPending ? 'Salvando...' : 'Salvar Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}