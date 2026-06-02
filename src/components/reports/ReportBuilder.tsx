import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, FileText, FileSpreadsheet, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';
import { useFinancialOrgScope } from '@/hooks/useFinancialOrgScope';
import { ALL_REPORTS, getReportById } from '@/services/reports/definitions';
import { ReportEngine } from '@/services/reports/reportEngine';
import { getExporter } from '@/services/reports/exporters';
import type {
  ReportDefinition,
  ReportExecuteResult,
  ReportField,
  ReportFilter,
  ReportFilterValues,
  ReportExportFormat,
} from '@/services/reports/types';
import { formatCell } from '@/services/reports/exporters/formatValue';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthIso(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function lastDayOfMonthIso(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d.toISOString().slice(0, 10);
}

function buildDefaultFilters(definition: ReportDefinition): ReportFilterValues {
  const out: ReportFilterValues = {};
  for (const f of definition.filters) {
    if (f.defaultValue !== undefined) {
      out[f.key] = f.defaultValue;
      continue;
    }
    if (f.type === 'date-range') {
      out[f.key] = { from: firstDayOfMonthIso(), to: lastDayOfMonthIso() };
    } else if (f.type === 'multi-select') {
      out[f.key] = [];
    } else if (f.type === 'select') {
      out[f.key] = f.options?.[0]?.value ?? '';
    } else {
      out[f.key] = '';
    }
  }
  return out;
}

function buildDefaultFields(definition: ReportDefinition): string[] {
  return definition.fields.filter((f) => f.defaultVisible).map((f) => f.key);
}

interface FilterInputProps {
  filter: ReportFilter;
  value: unknown;
  onChange: (v: unknown) => void;
}

function FilterInput({ filter, value, onChange }: FilterInputProps) {
  switch (filter.type) {
    case 'date-range': {
      const v = (value as { from?: string; to?: string } | undefined) ?? {};
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input
              type="date"
              value={v.from ?? ''}
              onChange={(e) => onChange({ ...v, from: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input
              type="date"
              value={v.to ?? ''}
              onChange={(e) => onChange({ ...v, to: e.target.value })}
            />
          </div>
        </div>
      );
    }
    case 'date-single':
      return (
        <Input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'select':
      return (
        <Select value={(value as string) ?? ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {filter.options?.map((o) => (
              <SelectItem key={o.value} value={o.value === '' ? '__all__' : o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'multi-select': {
      const arr = (value as string[] | undefined) ?? [];
      return (
        <div className="flex flex-wrap gap-2 rounded-md border bg-background p-2">
          {filter.options?.map((o) => {
            const checked = arr.includes(o.value);
            return (
              <label
                key={o.value}
                className="flex items-center gap-1.5 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    if (c) onChange([...arr, o.value]);
                    else onChange(arr.filter((x) => x !== o.value));
                  }}
                />
                {o.label}
              </label>
            );
          })}
          {arr.length === 0 && (
            <span className="text-xs text-muted-foreground">Nenhum filtrado (todos)</span>
          )}
        </div>
      );
    }
    case 'text':
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={filter.description ?? ''}
        />
      );
    case 'customer':
    case 'supplier':
    case 'cost-center':
      return (
        <Input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`ID do ${filter.label.toLowerCase()} (opcional)`}
        />
      );
    case 'org-scope':
      return (
        <div className="text-xs text-muted-foreground rounded-md border bg-muted/40 p-2">
          Use o seletor de empresa no topo da página. Consolidação automática quando há grupo econômico.
        </div>
      );
    default:
      return null;
  }
}

interface PreviewTableProps {
  result: ReportExecuteResult;
  fields: ReportField[];
}

function PreviewTable({ result, fields }: PreviewTableProps) {
  if (result.totalRows === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Nenhum dado encontrado com os filtros atuais.
      </div>
    );
  }

  const maxRowsPreview = 50;

  if (result.groups && result.groups.length > 0) {
    return (
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cyan-700 text-white">
              <tr>
                {fields.map((f) => (
                  <th key={f.key} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.groups.map((group) => (
                <>
                  <tr key={`g-${group.groupKey}`} className="bg-cyan-50">
                    <td colSpan={fields.length} className="px-3 py-2 font-medium text-cyan-700">
                      ▼ {group.groupLabel} ({group.rows.length})
                    </td>
                  </tr>
                  {group.rows.slice(0, maxRowsPreview).map((row, i) => (
                    <tr key={`r-${group.groupKey}-${i}`} className="border-t hover:bg-muted/40">
                      {fields.map((f) => (
                        <td
                          key={f.key}
                          className={`px-3 py-1.5 whitespace-nowrap ${
                            ['currency', 'number', 'percent'].includes(f.type) ? 'text-right tabular-nums' : ''
                          }`}
                        >
                          {formatCell(row[f.key], f)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {group.rows.length > maxRowsPreview && (
                    <tr>
                      <td colSpan={fields.length} className="px-3 py-1.5 text-xs text-muted-foreground italic">
                        … +{group.rows.length - maxRowsPreview} linhas. Exporte para ver todas.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-muted/50 italic">
                    <td className="px-3 py-1.5 font-medium">Subtotal</td>
                    {fields.slice(1).map((f) => (
                      <td
                        key={f.key}
                        className={`px-3 py-1.5 font-medium ${
                          ['currency', 'number', 'percent'].includes(f.type) ? 'text-right tabular-nums' : ''
                        }`}
                      >
                        {group.subtotals[f.key] !== undefined
                          ? formatCell(group.subtotals[f.key], f)
                          : ''}
                      </td>
                    ))}
                  </tr>
                </>
              ))}
              {Object.keys(result.totals).length > 0 && (
                <tr className="border-t-2 border-cyan-700 bg-cyan-50 font-bold">
                  <td className="px-3 py-2">TOTAL</td>
                  {fields.slice(1).map((f) => (
                    <td
                      key={f.key}
                      className={`px-3 py-2 ${
                        ['currency', 'number', 'percent'].includes(f.type) ? 'text-right tabular-nums' : ''
                      }`}
                    >
                      {result.totals[f.key] !== undefined ? formatCell(result.totals[f.key], f) : ''}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const rowsToShow = result.rows.slice(0, maxRowsPreview);
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-cyan-700 text-white">
            <tr>
              {fields.map((f) => (
                <th key={f.key} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map((row, i) => (
              <tr key={i} className="border-t hover:bg-muted/40">
                {fields.map((f) => (
                  <td
                    key={f.key}
                    className={`px-3 py-1.5 whitespace-nowrap ${
                      ['currency', 'number', 'percent'].includes(f.type) ? 'text-right tabular-nums' : ''
                    }`}
                  >
                    {formatCell(row[f.key], f)}
                  </td>
                ))}
              </tr>
            ))}
            {result.totalRows > maxRowsPreview && (
              <tr>
                <td colSpan={fields.length} className="px-3 py-2 text-xs italic text-muted-foreground bg-muted/30">
                  Mostrando {maxRowsPreview} de {result.totalRows} registros. Exporte para ver todos.
                </td>
              </tr>
            )}
            {Object.keys(result.totals).length > 0 && (
              <tr className="border-t-2 border-cyan-700 bg-cyan-50 font-bold">
                <td className="px-3 py-2">TOTAL</td>
                {fields.slice(1).map((f) => (
                  <td
                    key={f.key}
                    className={`px-3 py-2 ${
                      ['currency', 'number', 'percent'].includes(f.type) ? 'text-right tabular-nums' : ''
                    }`}
                  >
                    {result.totals[f.key] !== undefined ? formatCell(result.totals[f.key], f) : ''}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReportBuilder() {
  const { currentOrganization } = useOrganization();
  const orgScopeHook = useFinancialOrgScope();
  const orgId = currentOrganization?.id ?? '';

  const [selectedReportId, setSelectedReportId] = useState<string>(ALL_REPORTS[0].id);
  const definition = useMemo(() => getReportById(selectedReportId)!, [selectedReportId]);

  const [filters, setFilters] = useState<ReportFilterValues>(() => buildDefaultFilters(definition));
  const [selectedFields, setSelectedFields] = useState<string[]>(() => buildDefaultFields(definition));
  const [groupBy, setGroupBy] = useState<string>('');
  const [orderByField, setOrderByField] = useState<string>(definition.defaultOrderBy?.field ?? '');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>(definition.defaultOrderBy?.direction ?? 'asc');

  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState<ReportExportFormat | null>(null);
  const [result, setResult] = useState<ReportExecuteResult | null>(null);

  useEffect(() => {
    setFilters(buildDefaultFilters(definition));
    setSelectedFields(buildDefaultFields(definition));
    setGroupBy('');
    setOrderByField(definition.defaultOrderBy?.field ?? '');
    setOrderDir(definition.defaultOrderBy?.direction ?? 'asc');
    setResult(null);
  }, [definition]);

  const resolvedOrgIds = useMemo(() => {
    const scope = orgScopeHook.scopeSelection;
    if (scope === 'all') return orgScopeHook.groupOrgIds;
    if (scope && typeof scope === 'string') return [scope];
    return orgId ? [orgId] : [];
  }, [orgScopeHook.scopeSelection, orgScopeHook.groupOrgIds, orgId]);

  const orgScope = useMemo(
    () => ({
      mode: (orgScopeHook.scopeSelection === 'all' ? 'consolidated' : 'single') as 'single' | 'consolidated',
      orgIds: resolvedOrgIds,
    }),
    [orgScopeHook.scopeSelection, resolvedOrgIds]
  );

  const handleRun = async () => {
    if (resolvedOrgIds.length === 0) {
      toast.error('Selecione uma empresa no topo da página.');
      return;
    }
    setRunning(true);
    try {
      const r = await ReportEngine.run(definition, {
        orgId,
        orgScope,
        selectedFields,
        filters,
        groupBy: groupBy ? [groupBy] : undefined,
        orderBy: orderByField ? { field: orderByField, direction: orderDir } : undefined,
      });
      setResult(r);
      toast.success(`Relatório gerado: ${r.totalRows} registro(s).`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro: ${msg}`);
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  const handleExport = async (format: ReportExportFormat) => {
    if (!result) {
      toast.error('Execute o relatório primeiro.');
      return;
    }
    setExporting(format);
    try {
      const exporter = await getExporter(format);
      const stamp = new Date().toISOString().slice(0, 10);
      await exporter.export({
        filename: `${definition.id}-${stamp}`,
        title: definition.name,
        subtitle: definition.description,
        result,
        definition,
        selectedFields,
      });
      toast.success(`Arquivo ${format.toUpperCase()} gerado.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao exportar: ${msg}`);
    } finally {
      setExporting(null);
    }
  };

  const fieldsToShow = useMemo(
    () => definition.fields.filter((f) => selectedFields.includes(f.key)),
    [definition.fields, selectedFields]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <CardTitle className="text-lg">Construtor de Relatórios</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione um relatório, configure filtros e campos, gere e exporte.
              </p>
            </div>
            <div className="min-w-[280px]">
              <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_REPORTS.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {r.category}
                        </Badge>
                        {r.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{definition.description}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {definition.filters.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-sm">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
                <FilterInput
                  filter={f}
                  value={filters[f.key]}
                  onChange={(v) => setFilters((s) => ({ ...s, [f.key]: v }))}
                />
                {f.description && (
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                )}
              </div>
            ))}

            <div className="pt-3 border-t space-y-2">
              <Button onClick={handleRun} disabled={running} className="w-full">
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando…
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Gerar relatório
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">
              Campos e agrupamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Colunas visíveis</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2 max-h-[260px] overflow-y-auto rounded-md border p-2 bg-muted/20">
                {definition.fields.map((f) => {
                  const checked = selectedFields.includes(f.key);
                  return (
                    <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          if (c) setSelectedFields((s) => [...s, f.key]);
                          else setSelectedFields((s) => s.filter((k) => k !== f.key));
                        }}
                      />
                      <span className="truncate">{f.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedFields.length} de {definition.fields.length} colunas
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(definition.groupings?.length ?? 0) > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Agrupar por</Label>
                  <Select value={groupBy || '__none__'} onValueChange={(v) => setGroupBy(v === '__none__' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem agrupamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem agrupamento</SelectItem>
                      {definition.groupings?.map((g) => (
                        <SelectItem key={g.key} value={g.key}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ordenar por</Label>
                <Select value={orderByField || '__none__'} onValueChange={(v) => setOrderByField(v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Padrão</SelectItem>
                    {definition.fields.map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Direção</Label>
                <Select value={orderDir} onValueChange={(v) => setOrderDir(v as 'asc' | 'desc')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{definition.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.totalRows} registro(s) · gerado em{' '}
                  {result.meta.generatedAt.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  disabled={exporting !== null}
                >
                  {exporting === 'csv' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('xlsx')}
                  disabled={exporting !== null}
                >
                  {exporting === 'xlsx' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  XLSX
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting !== null}
                >
                  {exporting === 'pdf' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PreviewTable result={result} fields={fieldsToShow} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
