import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { parseNFeXml, type NFeData } from '@/services/NFeXmlService';
import { formatBRL, formatDateBR } from '@/lib/financialFormat';

export default function ImportarXmlEstoque() {
  const [nfe, setNfe] = useState<NFeData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setNfe(null);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const xml = ev.target?.result as string;
        const data = parseNFeXml(xml);
        setNfe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar XML');
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      setError('Falha ao ler o arquivo');
      setParsing(false);
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setNfe(null);
    setFileName(null);
    setError(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importar XML (estoque)</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tela de testes para parser de NF-e. Carrega o XML e exibe o conteúdo extraído (cabeçalho,
          itens e duplicatas). A integração com entrada de estoque e o mapeamento código fabricante
          ↔ item interno serão habilitados na próxima etapa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Arquivo XML
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label
            htmlFor="xml-file"
            className="hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center"
          >
            <FileText className="text-muted-foreground h-8 w-8" />
            <p className="text-sm font-medium">
              {fileName ?? 'Clique para selecionar um arquivo .xml de NF-e'}
            </p>
            <p className="text-muted-foreground text-xs">
              Os dados são processados localmente — nada é enviado ao servidor neste teste.
            </p>
            <input
              id="xml-file"
              type="file"
              accept=".xml,application/xml,text/xml"
              className="sr-only"
              onChange={handleFile}
            />
          </label>
          {(nfe || error) && (
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                Limpar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {parsing && (
        <p className="text-muted-foreground text-sm">Processando XML…</p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível ler o XML</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {nfe && (
        <>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>XML processado</AlertTitle>
            <AlertDescription>
              Chave de acesso{' '}
              <span className="break-all font-mono text-xs">{nfe.chave_acesso || '—'}</span>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cabeçalho</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs">Emitente</p>
                <p className="font-medium">{nfe.emitente.razao_social || '—'}</p>
                <p className="text-muted-foreground text-xs">CNPJ {nfe.emitente.cnpj || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">NF-e</p>
                <p className="font-medium">
                  {nfe.numero || '—'}
                  {nfe.serie ? ` · série ${nfe.serie}` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Emissão</p>
                <p className="font-medium">
                  {nfe.data_emissao ? formatDateBR(nfe.data_emissao) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total da nota</p>
                <p className="text-success font-medium">{formatBRL(nfe.totais.valor_total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Produtos</p>
                <p className="font-medium">{formatBRL(nfe.totais.valor_produtos)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Frete · Desconto</p>
                <p className="font-medium">
                  {formatBRL(nfe.totais.valor_frete)} · {formatBRL(nfe.totais.valor_desconto)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">ICMS · IPI</p>
                <p className="font-medium">
                  {formatBRL(nfe.totais.valor_icms)} · {formatBRL(nfe.totais.valor_ipi)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Itens ({nfe.itens.length})</span>
                <Badge variant="outline">Sem entrada no estoque (preview)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>NCM</TableHead>
                    <TableHead>CFOP</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead>Un.</TableHead>
                    <TableHead className="text-right">V. unit.</TableHead>
                    <TableHead className="text-right">V. total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nfe.itens.map((it, idx) => (
                    <TableRow key={`${it.codigo}-${idx}`}>
                      <TableCell className="font-mono text-xs">{it.codigo || '—'}</TableCell>
                      <TableCell className="max-w-[24rem] truncate" title={it.descricao}>
                        {it.descricao || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{it.ncm || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{it.cfop || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.quantidade.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{it.unidade || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(it.valor_unitario)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatBRL(it.valor_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {nfe.itens.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground text-center">
                        Nenhum item encontrado no XML
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {nfe.duplicatas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Duplicatas ({nfe.duplicatas.length})</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfe.duplicatas.map((dup, idx) => (
                      <TableRow key={`${dup.numero}-${idx}`}>
                        <TableCell className="font-mono text-xs">{dup.numero || '—'}</TableCell>
                        <TableCell>{dup.vencimento ? formatDateBR(dup.vencimento) : '—'}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatBRL(dup.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
