
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { useFiscal, TaxRule, TaxRegime, TaxType, FiscalClassification } from '@/hooks/useFiscal';

export function TaxRuleManagement() {
  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [regimes, setRegimes] = useState<TaxRegime[]>([]);
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [classifications, setClassifications] = useState<FiscalClassification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    regime_id: '',
    tax_type_id: '',
    operation: 'venda' as 'venda' | 'compra' | 'prestacao_servico',
    origin_uf: '',
    destination_uf: '',
    classification_id: '',
    calc_method: 'percentual' as unknown,
    rate: '',
    base_reduction: '',
    is_active: true,
    priority: '100',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    formula: ''
  });

  const { loading, getTaxRules, createTaxRule, getTaxRegimes, getTaxTypes, getFiscalClassifications } = useFiscal();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [rulesData, regimesData, taxTypesData, classificationsData] = await Promise.all([
      getTaxRules(),
      getTaxRegimes(),
      getTaxTypes(),
      getFiscalClassifications()
    ]);
    setRules(rulesData);
    setRegimes(regimesData);
    setTaxTypes(taxTypesData);
    setClassifications(classificationsData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: TaxRule = {
      regime_id: formData.regime_id,
      tax_type_id: formData.tax_type_id,
      operation: formData.operation,
      origin_uf: formData.origin_uf || undefined,
      destination_uf: formData.destination_uf || undefined,
      classification_id: formData.classification_id || undefined,
      calc_method: formData.calc_method,
      rate: formData.rate ? parseFloat(formData.rate) : undefined,
      base_reduction: formData.base_reduction ? parseFloat(formData.base_reduction) : undefined,
      is_active: formData.is_active,
      priority: parseInt(formData.priority),
      valid_from: formData.valid_from,
      valid_to: formData.valid_to || undefined,
      formula: formData.formula || undefined
    };
    
    await createTaxRule(payload);
    setIsDialogOpen(false);
    setFormData({
      regime_id: '', tax_type_id: '', operation: 'venda', origin_uf: '', destination_uf: '',
      classification_id: '', calc_method: 'percentual', rate: '', base_reduction: '',
      is_active: true, priority: '100', valid_from: new Date().toISOString().split('T')[0],
      valid_to: '', formula: ''
    });
    loadInitialData();
  };

  const brazilianStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Resetar formulário quando fechar
      setFormData({
        regime_id: '', tax_type_id: '', operation: 'venda', origin_uf: '', destination_uf: '',
        classification_id: '', calc_method: 'percentual', rate: '', base_reduction: '',
        is_active: true, priority: '100', valid_from: new Date().toISOString().split('T')[0],
        valid_to: '', formula: ''
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Regras Fiscais</h3>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra Fiscal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Regra Fiscal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Regime Tributário</Label>
                  <Select value={formData.regime_id} onValueChange={(value) => setFormData({ ...formData, regime_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {regimes.map((regime) => (
                        <SelectItem key={regime.id} value={regime.id!}>{regime.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Tributo</Label>
                  <Select value={formData.tax_type_id} onValueChange={(value) => setFormData({ ...formData, tax_type_id: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id!}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Operação</Label>
                  <Select value={formData.operation} onValueChange={(value) => setFormData({ ...formData, operation: value as unknown })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="prestacao_servico">Prestação de Serviço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>UF Origem</Label>
                  <Select value={formData.origin_uf} onValueChange={(value) => setFormData({ ...formData, origin_uf: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer</SelectItem>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>UF Destino</Label>
                  <Select value={formData.destination_uf} onValueChange={(value) => setFormData({ ...formData, destination_uf: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer</SelectItem>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Método de Cálculo</Label>
                  <Select value={formData.calc_method} onValueChange={(value) => setFormData({ ...formData, calc_method: value as unknown })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual</SelectItem>
                      <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
                      <SelectItem value="isento">Isento</SelectItem>
                      <SelectItem value="nao_incidencia">Não Incidência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alíquota/Valor</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="0.0000"
                  />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>Criar Regra</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regime</TableHead>
              <TableHead>Tributo</TableHead>
              <TableHead>Operação</TableHead>
              <TableHead>Alíquota</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhuma regra fiscal cadastrada
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.tax_regimes?.name}</TableCell>
                  <TableCell>{rule.tax_types?.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.operation}</Badge>
                  </TableCell>
                  <TableCell>{rule.rate}%</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
