
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useFiscal, TaxType } from '@/hooks/useFiscal';

export function TaxTypeManagement() {
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTaxType, setEditingTaxType] = useState<TaxType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    jurisdiction: 'federal' as 'federal' | 'estadual' | 'municipal',
    description: ''
  });

  const { loading, getTaxTypes, createTaxType, updateTaxType, deleteTaxType } = useFiscal();

  useEffect(() => {
    loadTaxTypes();
  }, []);

  const loadTaxTypes = async () => {
    const data = await getTaxTypes();
    setTaxTypes(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTaxType) {
      await updateTaxType(editingTaxType.id!, formData);
    } else {
      await createTaxType(formData);
    }
    
    setIsDialogOpen(false);
    setEditingTaxType(null);
    setFormData({ code: '', name: '', jurisdiction: 'federal', description: '' });
    loadTaxTypes();
  };

  const handleEdit = (taxType: TaxType) => {
    setEditingTaxType(taxType);
    setFormData({
      code: taxType.code,
      name: taxType.name,
      jurisdiction: taxType.jurisdiction,
      description: taxType.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este tipo de tributo?')) {
      await deleteTaxType(id);
      loadTaxTypes();
    }
  };

  const getJurisdictionColor = (jurisdiction: string) => {
    switch (jurisdiction) {
      case 'federal': return 'bg-blue-100 text-blue-800';
      case 'estadual': return 'bg-green-100 text-green-800';
      case 'municipal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tipos de Tributos</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo de Tributo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTaxType ? 'Editar Tipo de Tributo' : 'Novo Tipo de Tributo'}
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
                    placeholder="Ex: ICMS, ISS, IPI"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jurisdiction">Jurisdição</Label>
                  <Select
                    value={formData.jurisdiction}
                    onValueChange={(value) => setFormData({ ...formData, jurisdiction: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="federal">Federal</SelectItem>
                      <SelectItem value="estadual">Estadual</SelectItem>
                      <SelectItem value="municipal">Municipal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Imposto sobre Circulação de Mercadorias"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do tributo"
                  rows={3}
                />
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
                  {editingTaxType ? 'Atualizar' : 'Criar'}
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
              <TableHead>Jurisdição</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum tipo de tributo cadastrado
                </TableCell>
              </TableRow>
            ) : (
              taxTypes.map((taxType) => (
                <TableRow key={taxType.id}>
                  <TableCell className="font-medium">{taxType.code}</TableCell>
                  <TableCell>{taxType.name}</TableCell>
                  <TableCell>
                    <Badge className={getJurisdictionColor(taxType.jurisdiction)}>
                      {taxType.jurisdiction}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {taxType.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(taxType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(taxType.id!)}
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
