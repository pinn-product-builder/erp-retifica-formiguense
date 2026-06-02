/**
 * Configura a regra de alteração de peças em OS após aprovação.
 * Task ClickUp 86agmy9k7.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';
import {
  PartsChangeRulesService,
  type PartsChangeRule,
} from '@/services/workshopOsParts/partsChangeRulesService';

export function PartsChangeRulesConfig() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const [rule, setRule] = useState<PartsChangeRule>({
    allowAfterApproval: false,
    autoThresholdAmount: null,
  });
  const [thresholdInput, setThresholdInput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentOrganization?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const r = await PartsChangeRulesService.get(currentOrganization.id);
        if (cancelled) return;
        setRule(r);
        setThresholdInput(
          r.autoThresholdAmount !== null ? String(r.autoThresholdAmount.toFixed(2)) : ''
        );
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        toast({ title: 'Erro ao carregar regra', description: msg, variant: 'destructive' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentOrganization?.id, toast]);

  const handleSave = async () => {
    if (!currentOrganization?.id) return;
    const threshold = thresholdInput.trim() === '' ? null : Number(thresholdInput.replace(',', '.'));
    if (threshold !== null && (!Number.isFinite(threshold) || threshold < 0)) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor numérico não negativo (ou deixe em branco para sem limite).',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id ?? null;
      const saved = await PartsChangeRulesService.upsert(
        currentOrganization.id,
        {
          allowAfterApproval: rule.allowAfterApproval,
          autoThresholdAmount: threshold,
        },
        userId
      );
      setRule(saved);
      setThresholdInput(saved.autoThresholdAmount !== null ? String(saved.autoThresholdAmount.toFixed(2)) : '');
      toast({ title: 'Regra salva', description: 'Configuração atualizada com sucesso.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Erro ao salvar', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Alteração de peças após aprovação da OS
          </CardTitle>
          <CardDescription>
            Permite que o almoxarifado inclua, substitua ou exclua peças em OS já aprovadas, sem
            depender do comercial. Toda alteração fica registrada no log de auditoria com o
            responsável.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="allow-after-approval" className="text-sm font-medium">
                Habilitar alteração pelo almoxarifado
              </Label>
              <p className="text-xs text-muted-foreground">
                Quando desativado, OS aprovadas ficam bloqueadas para inclusão/remoção/substituição
                de peças até reabertura pelo comercial.
              </p>
            </div>
            <Switch
              id="allow-after-approval"
              checked={rule.allowAfterApproval}
              onCheckedChange={(checked) =>
                setRule((prev) => ({ ...prev, allowAfterApproval: checked }))
              }
            />
          </div>

          <div className={rule.allowAfterApproval ? 'space-y-2' : 'space-y-2 opacity-50 pointer-events-none'}>
            <Label htmlFor="auto-threshold" className="text-sm font-medium">
              Valor máximo automático (R$)
            </Label>
            <Input
              id="auto-threshold"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="Sem limite"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              disabled={!rule.allowAfterApproval}
            />
            <p className="text-xs text-muted-foreground">
              Alterações cujo valor (qtd × preço unitário) ultrapassar esse limite serão bloqueadas
              mesmo com a regra habilitada. Deixe em branco para não impor limite.
            </p>
          </div>

          {!rule.allowAfterApproval && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-900">
                Regra desativada: peças de OS aprovadas só podem ser alteradas pelo fluxo comercial.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar configuração
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
