import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Award, AlertTriangle, Loader2 } from 'lucide-react';

interface SupplierEvaluation {
  id: string;
  delivery_rating: number;
  quality_rating: number;
  price_rating: number;
  service_rating: number;
  overall_rating: number;
  delivered_on_time: boolean;
  had_quality_issues: boolean;
  comments?: string;
  evaluated_at: string;
}

interface Props {
  supplierId: string;
  currentRating?: number;
}

const WEIGHTS = [
  { key: 'delivery_rating' as const, label: 'Desempenho de Entrega', weight: 35, color: 'bg-blue-500' },
  { key: 'quality_rating'  as const, label: 'Qualidade',             weight: 35, color: 'bg-green-500' },
  { key: 'price_rating'    as const, label: 'Competitividade de Preço', weight: 20, color: 'bg-purple-500' },
  { key: 'service_rating'  as const, label: 'Atendimento',           weight: 10, color: 'bg-orange-500' },
];

function toScore(rating: number): number {
  return Math.round((rating / 5) * 100);
}

function classify(score: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType } {
  if (score >= 90) return { label: 'Excelente', variant: 'default',     icon: Award };
  if (score >= 75) return { label: 'Bom',       variant: 'default',     icon: TrendingUp };
  if (score >= 60) return { label: 'Regular',   variant: 'secondary',   icon: Star };
  if (score >= 40) return { label: 'Ruim',      variant: 'outline',     icon: AlertTriangle };
  return              { label: 'Crítico',        variant: 'destructive', icon: AlertTriangle };
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function SupplierEvaluationTab({ supplierId, currentRating }: Props) {
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supplierId) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    client
      .from('supplier_evaluations')
      .select('id, delivery_rating, quality_rating, price_rating, service_rating, overall_rating, delivered_on_time, had_quality_issues, comments, evaluated_at')
      .eq('supplier_id', supplierId)
      .order('evaluated_at', { ascending: false })
      .limit(20)
      .then(({ data }: { data: SupplierEvaluation[] | null }) => {
        setEvaluations((data ?? []) as SupplierEvaluation[]);
        setLoading(false);
      });
  }, [supplierId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const avgByKey = (key: keyof SupplierEvaluation) => {
    if (!evaluations.length) return 5;
    const vals = evaluations.map(e => Number(e[key])).filter(v => !isNaN(v));
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };

  const avgDelivery = avgByKey('delivery_rating');
  const avgQuality  = avgByKey('quality_rating');
  const avgPrice    = avgByKey('price_rating');
  const avgService  = avgByKey('service_rating');

  const weightedRating =
    (avgDelivery * 0.35) + (avgQuality * 0.35) + (avgPrice * 0.20) + (avgService * 0.10);

  const overallScore = toScore(currentRating ?? weightedRating);
  const { label, variant, icon: ClassIcon } = classify(overallScore);

  const onTimeCount   = evaluations.filter(e => e.delivered_on_time).length;
  const onTimeRate    = evaluations.length ? Math.round((onTimeCount / evaluations.length) * 100) : 100;

  const avgScores = {
    delivery_rating: toScore(avgDelivery),
    quality_rating:  toScore(avgQuality),
    price_rating:    toScore(avgPrice),
    service_rating:  toScore(avgService),
  };

  return (
    <div className="space-y-4">
      {/* Nota geral */}
      <Card className="border-2">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Nota Geral (média ponderada)</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums leading-none">
                  {overallScore}
                </span>
                <span className="text-muted-foreground text-sm mb-1">/100</span>
              </div>
              <ScoreBar value={overallScore} color={
                overallScore >= 75 ? 'bg-green-500' : overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              } />
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <Badge variant={variant} className="text-sm px-3 py-1 gap-1.5">
                <ClassIcon className="h-3.5 w-3.5" />
                {label}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {evaluations.length} avaliação{evaluations.length !== 1 ? 'ões' : ''} · {onTimeRate}% no prazo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critérios */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Critérios</p>
        {WEIGHTS.map(({ key, label: wLabel, weight, color }) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">{wLabel}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">({weight}%)</span>
                <span className="tabular-nums font-semibold w-8 text-right">
                  {avgScores[key]}
                </span>
              </div>
            </div>
            <ScoreBar value={avgScores[key]} color={color} />
          </div>
        ))}
      </div>

      {/* Histórico */}
      {evaluations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Histórico de Avaliações</p>
          <div className="space-y-2">
            {evaluations.map(ev => {
              const evScore = toScore(
                (Number(ev.delivery_rating) * 0.35) +
                (Number(ev.quality_rating)  * 0.35) +
                (Number(ev.price_rating)    * 0.20) +
                (Number(ev.service_rating)  * 0.10)
              );
              const { label: evLabel, variant: evVariant } = classify(evScore);
              return (
                <div key={ev.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg bg-muted/20 text-sm">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold tabular-nums">{evScore}/100</span>
                      <Badge variant={evVariant} className="text-xs">{evLabel}</Badge>
                      {!ev.delivered_on_time && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Atraso</Badge>
                      )}
                      {ev.had_quality_issues && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-300">Qualidade</Badge>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Entrega {toScore(ev.delivery_rating)}</span>
                      <span>Qualidade {toScore(ev.quality_rating)}</span>
                      <span>Preço {toScore(ev.price_rating)}</span>
                      <span>Atend. {toScore(ev.service_rating)}</span>
                    </div>
                    {ev.comments && (
                      <p className="text-xs text-muted-foreground italic truncate">{ev.comments}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {new Date(ev.evaluated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {evaluations.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Nenhuma avaliação registrada</p>
          <p className="text-xs mt-1">As avaliações são geradas automaticamente após o recebimento de mercadorias</p>
        </div>
      )}
    </div>
  );
}
