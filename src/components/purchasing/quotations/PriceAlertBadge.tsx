import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { PriceHistoryService } from '@/services/PriceHistoryService';
import { useOrganization } from '@/hooks/useOrganization';

interface PriceAlertBadgeProps {
  itemName:     string;
  currentPrice: number;
}

type AlertLevel = 'normal' | 'atencao' | 'alerta' | 'critico';

interface AlertConfig {
  label: string;
  color: string;
  Icon:  React.ElementType;
}

const ALERT_CONFIG: Record<AlertLevel, AlertConfig> = {
  normal:  { label: 'Preço normal',  color: 'text-green-600',  Icon: CheckCircle2 },
  atencao: { label: 'Atenção +5%',   color: 'text-yellow-600', Icon: TrendingUp },
  alerta:  { label: 'Alerta +15%',   color: 'text-orange-500', Icon: AlertTriangle },
  critico: { label: 'Crítico +30%',  color: 'text-red-600',    Icon: AlertTriangle },
};

function getLevel(pct: number): AlertLevel {
  if (pct <= 5)  return 'normal';
  if (pct <= 15) return 'atencao';
  if (pct <= 30) return 'alerta';
  return 'critico';
}

export function PriceAlertBadge({ itemName, currentPrice }: PriceAlertBadgeProps) {
  const { currentOrganization } = useOrganization();
  const [avgPrice, setAvgPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!currentOrganization?.id || !itemName || currentPrice <= 0) return;
    let cancelled = false;
    PriceHistoryService.getAvgPriceForItem(currentOrganization.id, itemName).then((avg) => {
      if (!cancelled) setAvgPrice(avg);
    });
    return () => { cancelled = true; };
  }, [currentOrganization?.id, itemName, currentPrice]);

  if (avgPrice === null || avgPrice === 0) return null;

  const pct   = ((currentPrice - avgPrice) / avgPrice) * 100;
  if (pct <= 0) return null;

  const level = getLevel(pct);
  if (level === 'normal') return null;

  const { label, color, Icon } = ALERT_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ml-1 ${color}`}
      title={`Média histórica: ${avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} | Variação: +${pct.toFixed(1)}%`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
