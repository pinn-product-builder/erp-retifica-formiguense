# Componentes React - Módulo de Metrologia

## 📦 Visão Geral

Este documento detalha todos os componentes React necessários para implementar o módulo de Metrologia.

---

## 🏗️ Estrutura de Diretórios

```
src/
├── pages/
│   └── MetrologyInspection.tsx (Página principal)
├── components/
│   └── metrology/
│       ├── steps/
│       │   ├── MotorIdentificationStep.tsx
│       │   ├── ComponentsReceivedStep.tsx
│       │   ├── VisualAnalysisStep.tsx
│       │   ├── DimensionalMeasurementsStep.tsx
│       │   └── TechnicalReportStep.tsx
│       ├── shared/
│       │   ├── StepHeader.tsx
│       │   ├── StepFooter.tsx
│       │   └── ProgressBar.tsx
│       ├── PhotoUpload.tsx
│       ├── MotorHistoryAlert.tsx
│       ├── MeasurementTable.tsx
│       ├── ComponentCard.tsx
│       ├── PDFPreview.tsx
│       └── MetrologyCompletionCard.tsx
└── hooks/
    ├── useMetrology.ts
    ├── useMotorDNA.ts
    └── useMeasurements.ts
```

---

## 📄 Página Principal

### `MetrologyInspection.tsx`

**Localização**: `src/pages/MetrologyInspection.tsx`

**Descrição**: Página principal que orquestra todas as 5 etapas da metrologia usando um stepper.

**Props**: Nenhuma (usa `useParams()` para pegar `inspection_id`)

**Estado**:
```typescript
interface MetrologyInspectionState {
  inspection: MetrologyInspection | null;
  currentStep: number; // 1-5
  loading: boolean;
  error: string | null;
}
```

**Responsabilidades**:
- Carregar dados da inspeção do banco
- Renderizar o stepper (1/5, 2/5, etc.)
- Renderizar o componente da etapa atual
- Gerenciar navegação entre etapas
- Salvar rascunhos automaticamente (debounce 5s)

**Código Base**:
```tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMetrology } from '@/hooks/useMetrology';
import { MotorIdentificationStep } from '@/components/metrology/steps/MotorIdentificationStep';
// ... outros imports

export function MetrologyInspection() {
  const { id: inspectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { inspection, loading, error, loadInspection } = useMetrology();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (inspectionId) {
      loadInspection(inspectionId);
    }
  }, [inspectionId]);

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <MotorIdentificationStep onNext={handleNextStep} />;
      case 2:
        return <ComponentsReceivedStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 3:
        return <VisualAnalysisStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 4:
        return <DimensionalMeasurementsStep onNext={handleNextStep} onBack={handlePreviousStep} />;
      case 5:
        return <TechnicalReportStep onBack={handlePreviousStep} />;
      default:
        return null;
    }
  };

  if (loading) return <div>Carregando inspeção...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="container mx-auto p-6">
      <ProgressBar currentStep={currentStep} totalSteps={5} />
      {renderStep()}
    </div>
  );
}
```

---

## 🔄 Componentes de Etapas (Steps)

### 1. `MotorIdentificationStep.tsx`

**Localização**: `src/components/metrology/steps/MotorIdentificationStep.tsx`

**Descrição**: Formulário da Etapa 1 - Identificação do Motor

**Props**:
```typescript
interface MotorIdentificationStepProps {
  onNext: () => void;
}
```

**Features**:
- Form com React Hook Form + Zod validation
- Dropdown de tipos de motor
- Inputs de marca, modelo, ano
- Input de número do motor com detecção de histórico
- Upload de fotos (componente `<PhotoUpload>`)
- Botões "Salvar Rascunho" e "Próxima Etapa"

**Validação Zod**:
```typescript
import { z } from 'zod';

const motorIdentificationSchema = z.object({
  motor_type: z.string().min(1, 'Selecione o tipo de motor'),
  vehicle_brand: z.string().min(2, 'Informe a marca'),
  vehicle_model: z.string().min(2, 'Informe o modelo'),
  vehicle_year: z.number().min(1900).max(new Date().getFullYear() + 1),
  engine_serial_number: z.string().min(3, 'Informe o número do motor'),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entry_time: z.string().regex(/^\d{2}:\d{2}$/),
  motor_photos: z.array(z.string()).min(1, 'Adicione pelo menos 1 foto'),
  mileage: z.number().optional(),
  notes: z.string().optional()
});
```

**Integração**:
```typescript
const { register, handleSubmit, watch, setValue } = useForm({
  resolver: zodResolver(motorIdentificationSchema)
});

const serialNumber = watch('engine_serial_number');
const { motorHistory, checkMotorHistory } = useMotorDNA();

useEffect(() => {
  if (serialNumber && serialNumber.length >= 5) {
    checkMotorHistory(serialNumber);
  }
}, [serialNumber]);

const onSubmit = async (data) => {
  await saveMotorIdentification(data);
  onNext();
};
```

---

### 2. `ComponentsReceivedStep.tsx`

**Localização**: `src/components/metrology/steps/ComponentsReceivedStep.tsx`

**Descrição**: Seleção de componentes recebidos (Etapa 2)

**Props**:
```typescript
interface ComponentsReceivedStepProps {
  onNext: () => void;
  onBack: () => void;
}
```

**Features**:
- Grid 3x2 de checkboxes para componentes
- Cada componente tem código e nome
- Validação: pelo menos 1 componente selecionado
- Botões "Anterior", "Salvar Rascunho" e "Próxima Etapa"

**Estado**:
```typescript
interface Component {
  key: string; // 'bloco', 'eixo', etc.
  code: string; // 'BL-001', 'VR-002', etc.
  name: string; // 'Bloco do Motor', etc.
  received: boolean;
}

const [components, setComponents] = useState<Component[]>([
  { key: 'bloco', code: 'BL-001', name: 'Bloco do Motor', received: false },
  { key: 'eixo', code: 'VR-002', name: 'Virabrequim', received: false },
  { key: 'biela', code: 'BI-003', name: 'Bielas (Conjunto)', received: false },
  { key: 'cabecote', code: 'CB-001', name: 'Cabeçote', received: false },
  { key: 'comando', code: 'CM-001', name: 'Comando de Válvulas', received: false },
  { key: 'outro', code: '', name: 'Outro', received: false }
]);
```

**Código Base**:
```tsx
const handleToggle = (key: string) => {
  setComponents(components.map(c =>
    c.key === key ? { ...c, received: !c.received } : c
  ));
};

const handleNext = async () => {
  const selectedComponents = components.filter(c => c.received);
  if (selectedComponents.length === 0) {
    toast.error('Selecione pelo menos um componente');
    return;
  }
  await saveComponentsReceived(selectedComponents);
  onNext();
};

return (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {components.map(component => (
      <Card key={component.key} className={component.received ? 'border-primary' : ''}>
        <CardContent className="p-4">
          <Checkbox
            checked={component.received}
            onCheckedChange={() => handleToggle(component.key)}
          />
          <div className="ml-3">
            <h4 className="font-semibold">{component.name}</h4>
            <p className="text-sm text-muted-foreground">{component.code}</p>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
```

---

### 3. `VisualAnalysisStep.tsx`

**Localização**: `src/components/metrology/steps/VisualAnalysisStep.tsx`

**Descrição**: Análise visual detalhada de cada componente (Etapa 3)

**Props**:
```typescript
interface VisualAnalysisStepProps {
  onNext: () => void;
  onBack: () => void;
}
```

**Features**:
- Layout de 2 colunas: lista de componentes (esquerda) + detalhes (direita)
- Checklist visual para cada componente
- Upload de fotos específicas do componente
- Textarea para observações
- Indicador de progresso (X/Y componentes analisados)

**Estado**:
```typescript
interface ComponentAnalysis {
  component: string;
  visual_analysis: {
    has_cracks: boolean;
    has_excessive_wear: boolean;
    has_corrosion: boolean;
    has_deformation: boolean;
    notes: string;
  };
  photos: string[];
}

const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
const [analyses, setAnalyses] = useState<ComponentAnalysis[]>([]);
```

**Código Base**:
```tsx
const receivedComponents = ['bloco', 'eixo', 'biela', 'cabecote']; // da Etapa 2

const handleSaveComponent = async (componentKey: string, data: ComponentAnalysis) => {
  // Salvar no banco de dados (motor_dna)
  await saveVisualAnalysis(componentKey, data);
  
  // Atualizar estado local
  setAnalyses(prev => [...prev, data]);
  
  // Selecionar próximo componente automaticamente
  const currentIndex = receivedComponents.indexOf(componentKey);
  if (currentIndex < receivedComponents.length - 1) {
    setSelectedComponent(receivedComponents[currentIndex + 1]);
  }
  
  toast.success('Componente salvo com sucesso');
};

return (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
    {/* Coluna Esquerda: Lista de Componentes */}
    <div className="md:col-span-4">
      {receivedComponents.map(comp => (
        <ComponentCard
          key={comp}
          component={comp}
          analyzed={analyses.some(a => a.component === comp)}
          onClick={() => setSelectedComponent(comp)}
          selected={selectedComponent === comp}
        />
      ))}
    </div>

    {/* Coluna Direita: Detalhes do Componente Selecionado */}
    <div className="md:col-span-8">
      {selectedComponent && (
        <VisualAnalysisForm
          component={selectedComponent}
          onSave={handleSaveComponent}
        />
      )}
    </div>
  </div>
);
```

---

### 4. `DimensionalMeasurementsStep.tsx`

**Localização**: `src/components/metrology/steps/DimensionalMeasurementsStep.tsx`

**Descrição**: Medições dimensionais com controle de tolerâncias (Etapa 4)

**Props**:
```typescript
interface DimensionalMeasurementsStepProps {
  onNext: () => void;
  onBack: () => void;
}
```

**Features**:
- Tabela de medições dinâmica
- Cálculo automático de status de tolerância
- Sidebar com instruções técnicas (IT-Metrologia)
- Filtro por componente
- Botão "Adicionar Medição" para pontos customizados

**Estado**:
```typescript
interface Measurement {
  id?: string;
  component: string;
  measurement_point: string;
  nominal_value: number;
  min_tolerance: number;
  max_tolerance: number;
  measured_value: number;
  tolerance_status: 'ok' | 'warning' | 'out_of_tolerance';
  unit: string;
  measurement_method?: string;
  notes?: string;
}

const [measurements, setMeasurements] = useState<Measurement[]>([]);
const [selectedComponent, setSelectedComponent] = useState<string>('bloco');
```

**Código Base**:
```tsx
import { MeasurementTable } from '@/components/metrology/MeasurementTable';
import { useMeasurements } from '@/hooks/useMeasurements';

const { saveMeasurement, calculateToleranceStatus } = useMeasurements();

const handleMeasurementSave = async (measurement: Measurement) => {
  // Calcular status de tolerância automaticamente
  const status = calculateToleranceStatus(
    measurement.measured_value,
    measurement.min_tolerance,
    measurement.max_tolerance
  );
  
  const measurementWithStatus = { ...measurement, tolerance_status: status };
  await saveMeasurement(measurementWithStatus);
  
  setMeasurements(prev => [...prev, measurementWithStatus]);
};

return (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
    {/* Tabela Principal */}
    <div className="lg:col-span-9">
      <MeasurementTable
        measurements={measurements.filter(m => m.component === selectedComponent)}
        onSave={handleMeasurementSave}
        component={selectedComponent}
      />
    </div>

    {/* Sidebar com Instruções */}
    <div className="lg:col-span-3">
      <Card>
        <CardHeader>
          <CardTitle>Instruções Técnicas</CardTitle>
        </CardHeader>
        <CardContent>
          <InstructionsSidebar component={selectedComponent} />
        </CardContent>
      </Card>
    </div>
  </div>
);
```

---

### 5. `TechnicalReportStep.tsx`

**Localização**: `src/components/metrology/steps/TechnicalReportStep.tsx`

**Descrição**: Geração do parecer técnico em PDF (Etapa 5)

**Props**:
```typescript
interface TechnicalReportStepProps {
  onBack: () => void;
}
```

**Features**:
- Form com diagnóstico, causas e recomendações
- Auto-preenchimento baseado nas etapas anteriores
- Preview de serviços sugeridos
- Botão "Gerar PDF" com loading state
- Preview do PDF gerado
- Opções: Download, Email, Avançar para Orçamento

**Estado**:
```typescript
interface TechnicalReportData {
  diagnosis: string;
  probable_causes: string;
  recommendations: string;
  suggested_services: Array<{
    code: string;
    name: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

const [reportData, setReportData] = useState<TechnicalReportData | null>(null);
const [pdfUrl, setPdfUrl] = useState<string | null>(null);
const [generating, setGenerating] = useState(false);
```

**Código Base**:
```tsx
import { useMetrology } from '@/hooks/useMetrology';
import { PDFPreview } from '@/components/metrology/PDFPreview';

const { generateAutoDiagnosis, generatePDF } = useMetrology();

useEffect(() => {
  // Auto-preencher ao carregar
  const autoDiagnosis = generateAutoDiagnosis(inspectionId);
  setReportData(autoDiagnosis);
}, [inspectionId]);

const handleGeneratePDF = async () => {
  setGenerating(true);
  try {
    const { pdf_url, report_id } = await generatePDF(inspectionId, reportData);
    setPdfUrl(pdf_url);
    toast.success('Parecer técnico gerado com sucesso!');
  } catch (error) {
    toast.error('Erro ao gerar PDF');
  } finally {
    setGenerating(false);
  }
};

return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Formulário */}
    <div>
      <Form>
        <FormField name="diagnosis">
          <FormLabel>Diagnóstico Geral *</FormLabel>
          <FormControl>
            <Textarea
              value={reportData?.diagnosis}
              onChange={(e) => setReportData({ ...reportData, diagnosis: e.target.value })}
              rows={5}
            />
          </FormControl>
        </FormField>

        {/* ... outros campos ... */}

        <Button onClick={handleGeneratePDF} disabled={generating}>
          {generating ? 'Gerando PDF...' : 'Gerar PDF'}
        </Button>
      </Form>
    </div>

    {/* Preview do PDF */}
    <div>
      {pdfUrl && <PDFPreview url={pdfUrl} />}
    </div>
  </div>
);
```

---

## 🔧 Componentes Compartilhados

### `PhotoUpload.tsx`

**Descrição**: Componente de upload de múltiplas fotos para Supabase Storage

**Props**:
```typescript
interface PhotoUploadProps {
  maxPhotos?: number; // default: 5
  minPhotos?: number; // default: 1
  value: string[]; // URLs das fotos
  onChange: (urls: string[]) => void;
  path: string; // ex: 'metrology-photos/org-123/insp-456/motor'
}
```

**Features**:
- Drag & drop
- Preview de thumbnails
- Indicador de progresso "X/Y fotos"
- Botão de remover por foto
- Validação de formato (JPG, PNG, HEIC)
- Validação de tamanho (max 10MB por foto)

---

### `MeasurementTable.tsx`

**Descrição**: Tabela editável de medições dimensionais

**Props**:
```typescript
interface MeasurementTableProps {
  measurements: Measurement[];
  onSave: (measurement: Measurement) => void;
  component: string;
}
```

**Features**:
- Colunas: Ponto, Nominal, Tol.Min, Tol.Max, Medido, Status
- Edição inline ou via modal
- Cálculo automático de status ao digitar valor medido
- Indicadores visuais: 🟢 OK, 🟡 Atenção, 🔴 Fora

---

### `PDFPreview.tsx`

**Descrição**: Visualizador de PDF embutido

**Props**:
```typescript
interface PDFPreviewProps {
  url: string;
}
```

**Features**:
- Iframe ou React-PDF
- Botões: Download, Email, Copiar Link, Regenerar
- Indicador de número de páginas

---

**Próximo arquivo**: `hooks.md` (detalhamento dos hooks customizados)

---

**Última Atualização**: 28/10/2025
