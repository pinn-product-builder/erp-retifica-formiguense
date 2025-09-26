import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Search,
  Filter,
  BarChart3,
  Camera,
  Ruler,
  Shield
} from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QualityTemplateManager } from './QualityTemplateManager';

interface TechnicalReport {
  id: string;
  order_id: string;
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  report_type: string;
  report_template: string;
  technical_standard: string;
  report_number: string;
  report_data: Record<string, any>;
  measurements_data: Record<string, number>;
  photos_data: string[];
  conformity_status: 'pending' | 'conforming' | 'non_conforming' | 'conditional';
  non_conformities: NonConformity[];
  corrective_actions: CorrectiveAction[];
  generated_automatically: boolean;
  generated_at: string;
  generated_by: string;
  approved_by?: string;
  approved_at?: string;
  pdf_file_path?: string;
  is_customer_visible: boolean;
  order?: {
    order_number: string;
    customer: { name: string };
  };
}

interface NonConformity {
  item: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  standard_reference: string;
}

interface CorrectiveAction {
  non_conformity_item: string;
  action_description: string;
  responsible: string;
  target_date: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TechnicalReportTemplate {
  id: string;
  template_name: string;
  report_type: string;
  technical_standard: string;
  applicable_components: string[];
  template_structure: Record<string, any>;
  required_data_fields: string[];
  optional_data_fields: string[];
  measurement_fields: MeasurementField[];
  photo_requirements: PhotoRequirement[];
  is_active: boolean;
  version: number;
}

interface MeasurementField {
  field_name: string;
  field_label: string;
  unit: string;
  expected_value?: number;
  tolerance_min?: number;
  tolerance_max?: number;
  is_required: boolean;
}

interface PhotoRequirement {
  photo_type: string;
  description: string;
  is_required: boolean;
  angle_requirements?: string[];
}

export function TechnicalReportsManager() {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<TechnicalReport[]>([]);
  const [templates, setTemplates] = useState<TechnicalReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [standardFilter, setStandardFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<TechnicalReport | null>(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  useEffect(() => {
    loadTechnicalReports();
    loadReportTemplates();
  }, []);

  const loadTechnicalReports = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_reports')
        .select(`
          *,
          order:orders(
            order_number,
            customer:customers(name)
          )
        `)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Erro ao carregar relatórios técnicos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios técnicos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReportTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_report_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const generateReport = async (orderId: string, component: string, templateId: string) => {
    try {
      const { error } = await supabase.rpc('generate_technical_report', {
        order_id: orderId,
        component: component,
        template_id: templateId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Relatório técnico gerado automaticamente",
        variant: "default"
      });

      loadTechnicalReports();
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório técnico",
        variant: "destructive"
      });
    }
  };

  const approveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('technical_reports')
        .update({
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString(),
          conformity_status: 'conforming'
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Relatório técnico aprovado",
        variant: "default"
      });

      loadTechnicalReports();
    } catch (error) {
      console.error('Erro ao aprovar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o relatório",
        variant: "destructive"
      });
    }
  };

  const downloadReport = async (reportId: string, reportNumber: string) => {
    try {
      const { data, error } = await supabase.rpc('export_technical_report_pdf', {
        report_id: reportId
      });

      if (error) throw error;

      // Simular download do PDF
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Sucesso",
        description: "Relatório baixado com sucesso",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o relatório",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      conforming: { label: 'Conforme', variant: 'default' as const, icon: CheckCircle },
      non_conforming: { label: 'Não Conforme', variant: 'destructive' as const, icon: AlertTriangle },
      conditional: { label: 'Condicional', variant: 'default' as const, icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge variant={config?.variant || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  const getStandardBadge = (standard: string) => {
    const standardConfig: Record<string, { color: string; label: string }> = {
      'NBR 13032': { color: 'blue', label: 'NBR 13032' },
      'Bosch RAM': { color: 'green', label: 'Bosch RAM' },
      'ISO 9001': { color: 'purple', label: 'ISO 9001' }
    };

    const config = standardConfig[standard] || { color: 'gray', label: standard };

    return (
      <Badge variant="outline" className={`border-${config.color}-300 text-${config.color}-700`}>
        <Shield className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.report_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.order?.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.conformity_status === statusFilter;
    const matchesStandard = standardFilter === 'all' || report.technical_standard === standardFilter;
    
    return matchesSearch && matchesStatus && matchesStandard;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios Técnicos Automáticos
            </span>
            <Button 
              variant="outline"
              onClick={() => setIsTemplateManagerOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar Templates
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">Relatórios Gerados</TabsTrigger>
              <TabsTrigger value="templates">Templates por Norma</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-6">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por número, OS ou cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="conforming">Conforme</SelectItem>
                      <SelectItem value="non_conforming">Não Conforme</SelectItem>
                      <SelectItem value="conditional">Condicional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={standardFilter} onValueChange={setStandardFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Norma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Normas</SelectItem>
                      <SelectItem value="NBR 13032">NBR 13032</SelectItem>
                      <SelectItem value="Bosch RAM">Bosch RAM</SelectItem>
                      <SelectItem value="ISO 9001">ISO 9001</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de Relatórios */}
              <div className="space-y-4">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
                    <p>Relatórios técnicos são gerados automaticamente ao concluir etapas importantes.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-medium text-lg">
                                Relatório {report.report_number || `#${report.id.slice(0, 8)}`}
                              </h3>
                              {getStatusBadge(report.conformity_status)}
                              {getStandardBadge(report.technical_standard)}
                              {report.generated_automatically && (
                                <Badge variant="outline" className="text-xs">
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  Automático
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <p className="font-medium text-gray-900">OS</p>
                                <p>{report.order?.order_number}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Cliente</p>
                                <p>{report.order?.customer?.name}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Componente</p>
                                <p className="capitalize">{report.component}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Tipo</p>
                                <p>{report.report_type}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Gerado: {new Date(report.generated_at).toLocaleDateString()}</span>
                              </div>
                              {report.measurements_data && Object.keys(report.measurements_data).length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Ruler className="h-4 w-4" />
                                  <span>{Object.keys(report.measurements_data).length} medições</span>
                                </div>
                              )}
                              {report.photos_data && report.photos_data.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Camera className="h-4 w-4" />
                                  <span>{report.photos_data.length} fotos</span>
                                </div>
                              )}
                            </div>

                            {report.non_conformities && report.non_conformities.length > 0 && (
                              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-800">
                                    {report.non_conformities.length} não conformidade(s)
                                  </span>
                                </div>
                                {report.non_conformities.slice(0, 2).map((nc, index) => (
                                  <p key={index} className="text-xs text-red-700">
                                    • {nc.item}: {nc.description}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Relatório Técnico - {report.report_number || `#${report.id.slice(0, 8)}`}
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-6">
                                  {/* Cabeçalho do Relatório */}
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                      <Label className="text-sm font-medium">Ordem de Serviço</Label>
                                      <p className="text-sm">{report.order?.order_number}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Cliente</Label>
                                      <p className="text-sm">{report.order?.customer?.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Componente</Label>
                                      <p className="text-sm capitalize">{report.component}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Norma Técnica</Label>
                                      <p className="text-sm">{report.technical_standard}</p>
                                    </div>
                                  </div>

                                  {/* Medições */}
                                  {report.measurements_data && Object.keys(report.measurements_data).length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-3">Medições Realizadas</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(report.measurements_data).map(([key, value]) => (
                                          <div key={key} className="border rounded p-3">
                                            <Label className="text-sm font-medium">{key}</Label>
                                            <p className="text-lg font-mono">{value}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Status de Conformidade */}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label className="text-sm font-medium">Status de Conformidade</Label>
                                      <div className="mt-1">
                                        {getStatusBadge(report.conformity_status)}
                                      </div>
                                    </div>
                                    
                                    {report.conformity_status === 'pending' && (
                                      <Button onClick={() => approveReport(report.id)}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Aprovar Relatório
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button 
                              size="sm" 
                              onClick={() => downloadReport(report.id, report.report_number || `report-${report.id.slice(0, 8)}`)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid gap-4">
                {templates.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template configurado</h3>
                    <p className="text-gray-600 mb-4">
                      Configure templates de relatórios por norma técnica para geração automática.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setIsTemplateManagerOpen(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Criar Template
                    </Button>
                  </div>
                ) : (
                  templates.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{template.template_name}</h3>
                              {getStandardBadge(template.technical_standard)}
                              <Badge variant="outline" className="text-xs">
                                v{template.version}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              Aplicável para: {template.applicable_components.join(', ')}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Campos obrigatórios: {template.required_data_fields.length}</span>
                              <span>Medições: {template.measurement_fields.length}</span>
                              <span>Fotos: {template.photo_requirements.length}</span>
                            </div>
                          </div>
                          
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para Gerenciador de Templates */}
      <Dialog open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciador de Templates de Relatórios</DialogTitle>
          </DialogHeader>
          <QualityTemplateManager onClose={() => setIsTemplateManagerOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
