// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useFiscal } from '@/hooks/useFiscal';
import { formatCurrency } from '@/lib/utils';

interface TaxRateTable {
  id?: string;
  tax_type_id: string;
  classification_id?: string;
  jurisdiction_code: string;
  rate: number;
  base_reduction?: number;
  valid_from: string;
  valid_to?: string;
  tax_types?: unknown;
  fiscal_classifications?: unknown;
}

export function TaxRateTableManagement() {
  const [rateTable, setRateTable] = useState<TaxRateTable[]>([]);
  const [taxTypes, setTaxTypes] = useState<Array<Record<string, unknown>>>([]);
  const [classifications, setClassifications] = useState<Array<Record<string, unknown>>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRateTable | null>(null);
  const [formData, setFormData] = useState<Partial<TaxRateTable>>({
    tax_type_id: '',
    jurisdiction_code: '',
    rate: 0,
    base_reduction: 0,
    valid_from: new Date().toISOString().split('T')[0]
  });

  const { 
    getTaxRateTable, 
    createTaxRateTable, 
    updateTaxRateTable, 
    deleteTaxRateTable,
    getTaxTypes,
    getFiscalClassifications
  } = useFiscal();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [rates, types, classifications] = await Promise.all([
      getTaxRateTable(),
      getTaxTypes(),
      getFiscalClassifications()
    ]);
    
    setRateTable(rates);
    setTaxTypes(types);
    setClassifications(classifications);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rateData = {
      ...formData,
      rate: Number(formData.rate),
      base_reduction: formData.base_reduction ? Number(formData.base_reduction) : undefined
    } as TaxRateTable;

    let result;
    if (editingRate) {
      result = await updateTaxRateTable(editingRate.id!, rateData);
    } else {
      result = await createTaxRateTable(rateData);
    }

    if (result) {
      await loadInitialData();
      setIsDialogOpen(false);
      setEditingRate(null);
      setFormData({
        tax_type_id: '',
        jurisdiction_code: '',
        rate: 0,
        base_reduction: 0,
        valid_from: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleEdit = (rate: TaxRateTable) => {
    setEditingRate(rate);
    setFormData({
      ...rate,
      valid_from: rate.valid_from?.split('T')[0],
      valid_to: rate.valid_to?.split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tabela de alíquotas?')) {
      const success = await deleteTaxRateTable(id);
      if (success) {
        await loadInitialData();
      }
    }
  };

  const isRateActive = (rate: TaxRateTable) => {
    const today = new Date().toISOString().split('T')[0];
    const validFrom = rate.valid_from?.split('T')[0];
    const validTo = rate.valid_to?.split('T')[0];
    
    return validFrom <= today && (!validTo || validTo >= today);
  };

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tabelas de Alíquotas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as alíquotas por tipo de tributo, classificação e jurisdição
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingRate(null);
              setFormData({
                tax_type_id: '',
                jurisdiction_code: '',
                rate: 0,
                base_reduction: 0,
                valid_from: new Date().toISOString().split('T')[0]
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tabela de Alíquotas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRate ? 'Editar Tabela de Alíquotas' : 'Nova Tabela de Alíquotas'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_type_id">Tipo de Tributo *</Label>
                  <Select 
                    value={formData.tax_type_id} 
                    onValueChange={(value) => setFormData({...formData, tax_type_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de tributo" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.code} - {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction_code">UF/Código de Jurisdição *</Label>
                  <Select 
                    value={formData.jurisdiction_code} 
                    onValueChange={(value) => setFormData({...formData, jurisdiction_code: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BR">Nacional (BR)</SelectItem>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification_id">Classificação Fiscal (Opcional)</Label>
                <Select 
                  value={formData.classification_id || ''} 
                  onValueChange={(value) => setFormData({...formData, classification_id: value || undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma classificação (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma (Geral)</SelectItem>
                    {classifications.map((classification) => (
                      <SelectItem key={classification.id} value={classification.id}>
                        {classification.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Alíquota (%) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ex: 18.00"
                    value={formData.rate || ''}
                    onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="base_reduction">Redução de Base (%)</Label>
                  <Input
                    id="base_reduction"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ex: 33.33"
                    value={formData.base_reduction || ''}
                    onChange={(e) => setFormData({...formData, base_reduction: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Válido Desde *</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from || ''}
                    onChange={(e) => setFormData({...formData, valid_from: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valid_to">Válido Até</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={formData.valid_to || ''}
                    onChange={(e) => setFormData({...formData, valid_to: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRate ? 'Atualizar' : 'Criar'}
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
              <TableHead>Tributo</TableHead>
              <TableHead>Jurisdição</TableHead>
              <TableHead>Classificação</TableHead>
              <TableHead>Alíquota</TableHead>
              <TableHead>Red. Base</TableHead>
              <TableHead>Vigência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateTable.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhuma tabela de alíquotas encontrada
                </TableCell>
              </TableRow>
            ) : (
              rateTable.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">
                    {rate.tax_types?.code || 'N/A'} - {rate.tax_types?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{rate.jurisdiction_code}</TableCell>
                  <TableCell>
                    {rate.fiscal_classifications?.description || 'Geral'}
                  </TableCell>
                  <TableCell>{rate.rate}%</TableCell>
                  <TableCell>{rate.base_reduction ? `${rate.base_reduction}%` : '-'}</TableCell>
                  <TableCell>
                    {new Date(rate.valid_from).toLocaleDateString('pt-BR')}
                    {rate.valid_to && ` - ${new Date(rate.valid_to).toLocaleDateString('pt-BR')}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isRateActive(rate) ? 'default' : 'secondary'}>
                      {isRateActive(rate) ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rate)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rate.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
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