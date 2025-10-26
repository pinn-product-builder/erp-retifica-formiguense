import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Plus } from 'lucide-react';
import { useFiscal } from '@/hooks/useFiscal';
import { toast } from 'sonner';

interface CompanyFiscalSetting {
  id?: string;
  org_name: string;
  cnpj?: string;
  state?: string;
  municipality_code?: string;
  regime_id: string;
  effective_from: string;
  effective_to?: string;
  tax_regimes?: { name: string; code: string };
}

export function CompanyFiscalSettings() {
  const [settings, setSettings] = useState<CompanyFiscalSetting[]>([]);
  const [taxRegimes, setTaxRegimes] = useState<Array<Record<string, unknown>>>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<Partial<CompanyFiscalSetting>>({
    org_name: '',
    cnpj: '',
    state: '',
    municipality_code: '',
    regime_id: '',
    effective_from: new Date().toISOString().split('T')[0]
  });

  const { 
    getCompanyFiscalSettings, 
    createCompanyFiscalSetting, 
    updateCompanyFiscalSetting,
    getTaxRegimes
  } = useFiscal();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [settingsData, regimesData] = await Promise.all([
      getCompanyFiscalSettings(),
      getTaxRegimes()
    ]);
    
    setSettings(settingsData);
    setTaxRegimes(regimesData);
    
    // Se há configuração ativa, carrega como padrão
    const activeSetting = settingsData.find(s => !s.effective_to || new Date(s.effective_to) >= new Date());
    if (activeSetting && !isEditing) {
      setCurrentSetting({
        ...activeSetting,
        effective_from: activeSetting.effective_from?.split('T')[0],
        effective_to: activeSetting.effective_to?.split('T')[0]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSetting.org_name || !currentSetting.regime_id) {
      toast.error('Nome da empresa e regime tributário são obrigatórios');
      return;
    }

    const settingData = {
      ...currentSetting,
      cnpj: currentSetting.cnpj || undefined,
      state: currentSetting.state || undefined,
      municipality_code: currentSetting.municipality_code || undefined,
      effective_to: currentSetting.effective_to || undefined
    } as CompanyFiscalSetting;

    let result;
    if (isEditing && currentSetting.id) {
      result = await updateCompanyFiscalSetting(currentSetting.id, settingData);
    } else {
      result = await createCompanyFiscalSetting(settingData);
    }

    if (result) {
      await loadInitialData();
      setIsEditing(false);
      toast.success('Configurações fiscais salvas com sucesso');
    }
  };

  const handleNewSettings = () => {
    setIsEditing(true);
    setCurrentSetting({
      org_name: '',
      cnpj: '',
      state: '',
      municipality_code: '',
      regime_id: '',
      effective_from: new Date().toISOString().split('T')[0]
    });
  };

  const isSettingActive = (setting: CompanyFiscalSetting) => {
    const today = new Date();
    const effectiveFrom = new Date(setting.effective_from);
    const effectiveTo = setting.effective_to ? new Date(setting.effective_to) : null;
    
    return effectiveFrom <= today && (!effectiveTo || effectiveTo >= today);
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
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
          <h3 className="text-lg font-semibold">Configurações Fiscais da Empresa</h3>
          <p className="text-sm text-muted-foreground">
            Configure o regime tributário e dados fiscais da empresa
          </p>
        </div>
        <Button onClick={handleNewSettings}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {isEditing ? 'Nova Configuração' : 'Configuração Atual'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org_name">Nome da Empresa *</Label>
                <Input
                  id="org_name"
                  placeholder="Ex: Minha Empresa LTDA"
                  value={currentSetting.org_name || ''}
                  onChange={(e) => setCurrentSetting({...currentSetting, org_name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0001-00"
                  value={currentSetting.cnpj || ''}
                  onChange={(e) => setCurrentSetting({...currentSetting, cnpj: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select 
                    value={currentSetting.state || ''} 
                    onValueChange={(value) => setCurrentSetting({...currentSetting, state: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="municipality_code">Código Município</Label>
                  <Input
                    id="municipality_code"
                    placeholder="Ex: 3550308"
                    value={currentSetting.municipality_code || ''}
                    onChange={(e) => setCurrentSetting({...currentSetting, municipality_code: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regime_id">Regime Tributário *</Label>
                <Select 
                  value={currentSetting.regime_id || ''} 
                  onValueChange={(value) => setCurrentSetting({...currentSetting, regime_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o regime tributário" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxRegimes.map((regime) => (
                      <SelectItem key={regime.id} value={regime.id}>
                        {regime.code} - {regime.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effective_from">Válido Desde *</Label>
                  <Input
                    id="effective_from"
                    type="date"
                    value={currentSetting.effective_from || ''}
                    onChange={(e) => setCurrentSetting({...currentSetting, effective_from: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective_to">Válido Até</Label>
                  <Input
                    id="effective_to"
                    type="date"
                    value={currentSetting.effective_to || ''}
                    onChange={(e) => setCurrentSetting({...currentSetting, effective_to: e.target.value})}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Histórico de Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhuma configuração encontrada
                </p>
              ) : (
                settings.map((setting) => (
                  <div 
                    key={setting.id} 
                    className="p-3 border rounded-lg space-y-2 cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setCurrentSetting({
                        ...setting,
                        effective_from: setting.effective_from?.split('T')[0],
                        effective_to: setting.effective_to?.split('T')[0]
                      });
                      setIsEditing(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{setting.org_name}</div>
                      <Badge variant={isSettingActive(setting) ? 'default' : 'secondary'}>
                        {isSettingActive(setting) ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {setting.cnpj && <div>CNPJ: {formatCNPJ(setting.cnpj)}</div>}
                      <div>Regime: {setting.tax_regimes?.name}</div>
                      <div>
                        Período: {new Date(setting.effective_from).toLocaleDateString('pt-BR')}
                        {setting.effective_to && ` - ${new Date(setting.effective_to).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}