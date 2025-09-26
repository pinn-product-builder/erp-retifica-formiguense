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
import { AdminOnly } from '@/components/auth/PermissionGate';
import { useAdminGuard } from '@/hooks/useRoleGuard';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface ReportCatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  template_type: string;
  parameters_schema: any;
  permissions?: any;
  is_active: boolean;
  display_order: number;
  org_id?: string;
}

export const ReportCatalogAdmin = () => {
  // Verificar permissões de admin
  const { hasPermission } = useAdminGuard({
    toastMessage: 'Acesso restrito a administradores para gerenciar catálogo de relatórios.'
  });

  const { currentOrganization } = useOrganization();
  const { confirm } = useConfirmDialog();
  const [items, setItems] = useState<ReportCatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<ReportCatalogItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Se não tem permissão, não renderizar nada
  if (!hasPermission) {
    return null;
  }

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'general',
    template_type: 'csv',
    parameters_schema: '{}',
    is_active: true,
    display_order: 0
  });

  const fetchItems = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_catalog')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching report catalog:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar catálogo de relatórios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentOrganization) return;

    try {
      let parsedSchema;
      try {
        parsedSchema = JSON.parse(formData.parameters_schema);
      } catch {
        throw new Error('Schema de parâmetros deve ser um JSON válido');
      }

      const itemData = {
        ...formData,
        parameters_schema: parsedSchema,
        org_id: currentOrganization.id
      };

      if (editingItem) {
        const { error } = await supabase
          .from('report_catalog')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Relatório atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('report_catalog')
          .insert(itemData);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Relatório criado com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error('Error saving report catalog item:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar relatório",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir este relatório?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('report_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Relatório excluído com sucesso",
      });
      
      fetchItems();
    } catch (error) {
      console.error('Error deleting report catalog item:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir relatório",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'general',
      template_type: 'csv',
      parameters_schema: '{}',
      is_active: true,
      display_order: 0
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: ReportCatalogItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      category: item.category,
      template_type: item.template_type,
      parameters_schema: JSON.stringify(item.parameters_schema, null, 2),
      is_active: item.is_active,
      display_order: item.display_order
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchItems();
  }, [currentOrganization]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Catálogo de Relatórios</CardTitle>
            <CardDescription>
              Gerencie os tipos de relatórios disponíveis no sistema
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar Relatório' : 'Novo Relatório'}
                </DialogTitle>
                <DialogDescription>
                  Configure as propriedades do relatório
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="codigo_relatorio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome do Relatório"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do relatório"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Geral</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="estoque">Estoque</SelectItem>
                        <SelectItem value="fiscal">Fiscal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template_type">Tipo</Label>
                    <Select value={formData.template_type} onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
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

                <div className="space-y-2">
                  <Label htmlFor="parameters_schema">Schema de Parâmetros (JSON)</Label>
                  <Textarea
                    id="parameters_schema"
                    value={formData.parameters_schema}
                    onChange={(e) => setFormData(prev => ({ ...prev, parameters_schema: e.target.value }))}
                    placeholder='{"period": {"type": "daterange", "required": true}}'
                    className="font-mono text-sm"
                    rows={4}
                  />
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
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                    <Badge variant="outline">{item.template_type.toUpperCase()}</Badge>
                    {!item.org_id && <Badge variant="secondary">Global</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {item.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Código: {item.code} • Ordem: {item.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {item.org_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum relatório configurado
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};