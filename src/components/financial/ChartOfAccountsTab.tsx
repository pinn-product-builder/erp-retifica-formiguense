import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import {
  ChartOfAccountsService, type ChartAccountRow,
} from '@/services/financial/chartOfAccountsService';

const TIPO_OPTIONS = ['Entradas', 'Saídas', 'Transferência'];

function tipoBadgeClass(tipo: string | null): string {
  switch (tipo) {
    case 'Entradas': return 'bg-green-100 text-green-700 border-green-200';
    case 'Saídas': return 'bg-red-100 text-red-700 border-red-200';
    case 'Transferência': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-muted text-muted-foreground';
  }
}

interface FormState {
  id: string | null;
  conta_contabil: string;
  grupo: string;
  nivel: string;
  tipo: string;
}

const EMPTY_FORM: FormState = { id: null, conta_contabil: '', grupo: '', nivel: '', tipo: 'Saídas' };

export function ChartOfAccountsTab() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id ?? '';

  const [rows, setRows] = useState<ChartAccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [nivelFilter, setNivelFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      setRows(await ChartOfAccountsService.list(orgId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar plano de contas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [orgId]);

  const niveis = useMemo(
    () => Array.from(new Set(rows.map((r) => r.nivel).filter(Boolean))).sort() as string[],
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tipoFilter !== 'all' && r.tipo !== tipoFilter) return false;
      if (nivelFilter !== 'all' && r.nivel !== nivelFilter) return false;
      if (q && !(`${r.conta_contabil} ${r.grupo ?? ''} ${r.nivel ?? ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, tipoFilter, nivelFilter]);

  const counts = useMemo(() => ({
    total: rows.length,
    entradas: rows.filter((r) => r.tipo === 'Entradas').length,
    saidas: rows.filter((r) => r.tipo === 'Saídas').length,
  }), [rows]);

  const openNew = () => { setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (r: ChartAccountRow) => {
    setForm({ id: r.id, conta_contabil: r.conta_contabil, grupo: r.grupo ?? '', nivel: r.nivel ?? '', tipo: r.tipo ?? '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!orgId) { toast.error('Selecione uma organização.'); return; }
    if (!form.conta_contabil.trim()) { toast.error('Informe a conta contábil.'); return; }
    setSaving(true);
    try {
      const payload = { conta_contabil: form.conta_contabil, grupo: form.grupo, nivel: form.nivel, tipo: form.tipo };
      const { error } = form.id
        ? await ChartOfAccountsService.update(form.id, orgId, payload)
        : await ChartOfAccountsService.create(orgId, payload);
      if (error) { toast.error(error.message.includes('duplicate') ? 'Já existe uma conta com esse nome.' : error.message); return; }
      toast.success(form.id ? 'Conta atualizada' : 'Conta adicionada');
      setDialogOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: ChartAccountRow) => {
    if (!orgId) return;
    const { error } = await ChartOfAccountsService.update(r.id, orgId, { is_active: !r.is_active });
    if (error) toast.error(error.message);
    else { toast.success(r.is_active ? 'Conta inativada' : 'Conta ativada'); void load(); }
  };

  const remove = async (r: ChartAccountRow) => {
    if (!orgId) return;
    if (!window.confirm(`Excluir a conta "${r.conta_contabil}"?`)) return;
    const { error } = await ChartOfAccountsService.remove(r.id, orgId);
    if (error) toast.error(error.message);
    else { toast.success('Conta excluída'); void load(); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="text-base sm:text-lg">Plano de Contas</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {counts.total} contas · {counts.entradas} entradas · {counts.saidas} saídas
          </p>
        </div>
        <Button type="button" onClick={openNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nova conta
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por conta, grupo ou nível..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {TIPO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={nivelFilter} onValueChange={setNivelFilter}>
            <SelectTrigger><SelectValue placeholder="Nível" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              {niveis.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta Contábil</TableHead>
                <TableHead className="hidden sm:table-cell">Grupo</TableHead>
                <TableHead className="hidden md:table-cell">Nível</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-sm py-6 text-center">
                    Nenhuma conta encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id} className={r.is_active ? '' : 'opacity-50'}>
                    <TableCell className="font-medium max-w-[220px] truncate">{r.conta_contabil}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{r.grupo ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{r.nivel ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs border ${tipoBadgeClass(r.tipo)}`}>
                        {r.tipo ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={r.is_active} onCheckedChange={() => void toggleActive(r)} aria-label="Ativar conta" />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button type="button" variant="outline" size="sm" className="h-8 text-xs mr-1" onClick={() => openEdit(r)}>
                        Editar
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => void remove(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{form.id ? 'Editar conta' : 'Nova conta contábil'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="coa-conta">Conta Contábil</Label>
                <Input id="coa-conta" value={form.conta_contabil} onChange={(e) => setForm({ ...form, conta_contabil: e.target.value })} placeholder="Ex.: Aluguel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coa-grupo">Grupo</Label>
                <Input id="coa-grupo" value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} placeholder="Ex.: Despesa Administrativa" list="coa-grupos" />
                <datalist id="coa-grupos">
                  {Array.from(new Set(rows.map((r) => r.grupo).filter(Boolean))).map((g) => <option key={g as string} value={g as string} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coa-nivel">Nível</Label>
                <Input id="coa-nivel" value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} placeholder="Ex.: Despesas Variáveis" list="coa-niveis" />
                <datalist id="coa-niveis">
                  {niveis.map((n) => <option key={n} value={n} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo || 'Saídas'} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="button" disabled={saving} onClick={() => void save()}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
