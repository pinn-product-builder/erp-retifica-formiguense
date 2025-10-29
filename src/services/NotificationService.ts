import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Notification = Database['public']['Tables']['notifications']['Row'] & {
  notification_type?: Database['public']['Tables']['notification_types']['Row'];
};

interface NotificationChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Notification;
  old?: Notification;
}

export interface NotificationSearchParams {
  orgId: string;
  userId?: string;
  includeGlobal?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationSearchResult {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}

export class NotificationService {
  /**
   * Busca notificações do usuário
   */
  static async getNotifications(params: NotificationSearchParams): Promise<NotificationSearchResult> {
    const {
      orgId,
      userId,
      includeGlobal = true,
      limit = 50,
      offset = 0
    } = params;

    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          notification_type:notification_types(*)
        `, { count: 'exact' })
        .eq('org_id', orgId)
        .is('expires_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filtrar por usuário ou notificações globais
      if (userId && includeGlobal) {
        query = query.or(`user_id.eq.${userId},is_global.eq.true`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (includeGlobal) {
        query = query.eq('is_global', true);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        throw new Error(`Erro ao buscar notificações: ${error.message}`);
      }

      const notifications = (data as unknown as Notification[]) || [];
      const unreadCount = notifications.filter(n => !n.is_read).length;

      return {
        notifications,
        totalCount: count || 0,
        unreadCount
      };

    } catch (error) {
      console.error('Erro no NotificationService.getNotifications:', error);
      throw error;
    }
  }

  /**
   * Marca uma notificação específica como lida
   */
  static async markAsRead(notificationId: string, orgId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('org_id', orgId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        throw new Error(`Erro ao marcar notificação como lida: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erro no NotificationService.markAsRead:', error);
      throw error;
    }
  }

  /**
   * Marca todas as notificações não lidas como lidas
   */
  static async markAllAsRead(orgId: string, userId?: string): Promise<{ success: boolean; count: number }> {
    try {
      let query = supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('org_id', orgId)
        .eq('is_read', false);

      // Filtrar por usuário ou notificações globais
      if (userId) {
        query = query.or(`user_id.eq.${userId},is_global.eq.true`);
      } else {
        query = query.eq('is_global', true);
      }

      const { error, count } = await query;

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        throw new Error(`Erro ao marcar todas as notificações como lidas: ${error.message}`);
      }

      return {
        success: true,
        count: count || 0
      };
    } catch (error) {
      console.error('Erro no NotificationService.markAllAsRead:', error);
      throw error;
    }
  }

  /**
   * Exclui uma notificação
   */
  static async deleteNotification(notificationId: string, orgId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('org_id', orgId);

      if (error) {
        console.error('Erro ao excluir notificação:', error);
        throw new Error(`Erro ao excluir notificação: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erro no NotificationService.deleteNotification:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova notificação
   */
  static async createNotification(notification: {
    orgId: string;
    userId?: string;
    notificationTypeId: string;
    title: string;
    message: string;
    severity?: 'info' | 'success' | 'warning' | 'error';
    isGlobal?: boolean;
    actionUrl?: string;
    metadata?: Database['public']['Tables']['notifications']['Row']['metadata'];
    expiresAt?: string;
  }): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          org_id: notification.orgId,
          user_id: notification.userId || null,
          notification_type_id: notification.notificationTypeId,
          title: notification.title,
          message: notification.message,
          severity: notification.severity || 'info',
          is_global: notification.isGlobal || false,
          action_url: notification.actionUrl || null,
          metadata: notification.metadata || {},
          expires_at: notification.expiresAt || null
        })
        .select(`
          *,
          notification_type:notification_types(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao criar notificação:', error);
        throw new Error(`Erro ao criar notificação: ${error.message}`);
      }

      return data as unknown as Notification;
    } catch (error) {
      console.error('Erro no NotificationService.createNotification:', error);
      throw error;
    }
  }

  /**
   * Configura subscription para real-time updates
   */
  static subscribeToNotifications(
    orgId: string,
    onNotificationChange: (payload: NotificationChangePayload) => void
  ) {
    return supabase
      .channel('notifications_changes')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `org_id=eq.${orgId}`,
        },
        onNotificationChange
      )
      .subscribe();
  }
}
