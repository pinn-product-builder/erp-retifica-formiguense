import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  Search,
  Filter,
  Phone,
  Mail,
  Camera,
  Settings,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WarrantyClaim {
  id: string;
  claim_number: string;
  original_order_id: string;
  customer_id: string;
  claim_type: 'defect' | 'assembly' | 'wear' | 'misuse' | 'other';
  component: 'bloco' | 'eixo' | 'biela' | 'comando' | 'cabecote';
  claim_description: string;
  failure_symptoms: string;
  customer_complaint: string;
  claim_date: string;
  reported_by: string;
  contact_method: 'phone' | 'email' | 'whatsapp' | 'in_person';
  technical_evaluation_status: 'pending' | 'in_progress' | 'completed';
  technical_evaluation: TechnicalEvaluation;
  failure_cause: 'manufacturing_defect' | 'assembly_error' | 'normal_wear' | 'misuse' | 'external_factor';
  is_warranty_valid: boolean;
  warranty_coverage_percentage: number;
  evaluation_notes: string;
  evaluated_by?: string;
  evaluated_at?: string;
  claim_status: 'open' | 'approved' | 'denied' | 'resolved' | 'cancelled';
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  estimated_cost: number;
  actual_cost: number;
  resolution_type?: 'repair' | 'replacement' | 'refund' | 'partial_coverage';
  resolution_description?: string;
  new_order_id?: string;
  resolved_at?: string;
  resolved_by?: string;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  original_order?: {
    order_number: string;
    created_at: string;
    warranty_months: number;
  };
  new_order?: {
    order_number: string;
  };
}

interface TechnicalEvaluation {
  inspector: string;
  inspection_date: string;
  visual_inspection: {
    external_damage: boolean;
    internal_damage: boolean;
    wear_patterns: string[];
    contamination: boolean;
    notes: string;
  };
  measurements: {
    [key: string]: {
      measured_value: number;
      expected_value: number;
      tolerance: number;
      within_spec: boolean;
    };
  };
  photos: string[];
  root_cause_analysis: {
    primary_cause: string;
    contributing_factors: string[];
    preventive_measures: string[];
  };
  warranty_recommendation: {
    coverage_percentage: number;
    justification: string;
    recommended_action: string;
  };
}

export function WarrantyClaimsManager() {
  const { toast } = useToast();
  
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [resolutionDescription, setResolutionDescription] = useState('');
  const [activeTab, setActiveTab] = useState('claims');

  const loadWarrantyClaims = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('warranty_claims')
        .select(`
          *,
          customer:customers(name, phone, email),
          original_order:orders!warranty_claims_original_order_id_fkey(
            order_number, 
            created_at, 
            warranty_months
          ),
          new_order:orders!warranty_claims_new_order_id_fkey(order_number)
        `)
        .order('claim_date', { ascending: false });

      if (error) throw error;
      setClaims((data || []) as unknown as WarrantyClaim[]);
    } catch (error) {
      console.error('Erro ao carregar reclamações de garantia:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as reclamações de garantia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadWarrantyClaims();
  }, [loadWarrantyClaims]);

  const handleTechnicalEvaluation = async (claimId: string, evaluation: Partial<TechnicalEvaluation>) => {
    try {
      const { error } = await supabase
        .from('warranty_claims')
        .update({
          technical_evaluation: evaluation,
          technical_evaluation_status: 'completed',
          evaluated_by: (await supabase.auth.getUser()).data.user?.id,
          evaluated_at: new Date().toISOString(),
          evaluation_notes: evaluationNotes
        })
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Avaliação técnica registrada com sucesso",
        variant: "default"
      });

      loadWarrantyClaims();
      setSelectedClaim(null);
      setEvaluationNotes('');
    } catch (error) {
      console.error('Erro ao salvar avaliação técnica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a avaliação técnica",
        variant: "destructive"
      });
    }
  };

  const handleClaimResolution = async (claimId: string, resolution: {
    status: string;
    resolution_type: string;
    coverage_percentage: number;
    create_new_order: boolean;
  }) => {
    try {
      let newOrderId = null;

      // Se aprovado e precisa criar nova OS
      if (resolution.status === 'approved' && resolution.create_new_order) {
        // TODO: Implementar criação de nova OS para garantia
        // Por enquanto, simular criação
        newOrderId = `warranty_${claimId.slice(0, 8)}`;

        // TODO: Dar prioridade à nova OS quando implementar criação real
        // await supabase.from('orders').update({ priority: 5 }).eq('id', newOrderId);
      }

      const { error } = await supabase
        .from('warranty_claims')
        .update({
          claim_status: resolution.status,
          resolution_type: resolution.resolution_type,
          warranty_coverage_percentage: resolution.coverage_percentage,
          resolution_description: resolutionDescription,
          new_order_id: newOrderId,
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Reclamação ${resolution.status === 'approved' ? 'aprovada' : 'negada'} com sucesso`,
        variant: "default"
      });

      loadWarrantyClaims();
      setSelectedClaim(null);
      setResolutionDescription('');
    } catch (error) {
      console.error('Erro ao resolver reclamação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível resolver a reclamação",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Aberta', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Aprovada', variant: 'default' as const, icon: CheckCircle },
      denied: { label: 'Negada', variant: 'destructive' as const, icon: XCircle },
      resolved: { label: 'Resolvida', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'secondary' as const, icon: XCircle }
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

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { label: 'Urgente', variant: 'destructive' as const },
      high: { label: 'Alta', variant: 'destructive' as const },
      normal: { label: 'Normal', variant: 'default' as const },
      low: { label: 'Baixa', variant: 'secondary' as const }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];

    return (
      <Badge variant={config?.variant || 'secondary'}>
        {config?.label || priority}
      </Badge>
    );
  };

  const getClaimTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; color: string }> = {
      defect: { label: 'Defeito', color: 'red' },
      assembly: { label: 'Montagem', color: 'yellow' },
      wear: { label: 'Desgaste', color: 'blue' },
      misuse: { label: 'Mau Uso', color: 'gray' },
      other: { label: 'Outro', color: 'purple' }
    };

    const config = typeConfig[type] || { label: type, color: 'gray' };

    return (
      <Badge variant="outline" className={`border-${config.color}-300 text-${config.color}-700`}>
        {config.label}
      </Badge>
    );
  };

  const isWarrantyExpired = (claim: WarrantyClaim): boolean => {
    if (!claim.original_order?.created_at || !claim.original_order?.warranty_months) {
      return true;
    }

    const orderDate = new Date(claim.original_order.created_at);
    const warrantyEndDate = new Date(orderDate.setMonth(orderDate.getMonth() + claim.original_order.warranty_months));
    const claimDate = new Date(claim.claim_date);

    return claimDate > warrantyEndDate;
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = 
      claim.claim_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.original_order?.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.claim_status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || claim.priority_level === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
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
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistema de Reclamações e Garantia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="claims">Reclamações Ativas</TabsTrigger>
              <TabsTrigger value="indicators">Indicadores de Garantia</TabsTrigger>
            </TabsList>

            <TabsContent value="claims" className="space-y-6">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por número, cliente ou OS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="open">Aberta</SelectItem>
                      <SelectItem value="approved">Aprovada</SelectItem>
                      <SelectItem value="denied">Negada</SelectItem>
                      <SelectItem value="resolved">Resolvida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-40">
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de Reclamações */}
              <div className="space-y-4">
                {filteredClaims.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma reclamação encontrada</h3>
                    <p>Reclamações de garantia aparecerão aqui quando registradas.</p>
                  </div>
                ) : (
                  filteredClaims.map((claim) => (
                    <Card key={claim.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-medium text-lg">
                                {claim.claim_number || `#${claim.id.slice(0, 8)}`}
                              </h3>
                              {getStatusBadge(claim.claim_status)}
                              {getPriorityBadge(claim.priority_level)}
                              {getClaimTypeBadge(claim.claim_type)}
                              {claim.claim_status === 'approved' && claim.new_order_id && (
                                <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Prioridade
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <p className="font-medium text-gray-900">Cliente</p>
                                <p>{claim.customer?.name}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">OS Original</p>
                                <p>{claim.original_order?.order_number}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Componente</p>
                                <p className="capitalize">{claim.component}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Data da Reclamação</p>
                                <p>{new Date(claim.claim_date).toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="mb-4">
                              <p className="text-sm text-gray-600">
                                <strong>Reclamação:</strong> {claim.customer_complaint}
                              </p>
                              {claim.failure_symptoms && (
                                <p className="text-sm text-gray-600 mt-1">
                                  <strong>Sintomas:</strong> {claim.failure_symptoms}
                                </p>
                              )}
                            </div>

                            {/* Status da Garantia */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Garantia: {isWarrantyExpired(claim) ? (
                                    <span className="text-red-600 font-medium">Expirada</span>
                                  ) : (
                                    <span className="text-green-600 font-medium">Válida</span>
                                  )}
                                </span>
                              </div>
                              {claim.warranty_coverage_percentage > 0 && (
                                <span>Cobertura: {claim.warranty_coverage_percentage}%</span>
                              )}
                              {claim.estimated_cost > 0 && (
                                <span>Custo estimado: R$ {claim.estimated_cost.toFixed(2)}</span>
                              )}
                            </div>

                            {claim.new_order_id && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-800">
                                  Nova OS criada: {claim.new_order?.order_number}
                                </p>
                                <p className="text-xs text-blue-600">
                                  Esta OS tem prioridade no workflow de produção
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            {claim.claim_status === 'open' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" onClick={() => setSelectedClaim(claim)}>
                                    Avaliar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Avaliação Técnica - {claim.claim_number}
                                    </DialogTitle>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                      <div>
                                        <Label className="text-sm font-medium">Cliente</Label>
                                        <p className="text-sm">{claim.customer?.name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">OS Original</Label>
                                        <p className="text-sm">{claim.original_order?.order_number}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Componente</Label>
                                        <p className="text-sm capitalize">{claim.component}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Tipo da Falha</Label>
                                        <Select defaultValue={claim.failure_cause}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="manufacturing_defect">Defeito de Fabricação</SelectItem>
                                            <SelectItem value="assembly_error">Erro de Montagem</SelectItem>
                                            <SelectItem value="normal_wear">Desgaste Normal</SelectItem>
                                            <SelectItem value="misuse">Mau Uso</SelectItem>
                                            <SelectItem value="external_factor">Fator Externo</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="evaluation">Avaliação Técnica</Label>
                                      <Textarea
                                        id="evaluation"
                                        value={evaluationNotes}
                                        onChange={(e) => setEvaluationNotes(e.target.value)}
                                        placeholder="Descreva a avaliação técnica detalhada..."
                                        rows={4}
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Cobertura da Garantia (%)</Label>
                                        <Input type="number" min="0" max="100" defaultValue="0" />
                                      </div>
                                      <div>
                                        <Label>Custo Estimado (R$)</Label>
                                        <Input type="number" min="0" step="0.01" defaultValue="0" />
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => handleClaimResolution(claim.id, {
                                          status: 'denied',
                                          resolution_type: 'denied',
                                          coverage_percentage: 0,
                                          create_new_order: false
                                        })}
                                      >
                                        Negar Garantia
                                      </Button>
                                      <Button 
                                        onClick={() => handleClaimResolution(claim.id, {
                                          status: 'approved',
                                          resolution_type: 'repair',
                                          coverage_percentage: 100,
                                          create_new_order: true
                                        })}
                                      >
                                        Aprovar e Criar OS
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="indicators" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Taxa de Garantia</p>
                        <p className="text-2xl font-bold text-blue-600">3.2%</p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Meta: &lt; 5%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tempo Médio Resolução</p>
                        <p className="text-2xl font-bold text-green-600">4.8</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      dias por reclamação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Custo Total</p>
                        <p className="text-2xl font-bold text-orange-600">R$ 12.4K</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      este mês
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Satisfação Cliente</p>
                        <p className="text-2xl font-bold text-purple-600">4.7</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      de 5.0 (pós-garantia)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de Garantias por Componente */}
              <Card>
                <CardHeader>
                  <CardTitle>Garantias por Componente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['bloco', 'eixo', 'biela', 'comando', 'cabecote'].map((component) => (
                      <div key={component} className="flex items-center justify-between">
                        <span className="capitalize font-medium">{component}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.random() * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12">
                            {(Math.random() * 10).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
