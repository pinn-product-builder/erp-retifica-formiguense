import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, Trash2, Download, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { useOrderDocuments } from '@/hooks/useOrderDocuments';

interface OrderDocumentsTabProps {
  orderId: string;
}

const DOCUMENT_TYPES = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'nota', label: 'Nota Fiscal' },
  { value: 'aprovacao_orcamento', label: 'Aprovação de Orçamento' },
  { value: 'outros', label: 'Outros' }
];

const APPROVAL_TYPES = {
  total: 'Aprovação Total',
  partial: 'Aprovação Parcial',
  rejected: 'Rejeitado'
};

const APPROVAL_METHODS = {
  signature: 'Assinatura',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  verbal: 'Verbal'
};

export function OrderDocumentsTab({ orderId }: OrderDocumentsTabProps) {
  const { documents, loading, uploadDocument, deleteDocument } = useOrderDocuments(orderId);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    documentType: '',
    description: ''
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadData(prev => ({ ...prev, file }));
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.documentType) {
      return;
    }

    const success = await uploadDocument(uploadData.file, uploadData.documentType, uploadData.description || undefined);
    if (success) {
      setShowUploadDialog(false);
      setUploadData({
        file: null,
        documentType: '',
        description: ''
      });
    }
  };

  const handleDelete = async (documentId: string, source?: string) => {
    if (source === 'budget_approval') {
      return;
    }
    if (window.confirm('Deseja remover este documento?')) {
      await deleteDocument(documentId);
    }
  };

  const handleDownload = (url?: string | null) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Documentos da Ordem de Serviço</h3>
          <p className="text-sm text-muted-foreground">
            {documents.length} {documents.length === 1 ? 'documento disponível' : 'documentos disponíveis'}
          </p>
        </div>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Documento em PDF</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="documentFile">Arquivo (PDF)</Label>
                <Input
                  id="documentFile"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                />
              </div>

              <div>
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select
                  value={uploadData.documentType}
                  onValueChange={(value) => setUploadData(prev => ({ ...prev, documentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentDescription">Descrição (opcional)</Label>
                <Textarea
                  id="documentDescription"
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o documento..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!uploadData.file || !uploadData.documentType || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ainda não há documentos cadastrados para esta OS.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {documents.map((document) => {
            const isApproval = document.source === 'budget_approval';
            
            return (
              <Card key={document.id} className={isApproval ? 'border-green-200 ' : ''}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isApproval && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      )}
                      <Badge variant={isApproval ? 'default' : 'outline'} className={isApproval ? 'bg-green-600' : ''}>
                        {DOCUMENT_TYPES.find(type => type.value === document.document_type)?.label || document.document_type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(document.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>

                  <p className="font-medium text-sm truncate">{document.file_name}</p>

                  {isApproval && document.approval_info && (
                    <div className="space-y-1 text-xs">
                      {document.approval_info.budget_number && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Orçamento:</span> {document.approval_info.budget_number}
                        </p>
                      )}
                      {document.approval_info.approval_type && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Tipo:</span> {APPROVAL_TYPES[document.approval_info.approval_type as keyof typeof APPROVAL_TYPES] || document.approval_info.approval_type}
                        </p>
                      )}
                      {document.approval_info.approved_by_customer && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Aprovado por:</span> {document.approval_info.approved_by_customer}
                        </p>
                      )}
                    </div>
                  )}

                  {!isApproval && document.description && (
                    <p className="text-xs text-muted-foreground">{document.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(document.url)}
                      disabled={!document.url}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                    {!isApproval && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(document.id, document.source)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

