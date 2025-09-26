import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Settings,
  List,
  Camera,
  Type,
  Hash
} from "lucide-react";
import { useDiagnosticChecklists, useDiagnosticChecklistsQuery, useDiagnosticChecklistMutations } from "@/hooks/useDiagnosticChecklists";
import { useEngineTypes } from "@/hooks/useEngineTypes";
import { useToast } from "@/hooks/use-toast";

interface DiagnosticChecklistFormData {
  name: string;
  description: string;
  engine_type_id: string;
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  is_active: boolean;
}

interface ChecklistItemFormData {
  item_name: string;
  item_description: string;
  item_type: 'checkbox' | 'measurement' | 'photo' | 'text' | 'select';
  is_required: boolean;
  display_order: number;
  help_text: string;
  item_options: any[];
  triggers_service: any[];
}

const DiagnosticChecklistsConfig = () => {
  const { toast } = useToast();
  const [selectedEngineType, setSelectedEngineType] = useState<string>('all');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { engineTypes } = useEngineTypes();
  const { data: checklists, isLoading } = useDiagnosticChecklistsQuery(
    selectedEngineType === 'all' ? undefined : selectedEngineType,
    selectedComponent === 'all' ? undefined : selectedComponent
  );

  const mutations = useDiagnosticChecklistMutations();

  const [checklistForm, setChecklistForm] = useState<DiagnosticChecklistFormData>({
    name: '',
    description: '',
    engine_type_id: '',
    component: 'bloco',
    is_active: true
  });

  const [itemForm, setItemForm] = useState<ChecklistItemFormData>({
    item_name: '',
    item_description: '',
    item_type: 'checkbox',
    is_required: false,
    display_order: 0,
    help_text: '',
    item_options: [],
    triggers_service: []
  });

  const componentOptions = [
    { value: 'bloco', label: 'Bloco' },
    { value: 'eixo', label: 'Eixo' },
    { value: 'biela', label: 'Biela' },
    { value: 'comando', label: 'Comando' },
    { value: 'cabecote', label: 'Cabeçote' }
  ];

  const itemTypeOptions = [
    { value: 'checkbox', label: 'Checkbox', icon: CheckCircle },
    { value: 'measurement', label: 'Medição', icon: Hash },
    { value: 'photo', label: 'Foto', icon: Camera },
    { value: 'text', label: 'Texto', icon: Type },
    { value: 'select', label: 'Seleção', icon: List }
  ];

  const handleCreateChecklist = async () => {
    if (!checklistForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do checklist é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      await mutations.createChecklist.mutateAsync({
        ...checklistForm,
        org_id: '', // Será setado automaticamente pelo hook
        version: 1
      });
      setIsCreateDialogOpen(false);
      setChecklistForm({
        name: '',
        description: '',
        engine_type_id: '',
        component: 'bloco',
        is_active: true
      });
    } catch (error) {
      console.error('Erro ao criar checklist:', error);
    }
  };

  const handleEditChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setChecklistForm({
      name: checklist.name,
      description: checklist.description || '',
      engine_type_id: checklist.engine_type_id || '',
      component: checklist.component,
      is_active: checklist.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateChecklist = async () => {
    if (!selectedChecklist) return;

    try {
      await mutations.updateChecklist.mutateAsync({
        id: selectedChecklist.id,
        updates: checklistForm
      });
      setIsEditDialogOpen(false);
      setSelectedChecklist(null);
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este checklist?')) {
      try {
        await mutations.deleteChecklist.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao deletar checklist:', error);
      }
    }
  };

  const handleCreateItem = async () => {
    if (!selectedChecklist || !itemForm.item_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do item é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      await mutations.createItem.mutateAsync({
        ...itemForm,
        checklist_id: selectedChecklist.id
      });
      setIsItemDialogOpen(false);
      setItemForm({
        item_name: '',
        item_description: '',
        item_type: 'checkbox',
        is_required: false,
        display_order: 0,
        help_text: '',
        item_options: [],
        triggers_service: []
      });
    } catch (error) {
      console.error('Erro ao criar item:', error);
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      item_name: item.item_name,
      item_description: item.item_description || '',
      item_type: item.item_type,
      is_required: item.is_required,
      display_order: item.display_order,
      help_text: item.help_text || '',
      item_options: item.item_options || [],
      triggers_service: item.triggers_service || []
    });
    setIsItemDialogOpen(true);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      await mutations.updateItem.mutateAsync({
        id: editingItem.id,
        updates: itemForm
      });
      setIsItemDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      try {
        await mutations.deleteItem.mutateAsync(id);
      } catch (error) {
        console.error('Erro ao deletar item:', error);
      }
    }
  };

  const getItemTypeIcon = (type: string) => {
    const option = itemTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : CheckCircle;
  };

  const getItemTypeLabel = (type: string) => {
    const option = itemTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando checklists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Checklists de Diagnóstico</h2>
          <p className="text-muted-foreground">
            Configure checklists padronizados por tipo de motor e componente
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Checklist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Checklist de Diagnóstico</DialogTitle>
              <DialogDescription>
                Configure um novo checklist para diagnóstico
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Checklist</Label>
                <Input
                  id="name"
                  value={checklistForm.name}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Checklist Bloco Motor 1.6"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={checklistForm.description}
                  onChange={(e) => setChecklistForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do checklist..."
                />
              </div>
              
              <div>
                <Label htmlFor="engine_type">Tipo de Motor</Label>
                <Select
                  value={checklistForm.engine_type_id}
                  onValueChange={(value) => setChecklistForm(prev => ({ ...prev, engine_type_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de motor" />
                  </SelectTrigger>
                  <SelectContent>
                    {engineTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="component">Componente</Label>
                <Select
                  value={checklistForm.component}
                  onValueChange={(value: any) => setChecklistForm(prev => ({ ...prev, component: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {componentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={checklistForm.is_active}
                  onCheckedChange={(checked) => setChecklistForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Checklist ativo</Label>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleCreateChecklist}
                  disabled={mutations.createChecklist.isPending}
                >
                  {mutations.createChecklist.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="engine-filter">Filtrar por Tipo de Motor</Label>
              <Select value={selectedEngineType} onValueChange={setSelectedEngineType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {engineTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="component-filter">Filtrar por Componente</Label>
              <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os componentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os componentes</SelectItem>
                  {componentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Checklists */}
      <div className="space-y-4">
        {checklists?.map((checklist) => (
          <Card key={checklist.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {checklist.name}
                    <Badge variant={checklist.is_active ? "default" : "secondary"}>
                      {checklist.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {checklist.description || "Sem descrição"}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {componentOptions.find(c => c.value === checklist.component)?.label}
                    </Badge>
                    {checklist.engine_type_id && (
                      <Badge variant="outline">
                        {engineTypes?.find(t => t.id === checklist.engine_type_id)?.name}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedChecklist(checklist);
                      setIsItemDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Item
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditChecklist(checklist)}
                  >
                    <Edit className="w-4 h-4" />
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
            
            {checklist.items && checklist.items.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Itens do Checklist</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Obrigatório</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checklist.items
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((item) => {
                          const IconComponent = getItemTypeIcon(item.item_type);
                          return (
                            <TableRow key={item.id}>
                              <TableCell>{item.display_order}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{item.item_name}</div>
                                  {item.item_description && (
                                    <div className="text-sm text-muted-foreground">
                                      {item.item_description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="w-4 h-4" />
                                  {getItemTypeLabel(item.item_type)}
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.is_required ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Obrigatório
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Opcional
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {(!checklists || checklists.length === 0) && (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhum checklist encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro checklist de diagnóstico
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Checklist
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para criar/editar item */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Adicionar Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Edite as informações do item' : 'Configure um novo item para o checklist'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item_name">Nome do Item</Label>
              <Input
                id="item_name"
                value={itemForm.item_name}
                onChange={(e) => setItemForm(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="Ex: Verificar folga do pistão"
              />
            </div>
            
            <div>
              <Label htmlFor="item_description">Descrição</Label>
              <Textarea
                id="item_description"
                value={itemForm.item_description}
                onChange={(e) => setItemForm(prev => ({ ...prev, item_description: e.target.value }))}
                placeholder="Descrição detalhada do item..."
              />
            </div>
            
            <div>
              <Label htmlFor="item_type">Tipo do Item</Label>
              <Select
                value={itemForm.item_type}
                onValueChange={(value: any) => setItemForm(prev => ({ ...prev, item_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemTypeOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                value={itemForm.display_order}
                onChange={(e) => setItemForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="help_text">Texto de Ajuda</Label>
              <Textarea
                id="help_text"
                value={itemForm.help_text}
                onChange={(e) => setItemForm(prev => ({ ...prev, help_text: e.target.value }))}
                placeholder="Instruções adicionais para o usuário..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="required"
                checked={itemForm.is_required}
                onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_required: checked }))}
              />
              <Label htmlFor="required">Item obrigatório</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsItemDialogOpen(false);
                  setEditingItem(null);
                  setItemForm({
                    item_name: '',
                    item_description: '',
                    item_type: 'checkbox',
                    is_required: false,
                    display_order: 0,
                    help_text: '',
                    item_options: [],
                    triggers_service: []
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={editingItem ? handleUpdateItem : handleCreateItem}
                disabled={mutations.createItem.isPending || mutations.updateItem.isPending}
              >
                {editingItem 
                  ? (mutations.updateItem.isPending ? 'Atualizando...' : 'Atualizar')
                  : (mutations.createItem.isPending ? 'Criando...' : 'Criar')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar checklist */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Checklist</DialogTitle>
            <DialogDescription>
              Atualize as informações do checklist
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Nome do Checklist</Label>
              <Input
                id="edit_name"
                value={checklistForm.name}
                onChange={(e) => setChecklistForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_description">Descrição</Label>
              <Textarea
                id="edit_description"
                value={checklistForm.description}
                onChange={(e) => setChecklistForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit_engine_type">Tipo de Motor</Label>
              <Select
                value={checklistForm.engine_type_id}
                onValueChange={(value) => setChecklistForm(prev => ({ ...prev, engine_type_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de motor" />
                </SelectTrigger>
                <SelectContent>
                  {engineTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit_component">Componente</Label>
              <Select
                value={checklistForm.component}
                onValueChange={(value: any) => setChecklistForm(prev => ({ ...prev, component: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {componentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_active"
                checked={checklistForm.is_active}
                onCheckedChange={(checked) => setChecklistForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="edit_active">Checklist ativo</Label>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleUpdateChecklist}
                disabled={mutations.updateChecklist.isPending}
              >
                {mutations.updateChecklist.isPending ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagnosticChecklistsConfig;
