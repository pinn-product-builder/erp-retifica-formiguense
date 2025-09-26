import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Settings, 
  CheckSquare,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QualityTemplate {
  id: string;
  name: string;
  description: string;
  technical_standard: 'NBR_13032' | 'BOSCH_RAM' | 'ISO_9001' | 'CUSTOM';
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  workflow_step: string;
  template_data: {
    sections: {
      id: string;
      title: string;
      items: {
        id: string;
        description: string;
        type: 'checkbox' | 'measurement' | 'text' | 'photo';
        required: boolean;
        acceptance_criteria?: string;
        min_value?: number;
        max_value?: number;
        unit?: string;
      }[];
    }[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QualityTemplateManagerProps {
  onClose?: () => void;
}

export function QualityTemplateManager({ onClose }: QualityTemplateManagerProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<QualityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<QualityTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState('list');

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('technical_report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as unknown as QualityTemplate[]);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates de qualidade",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEditTemplate = (template: QualityTemplate) => {
    setSelectedTemplate(template);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('technical_report_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso"
      });

      loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template",
        variant: "destructive"
      });
    }
  };

  const getStandardBadge = (standard: string) => {
    const standards = {
      'NBR_13032': { label: 'NBR 13032', color: 'bg-blue-100 text-blue-800' },
      'BOSCH_RAM': { label: 'Bosch RAM', color: 'bg-green-100 text-green-800' },
      'ISO_9001': { label: 'ISO 9001', color: 'bg-purple-100 text-purple-800' },
      'CUSTOM': { label: 'Personalizado', color: 'bg-gray-100 text-gray-800' }
    };
    
    const standardInfo = standards[standard as keyof typeof standards] || standards.CUSTOM;
    
    return (
      <Badge className={standardInfo.color}>
        {standardInfo.label}
      </Badge>
    );
  };

  const getComponentBadge = (component: string) => {
    const components = {
      'bloco': { label: 'Bloco', color: 'bg-red-100 text-red-800' },
      'eixo': { label: 'Eixo', color: 'bg-orange-100 text-orange-800' },
      'biela': { label: 'Biela', color: 'bg-yellow-100 text-yellow-800' },
      'comando': { label: 'Comando', color: 'bg-green-100 text-green-800' },
      'cabecote': { label: 'Cabeçote', color: 'bg-blue-100 text-blue-800' }
    };
    
    const componentInfo = components[component as keyof typeof components] || components.bloco;
    
    return (
      <Badge className={componentInfo.color}>
        {componentInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">Templates</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
                <p className="text-gray-600 mb-4">
                  Crie templates de qualidade para padronizar os checklists por etapa
                </p>
                <Button onClick={handleCreateTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {getStandardBadge(template.technical_standard)}
                          {getComponentBadge(template.component)}
                          {template.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      <p>Etapa: {template.workflow_step}</p>
                      <p>Seções: {template.template_data?.sections?.length || 0}</p>
                      <p>
                        Itens: {template.template_data?.sections?.reduce((acc, section) => acc + (section.items?.length || 0), 0) || 0}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTemplate(template)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Normas Técnicas Disponíveis</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">NBR 13032</p>
                        <p className="text-sm text-gray-600">Norma brasileira para retífica de motores</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Ativo</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Bosch RAM</p>
                        <p className="text-sm text-gray-600">Padrão Bosch para componentes</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">ISO 9001</p>
                        <p className="text-sm text-gray-600">Sistema de gestão da qualidade</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">Ativo</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Estatísticas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Templates Ativos</span>
                      <span className="font-medium">{templates.filter(t => t.is_active).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Templates Inativos</span>
                      <span className="font-medium">{templates.filter(t => !t.is_active).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total de Templates</span>
                      <span className="font-medium">{templates.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Formulário de Template */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Criar Novo Template' : 'Editar Template'}
            </DialogTitle>
          </DialogHeader>
          <QualityTemplateForm
            template={selectedTemplate}
            mode={formMode}
            onSuccess={() => {
              setIsFormOpen(false);
              loadTemplates();
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente do formulário de template
interface QualityTemplateFormProps {
  template?: QualityTemplate | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

function QualityTemplateForm({ template, mode, onSuccess, onCancel }: QualityTemplateFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    technical_standard: template?.technical_standard || 'NBR_13032',
    component: template?.component || 'bloco',
    workflow_step: template?.workflow_step || 'metrologia',
    is_active: template?.is_active ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do template é obrigatório",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const templateData = {
        ...formData,
        template_data: {
          sections: [
            {
              id: 'section-1',
              title: 'Verificações Gerais',
              items: [
                {
                  id: 'item-1',
                  description: 'Inspeção visual do componente',
                  type: 'checkbox',
                  required: true,
                  acceptance_criteria: 'Sem trincas, riscos ou deformações visíveis'
                },
                {
                  id: 'item-2',
                  description: 'Medição dimensional',
                  type: 'measurement',
                  required: true,
                  min_value: 0,
                  max_value: 100,
                  unit: 'mm'
                }
              ]
            }
          ]
        }
      };

      if (mode === 'create') {
        const { error } = await supabase
          .from('technical_report_templates')
          .insert(templateData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Template criado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('technical_report_templates')
          .update(templateData)
          .eq('id', template!.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Template atualizado com sucesso"
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Template *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Checklist Bloco NBR 13032"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="technical_standard">Norma Técnica</Label>
          <Select
            value={formData.technical_standard}
            onValueChange={(value) => setFormData({ ...formData, technical_standard: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NBR_13032">NBR 13032</SelectItem>
              <SelectItem value="BOSCH_RAM">Bosch RAM</SelectItem>
              <SelectItem value="ISO_9001">ISO 9001</SelectItem>
              <SelectItem value="CUSTOM">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="component">Componente</Label>
          <Select
            value={formData.component}
            onValueChange={(value) => setFormData({ ...formData, component: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bloco">Bloco</SelectItem>
              <SelectItem value="eixo">Eixo</SelectItem>
              <SelectItem value="biela">Biela</SelectItem>
              <SelectItem value="comando">Comando</SelectItem>
              <SelectItem value="cabecote">Cabeçote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workflow_step">Etapa do Workflow</Label>
          <Select
            value={formData.workflow_step}
            onValueChange={(value) => setFormData({ ...formData, workflow_step: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="metrologia">Metrologia</SelectItem>
              <SelectItem value="usinagem">Usinagem</SelectItem>
              <SelectItem value="montagem">Montagem</SelectItem>
              <SelectItem value="pronto">Pronto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o propósito e aplicação deste template"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="is_active">Template ativo</Label>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? 'Criar Template' : 'Salvar Alterações'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
