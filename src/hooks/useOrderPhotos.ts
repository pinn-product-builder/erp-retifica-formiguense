import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderPhoto {
  id: string;
  order_id: string;
  component: string | null;
  workflow_step: string | null;
  photo_type: string;
  file_path: string;
  file_name: string;
  description: string | null;
  uploaded_by: string | null;
  created_at: string;
  url?: string;
}

export function useOrderPhotos(orderId?: string) {
  const [photos, setPhotos] = useState<OrderPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPhotos = async (targetOrderId?: string) => {
    const id = targetOrderId || orderId;
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_photos')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Gerar URLs públicas para as fotos
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          try {
            const { data: urlData } = await supabase.storage
              .from('order-photos')
              .createSignedUrl(photo.file_path, 3600); // URL válida por 1 hora

            return {
              ...photo,
              url: urlData?.signedUrl || null
            };
          } catch (error) {
            console.error('Erro ao gerar URL para foto:', error);
            return {
              ...photo,
              url: null
            };
          }
        })
      );

      setPhotos(photosWithUrls);
    } catch (error) {
      console.error('Error fetching order photos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar fotos da ordem de serviço",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (
    file: File, 
    photoType: string, 
    component?: string, 
    workflowStep?: string,
    description?: string
  ): Promise<boolean> => {
    if (!orderId) return false;

    try {
      setLoading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}/${photoType}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('order-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save photo record in database
      const { error } = await supabase
        .from('order_photos')
        .insert({
          order_id: orderId,
          component: component || null,
          workflow_step: workflowStep || null,
          photo_type: photoType,
          file_path: uploadData.path,
          file_name: file.name,
          description: description || null,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Foto enviada com sucesso",
      });

      // Recarregar fotos
      await fetchPhotos();
      return true;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar foto",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Buscar dados da foto
      const { data: photo, error: fetchError } = await supabase
        .from('order_photos')
        .select('file_path')
        .eq('id', photoId)
        .single();

      if (fetchError) throw fetchError;

      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('order-photos')
        .remove([photo.file_path]);

      if (storageError) throw storageError;

      // Deletar registro do banco
      const { error: dbError } = await supabase
        .from('order_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Foto removida com sucesso",
      });

      // Recarregar fotos
      await fetchPhotos();
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover foto",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchPhotos();
    }
  }, [orderId]);

  return {
    photos,
    loading,
    fetchPhotos,
    uploadPhoto,
    deletePhoto
  };
}
