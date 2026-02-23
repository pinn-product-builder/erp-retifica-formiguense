import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Star, Pencil, Trash2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useSupplierProducts } from '@/hooks/useSupplierProducts';
import { AddSupplierProductModal } from './AddSupplierProductModal';
import { type Supplier } from '@/services/SupplierService';
import { type SupplierProduct, SupplierProductService } from '@/services/SupplierProductService';

interface SupplierProductsTabProps {
  supplier: Supplier;
}

export function SupplierProductsTab({ supplier }: SupplierProductsTabProps) {
  const { products, isLoading, error, actions } = useSupplierProducts(supplier.id);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editingProduct, setEditing]  = useState<SupplierProduct | undefined>();
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  const handleEdit = (product: SupplierProduct) => {
    setEditing(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const handleSubmit = async (data: Parameters<typeof actions.createProduct>[0]) => {
    if (editingProduct) {
      return actions.updateProduct(editingProduct.id, data);
    }
    return actions.createProduct(data);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await actions.deleteProduct(deletingId);
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Carregando produtos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-destructive">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {products.length === 0
                ? 'Nenhum produto vinculado'
                : `${products.length} produto${products.length > 1 ? 's' : ''} vinculado${products.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button size="sm" onClick={handleAdd} className="h-8">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Adicionar Produto</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum produto vinculado a este fornecedor.</p>
            <p className="text-xs mt-1">Clique em "Adicionar Produto" para vincular peças com preços.</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={handleAdd}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Produto
            </Button>
          </div>
        ) : (
          <>
            {/* Tabela desktop */}
            <div className="hidden md:block rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Código</TableHead>
                    <TableHead>Peça</TableHead>
                    <TableHead className="text-right w-28">Preço Unit.</TableHead>
                    <TableHead className="text-center w-20">Qtd. Mín.</TableHead>
                    <TableHead className="text-center w-20">Prazo</TableHead>
                    <TableHead className="text-center w-20">Vigência</TableHead>
                    <TableHead className="text-center w-24">Status</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map(p => {
                    const valid = SupplierProductService.isPriceValid(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.part_code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {p.is_preferred && (
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{p.part_name}</p>
                              {p.supplier_code && (
                                <p className="text-xs text-muted-foreground">Cód. forn.: {p.supplier_code}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {SupplierProductService.formatPrice(p.unit_price)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {p.minimum_quantity ?? '—'}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {p.lead_time_days != null ? `${p.lead_time_days}d` : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.valid_until ? (
                            <Badge variant={valid ? 'outline' : 'destructive'} className="text-xs">
                              {valid ? 'Vigente' : 'Vencido'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem prazo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs">
                            {p.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            {!p.is_preferred && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Marcar como preferencial"
                                onClick={() => actions.setPreferred(p)}
                              >
                                <Star className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(p)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(p.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Cards mobile */}
            <div className="md:hidden space-y-2">
              {products.map(p => {
                const valid = SupplierProductService.isPriceValid(p);
                return (
                  <div key={p.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {p.is_preferred && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          <p className="font-medium text-sm truncate">{p.part_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{p.part_code}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs h-5">
                          {p.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Preço</p>
                        <p className="font-semibold whitespace-nowrap">
                          {SupplierProductService.formatPrice(p.unit_price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Qtd. Mín.</p>
                        <p className="font-medium">{p.minimum_quantity ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prazo</p>
                        <p className="font-medium">{p.lead_time_days != null ? `${p.lead_time_days}d` : '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {p.valid_until && (
                        <Badge variant={valid ? 'outline' : 'destructive'} className="text-xs">
                          {valid ? 'Vigente' : 'Vencido'}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        {!p.is_preferred && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => actions.setPreferred(p)}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeletingId(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal adicionar/editar */}
      <AddSupplierProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={editingProduct}
        onSubmit={handleSubmit}
      />

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o vínculo do produto com este fornecedor. O preço não estará mais disponível em cotações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Ícone necessário para o estado vazio
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
