import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  ShoppingCart, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Package,
  Star,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle
} from 'lucide-react';

interface PurchaseNeed {
  id: string;
  part_code: string;
  part_name: string;
  required_quantity: number;
  available_quantity: number;
  shortage_quantity: number;
  priority_level: 'low' | 'normal' | 'high' | 'urgent';
  need_type: 'planned' | 'emergency';
  estimated_cost: number;
  delivery_urgency_date: string;
  status: 'pending' | 'ordered' | 'received';
  created_at: string;
  suggested_suppliers?: SupplierSuggestion[];
}

interface SupplierSuggestion {
  id: string;
  supplier_name: string;
  suggested_price: number;
  delivery_days: number;
  cost_benefit_score: number;
  is_preferred: boolean;
  quality_rating: number;
}

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800', icon: Clock },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800', icon: Package },
  high: { label: 'Alta', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
};

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  ordered: { label: 'Pedido', color: 'bg-blue-100 text-blue-800' },
  received: { label: 'Recebido', color: 'bg-green-100 text-green-800' }
};

export function PurchaseNeedsDashboard() {
  const [needs, setNeeds] = useState<PurchaseNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNeed, setSelectedNeed] = useState<PurchaseNeed | null>(null);
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchPurchaseNeeds();
    }
  }, [currentOrganization?.id]);

  const fetchPurchaseNeeds = async () => {
    try {
      setLoading(true);
      
      // Buscar necessidades de compra
      const { data: needsData, error: needsError } = await supabase
        .from('purchase_needs')
        .select('*')
        .eq('org_id', currentOrganization?.id)
        .eq('status', 'pending')
        .order('priority_level', { ascending: false })
        .order('delivery_urgency_date', { ascending: true });

      if (needsError) throw needsError;

      // Buscar sugestões de fornecedores para cada necessidade
      const needsWithSuggestions = await Promise.all(
        (needsData || []).map(async (need) => {
          const { data: suggestions } = await supabase
            .from('supplier_suggestions')
            .select('*')
            .eq('purchase_need_id', need.id)
            .order('cost_benefit_score', { ascending: false })
            .limit(3);

          return {
            ...need,
            suggested_suppliers: suggestions || []
          };
        })
      );

      setNeeds(needsWithSuggestions);
    } catch (error) {
      console.error('Erro ao buscar necessidades:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar necessidades de compra",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePurchaseOrder = async (need: PurchaseNeed, supplierId: string) => {
    try {
      // Aqui você implementaria a lógica para criar uma ordem de compra
      // Por enquanto, apenas atualizamos o status
      const { error } = await supabase
        .from('purchase_needs')
        .update({ status: 'ordered' })
        .eq('id', need.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Ordem de compra criada com sucesso"
      });

      fetchPurchaseNeeds();
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar ordem de compra",
        variant: "destructive"
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getUrgencyColor = (urgencyDate: string) => {
    const days = Math.floor(
      (new Date(urgencyDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (days < 0) return 'border-l-red-500'; // Atrasado
    if (days <= 3) return 'border-l-orange-500'; // Urgente
    if (days <= 7) return 'border-l-yellow-500'; // Atenção
    return 'border-l-green-500'; // Normal
  };

  const totalNeeds = needs.length;
  const urgentNeeds = needs.filter(n => {
    const days = Math.floor(
      (new Date(n.delivery_urgency_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days <= 3;
  }).length;
  const totalValue = needs.reduce((sum, need) => sum + need.estimated_cost, 0);
  const emergencyNeeds = needs.filter(n => n.need_type === 'emergency').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando necessidades...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Necessidades</p>
                <p className="text-2xl font-bold">{totalNeeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold">{urgentNeeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emergenciais</p>
                <p className="text-2xl font-bold">{emergencyNeeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Necessidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Necessidades de Compra Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {needs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma necessidade pendente</h3>
              <p className="text-muted-foreground">
                Todas as necessidades de compra foram atendidas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {needs.map((need) => (
                <div 
                  key={need.id} 
                  className={`border rounded-lg p-4 border-l-4 ${getUrgencyColor(need.delivery_urgency_date)}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="font-semibold text-lg">{need.part_name}</h3>
                        <div className="flex gap-2">
                          {getPriorityBadge(need.priority_level)}
                          {getStatusBadge(need.status)}
                          {need.need_type === 'emergency' && (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Emergencial
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Código:</span>
                          <span className="font-medium ml-1">{need.part_code}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Necessário:</span>
                          <span className="font-medium ml-1">{need.required_quantity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Disponível:</span>
                          <span className="font-medium ml-1">{need.available_quantity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Faltante:</span>
                          <span className="font-medium ml-1 text-red-600">{need.shortage_quantity}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Estimado:</span>
                          <span className="font-medium">R$ {need.estimated_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Prazo:</span>
                          <span className="font-medium">
                            {new Date(need.delivery_urgency_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {/* Fornecedores Sugeridos */}
                      {need.suggested_suppliers && need.suggested_suppliers.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Fornecedores Sugeridos:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {need.suggested_suppliers.slice(0, 3).map((supplier) => (
                              <div 
                                key={supplier.id}
                                className="border rounded p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">{supplier.supplier_name}</span>
                                  {supplier.is_preferred && (
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                  <div className="flex justify-between">
                                    <span>Preço:</span>
                                    <span>R$ {supplier.suggested_price.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Prazo:</span>
                                    <span>{supplier.delivery_days} dias</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Score:</span>
                                    <span>{supplier.cost_benefit_score.toFixed(1)}/10</span>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="w-full mt-2"
                                  onClick={() => handleCreatePurchaseOrder(need, supplier.id)}
                                >
                                  Criar Pedido
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
