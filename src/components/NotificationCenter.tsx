
import React, { useState } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'urgent',
      title: 'Orçamento Vencendo',
      message: 'RF-2024-001 vence em 2 horas',
      timestamp: new Date(Date.now() - 5 * 60000),
      read: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Estoque Baixo',
      message: 'Pistão VW 1.0 com apenas 3 unidades',
      timestamp: new Date(Date.now() - 15 * 60000),
      read: false
    },
    {
      id: '3',
      type: 'success',
      title: 'Serviço Concluído',
      message: 'RF-2024-003 finalizado com sucesso',
      timestamp: new Date(Date.now() - 30 * 60000),
      read: true
    },
    {
      id: '4',
      type: 'info',
      title: 'Novo Cliente',
      message: 'Pedro Costa cadastrado no sistema',
      timestamp: new Date(Date.now() - 60 * 60000),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'urgent': return AlertTriangle;
      case 'info': 
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-success border-l-success bg-success/5';
      case 'warning': return 'text-warning border-l-warning bg-warning/5';
      case 'urgent': return 'text-destructive border-l-destructive bg-destructive/5';
      case 'info': 
      default: return 'text-info border-l-info bg-info/5';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return `${Math.floor(diff / 86400000)}d atrás`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-16 right-4 w-96 z-40"
    >
      <Card className="shadow-2xl border-border/50 max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <span>Notificações</span>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Marcar todas como lidas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 border-l-4 border-b border-border/30 cursor-pointer transition-colors hover:bg-muted/20 ${
                        getNotificationColor(notification.type)
                      } ${!notification.read ? 'bg-opacity-10' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0 hover:bg-destructive/20"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className={`text-sm ${
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
