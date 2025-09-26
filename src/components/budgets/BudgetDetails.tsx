import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  DollarSign,
  Clock,
  Wrench,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Copy
} from "lucide-react";
import { type DetailedBudget } from "@/hooks/useDetailedBudgets";

interface BudgetDetailsProps {
  budget: DetailedBudget;
  onDuplicate?: () => void;
  onGeneratePDF?: () => void;
}

const BudgetDetails = ({ budget, onDuplicate, onGeneratePDF }: BudgetDetailsProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partially_approved': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return "bg-green-100 text-green-800";
      case 'partially_approved': return "bg-yellow-100 text-yellow-800";
      case 'rejected': return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return "Aprovado";
      case 'partially_approved': return "Parcialmente Aprovado";
      case 'rejected': return "Rejeitado";
      case 'draft': return "Rascunho";
      default: return "Pendente";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6" />
            <h2 className="text-2xl font-bold">
              {budget.budget_number || `Orçamento #${budget.id.slice(-6)}`}
            </h2>
            {getStatusIcon(budget.status)}
            <Badge className={getStatusColor(budget.status)}>
              {getStatusText(budget.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Ordem: {budget.order?.order_number} | Componente: {budget.component}
          </p>
        </div>
        
        <div className="flex gap-2">
          {onDuplicate && (
            <Button variant="outline" onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </Button>
          )}
          {onGeneratePDF && (
            <Button variant="outline" onClick={onGeneratePDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Cliente e Ordem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{budget.order?.customer.name}</p>
              <p className="text-sm text-muted-foreground">{budget.order?.customer.document}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                {budget.order?.customer.phone}
              </div>
              {budget.order?.customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  {budget.order?.customer.email}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Ordem de Serviço</p>
              <p className="font-medium">{budget.order?.order_number}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Componente</p>
              <Badge variant="outline">{budget.component}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mão de Obra</span>
                <span className="font-medium">
                  R$ {budget.labor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {budget.labor_hours}h × R$ {budget.labor_rate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Peças</span>
                <span className="font-medium">
                  R$ {budget.parts_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  R$ {(budget.labor_total + budget.parts_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {budget.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Desconto</span>
                  <span>
                    -R$ {budget.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {budget.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Impostos ({budget.tax_percentage}%)
                  </span>
                  <span className="font-medium">
                    R$ {budget.tax_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  R$ {budget.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Data de Criação</p>
              <p className="font-medium">
                {new Date(budget.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
              <p className="font-medium">{budget.estimated_delivery_days} dias úteis</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Garantia</p>
              <p className="font-medium">{budget.warranty_months} meses</p>
            </div>

            {budget.approvals && budget.approvals.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Última Aprovação</p>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {budget.approvals[0].approved_by_customer}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(budget.approvals[0].approved_at).toLocaleDateString('pt-BR')}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {budget.approvals[0].approval_method}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Serviços */}
      {budget.services && budget.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Serviços ({budget.services.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budget.services.map((service: any, index: number) => (
                <div key={index} className="flex justify-between items-start p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{service.name}</h4>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{service.labor_hours || 0}h</span>
                      <span>R$ {(service.labor_rate || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {(service.total || service.labor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peças */}
      {budget.parts && budget.parts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Peças ({budget.parts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budget.parts.map((part: any, index: number) => (
                <div key={index} className="flex justify-between items-start p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{part.name}</h4>
                    {part.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {part.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Qtd: {part.quantity || 1}</span>
                      <span>R$ {(part.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {(part.total || (part.quantity * part.unit_price) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Aprovações */}
      {budget.approvals && budget.approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Aprovações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budget.approvals.map((approval, index) => (
                <div key={approval.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="mt-1">
                    {getStatusIcon(approval.approval_type === 'total' ? 'approved' : 
                                  approval.approval_type === 'partial' ? 'partially_approved' : 'rejected')}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{approval.approved_by_customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {approval.approval_type === 'total' ? 'Aprovação Total' :
                           approval.approval_type === 'partial' ? 'Aprovação Parcial' : 'Rejeitado'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{new Date(approval.approved_at).toLocaleDateString('pt-BR')}</p>
                        <Badge variant="outline" className="text-xs">
                          {approval.approval_method}
                        </Badge>
                      </div>
                    </div>
                    {approval.approved_amount && (
                      <p className="text-sm font-medium mt-1">
                        Valor: R$ {approval.approved_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {approval.approval_notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {approval.approval_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetDetails;