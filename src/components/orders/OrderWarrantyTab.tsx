import React from 'react';
import { Shield, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderWarranty } from '@/hooks/useOrderWarranty';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderWarrantyTabProps {
  orderId: string;
}

const WARRANTY_TYPES = {
  pecas: { label: 'Peças', color: 'bg-blue-100 text-blue-800' },
  servico: { label: 'Serviço', color: 'bg-purple-100 text-purple-800' },
  total: { label: 'Total', color: 'bg-green-100 text-green-800' },
};

export function OrderWarrantyTab({ orderId }: OrderWarrantyTabProps) {
  const { warranties, loading, isWarrantyActive, getDaysRemaining, deactivateWarranty } = useOrderWarranty(orderId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (warranties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma garantia registrada</h3>
          <p className="text-muted-foreground text-center max-w-md">
            A garantia será criada automaticamente quando a ordem for marcada como entregue.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeWarranties = warranties.filter(w => isWarrantyActive(w));
  const expiredWarranties = warranties.filter(w => !isWarrantyActive(w));

  return (
    <div className="space-y-6">
      {/* Resumo de Garantias Ativas */}
      {activeWarranties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeWarranties.map((warranty) => {
            const daysRemaining = getDaysRemaining(warranty);
            const isExpiringSoon = daysRemaining <= 30;
            
            return (
              <Card key={warranty.id} className={isExpiringSoon ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shield className="h-5 w-5 text-green-600" />
                      Garantia Ativa
                    </CardTitle>
                    <Badge className={WARRANTY_TYPES[warranty.warranty_type as keyof typeof WARRANTY_TYPES]?.color || 'bg-gray-100 text-gray-800'}>
                      {WARRANTY_TYPES[warranty.warranty_type as keyof typeof WARRANTY_TYPES]?.label || warranty.warranty_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Início:</span>
                      <span>{format(new Date(warranty.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Término:</span>
                      <span>{format(new Date(warranty.end_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Restam:</span>
                      <span className={isExpiringSoon ? 'font-semibold text-yellow-700' : 'text-green-700 font-semibold'}>
                        {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                      </span>
                    </div>
                  </div>

                  {warranty.terms && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Termos:</strong> {warranty.terms}
                      </p>
                    </div>
                  )}

                  {isExpiringSoon && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-700" />
                      <p className="text-xs text-yellow-800">
                        Garantia expirando em breve. Entre em contato com o cliente.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Deseja realmente desativar esta garantia?')) {
                          deactivateWarranty(warranty.id);
                        }
                      }}
                    >
                      Desativar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Garantias Expiradas */}
      {expiredWarranties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              Garantias Expiradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredWarranties.map((warranty) => (
                <div key={warranty.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-200 text-gray-700">
                        {WARRANTY_TYPES[warranty.warranty_type as keyof typeof WARRANTY_TYPES]?.label || warranty.warranty_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">Expirada</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Válida de {format(new Date(warranty.start_date), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                      {format(new Date(warranty.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    {warranty.terms && (
                      <p className="text-xs text-muted-foreground">{warranty.terms}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-sm text-blue-900">Sobre a Garantia</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>A garantia cobre defeitos de fabricação e montagem</li>
                <li>Não cobre desgaste natural, mau uso ou falta de manutenção</li>
                <li>Em caso de problema, entre em contato imediatamente</li>
                <li>A garantia é válida mediante apresentação da ordem de serviço</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

