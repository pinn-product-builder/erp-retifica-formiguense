
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { useFiscal, FiscalClassification } from '@/hooks/useFiscal';

export function FiscalClassificationManagement() {
  const [classifications, setClassifications] = useState<FiscalClassification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClassification, setEditingClassification] = useState<FiscalClassification | null>(null);
  const [formData, setFormData] = useState({
    type: 'produto' as 'produto' | 'servico',
    ncm_code: '',
    service_code: '',
    cest: '',
    description: ''
  });

  const { loading, getFiscalClassifications, createFiscalClassification } = useFiscal();

  useEffect(() => {
    loadClassifications();
  }, []);

  const loadClassifications = async () => {
    const data = await getFiscalClassifications();
    setClassifications(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      ncm_code: formData.ncm_code || undefined,
      service_code: formData.service_code || undefined,
      cest: formData.cest || undefined
    };
    
    await createFiscalClassification(payload);
    
    setIsDialogOpen(false);
    setEditingClassification(null);
    setFormData({ type: 'produto', ncm_code: '', service_code: '', cest: '', description: '' });
    loadClassifications();
  };

  const handleEdit = (classification: FiscalClassification) => {
    setEditingClassification(classification);
    setFormData({
      type: classification.type,
      ncm_code: classification.ncm_code || '',
      service_code: classification.service_code || '',
      cest: classification.cest || '',
      description: classification.description
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Classificações Fiscais</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Classificação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingClassification ? 'Editar Classificação' : 'Nova Classificação Fiscal'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as unknown })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="produto">Produto</SelectItem>
                      <SelectItem value="servico">Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da classificação"
                    required
                  />
                </div>
              </div>

              {formData.type === 'produto' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ncm_code">Código NCM</Label>
                    <Input
                      id="ncm_code"
                      value={formData.ncm_code}
                      onChange={(e) => setFormData({ ...formData, ncm_code: e.target.value })}
                      placeholder="Ex: 8703.24.10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cest">Código CEST</Label>
                    <Input
                      id="cest"
                      value={formData.cest}
                      onChange={(e) => setFormData({ ...formData, cest: e.target.value })}
                      placeholder="Ex: 01.001.00"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="service_code">Código de Serviço (LC 116)</Label>
                  <Input
                    id="service_code"
                    value={formData.service_code}
                    onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                    placeholder="Ex: 1.01"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingClassification ? 'Atualizar' : 'Criar'}
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
              <TableHead>Tipo</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>CEST</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma classificação fiscal cadastrada
                </TableCell>
              </TableRow>
            ) : (
              classifications.map((classification) => (
                <TableRow key={classification.id}>
                  <TableCell>
                    <Badge variant={classification.type === 'produto' ? 'default' : 'secondary'}>
                      {classification.type === 'produto' ? 'Produto' : 'Serviço'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {classification.type === 'produto' 
                      ? classification.ncm_code 
                      : classification.service_code}
                  </TableCell>
                  <TableCell>{classification.cest}</TableCell>
                  <TableCell>{classification.description}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(classification)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
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
