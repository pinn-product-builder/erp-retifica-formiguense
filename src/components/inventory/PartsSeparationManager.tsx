import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { reservationService } from '@/services/ReservationService';
import {
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  User,
  Calendar,
  Wrench,
} from 'lucide-react';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

interface PartsReservation {
  id: string;
  order_id: string;
  part_code: string;
  part_name: string;
  quantity_reserved: number;
  quantity_separated: number | null;
  quantity_applied: number | null;
  unit_cost: number | null;
  reservation_status: string | null;
  reserved_at: string | null;
  separated_at?: string | null;
  separated_by?: string | null;
  notes?: string | null;
  order?: {
    order_number: string;
    customer?: { name: string } | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  reserved: { label: 'Reservado', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  separated: { label: 'Separado', color: 'bg-blue-100 text-blue-800', icon: Package },
  applied: { label: 'Aplicado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

const SEPARATION_PAGE_SIZE = 10;

function getPriorityBorderColor(reservation: PartsReservation): string {
  if (!reservation.reserved_at) return 'border-l-green-500';
  const reservedDays = Math.floor(
    (Date.now() - new Date(reservation.reserved_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (reservedDays > 3) return 'border-l-red-500';
  if (reservedDays > 1) return 'border-l-yellow-500';
  return 'border-l-green-500';
}

export default function PartsSeparationManager() {
  const [reservations, setReservations] = useState<PartsReservation[]>([]);
  const [pagination, setPagination] = useState({ count: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [separatingItem, setSeparatingItem] = useState<PartsReservation | null>(null);
  const [separationNotes, setSeparationNotes] = useState('');
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const loadReservations = useCallback(async (status = 'all', page = 1) => {
    if (!currentOrganization?.id) return;
    try {
      setLoading(true);
      const result = await reservationService.listForSeparation(
        currentOrganization.id,
        status,
        page,
        SEPARATION_PAGE_SIZE
      );
      setReservations(result.data as unknown as PartsReservation[]);
      setPagination({ count: result.count, page: result.page, totalPages: result.totalPages });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar reservas de peças', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, toast]);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadReservations(selectedStatus, 1);
    }
  }, [currentOrganization?.id, loadReservations]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    loadReservations(value, 1);
  };

  const handleSeparatePart = async () => {
    if (!separatingItem || !currentOrganization?.id) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      await reservationService.separatePart(
        separatingItem.id,
        currentOrganization.id,
        separatingItem.quantity_reserved,
        separationNotes,
        userData.user?.id ?? ''
      );
      toast({ title: 'Sucesso', description: 'Peça separada com sucesso' });
      setSeparatingItem(null);
      setSeparationNotes('');
      await loadReservations(selectedStatus, pagination.page);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao separar peça', variant: 'destructive' });
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.part_name.toLowerCase().includes(q) ||
      r.part_code.toLowerCase().includes(q) ||
      r.order?.order_number?.toLowerCase().includes(q) ||
      r.order?.customer?.name?.toLowerCase().includes(q)
    );
  });

  const stats = {
    reserved: reservations.filter((r) => r.reservation_status === 'reserved').length,
    separated: reservations.filter((r) => r.reservation_status === 'separated').length,
    applied: reservations.filter((r) => r.reservation_status === 'applied').length,
    overdue: reservations.filter((r) => {
      if (r.reservation_status !== 'reserved' || !r.reserved_at) return false;
      return (Date.now() - new Date(r.reserved_at).getTime()) / (1000 * 60 * 60 * 24) > 3;
    }).length,
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
      <Badge className={cfg.color}>
        <Icon className="w-3 h-3 mr-1" />
        {cfg.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Carregando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Separação de Peças</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie a separação física das peças reservadas para ordens de serviço
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <Input
                  placeholder="Buscar por peça, código, OS ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
            <div className="sm:w-44">
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full h-9 px-3 py-2 border border-input rounded-md bg-background text-sm"
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Reservadas', value: stats.reserved, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600', Icon: Clock },
          { label: 'Separadas', value: stats.separated, bgColor: 'bg-blue-100', iconColor: 'text-blue-600', Icon: Package },
          { label: 'Aplicadas', value: stats.applied, bgColor: 'bg-green-100', iconColor: 'text-green-600', Icon: CheckCircle },
          { label: 'Atrasadas', value: stats.overdue, bgColor: 'bg-red-100', iconColor: 'text-red-600', Icon: AlertTriangle },
        ].map(({ label, value, bgColor, iconColor, Icon }) => (
          <Card key={label}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 ${bgColor} rounded-lg flex-shrink-0`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h2 className="text-base sm:text-lg font-semibold">
          Reservas para Separação
        </h2>
        {pagination.count > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            Mostrando {(pagination.page - 1) * SEPARATION_PAGE_SIZE + 1}–
            {Math.min(pagination.page * SEPARATION_PAGE_SIZE, pagination.count)} de {pagination.count}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-medium mb-1">Nenhuma reserva encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || selectedStatus !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Não há peças reservadas no momento'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id} className={`border-l-4 ${getPriorityBorderColor(reservation)}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm sm:text-base">{reservation.part_name}</h3>
                      {getStatusBadge(reservation.reservation_status)}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Código:</span>
                        <span className="font-medium truncate">{reservation.part_code}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">OS:</span>
                        <span className="font-medium truncate">{reservation.order?.order_number ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-medium truncate">{reservation.order?.customer?.name ?? '—'}</span>
                      </div>
                      {reservation.reserved_at && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Reservado:</span>
                          <span className="font-medium whitespace-nowrap">
                            {new Date(reservation.reserved_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-muted-foreground">Qtd. Reservada: </span>
                        <span className="font-medium">{reservation.quantity_reserved}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qtd. Separada: </span>
                        <span className="font-medium">{reservation.quantity_separated ?? 0}</span>
                      </div>
                      {reservation.unit_cost != null && (
                        <div>
                          <span className="text-muted-foreground">Valor Unit.: </span>
                          <span className="font-medium whitespace-nowrap">
                            {formatCurrency(reservation.unit_cost)}
                          </span>
                        </div>
                      )}
                    </div>

                    {reservation.notes && (
                      <p className="text-xs text-muted-foreground">{reservation.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2 flex-shrink-0">
                    {reservation.reservation_status === 'reserved' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => setSeparatingItem(reservation)}
                          >
                            <Package className="w-3.5 h-3.5" />
                            Separar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-md">
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
                                placeholder="Localização, condição, etc."
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

        {pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => loadReservations(selectedStatus, pagination.page - 1)}
                  aria-disabled={pagination.page <= 1}
                  className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm px-4 py-2">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => loadReservations(selectedStatus, pagination.page + 1)}
                  aria-disabled={pagination.page >= pagination.totalPages}
                  className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
