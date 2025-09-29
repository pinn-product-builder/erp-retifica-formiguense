import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search,
  MapPin,
  User,
  Calendar,
  Wrench
} from 'lucide-react';

interface PartsReservation {
  id: string;
  order_id: string;
  part_code: string;
  part_name: string;
  quantity_reserved: number;
  quantity_separated: number;
  quantity_applied: number;
  unit_cost: number;
  reservation_status: string;
  reserved_at: string;
  separated_at?: string;
  separated_by?: string;
  notes?: string;
  order?: {
    order_number: string;
    customer?: {
      name: string;
    };
  };
}

const STATUS_CONFIG = {
  reserved: {
    label: 'Reservado',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  separated: {
    label: 'Separado',
    color: 'bg-blue-100 text-blue-800', 
    icon: Package
  },
  applied: {
    label: 'Aplicado',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  }
};

export default function SeparacaoPecas() {
  const [reservations, setReservations] = useState<PartsReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [separatingItem, setSeparatingItem] = useState<PartsReservation | null>(null);
  const [separationNotes, setSeparationNotes] = useState('');
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts_reservations')
        .select(`
          *,
          order:orders(
            order_number,
            customer:customers(name)
          )
        `)
        .eq('org_id', currentOrganization?.id)
        .order('reserved_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar reservas de peças",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchReservations();
    }
  }, [currentOrganization?.id, fetchReservations]);

  const handleSeparatePart = async () => {
    if (!separatingItem) return;

    try {
      const { error } = await supabase
        .from('parts_reservations')
        .update({
          quantity_separated: separatingItem.quantity_reserved,
          reservation_status: 'separated',
          separated_at: new Date().toISOString(),
          separated_by: (await supabase.auth.getUser()).data.user?.id,
          notes: separationNotes
        })
        .eq('id', separatingItem.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Peça separada com sucesso"
      });

      setSeparatingItem(null);
      setSeparationNotes('');
      fetchReservations();
    } catch (error) {
      console.error('Erro ao separar peça:', error);
      toast({
        title: "Erro", 
        description: "Erro ao separar peça",
        variant: "destructive"
      });
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.part_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.order?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || reservation.reservation_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityColor = (reservation: PartsReservation) => {
    const reservedDays = Math.floor(
      (new Date().getTime() - new Date(reservation.reserved_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (reservedDays > 3) return 'border-l-red-500';
    if (reservedDays > 1) return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando reservas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Separação de Peças</h1>
          <p className="text-muted-foreground">
            Gerencie a separação física das peças reservadas para ordens de serviço
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por peça, código, OS ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="all">Todos os Status</option>
                <option value="reserved">Reservado</option>
                <option value="separated">Separado</option>
                <option value="applied">Aplicado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reservadas</p>
                <p className="text-2xl font-bold">
                  {reservations.filter(r => r.reservation_status === 'reserved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Separadas</p>
                <p className="text-2xl font-bold">
                  {reservations.filter(r => r.reservation_status === 'separated').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aplicadas</p>
                <p className="text-2xl font-bold">
                  {reservations.filter(r => r.reservation_status === 'applied').length}
                </p>
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
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold">
                  {reservations.filter(r => {
                    const days = Math.floor(
                      (new Date().getTime() - new Date(r.reserved_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return r.reservation_status === 'reserved' && days > 3;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reservas */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma reserva encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há peças reservadas no momento'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id} className={`border-l-4 ${getPriorityColor(reservation)}`}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-semibold text-lg">{reservation.part_name}</h3>
                      {getStatusBadge(reservation.reservation_status)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Código:</span>
                        <span className="font-medium">{reservation.part_code}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">OS:</span>
                        <span className="font-medium">{reservation.order?.order_number}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-medium">{reservation.order?.customer?.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Reservado:</span>
                        <span className="font-medium">
                          {new Date(reservation.reserved_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Qtd. Reservada:</span>
                        <span className="font-medium ml-1">{reservation.quantity_reserved}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qtd. Separada:</span>
                        <span className="font-medium ml-1">{reservation.quantity_separated}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valor Unit.:</span>
                        <span className="font-medium ml-1">
                          R$ {reservation.unit_cost.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {reservation.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Observações:</span>
                        <p className="mt-1 text-foreground">{reservation.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {reservation.reservation_status === 'reserved' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => setSeparatingItem(reservation)}
                            className="w-full sm:w-auto"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Separar Peça
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Separar Peça</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Peça</Label>
                              <p className="text-sm text-muted-foreground">
                                {separatingItem?.part_name} ({separatingItem?.part_code})
                              </p>
                            </div>
                            <div>
                              <Label>Quantidade a Separar</Label>
                              <p className="text-sm text-muted-foreground">
                                {separatingItem?.quantity_reserved} unidades
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="notes">Observações da Separação</Label>
                              <Textarea
                                id="notes"
                                placeholder="Adicione observações sobre a separação (localização, condição, etc.)"
                                value={separationNotes}
                                onChange={(e) => setSeparationNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSeparatePart} className="flex-1">
                                Confirmar Separação
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSeparatingItem(null);
                                  setSeparationNotes('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {reservation.reservation_status === 'separated' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Pronta para Aplicação
                      </Badge>
                    )}

                    {reservation.reservation_status === 'applied' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aplicada na OS
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
