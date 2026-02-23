import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Star, StarOff, MoreVertical, Edit, Eye,
  CheckCircle, XCircle, ShieldAlert, ShieldCheck,
  Truck, Package, BadgeDollarSign,
} from 'lucide-react';
import { type Supplier, SUPPLIER_CATEGORIES } from '@/services/SupplierService';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit:        (supplier: Supplier) => void;
  onViewDetails: (supplier: Supplier) => void;
  onToggleActive:(supplier: Supplier) => void;
  onBlock?:      (supplier: Supplier) => void;
  onUnblock?:    (supplier: Supplier) => void;
  onNewQuotation?(supplier: Supplier): void;
}

function RatingStars({ value }: { value: number }) {
  const stars = Math.round((value / 100) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{stars.toFixed(0)}/5</span>
    </div>
  );
}

function MetricBar({ label, value, icon: Icon, color }: {
  label: string; value?: number; icon: React.ElementType; color: string;
}) {
  const pct = Math.min(Math.max(value ?? 0, 0), 100);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className={`w-3 h-3 flex-shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          <span className="text-xs font-medium ml-1">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function SupplierCard({
  supplier,
  onEdit,
  onViewDetails,
  onToggleActive,
  onBlock,
  onUnblock,
  onNewQuotation,
}: SupplierCardProps) {
  const displayName = supplier.trade_name ?? supplier.name;
  const categoryLabels = (supplier.categories ?? [])
    .map(v => SUPPLIER_CATEGORIES.find(c => c.value === v)?.label ?? v)
    .slice(0, 3);

  const hasMetrics = supplier.delivery_performance !== undefined
    || supplier.quality_rating !== undefined
    || supplier.price_rating !== undefined;

  return (
    <Card className={`transition-all ${!supplier.is_active ? 'opacity-60' : ''} ${supplier.blocked ? 'border-destructive' : ''}`}>
      <CardContent className="p-3 sm:p-4 space-y-3">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base truncate">{displayName}</h3>
              {supplier.is_preferred && (
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            {supplier.code && (
              <span className="text-xs text-muted-foreground font-mono">{supplier.code}</span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge
              variant={supplier.blocked ? 'destructive' : supplier.is_active ? 'default' : 'secondary'}
              className="text-xs h-5 px-1.5"
            >
              {supplier.blocked ? 'Bloqueado' : supplier.is_active ? 'Ativo' : 'Inativo'}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onViewDetails(supplier)}>
                  <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(supplier)}>
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </DropdownMenuItem>
                {onNewQuotation && (
                  <DropdownMenuItem onClick={() => onNewQuotation(supplier)}>
                    <Package className="w-4 h-4 mr-2" /> Nova cotação
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {supplier.blocked ? (
                  <DropdownMenuItem onClick={() => onUnblock?.(supplier)}>
                    <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                    Desbloquear
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onToggleActive(supplier)}>
                      {supplier.is_active ? (
                        <><XCircle className="w-4 h-4 mr-2 text-orange-500" />Inativar</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Ativar</>
                      )}
                    </DropdownMenuItem>
                    {onBlock && (
                      <DropdownMenuItem
                        onClick={() => onBlock(supplier)}
                        className="text-destructive focus:text-destructive"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" /> Bloquear
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {supplier.email && <p className="truncate">{supplier.email}</p>}
          {supplier.phone && <p>{supplier.phone}</p>}
          {supplier.delivery_days > 0 && <p>Entrega: {supplier.delivery_days} dias</p>}
        </div>

        {/* Categorias */}
        {categoryLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categoryLabels.map(label => (
              <Badge key={label} variant="outline" className="text-xs h-5 px-1.5">{label}</Badge>
            ))}
            {(supplier.categories?.length ?? 0) > 3 && (
              <Badge variant="outline" className="text-xs h-5 px-1.5">
                +{(supplier.categories?.length ?? 0) - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Rating geral */}
        {(supplier.overall_rating ?? supplier.rating) > 0 && (
          <RatingStars value={supplier.overall_rating ?? supplier.rating * 20} />
        )}

        {/* Métricas de performance */}
        {hasMetrics && (
          <div className="space-y-1.5 border-t pt-2">
            {supplier.delivery_performance !== undefined && (
              <MetricBar
                label="Entrega"
                value={supplier.delivery_performance}
                icon={Truck}
                color="text-blue-500"
              />
            )}
            {supplier.quality_rating !== undefined && (
              <MetricBar
                label="Qualidade"
                value={supplier.quality_rating}
                icon={StarOff}
                color="text-purple-500"
              />
            )}
            {supplier.price_rating !== undefined && (
              <MetricBar
                label="Preço"
                value={supplier.price_rating}
                icon={BadgeDollarSign}
                color="text-green-500"
              />
            )}
          </div>
        )}

        {/* Botão Ver Detalhes */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => onViewDetails(supplier)}
        >
          <Eye className="w-3 h-3 mr-1" /> Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
