import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, Star, Clock } from 'lucide-react';
import { useQuotations, Quotation } from '@/hooks/useQuotations';
import { formatCurrency } from '@/lib/utils';

interface QuotationComparisonProps {
  requisitionId: string;
  onApprove?: (quotationId: string) => void;
}

export function QuotationComparison({ requisitionId, onApprove }: QuotationComparisonProps) {
  const { quotations, loading, fetchQuotations, updateQuotationStatus, compareQuotations } = useQuotations();

  useEffect(() => {
    if (requisitionId) {
      fetchQuotations(requisitionId);
    }
  }, [requisitionId, fetchQuotations]);

  const handleApprove = async (quotationId: string) => {
    const success = await updateQuotationStatus(quotationId, 'approved');
    if (success && onApprove) {
      onApprove(quotationId);
    }
  };

  const handleReject = async (quotationId: string) => {
    await updateQuotationStatus(quotationId, 'rejected');
  };

  const comparison = compareQuotations(quotations);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Carregando cotações...
        </CardContent>
      </Card>
    );
  }

  if (quotations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhuma cotação encontrada para esta requisição
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo Comparativo */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-semibold">Melhor Preço</span>
              </div>
              <p className="text-sm text-muted-foreground">{comparison.bestPrice.supplier}</p>
              <p className="text-lg font-bold">{formatCurrency(comparison.bestPrice.total)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Entrega Mais Rápida</span>
              </div>
              <p className="text-sm text-muted-foreground">{comparison.fastestDelivery.supplier}</p>
              <p className="text-lg font-bold">{comparison.fastestDelivery.delivery} dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <Star className="h-4 w-4" />
                <span className="font-semibold">Melhor Avaliado</span>
              </div>
              <p className="text-sm text-muted-foreground">{comparison.bestRated.supplier}</p>
              <p className="text-lg font-bold">{comparison.bestRated.rating.toFixed(1)} ⭐</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Cotações */}
      <div className="space-y-3">
        {quotations.map((quotation) => {
          const isBestPrice = comparison?.bestPrice.id === quotation.id;
          const isFastestDelivery = comparison?.fastestDelivery.id === quotation.id;
          const isBestRated = comparison?.bestRated.id === quotation.id;

          return (
            <Card key={quotation.id} className={quotation.status === 'approved' ? 'border-green-500' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{quotation.supplier?.name}</h3>
                      <div className="flex gap-1">
                        {isBestPrice && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300">
                            💰 Melhor Preço
                          </Badge>
                        )}
                        {isFastestDelivery && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300">
                            ⚡ Mais Rápido
                          </Badge>
                        )}
                        {isBestRated && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">
                            ⭐ Melhor Avaliado
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <p className="font-semibold">{formatCurrency(quotation.total_value)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Prazo de Entrega:</span>
                        <p className="font-semibold">
                          {quotation.delivery_time || quotation.supplier?.delivery_days || 'N/A'} dias
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Validade:</span>
                        <p className="font-semibold">
                          {quotation.validity_date
                            ? new Date(quotation.validity_date).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avaliação:</span>
                        <p className="font-semibold">{quotation.supplier?.rating.toFixed(1)} ⭐</p>
                      </div>
                    </div>

                    {quotation.terms && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Condições:</span>
                        <p>{quotation.terms}</p>
                      </div>
                    )}

                    {/* Itens da Cotação */}
                    {quotation.items && quotation.items.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Ver {quotation.items.length} item(ns)
                        </summary>
                        <div className="mt-2 space-y-1 pl-4">
                          {quotation.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {item.item_name} ({item.quantity}x)
                              </span>
                              <span className="font-medium">{formatCurrency(item.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 ml-4">
                    {quotation.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => handleApprove(quotation.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(quotation.id)}
                        >
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {quotation.status === 'approved' && (
                      <Badge className="bg-green-500/20 text-green-700 border-green-300">
                        Aprovada
                      </Badge>
                    )}
                    {quotation.status === 'rejected' && (
                      <Badge className="bg-red-500/20 text-red-700 border-red-300">
                        Rejeitada
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

