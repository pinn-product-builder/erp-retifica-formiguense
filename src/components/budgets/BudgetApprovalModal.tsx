import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Smartphone,
  Mail,
  FileSignature,
  MessageCircle
} from "lucide-react";
import { useDetailedBudgets, type DetailedBudget } from "@/hooks/useDetailedBudgets";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

const approvalSchema = z.object({
  approval_type: z.enum(['total', 'partial', 'rejected'], {
    required_error: "Tipo de aprovação é obrigatório",
    invalid_type_error: "Selecione um tipo de aprovação válido"
  }),
  approval_method: z.enum(['signature', 'whatsapp', 'email', 'verbal'], {
    required_error: "Método de aprovação é obrigatório",
    invalid_type_error: "Selecione um método de aprovação válido"
  }),
  approved_by_customer: z.string()
    .min(1, "Nome do aprovador é obrigatório")
    .max(100, "Nome muito longo (máximo 100 caracteres)"),
  approval_notes: z.string()
    .max(500, "Observações muito longas (máximo 500 caracteres)")
    .optional(),
  customer_signature: z.string().optional()
});

interface BudgetApprovalModalProps {
  budget: DetailedBudget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprovalCreated: (approval: unknown) => void;
}

const BudgetApprovalModal = ({ 
  budget, 
  open, 
  onOpenChange, 
  onApprovalCreated 
}: BudgetApprovalModalProps) => {
  const { approveBudget, loading } = useDetailedBudgets();
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  
  const [formData, setFormData] = useState({
    approval_type: '',
    approval_method: '',
    approved_by_customer: '',
    approval_notes: '',
    customer_signature: '',
    approved_services: [] as string[],
    approved_parts: [] as string[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [approvalDocument, setApprovalDocument] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');

  // Preencher automaticamente o nome do cliente quando o orçamento for carregado
  useEffect(() => {
    if (budget?.order?.customer?.name) {
      setFormData(prev => ({
        ...prev,
        approved_by_customer: budget.order.customer.name
      }));
    }
  }, [budget?.order?.customer?.name]);

  if (!budget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFileError('');

    try {
      // Validar formulário
      const validatedData = approvalSchema.parse(formData);
      
      // Validar upload de imagem obrigatório
      if (!approvalDocument) {
        setFileError("Upload de imagem é obrigatório para aprovação");
        toast({
          title: "Erro de validação",
          description: "É necessário anexar uma imagem comprobatória da aprovação",
          variant: "destructive"
        });
        return;
      }

      // Validar formato de arquivo (apenas JPEG, JPG, PNG)
      const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedFormats.includes(approvalDocument.type)) {
        setFileError("Formato não aceito. Apenas JPEG, JPG e PNG são permitidos");
        toast({
          title: "Formato inválido",
          description: "Por favor, envie apenas imagens nos formatos JPEG, JPG ou PNG",
          variant: "destructive"
        });
        return;
      }
      
      // Para aprovação parcial, validar seleções
      if (formData.approval_type === 'partial') {
        if (formData.approved_services.length === 0 && formData.approved_parts.length === 0) {
          toast({
            title: "Erro de validação",
            description: "Para aprovação parcial, selecione pelo menos um serviço ou peça",
            variant: "destructive"
          });
          return;
        }
      }

      // Calcular valor aprovado
      let approvedAmount = 0;
      if (formData.approval_type === 'total') {
        approvedAmount = budget.total_amount;
      } else if (formData.approval_type === 'partial') {
        const selectedServices = budget.services.filter((_, index) => 
          formData.approved_services.includes(index.toString())
        );
        const selectedParts = budget.parts.filter((_, index) => 
          formData.approved_parts.includes(index.toString())
        );
        
        approvedAmount = [
          ...selectedServices.map(s => (s as { total?: number }).total || 0),
          ...selectedParts.map(p => (p as { total?: number }).total || 0)
        ].reduce((sum: number, value: number) => sum + value, 0);
      }

      // Upload do documento (agora obrigatório)
      let documentData = null;
      if (approvalDocument && currentOrganization) {
        const fileExt = approvalDocument.name.split('.').pop();
        const fileName = `${currentOrganization.id}/approval_${budget.id}_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(fileName, approvalDocument, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          
          // Traduzir mensagens de erro do Supabase
          const errorMessage = "Erro ao fazer upload da imagem. Tente novamente.";
          let errorDescription = "Não foi possível fazer upload da imagem. Verifique o arquivo e tente novamente.";
          
          if (uploadError.message) {
            const errorTranslations: Record<string, string> = {
              'mime type': 'tipo de arquivo',
              'not supported': 'não suportado',
              'file size': 'tamanho do arquivo',
              'too large': 'muito grande',
              'invalid': 'inválido',
              'unauthorized': 'não autorizado',
              'forbidden': 'acesso negado'
            };
            
            let translatedError = uploadError.message.toLowerCase();
            Object.entries(errorTranslations).forEach(([english, portuguese]) => {
              translatedError = translatedError.replace(english, portuguese);
            });
            
            if (translatedError !== uploadError.message.toLowerCase()) {
              errorDescription = `Erro: ${translatedError}`;
            }
          }
          
          setFileError(errorMessage);
          toast({
            title: "Erro no upload",
            description: errorDescription,
            variant: "destructive"
          });
          return;
        }
        
        documentData = {
          file_path: uploadData.path,
          file_name: approvalDocument.name,
          file_size: approvalDocument.size,
          file_type: approvalDocument.type,
          uploaded_at: new Date().toISOString()
        };
      }

      const approvalData = {
        budget_id: budget.id,
        ...validatedData,
        approved_amount: approvedAmount,
        approved_services: formData.approval_type === 'partial' ? 
          formData.approved_services.map(index => budget.services[parseInt(index)]) : 
          budget.services,
        approved_parts: formData.approval_type === 'partial' ? 
          formData.approved_parts.map(index => budget.parts[parseInt(index)]) : 
          budget.parts,
        approval_document: documentData
      };

      const result = await approveBudget(approvalData);
      if (result) {
        onApprovalCreated(result);
        handleOpenChange(false); // Usar handleOpenChange que já reseta o formulário
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            // Traduzir mensagens de erro que possam vir em inglês
            let message = err.message;
            
            // Traduções de mensagens comuns do Zod
            const translations: Record<string, string> = {
              'Required': 'Obrigatório',
              'Invalid': 'Inválido',
              'String must contain at least 1 character(s)': 'Campo obrigatório',
              'Invalid enum value': 'Valor inválido',
              'Expected string, received undefined': 'Campo obrigatório'
            };
            
            // Verificar se a mensagem precisa ser traduzida
            Object.entries(translations).forEach(([english, portuguese]) => {
              if (message.includes(english)) {
                message = message.replace(english, portuguese);
              }
            });
            
            fieldErrors[err.path[0]] = message;
          }
        });
        setErrors(fieldErrors);
      } else {
        // Erro genérico
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao processar a aprovação. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      approval_type: '',
      approval_method: '',
      approved_by_customer: '',
      approval_notes: '',
      customer_signature: '',
      approved_services: [],
      approved_parts: []
    });
    setErrors({});
    setApprovalDocument(null);
    setFileError('');
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetForm(); // Resetar formulário quando fechar
    }
  };

  const getApprovalTypeIcon = (type: string) => {
    switch (type) {
      case 'total': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'whatsapp': return <Smartphone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'signature': return <FileSignature className="w-4 h-4" />;
      case 'verbal': return <MessageCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Processar Aprovação do Orçamento
          </DialogTitle>
          <DialogDescription>
            Registre a aprovação do cliente para o orçamento {budget.budget_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumo do Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Cliente</Label>
                  <p className="font-medium">{budget.order?.customer.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Ordem</Label>
                  <p className="font-medium">{budget.order?.order_number}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Componente</Label>
                  <Badge variant="outline">{budget.component}</Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Valor Total</Label>
                  <p className="font-medium text-lg whitespace-nowrap">
                    R$ {budget.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Aprovação */}
          <div className="space-y-2">
            <Label>Tipo de Aprovação *</Label>
            <Select 
              value={formData.approval_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, approval_type: value }))}
            >
              <SelectTrigger className={errors.approval_type ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione o tipo de aprovação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">
                  <div className="flex items-center gap-2">
                    {getApprovalTypeIcon('total')}
                    Aprovação Total
                  </div>
                </SelectItem>
                <SelectItem value="partial">
                  <div className="flex items-center gap-2">
                    {getApprovalTypeIcon('partial')}
                    Aprovação Parcial
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center gap-2">
                    {getApprovalTypeIcon('rejected')}
                    Rejeitado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.approval_type && (
              <p className="text-sm text-red-500">{errors.approval_type}</p>
            )}
          </div>

          {/* Seleção de Itens (apenas para aprovação parcial) */}
          {formData.approval_type === 'partial' && (
            <div className="space-y-4">
              {budget.services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Serviços Aprovados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {budget.services.map((service: { name: string; total?: number }, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.approved_services.includes(index.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                approved_services: [...prev.approved_services, index.toString()]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                approved_services: prev.approved_services.filter(i => i !== index.toString())
                              }));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {(service.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {budget.parts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Peças Aprovadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {budget.parts.map((part: { name: string; quantity: number; total?: number }, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.approved_parts.includes(index.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                approved_parts: [...prev.approved_parts, index.toString()]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                approved_parts: prev.approved_parts.filter(i => i !== index.toString())
                              }));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{part.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qtd: {part.quantity} - R$ {(part.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Método de Aprovação */}
            <div className="space-y-2">
              <Label>Método de Aprovação *</Label>
              <Select 
                value={formData.approval_method} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, approval_method: value }))}
              >
                <SelectTrigger className={errors.approval_method ? "border-red-500" : ""}>
                  <SelectValue placeholder="Como foi aprovado?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      {getMethodIcon('whatsapp')}
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      {getMethodIcon('email')}
                      E-mail
                    </div>
                  </SelectItem>
                  <SelectItem value="signature">
                    <div className="flex items-center gap-2">
                      {getMethodIcon('signature')}
                      Assinatura Física
                    </div>
                  </SelectItem>
                  <SelectItem value="verbal">
                    <div className="flex items-center gap-2">
                      {getMethodIcon('verbal')}
                      Confirmação Verbal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.approval_method && (
                <p className="text-sm text-red-500">{errors.approval_method}</p>
              )}
            </div>

            {/* Nome do Aprovador */}
            <div className="space-y-2">
              <Label>Aprovado por (Cliente) *</Label>
              <Input
                placeholder="Nome completo do cliente"
                value={formData.approved_by_customer}
                disabled
                className="bg-background border-input text-foreground cursor-not-allowed opacity-100"
              />
              <p className="text-xs text-muted-foreground">
                Nome preenchido automaticamente com base na ordem de serviço
              </p>
            </div>
          </div>

          {/* Upload de Documento */}
          <div className="space-y-2">
            <Label>Imagem Comprobatória *</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setApprovalDocument(file);
                  setFileError('');
                  
                  // Validar formato imediatamente
                  if (file) {
                    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
                    if (!allowedFormats.includes(file.type)) {
                      setFileError("Formato não aceito. Apenas JPEG, JPG e PNG são permitidos");
                      setApprovalDocument(null);
                      e.target.value = '';
                    }
                  }
                }}
                className={`flex-1 ${fileError ? 'border-red-500' : ''}`}
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
            {fileError && (
              <p className="text-sm text-red-500">{fileError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              <strong>Obrigatório:</strong> Anexe print do WhatsApp, e-mail, foto da assinatura ou outro comprovante em formato JPEG, JPG ou PNG
            </p>
            {approvalDocument && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Arquivo selecionado: {approvalDocument.name}
                </span>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações da Aprovação</Label>
            <Textarea
              placeholder="Detalhes adicionais sobre a aprovação..."
              value={formData.approval_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, approval_notes: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Processando...' : 'Confirmar Aprovação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetApprovalModal;