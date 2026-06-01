import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArCollectionRulesService,
  type ArCollectionRule,
  type ArCollectionRuleStep,
  type CollectionOffsetType,
} from '@/services/financial/arCollectionRulesService';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Trash2, Star, Mail } from 'lucide-react';

type StepDraft = Pick<
  ArCollectionRuleStep,
  'offset_days' | 'offset_type' | 'subject' | 'body' | 'is_active'
>;

function offsetLabel(days: number, type: CollectionOffsetType): string {
  if (days === 0) return 'D0 (no dia)';
  const sign = days > 0 ? `D+${days}` : `D${days}`;
  return type === 'business' ? `${sign} úteis` : sign;
}

export function CollectionRulesManager() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?.id ?? '';
  const [rules, setRules] = useState<ArCollectionRule[]>([]);
  const [stepsByRule, setStepsByRule] = useState<Record<string, ArCollectionRuleStep[]>>({});
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRuleName, setNewRuleName] = useState('Padrão Favarini');
  const [stepDrafts, setStepDrafts] = useState<Record<string, StepDraft>>({});

  const reload = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const list = await ArCollectionRulesService.listRules(orgId);
      setRules(list);
      const allSteps: Record<string, ArCollectionRuleStep[]> = {};
      for (const r of list) {
        allSteps[r.id] = await ArCollectionRulesService.listSteps(r.id);
      }
      setStepsByRule(allSteps);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar réguas');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleCreate = async () => {
    if (!orgId) {
      toast.error('Selecione uma empresa antes de criar uma régua.');
      return;
    }
    if (!newRuleName.trim()) {
      toast.error('Informe um nome para a régua.');
      return;
    }
    setCreating(true);
    try {
      await ArCollectionRulesService.createRuleWithDefaults(
        orgId,
        newRuleName.trim(),
        user?.id ?? null,
        rules.length === 0
      );
      toast.success('Régua criada com 6 passos padrão (D-7 / D0 / D+2 / D+5 / D+15 / D+17).');
      setNewRuleName('Padrão Favarini');
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar régua');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveStep = async (stepId: string) => {
    const patch = stepDrafts[stepId];
    if (!patch) return;
    try {
      await ArCollectionRulesService.updateStep(stepId, patch);
      toast.success('Passo atualizado');
      setStepDrafts((d) => {
        const next = { ...d };
        delete next[stepId];
        return next;
      });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar passo');
    }
  };

  const handleSetDefault = async (ruleId: string) => {
    if (!orgId) return;
    try {
      await ArCollectionRulesService.setDefaultRule(orgId, ruleId);
      toast.success('Régua marcada como padrão');
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao definir padrão');
    }
  };

  const handleToggleActive = async (rule: ArCollectionRule) => {
    try {
      await ArCollectionRulesService.toggleRuleActive(rule.id, !rule.is_active);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  };

  const handleDelete = async (rule: ArCollectionRule) => {
    if (!orgId) return;
    const confirmed = window.confirm(`Excluir a régua "${rule.name}"? Os passos também serão removidos.`);
    if (!confirmed) return;
    try {
      await ArCollectionRulesService.deleteRule(rule.id, orgId);
      toast.success('Régua excluída');
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  };

  const upsertDraft = (step: ArCollectionRuleStep, patch: Partial<StepDraft>) => {
    setStepDrafts((d) => ({
      ...d,
      [step.id]: {
        offset_days: step.offset_days,
        offset_type: step.offset_type,
        subject: step.subject,
        body: step.body,
        is_active: step.is_active,
        ...d[step.id],
        ...patch,
      },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
          Régua automática de cobrança
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
          Configure os e-mails enviados ao cliente em cada marco do vencimento. O disparo automático (fase 2)
          ainda não está ativo — esta tela já permite cadastrar as mensagens.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-1.5 flex-1 min-w-0">
            <Label htmlFor="new-rule-name">Nova régua</Label>
            <Input
              id="new-rule-name"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              placeholder="Ex.: Padrão Favarini"
            />
          </div>
          <Button type="button" disabled={creating || !orgId} onClick={() => void handleCreate()}>
            {creating ? 'Criando…' : 'Criar régua com 6 passos padrão'}
          </Button>
        </div>

        {loading && rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Carregando…</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma régua cadastrada ainda.
          </p>
        ) : (
          <Accordion type="multiple" className="w-full">
            {rules.map((rule) => {
              const steps = stepsByRule[rule.id] ?? [];
              return (
                <AccordionItem key={rule.id} value={rule.id} className="border rounded-md mb-2 px-3">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{rule.name}</span>
                      {rule.is_default && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Star className="h-3 w-3" /> padrão
                        </Badge>
                      )}
                      <Badge variant={rule.is_active ? 'default' : 'outline'} className="text-xs">
                        {rule.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto pr-2">{steps.length} passos</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    <div className="flex flex-wrap gap-2">
                      {!rule.is_default && (
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleSetDefault(rule.id)}>
                          <Star className="h-3 w-3 mr-1" /> Tornar padrão
                        </Button>
                      )}
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleToggleActive(rule)}>
                        {rule.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(rule)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Excluir
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {steps.map((step) => {
                        const draft = stepDrafts[step.id];
                        const merged = {
                          offset_days: draft?.offset_days ?? step.offset_days,
                          offset_type: draft?.offset_type ?? step.offset_type,
                          subject: draft?.subject ?? step.subject,
                          body: draft?.body ?? step.body,
                          is_active: draft?.is_active ?? step.is_active,
                        };
                        const dirty = !!draft;
                        return (
                          <div key={step.id} className="rounded-md border p-3 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {offsetLabel(merged.offset_days, merged.offset_type)}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">{step.step_kind}</Badge>
                              <div className="ml-auto flex items-center gap-2">
                                <Label htmlFor={`active-${step.id}`} className="text-xs">
                                  Ativo
                                </Label>
                                <Switch
                                  id={`active-${step.id}`}
                                  checked={merged.is_active}
                                  onCheckedChange={(v) => upsertDraft(step, { is_active: v })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor={`days-${step.id}`} className="text-xs">
                                  Offset (dias)
                                </Label>
                                <Input
                                  id={`days-${step.id}`}
                                  type="number"
                                  value={merged.offset_days}
                                  onChange={(e) =>
                                    upsertDraft(step, { offset_days: Number(e.target.value) || 0 })
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Tipo</Label>
                                <Select
                                  value={merged.offset_type}
                                  onValueChange={(v) =>
                                    upsertDraft(step, { offset_type: v as CollectionOffsetType })
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="calendar">Dias corridos</SelectItem>
                                    <SelectItem value="business">Dias úteis</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1 sm:col-span-1">
                                <Label htmlFor={`subj-${step.id}`} className="text-xs">
                                  Assunto
                                </Label>
                                <Input
                                  id={`subj-${step.id}`}
                                  value={merged.subject}
                                  onChange={(e) => upsertDraft(step, { subject: e.target.value })}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor={`body-${step.id}`} className="text-xs">
                                Corpo (variáveis: {'{{cliente}}'}, {'{{valor}}'}, {'{{data_vencimento}}'},{' '}
                                {'{{dias_para_vencer}}'})
                              </Label>
                              <Textarea
                                id={`body-${step.id}`}
                                value={merged.body}
                                onChange={(e) => upsertDraft(step, { body: e.target.value })}
                                rows={4}
                                className="text-xs font-mono"
                              />
                            </div>
                            {dirty && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setStepDrafts((d) => {
                                      const n = { ...d };
                                      delete n[step.id];
                                      return n;
                                    })
                                  }
                                >
                                  Cancelar
                                </Button>
                                <Button type="button" size="sm" onClick={() => void handleSaveStep(step.id)}>
                                  Salvar
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
