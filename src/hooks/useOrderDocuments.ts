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
      const { data, error } = await supabase
        .from('order_documents')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const documentsWithUrls = await Promise.all(
        (data || []).map(async (document) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('order-documents')
              .createSignedUrl(document.file_path, 3600);

            return {
              ...document,
              url: urlData?.signedUrl || null,
            };
          } catch (err) {
            console.error('Erro ao gerar URL para documento:', err);
            return {
              ...document,
              url: null,
            };
          }
        })
      );

      setDocuments(documentsWithUrls);
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

