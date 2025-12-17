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
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEngineTypes, EngineType } from '@/hooks/useEngineTypes';
import { useEngineCategories } from '@/hooks/useEngineCategories';
import { EngineTypeForm } from './EngineTypeForm';
import { WorkflowStepsManager } from './WorkflowStepsManager';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export function EngineTypesConfig() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;
  
  const { 
    engineTypes,
    total,
    totalPages,
    loading, 
    deleteEngineType,
    fetchEngineTypes
  } = useEngineTypes({ page, pageSize, search });
  
  const { fetchAllCategories } = useEngineCategories();
  const [categories, setCategories] = useState<Record<string, { name: string; color: string }>>({});
  
  const [selectedEngineType, setSelectedEngineType] = useState<EngineType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  React.useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchAllCategories();
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
      const catsMap: Record<string, { name: string; color: string }> = {};
      cats.forEach((cat, index) => {
        catsMap[cat.id] = { name: cat.name, color: colors[index % colors.length] };
      });
      setCategories(catsMap);
    };
    loadCategories();
  }, []);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchEngineTypes();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

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

  const getCategoryInfo = (categoryId: string | null) => {
    if (!categoryId) return { label: 'Sem categoria', color: 'bg-gray-500' };
    const cat = categories[categoryId];
    return cat ? { label: cat.name, color: cat.color } : { label: 'Categoria não encontrada', color: 'bg-gray-500' };
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tipo de motor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

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
                        <TableHead className="min-w-[120px] hidden lg:table-cell">Serviços</TableHead>
                        <TableHead className="min-w-[80px] hidden xl:table-cell">Garantia</TableHead>
                        <TableHead className="min-w-[80px] hidden sm:table-cell">Status</TableHead>
                        <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engineTypes.map((engineType) => {
                        const categoryId = (engineType as any).category_id;
                        const categoryInfo = getCategoryInfo(categoryId);
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
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {(() => {
                                  const services = (engineType as any).engine_type_services || [];
                                  const serviceCount = services.length;
                                  
                                  if (serviceCount === 0) {
                                    return <span className="text-xs text-muted-foreground">Nenhum</span>;
                                  }
                                  
                                  return (
                                    <>
                                      {services.slice(0, 2).map((ets: any) => (
                                        <Badge key={ets.id} variant="secondary" className="text-xs">
                                          {ets.additional_services?.description?.substring(0, 15) || 'Serviço'}
                                        </Badge>
                                      ))}
                                      {serviceCount > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{serviceCount - 2}
                                        </Badge>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <span className="text-sm">{engineType.default_warranty_months}m</span>
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

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= page - 1 && pageNum <= page + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (pageNum === page - 2 || pageNum === page + 2) {
                        return (
                          <PaginationItem key={pageNum}>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              {engineTypes.length > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                  Mostrando {engineTypes.length} de {total} tipo(s) de motor
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {engineTypes.map((engineType) => {
                  const categoryId = (engineType as any).category_id;
                  const categoryInfo = getCategoryInfo(categoryId);
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
                          
                          {(() => {
                            const services = (engineType as any).engine_type_services || [];
                            if (services.length > 0) {
                              return (
                                <div>
                                  <span className="text-sm font-medium">Serviços:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {services.map((ets: any) => (
                                      <Badge key={ets.id} variant="secondary" className="text-xs">
                                        {ets.additional_services?.description || 'Serviço'}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          
                          {Array.isArray(engineType.technical_standards) && engineType.technical_standards.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Normas:</span>
                               <div className="flex flex-wrap gap-1 mt-1">
                                 {(engineType.technical_standards as string[] || []).map((standard: string) => (
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
            onSuccess={async () => {
              await fetchEngineTypes();
              setIsFormOpen(false);
            }}
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
