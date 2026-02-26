import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CalendarDays, AlertTriangle, Package, ChevronLeft, ChevronRight, Truck, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { formatCurrency } from '@/lib/utils';
import { PURCHASE_STATUS } from '@/utils/statusTranslations';
import { format, addDays, startOfWeek, endOfWeek, isToday, isPast, parseISO, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ForecastPO {
  id:                string;
  po_number:         string;
  status:            string;
  expected_delivery: string;
  total_value:       number;
  supplier_name:     string;
  items_count:       number;
}

const CONFIDENCE: Record<string, { label: string; color: string }> = {
  confirmed:  { label: 'Alta',  color: 'bg-green-100 text-green-700' },
  in_transit: { label: 'Alta',  color: 'bg-green-100 text-green-700' },
  approved:   { label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
  sent:       { label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
  pending:    { label: 'Baixa', color: 'bg-red-100 text-red-700' },
};

export function DeliveryForecastView() {
  const { currentOrganization } = useOrganization();
  const [pos,       setPos]       = useState<ForecastPO[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo,   setFilterTo]   = useState('');
  const [selected,  setSelected]  = useState<string | null>(null);

  const fetchPOs = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('purchase_orders')
      .select(`
        id, po_number, status, expected_delivery, total_value,
        supplier:suppliers(name),
        items:purchase_order_items(id)
      `)
      .eq('org_id', currentOrganization.id)
      .not('expected_delivery', 'is', null)
      .not('status', 'in', '(cancelled,delivered)')
      .order('expected_delivery', { ascending: true })
      .limit(200);

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPos((data as any[]).map((row: any) => ({
        id:                row.id,
        po_number:         row.po_number,
        status:            row.status,
        expected_delivery: row.expected_delivery,
        total_value:       row.total_value,
        supplier_name:     row.supplier?.name ?? '—',
        items_count:       Array.isArray(row.items) ? row.items.length : 0,
      })));
    }
    setLoading(false);
  }, [currentOrganization?.id]);

  useEffect(() => { fetchPOs(); }, [fetchPOs]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd  = endOfWeek(weekStart, { weekStartsOn: 1 });

  const filtered = pos.filter(po => {
    const d = po.expected_delivery;
    if (filterFrom && d < filterFrom) return false;
    if (filterTo   && d > filterTo)   return false;
    return true;
  });

  const posForDay = (day: Date) =>
    filtered.filter(po => isSameDay(parseISO(po.expected_delivery), day));

  const posThisWeek = filtered.filter(po => {
    const d = parseISO(po.expected_delivery);
    return d >= weekStart && d <= weekEnd;
  });

  const overdueCount = pos.filter(po => isPast(parseISO(po.expected_delivery))).length;

  const selectedDayPos = selected ? posForDay(parseISO(selected)) : posThisWeek;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Previsão de Entregas
          </h2>
          <p className="text-sm text-muted-foreground">Calendário de chegadas de pedidos de compra</p>
        </div>
        {overdueCount > 0 && (
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} pedido(s) atrasado(s)
          </Badge>
        )}
      </div>

      {/* Filtros de período */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="mt-1 h-8 text-xs" />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setFilterFrom(''); setFilterTo(''); }} className="h-8 text-xs">
              Limpar
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} pedido(s) encontrado(s)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Mini-calendário semanal */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm sm:text-base">
              Semana de {format(weekStart, "d 'de' MMM", { locale: ptBR })} — {format(weekEnd, "d 'de' MMM yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setWeekStart(subWeeks(weekStart, 1)); setSelected(null); }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 })); setSelected(null); }}>Hoje</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setWeekStart(addWeeks(weekStart, 1)); setSelected(null); }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map(day => {
              const dayPos     = posForDay(day);
              const isSelected = selected === format(day, 'yyyy-MM-dd');
              const isOv       = isPast(day) && !isToday(day) && dayPos.length > 0;
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(isSelected ? null : format(day, 'yyyy-MM-dd'))}
                  className={[
                    'rounded-lg p-1.5 sm:p-2 text-center transition-colors border-2',
                    isToday(day) && !isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-transparent',
                    isSelected     ? 'bg-primary border-primary text-primary-foreground' : 'hover:bg-muted',
                    !isToday(day) && !isSelected && isOv ? 'bg-red-50/60' : '',
                  ].join(' ')}
                >
                  <p className={`text-[10px] sm:text-xs font-medium ${isToday(day) && !isSelected ? 'text-blue-100' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE', { locale: ptBR }).toUpperCase()}
                  </p>
                  <p className="text-sm sm:text-base font-bold">{format(day, 'd')}</p>
                  {dayPos.length > 0 ? (
                    <div className={`mt-1 rounded text-[10px] px-1 font-semibold ${
                      isToday(day) && !isSelected ? 'bg-white/20 text-white'
                      : isSelected ? 'bg-white/20 text-primary-foreground'
                      : isOv ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                      {dayPos.length} PC
                    </div>
                  ) : (
                    <div className="mt-1 h-4" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista do dia/semana selecionado */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          {selected
            ? `Entregas de ${format(parseISO(selected), "d 'de' MMMM", { locale: ptBR })}`
            : 'Entregas da semana'}
          <Badge variant="outline" className="text-[10px]">{selectedDayPos.length}</Badge>
        </h3>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : selectedDayPos.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma entrega prevista para este período</p>
            </CardContent>
          </Card>
        ) : (
          selectedDayPos.map(po => {
            const overdue    = isPast(parseISO(po.expected_delivery)) && !isToday(parseISO(po.expected_delivery));
            const confidence = CONFIDENCE[po.status] ?? { label: 'Baixa', color: 'bg-gray-100 text-gray-700' };
            return (
              <Card key={po.id} className={overdue ? 'border-red-200 bg-red-50/30' : ''}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base">{po.po_number}</span>
                        {overdue && (
                          <Badge variant="destructive" className="text-[10px] gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />Atrasado
                          </Badge>
                        )}
                        <Badge className={`text-[10px] ${confidence.color}`}>
                          Confiança: {confidence.label}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        <strong>Fornecedor:</strong> {po.supplier_name}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          <Clock className="h-3 w-3 inline mr-1" />
                          Previsão: <strong className="text-foreground">
                            {format(parseISO(po.expected_delivery), "dd/MM/yyyy", { locale: ptBR })}
                          </strong>
                        </span>
                        <span>{po.items_count} item(ns)</span>
                        <span>{formatCurrency(po.total_value)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0 self-start sm:self-auto">
                      {PURCHASE_STATUS[po.status] ?? po.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
