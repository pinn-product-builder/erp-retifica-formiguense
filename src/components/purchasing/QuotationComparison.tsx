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
    <div className="space-y-6">
      {/* Resumo da Análise */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Análise Comparativa de {quotations.length} Cotações</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span>
                  <strong>Melhor Preço:</strong> {analysis.bestPrice.supplier?.name} - 
                  {formatCurrency(analysis.bestPrice.total_value)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>
                  <strong>Entrega Mais Rápida:</strong> {analysis.fastestDelivery.supplier?.name} - 
                  {getDeliveryTime(analysis.fastestDelivery)} dias
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                <span>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Award className="w-5 h-5" />
            Recomendação Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{bestOverall.supplier?.name}</p>
              <p className="text-muted-foreground">
                Score geral: {bestOverall.score}/100 pontos
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(bestOverall.total_value)}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  {getDeliveryTime(bestOverall)} dias
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {bestOverall.supplier?.rating?.toFixed(1)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => onApprove(bestOverall.id)}
              className="bg-primary hover:bg-primary/90"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar Recomendada
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Detalhada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Destaques</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotationsWithScores.map((quotation, index) => (
                  <TableRow 
                    key={quotation.id}
                    className={index === 0 ? 'bg-primary/5 border-primary/20' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index === 0 && <Crown className="w-4 h-4 text-primary" />}
                        <div>
                          <p className="font-medium">{quotation.supplier?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {quotation.quote_number || `COT-${quotation.id.slice(0, 8)}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {formatCurrency(quotation.total_value)}
                        </span>
                        {quotation.id === analysis.bestPrice.id && (
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span>{getDeliveryTime(quotation)} dias</span>
                        {quotation.id === analysis.fastestDelivery.id && (
                          <Zap className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{quotation.supplier?.rating?.toFixed(1) || 'N/A'}</span>
                        {quotation.id === analysis.bestRated.id && (
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {formatDate(quotation.quote_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {quotation.validity_date ? formatDate(quotation.validity_date) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${quotation.score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{quotation.score}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getBadgeForQuotation(quotation)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApprove(quotation.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(quotation.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
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
        <CardHeader>
          <CardTitle>Detalhamento dos Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quotations.map((quotation) => (
              <div key={quotation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{quotation.supplier?.name}</h4>
                  <div className="flex gap-1">
                    {getBadgeForQuotation(quotation)}
                  </div>
                </div>
                
                {quotation.items && quotation.items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotation.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {quotation.terms && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
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