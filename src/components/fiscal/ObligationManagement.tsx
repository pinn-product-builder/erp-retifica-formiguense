
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { useFiscal, Obligation, ObligationKind } from '@/hooks/useFiscal';

export function ObligationManagement() {
  const [obligations, setObligations] = useState<any[]>([]);
  const [obligationKinds, setObligationKinds] = useState<ObligationKind[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    obligation_kind_id: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    status: 'rascunho' as any
  });

  const { loading, getObligations, createObligation, getObligationKinds } = useFiscal();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [obligationsData, kindsData] = await Promise.all([
      getObligations(),
      getObligationKinds()
    ]);
    setObligations(obligationsData);
    setObligationKinds(kindsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createObligation(formData);
    setIsDialogOpen(false);
    setFormData({
      obligation_kind_id: '',
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear(),
      status: 'rascunho'
    });
    loadInitialData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-gray-100 text-gray-800';
      case 'gerado': return 'bg-blue-100 text-blue-800';
      case 'validado': return 'bg-yellow-100 text-yellow-800';
      case 'enviado': return 'bg-green-100 text-green-800';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Obrigações Acessórias</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Obrigação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Obrigação Acessória</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tipo de Obrigação</Label>
                <Select value={formData.obligation_kind_id} onValueChange={(value) => setFormData({ ...formData, obligation_kind_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {obligationKinds.map((kind) => (
                      <SelectItem key={kind.id} value={kind.id!}>
                        {kind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mês</Label>
                  <Select 
                    value={formData.period_month.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, period_month: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={formData.period_year}
                    onChange={(e) => setFormData({ ...formData, period_year: parseInt(e.target.value) })}
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Criar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Obrigação</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Protocolo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obligations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhuma obrigação cadastrada
                </TableCell>
              </TableRow>
            ) : (
              obligations.map((obligation) => (
                <TableRow key={obligation.id}>
                  <TableCell className="font-medium">
                    {obligation.obligation_kinds?.name}
                  </TableCell>
                  <TableCell>
                    {String(obligation.period_month).padStart(2, '0')}/{obligation.period_year}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(obligation.status)}>
                      {obligation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{obligation.protocol || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
