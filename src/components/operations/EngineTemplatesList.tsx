import { useState } from 'react';
import { useEngineTemplates, useDeleteEngineTemplate } from '@/hooks/useEngineTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Plus, Eye, Edit, Trash2, Copy, Filter } from 'lucide-react';
import { EngineTemplate } from '@/services/EngineTemplateService';
import { formatCurrency } from '@/utils/masks';

interface EngineTemplatesListProps {
  onCreateNew: () => void;
  onView: (template: EngineTemplate) => void;
  onEdit: (template: EngineTemplate) => void;
  onDuplicate: (template: EngineTemplate) => void;
}

const ITEMS_PER_PAGE = 10;

export function EngineTemplatesList({
  onCreateNew,
  onView,
  onEdit,
  onDuplicate,
}: EngineTemplatesListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [engineTypeFilter, setEngineTypeFilter] = useState<string>('todos');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EngineTemplate | null>(null);

  const { templates, count, totalPages, isLoading } = useEngineTemplates({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    filters: {
      searchTerm: searchTerm || undefined,
      engineTypeId: engineTypeFilter !== 'todos' ? engineTypeFilter : undefined,
    },
  });

  const deleteMutation = useDeleteEngineTemplate();

  const handleDelete = (template: EngineTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      await deleteMutation.mutateAsync(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const calculateTotalValue = (template: EngineTemplate): number => {
    const partsTotal =
      template.parts?.reduce((sum, p) => {
        const unitCost = p.part?.unit_cost || 0;
        return sum + unitCost * p.quantity;
      }, 0) || 0;

    const servicesTotal =
      template.services?.reduce((sum, s) => {
        const value = s.custom_value ?? s.service?.value ?? 0;
        return sum + value * s.quantity;
      }, 0) || 0;

    return partsTotal + servicesTotal + (template.labor_cost || 0);
  };

  const columns: ResponsiveTableColumn<EngineTemplate>[] = [
    {
      key: 'name',
      header: 'Nome do Template',
      priority: 1,
      minWidth: 200,
      render: (template) => (
        <div className="space-y-1">
          <div className="font-medium text-sm sm:text-base">{template.name}</div>
          {template.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {template.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'engine_type',
      header: 'Tipo de Motor',
      priority: 2,
      minWidth: 180,
      render: (template) => (
        <div className="space-y-1">
          <div className="font-medium text-xs sm:text-sm">
            {template.engine_type?.name ?? '—'}
          </div>
          {template.engine_type?.category && (
            <div className="text-xs text-muted-foreground">
              {template.engine_type.category}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Itens',
      priority: 3,
      minWidth: 120,
      render: (template) => (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {template.parts && template.parts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {template.parts.length} peça{template.parts.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {template.services && template.services.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {template.services.length} serviço{template.services.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Valor Total',
      priority: 4,
      minWidth: 120,
      render: (template) => (
        <div className="font-semibold text-xs sm:text-sm whitespace-nowrap">
          {formatCurrency(calculateTotalValue(template))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      priority: 1,
      minWidth: 180,
      render: (template) => (
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(template)}
            className="h-7 w-7 sm:h-8 sm:w-auto p-0 sm:px-3"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Ver</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(template)}
            className="h-7 w-7 sm:h-8 sm:w-auto p-0 sm:px-3"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(template)}
            className="h-7 w-7 sm:h-8 sm:w-auto p-0 sm:px-3"
          >
            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Duplicar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(template)}
            className="h-7 w-7 sm:h-8 sm:w-auto p-0 sm:px-3 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Excluir</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome do template..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 text-sm"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Select
              value={engineTypeFilter}
              onValueChange={(value) => {
                setEngineTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <SelectValue placeholder="Tipo de motor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onCreateNew} className="gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Novo Template</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </Card>

      <ResponsiveTable
        data={templates}
        columns={columns}
        keyExtractor={(template) => template.id}
        emptyMessage="Nenhum template encontrado"
        renderMobileCard={(template) => (
          <Card className="p-3 sm:p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="font-semibold text-sm sm:text-base truncate">
                  {template.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {template.engine_type?.name ?? '—'}
                  {template.engine_type?.category && ` — ${template.engine_type.category}`}
                </div>
              </div>
              <div className="font-semibold text-sm whitespace-nowrap ml-2">
                {formatCurrency(calculateTotalValue(template))}
              </div>
            </div>

            {template.description && (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {template.description}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {template.parts && template.parts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {template.parts.length} peça{template.parts.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {template.services && template.services.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {template.services.length} serviço{template.services.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(template)}
                className="flex-1 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(template)}
                className="flex-1 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(template)}
                className="flex-1 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Duplicar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(template)}
                className="flex-1 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir
              </Button>
            </div>
          </Card>
        )}
      />

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={
                  currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNumber);
                      }}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
              />
            </PaginationContent>
          </Pagination>
          <div className="text-center text-sm text-muted-foreground mt-2">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, count)} de {count} templates
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
