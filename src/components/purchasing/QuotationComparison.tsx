import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Award,
  TrendingDown,
  TrendingUp,
  Clock,
  Star,
  Truck,
  DollarSign,
  AlertTriangle,
  Crown,
  Target,
  Zap,
} from 'lucide-react';
import { type Quotation } from '@/hooks/useQuotations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuotationComparisonProps {
  quotations: Quotation[];
  onApprove: (quotationId: string) => void;
  onReject: (quotationId: string) => void;
}

export default function QuotationComparison({
  quotations,
  onApprove,
  onReject,
}: QuotationComparisonProps) {
  if (quotations.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma cotação para comparar</p>
      </div>
    );
  }

  // Análise comparativa
  const analysis = {
    bestPrice: quotations.reduce((best, current) => 
      current.total_value < best.total_value ? current : best
    ),
    fastestDelivery: quotations.reduce((best, current) => {
      const currentDelivery = current.delivery_time || current.supplier?.delivery_days || 999;
      const bestDelivery = best.delivery_time || best.supplier?.delivery_days || 999;
      return currentDelivery < bestDelivery ? current : best;
    }),
    bestRated: quotations.reduce((best, current) => 
      (current.supplier?.rating || 0) > (best.supplier?.rating || 0) ? current : best
    ),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  const getDeliveryTime = (quotation: Quotation) => {
    return quotation.delivery_time || quotation.supplier?.delivery_days || 0;
  };

  const getBadgeForQuotation = (quotation: Quotation) => {
    const badges = [];
    
    if (quotation.id === analysis.bestPrice.id) {
      badges.push(
        <Badge key="price" className="bg-green-100 text-green-800">
          <DollarSign className="w-3 h-3 mr-1" />
          Melhor Preço
        </Badge>
      );
    }
    
    if (quotation.id === analysis.fastestDelivery.id) {
      badges.push(
        <Badge key="delivery" className="bg-blue-100 text-blue-800">
          <Zap className="w-3 h-3 mr-1" />
          Mais Rápido
        </Badge>
      );
    }
    
    if (quotation.id === analysis.bestRated.id) {
      badges.push(
        <Badge key="rating" className="bg-purple-100 text-purple-800">
          <Crown className="w-3 h-3 mr-1" />
          Melhor Avaliado
        </Badge>
      );
    }
    
    return badges;
  };

  // Calcular score geral (combinando preço, prazo e avaliação)
  const calculateScore = (quotation: Quotation) => {
    const priceScore = quotations.length === 1 ? 100 : 
      (1 - (quotation.total_value - analysis.bestPrice.total_value) / 
       (Math.max(...quotations.map(q => q.total_value)) - analysis.bestPrice.total_value)) * 40;
    
    const deliveryScore = quotations.length === 1 ? 100 :
      (1 - (getDeliveryTime(quotation) - getDeliveryTime(analysis.fastestDelivery)) / 
       (Math.max(...quotations.map(q => getDeliveryTime(q))) - getDeliveryTime(analysis.fastestDelivery))) * 30;
    
    const ratingScore = ((quotation.supplier?.rating || 0) / 10) * 30;
    
    return Math.round(priceScore + deliveryScore + ratingScore);
  };

  const quotationsWithScores = quotations.map(q => ({
    ...q,
    score: calculateScore(q),
  })).sort((a, b) => b.score - a.score);

  const bestOverall = quotationsWithScores[0];

  return (
    <div className="space-y-4 py-2">
      {/* Resumo da Análise */}
      <Alert className="py-3">
        <Target className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-sm">Análise Comparativa de {quotations.length} Cotações</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-start gap-2">
                <DollarSign className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  <strong>Melhor Preço:</strong> {analysis.bestPrice.supplier?.name} - 
                  {formatCurrency(analysis.bestPrice.total_value)}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  <strong>Mais Rápido:</strong> {analysis.fastestDelivery.supplier?.name} - 
                  {getDeliveryTime(analysis.fastestDelivery)} dias
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Crown className="w-3 h-3 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  <strong>Melhor Avaliado:</strong> {analysis.bestRated.supplier?.name} - 
                  ⭐ {analysis.bestRated.supplier?.rating?.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Recomendação */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary text-base">
            <Award className="w-4 h-4" />
            Recomendação Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{bestOverall.supplier?.name}</p>
              <p className="text-muted-foreground text-sm">
                Score: {bestOverall.score}/100 pontos
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {formatCurrency(bestOverall.total_value)}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  {getDeliveryTime(bestOverall)} dias
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {bestOverall.supplier?.rating?.toFixed(1)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onApprove(bestOverall.id)}
              className="bg-primary hover:bg-primary/90 shrink-0"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comparação Detalhada</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto -mx-1 px-1 max-w-full">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Fornecedor</TableHead>
                  <TableHead className="min-w-[100px]">Valor</TableHead>
                  <TableHead className="min-w-[80px]">Prazo</TableHead>
                  <TableHead className="min-w-[80px]">Avaliação</TableHead>
                  <TableHead className="min-w-[90px]">Score</TableHead>
                  <TableHead className="min-w-[100px]">Destaques</TableHead>
                  <TableHead className="text-right min-w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotationsWithScores.map((quotation, index) => (
                  <TableRow 
                    key={quotation.id}
                    className={index === 0 ? 'bg-primary/5 border-primary/20' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {index === 0 && <Crown className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{quotation.supplier?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {quotation.quote_number || `COT-${quotation.id.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm whitespace-nowrap">
                          {formatCurrency(quotation.total_value)}
                        </span>
                        {quotation.id === analysis.bestPrice.id && (
                          <TrendingDown className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm whitespace-nowrap">{getDeliveryTime(quotation)} dias</span>
                        {quotation.id === analysis.fastestDelivery.id && (
                          <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        <span className="text-sm whitespace-nowrap">{quotation.supplier?.rating?.toFixed(1) || 'N/A'}</span>
                        {quotation.id === analysis.bestRated.id && (
                          <TrendingUp className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 bg-gray-200 rounded-full h-1.5 shrink-0">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${quotation.score}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">{quotation.score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getBadgeForQuotation(quotation)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApprove(quotation.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(quotation.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes dos Itens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalhamento dos Itens</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {quotations.map((quotation) => (
              <div key={quotation.id} className="border rounded-lg p-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm">{quotation.supplier?.name}</h4>
                  <div className="flex flex-wrap gap-1">
                    {getBadgeForQuotation(quotation)}
                  </div>
                </div>
                
                {quotation.items && quotation.items.length > 0 && (
                  <div className="overflow-x-auto -mx-1 px-1 max-w-full">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Item</TableHead>
                          <TableHead className="min-w-[100px]">Qtd</TableHead>
                          <TableHead className="min-w-[100px]">Preço Unit.</TableHead>
                          <TableHead className="min-w-[100px]">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotation.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-sm">
                              <div>
                                <p className="truncate">{item.item_name}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{item.quantity}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="font-semibold text-sm whitespace-nowrap">
                              {formatCurrency(item.total_price)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {quotation.terms && (
                  <div className="mt-2 p-2 bg-muted rounded-lg">
                    <p className="text-xs">
                      <strong>Condições:</strong> {quotation.terms}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}