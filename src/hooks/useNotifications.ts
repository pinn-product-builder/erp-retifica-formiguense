import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { NotificationService, Notification } from '@/services/NotificationService';
import { supabase } from '@/integrations/supabase/client';

export function useNotifications() {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const result = await NotificationService.getNotifications({
        orgId,
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
  }, [orgId, toast]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!orgId) return false;

      try {
        await NotificationService.markAsRead(notificationId, orgId);

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
    },
    [orgId, toast]
  );

  const markAllAsRead = useCallback(async () => {
    if (!orgId) return false;

    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const result = await NotificationService.markAllAsRead(orgId, userId || undefined);

      toast({
        title: 'Sucesso',
        description: `${result.count} notificações marcadas como lidas`,
      });

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
  }, [orgId, toast]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!orgId) return false;

      try {
        await NotificationService.deleteNotification(notificationId, orgId);

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
    },
    [orgId, toast]
  );

  useEffect(() => {
    void fetchNotifications();

    if (!orgId) {
      return;
    }

    const subscription = NotificationService.subscribeToNotifications(orgId, (payload) => {
      console.log('Notification change:', payload);

      if (payload.eventType === 'INSERT') {
        const newNotification = payload.new as Notification;

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        toast({
          title: newNotification.title,
          description: newNotification.message,
          duration: 5000,
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setNotifications(prev =>
          prev.map(n => (n.id === payload.new!.id ? (payload.new as Notification) : n))
        );
      } else if (payload.eventType === 'DELETE' && payload.old) {
        setNotifications(prev => prev.filter(n => n.id !== payload.old!.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [orgId, fetchNotifications, toast]);

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
