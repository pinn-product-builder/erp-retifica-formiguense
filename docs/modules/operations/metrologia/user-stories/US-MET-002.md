# US-MET-002: Registrar Identificação do Motor (Etapa 1/5)

## 📌 Metadados

| Campo | Valor |
|-------|-------|
| **ID** | US-MET-002 |
| **Épico** | Formulário Digital de Metrologia |
| **Sprint** | Sprint 1 |
| **Prioridade** | Alta |
| **Estimativa** | 8 Story Points |
| **Status** | 📝 Pendente |

## 📝 História de Usuário

**Como** metrologista  
**Eu quero** preencher as informações de identificação do motor na Etapa 1  
**Para que** eu possa iniciar o processo de análise dimensional com dados completos e rastreáveis

## 🎯 Objetivo de Negócio

Garantir rastreabilidade completa de cada motor inspecionado através do número do motor, permitindo histórico completo (DNA).

## 📋 Regras de Negócio

**RN001:** Campos obrigatórios (*):
- Tipo de motor (dropdown com opções pré-definidas)
- Marca do veículo
- Modelo do veículo
- Ano
- Número do motor (engine_serial_number) - **CHAVE ÚNICA para DNA**
- Data de entrada
- Hora de entrada
- Foto do motor (mínimo 1)

**RN002:** Ao preencher o `engine_serial_number`, o sistema deve:
- Verificar se já existe histórico deste motor na organização
- Se existir, mostrar alerta: "⚠️ Este motor já possui X inspeções anteriores - [Ver Histórico]"
- Carregar automaticamente marca, modelo e ano se disponível no histórico

**RN003:** O upload de fotos deve:
- Aceitar formatos: JPG, PNG, HEIC
- Tamanho máximo por foto: 10MB
- Mínimo: 1 foto, Máximo: 5 fotos
- Armazenar no Supabase Storage em `/metrology-photos/{org_id}/{inspection_id}/motor/`

**RN004:** Ao clicar em "Salvar Rascunho", o sistema deve:
- Validar apenas os campos preenchidos (sem obrigatoriedade)
- Salvar dados no campo JSONB `motor_identification`
- Manter `current_step = 1`
- Permitir voltar depois para continuar

**RN005:** Ao clicar em "Próxima Etapa", o sistema deve:
- Validar todos os campos obrigatórios
- Impedir avanço se houver erro
- Atualizar `current_step = 2`
- Redirecionar para Etapa 2

## ✅ Critérios de Aceite

**CA001:** DADO QUE estou na Etapa 1 QUANDO visualizo o formulário ENTÃO devo ver:
- Header: "Etapa 1 de 5: Identificação do Motor"
- Barra de progresso visual: 20% preenchida
- Formulário com todos os campos especificados
- Botões de ação no rodapé: [Salvar Rascunho] [Próxima Etapa →]

**CA002:** DADO QUE preenchi o número do motor "ABC123456" QUANDO o motor já tem histórico ENTÃO devo ver:
- Alerta destacado: "⚠️ Este motor já possui 2 inspeções anteriores"
- Link clicável "Ver Histórico" que abre modal com timeline
- Campos marca, modelo, ano pré-preenchidos automaticamente

**CA003:** DADO QUE tentei avançar sem preencher campos obrigatórios QUANDO clico em "Próxima Etapa" ENTÃO devo ver:
- Mensagens de erro embaixo de cada campo inválido
- Toast de erro: "Preencha todos os campos obrigatórios"
- Foco automático no primeiro campo com erro
- NÃO avançar para a Etapa 2

**CA004:** DADO QUE fiz upload de 3 fotos QUANDO visualizo a área de upload ENTÃO devo ver:
- Grid 3x2 com thumbnails das fotos
- Botão "×" em cada foto para remover
- Indicador "3/5 fotos" abaixo
- Botão "+ Adicionar Foto" enquanto < 5 fotos

**CA005:** DADO QUE preenchi todos os campos obrigatórios QUANDO clico em "Próxima Etapa" ENTÃO:
- Devo ver loader "Salvando dados..."
- Devo ser redirecionado para `/metrologia/inspecao/:id?step=2`
- A Etapa 2 deve estar ativa no stepper

**CA006:** DADO QUE cliquei em "Salvar Rascunho" QUANDO os dados são salvos ENTÃO:
- Devo ver toast de sucesso: "Rascunho salvo com sucesso"
- Posso fechar a página e voltar depois
- Os dados devem estar preservados ao reabrir

## 🏗️ Definition of Done

**DOD001:** Componente `MotorIdentificationStep.tsx` criado em `src/components/metrology/steps/`

**DOD002:** Form implementado com React Hook Form + Zod para validação

**DOD003:** Hook `useMotorDNA.ts` criado para buscar histórico do motor

**DOD004:** Componente `PhotoUpload.tsx` criado para upload de fotos

**DOD005:** Integração com Supabase Storage configurada para bucket `metrology-photos`

**DOD006:** Política RLS criada para o bucket de fotos (org_id isolation)

**DOD007:** Campo JSONB `motor_identification` populado na tabela `metrology_inspections`

**DOD008:** Função `checkMotorHistory()` implementada no hook

**DOD009:** Testes unitários escritos para validação do formulário

**DOD010:** Testes E2E escritos para fluxo completo da etapa

## 🔧 Componentes Afetados

| Componente | Localização | Tipo |
|------------|-------------|------|
| `MetrologyInspection.tsx` | `src/pages/` | Alterado |
| `MotorIdentificationStep.tsx` | `src/components/metrology/steps/` | Novo |
| `PhotoUpload.tsx` | `src/components/metrology/` | Novo |
| `MotorHistoryAlert.tsx` | `src/components/metrology/` | Novo |
| `useMotorDNA.ts` | `src/hooks/` | Novo |
| `useMetrology.ts` | `src/hooks/` | Alterado |

## 🗄️ Alterações no Banco de Dados

### Atualização: `metrology_inspections`

```sql
ALTER TABLE metrology_inspections
ADD COLUMN motor_identification JSONB;

-- Índice para busca por número do motor
CREATE INDEX idx_metrology_motor_serial 
ON metrology_inspections 
USING GIN ((motor_identification->>'engine_serial_number'));
```

### Storage Bucket: `metrology-photos`

```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('metrology-photos', 'metrology-photos', false);

-- RLS Policy: Upload
CREATE POLICY "Users can upload metrology photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'metrology-photos' 
  AND auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE org_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Download
CREATE POLICY "Users can view metrology photos from their org"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'metrology-photos'
  AND auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE org_id = (storage.foldername(name))[1]::uuid
  )
);

-- RLS Policy: Delete
CREATE POLICY "Users can delete metrology photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'metrology-photos'
  AND auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE org_id = (storage.foldername(name))[1]::uuid
  )
);
```

## 📊 Estrutura de Dados (JSONB)

### Campo `motor_identification`

```typescript
interface MotorIdentification {
  motor_type: string; // "Diesel Completo", "Gasolina", "Flex", etc.
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  engine_serial_number: string; // CHAVE para DNA
  mileage?: number; // Quilometragem (opcional)
  entry_date: string; // ISO 8601
  entry_time: string; // "HH:mm"
  motor_photos: string[]; // URLs do Supabase Storage
  notes?: string; // Observações adicionais
}
```

Exemplo:
```json
{
  "motor_type": "Diesel Completo",
  "vehicle_brand": "Volkswagen",
  "vehicle_model": "Gol 1.0",
  "vehicle_year": 2018,
  "engine_serial_number": "ABC123456",
  "mileage": 95000,
  "entry_date": "2025-10-28",
  "entry_time": "14:30",
  "motor_photos": [
    "https://.../metrology-photos/org-123/insp-456/motor/photo-1.jpg",
    "https://.../metrology-photos/org-123/insp-456/motor/photo-2.jpg"
  ],
  "notes": "Motor com sinais de superaquecimento"
}
```

## 🎨 Wireframe

```
┌──────────────────────────────────────────────────────┐
│ 📍 Etapa 1 de 5: Identificação do Motor             │
│ [████░░░░░] 20%                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Tipo de Motor *                                      │
│ [Dropdown: Diesel Completo ▼]                        │
│                                                      │
│ Marca do Veículo *        Modelo *                   │
│ [Volkswagen        ]      [Gol 1.0        ]          │
│                                                      │
│ Ano *                     Quilometragem              │
│ [2018]                    [95.000 km      ]          │
│                                                      │
│ Número do Motor *                                    │
│ [ABC123456                              ]            │
│ ⚠️ Este motor já possui 2 inspeções - [Ver DNA]     │
│                                                      │
│ Data de Entrada *         Hora *                     │
│ [28/10/2025       ]       [14:30]                    │
│                                                      │
│ Upload de Fotos do Motor * (mínimo 1)                │
│ ┌───────────────────────────────────────┐            │
│ │ [📷 Foto 1] [📷 Foto 2] [+ Adicionar] │            │
│ │                                       │            │
│ │ 2/5 fotos enviadas                    │            │
│ └───────────────────────────────────────┘            │
│                                                      │
│ Observações (opcional)                               │
│ [Textarea                                ]           │
│                                                      │
├──────────────────────────────────────────────────────┤
│ [Salvar Rascunho]           [Próxima Etapa →]       │
└──────────────────────────────────────────────────────┘
```

## 🧪 Cenários de Teste

### Teste E2E 1: Preencher e avançar com sucesso
```gherkin
Given estou na Etapa 1 de uma nova inspeção
When preencho todos os campos obrigatórios
And faço upload de 2 fotos
And clico em "Próxima Etapa"
Then devo ser redirecionado para Etapa 2
And os dados devem estar salvos
```

### Teste E2E 2: Validação de campos obrigatórios
```gherkin
Given estou na Etapa 1
When clico em "Próxima Etapa" sem preencher campos
Then devo ver mensagens de erro nos campos vazios
And NÃO devo avançar para Etapa 2
```

### Teste E2E 3: Detecção de histórico do motor
```gherkin
Given existe um motor "ABC123456" com 2 inspeções anteriores
When preencho o número do motor
Then devo ver alerta "Este motor já possui 2 inspeções anteriores"
And ao clicar em "Ver DNA" devo ver modal com histórico
```

## ⚠️ Escopo Negativo

Esta história **NÃO** entregará:
- Preenchimento de componentes recebidos (Etapa 2)
- Análise visual (Etapa 3)
- Medições dimensionais (Etapa 4)
- OCR de placas/números de motor via foto
- Integração com API de montadoras para validação

## 🔗 Dependências

**Bloqueadores:**
- US-MET-001 concluída (roteamento e criação da inspeção)

**Bloqueia:**
- US-MET-003 (Etapa 2 - Componentes)

---

**Criado em**: 28/10/2025  
**Última atualização**: 28/10/2025
