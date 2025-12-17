import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";

interface GeneralSettingsTabProps {
  configuracoes: {
    tema_escuro: boolean;
  };
  onConfigChange: (key: string, value: boolean) => void;
}

export function GeneralSettingsTab({ configuracoes, onConfigChange }: GeneralSettingsTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          Configurações Gerais
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Configurações básicas do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="empresa" className="text-sm font-medium">Nome da Empresa</Label>
          <Input
            id="empresa"
            defaultValue="Retífica Formiguense"
            className="h-9 sm:h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endereco" className="text-sm font-medium">Endereço</Label>
          <Input
            id="endereco"
            defaultValue="Rua das Retíficas, 123 - São Paulo/SP"
            className="h-9 sm:h-10"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
            <Input
              id="telefone"
              defaultValue="(11) 1234-5678"
              className="h-9 sm:h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue="contato@retifica.com"
              className="h-9 sm:h-10"
            />
          </div>
        </div>

        <Separator className="my-4 sm:my-6" />

        <div className="space-y-4">
          <h4 className="font-medium text-sm sm:text-base">Preferências do Sistema</h4>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="tema" className="text-sm font-medium">Tema Escuro</Label>
              <p className="text-xs sm:text-sm text-muted-foreground">Usar tema escuro na interface</p>
            </div>
            <Switch
              id="tema"
              checked={configuracoes.tema_escuro}
              onCheckedChange={(checked) => onConfigChange('tema_escuro', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
