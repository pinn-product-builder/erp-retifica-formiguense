import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import { useStockAccounting } from '@/hooks/useStockAccounting';
import type { AccountingConfig, AccountingEntry, EntryFilters } from '@/services/StockAccountingService';
import { StatCard } from '@/components/StatCard';
import { useAuth } from '@/hooks/useAuth';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  baixa: 'Baixa',
  writedown: 'Write-down',
};

const STATUS_CONFIG: Record<AccountingEntry['status'], { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Rascunho', badgeClass: 'bg-gray-100 text-gray-700', icon: Clock },
  posted: { label: 'Contabilizado', badgeClass: 'bg-green-100 text-green-800', icon: CheckCircle },
  reversed: { label: 'Estornado', badgeClass: 'bg-red-100 text-red-800', icon: XCircle },
};

function EntryStatusBadge({ status }: { status: AccountingEntry['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.badgeClass} text-xs`}>
      <Icon className="w-2.5 h-2.5 mr-0.5" />
      {cfg.label}
    </Badge>
  );
}

function AccountingConfigRow({
  config,
  onEdit,
}: {
  config: AccountingConfig;
  onEdit: (c: AccountingConfig) => void;
}) {
  return (
    <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-xs font-medium">
          {MOVEMENT_TYPE_LABELS[config.movement_type] ?? config.movement_type}
        </Badge>
        <div className="flex items-center gap-2">
          {!config.is_active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(config)}>
            Editar
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
        <div className="space-y-0.5">
          <span className="text-muted-foreground">Débito:</span>
          <p className="font-medium truncate">{config.debit_account}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-muted-foreground">Crédito:</span>
          <p className="font-medium truncate">{config.credit_account}</p>
        </div>
      </div>
    </div>
  );
}

function ConfigEditForm({
  config,
  onSubmit,
  onCancel,
}: {
  config: AccountingConfig;
  onSubmit: (data: Omit<AccountingConfig, 'id' | 'org_id' | 'created_at'>) => void;
  onCancel: () => void;
}) {
  const [debitAccount, setDebitAccount] = useState(config.debit_account);
  const [creditAccount, setCreditAccount] = useState(config.credit_account);
  const [descTemplate, setDescTemplate] = useState(config.description_template ?? '');
  const [isActive, setIsActive] = useState(config.is_active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      movement_type: config.movement_type,
      reason_id: config.reason_id,
      debit_account: debitAccount,
      credit_account: creditAccount,
      description_template: descTemplate || null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
        <Badge variant="outline" className="text-xs">
          {MOVEMENT_TYPE_LABELS[config.movement_type]}
        </Badge>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">Conta de Débito *</Label>
        <Input
          value={debitAccount}
          onChange={(e) => setDebitAccount(e.target.value)}
          placeholder="Ex: 3.1.1.01 CMV"
          required
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">Conta de Crédito *</Label>
        <Input
          value={creditAccount}
          onChange={(e) => setCreditAccount(e.target.value)}
          placeholder="Ex: 1.1.3.01 Estoques"
          required
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">Template do Histórico</Label>
        <Input
          value={descTemplate}
          onChange={(e) => setDescTemplate(e.target.value)}
          placeholder="Ex: Saída de estoque - {{part_name}}"
          className="h-9 text-sm"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm">Salvar Configuração</Button>
      </div>
    </form>
  );
}

export default function AccountingManager() {
  const {
    configs,
    entries,
    provisions,
    pagination,
    provisionsPagination,
    stats,
    loading,
    fetchEntries,
    fetchProvisions,
    saveConfig,
    postEntry,
    reverseEntry,
    approveProvision,
  } = useStockAccounting();

  const { user } = useAuth();
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AccountingConfig | null>(null);
  const [entrySearch, setEntrySearch] = useState('');
  const [entryStatus, setEntryStatus] = useState<EntryFilters['status']>('todos');

  const handleConfigSubmit = async (data: Omit<AccountingConfig, 'id' | 'org_id' | 'created_at'>) => {
    const success = await saveConfig(data);
    if (success) {
      setIsConfigDialogOpen(false);
      setSelectedConfig(null);
    }
  };

  const handlePostEntry = async (entryId: string) => {
    if (!user?.id) return;
    await postEntry(entryId, user.id);
  };

  const handleReverseEntry = async (entryId: string) => {
    if (!user?.id) return;
    await reverseEntry(entryId, user.id);
  };

  const handleApproveProvision = async (provisionId: string) => {
    if (!user?.id) return;
    await approveProvision(provisionId, user.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <StatCard title="Total" value={stats.total} icon={BookOpen} subtitle="Lançamentos" />
        <StatCard title="Rascunho" value={stats.draft} icon={Clock} subtitle="Pendentes" variant="warning" />
        <StatCard title="Contabilizados" value={stats.posted} icon={CheckCircle} subtitle="Lançados" variant="success" />
        <StatCard title="Valor Contabilizado" value={formatCurrency(stats.total_amount)} icon={DollarSign} subtitle="Total postado" variant="primary" />
      </div>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex sm:grid sm:grid-cols-3 h-auto">
          {[
            { value: 'entries', icon: BookOpen, label: 'Lançamentos', short: 'Lanç.' },
            { value: 'provisions', icon: AlertTriangle, label: 'Provisões', short: 'Prov.' },
            { value: 'config', icon: Settings, label: 'Configurações', short: 'Config.' },
          ].map(({ value, icon: Icon, label, short }) => (
            <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-xs sm:text-sm flex-shrink-0">
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Lançamentos Contábeis</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {pagination.count} lançamento{pagination.count !== 1 ? 's' : ''} —
                Mostrando {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.count)} de {pagination.count}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por histórico ou referência..."
                    value={entrySearch}
                    onChange={(e) => {
                      setEntrySearch(e.target.value);
                      fetchEntries({ search: e.target.value, status: entryStatus });
                    }}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Select value={entryStatus} onValueChange={(v) => {
                  const val = v as EntryFilters['status'];
                  setEntryStatus(val);
                  fetchEntries({ search: entrySearch, status: val });
                }}>
                  <SelectTrigger className="w-full sm:w-44 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="posted">Contabilizado</SelectItem>
                    <SelectItem value="reversed">Estornado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-8">Carregando lançamentos...</p>
              ) : entries.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhum lançamento contábil encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-3 space-y-2 hover:bg-muted/30">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <EntryStatusBadge status={entry.status} />
                            <span className="text-xs text-muted-foreground">{formatDate(entry.entry_date)}</span>
                            {entry.reference && (
                              <Badge variant="outline" className="text-xs">{entry.reference}</Badge>
                            )}
                          </div>
                          {entry.description && (
                            <p className="text-xs sm:text-sm truncate">{entry.description}</p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 text-xs text-muted-foreground">
                            <span>D: <span className="text-foreground">{entry.debit_account}</span></span>
                            <span>C: <span className="text-foreground">{entry.credit_account}</span></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm whitespace-nowrap">{formatCurrency(entry.amount)}</span>
                          {entry.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={() => handlePostEntry(entry.id)}
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span className="hidden sm:inline">Contabilizar</span>
                            </Button>
                          )}
                          {entry.status === 'posted' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleReverseEntry(entry.id)}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span className="hidden sm:inline">Estornar</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => fetchEntries({ search: entrySearch, status: entryStatus }, pagination.page - 1)}
                        aria-disabled={pagination.page <= 1}
                        className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-xs px-3 py-2">Página {pagination.page} de {pagination.totalPages}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => fetchEntries({ search: entrySearch, status: entryStatus }, pagination.page + 1)}
                        aria-disabled={pagination.page >= pagination.totalPages}
                        className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provisions" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Provisões (VRL)</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Provisões para redução ao Valor Realizável Líquido e perdas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {provisions.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Nenhuma provisão encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {provisions.map((prov) => (
                    <div key={prov.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              prov.provision_type === 'vrl_writedown' ? 'bg-orange-100 text-orange-800' :
                              prov.provision_type === 'obsolescence' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {prov.provision_type === 'vrl_writedown' ? 'Write-down VRL' :
                             prov.provision_type === 'obsolescence' ? 'Obsolescência' : 'Dano'}
                          </Badge>
                          <Badge
                            className={
                              prov.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              prov.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {prov.status === 'pending' ? 'Pendente' : prov.status === 'approved' ? 'Aprovada' : 'Estornada'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(prov.provision_date)}</span>
                        </div>
                        {prov.status === 'pending' && (
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveProvision(prov.id)}
                          >
                            <CheckCircle className="w-3 h-3" />
                            Aprovar
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Custo: </span>
                          <span className="font-medium">{formatCurrency(prov.cost_before)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">VRL: </span>
                          <span className="font-medium">{formatCurrency(prov.vrl)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Provisão: </span>
                          <span className="font-semibold text-red-700">{formatCurrency(prov.provision_amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {provisionsPagination.totalPages > 1 && (
                <Pagination className="mt-3">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => fetchProvisions(provisionsPagination.page - 1)}
                        aria-disabled={provisionsPagination.page <= 1}
                        className={provisionsPagination.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-xs px-3 py-2">Página {provisionsPagination.page} de {provisionsPagination.totalPages}</span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => fetchProvisions(provisionsPagination.page + 1)}
                        aria-disabled={provisionsPagination.page >= provisionsPagination.totalPages}
                        className={provisionsPagination.page >= provisionsPagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-base sm:text-lg">Configuração de Contas</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure as contas contábeis para cada tipo de movimentação
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {configs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Carregando configurações...
                </p>
              ) : (
                <div className="space-y-2">
                  {configs.map((config) => (
                    <AccountingConfigRow
                      key={config.id}
                      config={config}
                      onEdit={(c) => {
                        setSelectedConfig(c);
                        setIsConfigDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isConfigDialogOpen} onOpenChange={(open) => {
        setIsConfigDialogOpen(open);
        if (!open) setSelectedConfig(null);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuração Contábil</DialogTitle>
            <DialogDescription>
              Configure as contas de débito e crédito para este tipo de movimentação
            </DialogDescription>
          </DialogHeader>
          {selectedConfig && (
            <ConfigEditForm
              config={selectedConfig}
              onSubmit={handleConfigSubmit}
              onCancel={() => {
                setIsConfigDialogOpen(false);
                setSelectedConfig(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
