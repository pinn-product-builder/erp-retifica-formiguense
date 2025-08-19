import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';

export interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  is_global: boolean;
  action_url?: string;
  created_at: string;
  notification_type: {
    name: string;
    icon: string;
    color: string;
  };
}

export const useNotifications = () => {
  const { currentOrganization } = useOrganization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          message,
          severity,
          is_read,
          is_global,
          action_url,
          created_at,
          notification_types (
            name,
            icon,
            color
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const formattedNotifications: Notification[] = (data || []).map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        severity: notif.severity as 'info' | 'warning' | 'error' | 'success',
        is_read: notif.is_read,
        is_global: notif.is_global,
        action_url: notif.action_url,
        created_at: notif.created_at,
        notification_type: {
          name: notif.notification_types?.name || 'Sistema',
          icon: notif.notification_types?.icon || 'Bell',
          color: notif.notification_types?.color || 'blue',
        },
      }));

      setNotifications(formattedNotifications);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notif => !notif.is_read)
        .map(notif => notif.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(notif => !notif.is_read).length;

  useEffect(() => {
    fetchNotifications();
  }, [currentOrganization]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};