import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings as SettingsIcon,
  Clock,
  Bell,
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Zap,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useApprovalThresholds } from '@/hooks/useApprovalThresholds';
import {
  ApprovalThreshold,
  ThresholdFormData,
  thresholdSchema,
  APPROVAL_TYPE_LABELS,
  ApprovalType,
} from '@/services/ApprovalThresholdService';

const TYPE_ICONS: Record<ApprovalType, React.ElementType> = {
  auto:     Zap,
  single:   Shield,
  multiple: Users,
  chain:    GitBranch,
};

const TYPE_COLORS: Record<ApprovalType, string> = {
  auto:     'bg-green-100 text-green-700 border-green-200',
  single:   'bg-blue-100 text-blue-700 border-blue-200',
  multiple: 'bg-purple-100 text-purple-700 border-purple-200',
  chain:    'bg-orange-100 text-orange-700 border-orange-200',
};

interface ThresholdFormModalProps {
  open:     boolean;
  onClose:  () => void;
  onSave:   (data: ThresholdFormData) => Promise<boolean>;
  initial?: ApprovalThreshold | null;
  isSaving: boolean;
}

function ThresholdFormModal({ open, onClose, onSave, initial, isSaving }: ThresholdFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ThresholdFormData>({
    resolver: zodResolver(thresholdSchema),
    defaultValues: initial
      ? {
          min_value:     initial.min_value,
          max_value:     initial.max_value,
          approval_type: initial.approval_type,
          approvers:     initial.approvers,
          label:         initial.label ?? '',
        }
      : { min_value: 0, max_value: null, approval_type: 'single', approvers: [], label: '' },
  });

  const approvalType = watch('approval_type');

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (data: ThresholdFormData) => {
    const ok = await onSave({
      ...data,
      max_value: (data.max_value as unknown as string) === '' ? null : data.max_value,
    });
    if (ok) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Nível de Aprovação' : 'Novo Nível de Aprovação'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome do Nível</Label>
            <Input
              {...register('label')}
              placeholder="Ex: Nível 1 - Comprador"
              className={errors.label ? 'border-destructive' : ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Mínimo (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0"
                {...register('min_value', { valueAsNumber: true })}
                className={errors.min_value ? 'border-destructive' : ''}
              />
              {errors.min_value && (
                <p className="text-xs text-destructive">{errors.min_value.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Valor Máximo (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Sem limite"
                {...register('max_value', {
                  setValueAs: (v) => (v === '' || v === null ? null : Number(v)),
                })}
                className={errors.max_value ? 'border-destructive' : ''}
              />
              {errors.max_value && (
                <p className="text-xs text-destructive">{errors.max_value.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Aprovação</Label>
            <Select
              value={approvalType}
              onValueChange={(v) => setValue('approval_type', v as ApprovalType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(APPROVAL_TYPE_LABELS) as [ApprovalType, string][]).map(([val, label]) => {
                  const Icon = TYPE_ICONS[val];
                  return (
                    <SelectItem key={val} value={val}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initial ? 'Salvar' : 'Criar Nível'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ApprovalThresholdsSettings() {
  const {
    thresholds,
    isLoading,
    isSaving,
    createThreshold,
    updateThreshold,
    removeThreshold,
  } = useApprovalThresholds();

  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<ApprovalThreshold | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApprovalThreshold | null>(null);

  const [notifications, setNotifications] = useState({
    quotation_pending:     true,
    quotation_expired:     true,
    order_approved:        true,
    order_rejected:        true,
    conditional_expiring:  true,
    contract_expiring:     true,
    low_stock_alert:       true,
    receipt_pending:       true,
  });

  const handleSave = async (data: ThresholdFormData): Promise<boolean> => {
    if (editTarget) return updateThreshold(editTarget.id, data);
    return createThreshold(data);
  };

  const fmtRange = (t: ApprovalThreshold) =>
    `${formatCurrency(t.min_value)} – ${t.max_value ? formatCurrency(t.max_value) : 'Sem limite'}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Configurações de Compras</h1>
          <p className="text-sm text-muted-foreground">Gerencie parâmetros e regras do módulo de compras</p>
        </div>
        <Button onClick={() => toast.success('Configurações salvas!')} className="self-start sm:self-auto">
          <Save className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Salvar Alterações</span>
          <span className="sm:hidden">Salvar</span>
        </Button>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex sm:grid sm:grid-cols-4">
          <TabsTrigger value="approvals" className="flex-shrink-0 gap-1 sm:gap-2 text-xs sm:text-sm">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Aprovações</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-shrink-0 gap-1 sm:gap-2 text-xs sm:text-sm">
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex-shrink-0 gap-1 sm:gap-2 text-xs sm:text-sm">
            <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Parâmetros</span>
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="flex-shrink-0 gap-1 sm:gap-2 text-xs sm:text-sm">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Prazos</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Aprovações ── */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Níveis de Aprovação</CardTitle>
                <CardDescription>Configure faixas de valores e aprovadores para pedidos de compra</CardDescription>
              </div>
              <Button
                onClick={() => { setEditTarget(null); setFormOpen(true); }}
                className="self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Nível
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : thresholds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum nível configurado. As regras padrão estão ativas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nível</TableHead>
                        <TableHead>Faixa de Valor</TableHead>
                        <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {thresholds.map((threshold) => {
                        const Icon = TYPE_ICONS[threshold.approval_type];
                        return (
                          <TableRow key={threshold.id}>
                            <TableCell className="font-medium text-sm">
                              {threshold.label ?? `Faixa ${formatCurrency(threshold.min_value)}+`}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {fmtRange(threshold)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge
                                variant="outline"
                                className={`text-xs flex items-center gap-1 w-fit ${TYPE_COLORS[threshold.approval_type]}`}
                              >
                                <Icon className="h-3 w-3" />
                                {APPROVAL_TYPE_LABELS[threshold.approval_type]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={threshold.is_active}
                                onCheckedChange={() =>
                                  toast.info('Para desativar, use o botão de excluir')
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => { setEditTarget(threshold); setFormOpen(true); }}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setDeleteTarget(threshold)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regras de Aprovação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Aprovação Sequencial</p>
                  <p className="text-sm text-muted-foreground">Exigir aprovação de todos os níveis anteriores</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Permitir Auto-aprovação</p>
                  <p className="text-sm text-muted-foreground">Comprador pode aprovar dentro do seu limite</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Aprovação Emergencial</p>
                  <p className="text-sm text-muted-foreground">Permitir aprovação rápida com justificativa</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Regras padrão */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Regras padrão (quando nenhum nível está configurado)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {[
                { range: 'R$ 0 – R$ 999,99',     label: 'Automático',     color: TYPE_COLORS.auto },
                { range: 'R$ 1.000 – R$ 4.999,99', label: 'Gerente',      color: TYPE_COLORS.single },
                { range: 'R$ 5.000+',             label: 'Administrador',  color: TYPE_COLORS.multiple },
              ].map((row) => (
                <div key={row.range} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">{row.range}</span>
                  <Badge variant="outline" className={`text-xs ${row.color}`}>{row.label}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notificações ── */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>Defina quais eventos devem gerar notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Cotações</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Cotação Pendente de Resposta</p>
                      <p className="text-sm text-muted-foreground">Notificar quando cotação está aguardando fornecedor</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.quotation_pending}
                    onCheckedChange={(v) => setNotifications((p) => ({ ...p, quotation_pending: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-medium">Cotação Vencendo</p>
                      <p className="text-sm text-muted-foreground">Notificar quando prazo da cotação está expirando</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.quotation_expired}
                    onCheckedChange={(v) => setNotifications((p) => ({ ...p, quotation_expired: v }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pedidos</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="font-medium">Pedido Aprovado</p>
                      <p className="text-sm text-muted-foreground">Notificar quando pedido é aprovado</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.order_approved}
                    onCheckedChange={(v) => setNotifications((p) => ({ ...p, order_approved: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <div>
                      <p className="font-medium">Pedido Rejeitado</p>
                      <p className="text-sm text-muted-foreground">Notificar quando pedido é rejeitado</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.order_rejected}
                    onCheckedChange={(v) => setNotifications((p) => ({ ...p, order_rejected: v }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Condicionais e Contratos</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-medium">Condicional Vencendo</p>
                      <p className="text-sm text-muted-foreground">Notificar quando prazo do condicional está expirando</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.conditional_expiring}
                    onCheckedChange={(v) => setNotifications((p) => ({ ...p, conditional_expiring: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-medium">Contrato Vencendo</p>
                      <p className="text-sm text-muted-foreground">Notificar quando contrato está próximo do vencimento</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.contract_expiring}
                    onCheckedChange={(v) => setNotifications((p) => ({ ...p, contract_expiring: v }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Canais de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações no Sistema</p>
                  <p className="text-sm text-muted-foreground">Exibir alertas na interface</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações por E-mail</p>
                  <p className="text-sm text-muted-foreground">Enviar e-mails para eventos críticos</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resumo Diário</p>
                  <p className="text-sm text-muted-foreground">Enviar resumo diário de pendências</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Parâmetros ── */}
        <TabsContent value="parameters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prefixo de Pedido de Compra</Label>
                  <Input defaultValue="PC-" />
                </div>
                <div className="space-y-2">
                  <Label>Mínimo de Cotações por Compra</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 cotação</SelectItem>
                      <SelectItem value="2">2 cotações</SelectItem>
                      <SelectItem value="3">3 cotações</SelectItem>
                      <SelectItem value="5">5 cotações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Integração com Estoque</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Baixa Automática no Recebimento</p>
                    <p className="text-sm text-muted-foreground">Atualizar estoque automaticamente ao conferir mercadorias</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Gerar Necessidade de Compra</p>
                    <p className="text-sm text-muted-foreground">Criar necessidades automaticamente quando estoque mínimo</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reservar Estoque em Condicionais</p>
                    <p className="text-sm text-muted-foreground">Bloquear itens em análise no estoque</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Prazos ── */}
        <TabsContent value="deadlines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Prazos</CardTitle>
              <CardDescription>Defina prazos padrão para processos de compras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Processo</TableHead>
                      <TableHead>Prazo (dias)</TableHead>
                      <TableHead className="hidden sm:table-cell">Alerta (dias antes)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: 'Prazo de Cotação',         days: 5,  alert: 2  },
                      { name: 'Prazo Condicional',         days: 7,  alert: 2  },
                      { name: 'Alerta Renovação Contrato', days: 30, alert: 15 },
                      { name: 'Prazo Padrão Pagamento',    days: 30, alert: 5  },
                    ].map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium text-sm">{row.name}</TableCell>
                        <TableCell>
                          <Input type="number" className="w-20 h-8" defaultValue={row.days} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Input type="number" className="w-20 h-8" defaultValue={row.alert} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prazos de Condicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prazo Padrão Condicional (dias)</Label>
                  <Input type="number" defaultValue="7" />
                </div>
                <div className="space-y-2">
                  <Label>Máximo de Prorrogações</Label>
                  <Input type="number" defaultValue="2" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alerta Amarelo (dias antes)</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label>Alerta Vermelho (dias antes)</Label>
                  <Input type="number" defaultValue="1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal criar/editar */}
      <ThresholdFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
        isSaving={isSaving}
      />

      {/* Confirmar exclusão */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover nível de aprovação?</AlertDialogTitle>
            <AlertDialogDescription>
              O nível{' '}
              <strong>
                {deleteTarget?.label ?? (deleteTarget ? fmtRange(deleteTarget) : '')}
              </strong>{' '}
              será desativado. Pedidos nessa faixa voltarão a usar as regras padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) {
                  await removeThreshold(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
