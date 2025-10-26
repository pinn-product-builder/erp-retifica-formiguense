
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, FileText, Download, Trash2, FileSpreadsheet, FileJson } from 'lucide-react';
import { useFiscal } from '@/hooks/useFiscal';
import { toast } from 'sonner';

const ObligationManagement = () => {
  const {
    loading,
    getObligations,
    getObligationKinds,
    createObligation,
    getObligationFiles,
    generateObligationFile,
    downloadObligationFile,
    deleteObligationFile
  } = useFiscal();

  const [obligations, setObligations] = useState<Array<Record<string, unknown>>>([]);
  const [obligationKinds, setObligationKinds] = useState<Array<Record<string, unknown>>>([]);
  const [obligationFiles, setObligationFiles] = useState<Record<string, Array<Record<string, unknown>>>>({});
  const [selectedObligation, setSelectedObligation] = useState<unknown>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [newObligation, setNewObligation] = useState({
    obligation_kind_id: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear()
  });
  const [fileGeneration, setFileGeneration] = useState({
    fileType: 'TAX_SUMMARY',
    format: 'csv' as 'csv' | 'json'
  });

  const loadData = async () => {
    const [obligationsData, kindsData] = await Promise.all([
      getObligations(),
      getObligationKinds()
    ]);
    setObligations(obligationsData);
    setObligationKinds(kindsData);

    // Load files for each obligation
    const filesData: Record<string, Array<Record<string, unknown>>> = {};
    for (const obligation of obligationsData) {
      filesData[obligation.id] = await getObligationFiles(obligation.id);
    }
    setObligationFiles(filesData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateObligation = async () => {
    if (!newObligation.obligation_kind_id) {
      toast.error('Selecione um tipo de obrigação');
      return;
    }

    // Create the obligation data object with only the required fields for creation
    const obligationData = {
      obligation_kind_id: newObligation.obligation_kind_id,
      period_month: newObligation.period_month,
      period_year: newObligation.period_year
    };

    const result = await createObligation(obligationData);
    if (result) {
      setIsCreateDialogOpen(false);
      setNewObligation({
        obligation_kind_id: '',
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear()
      });
      loadData();
    }
  };

  const handleGenerateFile = async () => {
    if (!selectedObligation) return;

    const result = await generateObligationFile({
      obligationId: (selectedObligation as { id: string }).id,
      fileType: fileGeneration.fileType,
      format: fileGeneration.format
    });

    if (result) {
      setIsFileDialogOpen(false);
      // Reload files for this obligation
      const files = await getObligationFiles((selectedObligation as { id: string }).id);
      setObligationFiles(prev => ({
        ...prev,
        [(selectedObligation as { id: string }).id]: files
      }));
    }
  };

  const handleDownloadFile = async (file: unknown) => {
    const f = file as { file_path: string; file_name: string };
    await downloadObligationFile(f.file_path, f.file_name);
  };

  const handleDeleteFile = async (file: unknown) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir este arquivo?');
    if (confirmed) {
      const f = file as { id: string; file_path: string };
      const success = await deleteObligationFile(f.id, f.file_path);
      if (success && selectedObligation) {
        // Reload files for this obligation
        const files = await getObligationFiles((selectedObligation as { id: string }).id);
        setObligationFiles(prev => ({
          ...prev,
          [(selectedObligation as { id: string }).id]: files
        }));
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'rascunho': 'outline',
      'gerado': 'default',
      'validado': 'secondary',
      'enviado': 'secondary',
      'erro': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('json')) return <FileJson className="h-4 w-4" />;
    return <FileSpreadsheet className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Obrigações Acessórias</h2>
          <p className="text-muted-foreground">Gerencie obrigações fiscais e arquivos</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Obrigação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Obrigação</DialogTitle>
              <DialogDescription>
                Crie uma nova obrigação acessória para um período específico
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="obligation_kind">Tipo de Obrigação</Label>
                <Select
                  value={newObligation.obligation_kind_id}
                  onValueChange={(value) => setNewObligation(prev => ({ ...prev, obligation_kind_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {obligationKinds.map((kind) => {
                      const k = kind as { id: string; name: string; code: string };
                      return (
                      <SelectItem key={k.id} value={k.id}>
                        {k.name} ({k.code})
                      </SelectItem>
                    )})}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period_month">Mês</Label>
                  <Select
                    value={newObligation.period_month.toString()}
                    onValueChange={(value) => setNewObligation(prev => ({ ...prev, period_month: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2024, i).toLocaleDateString('pt-BR', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="period_year">Ano</Label>
                  <Select
                    value={newObligation.period_year.toString()}
                    onValueChange={(value) => setNewObligation(prev => ({ ...prev, period_year: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateObligation} disabled={loading}>
                Criar Obrigação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Obrigações</CardTitle>
          <CardDescription>Lista de obrigações acessórias</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arquivos</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obligations.map((obligation) => {
                const o = obligation as { id: string; obligation_kinds?: { name: string; code: string }; period_month: number; period_year: number; status: string; created_at: string };
                return (
                <TableRow key={o.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{o.obligation_kinds?.name}</div>
                      <div className="text-sm text-muted-foreground">{o.obligation_kinds?.code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {o.period_month}/{o.period_year}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(o.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{obligationFiles[o.id]?.length || 0} arquivo(s)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(o.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedObligation(o);
                          setIsFileDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Gerar Arquivo
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Files for each obligation */}
      {obligations.map((obligation) => {
        const o = obligation as { id: string; obligation_kinds?: { name: string }; period_month: number; period_year: number };
        const files = obligationFiles[o.id] || [];
        if (files.length === 0) return null;
        
        return (
          <Card key={o.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                Arquivos - {o.obligation_kinds?.name}
              </CardTitle>
              <CardDescription>
                Período: {o.period_month}/{o.period_year}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Gerado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => {
                    const f = file as { id: string; file_name: string; mime_type: string; file_size: number; file_type: string; size_bytes?: number; generated_at: string; created_at: string; status: string };
                    return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(f.mime_type)}
                          <span className="font-medium">{f.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{f.file_type}</TableCell>
                      <TableCell>
                        {f.size_bytes ? `${(f.size_bytes / 1024).toFixed(1)} KB` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(f.generated_at || f.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(f.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteFile(file)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* File Generation Dialog */}
      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Arquivo</DialogTitle>
            <DialogDescription>
              Gerar arquivo para: {(selectedObligation as { obligation_kinds?: { name: string }; period_month: number; period_year: number })?.obligation_kinds?.name} - 
              {(selectedObligation as { period_month: number; period_year: number })?.period_month}/{(selectedObligation as { period_month: number; period_year: number })?.period_year}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="fileType">Tipo de Arquivo</Label>
              <Select
                value={fileGeneration.fileType}
                onValueChange={(value) => setFileGeneration(prev => ({ ...prev, fileType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TAX_SUMMARY">Resumo Fiscal</SelectItem>
                  <SelectItem value="TAX_CALCULATIONS">Cálculos de Impostos</SelectItem>
                  <SelectItem value="GENERIC_EXPORT">Exportação Genérica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="format">Formato</Label>
              <Select
                value={fileGeneration.format}
                onValueChange={(value) => setFileGeneration(prev => ({ ...prev, format: value as 'csv' | 'json' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateFile} disabled={loading}>
              Gerar Arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ObligationManagement;
