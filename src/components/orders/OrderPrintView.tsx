import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Order } from '@/hooks/useOrders';

interface OrderPrintViewProps {
  order: Order;
}

export function OrderPrintView({ order }: OrderPrintViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const STATUS_LABELS: Record<string, string> = {
    'ativa': 'Ativa',
    'em_analise': 'Em Análise',
    'aprovada': 'Aprovada',
    'em_producao': 'Em Produção',
    'concluida': 'Concluída',
    'entregue': 'Entregue',
    'cancelada': 'Cancelada'
  };

  const PRIORITY_LABELS = {
    1: 'Normal',
    2: 'Alta',
    3: 'Urgente'
  };

  return (
    <div className="print-container bg-white text-black p-8 max-w-4xl mx-auto">
      <style>{`
        @media print {
          .print-container {
            margin: 0;
            padding: 20px;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
        <h1 className="text-3xl font-bold mb-2">ORDEM DE SERVIÇO</h1>
        <h2 className="text-2xl font-semibold text-gray-700">#{order.order_number}</h2>
        <div className="flex justify-center gap-4 mt-4">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
            Status: {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
            Prioridade: {PRIORITY_LABELS[order.priority as keyof typeof PRIORITY_LABELS]}
          </span>
        </div>
      </div>

      {/* Informações Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">DADOS DA ORDEM</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Número da OS:</span>
              <span>{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Data de Criação:</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Última Atualização:</span>
              <span>{formatDate(order.updated_at)}</span>
            </div>
            {order.estimated_delivery && (
              <div className="flex justify-between">
                <span className="font-medium">Previsão de Entrega:</span>
                <span>{format(new Date(order.estimated_delivery), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            )}
            {order.actual_delivery && (
              <div className="flex justify-between">
                <span className="font-medium">Data de Entrega:</span>
                <span>{format(new Date(order.actual_delivery), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            )}
            {order.warranty_months && (
              <div className="flex justify-between">
                <span className="font-medium">Garantia:</span>
                <span>{order.warranty_months} meses</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">DADOS DA COLETA</h3>
          <div className="space-y-2">
            {order.collection_date && (
              <div className="flex justify-between">
                <span className="font-medium">Data da Coleta:</span>
                <span>{format(new Date(order.collection_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            )}
            {order.collection_time && (
              <div className="flex justify-between">
                <span className="font-medium">Hora da Coleta:</span>
                <span>{order.collection_time}</span>
              </div>
            )}
            {order.collection_location && (
              <div className="flex justify-between">
                <span className="font-medium">Local da Coleta:</span>
                <span className="text-right max-w-48">{order.collection_location}</span>
              </div>
            )}
            {order.driver_name && (
              <div className="flex justify-between">
                <span className="font-medium">Motorista:</span>
                <span>{order.driver_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cliente */}
      {order.customer && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">DADOS DO CLIENTE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Nome:</span>
                <span>{order.customer.name}</span>
              </div>
              {order.customer.phone && (
                <div className="flex justify-between">
                  <span className="font-medium">Telefone:</span>
                  <span>{order.customer.phone}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {order.customer.email && (
                <div className="flex justify-between">
                  <span className="font-medium">E-mail:</span>
                  <span>{order.customer.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Consultor */}
      {order.consultant && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">CONSULTOR RESPONSÁVEL</h3>
          <div className="flex justify-between">
            <span className="font-medium">Nome:</span>
            <span>{order.consultant.full_name}</span>
          </div>
        </div>
      )}

      {/* Motor */}
      {order.engine && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">DADOS DO MOTOR</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Tipo:</span>
                <span>{order.engine.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Marca:</span>
                <span>{order.engine.brand}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Modelo:</span>
                <span>{order.engine.model}</span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Materiais */}
      {order.materials && order.materials.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 border-b border-gray-300 pb-2">MATERIAIS UTILIZADOS</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium">Peça</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-medium">Código</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-medium">Qtd</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-medium">Custo Unit.</th>
                  <th className="border border-gray-300 px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.materials.map((material, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2">{material.part_name}</td>
                    <td className="border border-gray-300 px-3 py-2">{material.part_code}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{material.quantity}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(material.unit_cost)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(material.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="border-b border-gray-300 pb-2 mb-4">
              <span className="font-medium">Responsável pela Coleta</span>
            </div>
            <div className="h-16"></div>
            <p className="text-sm text-gray-600">Assinatura</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-300 pb-2 mb-4">
              <span className="font-medium">Cliente</span>
            </div>
            <div className="h-16"></div>
            <p className="text-sm text-gray-600">Assinatura</p>
          </div>
        </div>
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Documento gerado em {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}
