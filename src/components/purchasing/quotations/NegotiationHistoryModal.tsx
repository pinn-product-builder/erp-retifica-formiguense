import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge }    from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { HandshakeIcon, TrendingDown, Plus, Loader2, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import {
  NegotiationService,
  NegotiationRound,
  CreateNegotiationInput,
} from '@/services/NegotiationService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NegotiationHistoryModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  quotationId?: string;
  supplierId?:  string;
  supplierName?: string;
}

const emptyForm = (): Omit<CreateNegotiationInput, 'supplier_id'> => ({
  initial_total:          0,
  final_total:            0,
  negotiation_date:       new Date().toISOString().split('T')[0],
  arguments_used:         '',
  supplier_justification: '',
  notes:                  '',
});

export function NegotiationHistoryModal({
  open, onOpenChange, quotationId, supplierId, supplierName,
}: NegotiationHistoryModalProps) {
  const { currentOrganization } = useOrganization();
  const [rounds,  setRounds]  = useState<NegotiationRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState<'history' | 'new'>('history');
  const [form,    setForm]    = useState(emptyForm());

  const fetchRounds = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    try {
      const data = quotationId
        ? await NegotiationService.listByQuotation(quotationId)
        : supplierId
          ? await NegotiationService.listBySupplier(supplierId, currentOrganization.id)
          : await NegotiationService.listByOrg(currentOrganization.id);
      setRounds(data);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id, quotationId, supplierId]);

  useEffect(() => { if (open) fetchRounds(); }, [open, fetchRounds]);

  const handleSave = async () => {
    if (!currentOrganization?.id || !supplierId) return;
    if (!form.initial_total || !form.final_total) {
      toast.error('Informe o valor inicial e o valor final da negociação');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await NegotiationService.create(currentOrganization.id, user?.id ?? '', {
        ...form,
        supplier_id:  supplierId,
        quotation_id: quotationId,
      });
      toast.success('Negociação registrada com sucesso');
      setForm(emptyForm());
      setTab('history');
      fetchRounds();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar negociação');
    } finally {
      setSaving(false);
    }
  };

  const totalSavings   = rounds.reduce((a, b) => a + b.total_savings, 0);
  const avgDiscount    = rounds.length > 0
    ? rounds.reduce((a, b) => a + b.discount_percentage, 0) / rounds.length
    : 0;

  const discountPct = form.initial_total > 0
    ? ((form.initial_total - form.final_total) / form.initial_total) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandshakeIcon className="h-5 w-5 text-primary" />
            Histórico de Negociações{supplierName ? ` — ${supplierName}` : ''}
          </DialogTitle>
          <DialogDescription>
            Registre e consulte o histórico de rodadas de negociação de preço.
          </DialogDescription>
        </DialogHeader>

        {/* Indicadores */}
        {rounds.length > 0 && (
          <div className="grid grid-cols-3 gap-2 py-1">
            {[
              { label: 'Rodadas', value: rounds.length.toString() },
              { label: 'Desc. médio', value: `${avgDiscount.toFixed(1)}%` },
              { label: 'Economia total', value: formatCurrency(totalSavings) },
            ].map((stat) => (
              <Card key={stat.label} className="bg-muted/30">
                <CardContent className="p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <p className="text-sm sm:text-base font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'history' | 'new')} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="history">Histórico ({rounds.length})</TabsTrigger>
            <TabsTrigger value="new" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />Registrar Rodada
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 overflow-y-auto space-y-2 pt-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rounds.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <HandshakeIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma negociação registrada ainda.</p>
              </div>
            ) : (
              rounds.map((r) => (
                <Card key={r.id} className="border-l-4 border-l-primary/30">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">Rodada {r.round_number}</Badge>
                        {r.supplier && <span className="text-xs font-medium">{r.supplier.name}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(new Date(r.negotiation_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Inicial</p>
                        <p className="font-semibold">{formatCurrency(r.initial_total)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Final</p>
                        <p className="font-semibold text-green-700">{formatCurrency(r.final_total)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Desconto</p>
                        <p className="font-semibold flex items-center gap-0.5 text-green-700">
                          <TrendingDown className="h-3 w-3" />
                          {r.discount_percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {r.arguments_used && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Argumentos:</span> {r.arguments_used}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="new" className="flex-1 overflow-y-auto space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Valor Inicial *</Label>
                <Input type="number" min={0} step="0.01"
                  value={form.initial_total || ''}
                  onChange={(e) => setForm((f) => ({ ...f, initial_total: Number(e.target.value) }))}
                  placeholder="R$ 0,00" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Valor Final *</Label>
                <Input type="number" min={0} step="0.01"
                  value={form.final_total || ''}
                  onChange={(e) => setForm((f) => ({ ...f, final_total: Number(e.target.value) }))}
                  placeholder="R$ 0,00" className="text-sm" />
              </div>
            </div>

            {discountPct !== 0 && (
              <div className={`rounded-md p-2 text-xs flex items-center gap-1.5 ${
                discountPct > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <TrendingDown className="h-3.5 w-3.5" />
                Desconto calculado: {discountPct.toFixed(2)}%
                {' | '}Economia: {formatCurrency(form.initial_total - form.final_total)}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">Data da Negociação</Label>
              <Input type="date" value={form.negotiation_date}
                onChange={(e) => setForm((f) => ({ ...f, negotiation_date: e.target.value }))} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Argumentos Utilizados</Label>
              <Textarea rows={2} value={form.arguments_used ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, arguments_used: e.target.value }))}
                placeholder="Ex: Volume maior, referência concorrente, prazo curto..." className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Justificativa do Fornecedor</Label>
              <Textarea rows={2} value={form.supplier_justification ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, supplier_justification: e.target.value }))}
                placeholder="Resposta do fornecedor à negociação..." className="text-sm" />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setForm(emptyForm())}>Limpar</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                Registrar Negociação
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
