# Módulo Fiscal

## Visão Geral

O módulo fiscal do ERP Retífica é uma solução completa para gestão das obrigações fiscais e tributárias da empresa, incluindo classificações, regimes, regras de cálculo e relatórios fiscais.

## Funcionalidades Principais

### 📋 **Gestão de Obrigações Fiscais**
- Cadastro e controle de obrigações
- Calendário de vencimentos
- Alertas automáticos
- Histórico de entregas

### 🏷️ **Classificações Fiscais**
- NCM (Nomenclatura Comum do Mercosul)
- CFOP (Código Fiscal de Operações)
- CST/CSOSN (Código de Situação Tributária)
- Gestão de exceções

### ⚖️ **Regimes Tributários**
- Simples Nacional
- Lucro Presumido
- Lucro Real
- Configurações específicas por regime

### 🧮 **Cálculos Tributários**
- ICMS, IPI, PIS, COFINS
- Substituição tributária
- Diferencial de alíquotas
- Regras customizáveis

### 📊 **Relatórios Fiscais**
- SPED Fiscal
- SPED Contribuições
- Declarações diversas
- Relatórios gerenciais

## Estrutura do Banco de Dados

### Principais Tabelas

```sql
-- Jurisdições fiscais
jurisdictions
├── id (UUID)
├── org_id (UUID)
├── name (TEXT)
├── code (TEXT)
├── level (TEXT) -- 'federal', 'state', 'municipal'
└── is_active (BOOLEAN)

-- Tipos de obrigação
obligation_kinds
├── id (UUID)
├── org_id (UUID)
├── name (TEXT)
├── code (TEXT)
├── jurisdiction_id (UUID)
└── frequency (TEXT)

-- Obrigações da empresa
fiscal_obligations
├── id (UUID)
├── org_id (UUID)
├── obligation_kind_id (UUID)
├── due_day (INTEGER)
├── config (JSONB)
└── is_active (BOOLEAN)

-- Regimes tributários
tax_regimes
├── id (UUID)
├── org_id (UUID)
├── name (TEXT)
├── code (TEXT)
└── settings (JSONB)

-- Tipos de imposto
tax_types
├── id (UUID)
├── org_id (UUID)
├── name (TEXT)
├── code (TEXT)
└── calculation_method (TEXT)

-- Tabelas de alíquotas
tax_rate_tables
├── id (UUID)
├── org_id (UUID)
├── tax_type_id (UUID)
├── jurisdiction_id (UUID)
├── rate (DECIMAL)
├── valid_from (DATE)
└── valid_to (DATE)

-- Regras de cálculo
tax_rules
├── id (UUID)
├── org_id (UUID)
├── name (TEXT)
├── conditions (JSONB)
├── actions (JSONB)
└── priority (INTEGER)

-- Classificações fiscais
fiscal_classifications
├── id (UUID)
├── org_id (UUID)
├── code (TEXT)
├── description (TEXT)
├── classification_type (TEXT) -- 'NCM', 'CFOP', 'CST'
└── parent_id (UUID)
```

## Componentes Principais

### 1. **ApuracaoFiscal.tsx**
Componente principal para apuração de impostos.

```typescript
interface ApuracaoFiscalProps {
  period: {
    startDate: Date;
    endDate: Date;
  };
  taxRegime: TaxRegime;
  onCalculate: (results: TaxCalculationResult[]) => void;
}
```

### 2. **ObligationManagement.tsx**
Gestão completa de obrigações fiscais.

```typescript
interface ObligationData {
  id: string;
  name: string;
  obligationKind: ObligationKind;
  dueDay: number;
  frequency: 'monthly' | 'quarterly' | 'annual';
  nextDue: Date;
  status: 'pending' | 'delivered' | 'overdue';
}
```

### 3. **TaxCalculationPage.tsx**
Interface para cálculos tributários.

```typescript
interface TaxCalculationInput {
  baseValue: number;
  product: Product;
  operation: FiscalOperation;
  customer?: Customer;
  supplier?: Supplier;
}
```

### 4. **FiscalClassificationManagement.tsx**
Gestão de classificações fiscais (NCM, CFOP, CST).

### 5. **TaxReports.tsx**
Geração de relatórios fiscais e exportações.

## Hooks Customizados

### useFiscal.ts

```typescript
export const useFiscal = () => {
  const [obligations, setObligations] = useState<FiscalObligation[]>([]);
  const [taxRegimes, setTaxRegimes] = useState<TaxRegime[]>([]);
  const [loading, setLoading] = useState(false);

  const calculateTax = async (input: TaxCalculationInput) => {
    // Lógica de cálculo tributário
  };

  const getUpcomingObligations = () => {
    // Lista obrigações próximas do vencimento
  };

  const generateFiscalReport = async (type: ReportType, period: Period) => {
    // Geração de relatórios
  };

  return {
    obligations,
    taxRegimes,
    loading,
    calculateTax,
    getUpcomingObligations,
    generateFiscalReport
  };
};
```

## Configurações por Regime

### Simples Nacional

```json
{
  "regime": "simples_nacional",
  "annexes": ["I", "II", "III"],
  "billing_limit": 4800000.00,
  "tax_rates": {
    "das": {
      "range_1": { "min": 0, "max": 180000, "rate": 0.04 },
      "range_2": { "min": 180001, "max": 360000, "rate": 0.073 }
    }
  },
  "obligations": [
    {
      "name": "PGDAS-D",
      "frequency": "monthly",
      "due_day": 20
    }
  ]
}
```

### Lucro Presumido

```json
{
  "regime": "lucro_presumido",
  "presumption_rates": {
    "irpj": 0.08,
    "csll": 0.12
  },
  "obligations": [
    {
      "name": "DCTF",
      "frequency": "monthly",
      "due_day": 15
    },
    {
      "name": "DIPJ",
      "frequency": "annual",
      "due_day": 31,
      "due_month": 5
    }
  ]
}
```

## Regras de Cálculo

### Engine de Regras

```typescript
interface TaxRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

interface RuleAction {
  type: 'set_rate' | 'add_tax' | 'exempt' | 'reduce_base';
  parameters: Record<string, any>;
}

// Exemplo de regra
const icmsRule: TaxRule = {
  id: 'icms-interstate',
  name: 'ICMS Interestadual',
  conditions: [
    { field: 'customer.state', operator: 'not_equals', value: 'SP' },
    { field: 'product.ncm', operator: 'equals', value: '12345678' }
  ],
  actions: [
    { type: 'set_rate', parameters: { rate: 0.12 } }
  ],
  priority: 1
};
```

### Aplicação de Regras

```typescript
const applyTaxRules = (
  input: TaxCalculationInput,
  rules: TaxRule[]
): TaxCalculationResult => {
  const sortedRules = rules.sort((a, b) => a.priority - b.priority);
  let result = createDefaultResult(input);

  for (const rule of sortedRules) {
    if (evaluateConditions(rule.conditions, input)) {
      result = applyActions(rule.actions, result);
    }
  }

  return result;
};
```

## Integrações

### SPED Fiscal

```typescript
const generateSpedFiscal = async (
  orgId: string,
  period: Period
): Promise<SpedFile> => {
  const blocks = await Promise.all([
    generateBlock0(orgId), // Abertura e identificação
    generateBlockC(orgId, period), // Documentos fiscais
    generateBlockE(orgId, period), // Apuração ICMS/IPI
    generateBlockH(orgId, period), // Inventário
  ]);

  return createSpedFile(blocks);
};
```

### Receita Federal

```typescript
const submitToReceita = async (
  document: FiscalDocument,
  credentials: ReceitaCredentials
): Promise<SubmissionResult> => {
  const encrypted = encryptDocument(document, credentials.certificate);
  const signed = signDocument(encrypted, credentials.privateKey);
  
  return await receitaAPI.submit(signed);
};
```

## Relatórios Disponíveis

### 1. **Livro Registro de Apuração do IPI**
- Período: Mensal
- Dados: Entradas, saídas, saldos
- Formato: PDF, Excel

### 2. **Demonstrativo de Apuração de Contribuições Sociais**
- Período: Mensal
- Impostos: PIS, COFINS
- Regime: Cumulativo/Não-cumulativo

### 3. **Relatório de Movimentação de ICMS**
- Período: Mensal
- Detalhamento por CFOP
- Saldos anterior e atual

### 4. **Posição Fiscal de Estoque**
- Data: Específica
- Valorização: Custo médio
- Classificação: Por NCM

## Compliance e Auditoria

### Log de Operações

```sql
CREATE TABLE fiscal_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID,
  operation_type TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Validações Obrigatórias

```typescript
const validateFiscalOperation = (operation: FiscalOperation): ValidationResult => {
  const errors: string[] = [];

  // Validar NCM
  if (!operation.product.ncm || !isValidNCM(operation.product.ncm)) {
    errors.push('NCM inválido ou não informado');
  }

  // Validar CFOP
  if (!operation.cfop || !isValidCFOP(operation.cfop)) {
    errors.push('CFOP inválido ou não informado');
  }

  // Validar CST
  if (!operation.cst || !isValidCST(operation.cst, operation.taxRegime)) {
    errors.push('CST incompatível com o regime tributário');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Configuração e Deployment

### Variáveis de Ambiente

```env
# Integração Receita Federal
VITE_RECEITA_ENDPOINT=https://www.receita.fazenda.gov.br/
VITE_SPED_VERSION=3.0.8

# Certificados digitais
CERTIFICATE_PATH=/path/to/certificate.p12
CERTIFICATE_PASSWORD=secure_password
```

### Edge Functions

```typescript
// supabase/functions/calculate-tax/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { input, rules } = await req.json();
  
  const calculator = new TaxCalculator(rules);
  const result = await calculator.calculate(input);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Manutenção e Atualizações

### Atualizações de Tabelas

```sql
-- Atualização de alíquotas (executada periodicamente)
UPDATE tax_rate_tables 
SET valid_to = CURRENT_DATE - INTERVAL '1 day'
WHERE tax_type_id = 'icms' 
AND jurisdiction_id = 'sp'
AND valid_to IS NULL;

INSERT INTO tax_rate_tables (
  org_id, tax_type_id, jurisdiction_id, 
  rate, valid_from
) VALUES (
  current_org_id(), 'icms', 'sp',
  0.18, CURRENT_DATE
);
```

### Backup de Dados Fiscais

```bash
# Backup específico de dados fiscais
pg_dump --table=fiscal_* --table=tax_* database_name > fiscal_backup.sql
```

## Troubleshooting

### Problemas Comuns

1. **Erro de cálculo tributário**
   - Verificar regras de cálculo
   - Validar classificações fiscais
   - Conferir vigência das alíquotas

2. **Integração com Receita Federal**
   - Verificar certificado digital
   - Conferir conectividade
   - Validar formato dos arquivos

3. **Performance em relatórios**
   - Otimizar queries
   - Implementar cache
   - Paginar resultados grandes