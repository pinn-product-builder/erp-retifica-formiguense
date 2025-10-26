import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Settings, Shield, Database, Zap } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useAudit } from '@/hooks/useAudit';
import { toast } from 'sonner';

interface ConfigItem {
  id?: string;
  key: string;
  value: unknown;
  category: string;
  description: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_active: boolean;
}

function SystemConfigAdmin() {
  const { configs, loading, setConfig, refetch } = useSystemConfig();
  const { logAction } = useAudit();
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ConfigItem>({
    key: '',
    value: '',
    category: 'general',
    description: '',
    data_type: 'string',
    is_active: true
  });

  const categories = [
    { id: 'general', name: 'Geral', icon: Settings },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'database', name: 'Banco de Dados', icon: Database },
    { id: 'performance', name: 'Performance', icon: Zap }
  ];

  const resetForm = () => {
    setFormData({
      key: '',
      value: '',
      category: 'general',
      description: '',
      data_type: 'string',
      is_active: true
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: ConfigItem) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      key: item.key,
      value: item.value,
      category: item.category,
      description: item.description || '',
      data_type: item.data_type,
      is_active: item.is_active
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.key.trim()) {
        toast.error('Chave é obrigatória');
        return;
      }

      await setConfig(formData.key, formData.value, formData.category, formData.data_type);

      await logAction({
        table_name: 'system_config',
        operation: editingItem ? 'UPDATE' : 'INSERT',
        record_id: editingItem?.id,
        old_values: editingItem,
        new_values: formData
      });

      toast.success(editingItem ? 'Configuração atualizada!' : 'Configuração criada!');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const getConfigsByCategory = (category: string) => {
    return configs.filter(config => config.category === category);
  };

    const formatValue = (value: string, dataType: string) => {
    switch (dataType) {
      case 'boolean':
        return value ? 'Sim' : 'Não';
      case 'json':
        try {
          return JSON.stringify(JSON.parse(value as string), null, 2);
        } catch {
          return value;
        }
      default:
        return String(value);
    }
  };

  if (loading) {
    return <div className="p-6">Carregando configurações...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie configurações dinâmicas do sistema por categoria
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Configuração' : 'Nova Configuração'}
              </DialogTitle>
              <DialogDescription>
                Configure parâmetros dinâmicos do sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key">Chave *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="ex: max_login_attempts"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="data_type">Tipo de Dados</Label>
                <Select value={formData.data_type} onValueChange={(value: 'string' | 'number' | 'boolean' | 'json') => setFormData({ ...formData, data_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="boolean">Sim/Não</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Valor</Label>
                {formData.data_type === 'boolean' ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={Boolean(formData.value)}
                      onCheckedChange={(checked) => setFormData({ ...formData, value: checked })}
                    />
                    <span>{formData.value ? 'Sim' : 'Não'}</span>
                  </div>
                ) : formData.data_type === 'json' ? (
                  <Textarea
                    value={formData.value as string}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={3}
                  />
                ) : (
                  <Input
                    type={formData.data_type === 'number' ? 'number' : 'text'}
                    value={formData.value as string}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da configuração"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          {categories.map(category => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {category.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid gap-4">
              {getConfigsByCategory(category.id).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <category.icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma configuração encontrada na categoria {category.name}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                getConfigsByCategory(category.id).map(config => (
                  <Card key={config.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-mono">
                            {config.key}
                          </CardTitle>
                          {config.description && (
                            <CardDescription className="mt-1">
                              {config.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {config.data_type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(config as ConfigItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <pre className="text-sm whitespace-pre-wrap">
                          {formatValue(config.value as string, config.data_type as string)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default SystemConfigAdmin;
export { SystemConfigAdmin };