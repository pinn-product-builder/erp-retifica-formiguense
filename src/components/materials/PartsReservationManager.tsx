import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  Plus,
  Minus,
  ShoppingCart
} from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PartsReservation {
  id: string;
  order_id: string;
  budget_id: string;
  part_id: string;
  part_code: string;
  part_name: string;
  quantity_reserved: number;
  quantity_separated: number;
  quantity_applied: number;
  unit_cost: number;
  total_reserved_cost: number;
  reservation_status: 'reserved' | 'separated' | 'applied';
  reserved_at: string;
  reserved_by: string;
  separated_at?: string;
  separated_by?: string;
  applied_at?: string;
  applied_by?: string;
  notes?: string;
  order?: {
    order_number: string;
    customer: {
      name: string;
    };
  };
}

interface StockAlert {
  part_code: string;
  part_name: string;
  current_stock: number;
  minimum_stock: number;
  required_quantity: number;
  shortage: number;
}

export function PartsReservationManager() {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  
  const [reservations, setReservations] = useState<PartsReservation[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<PartsReservation | null>(null);
  const [separationNotes, setSeparationNotes] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');

  useEffect(() => {
    loadReservations();
    checkStockAlerts();
  }, []);

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_reservations')
        .select(`
          *,
          order:orders(
            order_number,
            customer:customers(name)
          )
        `)
        .order('reserved_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as reservas de peças",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStockAlerts = async () => {
    try {
      // Buscar peças com estoque baixo ou insuficiente para reservas
      const { data: stockData, error } = await supabase.rpc('check_stock_availability');
      
      if (error) throw error;
      
      const alerts: StockAlert[] = stockData
        ?.filter((item: any) => item.current_stock < item.minimum_stock || item.shortage > 0)
        .map((item: any) => ({
          part_code: item.part_code,
          part_name: item.part_name,
          current_stock: item.current_stock,
          minimum_stock: item.minimum_stock,
          required_quantity: item.required_quantity,
          shortage: item.shortage
        })) || [];

      setStockAlerts(alerts);
    } catch (error) {
      console.error('Erro ao verificar alertas de estoque:', error);
    }
  };

  const handleSeparateParts = async (reservationId: string, quantitySeparated: number) => {
    try {
      const { error } = await supabase
        .from('parts_reservations')
        .update({
          quantity_separated: quantitySeparated,
          reservation_status: quantitySeparated >= reservations.find(r => r.id === reservationId)?.quantity_reserved ? 'separated' : 'reserved',
          separated_at: new Date().toISOString(),
          separated_by: (await supabase.auth.getUser()).data.user?.id,
          notes: separationNotes
        })
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Peças separadas com sucesso",
        variant: "default"
      });

      loadReservations();
      setSelectedReservation(null);
      setSeparationNotes('');
    } catch (error) {
      console.error('Erro ao separar peças:', error);
      toast({
        title: "Erro",
        description: "Não foi possível separar as peças",
        variant: "destructive"
      });
    }
  };

  const handleApplyParts = async (reservationId: string, quantityApplied: number) => {
    try {
      const { error } = await supabase
        .from('parts_reservations')
        .update({
          quantity_applied: quantityApplied,
          reservation_status: 'applied',
          applied_at: new Date().toISOString(),
          applied_by: (await supabase.auth.getUser()).data.user?.id,
          notes: applicationNotes
        })
        .eq('id', reservationId);

      if (error) throw error;

      // Dar baixa no estoque
      await supabase.rpc('apply_parts_to_stock', {
        reservation_id: reservationId,
        quantity: quantityApplied
      });

      toast({
        title: "Sucesso",
        description: "Peças aplicadas e baixa no estoque realizada",
        variant: "default"
      });

      loadReservations();
      setSelectedReservation(null);
      setApplicationNotes('');
    } catch (error) {
      console.error('Erro ao aplicar peças:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar as peças",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      reserved: { label: 'Reservado', variant: 'secondary' as const, icon: Clock },
      separated: { label: 'Separado', variant: 'default' as const, icon: Package },
      applied: { label: 'Aplicado', variant: 'default' as const, icon: CheckCircle }
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

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.order?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.order?.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.reservation_status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
      {/* Alertas de Estoque */}
      {stockAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Estoque ({stockAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {stockAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-orange-900">{alert.part_name}</p>
                    <p className="text-sm text-orange-700">
                      Código: {alert.part_code} | 
                      Estoque: {alert.current_stock} | 
                      Mínimo: {alert.minimum_stock}
                      {alert.shortage > 0 && ` | Falta: ${alert.shortage}`}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Comprar
                  </Button>
                </div>
              ))}
              {stockAlerts.length > 3 && (
                <p className="text-sm text-orange-700 text-center">
                  e mais {stockAlerts.length - 3} alertas...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestão de Reservas de Peças
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por peça, código, OS ou cliente..."
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
                  <SelectItem value="reserved">Reservado</SelectItem>
                  <SelectItem value="separated">Separado</SelectItem>
                  <SelectItem value="applied">Aplicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Reservas */}
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma reserva encontrada
              </div>
            ) : (
              filteredReservations.map((reservation) => (
                <div key={reservation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{reservation.part_name}</h3>
                        {getStatusBadge(reservation.reservation_status)}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium text-gray-900">Código</p>
                          <p>{reservation.part_code}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">OS</p>
                          <p>{reservation.order?.order_number}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Cliente</p>
                          <p>{reservation.order?.customer?.name}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Custo Total</p>
                          <p>R$ {reservation.total_reserved_cost.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <span>
                          Reservado: <strong>{reservation.quantity_reserved}</strong>
                        </span>
                        <span>
                          Separado: <strong>{reservation.quantity_separated}</strong>
                        </span>
                        <span>
                          Aplicado: <strong>{reservation.quantity_applied}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {reservation.reservation_status === 'reserved' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedReservation(reservation)}>
                              Separar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Separar Peças</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Peça: {reservation.part_name}</Label>
                                <p className="text-sm text-gray-600">Quantidade reservada: {reservation.quantity_reserved}</p>
                              </div>
                              <div>
                                <Label htmlFor="quantity">Quantidade a separar</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  max={reservation.quantity_reserved}
                                  defaultValue={reservation.quantity_reserved}
                                />
                              </div>
                              <div>
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea
                                  id="notes"
                                  value={separationNotes}
                                  onChange={(e) => setSeparationNotes(e.target.value)}
                                  placeholder="Observações sobre a separação..."
                                />
                              </div>
                              <Button 
                                onClick={() => handleSeparateParts(reservation.id, reservation.quantity_reserved)}
                                className="w-full"
                              >
                                Confirmar Separação
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {reservation.reservation_status === 'separated' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedReservation(reservation)}>
                              Aplicar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Aplicar Peças</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Peça: {reservation.part_name}</Label>
                                <p className="text-sm text-gray-600">Quantidade separada: {reservation.quantity_separated}</p>
                              </div>
                              <div>
                                <Label htmlFor="quantity">Quantidade a aplicar</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  max={reservation.quantity_separated}
                                  defaultValue={reservation.quantity_separated}
                                />
                              </div>
                              <div>
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea
                                  id="notes"
                                  value={applicationNotes}
                                  onChange={(e) => setApplicationNotes(e.target.value)}
                                  placeholder="Observações sobre a aplicação..."
                                />
                              </div>
                              <Button 
                                onClick={() => handleApplyParts(reservation.id, reservation.quantity_separated)}
                                className="w-full"
                              >
                                Confirmar Aplicação e Dar Baixa
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
