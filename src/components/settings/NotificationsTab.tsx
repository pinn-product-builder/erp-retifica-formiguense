import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";

interface NotificationsTabProps {
  configuracoes: {
    notificacaoEmail: boolean;
    notificacaoSMS: boolean;
  };
  onConfigChange: (key: string, value: boolean) => void;
}

export function NotificationsTab({ configuracoes, onConfigChange }: NotificationsTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          Notificações
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Configure como receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="email-notif" className="text-sm font-medium">Notificações por Email</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">Receber alertas por email</p>
          </div>
          <Switch
            id="email-notif"
            checked={configuracoes.notificacaoEmail}
            onCheckedChange={(checked) => onConfigChange('notificacaoEmail', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="sms-notif" className="text-sm font-medium">Notificações por SMS</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">Receber alertas por SMS</p>
          </div>
          <Switch
            id="sms-notif"
            checked={configuracoes.notificacaoSMS}
            onCheckedChange={(checked) => onConfigChange('notificacaoSMS', checked)}
          />
        </div>

        <Separator className="my-4 sm:py-6" />

        <div className="space-y-4">
          <h4 className="font-medium text-sm sm:text-base">Configurações de Contato</h4>

          <div className="space-y-2">
            <Label htmlFor="email-alerts" className="text-sm font-medium">Email para Alertas</Label>
            <Input
              id="email-alerts"
              type="email"
              defaultValue="admin@retifica.com"
              className="h-9 sm:h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone-alerts" className="text-sm font-medium">Telefone para SMS</Label>
            <Input
              id="telefone-alerts"
              defaultValue="(11) 99999-9999"
              className="h-9 sm:h-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
