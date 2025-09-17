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

interface KPI {
  id: string;
  code: string;
  name: string;
  description?: string;
  calculation_formula: string;
  unit: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
  org_id?: string;
}

export const KPIAdmin = () => {
  // Verificar permissões de admin
  const { hasPermission } = useAdminGuard({
    toastMessage: 'Acesso restrito a administradores para gerenciar KPIs.'
  });

  const { currentOrganization } = useOrganization();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Se não tem permissão, não renderizar nada
  if (!hasPermission) {
    return null;
  }

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    calculation_formula: '',
    unit: 'number',
    icon: 'TrendingUp',
    color: 'blue',
    display_order: 0,
    is_active: true
  });

  const fetchKPIs = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar KPIs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentOrganization) return;

    try {
      const kpiData = {
        ...formData,
        org_id: currentOrganization.id
      };

      if (editingKPI) {
        const { error } = await supabase
          .from('kpis')
          .update(kpiData)
          .eq('id', editingKPI.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "KPI atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('kpis')
          .insert(kpiData);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "KPI criado com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchKPIs();
    } catch (error: any) {
      console.error('Error saving KPI:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar KPI",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este KPI?')) return;

    try {
      const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "KPI excluído com sucesso",
      });
      
      fetchKPIs();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir KPI",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      calculation_formula: '',
      unit: 'number',
      icon: 'TrendingUp',
      color: 'blue',
      display_order: 0,
      is_active: true
    });
    setEditingKPI(null);
  };

  const openEditDialog = (kpi: KPI) => {
    setEditingKPI(kpi);
    setFormData({
      code: kpi.code,
      name: kpi.name,
      description: kpi.description || '',
      calculation_formula: kpi.calculation_formula,
      unit: kpi.unit,
      icon: kpi.icon,
      color: kpi.color,
      display_order: kpi.display_order,
      is_active: kpi.is_active
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchKPIs();
  }, [currentOrganization]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>KPIs</CardTitle>
            <CardDescription>
              Configure os indicadores de performance exibidos no dashboard
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Novo KPI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingKPI ? 'Editar KPI' : 'Novo KPI'}
                </DialogTitle>
                <DialogDescription>
                  Configure as propriedades do indicador de performance
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
                      placeholder="total_vendas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Total de Vendas"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do indicador"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calculation_formula">Fórmula de Cálculo</Label>
                  <Textarea
                    id="calculation_formula"
                    value={formData.calculation_formula}
                    onChange={(e) => setFormData(prev => ({ ...prev, calculation_formula: e.target.value }))}
                    placeholder="SELECT COUNT(*) FROM orders WHERE status = 'completed'"
                    className="font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidade</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="currency">Moeda</SelectItem>
                        <SelectItem value="percentage">Porcentagem</SelectItem>
                        <SelectItem value="duration">Duração</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="icon">Ícone</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TrendingUp">TrendingUp</SelectItem>
                        <SelectItem value="BarChart3">BarChart3</SelectItem>
                        <SelectItem value="Users">Users</SelectItem>
                        <SelectItem value="Package">Package</SelectItem>
                        <SelectItem value="DollarSign">DollarSign</SelectItem>
                        <SelectItem value="Target">Target</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Cor</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Azul</SelectItem>
                        <SelectItem value="green">Verde</SelectItem>
                        <SelectItem value="orange">Laranja</SelectItem>
                        <SelectItem value="purple">Roxo</SelectItem>
                        <SelectItem value="red">Vermelho</SelectItem>
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
            {kpis.map((kpi) => (
              <div key={kpi.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{kpi.name}</h3>
                    <Badge variant={kpi.is_active ? "default" : "secondary"}>
                      {kpi.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">{kpi.unit}</Badge>
                    <Badge variant="outline">{kpi.color}</Badge>
                    {!kpi.org_id && <Badge variant="secondary">Global</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {kpi.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Código: {kpi.code} • Ícone: {kpi.icon} • Ordem: {kpi.display_order}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(kpi)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {kpi.org_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(kpi.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {kpis.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum KPI configurado
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};