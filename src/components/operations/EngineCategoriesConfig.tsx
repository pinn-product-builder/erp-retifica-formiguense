import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEngineCategories, EngineCategory } from '@/hooks/useEngineCategories';
import { EngineCategoryForm } from './EngineCategoryForm';
import { useEngineComponents } from '@/hooks/useEngineComponents';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

export function EngineCategoriesConfig() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 10;
  
  const { 
    categories, 
    total,
    totalPages,
    loading, 
    deleteCategory,
    fetchCategories
  } = useEngineCategories({ page, pageSize, search });
  
  const { components: engineComponents } = useEngineComponents();
  const [selectedCategory, setSelectedCategory] = useState<EngineCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreate = () => {
    setSelectedCategory(null);
    setFormMode('create');
    setIsFormOpen(true);
  };

  const handleEdit = (category: EngineCategory) => {
    setSelectedCategory(category);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
  };

  const getComponentLabel = (componentId: string) => {
    const component = engineComponents.find(c => c.value === componentId);
    return component?.label || componentId;
  };

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchCategories();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  if (loading && categories.length === 0) {
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
                Categorias de Tipos de Motor
              </CardTitle>
              <CardDescription className="mt-1">
                Gerencie as categorias de tipos de motor e seus componentes associados
              </CardDescription>
            </div>
            <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Categoria</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {search ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria configurada ainda'}
              </p>
              {!search && (
                <Button onClick={handleCreate} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Categoria
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Nome</TableHead>
                      <TableHead className="min-w-[200px]">Componentes</TableHead>
                      <TableHead className="min-w-[80px] hidden sm:table-cell">Status</TableHead>
                      <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {Array.isArray(category.components) && category.components.length > 0 ? (
                              (category.components as string[]).slice(0, 3).map((component) => (
                                <Badge key={component} variant="outline" className="text-xs">
                                  {getComponentLabel(component)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Nenhum componente</span>
                            )}
                            {Array.isArray(category.components) && category.components.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{category.components.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge 
                            variant={category.is_active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {category.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <span className="sr-only">Abrir menu</span>
                                <span className="text-lg">⋯</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(category)}>
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
                                      Tem certeza que deseja excluir a categoria "{category.name}"? 
                                      Esta ação não pode ser desfeita e pode afetar tipos de motor já cadastrados.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(category.id)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>

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

              <div className="text-sm text-muted-foreground text-center">
                Mostrando {categories.length} de {total} categoria(s)
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {formMode === 'create' ? 'Criar Nova Categoria' : 'Editar Categoria'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Configure o nome e os componentes da categoria
            </DialogDescription>
          </DialogHeader>
          <EngineCategoryForm
            category={selectedCategory}
            mode={formMode}
            onSuccess={async () => {
              await fetchCategories();
              setIsFormOpen(false);
            }}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

