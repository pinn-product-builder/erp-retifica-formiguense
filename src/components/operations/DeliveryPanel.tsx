import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Truck, 
  FileText, 
  DollarSign,
  Award,
  Clock,
  User,
  Calendar,
  Phone,
  MapPin,
  Package,
  AlertTriangle,
  Star,
  Download,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderContext {
  id?: string;
  number?: string;
  customer?: string;
  status?: string;
  progress?: number;
  currentStep?: string;
}

interface DeliveryPanelProps {
  orderContext?: OrderContext;
}

interface DeliveryData {
  deliveryDate: string;
  deliveryTime: string;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  customerContact: string;
  specialInstructions: string;
  documentsGenerated: boolean;
  paymentStatus: 'pending' | 'partial' | 'completed';
  warrantyActivated: boolean;
}

export function DeliveryPanel({ orderContext }: DeliveryPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('delivery');
  const [loading, setLoading] = useState(false);

  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: '14:00',
    deliveryMethod: 'pickup',
    customerContact: '',
    specialInstructions: '',
    documentsGenerated: false,
    paymentStatus: 'pending',
    warrantyActivated: false
  });

  // Dados simulados para demonstração
  const orderSummary = {
    totalValue: 2850.00,
    paidValue: 1425.00,
    remainingValue: 1425.00,
    warrantyPeriod: 90, // dias
    completionDate: '2025-09-26',
    totalDays: 7,
    components: [
      { name: 'Bloco', status: 'completed', quality: 'approved' },
      { name: 'Cabeçote', status: 'completed', quality: 'approved' },
      { name: 'Virabrequim', status: 'completed', quality: 'approved' },
      { name: 'Biela', status: 'completed', quality: 'approved' },
      { name: 'Comando', status: 'completed', quality: 'approved' }
    ]
  };

  const documents = [
    { id: '1', name: 'Ordem de Serviço', type: 'pdf', generated: true },
    { id: '2', name: 'Relatório Técnico', type: 'pdf', generated: true },
    { id: '3', name: 'Certificado de Qualidade', type: 'pdf', generated: true },
    { id: '4', name: 'Termo de Garantia', type: 'pdf', generated: false },
    { id: '5', name: 'Nota Fiscal', type: 'pdf', generated: false }
  ];

  const handleGenerateDocuments = async () => {
    try {
      setLoading(true);
      // TODO: Implementar geração real dos documentos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDeliveryData(prev => ({ ...prev, documentsGenerated: true }));
      
      toast({
        title: "Documentos Gerados",
        description: "Todos os documentos foram gerados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar os documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateWarranty = async () => {
    try {
      setLoading(true);
      // TODO: Implementar ativação real da garantia
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setDeliveryData(prev => ({ ...prev, warrantyActivated: true }));
      
      toast({
        title: "Garantia Ativada",
        description: `Garantia de ${orderSummary.warrantyPeriod} dias ativada com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível ativar a garantia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      setLoading(true);
      // TODO: Implementar finalização real da entrega
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Entrega Concluída!",
        description: "Ordem de serviço finalizada com sucesso",
      });
      
      // Redirecionar ou atualizar estado
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a entrega",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Pago';
      case 'partial':
        return 'Parcial';
      case 'pending':
        return 'Pendente';
      default:
        return 'Indefinido';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header com contexto da ordem */}
      {orderContext?.number && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">
                  Finalização e Entrega - OS: {orderContext.number}
                </h3>
                <p className="text-sm text-green-700">
                  Cliente: {orderContext.customer}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="border-green-300 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Pronto para Entrega
                </Badge>
                <div className="mt-2 w-32">
                  <Progress value={95} className="bg-green-100" />
                  <p className="text-xs text-green-600 mt-1">95% concluído</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo da Ordem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Valor Total:</span>
              <span className="font-bold text-lg">R$ {orderSummary.totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Valor Pago:</span>
              <span className="font-medium text-green-600">R$ {orderSummary.paidValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Saldo Restante:</span>
              <span className="font-medium text-red-600">R$ {orderSummary.remainingValue.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t">
              <Badge className={getPaymentStatusColor(deliveryData.paymentStatus)}>
                {getPaymentStatusText(deliveryData.paymentStatus)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Cronograma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Data de Conclusão:</span>
              <span className="font-medium">{orderSummary.completionDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tempo Total:</span>
              <span className="font-medium">{orderSummary.totalDays} dias</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Garantia:</span>
              <span className="font-medium">{orderSummary.warrantyPeriod} dias</span>
            </div>
            <div className="pt-2 border-t">
              <Badge variant={deliveryData.warrantyActivated ? "default" : "secondary"}>
                {deliveryData.warrantyActivated ? "Garantia Ativa" : "Aguardando Ativação"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              Status dos Componentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderSummary.components.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{component.name}</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="text-xs">
                      Aprovado
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Painel de Entrega e Finalização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Entrega
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="warranty" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Garantia
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="delivery" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Configuração da Entrega</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Configure os detalhes da entrega e confirme com o cliente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deliveryDate">Data da Entrega</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={deliveryData.deliveryDate}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryTime">Horário</Label>
                      <Input
                        id="deliveryTime"
                        type="time"
                        value={deliveryData.deliveryTime}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Método de Entrega</Label>
                    <Select
                      value={deliveryData.deliveryMethod}
                      onValueChange={(value: 'pickup' | 'delivery') => 
                        setDeliveryData(prev => ({ ...prev, deliveryMethod: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">Retirada na Oficina</SelectItem>
                        <SelectItem value="delivery">Entrega no Local</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {deliveryData.deliveryMethod === 'delivery' && (
                    <div>
                      <Label htmlFor="deliveryAddress">Endereço de Entrega</Label>
                      <Textarea
                        id="deliveryAddress"
                        placeholder="Endereço completo para entrega"
                        value={deliveryData.deliveryAddress || ''}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="customerContact">Contato do Cliente</Label>
                    <Input
                      id="customerContact"
                      placeholder="Telefone ou e-mail para confirmação"
                      value={deliveryData.customerContact}
                      onChange={(e) => setDeliveryData(prev => ({ ...prev, customerContact: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialInstructions">Instruções Especiais</Label>
                    <Textarea
                      id="specialInstructions"
                      placeholder="Observações especiais para a entrega"
                      value={deliveryData.specialInstructions}
                      onChange={(e) => setDeliveryData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Card className="border-2 border-dashed border-gray-300">
                    <CardContent className="p-4 text-center">
                      <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-medium mb-2">Localização da Entrega</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {deliveryData.deliveryMethod === 'pickup' 
                          ? 'Cliente retirará na oficina'
                          : 'Entrega será realizada no endereço informado'
                        }
                      </p>
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        Ver no Mapa
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Checklist de Entrega</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Todos os componentes aprovados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Controle de qualidade concluído</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {deliveryData.documentsGenerated ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="text-sm">Documentos gerados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {deliveryData.paymentStatus === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className="text-sm">Pagamento quitado</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Documentação da Ordem</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Gere e gerencie todos os documentos necessários para a entrega.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className={`border-2 ${doc.generated ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <FileText className={`h-5 w-5 ${doc.generated ? 'text-green-600' : 'text-gray-400'}`} />
                        <Badge variant={doc.generated ? "default" : "secondary"}>
                          {doc.generated ? "Gerado" : "Pendente"}
                        </Badge>
                      </div>
                      <h4 className="font-medium mb-2">{doc.name}</h4>
                      <div className="flex gap-2">
                        {doc.generated ? (
                          <>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Download className="h-3 w-3 mr-1" />
                              Baixar
                            </Button>
                            <Button size="sm" variant="outline">
                              <Send className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="flex-1" disabled>
                            Aguardando
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleGenerateDocuments}
                  disabled={loading || deliveryData.documentsGenerated}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Gerando Documentos...
                    </>
                  ) : deliveryData.documentsGenerated ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Documentos Gerados
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Todos os Documentos
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="warranty" className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Ativação da Garantia</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Configure e ative a garantia técnica para esta ordem de serviço.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes da Garantia</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Período de Cobertura:</span>
                      <span className="font-medium">{orderSummary.warrantyPeriod} dias</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data de Início:</span>
                      <span className="font-medium">{deliveryData.deliveryDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data de Término:</span>
                      <span className="font-medium">
                        {new Date(new Date(deliveryData.deliveryDate).getTime() + orderSummary.warrantyPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <Badge variant={deliveryData.warrantyActivated ? "default" : "secondary"}>
                        {deliveryData.warrantyActivated ? "Garantia Ativada" : "Aguardando Ativação"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cobertura da Garantia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderSummary.components.map((component, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{component.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Coberto
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleActivateWarranty}
                  disabled={loading || deliveryData.warrantyActivated}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Ativando Garantia...
                    </>
                  ) : deliveryData.warrantyActivated ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Garantia Ativada
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Ativar Garantia
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Feedback do Cliente</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Colete feedback do cliente sobre o serviço prestado.
                    </p>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sistema de Feedback</h3>
                  <p className="text-gray-600 mb-4">
                    O sistema de feedback será implementado após a entrega ser confirmada.
                  </p>
                  <Button variant="outline" disabled>
                    <Star className="h-4 w-4 mr-2" />
                    Aguardando Entrega
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ação Final */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">Finalizar Entrega</h3>
          <p className="text-green-700 mb-6">
            Confirme que todos os itens foram verificados e proceda com a entrega final.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Visualizar Resumo
            </Button>
            
            <Button
              onClick={handleCompleteDelivery}
              disabled={loading || !deliveryData.documentsGenerated || deliveryData.paymentStatus !== 'completed'}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Entrega
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
