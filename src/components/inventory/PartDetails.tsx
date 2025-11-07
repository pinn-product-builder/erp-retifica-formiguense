import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  DollarSign, 
  Calendar, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Tag,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type PartInventory } from "@/hooks/usePartsInventory";

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

interface PartDetailsProps {
  part: PartInventory;
}

export const PartDetails: React.FC<PartDetailsProps> = ({ part }) => {
  const getStatusConfig = (status: string) => {
    const config = {
      disponivel: { 
        icon: CheckCircle, 
        label: 'Disponível', 
        color: 'bg-green-100 text-green-800 border-green-300' 
      },
      reservado: { 
        icon: Clock, 
        label: 'Reservado', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300' 
      },
      usado: { 
        icon: Package, 
        label: 'Usado', 
        color: 'bg-blue-100 text-blue-800 border-blue-300' 
      },
      pendente: { 
        icon: AlertCircle, 
        label: 'Pendente', 
        color: 'bg-gray-100 text-gray-800 border-gray-300' 
      }
    };

    return config[status as keyof typeof config] || config.pendente;
  };

  const getComponentLabel = (component?: string) => {
    const components = {
      bloco: "Bloco",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      pistao: "Pistão",
      biela: "Biela",
      comando: "Comando",
      eixo: "Eixo"
    };
    return component ? components[component as keyof typeof components] || component : 'Não especificado';
  };

  const statusConfig = getStatusConfig(part.status);
  const StatusIcon = statusConfig.icon;
  const totalValue = part.quantity * part.unit_cost;

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <Badge className={`${statusConfig.color} border px-4 py-2`}>
          <StatusIcon className="w-4 h-4 mr-2" />
          {statusConfig.label}
        </Badge>
        {part.quantity < 5 && (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Estoque Baixo
          </Badge>
        )}
      </div>

      {/* Main Info */}
      <div>
        <h3 className="text-2xl font-bold mb-2">{part.part_name}</h3>
        {part.part_code && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="w-4 h-4" />
            <span className="font-mono">{part.part_code}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Quantidade */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>Quantidade</span>
          </div>
          <p className="text-2xl font-bold">{part.quantity}</p>
        </div>

        {/* Valor Unitário */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>Valor Unitário</span>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(part.unit_cost)}
          </p>
        </div>

        {/* Valor Total */}
        <div className="col-span-2 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Valor Total em Estoque</span>
          </div>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Componente */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>Componente</span>
          </div>
          <p className="text-lg font-medium">
            {getComponentLabel(part.component)}
          </p>
        </div>

        {/* Fornecedor */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Fornecedor</span>
          </div>
          <p className="text-lg font-medium">
            {part.supplier || 'Não informado'}
          </p>
        </div>
      </div>

      <Separator />

      {/* Timestamps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Cadastrado em</span>
          </div>
          <span className="font-medium">
            {format(new Date(part.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>

        {part.separated_at && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Separado em</span>
            </div>
            <span className="font-medium">
              {format(new Date(part.separated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        )}

        {part.applied_at && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Aplicado em</span>
            </div>
            <span className="font-medium">
              {format(new Date(part.applied_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        )}
      </div>

      {/* Notes */}
      {part.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Observações</span>
            </div>
            <p className="text-sm bg-muted p-3 rounded-lg">
              {part.notes}
            </p>
          </div>
        </>
      )}

      {/* Order Link */}
      {part.order_id && (
        <>
          <Separator />
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-900">
              <Package className="w-4 h-4" />
              <span>Vinculado à OS</span>
            </div>
            <Badge variant="outline" className="bg-white">
              {part.order_id.slice(0, 8)}...
            </Badge>
          </div>
        </>
      )}
    </div>
  );
};

