import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePurchaseInvoices } from '@/hooks/usePurchaseInvoices';
import {
  PurchaseInvoice,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '@/services/PurchaseInvoiceService';
import { InvoiceRegistrationModal } from './InvoiceRegistrationModal';
import { ResponsiveTable } from '@/components/ui/responsive-table';

const STATUS_ICONS: Record<PurchaseInvoice['status'], React.ElementType> = {
  pending:   Clock,
  validated: CheckCircle2,
  divergent: AlertTriangle,
};

export function InvoicesManager() {
  const { invoices, isLoading, fetchInvoices } = usePurchaseInvoices();
  const { currentOrganization } = useOrganization();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [registerOpen, setRegisterOpen] = useState(false);

  // US-039: workflow de divergência
  const [analyzeInvoice, setAnalyzeInvoice] = useState<PurchaseInvoice | null>(null);
  const [decision,       setDecision]       = useState<'accept' | 'reject' | ''>('');
  const [justification,  setJustification]  = useState('');
  const [savingDecision, setSavingDecision] = useState(false);

  const handleDecision = async () => {
    if (!analyzeInvoice || !decision || !justification.trim() || !currentOrganization?.id) return;
    setSavingDecision(true);
    try {
      const newStatus: PurchaseInvoice['status'] = decision === 'accept' ? 'validated' : 'pending';
      const notes = `[${decision === 'accept' ? 'Aceito' : 'Recusado'}] ${justification}`;
      await (supabase as any)
        .from('purchase_invoices')
        .update({ status: newStatus, validation_notes: notes })
        .eq('id', analyzeInvoice.id)
        .eq('org_id', currentOrganization.id);
      await fetchInvoices();
      setAnalyzeInvoice(null);
      setDecision('');
      setJustification('');
    } finally {
      setSavingDecision(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.purchase_order?.po_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.purchase_order?.supplier?.name ?? '').toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const stats = {
    total:     invoices.length,
    validated: invoices.filter((i) => i.status === 'validated').length,
    divergent: invoices.filter((i) => i.status === 'divergent').length,
    pending:   invoices.filter((i) => i.status === 'pending').length,
  };

  const handleNewInvoice = () => setRegisterOpen(true);

  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Notas Fiscais de Entrada
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Registre e acompanhe as notas fiscais vinculadas aos pedidos de compra
          </p>
        </div>
        <Button size="sm" onClick={handleNewInvoice} className="h-8 sm:h-9 self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Registrar NF</span>
          <span className="sm:hidden">Nova NF</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: stats.total,     color: 'text-foreground' },
          { label: 'Validadas', value: stats.validated, color: 'text-green-600' },
          { label: 'Divergentes', value: stats.divergent, color: 'text-red-600' },
          { label: 'Pendentes', value: stats.pending,   color: 'text-yellow-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
              <p className={`text-lg sm:text-xl md:text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 sm:h-9 text-sm"
            placeholder="Buscar por NF, pedido ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-8 sm:h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {(Object.keys(INVOICE_STATUS_LABELS) as PurchaseInvoice['status'][]).map((s) => (
              <SelectItem key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <ResponsiveTable
              data={filtered}
              keyExtractor={(inv) => inv.id}
              emptyMessage="Nenhuma nota fiscal encontrada"
              columns={[
                {
                  key: 'invoice_number',
                  header: 'Número NF',
                  mobileLabel: 'NF',
                  priority: 1,
                  minWidth: 120,
                  render: (inv) => (
                    <div>
                      <p className="font-medium text-xs sm:text-sm">{inv.invoice_number}</p>
                      {inv.invoice_series && (
                        <p className="text-xs text-muted-foreground">Série {inv.invoice_series}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'purchase_order',
                  header: 'Pedido',
                  mobileLabel: 'Pedido',
                  priority: 2,
                  minWidth: 110,
                  render: (inv) => (
                    <div>
                      <p className="text-xs sm:text-sm font-medium">
                        {inv.purchase_order?.po_number ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {inv.purchase_order?.supplier?.name ?? ''}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'issue_date',
                  header: 'Emissão',
                  mobileLabel: 'Data',
                  priority: 3,
                  minWidth: 90,
                  hideInMobile: true,
                  render: (inv) => (
                    <span className="text-xs sm:text-sm whitespace-nowrap">{fmtDate(inv.issue_date)}</span>
                  ),
                },
                {
                  key: 'total_invoice',
                  header: 'Valor Total',
                  mobileLabel: 'Valor',
                  priority: 1,
                  minWidth: 110,
                  render: (inv) => (
                    <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                      {formatCurrency(inv.total_invoice)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  mobileLabel: 'Status',
                  priority: 1,
                  minWidth: 110,
                  render: (inv) => {
                    const Icon = STATUS_ICONS[inv.status];
                    return (
                      <Badge
                        variant="outline"
                        className={`text-xs flex items-center gap-1 w-fit ${INVOICE_STATUS_COLORS[inv.status]}`}
                      >
                        <Icon className="h-3 w-3" />
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'validation_notes',
                  header: 'Observações',
                  mobileLabel: 'Obs',
                  priority: 4,
                  minWidth: 160,
                  hideInMobile: true,
                  render: (inv) => (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {inv.validation_notes ?? '—'}
                    </p>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  mobileLabel: '',
                  priority: 1,
                  minWidth: 100,
                  render: (inv) =>
                    inv.status === 'divergent' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setAnalyzeInvoice(inv); setDecision(''); setJustification(''); }}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Analisar
                      </Button>
                    ) : null,
                },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <InvoiceRegistrationModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSuccess={() => fetchInvoices()}
      />

      {/* US-039: Modal de análise de divergência */}
      <Dialog open={!!analyzeInvoice} onOpenChange={(v) => { if (!v) setAnalyzeInvoice(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Conciliação NF x Pedido — NF {analyzeInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>

          {analyzeInvoice && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedido:</span>
                  <span className="font-medium">{analyzeInvoice.purchase_order?.po_number ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fornecedor:</span>
                  <span className="font-medium">{analyzeInvoice.purchase_order?.supplier?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor do Pedido:</span>
                  <span className="font-medium">{formatCurrency(analyzeInvoice.purchase_order?.total_value ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor da NF:</span>
                  <span className="font-medium text-destructive">{formatCurrency(analyzeInvoice.total_invoice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diferença:</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(Math.abs(analyzeInvoice.total_invoice - (analyzeInvoice.purchase_order?.total_value ?? 0)))}
                    {' '}({analyzeInvoice.purchase_order?.total_value
                      ? ((Math.abs(analyzeInvoice.total_invoice - analyzeInvoice.purchase_order.total_value) / analyzeInvoice.purchase_order.total_value) * 100).toFixed(2)
                      : '—'}%)
                  </span>
                </div>
              </div>

              {analyzeInvoice.validation_notes && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                  {analyzeInvoice.validation_notes}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm">Decisão</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDecision('accept')}
                    className={`rounded-lg border-2 p-3 text-sm text-center transition-colors ${
                      decision === 'accept'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
                    Aceitar Diferença
                  </button>
                  <button
                    onClick={() => setDecision('reject')}
                    className={`rounded-lg border-2 p-3 text-sm text-center transition-colors ${
                      decision === 'reject'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <XCircle className="h-4 w-4 mx-auto mb-1" />
                    Recusar NF
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Justificativa <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Descreva o motivo da decisão..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setAnalyzeInvoice(null)} disabled={savingDecision}>
              Cancelar
            </Button>
            <Button
              onClick={handleDecision}
              disabled={!decision || !justification.trim() || savingDecision}
              variant={decision === 'reject' ? 'destructive' : 'default'}
            >
              {savingDecision ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {decision === 'accept' ? 'Confirmar aceite' : decision === 'reject' ? 'Confirmar recusa' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
