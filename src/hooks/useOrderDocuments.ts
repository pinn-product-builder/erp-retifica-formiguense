// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderDocument {
  id: string;
  order_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  url?: string | null;
  source?: 'order_documents' | 'budget_approval';
  approval_info?: {
    budget_number?: string;
    approval_type?: string;
    approved_by_customer?: string;
    approved_at?: string;
  };
}

export function useOrderDocuments(orderId?: string) {
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = async (targetOrderId?: string) => {
    const id = targetOrderId || orderId;
    if (!id) return;

    setLoading(true);
    try {
      const { data: orderDocs, error: orderDocsError } = await supabase
        .from('order_documents')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (orderDocsError) throw orderDocsError;

      const { data: budgets } = await supabase
        .from('detailed_budgets')
        .select('id')
        .eq('order_id', id);

      const budgetIds = budgets?.map(b => b.id) || [];

      let budgetApprovals: any[] = [];
      if (budgetIds.length > 0) {
        const { data: approvals, error: approvalsError } = await supabase
          .from('budget_approvals')
          .select(`
            id,
            approval_type,
            approval_method,
            approval_document,
            approved_by_customer,
            approved_at,
            budget_id,
            budgets:budget_id (
              budget_number
            )
          `)
          .in('budget_id', budgetIds)
          .not('approval_document', 'is', null)
          .order('approved_at', { ascending: false });

        if (approvalsError) {
          console.error('Erro ao buscar aprovações:', approvalsError);
        } else {
          budgetApprovals = approvals || [];
        }
      }


      const orderDocsWithUrls = await Promise.all(
        (orderDocs || []).map(async (document) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('order-documents')
              .createSignedUrl(document.file_path, 3600);

            return {
              ...document,
              url: urlData?.signedUrl || null,
              source: 'order_documents' as const,
            };
          } catch (err) {
            console.error('Erro ao gerar URL para documento:', err);
            return {
              ...document,
              url: null,
              source: 'order_documents' as const,
            };
          }
        })
      );

      const approvalDocs = await Promise.all(
        (budgetApprovals || []).map(async (approval: any) => {
          const approvalDoc = approval.approval_document as any;
          if (!approvalDoc?.file_path) return null;

          try {
            const { data: urlData } = await supabase.storage
              .from('reports')
              .createSignedUrl(approvalDoc.file_path, 3600);

            return {
              id: `approval_${approval.id}`,
              order_id: id,
              document_type: 'aprovacao_orcamento',
              file_path: approvalDoc.file_path,
              file_name: approvalDoc.file_name || 'Documento de Aprovação',
              description: `Aprovação de orçamento - ${approval.approval_method}`,
              uploaded_by: null,
              created_at: approval.approved_at,
              url: urlData?.signedUrl || null,
              source: 'budget_approval' as const,
              approval_info: {
                budget_number: approval.budgets?.budget_number,
                approval_type: approval.approval_type,
                approved_by_customer: approval.approved_by_customer,
                approved_at: approval.approved_at,
              },
            };
          } catch (err) {
            console.error('Erro ao gerar URL para documento de aprovação:', err);
            return null;
          }
        })
      );

      const validApprovalDocs = approvalDocs.filter((doc): doc is OrderDocument => doc !== null);
      const allDocuments = [...orderDocsWithUrls, ...validApprovalDocs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setDocuments(allDocuments);
    } catch (err) {
      console.error('Erro ao buscar documentos da OS:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os documentos da OS.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, documentType: string, description?: string) => {
    if (!orderId) return false;
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Formato inválido',
        description: 'Envie apenas arquivos PDF.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setLoading(true);

      const fileName = `${orderId}/${documentType}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error } = await supabase.from('order_documents').insert({
        order_id: orderId,
        document_type: documentType,
        file_path: uploadData.path,
        file_name: file.name,
        description: description || null,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || null,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso.',
      });

      await fetchDocuments();
      return true;
    } catch (err) {
      console.error('Erro ao subir documento:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o documento.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      setLoading(true);

      const { data: document, error: fetchError } = await supabase
        .from('order_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      const { error: storageError } = await supabase.storage
        .from('order-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from('order_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Sucesso',
        description: 'Documento removido com sucesso.',
      });

      await fetchDocuments();
      return true;
    } catch (err) {
      console.error('Erro ao remover documento:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o documento.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchDocuments();
    }
  }, [orderId]);

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
  };
}

