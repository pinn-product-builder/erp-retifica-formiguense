import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  DollarSign,
  Package,
  Search,
  Filter,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PurchaseNeed {
  id: string;
  part_code: string;
  part_name: string;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  need_type: 'planned' | 'emergency';
  related_orders: string[];
  suggested_suppliers: SupplierSuggestion[];
  estimated_cost: number;
  delivery_urgency_date?: string;
  status: 'pending' | 'quoted' | 'ordered' | 'delivered' | 'cancelled';
  created_at: string;
}

interface SupplierSuggestion {
  id: string;
  supplier_id: string;
  supplier_name: string;
  suggested_price: number;
  delivery_days: number;
  reliability_score: number;
  last_purchase_date?: string;
  total_purchases_count: number;
  average_delivery_days: number;
  quality_rating: number;
  cost_benefit_score: number;
  is_preferred: boolean;
}

interface PurchaseEfficiencyReport {
  period_start: string;
  period_end: string;
  total_purchases_planned: number;
  total_purchases_emergency: number;
  planned_purchase_percentage: number;
  total_cost_planned: number;
  total_cost_emergency: number;
  cost_savings_planned: number;
  average_delivery_days: number;
  supplier_performance_average: number;
  stock_out_incidents: number;
  efficiency_score: number;
}

export function PurchaseNeedsManager() {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  
  const [purchaseNeeds, setPurchaseNeeds] = useState<PurchaseNeed[]>([]);
  const [efficiencyReport, setEfficiencyReport] = useState<PurchaseEfficiencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNeed, setSelectedNeed] = useState<PurchaseNeed | null>(null);
  const [activeTab, setActiveTab] = useState('needs');

  useEffect(() => {
    loadPurchaseNeeds();
    loadEfficiencyReport();
  }, []);

  const loadPurchaseNeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_needs')
        .select(`
          *,
          suggested_suppliers:supplier_suggestions(*)
        `)
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseNeeds(data || []);
    } catch (error) {
      console.error('Erro ao carregar necessidades de compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as necessidades de compra",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEfficiencyReport = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_efficiency_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setEfficiencyReport(data);
    } catch (error) {
      console.error('Erro ao carregar relatório de eficiência:', error);
    }
  };

  const generatePurchaseNeeds = async () => {
    try {
      setLoading(true);
      
      // Chamar função para identificar necessidades automaticamente
      const { error } = await supabase.rpc('identify_purchase_needs');
      
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Necessidades de compra identificadas automaticamente",
        variant: "default"
      });

      loadPurchaseNeeds();
    } catch (error) {
      console.error('Erro ao gerar necessidades de compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível identificar as necessidades de compra",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPurchaseOrder = async (needId: string, supplierId: string) => {
    try {
      const { error } = await supabase.rpc('create_purchase_order_from_need', {
        need_id: needId,
        supplier_id: supplierId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ordem de compra criada com sucesso",
        variant: "default"
      });

      loadPurchaseNeeds();
    } catch (error) {
      console.error('Erro ao criar ordem de compra:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a ordem de compra",
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { label: 'Urgente', variant: 'destructive' as const, icon: AlertTriangle },
      high: { label: 'Alta', variant: 'destructive' as const, icon: TrendingUp },
      normal: { label: 'Normal', variant: 'default' as const, icon: Clock },
      low: { label: 'Baixa', variant: 'secondary' as const, icon: Package }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge variant={config?.variant || 'secondary'} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config?.label || priority}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'emergency' ? 'destructive' : 'outline'}>
        {type === 'emergency' ? 'Emergencial' : 'Planejada'}
      </Badge>
    );
  };

  const filteredNeeds = purchaseNeeds.filter(need => {
    const matchesSearch = 
      need.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      need.part_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || need.priority_level === priorityFilter;
    const matchesType = typeFilter === 'all' || need.need_type === typeFilter;
    
    return matchesSearch && matchesPriority && matchesType;
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
              <ShoppingCart className="h-5 w-5" />
              Controle Inteligente de Compras
            </span>
            <Button onClick={generatePurchaseNeeds} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Identificar Necessidades
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="needs">Necessidades de Compra</TabsTrigger>
              <TabsTrigger value="efficiency">Relatório de Eficiência</TabsTrigger>
            </TabsList>

            <TabsContent value="needs" className="space-y-6">
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por peça ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
                <div className="w-full sm:w-40">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="planned">Planejada</SelectItem>
                      <SelectItem value="emergency">Emergencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de Necessidades */}
              <div className="space-y-4">
                {filteredNeeds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma necessidade de compra encontrada
                  </div>
                ) : (
                  filteredNeeds.map((need) => (
                    <Card key={need.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-medium text-lg">{need.part_name}</h3>
                              {getPriorityBadge(need.priority_level)}
                              {getTypeBadge(need.need_type)}
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <p className="font-medium text-gray-900">Código</p>
                                <p>{need.part_code}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Necessário</p>
                                <p className="text-red-600 font-medium">{need.shortage_quantity} un.</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Custo Estimado</p>
                                <p>R$ {need.estimated_cost.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Prazo</p>
                                <p>{need.delivery_urgency_date ? new Date(need.delivery_urgency_date).toLocaleDateString() : 'Não definido'}</p>
                              </div>
                            </div>

                            {/* Fornecedores Sugeridos */}
                            {need.suggested_suppliers && need.suggested_suppliers.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm text-gray-900 mb-2">Fornecedores Sugeridos:</h4>
                                <div className="grid gap-2">
                                  {need.suggested_suppliers.slice(0, 2).map((supplier) => (
                                    <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center gap-2">
                                        {supplier.is_preferred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                                        <div>
                                          <p className="font-medium text-sm">{supplier.supplier_name}</p>
                                          <p className="text-xs text-gray-600">
                                            R$ {supplier.suggested_price.toFixed(2)} | 
                                            {supplier.delivery_days} dias | 
                                            Score: {supplier.cost_benefit_score.toFixed(1)}
                                          </p>
                                        </div>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        onClick={() => createPurchaseOrder(need.id, supplier.supplier_id)}
                                      >
                                        Comprar
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="efficiency" className="space-y-6">
              {efficiencyReport ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Compras Planejadas</p>
                          <p className="text-2xl font-bold text-green-600">
                            {efficiencyReport.planned_purchase_percentage.toFixed(1)}%
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {efficiencyReport.total_purchases_planned} de {efficiencyReport.total_purchases_planned + efficiencyReport.total_purchases_emergency} compras
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Economia Planejada</p>
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {efficiencyReport.cost_savings_planned.toFixed(0)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        vs compras emergenciais
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Prazo Médio</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {efficiencyReport.average_delivery_days.toFixed(1)}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">dias de entrega</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Score de Eficiência</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {efficiencyReport.efficiency_score.toFixed(1)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">de 10.0</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Relatório não disponível</h3>
                    <p className="text-gray-600 mb-4">
                      Ainda não há dados suficientes para gerar o relatório de eficiência.
                    </p>
                    <Button variant="outline">
                      Gerar Relatório
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
