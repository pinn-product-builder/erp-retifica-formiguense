import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  FileDown, TrendingUp, TrendingDown, Building2, Package, Clock,
  DollarSign, AlertTriangle, CheckCircle, BarChart3, FileText, RefreshCw,
  Printer, PieChart as PieChartIcon,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { usePurchasingReports, PERIOD_LABELS } from '@/hooks/usePurchasingReports';
import { type PeriodoAnalise } from '@/services/PurchasingReportsService';

const PERIOD_OPTIONS: { value: PeriodoAnalise; label: string }[] = [
  { value: 'mes',          label: 'Este Mês'         },
  { value: 'trimestre',    label: 'Último Trimestre'  },
  { value: 'ano',          label: 'Este Ano'          },
  { value: 'semana',       label: 'Esta Semana'       },
  { value: 'hoje',         label: 'Hoje'              },
  { value: 'personalizado', label: 'Personalizado'   },
];

const SCORE_COLOR = (score: number) =>
  score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-500' : 'bg-red-500';

const RATING_BAR_COLOR = (rating: number) =>
  rating >= 4 ? 'bg-emerald-500' : rating >= 3 ? 'bg-amber-500' : 'bg-red-500';

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${RATING_BAR_COLOR(value)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm">{value.toFixed(1)}</span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/50 ${className}`} />;
}

export default function RelatoriosCompras() {
  const {
    isLoading, data, supplierPerformance, leadTimeDetails, topItems, auditData,
    filters, fetchAll, setPeriod, applyFilters, printReport,
  } = usePurchasingReports();

  const [localStart, setLocalStart] = useState('');
  const [localEnd,   setLocalEnd]   = useState('');

  useEffect(() => { fetchAll(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyCustom = () => {
    if (localStart && localEnd) applyFilters({ period: 'personalizado', startDate: localStart, endDate: localEnd });
  };

  const kpis = data?.kpis;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Relatórios de Compras</h1>
          <p className="text-sm text-muted-foreground">Análises e indicadores do módulo de compras</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Select value={filters.period} onValueChange={(v) => setPeriod(v as PeriodoAnalise)}>
              <SelectTrigger className="w-40 sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filters.period === 'personalizado' && (
            <>
              <div>
                <Label className="text-xs">De</Label>
                <Input type="date" className="mt-0.5 h-9" value={localStart} onChange={e => setLocalStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" className="mt-0.5 h-9" value={localEnd} onChange={e => setLocalEnd(e.target.value)} />
              </div>
              <Button onClick={handleApplyCustom} disabled={!localStart || !localEnd} size="sm">
                Aplicar
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={() => fetchAll()} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={printReport} disabled={!data || isLoading} className="gap-1.5">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {isLoading || !kpis ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Compras</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(kpis.totalValue)}</p>
                  </div>
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Pedidos</p>
                    <p className="text-lg sm:text-2xl font-bold">{kpis.totalOrders}</p>
                    <p className="text-xs text-muted-foreground truncate">ticket médio {formatCurrency(kpis.averageOrderValue)}</p>
                  </div>
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Fornecedores</p>
                    <p className="text-lg sm:text-2xl font-bold">{kpis.activeSuppliers}</p>
                    <p className="text-xs text-muted-foreground truncate">no período</p>
                  </div>
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Lead Time Médio</p>
                    <p className="text-lg sm:text-2xl font-bold">{kpis.avgLeadTimeDays.toFixed(1)} dias</p>
                    {kpis.avgLeadTimeDays > 0 && (
                      <div className={`flex items-center text-xs mt-0.5 ${kpis.avgLeadTimeDays <= 7 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {kpis.avgLeadTimeDays <= 7
                          ? <TrendingDown className="w-3 h-3 mr-1" />
                          : <TrendingUp className="w-3 h-3 mr-1" />}
                        {kpis.avgLeadTimeDays <= 7 ? 'dentro da meta' : 'acima da meta'}
                      </div>
                    )}
                  </div>
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Economia</p>
                    <p className="text-lg sm:text-2xl font-bold text-emerald-600 truncate">{formatCurrency(kpis.savingsFromQuotations)}</p>
                    {kpis.savingsPercentage > 0 && (
                      <p className="text-xs text-emerald-600 truncate">{kpis.savingsPercentage.toFixed(1)}% de desconto</p>
                    )}
                  </div>
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="volume" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex lg:grid lg:grid-cols-5">
          <TabsTrigger value="volume"    className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Volume</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <Building2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="prices"    className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <PieChartIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Preços</span>
          </TabsTrigger>
          <TabsTrigger value="leadtime"  className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">Lead Time</span>
          </TabsTrigger>
          <TabsTrigger value="audit"     className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Volume ─────────────────────────────────── */}
        <TabsContent value="volume" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-sm sm:text-base">Volume de Compras por Mês</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {isLoading ? (
                  <Skeleton className="h-72" />
                ) : (data?.volumeByMonth ?? []).length === 0 ? (
                  <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">Sem dados para o período</div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data!.volumeByMonth}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={52} />
                        <Tooltip
                          formatter={(v: number) => [formatCurrency(v), 'Valor']}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                        />
                        <Bar dataKey="total_value" name="Valor Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-sm sm:text-base">Top Fornecedores</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {isLoading ? (
                  <Skeleton className="h-72" />
                ) : (data?.topSuppliers ?? []).length === 0 ? (
                  <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">Sem dados</div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data!.topSuppliers}
                          dataKey="total_value"
                          nameKey="supplier_name"
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={80}
                          label={false}
                        >
                          {data!.topSuppliers.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => formatCurrency(v)}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                        />
                        <Legend
                          formatter={(value) => <span className="text-xs">{value}</span>}
                          iconSize={10}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: Fornecedores ───────────────────────────── */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-sm sm:text-base">Desempenho de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-2">
              {isLoading ? (
                <Skeleton className="m-4 h-48" />
              ) : supplierPerformance.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground p-4">
                  Nenhuma avaliação registrada
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-center">Entrega</TableHead>
                        <TableHead className="text-center">Qualidade</TableHead>
                        <TableHead className="text-center">Preço</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierPerformance.map((s) => (
                        <TableRow key={s.supplier_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{s.supplier_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <RatingBar value={s.delivery_rating} />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <RatingBar value={s.quality_rating} />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <RatingBar value={s.price_rating} />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${SCORE_COLOR(s.overall_rating)} text-white`}>
                              {s.overall_rating.toFixed(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {s.overall_rating >= 3.5 ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-500 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />Aprovado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />Em análise
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Preços ─────────────────────────────────── */}
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-sm sm:text-base">Top Itens por Volume de Compra</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-2">
              {isLoading ? (
                <Skeleton className="m-4 h-48" />
              ) : topItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground p-4">
                  Sem itens no período
                </div>
              ) : (
                <>
                  <div className="p-3 sm:p-4 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topItems.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                        <YAxis
                          dataKey="item_name"
                          type="category"
                          tick={{ fontSize: 10 }}
                          width={110}
                          tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v}
                        />
                        <Tooltip
                          formatter={(v: number) => formatCurrency(v)}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                        />
                        <Bar dataKey="avg_unit_price" name="Preço Médio Unit." fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto px-2 pb-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-center">Qtd. Comprada</TableHead>
                          <TableHead className="text-right">Preço Médio</TableHead>
                          <TableHead className="text-right">Mín.</TableHead>
                          <TableHead className="text-right">Máx.</TableHead>
                          <TableHead className="text-center">Variação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topItems.map((item) => {
                          const variation = item.min_unit_price > 0
                            ? ((item.max_unit_price - item.min_unit_price) / item.min_unit_price) * 100
                            : 0;
                          return (
                            <TableRow key={item.item_name}>
                              <TableCell className="font-medium text-xs sm:text-sm max-w-[160px] truncate">{item.item_name}</TableCell>
                              <TableCell className="text-center">{item.total_purchased}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">{formatCurrency(item.avg_unit_price)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap text-emerald-600">{formatCurrency(item.min_unit_price)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap text-red-500">{formatCurrency(item.max_unit_price)}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={variation > 20 ? 'destructive' : variation > 0 ? 'secondary' : 'outline'} className="text-xs">
                                  {variation > 0 ? `+${variation.toFixed(0)}%` : '—'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Lead Time ──────────────────────────────── */}
        <TabsContent value="leadtime" className="space-y-4">
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-sm sm:text-base">Lead Time por Fornecedor</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {isLoading ? (
                <Skeleton className="h-72" />
              ) : leadTimeDetails.length === 0 ? (
                <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">
                  Sem pedidos entregues no período
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadTimeDetails} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" unit=" dias" tick={{ fontSize: 10 }} />
                      <YAxis
                        dataKey="supplier_name"
                        type="category"
                        width={110}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v.toFixed(1)} dias`, 'Média']}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }}
                      />
                      <Bar dataKey="avg_days" name="Média" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {!isLoading && leadTimeDetails.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-sm sm:text-base">Detalhamento de Lead Time</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-2">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-center">Pedidos</TableHead>
                        <TableHead className="text-center">Mínimo</TableHead>
                        <TableHead className="text-center">Médio</TableHead>
                        <TableHead className="text-center">Máximo</TableHead>
                        <TableHead className="text-center">Classificação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadTimeDetails.map((item) => (
                        <TableRow key={item.supplier_id}>
                          <TableCell className="font-medium text-xs sm:text-sm">{item.supplier_name}</TableCell>
                          <TableCell className="text-center">{item.total_orders}</TableCell>
                          <TableCell className="text-center">{item.min_days.toFixed(1)} dias</TableCell>
                          <TableCell className="text-center font-bold">{item.avg_days.toFixed(1)} dias</TableCell>
                          <TableCell className="text-center">{item.max_days.toFixed(1)} dias</TableCell>
                          <TableCell className="text-center">
                            <Badge className={
                              item.avg_days <= 4 ? 'bg-emerald-500 text-white' :
                              item.avg_days <= 7 ? 'bg-amber-500 text-white'  : 'bg-red-500 text-white'
                            }>
                              {item.avg_days <= 4 ? 'Excelente' : item.avg_days <= 7 ? 'Bom' : 'Lento'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB: Auditoria ──────────────────────────────── */}
        <TabsContent value="audit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  Red Flags Identificadas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {isLoading ? (
                  <Skeleton className="h-32" />
                ) : (auditData?.flags ?? []).length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-md p-3">
                    <CheckCircle className="h-4 w-4" />
                    Nenhuma inconsistência encontrada
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditData!.flags.map((flag) => (
                      <div key={flag.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            flag.severity === 'high'   ? 'bg-red-500' :
                            flag.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-medium text-sm">{flag.type}</span>
                        </div>
                        <Badge variant={flag.severity === 'high' ? 'destructive' : 'secondary'}>
                          {flag.count} {flag.count === 1 ? 'ocorrência' : 'ocorrências'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-sm sm:text-base">Resumo de Auditoria</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                {isLoading || !auditData ? (
                  <Skeleton className="h-32" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">Total de Pedidos Analisados</p>
                        <p className="text-xs text-muted-foreground">{PERIOD_LABELS[filters.period]}</p>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold">{auditData.totalOrders}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">Pedidos com Cotação</p>
                        <p className="text-xs text-muted-foreground">Processo regular</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl sm:text-2xl font-bold text-emerald-600">{auditData.ordersWithQuotation}</p>
                        <p className="text-xs text-muted-foreground">
                          {auditData.totalOrders > 0 ? ((auditData.ordersWithQuotation / auditData.totalOrders) * 100).toFixed(1) : '0'}%
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${auditData.ordersWithoutQuotation > 0 ? 'border-amber-200 bg-amber-50/50' : ''}`}>
                      <div>
                        <p className="font-medium text-sm">Pedidos sem Cotação</p>
                        <p className="text-xs text-muted-foreground">Compra emergencial</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl sm:text-2xl font-bold ${auditData.ordersWithoutQuotation > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {auditData.ordersWithoutQuotation}
                        </p>
                        <p className="text-xs text-muted-foreground">{auditData.emergencyRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">Tempo Médio de Aprovação</p>
                        <p className="text-xs text-muted-foreground">Do pedido à aprovação</p>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold">
                        {auditData.avgApprovalDays > 0 ? `${auditData.avgApprovalDays.toFixed(1)} dias` : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {!isLoading && (auditData?.flaggedOrders ?? []).length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6 pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm sm:text-base">Pedidos com Alertas</CardTitle>
                <Button variant="outline" size="sm" onClick={printReport} className="gap-1.5">
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0 sm:p-2">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Flag</TableHead>
                        <TableHead>Severidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditData!.flaggedOrders.map((order, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{order.po_number}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{order.supplier_name}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(order.total_value)}</TableCell>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                            {new Date(order.order_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{order.flag}</TableCell>
                          <TableCell>
                            {order.severity === 'high'
                              ? <Badge variant="destructive" className="text-xs">Alta</Badge>
                              : <Badge className="bg-amber-500 text-white text-xs">Média</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const PIE_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];
