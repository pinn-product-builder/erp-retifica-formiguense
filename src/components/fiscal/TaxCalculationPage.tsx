import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Download } from 'lucide-react';
import { useFiscal, TaxRegime, FiscalClassification, TaxCalculationRequest } from '@/hooks/useFiscal';
import { formatCurrency } from '@/lib/utils';

export function TaxCalculationPage() {
  const [taxRegimes, setTaxRegimes] = useState<TaxRegime[]>([]);
  const [classifications, setClassifications] = useState<FiscalClassification[]>([]);
  const [calculationResult, setCalculationResult] = useState<unknown>(null);
  const [formData, setFormData] = useState({
    regime_id: '',
    operation: 'venda' as 'venda' | 'compra' | 'prestacao_servico',
    classification_id: '',
    amount: '',
    origin_uf: '',
    destination_uf: '',
    notes: ''
  });

  const { loading, getTaxRegimes, getFiscalClassifications, calculateTax } = useFiscal();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [regimesData, classificationsData] = await Promise.all([
      getTaxRegimes(),
      getFiscalClassifications()
    ]);
    setTaxRegimes(regimesData);
    setClassifications(classificationsData);
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const calculation: TaxCalculationRequest = {
      regime_id: formData.regime_id,
      operation: formData.operation,
      classification_id: formData.classification_id || undefined,
      amount: parseFloat(formData.amount),
      origin_uf: formData.origin_uf || undefined,
      destination_uf: formData.destination_uf || undefined,
      notes: formData.notes || undefined
    };

    const result = await calculateTax(calculation);
    if (result) {
      setCalculationResult(result.result);
    }
  };

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulação de Cálculo de Impostos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="regime">Regime Tributário</Label>
                <Select
                  value={formData.regime_id}
                  onValueChange={(value) => setFormData({ ...formData, regime_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxRegimes.map((regime) => (
                      <SelectItem key={regime.id} value={regime.id!}>
                        {regime.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operation">Tipo de Operação</Label>
                <Select
                  value={formData.operation}
                  onValueChange={(value) => setFormData({ ...formData, operation: value as unknown })}
                >
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
                <Label htmlFor="amount">Valor da Operação</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="classification">Classificação Fiscal (Opcional)</Label>
                <Select
                  value={formData.classification_id}
                  onValueChange={(value) => setFormData({ ...formData, classification_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {classifications.map((classification) => (
                      <SelectItem key={classification.id} value={classification.id!}>
                        {classification.description} - {classification.type === 'produto' ? classification.ncm_code : classification.service_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="origin_uf">UF Origem (Opcional)</Label>
                <Select
                  value={formData.origin_uf}
                  onValueChange={(value) => setFormData({ ...formData, origin_uf: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="destination_uf">UF Destino (Opcional)</Label>
                <Select
                  value={formData.destination_uf}
                  onValueChange={(value) => setFormData({ ...formData, destination_uf: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações (Opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o cálculo"
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Impostos
            </Button>
          </form>
        </CardContent>
      </Card>

      {calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculationResult.total_amount)}
                </div>
                <div className="text-sm text-blue-600">Valor Total</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(calculationResult.total_tax)}
                </div>
                <div className="text-sm text-red-600">Total de Impostos</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculationResult.net_amount)}
                </div>
                <div className="text-sm text-green-600">Valor Líquido</div>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tributo</TableHead>
                    <TableHead>Base de Cálculo</TableHead>
                    <TableHead>Alíquota</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculationResult.taxes.map((tax: unknown, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{tax.tax_type}</TableCell>
                      <TableCell>{formatCurrency(tax.base)}</TableCell>
                      <TableCell>{tax.rate}%</TableCell>
                      <TableCell className="font-medium">{formatCurrency(tax.amount)}</TableCell>
                      <TableCell>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {tax.calc_method}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {calculationResult.taxes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum imposto aplicável para esta operação
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {calculationResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Exportar Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                const csvData = [calculationResult];
                // Use the existing export function from useFiscal
                const csvHeaders = ['Data', 'Operação', 'Valor Base', 'Total Impostos', 'Detalhes'];
                const csvRows = csvData.map(calc => [
                  new Date().toLocaleDateString('pt-BR'),
                  formData.operation,
                  formData.amount,
                  calc.total_taxes?.toFixed(2) || '0.00',
                  calc.taxes?.map((t: unknown) => `${t.tax_type}: ${t.amount?.toFixed(2)}`).join('; ') || ''
                ]);

                const csvContent = [csvHeaders, ...csvRows]
                  .map(row => row.map(field => `"${field}"`).join(','))
                  .join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `calculo_fiscal_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Cálculo (CSV)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
