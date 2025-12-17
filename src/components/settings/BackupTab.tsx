import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Database } from "lucide-react";

interface BackupTabProps {
  configuracoes: {
    backup_automatico: boolean;
  };
  onConfigChange: (key: string, value: boolean) => void;
}

export function BackupTab({ configuracoes, onConfigChange }: BackupTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Database className="w-4 h-4 sm:w-5 sm:h-5" />
          Backup e Segurança
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Configurações de backup e segurança dos dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="backup-auto" className="text-sm font-medium">Backup Automático</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">Backup diário às 02:00</p>
          </div>
          <Switch
            id="backup-auto"
            checked={configuracoes.backup_automatico}
            onCheckedChange={(checked) => onConfigChange('backup_automatico', checked)}
          />
        </div>

        <Separator className="my-4 sm:my-6" />

        <div className="space-y-4">
          <h4 className="font-medium text-sm sm:text-base">Ações de Backup</h4>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <Button variant="outline" className="flex-1 h-9 sm:h-10">
              Fazer Backup Agora
            </Button>
            <Button variant="outline" className="flex-1 h-9 sm:h-10">
              Restaurar Backup
            </Button>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
          <p>Último backup: 20/01/2024 às 02:15</p>
          <p>Próximo backup: 21/01/2024 às 02:00</p>
        </div>
      </CardContent>
    </Card>
  );
}
