import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Settings,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useStockConfig, type StockConfig, type UpsertStockConfigInput } from '@/hooks/useStockConfig';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const ABC_LABELS: Record<string, string> = {
  A: 'A — Alto giro',
  B: 'B — Médio giro',
  C: 'C — Baixo giro',
};

interface ConfigFormState {
  part_code: string;
  part_name: string;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  safety_stock: number;
  lead_time_days: number;
  auto_reorder_enabled: boolean;
  is_critical: boolean;
  abc_classification: string;
}

const DEFAULT_FORM: ConfigFormState = {
  part_code: '',
  part_name: '',
  minimum_stock: 1,
  maximum_stock: 10,
  reorder_point: 2,
  safety_stock: 1,
  lead_time_days: 7,
  auto_reorder_enabled: false,
  is_critical: false,
  abc_classification: '',
};

function ConfigFormDialog({
  open,
  config,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  config?: StockConfig;
  onClose: () => void;
  onSave: (data: UpsertStockConfigInput) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<ConfigFormState>(
    config
      ? {
          part_code: config.part_code,
          part_name: config.part_name,
          minimum_stock: config.minimum_stock ?? 1,
          maximum_stock: config.maximum_stock ?? 10,
          reorder_point: config.reorder_point ?? 2,
          safety_stock: config.safety_stock ?? 1,
          lead_time_days: config.lead_time_days ?? 7,
          auto_reorder_enabled: config.auto_reorder_enabled ?? false,
          is_critical: config.is_critical ?? false,
          abc_classification: config.abc_classification ?? '',
        }
      : DEFAULT_FORM
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...form,
      abc_classification: form.abc_classification || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config ? 'Editar Configuração' : 'Nova Configuração'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="part_code">Código da Peça <span className="text-red-500">*</span></Label>
              <Input
                id="part_code"
                value={form.part_code}
                onChange={(e) => setForm({ ...form, part_code: e.target.value })}
                disabled={!!config}
                required
              />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="part_name">Nome da Peça <span className="text-red-500">*</span></Label>
              <Input
                id="part_name"
                value={form.part_name}
                onChange={(e) => setForm({ ...form, part_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minimum_stock">Estoque Mínimo</Label>
              <Input
                id="minimum_stock"
                type="number"
                min={0}
                value={form.minimum_stock}
                onChange={(e) => setForm({ ...form, minimum_stock: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="maximum_stock">Estoque Máximo</Label>
              <Input
                id="maximum_stock"
                type="number"
                min={0}
                value={form.maximum_stock}
                onChange={(e) => setForm({ ...form, maximum_stock: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="reorder_point">Ponto de Reposição</Label>
              <Input
                id="reorder_point"
                type="number"
                min={0}
                value={form.reorder_point}
                onChange={(e) => setForm({ ...form, reorder_point: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="safety_stock">Estoque de Segurança</Label>
              <Input
                id="safety_stock"
                type="number"
                min={0}
                value={form.safety_stock}
                onChange={(e) => setForm({ ...form, safety_stock: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="lead_time">Lead Time (dias)</Label>
              <Input
                id="lead_time"
                type="number"
                min={0}
                value={form.lead_time_days}
                onChange={(e) => setForm({ ...form, lead_time_days: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="abc">Classificação ABC</Label>
              <Select
                value={form.abc_classification || 'none'}
                onValueChange={(v) => setForm({ ...form, abc_classification: v === 'none' ? '' : v })}
              >
                <SelectTrigger id="abc">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="A">A — Alto giro</SelectItem>
                  <SelectItem value="B">B — Médio giro</SelectItem>
                  <SelectItem value="C">C — Baixo giro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_reorder">Reposição automática</Label>
                <p className="text-xs text-muted-foreground">Gerar necessidade ao atingir o ponto de reposição</p>
              </div>
              <Switch
                id="auto_reorder"
                checked={form.auto_reorder_enabled}
                onCheckedChange={(v) => setForm({ ...form, auto_reorder_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_critical">Item crítico</Label>
                <p className="text-xs text-muted-foreground">Prioridade máxima em alertas</p>
              </div>
              <Switch
                id="is_critical"
                checked={form.is_critical}
                onCheckedChange={(v) => setForm({ ...form, is_critical: v })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StockConfigManager() {
  const {
    configs,
    pagination,
    loading,
    saveConfig,
    deleteConfig,
    syncFromInventory,
    applyFilters,
    goToPage,
  } = useStockConfig();

  const [search, setSearch] = useState('');
  const [abcFilter, setAbcFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<StockConfig | undefined>();
  const [saving, setSaving] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    applyFilters({
      search: value || undefined,
      abc_classification: abcFilter !== 'all' ? abcFilter : undefined,
    });
  };

  const handleAbcChange = (value: string) => {
    setAbcFilter(value);
    applyFilters({
      search: search || undefined,
      abc_classification: value !== 'all' ? value : undefined,
    });
  };

  const handleSave = async (data: UpsertStockConfigInput) => {
    setSaving(true);
    const ok = await saveConfig(data);
    setSaving(false);
    if (ok) {
      setDialogOpen(false);
      setEditingConfig(undefined);
    }
  };

  const handleEdit = (config: StockConfig) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingConfig(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Configurações de Estoque</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Defina mínimos, máximos e alertas por peça
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncFromInventory()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sincronizar do Inventário</span>
            <span className="sm:hidden">Sincronizar</span>
          </Button>
          <Button size="sm" onClick={handleNew} className="gap-2">
            <Plus className="w-3.5 h-3.5" />
            Nova Config.
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por peça ou código..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={abcFilter} onValueChange={handleAbcChange}>
              <SelectTrigger className="w-full sm:w-44 h-9">
                <Settings className="w-3.5 h-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas classificações</SelectItem>
                <SelectItem value="A">A — Alto giro</SelectItem>
                <SelectItem value="B">B — Médio giro</SelectItem>
                <SelectItem value="C">C — Baixo giro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">Parâmetros por Peça</CardTitle>
            <CardDescription>
              {pagination.count > 0 && (
                <>
                  Mostrando {(pagination.page - 1) * pagination.pageSize + 1}–
                  {Math.min(pagination.page * pagination.pageSize, pagination.count)} de {pagination.count}
                </>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando configurações...</div>
          ) : configs.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-1">Nenhuma configuração encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clique em "Sincronizar do Inventário" para criar configurações padrão para todas as peças
              </p>
              <Button variant="outline" onClick={() => syncFromInventory()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar
              </Button>
            </div>
          ) : (
            <ResponsiveTable
              data={configs}
              keyExtractor={(c) => c.id}
              emptyMessage="Nenhuma configuração"
              columns={[
                {
                  key: 'part_code',
                  header: 'Código',
                  mobileLabel: 'Código',
                  render: (c) => <span className="font-mono text-xs sm:text-sm">{c.part_code}</span>,
                },
                {
                  key: 'part_name',
                  header: 'Nome',
                  mobileLabel: 'Nome',
                  render: (c) => <span className="text-xs sm:text-sm">{c.part_name}</span>,
                },
                {
                  key: 'minimum_stock',
                  header: 'Mín.',
                  mobileLabel: 'Estoque Mín.',
                  render: (c) => <span className="text-xs sm:text-sm">{c.minimum_stock ?? '—'}</span>,
                },
                {
                  key: 'maximum_stock',
                  header: 'Máx.',
                  mobileLabel: 'Estoque Máx.',
                  hideInMobile: true,
                  render: (c) => <span className="text-xs sm:text-sm">{c.maximum_stock ?? '—'}</span>,
                },
                {
                  key: 'reorder_point',
                  header: 'Reposição',
                  mobileLabel: 'Ponto Repos.',
                  hideInMobile: true,
                  render: (c) => <span className="text-xs sm:text-sm">{c.reorder_point ?? '—'}</span>,
                },
                {
                  key: 'lead_time_days',
                  header: 'Lead Time',
                  mobileLabel: 'Lead Time',
                  hideInMobile: true,
                  render: (c) => (
                    <span className="text-xs sm:text-sm">
                      {c.lead_time_days ? `${c.lead_time_days}d` : '—'}
                    </span>
                  ),
                },
                {
                  key: 'abc',
                  header: 'ABC',
                  mobileLabel: 'Classe',
                  render: (c) =>
                    c.abc_classification ? (
                      <Badge variant="outline" className="text-xs">
                        {c.abc_classification}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    ),
                },
                {
                  key: 'flags',
                  header: 'Flags',
                  mobileLabel: 'Flags',
                  render: (c) => (
                    <div className="flex gap-1 flex-wrap">
                      {c.is_critical && (
                        <Badge className="bg-red-100 text-red-700 text-xs">Crítico</Badge>
                      )}
                      {c.auto_reorder_enabled && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Auto</Badge>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  mobileLabel: 'Ações',
                  render: (c) => (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEdit(c)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteConfig(c.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => goToPage(pagination.page - 1)}
                aria-disabled={pagination.page <= 1}
                className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm px-4 py-2">
                Página {pagination.page} de {pagination.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => goToPage(pagination.page + 1)}
                aria-disabled={pagination.page >= pagination.totalPages}
                className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <ConfigFormDialog
        open={dialogOpen}
        config={editingConfig}
        onClose={() => {
          setDialogOpen(false);
          setEditingConfig(undefined);
        }}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
