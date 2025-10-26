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

interface SearchSource {
  id: string;
  source_name: string;
  source_type: string;
  table_name?: string;
  search_fields: unknown;
  display_fields: unknown;
  result_template?: string;
  is_active: boolean;
  weight: number;
  permissions?: unknown;
  org_id?: string;
}

export const SearchSourcesAdmin = () => {
  const { currentOrganization } = useOrganization();
  const { confirm } = useConfirmDialog();
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSource, setEditingSource] = useState<SearchSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    source_name: '',
    source_type: 'table',
    table_name: '',
    search_fields: '[]',
    display_fields: '[]',
    result_template: '',
    is_active: true,
    weight: 100
  });

  const fetchSources = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('search_sources')
        .select('*')
        .order('weight', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching search sources:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar fontes de busca",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentOrganization) return;

    try {
      let parsedSearchFields, parsedDisplayFields;
      try {
        parsedSearchFields = JSON.parse(formData.search_fields);
        parsedDisplayFields = JSON.parse(formData.display_fields);
      } catch {
        throw new Error('Campos de busca e exibição devem ser JSON válidos');
      }

      const sourceData = {
        ...formData,
        search_fields: parsedSearchFields,
        display_fields: parsedDisplayFields,
        org_id: currentOrganization.id
      };

      if (editingSource) {
        const { error } = await supabase
          .from('search_sources')
          .update(sourceData)
          .eq('id', editingSource.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Fonte de busca atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('search_sources')
          .insert(sourceData);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Fonte de busca criada com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSources();
    } catch (error: unknown) {
      console.error('Error saving search source:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar fonte de busca",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir esta fonte de busca?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('search_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Fonte de busca excluída com sucesso",
      });
      
      fetchSources();
    } catch (error) {
      console.error('Error deleting search source:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir fonte de busca",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      source_name: '',
      source_type: 'table',
      table_name: '',
      search_fields: '[]',
      display_fields: '[]',
      result_template: '',
      is_active: true,
      weight: 100
    });
    setEditingSource(null);
  };

  const openEditDialog = (source: SearchSource) => {
    setEditingSource(source);
    setFormData({
      source_name: source.source_name,
      source_type: source.source_type,
      table_name: source.table_name || '',
      search_fields: JSON.stringify(source.search_fields, null, 2),
      display_fields: JSON.stringify(source.display_fields, null, 2),
      result_template: source.result_template || '',
      is_active: source.is_active,
      weight: source.weight
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchSources();
  }, [currentOrganization]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fontes de Busca</CardTitle>
            <CardDescription>
              Configure as fontes de dados para a busca global do sistema
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Fonte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSource ? 'Editar Fonte de Busca' : 'Nova Fonte de Busca'}
                </DialogTitle>
                <DialogDescription>
                  Configure uma fonte de dados para a busca global
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source_name">Nome da Fonte</Label>
                    <Input
                      id="source_name"
                      value={formData.source_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                      placeholder="Clientes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source_type">Tipo</Label>
                    <Select value={formData.source_type} onValueChange={(value) => setFormData(prev => ({ ...prev, source_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Tabela</SelectItem>
                        <SelectItem value="view">View</SelectItem>
                        <SelectItem value="function">Função</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="table_name">Nome da Tabela/View</Label>
                  <Input
                    id="table_name"
                    value={formData.table_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, table_name: e.target.value }))}
                    placeholder="customers"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="search_fields">Campos de Busca (JSON)</Label>
                    <Textarea
                      id="search_fields"
                      value={formData.search_fields}
                      onChange={(e) => setFormData(prev => ({ ...prev, search_fields: e.target.value }))}
                      placeholder='["name", "document", "email"]'
                      className="font-mono text-sm"
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="display_fields">Campos de Exibição (JSON)</Label>
                    <Textarea
                      id="display_fields"
                      value={formData.display_fields}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_fields: e.target.value }))}
                      placeholder='["name", "document", "phone"]'
                      className="font-mono text-sm"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result_template">Template de Resultado</Label>
                  <Textarea
                    id="result_template"
                    value={formData.result_template}
                    onChange={(e) => setFormData(prev => ({ ...prev, result_template: e.target.value }))}
                    placeholder="{{name}} - {{document}}"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (Prioridade)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: parseInt(e.target.value) || 100 }))}
                      min="1"
                      max="1000"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
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
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{source.source_name}</h3>
                    <Badge variant={source.is_active ? "default" : "secondary"}>
                      {source.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{source.source_type}</Badge>
                    {!source.org_id && <Badge variant="secondary">Global</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tabela: {source.table_name} • Peso: {source.weight}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Campos: {source.search_fields?.length || 0} • Exibição: {source.display_fields?.length || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(source)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {source.org_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {sources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma fonte de busca configurada
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};