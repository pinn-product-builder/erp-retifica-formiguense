import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Wrench, ClipboardList, GitBranch, CheckCircle, Cog, FolderTree } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { EngineTypesConfig } from "@/components/operations/EngineTypesConfig";
import { EngineCategoriesConfig } from "@/components/operations/EngineCategoriesConfig";
import DiagnosticChecklistsConfig from "@/components/operations/DiagnosticChecklistsConfig";
import { WorkflowStatusConfigAdmin } from "@/components/admin/WorkflowStatusConfigAdmin";
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/auth/PermissionGate';

const ConfiguracoesOperacoes = () => {
  const { isAdmin, isManager } = usePermissions();

  // Verificar se o usuário tem permissão (admin ou gerente)
  const hasAccess = isAdmin() || isManager();

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Acesso Negado</h2>
              <p className="text-gray-600 max-w-md">
                Você não tem permissão para acessar as configurações do módulo Operações e Serviços. 
                Esta área é restrita para administradores e gerentes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            Configurações - Operações e Serviços
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Configure tipos de motor, checklists de diagnóstico, status de workflow e outras configurações operacionais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Módulo Operações
          </Badge>
          {isAdmin() && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
          {isManager() && !isAdmin() && (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Gerente
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs de configurações */}
      <Tabs defaultValue="categorias" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid grid-cols-4 w-full min-w-[800px] sm:min-w-0">
            <TabsTrigger value="categorias" className="flex items-center gap-2 text-xs sm:text-sm">
              <FolderTree className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Categorias</span>
              <span className="sm:hidden">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="tipos-motor" className="flex items-center gap-2 text-xs sm:text-sm">
              <Cog className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Tipos de Motor</span>
              <span className="sm:hidden">Motores</span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2 text-xs sm:text-sm">
              <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Checklists Diagnóstico</span>
              <span className="sm:hidden">Checklists</span>
            </TabsTrigger>
            <TabsTrigger value="workflow-status" className="flex items-center gap-2 text-xs sm:text-sm">
              <GitBranch className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Status Workflow</span>
              <span className="sm:hidden">Status</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Aba Categorias */}
        <TabsContent value="categorias" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FolderTree className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                Categorias de Tipos de Motor
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Gerencie as categorias de tipos de motor e seus componentes associados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionGate 
                module="settings" 
                level="admin"
                fallback={
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Você não tem permissão para gerenciar categorias.</p>
                  </div>
                }
              >
                <EngineCategoriesConfig />
              </PermissionGate>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Tipos de Motor */}
        <TabsContent value="tipos-motor" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Cog className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Configuração de Tipos de Motor
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Gerencie os tipos de motor disponíveis no sistema, incluindo componentes e especificações técnicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionGate 
                module="settings" 
                level="admin"
                fallback={
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Você não tem permissão para gerenciar tipos de motor.</p>
                  </div>
                }
              >
                <EngineTypesConfig />
              </PermissionGate>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Checklists de Diagnóstico */}
        <TabsContent value="checklists" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Checklists de Diagnóstico
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure checklists personalizados para diagnóstico de componentes por tipo de motor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionGate 
                module="settings" 
                level="admin"
                fallback={
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Você não tem permissão para gerenciar checklists de diagnóstico.</p>
                  </div>
                }
              >
                <DiagnosticChecklistsConfig />
              </PermissionGate>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Status de Workflow */}
        <TabsContent value="workflow-status" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Status de Workflow
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configure status personalizados para o workflow operacional, incluindo cores, ícones e transições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionGate 
                module="settings" 
                level="admin"
                fallback={
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Apenas administradores podem gerenciar status de workflow.
                      {isManager() && " Entre em contato com um administrador para fazer alterações."}
                    </p>
                  </div>
                }
              >
                <WorkflowStatusConfigAdmin />
              </PermissionGate>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informações adicionais */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Sobre as Configurações do Módulo</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Categorias:</strong> Gerencie categorias de tipos de motor e seus componentes</p>
                <p>• <strong>Tipos de Motor:</strong> Configure os tipos de motor suportados e seus componentes</p>
                <p>• <strong>Checklists:</strong> Defina checklists personalizados para diagnóstico por componente</p>
                <p>• <strong>Status de Workflow:</strong> Personalize os status do fluxo operacional</p>
              </div>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800">
                  <strong>Importante:</strong> Alterações nas configurações podem afetar ordens de serviço em andamento. 
                  Certifique-se de coordenar mudanças com a equipe operacional.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesOperacoes;
