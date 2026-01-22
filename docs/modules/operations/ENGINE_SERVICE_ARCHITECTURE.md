# Arquitetura em Camadas - Engine Service

## Descrição

Refatoração da funcionalidade de busca de modelos de motores para seguir a arquitetura em camadas, separando responsabilidades entre Service Layer, Business Logic e Presentation Layer.

## Arquitetura Implementada

### 📊 Diagrama de Camadas

```
┌─────────────────────────────────────────────────┐
│         PRESENTATION LAYER (UI)                 │
│  - CheckIn.tsx (Página)                         │
│  - Componentes React                            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│         HOOKS LAYER (Estado e Lógica UI)        │
│  - useEngineModels.ts                           │
│  - Gerencia estado local                        │
│  - Orquestra chamadas ao service                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│      SERVICE LAYER (Regras de Negócio)         │
│  - EngineService.ts                             │
│  - Lógica de negócio                            │
│  - Validações                                   │
│  - Agregações                                   │
│  - Formatações                                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│      DATA LAYER (Acesso a Dados)               │
│  - Supabase Client                              │
│  - Queries SQL                                  │
│  - Database Types                               │
└─────────────────────────────────────────────────┘
```

## Camadas Detalhadas

### 1. Service Layer (`EngineService.ts`)

**Responsabilidades:**
- ✅ Queries ao banco de dados
- ✅ Regras de negócio
- ✅ Agregação de dados
- ✅ Validações
- ✅ Formatações
- ✅ Transformações de dados

**Métodos Implementados:**

#### `getUniqueEngineModels(params)`
Busca modelos únicos de motores com agregação.

```typescript
static async getUniqueEngineModels(
  params: EngineModelSearchParams
): Promise<EngineModelSearchResult>
```

**Regras de Negócio:**
- Filtra por organização
- Filtra por tipo de motor (opcional)
- Remove registros com marca ou modelo nulo
- Agrega modelos duplicados
- Conta ocorrências de cada modelo
- Ordena por marca e modelo

#### `aggregateEngineModels(engines)`
Agrega modelos duplicados e conta ocorrências.

```typescript
private static aggregateEngineModels(
  engines: Pick<Engine, 'brand' | 'model' | 'fuel_type' | 'engine_type_id'>[]
): EngineModel[]
```

**Lógica:**
- Usa `Map` para performance
- Chave única: `brand|model|fuel_type|engine_type_id`
- Incrementa contador para duplicatas
- Ordena resultado final

#### `validateEngineModel(model)`
Valida dados de um modelo de motor.

```typescript
static validateEngineModel(model: EngineModel): { 
  isValid: boolean; 
  errors: string[] 
}
```

**Validações:**
- Marca obrigatória
- Modelo obrigatório
- Combustível obrigatório
- Combustível válido (gasolina, etanol, flex, diesel, gnv)

#### `formatEngineModelLabel(model)`
Formata label para exibição.

```typescript
static formatEngineModelLabel(model: EngineModel): string
// Retorna: "Volkswagen - AP 1.0 (gasolina)"
```

#### `formatEngineModelWithCount(model)`
Formata label com contador de uso.

```typescript
static formatEngineModelWithCount(model: EngineModel): string
// Retorna: "Volkswagen - AP 1.0 (gasolina) | Usado 5x"
```

#### `getEngineById(engineId, orgId)`
Busca motor específico por ID.

```typescript
static async getEngineById(
  engineId: string, 
  orgId: string
): Promise<Engine | null>
```

#### `searchEngines(orgId, searchTerm, limit)`
Busca motores por termo de pesquisa.

```typescript
static async searchEngines(
  orgId: string,
  searchTerm: string,
  limit: number = 10
): Promise<Engine[]>
```

**Busca por:**
- Marca
- Modelo
- Número de série

### 2. Hooks Layer (`useEngineModels.ts`)

**Responsabilidades:**
- ✅ Gerenciamento de estado React
- ✅ Orquestração de chamadas ao service
- ✅ Tratamento de erros para UI
- ✅ Loading states
- ✅ Cache local (via useState)
- ✅ Exposição de métodos helper

**Métodos Expostos:**

```typescript
const {
  engineModels,           // Estado: lista de modelos
  loading,                // Estado: carregando
  fetchEngineModels,      // Ação: buscar modelos
  formatModelLabel,       // Helper: formatar label
  formatModelWithCount,   // Helper: formatar com contador
  validateModel          // Helper: validar modelo
} = useEngineModels();
```

**Vantagens:**
- Abstrai complexidade do service
- Gerencia estado automaticamente
- Recarrega quando organização muda
- Toast de erro automático
- Reutilizável em múltiplos componentes

### 3. Presentation Layer (`CheckIn.tsx`)

**Responsabilidades:**
- ✅ Renderização UI
- ✅ Interação com usuário
- ✅ Binding de dados
- ✅ Navegação

**Uso:**

```typescript
const { engineModels, loading, fetchEngineModels } = useEngineModels();

// Reage a mudanças no tipo de motor
useEffect(() => {
  if (formData.engineTypeId) {
    fetchEngineModels(formData.engineTypeId);
  }
}, [formData.engineTypeId, fetchEngineModels]);

// Renderiza autocomplete
<Autocomplete
  options={engineModels}
  loading={loading}
  onChange={(_, newValue) => {
    if (newValue) {
      setFormData({
        ...formData,
        marca: newValue.brand,
        modelo: newValue.model,
        combustivel: newValue.fuel_type
      });
    }
  }}
/>
```

## Interfaces e Tipos

### `EngineModel`
```typescript
interface EngineModel {
  brand: string;
  model: string;
  fuel_type: string;
  engine_type_id: string | null;
  count: number;
}
```

### `EngineModelSearchParams`
```typescript
interface EngineModelSearchParams {
  orgId: string;
  engineTypeId?: string;
}
```

### `EngineModelSearchResult`
```typescript
interface EngineModelSearchResult {
  models: EngineModel[];
  totalCount: number;
}
```

## Benefícios da Arquitetura

### 1. Separação de Responsabilidades
- **Service**: Lógica de negócio e dados
- **Hook**: Estado e orquestração
- **Component**: UI e interação

### 2. Testabilidade
```typescript
// Testar service isoladamente
const result = await EngineService.getUniqueEngineModels({
  orgId: 'test-org',
  engineTypeId: 'test-type'
});
expect(result.models).toHaveLength(5);

// Testar validação
const validation = EngineService.validateEngineModel(model);
expect(validation.isValid).toBe(true);
```

### 3. Reutilização
```typescript
// Usar em múltiplos componentes
const CheckIn = () => {
  const { engineModels } = useEngineModels();
  // ...
};

const EngineList = () => {
  const { engineModels } = useEngineModels();
  // ...
};
```

### 4. Manutenibilidade
- Mudanças no banco? Apenas no Service
- Mudanças na UI? Apenas no Component
- Nova validação? Apenas no Service
- Novo estado? Apenas no Hook

### 5. Performance
- Agregação eficiente com `Map`
- Query otimizada com filtros
- Cache local no hook
- Recarregamento inteligente

## Fluxo de Dados

### Busca de Modelos

```
1. Usuário seleciona tipo de motor
   └─> CheckIn.tsx
       └─> useEngineModels.fetchEngineModels(typeId)
           └─> EngineService.getUniqueEngineModels({ orgId, engineTypeId })
               └─> Supabase Query
                   └─> aggregateEngineModels()
                       └─> Retorna EngineModelSearchResult
                           └─> Hook atualiza estado
                               └─> Component re-renderiza
```

### Seleção de Modelo

```
1. Usuário seleciona modelo no autocomplete
   └─> onChange handler
       └─> Atualiza formData
           └─> Campos preenchidos automaticamente
```

## Comparação: Antes vs Depois

### ❌ Antes (Tudo no Hook)
```typescript
// Hook com query, lógica e estado misturados
const useEngineModels = () => {
  // Query SQL no hook
  const { data } = await supabase.from('engines')...
  
  // Lógica de agregação no hook
  const uniqueModels = data.reduce(...)
  
  // Retorna apenas dados
  return { engineModels, loading };
};
```

**Problemas:**
- ❌ Hook muito grande
- ❌ Difícil de testar
- ❌ Lógica de negócio misturada
- ❌ Não reutilizável sem React

### ✅ Depois (Arquitetura em Camadas)
```typescript
// Service: Lógica pura
class EngineService {
  static async getUniqueEngineModels() { ... }
  static validateEngineModel() { ... }
  static formatEngineModelLabel() { ... }
}

// Hook: Orquestração
const useEngineModels = () => {
  const result = await EngineService.getUniqueEngineModels();
  return { engineModels, loading, helpers };
};
```

**Vantagens:**
- ✅ Responsabilidades claras
- ✅ Fácil de testar
- ✅ Reutilizável
- ✅ Manutenível

## Padrões Seguidos

1. **Single Responsibility Principle**: Cada camada tem uma responsabilidade
2. **Dependency Inversion**: Hook depende do Service, não do Supabase
3. **Open/Closed**: Fácil estender sem modificar
4. **Interface Segregation**: Interfaces específicas por necessidade
5. **DRY**: Lógica centralizada no Service

## Arquivos

- `src/services/EngineService.ts` - Service Layer
- `src/hooks/useEngineModels.ts` - Hook Layer
- `src/pages/CheckIn.tsx` - Presentation Layer
- `docs/modules/operations/ENGINE_SERVICE_ARCHITECTURE.md` - Documentação

## Data de Implementação

21 de Janeiro de 2026
