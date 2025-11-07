
import React from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function NotificationsPanel() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: Record<string, unknown>) => {
    if (!notification.is_read) {
      await markAsRead(notification.id as string);
    }

    if (notification.action_url) {
      navigate(notification.action_url as string);
      setOpen(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
          return 'bg-destructive/10 text-destructive border-l-destructive dark:bg-destructive/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 border-l-yellow-500 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'success':
        return 'bg-green-500/10 text-green-700 border-l-green-500 dark:bg-green-500/20 dark:text-green-400';
      default:
        return 'bg-primary/10 text-primary border-l-primary dark:bg-primary/20';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notificações</span>
            {unreadCount > 0 && (
              <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `Você tem ${unreadCount} ${unreadCount === 1 ? 'notificação não lida' : 'notificações não lidas'}`
              : 'Você está em dia com suas notificações'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground">
                Você receberá notificações sobre atualizações importantes aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:bg-accent/50 ${
                    !notification.is_read 
                      ? `${getSeverityColor(notification.severity || 'info')} border-l-4` 
                      : 'bg-muted/50 border-l-muted-foreground/20'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                        )}
                        <h4 className={`font-semibold text-sm line-clamp-1 ${
                          !notification.is_read ? '' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                      </div>
                      <p className={`text-sm line-clamp-2 mb-2 ${
                        !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

