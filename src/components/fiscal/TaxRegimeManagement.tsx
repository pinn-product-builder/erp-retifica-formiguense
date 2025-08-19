
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useFiscal, TaxRegime } from '@/hooks/useFiscal';
import { format } from 'date-fns';

export function TaxRegimeManagement() {
  const [taxRegimes, setTaxRegimes] = useState<TaxRegime[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegime, setEditingRegime] = useState<TaxRegime | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    effective_from: '',
    effective_to: ''
  });

  const { loading, getTaxRegimes, createTaxRegime, updateTaxRegime, deleteTaxRegime } = useFiscal();

  useEffect(() => {
    loadTaxRegimes();
  }, []);

  const loadTaxRegimes = async () => {
    const data = await getTaxRegimes();
    setTaxRegimes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      effective_from: formData.effective_from || undefined,
      effective_to: formData.effective_to || undefined
    };
    
    if (editingRegime) {
      await updateTaxRegime(editingRegime.id!, payload);
    } else {
      await createTaxRegime(payload);
    }
    
    setIsDialogOpen(false);
    setEditingRegime(null);
    setFormData({ code: '', name: '', description: '', effective_from: '', effective_to: '' });
    loadTaxRegimes();
  };

  const handleEdit = (regime: TaxRegime) => {
    setEditingRegime(regime);
    setFormData({
      code: regime.code,
      name: regime.name,
      description: regime.description || '',
      effective_from: regime.effective_from ? regime.effective_from.split('T')[0] : '',
      effective_to: regime.effective_to ? regime.effective_to.split('T')[0] : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este regime tributário?')) {
      await deleteTaxRegime(id);
      loadTaxRegimes();
    }
  };

  const isRegimeActive = (regime: TaxRegime) => {
    const now = new Date();
    const effectiveFrom = regime.effective_from ? new Date(regime.effective_from) : null;
    const effectiveTo = regime.effective_to ? new Date(regime.effective_to) : null;

    if (effectiveFrom && effectiveFrom > now) return false;
    if (effectiveTo && effectiveTo < now) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Regimes Tributários</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Regime Tributário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingRegime ? 'Editar Regime Tributário' : 'Novo Regime Tributário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: simples_nacional"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Simples Nacional"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do regime tributário"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effective_from">Vigência Inicial</Label>
                  <Input
                    id="effective_from"
                    type="date"
                    value={formData.effective_from}
                    onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="effective_to">Vigência Final</Label>
                  <Input
                    id="effective_to"
                    type="date"
                    value={formData.effective_to}
                    onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingRegime ? 'Atualizar' : 'Criar'}
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
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Vigência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxRegimes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum regime tributário cadastrado
                </TableCell>
              </TableRow>
            ) : (
              taxRegimes.map((regime) => (
                <TableRow key={regime.id}>
                  <TableCell className="font-medium">{regime.code}</TableCell>
                  <TableCell>{regime.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {regime.effective_from && (
                        <div>Início: {format(new Date(regime.effective_from), 'dd/MM/yyyy')}</div>
                      )}
                      {regime.effective_to && (
                        <div>Fim: {format(new Date(regime.effective_to), 'dd/MM/yyyy')}</div>
                      )}
                      {!regime.effective_from && !regime.effective_to && (
                        <span className="text-muted-foreground">Sem período definido</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={isRegimeActive(regime) ? "default" : "secondary"}>
                      {isRegimeActive(regime) ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {regime.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(regime)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(regime.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
