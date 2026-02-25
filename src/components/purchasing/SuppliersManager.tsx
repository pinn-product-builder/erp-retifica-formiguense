import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Plus, Search, RefreshCw, Users,
  Building2, Package, History, ShoppingCart, Star,
} from 'lucide-react';

import { useSuppliers } from '@/hooks/useSuppliers';
import { SupplierCard } from './SupplierCard';
import { SupplierForm } from './SupplierForm';
import { SupplierProductsTab } from './SupplierProductsTab';
import { SupplierEvaluationTab } from './SupplierEvaluationTab';
import { SUPPLIER_CATEGORIES, type Supplier } from '@/services/SupplierService';

// ─── Modal de Detalhes ────────────────────────────────────────────────────────
function SupplierDetailsModal({
  supplier,
  onClose,
  onEdit,
}: {
  supplier: Supplier;
  onClose: () => void;
  onEdit: () => void;
}) {
  const displayName = supplier.trade_name ?? supplier.name;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-base sm:text-lg">{displayName}</DialogTitle>
              {supplier.code && (
                <p className="text-xs text-muted-foreground font-mono">{supplier.code}</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={onEdit} className="flex-shrink-0">
              Editar
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="text-xs sm:text-sm">
              <Building2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Informações</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-xs sm:text-sm">
              <Star className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Avaliação</span>
              <span className="sm:hidden">Nota</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm">
              <Package className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Produtos</span>
              <span className="sm:hidden">Prod.</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">
              <History className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Histórico</span>
              <span className="sm:hidden">Hist.</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba info */}
          <TabsContent value="info" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Razão Social</p>
                <p className="text-sm font-medium">{supplier.legal_name ?? supplier.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CNPJ</p>
                <p className="text-sm font-mono">{supplier.document ?? supplier.cnpj ?? '—'}</p>
              </div>
              {supplier.email && (
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="text-sm">{supplier.email}</p>
                </div>
              )}
              {supplier.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm">{supplier.phone}</p>
                </div>
              )}
              {supplier.whatsapp && (
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="text-sm">{supplier.whatsapp}</p>
                </div>
              )}
              {supplier.contact_person && (
                <div>
                  <p className="text-xs text-muted-foreground">Contato</p>
                  <p className="text-sm">{supplier.contact_person}</p>
                </div>
              )}
              {supplier.payment_terms && (
                <div>
                  <p className="text-xs text-muted-foreground">Prazo de Pagamento</p>
                  <p className="text-sm">{supplier.payment_terms}</p>
                </div>
              )}
              {supplier.delivery_days > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Prazo de Entrega</p>
                  <p className="text-sm">{supplier.delivery_days} dias</p>
                </div>
              )}
            </div>

            {supplier.address_jsonb && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                <p className="text-sm">
                  {supplier.address_jsonb.street}, {supplier.address_jsonb.number}
                  {supplier.address_jsonb.complement && `, ${supplier.address_jsonb.complement}`}
                  {' — '}{supplier.address_jsonb.neighborhood}, {supplier.address_jsonb.city}/{supplier.address_jsonb.state}
                  {' — '}{supplier.address_jsonb.postal_code}
                </p>
              </div>
            )}

            {(supplier.categories?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Categorias</p>
                <div className="flex flex-wrap gap-1">
                  {(supplier.categories ?? []).map(v => {
                    const cat = SUPPLIER_CATEGORIES.find(c => c.value === v);
                    return (
                      <span key={v} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary">
                        {cat?.label ?? v}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {supplier.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm text-muted-foreground">{supplier.notes}</p>
              </div>
            )}
          </TabsContent>

          {/* Aba avaliação */}
          <TabsContent value="evaluation" className="mt-4">
            <SupplierEvaluationTab
              supplierId={supplier.id}
              currentRating={supplier.rating}
            />
          </TabsContent>

          {/* Aba produtos */}
          <TabsContent value="products" className="mt-4">
            <SupplierProductsTab supplier={supplier} />
          </TabsContent>

          {/* Aba histórico */}
          <TabsContent value="history" className="mt-4">
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <ShoppingCart className="w-5 h-5" />
              <p className="text-sm">Histórico de compras em breve</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal de Bloqueio ────────────────────────────────────────────────────────
function BlockSupplierModal({
  supplier,
  onClose,
  onConfirm,
}: {
  supplier: Supplier;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <AlertDialog open onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bloquear fornecedor?</AlertDialogTitle>
          <AlertDialogDescription>
            O fornecedor {supplier.trade_name ?? supplier.name} será bloqueado e não aparecerá em cotações.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1 py-2">
          <Label htmlFor="block-reason">Motivo do bloqueio *</Label>
          <Textarea
            id="block-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Descreva o motivo do bloqueio..."
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="bg-destructive hover:bg-destructive/90"
          >
            Bloquear
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function SuppliersManager() {
  const {
    suppliers, count, page, totalPages, pageSize, isLoading, filters,
    actions,
  } = useSuppliers({ isActive: true });

  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('all');
  const [statusFilter, setStatus]   = useState<'active' | 'inactive' | 'all'>('active');

  const [formOpen, setFormOpen]           = useState(false);
  const [editingSupplier, setEditing]     = useState<Supplier | undefined>();
  const [detailsSupplier, setDetails]     = useState<Supplier | undefined>();
  const [blockingSupplier, setBlocking]   = useState<Supplier | undefined>();

  const applySearch = () => {
    actions.applyFilters({
      search:   search || undefined,
      category: category !== 'all' ? category : undefined,
      isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    });
  };

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applySearch();
  };

  const handleEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setDetails(undefined);
    setFormOpen(true);
  };

  const handleFormSuccess = async () => {
    setFormOpen(false);
    setEditing(undefined);
    actions.refresh();
  };

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, count);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <h2 className="text-base sm:text-lg font-semibold">Fornecedores</h2>
          {count > 0 && (
            <span className="text-sm text-muted-foreground">({count})</span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => { setEditing(undefined); setFormOpen(true); }}
          className="h-8 sm:h-9 w-full sm:w-auto"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          <span className="hidden sm:inline">Novo Fornecedor</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome, CNPJ ou código..."
            className="pl-8 h-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44 h-9">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {SUPPLIER_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={v => setStatus(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-36 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={applySearch}>
          <Search className="w-3.5 h-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Filtrar</span>
        </Button>
      </div>

      {/* Grid de cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando fornecedores...</span>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum fornecedor encontrado</p>
          <p className="text-xs mt-1">
            {filters.search || filters.category
              ? 'Tente ajustar os filtros'
              : 'Clique em "Novo Fornecedor" para cadastrar'}
          </p>
          {!filters.search && !filters.category && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => { setEditing(undefined); setFormOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Fornecedor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {suppliers.map(supplier => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={handleEdit}
              onViewDetails={s => setDetails(s)}
              onToggleActive={actions.toggleActive}
              onBlock={s => setBlocking(s)}
              onUnblock={s => actions.unblockSupplier(s.id)}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="text-xs">
            Mostrando {from}–{to} de {count} fornecedores
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={page === 1}
              onClick={() => actions.goToPage(page - 1)}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => actions.goToPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={page === totalPages}
              onClick={() => actions.goToPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Formulário (Criar/Editar) */}
      <Dialog open={formOpen} onOpenChange={open => { if (!open) { setFormOpen(false); setEditing(undefined); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? 'Atualize as informações do fornecedor.'
                : 'Preencha os dados para cadastrar um novo fornecedor.'}
            </DialogDescription>
          </DialogHeader>
          <SupplierForm
            supplier={editingSupplier}
            onSuccess={handleFormSuccess}
            onCancel={() => { setFormOpen(false); setEditing(undefined); }}
            onSubmit={editingSupplier
              ? data => actions.updateSupplier(editingSupplier.id, data)
              : data => actions.createSupplier(data)
            }
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      {detailsSupplier && (
        <SupplierDetailsModal
          supplier={detailsSupplier}
          onClose={() => setDetails(undefined)}
          onEdit={() => handleEdit(detailsSupplier)}
        />
      )}

      {/* Modal de Bloqueio */}
      {blockingSupplier && (
        <BlockSupplierModal
          supplier={blockingSupplier}
          onClose={() => setBlocking(undefined)}
          onConfirm={async reason => {
            await actions.blockSupplier(blockingSupplier.id, reason);
            setBlocking(undefined);
          }}
        />
      )}
    </div>
  );
}
