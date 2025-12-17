
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Database, Bell, Mail, Cog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SystemConfigAdmin from "@/components/admin/SystemConfigAdmin";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { BackupTab } from "@/components/settings/BackupTab";
import { ReportsTab } from "@/components/settings/ReportsTab";

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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="geral" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Geral</span>
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
          <GeneralSettingsTab 
            configuracoes={configuracoes}
            onConfigChange={handleConfigChange}
          />
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-4 sm:space-y-6">
          <NotificationsTab 
            configuracoes={configuracoes}
            onConfigChange={handleConfigChange}
          />
        </TabsContent>

        <TabsContent value="backup" className="space-y-4 sm:space-y-6">
          <BackupTab 
            configuracoes={configuracoes}
            onConfigChange={handleConfigChange}
          />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4 sm:space-y-6">
          <ReportsTab 
            configuracoes={configuracoes}
            onConfigChange={handleConfigChange}
          />
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
