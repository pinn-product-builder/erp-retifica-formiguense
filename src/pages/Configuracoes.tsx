
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Shield, Database, Bell, Mail, Cog, Wrench, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SystemConfigAdmin from "@/components/admin/SystemConfigAdmin";
import { EngineTypesConfig } from "@/components/operations/EngineTypesConfig";
import { WorkflowStatusConfigAdmin } from "@/components/admin/WorkflowStatusConfigAdmin";
import DiagnosticChecklistsConfig from "@/components/operations/DiagnosticChecklistsConfig";
import { Badge } from '@/components/ui/badge';

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
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie as configurações do sistema e preferências</p>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        {/* Tabs responsivas */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="geral" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="tipos-motor" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Wrench className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Motores</span>
          </TabsTrigger>
          <TabsTrigger value="checklists" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Checklists</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Cog className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Notif.</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Database className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Relat.</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4 sm:space-y-6">
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
                    onCheckedChange={(checked) => handleConfigChange('tema_escuro', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tipos-motor" className="space-y-4 sm:space-y-6">
          <EngineTypesConfig />
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4 sm:space-y-6">
          <DiagnosticChecklistsConfig />
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4 sm:space-y-6">
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
                  onCheckedChange={(checked) => handleConfigChange('notificacaoEmail', checked)}
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
                  onCheckedChange={(checked) => handleConfigChange('notificacaoSMS', checked)}
                />
              </div>

              <Separator className="my-4 sm:my-6" />

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
        </TabsContent>

        <TabsContent value="backup" className="space-y-4 sm:space-y-6">
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
                  onCheckedChange={(checked) => handleConfigChange('backup_automatico', checked)}
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
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4 sm:space-y-6">
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
                  onCheckedChange={(checked) => handleConfigChange('relatorio_automatico', checked)}
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
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4 sm:space-y-6">
          <WorkflowStatusConfigAdmin />
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Cog className="w-4 h-4 sm:w-5 sm:h-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Gerencie configurações dinâmicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemConfigAdmin />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Salvar responsivo */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
        <Button 
          onClick={salvarConfiguracoes} 
          size="lg" 
          className="w-full sm:w-auto h-10 sm:h-11"
        >
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default Configuracoes;
