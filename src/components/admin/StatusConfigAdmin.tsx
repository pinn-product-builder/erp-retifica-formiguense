import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from '@/hooks/use-toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface StatusConfig {
  id: string;
  entity_type: string;
  status_key: string;
  status_label: string;
  badge_variant: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  org_id?: string;
}

export const StatusConfigAdmin = () => {
  const { currentOrganization } = useOrganization();
  const { confirm } = useConfirmDialog();
  const [configs, setConfigs] = useState<StatusConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<StatusConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    entity_type: 'order',
    status_key: '',
    status_label: '',
    badge_variant: 'default',
    color: '',
    icon: '',
    is_active: true
  });

  const fetchConfigs = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_config')
        .select('*')
        .order('entity_type, status_key');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching status configs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentOrganization) return;

    try {
      const configData = {
        ...formData,
        org_id: currentOrganization.id
      };

      if (editingConfig) {
        const { error } = await supabase
          .from('status_config')
          .update(configData)
          .eq('id', editingConfig.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Configuração de status atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('status_config')
          .insert(configData);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Configuração de status criada com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchConfigs();
    } catch (error: any) {
      console.error('Error saving status config:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração de status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir esta configuração de status?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('status_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Configuração de status excluída com sucesso",
      });
      
      fetchConfigs();
    } catch (error) {
      console.error('Error deleting status config:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir configuração de status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      entity_type: 'order',
      status_key: '',
      status_label: '',
      badge_variant: 'default',
      color: '',
      icon: '',
      is_active: true
    });
    setEditingConfig(null);
  };

  const openEditDialog = (config: StatusConfig) => {
    setEditingConfig(config);
    setFormData({
      entity_type: config.entity_type,
      status_key: config.status_key,
      status_label: config.status_label,
      badge_variant: config.badge_variant,
      color: config.color || '',
      icon: config.icon || '',
      is_active: config.is_active
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchConfigs();
  }, [currentOrganization]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuração de Status</CardTitle>
            <CardDescription>
              Configure a aparência dos status das entidades do sistema
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Configuração
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
                </DialogTitle>
                <DialogDescription>
                  Configure a aparência do status para uma entidade
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity_type">Tipo de Entidade</Label>
                    <Select value={formData.entity_type} onValueChange={(value) => setFormData(prev => ({ ...prev, entity_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Pedido</SelectItem>
                        <SelectItem value="budget">Orçamento</SelectItem>
                        <SelectItem value="payment">Pagamento</SelectItem>
                        <SelectItem value="customer">Cliente</SelectItem>
                        <SelectItem value="consultant">Consultor</SelectItem>
                        <SelectItem value="part">Peça</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status_key">Chave do Status</Label>
                    <Input
                      id="status_key"
                      value={formData.status_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, status_key: e.target.value }))}
                      placeholder="ativa"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status_label">Rótulo do Status</Label>
                  <Input
                    id="status_label"
                    value={formData.status_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, status_label: e.target.value }))}
                    placeholder="Ativa"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="badge_variant">Variante do Badge</Label>
                    <Select value={formData.badge_variant} onValueChange={(value) => setFormData(prev => ({ ...prev, badge_variant: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="destructive">Destructive</SelectItem>
                        <SelectItem value="outline">Outline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="blue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Ícone</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="CheckCircle"
                    />
                  </div>
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
            {configs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{config.status_label}</h3>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant={config.badge_variant as any}>
                      {config.badge_variant}
                    </Badge>
                    {!config.org_id && <Badge variant="secondary">Global</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entidade: {config.entity_type} • Chave: {config.status_key}
                    {config.color && ` • Cor: ${config.color}`}
                    {config.icon && ` • Ícone: ${config.icon}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(config)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {config.org_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {configs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma configuração de status encontrada
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};