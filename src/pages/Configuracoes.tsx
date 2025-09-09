
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Shield, Database, Bell, Mail, Cog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SystemConfigAdmin } from "@/components/admin/SystemConfigAdmin";

const Configuracoes = () => {
  const { toast } = useToast();
  const [configuracoes, setConfiguracoes] = useState({
    notificacaoEmail: true,
    notificacaoSMS: false,
    backup_automatico: true,
    relatorio_automatico: false,
    tema_escuro: false
  });

  const salvarConfiguracoes = () => {
    // Aqui seria implementada a lógica de salvamento
    toast({
      title: "Configurações salvas!",
      description: "Suas preferências foram atualizadas com sucesso."
    });
  };

  const handleConfigChange = (key: string, value: boolean) => {
    setConfiguracoes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema e preferências</p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>
              Configurações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="empresa">Nome da Empresa</Label>
              <Input id="empresa" defaultValue="Retífica Formiguense" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input id="endereco" defaultValue="Rua das Retíficas, 123 - São Paulo/SP" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" defaultValue="(11) 1234-5678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="contato@retifica.com" />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Preferências do Sistema</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="tema">Tema Escuro</Label>
                  <p className="text-sm text-muted-foreground">Usar tema escuro na interface</p>
                </div>
                <Switch 
                  id="tema"
                  checked={configuracoes.tema_escuro}
                  onCheckedChange={(checked) => handleConfigChange('tema_escuro', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notif">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Receber alertas por email</p>
              </div>
              <Switch 
                id="email-notif"
                checked={configuracoes.notificacaoEmail}
                onCheckedChange={(checked) => handleConfigChange('notificacaoEmail', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-notif">Notificações por SMS</Label>
                <p className="text-sm text-muted-foreground">Receber alertas por SMS</p>
              </div>
              <Switch 
                id="sms-notif"
                checked={configuracoes.notificacaoSMS}
                onCheckedChange={(checked) => handleConfigChange('notificacaoSMS', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="email-alerts">Email para Alertas</Label>
              <Input id="email-alerts" type="email" defaultValue="admin@retifica.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone-alerts">Telefone para SMS</Label>
              <Input id="telefone-alerts" defaultValue="(11) 99999-9999" />
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup e Segurança
            </CardTitle>
            <CardDescription>
              Configurações de backup e segurança dos dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="backup-auto">Backup Automático</Label>
                <p className="text-sm text-muted-foreground">Backup diário às 02:00</p>
              </div>
              <Switch 
                id="backup-auto"
                checked={configuracoes.backup_automatico}
                onCheckedChange={(checked) => handleConfigChange('backup_automatico', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Ações de Backup</h4>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Fazer Backup Agora
                </Button>
                <Button variant="outline" className="flex-1">
                  Restaurar Backup
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Último backup: 20/01/2024 às 02:15</p>
              <p>Próximo backup: 21/01/2024 às 02:00</p>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Relatórios Automáticos
            </CardTitle>
            <CardDescription>
              Configure o envio automático de relatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="relatorio-auto">Relatórios Mensais</Label>
                <p className="text-sm text-muted-foreground">Enviar relatório mensal por email</p>
              </div>
              <Switch 
                id="relatorio-auto"
                checked={configuracoes.relatorio_automatico}
                onCheckedChange={(checked) => handleConfigChange('relatorio_automatico', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dia-envio">Dia do Envio</Label>
              <Input id="dia-envio" type="number" min="1" max="28" defaultValue="1" />
              <p className="text-sm text-muted-foreground">Dia do mês para envio (1-28)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emails-relatorio">Emails para Envio</Label>
              <Input id="emails-relatorio" defaultValue="admin@retifica.com, gerente@retifica.com" />
              <p className="text-sm text-muted-foreground">Separar emails com vírgula</p>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="w-5 h-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Gerencie configurações dinâmicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemConfigAdmin />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <Button onClick={salvarConfiguracoes} size="lg">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
