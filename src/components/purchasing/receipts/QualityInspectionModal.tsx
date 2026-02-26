import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge }    from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2, XCircle, AlertTriangle, Plus, Trash2, Loader2, ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface QuarantineItem {
  receipt_item_id:       string;
  receipt_id:            string;
  receipt_number:        string;
  receipt_date:          string;
  po_number:             string;
  supplier_name:         string;
  item_name:             string;
  description?:          string;
  received_quantity:     number;
  lot_number?:           string;
  warehouse_location?:   string;
}

type ChecklistResult = 'ok' | 'nok' | 'na';
type InspectionResult = 'approved' | 'rejected' | 'approved_with_notes';

interface ChecklistItem {
  id:     string;
  label:  string;
  result: ChecklistResult;
  notes:  string;
}

interface DefectEntry {
  id:                string;
  type:              string;
  description:       string;
  severity:          'minor' | 'major' | 'critical';
  quantity_affected: number;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { label: 'Quantidade confere com NF',           result: 'ok', notes: '' },
  { label: 'Embalagem sem danos visíveis',         result: 'ok', notes: '' },
  { label: 'Item confere com código/descrição',    result: 'ok', notes: '' },
  { label: 'Ausência de corrosão ou oxidação',     result: 'ok', notes: '' },
  { label: 'Dimensões/especificações corretas',    result: 'ok', notes: '' },
];

const SEVERITY_LABELS: Record<DefectEntry['severity'], string> = {
  minor:    'Menor',
  major:    'Maior',
  critical: 'Crítico',
};
const SEVERITY_COLORS: Record<DefectEntry['severity'], string> = {
  minor:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  major:    'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

interface QualityInspectionModalProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  item:          QuarantineItem | null;
  onSuccess?:    () => void;
}

export function QualityInspectionModal({
  open, onOpenChange, item, onSuccess,
}: QualityInspectionModalProps) {
  const { toast } = useToast();

  const [checklist, setChecklist]         = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((c, i) => ({ ...c, id: String(i) })),
  );
  const [defects,   setDefects]           = useState<DefectEntry[]>([]);
  const [result,    setResult]            = useState<InspectionResult | ''>('');
  const [qtdApproved, setQtdApproved]     = useState<number>(item?.received_quantity ?? 0);
  const [qtdRejected, setQtdRejected]     = useState<number>(0);
  const [finalNotes,  setFinalNotes]      = useState('');
  const [saving,      setSaving]          = useState(false);

  if (!item) return null;

  const updateChecklistItem = (id: string, field: 'result' | 'notes', value: string) =>
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

  const addDefect = () =>
    setDefects(prev => [...prev, {
      id: String(Date.now()), type: '', description: '', severity: 'minor', quantity_affected: 1,
    }]);

  const updateDefect = (id: string, field: keyof DefectEntry, value: unknown) =>
    setDefects(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));

  const removeDefect = (id: string) =>
    setDefects(prev => prev.filter(d => d.id !== id));

  const nokCount = checklist.filter(c => c.result === 'nok').length;

  const handleSave = async () => {
    if (!result) {
      toast({ title: 'Selecione o resultado da inspeção', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const newStatus =
        result === 'approved'            ? 'approved'
        : result === 'rejected'          ? 'rejected'
        : 'approved'; // approved_with_notes → still approved in DB

      const { error } = await supabase
        .from('purchase_receipt_items')
        .update({
          quality_status: newStatus,
          quality_notes: [
            finalNotes,
            defects.length > 0
              ? `Defeitos: ${defects.map(d => `${d.type} (${SEVERITY_LABELS[d.severity]})`).join(', ')}`
              : '',
            result === 'approved_with_notes' ? '[Aprovado com ressalvas]' : '',
          ].filter(Boolean).join(' | ') || null,
          approved_quantity: result === 'rejected' ? 0 : qtdApproved,
          rejected_quantity: qtdRejected,
        })
        .eq('id', item.receipt_item_id);

      if (error) throw error;

      toast({
        title:
          result === 'approved'            ? 'Item aprovado'
          : result === 'rejected'          ? 'Item reprovado'
          : 'Aprovado com ressalvas',
        description: `${item.item_name} — inspeção registrada.`,
        variant: result === 'rejected' ? 'destructive' : 'default',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Erro ao salvar inspeção', variant: 'destructive' });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Conferência de Qualidade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5">
          {/* Cabeçalho do item */}
          <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 space-y-1 text-xs sm:text-sm">
            <p className="font-semibold text-sm sm:text-base">{item.item_name}</p>
            {item.description && <p className="text-muted-foreground">{item.description}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground mt-1">
              <span>PC: <strong className="text-foreground">{item.po_number}</strong></span>
              <span>NF: <strong className="text-foreground">{item.receipt_number}</strong></span>
              <span>Fornecedor: <strong className="text-foreground">{item.supplier_name}</strong></span>
              <span>Qtd. recebida: <strong className="text-foreground">{item.received_quantity}</strong></span>
              {item.lot_number && <span>Lote: <strong className="text-foreground">{item.lot_number}</strong></span>}
            </div>
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 mt-1">Em Quarentena</Badge>
          </div>

          {/* Checklist */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Checklist de Inspeção</h3>
            <div className="space-y-2">
              {checklist.map(c => (
                <div key={c.id} className="flex items-start gap-2 sm:gap-3">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    {(['ok', 'nok', 'na'] as ChecklistResult[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateChecklistItem(c.id, 'result', r)}
                        className={cn(
                          'h-6 w-8 sm:w-10 text-[10px] sm:text-xs rounded border font-medium transition-colors',
                          c.result === r
                            ? r === 'ok'  ? 'bg-green-500 text-white border-green-500'
                              : r === 'nok' ? 'bg-red-500 text-white border-red-500'
                              :               'bg-gray-400 text-white border-gray-400'
                            : 'bg-white text-muted-foreground border-border hover:bg-muted',
                        )}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm">{c.label}</p>
                    {c.result === 'nok' && (
                      <Input
                        value={c.notes}
                        onChange={e => updateChecklistItem(c.id, 'notes', e.target.value)}
                        placeholder="Descreva o problema..."
                        className="mt-1 text-xs h-7"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {nokCount > 0 && (
              <Alert variant="destructive" className="mt-2 py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">{nokCount} item(ns) com não conformidade.</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Defeitos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Defeitos Encontrados</h3>
              <Button type="button" variant="outline" size="sm" onClick={addDefect} className="h-7 text-xs gap-1">
                <Plus className="w-3 h-3" />Adicionar
              </Button>
            </div>
            {defects.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum defeito registrado.</p>
            ) : (
              <div className="space-y-3">
                {defects.map(d => (
                  <div key={d.id} className="border rounded-lg p-2 sm:p-3 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="col-span-2 sm:col-span-1">
                        <Label className="text-[10px] sm:text-xs">Tipo</Label>
                        <Input
                          value={d.type}
                          onChange={e => updateDefect(d.id, 'type', e.target.value)}
                          placeholder="Ex: Amassado"
                          className="h-7 text-xs mt-0.5"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] sm:text-xs">Severidade</Label>
                        <Select value={d.severity} onValueChange={v => updateDefect(d.id, 'severity', v)}>
                          <SelectTrigger className="h-7 text-xs mt-0.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(['minor', 'major', 'critical'] as const).map(s => (
                              <SelectItem key={s} value={s} className="text-xs">
                                <Badge className={cn('text-[10px]', SEVERITY_COLORS[s])}>{SEVERITY_LABELS[s]}</Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] sm:text-xs">Qtd.</Label>
                        <Input
                          type="number" min={1}
                          value={d.quantity_affected}
                          onChange={e => updateDefect(d.id, 'quantity_affected', Number(e.target.value))}
                          className="h-7 text-xs mt-0.5"
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => removeDefect(d.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] sm:text-xs">Descrição</Label>
                      <Textarea
                        value={d.description}
                        onChange={e => updateDefect(d.id, 'description', e.target.value)}
                        placeholder="Descreva o defeito encontrado..."
                        rows={2}
                        className="text-xs mt-0.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantidades aprovadas/reprovadas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs sm:text-sm">Qtd. Aprovada</Label>
              <Input
                type="number" min={0} max={item.received_quantity}
                value={qtdApproved}
                onChange={e => {
                  const v = Math.min(item.received_quantity, Number(e.target.value));
                  setQtdApproved(v);
                  setQtdRejected(item.received_quantity - v);
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Qtd. Reprovada</Label>
              <Input
                type="number" min={0} max={item.received_quantity}
                value={qtdRejected}
                onChange={e => {
                  const v = Math.min(item.received_quantity, Number(e.target.value));
                  setQtdRejected(v);
                  setQtdApproved(item.received_quantity - v);
                }}
                className="mt-1"
              />
            </div>
          </div>

          {/* Resultado final */}
          <div>
            <Label className="text-xs sm:text-sm font-semibold">Resultado da Inspeção *</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {([
                { value: 'approved',            icon: CheckCircle2, label: 'Aprovado',          cls: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' },
                { value: 'approved_with_notes', icon: AlertTriangle, label: 'Com Ressalvas',     cls: 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
                { value: 'rejected',            icon: XCircle,      label: 'Reprovado',         cls: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' },
              ] as const).map(({ value, icon: Icon, label, cls }) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  onClick={() => setResult(value)}
                  className={cn(
                    'flex-1 h-10 text-xs sm:text-sm gap-1.5 border-2 transition-all',
                    cls,
                    result === value ? 'ring-2 ring-offset-1' : '',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </Button>
              ))}
            </div>
          </div>

          {/* Observações finais */}
          <div>
            <Label className="text-xs sm:text-sm">Observações Finais</Label>
            <Textarea
              value={finalNotes}
              onChange={e => setFinalNotes(e.target.value)}
              placeholder="Observações adicionais sobre a inspeção..."
              rows={3}
              className="mt-1 text-xs sm:text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !result}
            className={cn(
              result === 'rejected'  ? 'bg-red-600 hover:bg-red-700'
              : result === 'approved_with_notes' ? 'bg-yellow-600 hover:bg-yellow-700'
              : '',
            )}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
            Salvar Inspeção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
