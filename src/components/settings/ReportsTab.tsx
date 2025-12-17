import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";

interface ReportsTabProps {
  configuracoes: {
    relatorio_automatico: boolean;
  };
  onConfigChange: (key: string, value: boolean) => void;
}

export function ReportsTab({ configuracoes, onConfigChange }: ReportsTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
          Relatórios Automáticos
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Configure o envio automático de relatórios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="relatorio-auto" className="text-sm font-medium">Relatórios Mensais</Label>
            <p className="text-xs sm:text-sm text-muted-foreground">Enviar relatório mensal por email</p>
          </div>
          <Switch
            id="relatorio-auto"
            checked={configuracoes.relatorio_automatico}
            onCheckedChange={(checked) => onConfigChange('relatorio_automatico', checked)}
          />
        </div>

        <Separator className="my-4 sm:my-6" />

        <div className="space-y-4">
          <h4 className="font-medium text-sm sm:text-base">Configurações de Envio</h4>

          <div className="space-y-2">
            <Label htmlFor="dia-envio" className="text-sm font-medium">Dia do Envio</Label>
            <Input
              id="dia-envio"
              type="number"
              min="1"
              max="28"
              defaultValue="1"
              className="h-9 sm:h-10"
            />
            <p className="text-xs sm:text-sm text-muted-foreground">Dia do mês para envio (1-28)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emails-relatorio" className="text-sm font-medium">Emails para Envio</Label>
            <Input
              id="emails-relatorio"
              defaultValue="admin@retifica.com, gerente@retifica.com"
              className="h-9 sm:h-10"
            />
            <p className="text-xs sm:text-sm text-muted-foreground">Separar emails com vírgula</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
