
import React from 'react';
import { Bell, Check, CheckCheck, MessageSquare, Trash2 } from 'lucide-react';
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
import { useFinancialNotificationsPanel } from '@/hooks/useFinancialNotificationsPanel';
import { useArDueAlertsPanel } from '@/hooks/useArDueAlertsPanel';
import { ArDueAlertService } from '@/services/financial/arDueAlertService';
import { formatBRL } from '@/lib/financialFormat';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();
  const { items: finItems, count: finUnread, refresh: refreshFin, markRead: markFinRead, markAllRead: markAllFinRead, canShow } =
    useFinancialNotificationsPanel();
  const {
    items: arDueItems,
    count: arDueUnread,
    loading: arDueLoading,
    refresh: refreshArDue,
    markRead: markArDueRead,
    setInNegotiation: setArDueNegotiation,
    markAllRead: markAllArDueRead,
    canShow: canShowArDue,
  } = useArDueAlertsPanel();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const totalUnread = unreadCount + (canShow ? finUnread + arDueUnread : 0);

  React.useEffect(() => {
    if (!open) return;
    void fetchNotifications();
    void refreshFin();
    void refreshArDue();
  }, [open, fetchNotifications, refreshFin, refreshArDue]);

  const handleMarkEverythingRead = async () => {
    await markAllAsRead();
    if (canShow) await markAllFinRead();
    if (canShow && canShowArDue) await markAllArDueRead();
    await fetchNotifications();
    await refreshFin();
    await refreshArDue();
  };

  const handleNotificationClick = async (notification: Record<string, unknown>) => {
    if (!notification.is_read) {
      await markAsRead(notification.id as string);
    }

    if (notification.action_url) {
      navigate(notification.action_url as string);
      setOpen(false);
    }
  };

  const handleFinancialClick = async (id: string, referenceType: string | null) => {
    await markFinRead(id);
    const path =
      referenceType === 'accounts_payable' ? '/contas-pagar?dueAlerts=1' : '/contas-receber?dueAlerts=1';
    navigate(path);
    setOpen(false);
  };

  const arDueCustomerLabel = (row: (typeof arDueItems)[0]) => {
    const c = row.accounts_receivable?.customers;
    if (!c) return '—';
    return c.trade_name?.trim() || c.name || '—';
  };

  const handleArDueNegotiate = async (alertId: string) => {
    await setArDueNegotiation(alertId);
    navigate('/contas-receber?dueAlerts=1');
    setOpen(false);
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

  const emptyGeneral = notifications.length === 0;
  const emptyFin = !canShow || finItems.length === 0;
  const emptyArDue = !canShow || !canShowArDue || arDueItems.length === 0;
  const fullyEmpty = emptyGeneral && emptyFin && emptyArDue && !loading && !arDueLoading;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-xs"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between gap-2">
            <span>Notificações</span>
            {totalUnread > 0 && (
              <Button size="sm" variant="ghost" className="shrink-0" onClick={() => void handleMarkEverythingRead()}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {totalUnread > 0
              ? `Você tem ${totalUnread} ${totalUnread === 1 ? 'notificação não lida' : 'notificações não lidas'}`
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
          ) : fullyEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhuma notificação</h3>
              <p className="text-sm text-muted-foreground">
                Você receberá notificações sobre atualizações importantes aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {canShow && canShowArDue && arDueLoading && arDueItems.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground px-1">Contas a receber — alertas</p>
                  <Skeleton className="h-20" />
                </div>
              )}
              {canShow && canShowArDue && arDueItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground px-1">Contas a receber — alertas</p>
                  <div className="space-y-3">
                    {arDueItems.map((row) => {
                      const ar = row.accounts_receivable;
                      const amt = ar?.amount ?? 0;
                      const due = ar?.due_date;
                      return (
                        <div
                          key={row.id}
                          className={`p-4 rounded-lg border-l-4 ${
                            row.status === 'in_negotiation'
                              ? 'bg-amber-500/10 border-l-amber-500'
                              : 'bg-muted/50 border-l-muted-foreground/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-0.5">
                                {ArDueAlertService.alertTypeLabel(row.alert_type)}
                              </p>
                              <h4 className="font-semibold text-sm line-clamp-1">{arDueCustomerLabel(row)}</h4>
                              <p className="text-xs sm:text-sm tabular-nums whitespace-nowrap mt-1">
                                {formatBRL(amt)}
                                {due
                                  ? ` · venc. ${format(new Date(due), 'dd/MM/yyyy', { locale: ptBR })}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => {
                                void markArDueRead(row.id);
                                navigate('/contas-receber?dueAlerts=1');
                                setOpen(false);
                              }}
                            >
                              Abrir
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 text-xs gap-1"
                              onClick={() => void handleArDueNegotiate(row.id)}
                            >
                              <MessageSquare className="h-3 w-3 shrink-0" />
                              Negociar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs gap-1"
                              onClick={() => void markArDueRead(row.id)}
                            >
                              <Check className="h-3 w-3 shrink-0" />
                              Lido
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {canShow && finItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground px-1">Financeiro</p>
                  <div className="space-y-3">
                    {finItems.map((fn) => (
                      <div
                        key={fn.id}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            void handleFinancialClick(fn.id, fn.reference_type);
                          }
                        }}
                        className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:bg-accent/50 ${
                          !fn.is_read
                            ? 'bg-amber-500/10 text-amber-900 dark:text-amber-100 border-l-amber-500'
                            : 'bg-muted/50 border-l-muted-foreground/20'
                        }`}
                        onClick={() => void handleFinancialClick(fn.id, fn.reference_type)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {!fn.is_read && (
                                <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                              )}
                              <h4 className="font-semibold text-sm line-clamp-1">{fn.title}</h4>
                            </div>
                            <p className="text-sm line-clamp-3 mb-2 text-foreground">{fn.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(fn.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {!fn.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void markFinRead(fn.id);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {notifications.length > 0 && (
                <div className="space-y-2">
                  {canShow && (finItems.length > 0 || (canShowArDue && arDueItems.length > 0)) && (
                    <p className="text-xs font-semibold text-muted-foreground px-1">Geral</p>
                  )}
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
                              <h4
                                className={`font-semibold text-sm line-clamp-1 ${
                                  !notification.is_read ? '' : 'text-muted-foreground'
                                }`}
                              >
                                {notification.title}
                              </h4>
                            </div>
                            <p
                              className={`text-sm line-clamp-2 mb-2 ${
                                !notification.is_read ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
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
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
