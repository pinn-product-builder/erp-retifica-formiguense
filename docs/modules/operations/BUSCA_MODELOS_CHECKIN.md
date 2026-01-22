# Busca de Modelos de Motores no Check-in Técnico

## Descrição da Implementação

Nova funcionalidade que permite buscar e selecionar modelos de motores já cadastrados no sistema durante o check-in técnico, preenchendo automaticamente os campos de marca, modelo e combustível.

## Mudanças Implementadas

### 1. Novo Hook: `useEngineModels`

Hook criado para buscar modelos únicos de motores já cadastrados na base de dados.

**Arquivo**: `src/hooks/useEngineModels.ts`

#### Funcionalidades:
- Busca todos os modelos únicos de motores cadastrados
- Filtra por tipo de motor quando especificado
- Agrupa por marca, modelo e tipo de combustível
- Conta quantas vezes cada modelo foi usado
- Filtra por organização atual

#### Interface:
```typescript
interface EngineModel {
  brand: string;
  model: string;
  fuel_type: string;
  engine_type_id: string | null;
  count: number;
}
```

### 2. Campo de Busca no Check-in

Novo campo de autocomplete adicionado na seção "Identificação do Motor".

**Localização**: Entre "Tipo de Motor" e os campos "Marca/Modelo/Combustível"

#### Características:

1. **Dependência do Tipo de Motor**:
   - Desabilitado até que um tipo de motor seja selecionado
   - Filtra modelos apenas do tipo de motor selecionado
   - Recarrega automaticamente ao mudar o tipo de motor

2. **Autocomplete Inteligente**:
   - Busca em tempo real
   - Exibe: Marca - Modelo (Combustível)
   - Mostra quantas vezes o modelo foi usado
   - Ordenado por marca e modelo

3. **Preenchimento Automático**:
   - Ao selecionar um modelo, preenche automaticamente:
     - Campo "Marca"
     - Campo "Modelo"
     - Campo "Combustível"

4. **Flexibilidade**:
   - Opcional: pode-se preencher manualmente sem usar a busca
   - Permite editar os campos após seleção
   - Limpa seleção ao mudar o tipo de motor

### 3. Interface do Usuário

#### Estados do Campo:

**Tipo de Motor NÃO Selecionado:**
```
┌─────────────────────────────────────────────────┐
│ Buscar Modelo Cadastrado                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Selecione um tipo de motor primeiro [🔒]   │ │
│ └─────────────────────────────────────────────┘ │
│ ℹ️ Selecione um tipo de motor para ver modelos │
└─────────────────────────────────────────────────┘
```

**Tipo de Motor Selecionado:**
```
┌─────────────────────────────────────────────────┐
│ Buscar Modelo Cadastrado                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ Digite para buscar ou preencha manualmente  │ │
│ └─────────────────────────────────────────────┘ │
│ ℹ️ Busque por modelos já cadastrados ou        │
│    preencha manualmente abaixo                  │
└─────────────────────────────────────────────────┘
```

**Com Resultados:**
```
┌─────────────────────────────────────────────────┐
│ Buscar Modelo Cadastrado                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ volkswagen                              [▼] │ │
│ └─────────────────────────────────────────────┘ │
│   ┌───────────────────────────────────────────┐ │
│   │ Volkswagen - AP 1.0                       │ │
│   │ Combustível: gasolina | Usado 5x          │ │
│   ├───────────────────────────────────────────┤ │
│   │ Volkswagen - AP 1.6                       │ │
│   │ Combustível: flex | Usado 3x              │ │
│   └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 4. Fluxo de Uso

#### Cenário 1: Usando Modelo Existente
1. Usuário seleciona "Tipo de Motor"
2. Campo de busca é habilitado
3. Usuário digita parte da marca ou modelo
4. Sistema filtra e exibe opções
5. Usuário seleciona um modelo
6. Campos Marca, Modelo e Combustível são preenchidos automaticamente
7. Usuário pode editar se necessário

#### Cenário 2: Cadastro Manual
1. Usuário seleciona "Tipo de Motor"
2. Usuário ignora o campo de busca
3. Usuário preenche manualmente Marca, Modelo e Combustível
4. Sistema funciona normalmente

#### Cenário 3: Mudança de Tipo de Motor
1. Usuário já tinha selecionado um modelo
2. Usuário muda o "Tipo de Motor"
3. Campo de busca é limpo
4. Novos modelos são carregados (do novo tipo)
5. Campos Marca, Modelo e Combustível mantêm valores (podem ser editados)

## Benefícios

1. ✅ **Agilidade**: Reutiliza dados já cadastrados
2. ✅ **Consistência**: Padroniza nomenclatura de marcas e modelos
3. ✅ **Reduz Erros**: Evita digitação incorreta
4. ✅ **Histórico**: Mostra quantas vezes cada modelo foi usado
5. ✅ **Inteligente**: Filtra por tipo de motor automaticamente
6. ✅ **Flexível**: Não obriga uso, permite cadastro manual
7. ✅ **UX Melhorada**: Feedback claro sobre estados do campo

## Dados Exibidos

Para cada modelo encontrado:
- **Marca**: Ex: "Volkswagen"
- **Modelo**: Ex: "AP 1.0"
- **Combustível**: Ex: "gasolina", "flex", "diesel"
- **Contador**: Quantas vezes foi usado (Ex: "Usado 5x")

## Tecnologias Utilizadas

- **Material-UI Autocomplete**: Componente de busca
- **React Hooks**: `useState`, `useEffect`, `useMemo`, `useCallback`
- **Supabase**: Query para buscar modelos únicos
- **TypeScript**: Tipagem forte

## Arquivos Modificados

1. `src/hooks/useEngineModels.ts` - Novo hook criado
2. `src/pages/CheckIn.tsx` - Adicionado campo de busca

## Query SQL Utilizada

```sql
SELECT brand, model, fuel_type, engine_type_id
FROM engines
WHERE org_id = ?
  AND brand IS NOT NULL
  AND model IS NOT NULL
  AND engine_type_id = ? -- Opcional, quando filtrado por tipo
ORDER BY brand, model
```

## Exemplo de Uso do Hook

```typescript
const { engineModels, loading, fetchEngineModels } = useEngineModels();

// Buscar todos os modelos
fetchEngineModels();

// Buscar modelos de um tipo específico
fetchEngineModels(engineTypeId);

// engineModels retorna:
[
  {
    brand: "Volkswagen",
    model: "AP 1.0",
    fuel_type: "gasolina",
    engine_type_id: "uuid-123",
    count: 5
  },
  // ...
]
```

## Data de Implementação

21 de Janeiro de 2026
