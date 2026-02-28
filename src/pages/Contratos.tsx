import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  RefreshCw,
  Edit,
  MoreHorizontal,
  Bell,
  Loader2,
  XCircle,
  Package,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { useContracts } from '@/hooks/useContracts';
import {
  ContractRow,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from '@/services/ContractService';
import { EditContractModal } from '@/components/purchasing/contracts/EditContractModal';
import { RenewContractModal } from '@/components/purchasing/contracts/RenewContractModal';
import { ContractItemPartSelect } from '@/components/purchasing/contracts/ContractItemPartSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSuppliersList } from '@/hooks/useSuppliers';

const ITEMS_PER_PAGE = 10;

export default function Contratos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<ContractRow | null>(null);
  const [contractToRenew, setContractToRenew] = useState<ContractRow | null>(null);

  const statusFilter = activeTab === 'all' ? undefined : activeTab;

  const {
    contracts,
    totalCount,
    totalPages,
    isLoading,
    isSaving,
    createContract,
    updateContract,
    renewContract,
    cancelContract,
    activateContract,
  } = useContracts({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    search: search || undefined,
    status: statusFilter,
  });

  const { suppliers: activeSuppliers } = useSuppliersList();

  const [newForm, setNewForm] = useState({
    supplier_id: '',
    start_date: '',
    end_date: '',
    payment_days: '30',
    discount_percentage: '',
    renewal_notice_days: '30',
    auto_renew: false,
    notes: '',
  });
  const [newFormItems, setNewFormItems] = useState<Array<{ part_code: string; part_name: string; agreed_price: string }>>([]);

  const handleCreateContract = async () => {
    if (!newForm.supplier_id || !newForm.start_date || !newForm.end_date) return;
    const itemsPayload = newFormItems
      .filter((i) => i.part_name.trim() && !Number.isNaN(parseFloat(i.agreed_price)))
      .map((i) => ({
        part_code: i.part_code.trim() || undefined,
        part_name: i.part_name.trim(),
        agreed_price: parseFloat(i.agreed_price),
      }));
    const ok = await createContract({
      supplier_id: newForm.supplier_id,
      start_date: newForm.start_date,
      end_date: newForm.end_date,
      payment_days: parseInt(newForm.payment_days),
      discount_percentage: newForm.discount_percentage ? parseFloat(newForm.discount_percentage) : null,
      renewal_notice_days: parseInt(newForm.renewal_notice_days),
      auto_renew: newForm.auto_renew,
      notes: newForm.notes || null,
      items: itemsPayload,
    });
    if (ok) {
      setNewModalOpen(false);
      setNewForm({ supplier_id: '', start_date: '', end_date: '', payment_days: '30', discount_percentage: '', renewal_notice_days: '30', auto_renew: false, notes: '' });
      setNewFormItems([]);
    }
  };

  const handleEdit = (contract: ContractRow) => {
    setContractToEdit(contract);
    setDetailsOpen(false);
    setEditOpen(true);
  };

  const handleRenew = (contract: ContractRow) => {
    setContractToRenew(contract);
    setDetailsOpen(false);
    setRenewOpen(true);
  };

  const handleCancel = async (contractId: string) => {
    await cancelContract(contractId);
    setDetailsOpen(false);
    setSelectedContract(null);
  };

  const handleActivate = async (contract: ContractRow) => {
    const ok = await activateContract(contract.id);
    if (ok) {
      setDetailsOpen(false);
      setSelectedContract(null);
    }
  };

  const handleView = (contract: ContractRow) => {
    setSelectedContract(contract);
    setDetailsOpen(true);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const daysToExpire = (endDate: string) => differenceInDays(new Date(endDate), new Date());

  const statusStats = {
    active: contracts.filter((c) => c.status === 'active').length,
    expiring: contracts.filter((c) => c.status === 'expiring').length,
    expired: contracts.filter((c) => c.status === 'expired').length,
    totalValue: contracts.filter((c) => c.status === 'active').reduce((s, c) => s + c.total_value, 0),
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <EditContractModal
        open={editOpen}
        onOpenChange={setEditOpen}
        contract={contractToEdit}
        onSave={updateContract}
      />
      <RenewContractModal
        open={renewOpen}
        onOpenChange={setRenewOpen}
        contract={contractToRenew}
        onSave={(id, payload) => renewContract(id, payload)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            Contratos de Fornecimento
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
            Gerencie contratos com fornecedores
          </p>
        </div>
        <Button onClick={() => setNewModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="rounded-full p-2 bg-green-100 dark:bg-green-900/20 shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Ativos</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{statusStats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="rounded-full p-2 bg-amber-100 dark:bg-amber-900/20 shrink-0">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">A Vencer</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">{statusStats.expiring}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="rounded-full p-2 bg-red-100 dark:bg-red-900/20 shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Expirados</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-destructive">{statusStats.expired}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="rounded-full p-2 bg-blue-100 dark:bg-blue-900/20 shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Valor Ativo</p>
              <p className="text-sm sm:text-base md:text-lg font-bold whitespace-nowrap truncate text-blue-700">
                {formatCurrency(statusStats.totalValue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número do contrato..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="overflow-x-auto flex w-full sm:w-auto h-auto gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm flex-shrink-0">Todos</TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm flex-shrink-0">Ativos</TabsTrigger>
          <TabsTrigger value="expiring" className="text-xs sm:text-sm flex-shrink-0 text-amber-600">A Vencer</TabsTrigger>
          <TabsTrigger value="expired" className="text-xs sm:text-sm flex-shrink-0">Expirados</TabsTrigger>
          <TabsTrigger value="draft" className="text-xs sm:text-sm flex-shrink-0">Rascunho</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-medium">Nenhum contrato encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">Crie um novo contrato para começar.</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Vigência</TableHead>
                          <TableHead>Itens</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contracts.map((contract) => (
                          <TableRow
                            key={contract.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleView(contract)}
                          >
                            <TableCell className="font-medium">{contract.contract_number}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {contract.supplier?.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                                <div className="text-muted-foreground text-xs">
                                  até {format(new Date(contract.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{contract.items.length}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(contract.total_value)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-xs border ${CONTRACT_STATUS_COLORS[contract.status]}`}
                              >
                                {CONTRACT_STATUS_LABELS[contract.status]}
                                {contract.status === 'expiring' && (
                                  <span className="ml-1">({daysToExpire(contract.end_date)}d)</span>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(contract); }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  {contract.status === 'draft' && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleActivate(contract); }}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Ativar
                                    </DropdownMenuItem>
                                  )}
                                  {['expiring', 'expired'].includes(contract.status) && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenew(contract); }}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Renovar
                                    </DropdownMenuItem>
                                  )}
                                  {contract.status !== 'cancelled' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={(e) => { e.stopPropagation(); handleCancel(contract.id); }}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancelar
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-3 p-3">
                    {contracts.map((contract) => (
                      <Card
                        key={contract.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleView(contract)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{contract.contract_number}</p>
                              <p className="text-xs text-muted-foreground truncate">{contract.supplier?.name}</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs border shrink-0 ${CONTRACT_STATUS_COLORS[contract.status]}`}
                            >
                              {CONTRACT_STATUS_LABELS[contract.status]}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(contract.start_date), 'dd/MM/yy')} — {format(new Date(contract.end_date), 'dd/MM/yy')}
                            </span>
                            <span className="text-right font-medium text-foreground">
                              {formatCurrency(contract.total_value)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                      <span className="text-muted-foreground">
                        {totalCount} contratos
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => p - 1)}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => p + 1)}
                        >
                          Próximo
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={(o) => { setDetailsOpen(o); if (!o) setSelectedContract(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contrato {selectedContract?.contract_number}
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{selectedContract.supplier?.name}</p>
                    {selectedContract.supplier?.cnpj && (
                      <p className="text-xs text-muted-foreground">{selectedContract.supplier.cnpj}</p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`border ${CONTRACT_STATUS_COLORS[selectedContract.status]}`}
                >
                  {CONTRACT_STATUS_LABELS[selectedContract.status]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Início', value: format(new Date(selectedContract.start_date), 'dd/MM/yyyy', { locale: ptBR }) },
                  { label: 'Término', value: format(new Date(selectedContract.end_date), 'dd/MM/yyyy', { locale: ptBR }) },
                  { label: 'Pagamento', value: `${selectedContract.payment_days} dias` },
                  { label: 'Desconto', value: `${selectedContract.discount_percentage ?? 0}%` },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-medium text-sm">{item.value}</p>
                  </div>
                ))}
              </div>

              {selectedContract.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Itens do Contrato</p>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Preço Acordado</TableHead>
                          <TableHead className="text-right">Qtd. Mín.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedContract.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono text-xs">{item.part_code || '—'}</TableCell>
                            <TableCell className="text-sm">{item.part_name}</TableCell>
                            <TableCell className="text-right text-sm whitespace-nowrap">
                              {formatCurrency(item.agreed_price)}
                            </TableCell>
                            <TableCell className="text-right text-sm">{item.min_quantity ?? '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {selectedContract.notes && (
                <div className="p-3 rounded-md bg-muted/30 border text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p>{selectedContract.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
                {selectedContract.auto_renew && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <RefreshCw className="h-3 w-3" />
                    Renovação automática
                  </Badge>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(selectedContract)}>
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Editar
                  </Button>
                  {selectedContract.status === 'draft' && (
                    <Button size="sm" onClick={() => handleActivate(selectedContract)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                      Ativar
                    </Button>
                  )}
                  {['expiring', 'expired'].includes(selectedContract.status) && (
                    <Button size="sm" onClick={() => handleRenew(selectedContract)}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Renovar
                    </Button>
                  )}
                  {selectedContract.status !== 'cancelled' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(selectedContract.id)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contrato de Fornecimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Select value={newForm.supplier_id} onValueChange={(v) => setNewForm({ ...newForm, supplier_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-start">Data de Início</Label>
                <Input id="new-start" type="date" value={newForm.start_date} onChange={(e) => setNewForm({ ...newForm, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-end">Data de Término</Label>
                <Input id="new-end" type="date" value={newForm.end_date} onChange={(e) => setNewForm({ ...newForm, end_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prazo Pagamento (dias)</Label>
                <Input type="number" min={1} value={newForm.payment_days} onChange={(e) => setNewForm({ ...newForm, payment_days: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input type="number" step="0.1" min={0} max={100} value={newForm.discount_percentage} onChange={(e) => setNewForm({ ...newForm, discount_percentage: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Aviso renovação (dias)</Label>
                <Input type="number" min={1} value={newForm.renewal_notice_days} onChange={(e) => setNewForm({ ...newForm, renewal_notice_days: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label>Renovação Automática</Label>
                <p className="text-xs text-muted-foreground">Renovar ao expirar</p>
              </div>
              <Switch checked={newForm.auto_renew} onCheckedChange={(v) => setNewForm({ ...newForm, auto_renew: v })} />
            </div>

            <div className="space-y-2">
              <Label>Itens (opcional na criação, obrigatório para ativar)</Label>
              <ContractItemPartSelect
                onSelect={(part) =>
                  setNewFormItems((prev) => [
                    ...prev,
                    { part_code: part.part_code, part_name: part.part_name, agreed_price: String(part.agreed_price) },
                  ])
                }
                excludePartCodes={newFormItems.map((i) => i.part_code).filter(Boolean)}
                className="w-full"
              />
              {newFormItems.length > 0 && (
                <div className="space-y-2 mt-2">
                  {newFormItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center p-2 rounded-md border bg-muted/30">
                      <div className="flex-1 min-w-0 text-sm truncate">
                        {item.part_code ? `${item.part_code} - ` : ''}{item.part_name}
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Preço"
                        value={item.agreed_price}
                        onChange={(e) =>
                          setNewFormItems((prev) =>
                            prev.map((it, i) => (i === idx ? { ...it, agreed_price: e.target.value } : it))
                          )
                        }
                        className="w-24 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => setNewFormItems((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={newForm.notes} onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })} placeholder="Condições especiais..." rows={3} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setNewModalOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button
              onClick={handleCreateContract}
              disabled={isSaving || !newForm.supplier_id || !newForm.start_date || !newForm.end_date}
              className="w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
