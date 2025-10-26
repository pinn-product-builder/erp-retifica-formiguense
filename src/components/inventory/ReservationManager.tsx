// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Eye,
  X,
  Plus,
  Filter,
  Search,
  Loader2
} from "lucide-react";
import { useReservations, type PartReservation } from "@/hooks/useReservations";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReservationManagerProps {
  orderId?: string;
  budgetId?: string;
  partId?: string;
}

type ReservationStatus = 'reserved' | 'partial' | 'separated' | 'applied' | 'expired' | 'cancelled';

const ReservationManager: React.FC<ReservationManagerProps> = ({
  orderId,
  budgetId,
  partId
}) => {
  const {
    reservations,
    loading,
    fetchReservations,
    reservePartsFromBudget,
    cancelReservation,
    extendReservation,
    getExpiringReservations,
    getReservationStats
  } = useReservations();

  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<PartReservation | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [extensionDays, setExtensionDays] = useState(7);
  const [expiringReservations, setExpiringReservations] = useState<PartReservation[]>([]);
  const [stats, setStats] = useState<unknown>(null);

  // Filtrar reservas
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.part?.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.part?.part_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.order?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.budget?.budget_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || reservation.reservation_status === statusFilter;
    const matchesOrder = !orderId || reservation.order_id === orderId;
    const matchesBudget = !budgetId || reservation.budget_id === budgetId;
    const matchesPart = !partId || reservation.part_id === partId;

    return matchesSearch && matchesStatus && matchesOrder && matchesBudget && matchesPart;
  });

  // Carregar dados ao montar
  useEffect(() => {
    const loadData = async () => {
      await fetchReservations({ order_id: orderId, budget_id: budgetId, part_id: partId });
      
      const [expiring, statistics] = await Promise.all([
        getExpiringReservations(7),
        getReservationStats()
      ]);
      
      setExpiringReservations(expiring as PartReservation[]);
      setStats(statistics);
    };
    
    loadData();
  }, [orderId, budgetId, partId]);

  // Obter badge de status
  const getStatusBadge = (status: string) => {
    const config = {
      reserved: { variant: 'default' as const, icon: Clock, label: 'Reservada', color: 'bg-blue-100 text-blue-800' },
      partial: { variant: 'default' as const, icon: Clock, label: 'Parcial', color: 'bg-orange-100 text-orange-800' },
      separated: { variant: 'default' as const, icon: Package, label: 'Separada', color: 'bg-purple-100 text-purple-800' },
      applied: { variant: 'default' as const, icon: CheckCircle, label: 'Aplicada', color: 'bg-green-100 text-green-800' },
      expired: { variant: 'secondary' as const, icon: AlertCircle, label: 'Expirada', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { variant: 'secondary' as const, icon: XCircle, label: 'Cancelada', color: 'bg-red-100 text-red-800' }
    };

    const { icon: Icon, label, color } = config[status as keyof typeof config] || config.reserved;

    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  // Verificar se reserva está próxima do vencimento
  const isNearExpiry = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3 && daysUntilExpiry > 0;
  };

  // Reservar peças de orçamento
  const handleReserveFromBudget = async (budgetIdToReserve: string) => {
    const result = await reservePartsFromBudget(budgetIdToReserve);
    if (result) {
      // Recarregar dados
      const [expiring, statistics] = await Promise.all([
        getExpiringReservations(7),
        getReservationStats()
      ]);
      
      setExpiringReservations(expiring as PartReservation[]);
      setStats(statistics);
    }
  };

  // Cancelar reserva
  const handleCancelReservation = async () => {
    if (!selectedReservation) return;
    
    const success = await cancelReservation(selectedReservation.id, cancelReason);
    if (success) {
      setIsCancelDialogOpen(false);
      setSelectedReservation(null);
      setCancelReason("");
      
      // Recarregar estatísticas
      const statistics = await getReservationStats();
      setStats(statistics);
    }
  };

  // Estender reserva
  const handleExtendReservation = async () => {
    if (!selectedReservation) return;
    
    const success = await extendReservation(selectedReservation.id, extensionDays);
    if (success) {
      setIsExtendDialogOpen(false);
      setSelectedReservation(null);
      setExtensionDays(7);
      
      // Recarregar reservas expirando
      const expiring = await getExpiringReservations(7);
      setExpiringReservations(expiring as PartReservation[]);
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando reservas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Reservas Ativas</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Aplicadas</p>
                  <p className="text-2xl font-bold">{stats.applied}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Expiradas</p>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Qtd. Reservada</p>
                  <p className="text-2xl font-bold">{stats.totalQuantityReserved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de Reservas Expirando */}
      {expiringReservations.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Reservas Próximas do Vencimento
            </CardTitle>
            <CardDescription>
              {expiringReservations.length} reservas vencem nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringReservations.slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium">{reservation.part_name || reservation.part?.part_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Vence em {reservation.expires_at ? formatDistanceToNow(new Date(reservation.expires_at), { locale: ptBR }) : 'Data não definida'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setIsExtendDialogOpen(true);
                    }}
                  >
                    Estender
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por peça, código ou OS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="reserved">Reservadas</SelectItem>
              <SelectItem value="partial">Parciais</SelectItem>
              <SelectItem value="separated">Separadas</SelectItem>
              <SelectItem value="applied">Aplicadas</SelectItem>
              <SelectItem value="expired">Expiradas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          {budgetId && (
            <Button
              onClick={() => handleReserveFromBudget(budgetId)}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Reservar Peças do Orçamento
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas de Peças</CardTitle>
          <CardDescription>
            {filteredReservations.length} {filteredReservations.length === 1 ? 'reserva' : 'reservas'} encontrada{filteredReservations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peça</TableHead>
                <TableHead>OS / Orçamento</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reservado em</TableHead>
                <TableHead>Vence em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => (
                <TableRow key={reservation.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reservation.part_name || reservation.part?.part_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.part_code || reservation.part?.part_code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {reservation.order?.order_number && (
                        <p className="text-sm">OS: {reservation.order.order_number}</p>
                      )}
                      {reservation.budget?.budget_number && (
                        <p className="text-sm text-muted-foreground">
                          Orç: {reservation.budget.budget_number}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {(reservation.quantity_reserved - (reservation.quantity_applied || 0))} / {reservation.quantity_reserved}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Disponível / Total
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(reservation.reservation_status)}
                      {['reserved', 'partial', 'separated'].includes(reservation.reservation_status) && isNearExpiry(reservation.expires_at) && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Vence em breve
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {format(new Date(reservation.reserved_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </TableCell>
                  <TableCell>
                    {reservation.expires_at ? (
                      <>
                        <p className="text-sm">
                          {format(new Date(reservation.expires_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reservation.expires_at), { 
                            locale: ptBR,
                            addSuffix: true 
                          })}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem prazo</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {['reserved', 'partial', 'separated'].includes(reservation.reservation_status) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setIsExtendDialogOpen(true);
                            }}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setIsCancelDialogOpen(true);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredReservations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma reserva encontrada.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Peça</Label>
                  <p>{selectedReservation.part_name || selectedReservation.part?.part_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReservation.part_code || selectedReservation.part?.part_code}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedReservation.reservation_status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Quantidade Reservada</Label>
                  <p className="text-lg font-semibold">{selectedReservation.quantity_reserved}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantidade Aplicada</Label>
                  <p className="text-lg font-semibold">{selectedReservation.quantity_applied || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Disponível</Label>
                  <p className="text-lg font-semibold">{selectedReservation.quantity_reserved - (selectedReservation.quantity_applied || 0)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reservado em</Label>
                  <p>{format(new Date(selectedReservation.reserved_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Vence em</Label>
                  <p>
                    {selectedReservation.expires_at 
                      ? format(new Date(selectedReservation.expires_at), 'dd/MM/yyyy HH:mm')
                      : 'Sem prazo definido'
                    }
                  </p>
                </div>
              </div>
              
              {selectedReservation.notes && (
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="cancel-reason">Motivo do cancelamento</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Descreva o motivo do cancelamento..."
              className="mt-2"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelReservation}>
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Extensão */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender Reserva</DialogTitle>
            <DialogDescription>
              Estenda o prazo de validade desta reserva
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="extension-days">Dias adicionais</Label>
              <Input
                id="extension-days"
                type="number"
                min="1"
                max="90"
                value={extensionDays}
                onChange={(e) => setExtensionDays(Number(e.target.value))}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Máximo de 90 dias adicionais
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtendReservation}>
              Estender Reserva
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationManager;
