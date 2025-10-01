import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { Database } from '@/integrations/supabase/types';

type Notification = Database['public']['Tables']['notifications']['Row'] & {
  notification_type?: Database['public']['Tables']['notification_types']['Row'];
};

export function useNotifications() {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Buscar notificações do usuário + notificações globais da org
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          notification_type:notification_types(*)
        `)
        .eq('org_id', currentOrganization.id)
        .or(`user_id.eq.${userId},is_global.eq.true`)
        .is('expires_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar notificações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const { error, count } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('org_id', currentOrganization?.id || '')
        .or(`user_id.eq.${userId},is_global.eq.true`)
        .eq('is_read', false);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `${count || 0} notificações marcadas como lidas`,
      });

      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar notificações como lidas',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir notificação',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Configurar real-time updates
    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `org_id=eq.${currentOrganization?.id}`,
        },
        (payload) => {
          console.log('Notification change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Nova notificação - adicionar ao topo e mostrar toast
            const newNotification = payload.new as Notification;
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Mostrar toast apenas se for relevante para o usuário
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            });
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new as Notification : n))
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentOrganization?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
