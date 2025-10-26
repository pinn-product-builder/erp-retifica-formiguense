import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: string;
  href: string;
  variant: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  permissions?: Record<string, unknown>;
  org_id?: string;
}

export const QuickActionsAdmin = () => {
  const { currentOrganization } = useOrganization();
  const { confirm } = useConfirmDialog();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Plus',
    href: '',
    variant: 'outline',
    is_featured: false,
    is_active: true,
    display_order: 0
  });

  const fetchActions = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar ações rápidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentOrganization) return;

    try {
      const actionData = {
        ...formData,
        org_id: currentOrganization.id
      };

      if (editingAction) {
        const { error } = await supabase
          .from('quick_actions')
          .update(actionData)
          .eq('id', editingAction.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Ação rápida atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('quick_actions')
          .insert(actionData);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Ação rápida criada com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchActions();
    } catch (error) {
      console.error('Error saving quick action:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar ação rápida";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir esta ação rápida?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('quick_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Ação rápida excluída com sucesso",
      });
      
      fetchActions();
    } catch (error) {
      console.error('Error deleting quick action:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir ação rápida",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: 'Plus',
      href: '',
      variant: 'outline',
      is_featured: false,
      is_active: true,
      display_order: 0
    });
    setEditingAction(null);
  };

  const openEditDialog = (action: QuickAction) => {
    setEditingAction(action);
    setFormData({
      title: action.title,
      description: action.description || '',
      icon: action.icon,
      href: action.href,
      variant: action.variant,
      is_featured: action.is_featured,
      is_active: action.is_active,
      display_order: action.display_order
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Configure os botões de ações rápidas exibidos no dashboard
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAction ? 'Editar Ação Rápida' : 'Nova Ação Rápida'}
                </DialogTitle>
                <DialogDescription>
                  Configure as propriedades da ação rápida
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nova Ordem"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="href">Link</Label>
                    <Input
                      id="href"
                      value={formData.href}
                      onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
                      placeholder="/coleta"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da ação"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">Ícone</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Plus">Plus</SelectItem>
                        <SelectItem value="FileText">FileText</SelectItem>
                        <SelectItem value="Users">Users</SelectItem>
                        <SelectItem value="Package">Package</SelectItem>
                        <SelectItem value="Calculator">Calculator</SelectItem>
                        <SelectItem value="Settings">Settings</SelectItem>
                        <SelectItem value="BarChart3">BarChart3</SelectItem>
                        <SelectItem value="Calendar">Calendar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="variant">Variante</Label>
                    <Select value={formData.variant} onValueChange={(value) => setFormData(prev => ({ ...prev, variant: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="ghost">Ghost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_order">Ordem</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label htmlFor="is_featured">Destaque</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Ativo</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {actions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{action.title}</h3>
                    <Badge variant={action.is_active ? "default" : "secondary"}>
                      {action.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    {action.is_featured && <Badge variant="outline">Destaque</Badge>}
                    <Badge variant="outline">{action.variant}</Badge>
                    {!action.org_id && <Badge variant="secondary">Global</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {action.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Link: {action.href} • Ícone: {action.icon} • Ordem: {action.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(action)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {action.org_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(action.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {actions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma ação rápida configurada
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};