import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { NotificationService, Notification } from '@/services/NotificationService';
import { supabase } from '@/integrations/supabase/client';

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

      const result = await NotificationService.getNotifications({
        orgId: currentOrganization.id,
        userId: userId || undefined,
        includeGlobal: true,
        limit: 50
      });

      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
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
    if (!currentOrganization?.id) return false;

    try {
      await NotificationService.markAsRead(notificationId, currentOrganization.id);

      // Atualizar estado local
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar notificação como lida',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAllAsRead = async () => {
    if (!currentOrganization?.id) return false;

    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const result = await NotificationService.markAllAsRead(
        currentOrganization.id,
        userId || undefined
      );

      toast({
        title: 'Sucesso',
        description: `${result.count} notificações marcadas como lidas`,
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
    if (!currentOrganization?.id) return false;

    try {
      await NotificationService.deleteNotification(notificationId, currentOrganization.id);

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
    if (currentOrganization?.id) {
      const subscription = NotificationService.subscribeToNotifications(
        currentOrganization.id,
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
      );

    return () => {
      subscription.unsubscribe();
    };
    }
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
