import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Workflow, 
  Eye, 
  MoreVertical,
  DragHandleDots2Icon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEngineTypes, EngineType } from '@/hooks/useEngineTypes';
import { EngineTypeForm } from './EngineTypeForm';
import { WorkflowStepsManager } from './WorkflowStepsManager';
import { Loader2 } from 'lucide-react';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  geral: { label: 'Geral', color: 'bg-blue-500' },
  linha_pesada: { label: 'Linha Pesada', color: 'bg-green-500' },
  linha_leve: { label: 'Linha Leve', color: 'bg-yellow-500' },
  bosch: { label: 'Bosch', color: 'bg-red-500' },
  bosch_specialized: { label: 'Bosch 14 Etapas', color: 'bg-purple-500' },
  garantia: { label: 'Garantia', color: 'bg-orange-500' },
};

export function EngineTypesConfig() {
  const { 
    engineTypes, 
    loading, 
    deleteEngineType 
  } = useEngineTypes();
  
  const [selectedEngineType, setSelectedEngineType] = useState<EngineType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreate = () => {
    setSelectedEngineType(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEdit = (engineType: EngineType) => {
    setSelectedEngineType(engineType);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleViewWorkflow = (engineType: EngineType) => {
    setSelectedEngineType(engineType);
    setIsWorkflowOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteEngineType(id);
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORY_LABELS[category] || { label: category, color: 'bg-gray-500' };
  };

  if (loading && engineTypes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Tipos de Motor e Workflows
              </CardTitle>
              <CardDescription className="mt-1">
                Configure diferentes tipos de motores com seus respectivos workflows personalizados
              </CardDescription>
            </div>
            <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Tipo de Motor</span>
              <span className="sm:hidden">Novo Tipo</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList>
              <TabsTrigger value="list">Lista de Tipos</TabsTrigger>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {engineTypes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhum tipo de motor configurado ainda
                  </p>
                  <Button onClick={handleCreate} variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Primeiro Tipo
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Nome</TableHead>
                        <TableHead className="min-w-[100px]">Categoria</TableHead>
                        <TableHead className="min-w-[120px] hidden md:table-cell">Componentes</TableHead>
                        <TableHead className="min-w-[80px] hidden lg:table-cell">Garantia</TableHead>
                        <TableHead className="min-w-[120px] hidden lg:table-cell">Normas Técnicas</TableHead>
                        <TableHead className="min-w-[80px] hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engineTypes.map((engineType) => {
                        const categoryInfo = getCategoryInfo(engineType.category);
                        return (
                          <TableRow key={engineType.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{engineType.name}</span>
                                <span className="md:hidden text-sm text-muted-foreground">
                                  {engineType.description && engineType.description.length > 30 
                                    ? `${engineType.description.substring(0, 30)}...` 
                                    : engineType.description
                                  }
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className={`${categoryInfo.color} text-white text-xs`}
                              >
                                <span className="hidden sm:inline">{categoryInfo.label}</span>
                                <span className="sm:hidden">{categoryInfo.label.substring(0, 4)}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {engineType.required_components.slice(0, 2).map((component) => (
                                  <Badge key={component} variant="outline" className="text-xs">
                                    {component}
                                  </Badge>
                                ))}
                                {engineType.required_components.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{engineType.required_components.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-sm">{engineType.default_warranty_months}m</span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {engineType.technical_standards.slice(0, 2).map((standard) => (
                                  <Badge key={standard} variant="outline" className="text-xs">
                                    {standard}
                                  </Badge>
                                ))}
                                {engineType.technical_standards.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{engineType.technical_standards.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge 
                                variant={engineType.is_active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {engineType.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewWorkflow(engineType)}>
                                    <Workflow className="w-4 h-4 mr-2" />
                                    Gerenciar Workflow
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEdit(engineType)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir o tipo de motor "{engineType.name}"? 
                                          Esta ação não pode ser desfeita e pode afetar motores já cadastrados.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDelete(engineType.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {engineTypes.map((engineType) => {
                  const categoryInfo = getCategoryInfo(engineType.category);
                  return (
                    <Card key={engineType.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{engineType.name}</CardTitle>
                            <Badge 
                              variant="secondary" 
                              className={`${categoryInfo.color} text-white text-xs`}
                            >
                              {categoryInfo.label}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewWorkflow(engineType)}>
                                <Workflow className="w-4 h-4 mr-2" />
                                Workflow
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(engineType)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {engineType.description && (
                          <p className="text-sm text-muted-foreground">
                            {engineType.description}
                          </p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Garantia:</span> {engineType.default_warranty_months} meses
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium">Componentes:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {engineType.required_components.map((component) => (
                                <Badge key={component} variant="outline" className="text-xs">
                                  {component}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {engineType.technical_standards.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Normas:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {engineType.technical_standards.map((standard) => (
                                  <Badge key={standard} variant="outline" className="text-xs">
                                    {standard}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para Formulário de Tipo de Motor */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {formMode === 'create' ? 'Criar Novo Tipo de Motor' : 'Editar Tipo de Motor'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Configure as características e requisitos do tipo de motor
            </DialogDescription>
          </DialogHeader>
          <EngineTypeForm
            engineType={selectedEngineType}
            mode={formMode}
            onSuccess={() => setIsFormOpen(false)}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para Gerenciar Workflow */}
      <Dialog open={isWorkflowOpen} onOpenChange={setIsWorkflowOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Gerenciar Workflow - {selectedEngineType?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Configure as etapas do workflow para este tipo de motor
            </DialogDescription>
          </DialogHeader>
          {selectedEngineType && (
            <WorkflowStepsManager
              engineType={selectedEngineType}
              onClose={() => setIsWorkflowOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
