# Seleção de Peças com Checkbox em Diagnóstico

## Descrição da Implementação

O seletor de peças no módulo de diagnóstico foi atualizado para usar checkboxes ao invés de um autocomplete dropdown, seguindo o mesmo padrão utilizado no CheckIn Técnico.

## Mudanças Implementadas

### 1. Interface de Seleção

**Antes:**
- Autocomplete dropdown (InfiniteAutocomplete)
- Seleção uma peça por vez
- Necessário clicar e buscar para cada peça

**Depois:**
- Grid de checkboxes com todas as peças disponíveis
- Seleção múltipla simultânea
- Busca em tempo real com filtro
- Visual mais intuitivo e rápido

### 2. Componente Atualizado

`src/components/operations/PartsServicesSelector.tsx`

### 3. Funcionalidades

#### Campo de Busca
```tsx
<Input
  placeholder="Buscar por nome ou código..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

#### Grid de Checkboxes
- Layout responsivo: 1 coluna (mobile) / 2 colunas (desktop)
- Altura máxima de 400px com scroll
- Feedback visual quando selecionado (borda e fundo destacados)

#### Informações Exibidas por Peça
- Nome da peça (destaque)
- Código da peça
- Quantidade em estoque
- Preço unitário

### 4. Comportamento

1. **Seleção/Deseleção**: Clicar no checkbox ou no label para alternar
2. **Busca em Tempo Real**: Filtra por nome ou código da peça
3. **Feedback Visual**: 
   - Peça selecionada: borda azul e fundo azul claro
   - Peça não selecionada: borda cinza, hover com fundo cinza claro
4. **Estados**:
   - Loading: Mostra "Carregando peças..."
   - Vazio: Mostra "Nenhuma peça disponível"
   - Busca sem resultado: Mostra "Nenhuma peça encontrada"

### 5. Layout Responsivo

```css
/* Mobile (< 640px) */
grid-cols-1

/* Desktop (≥ 640px) */
sm:grid-cols-2
```

### 6. Integração

A mudança é totalmente compatível com o fluxo existente:
- Mantém a tabela de peças selecionadas
- Permite editar quantidade e preço
- Calcula totais automaticamente
- Remove peças individualmente

## Exemplo de Uso

```tsx
<PartsServicesSelector
  selectedParts={parts}
  selectedServices={services}
  onPartsChange={onPartsChange}
  onServicesChange={onServicesChange}
  macroComponentId={macroComponentId}
  engineTypeId={engineTypeId}
/>
```

## Benefícios

1. ✅ **Mais Rápido**: Seleção múltipla sem precisar buscar uma por uma
2. ✅ **Mais Intuitivo**: Visual similar ao CheckIn Técnico (consistência)
3. ✅ **Melhor UX**: Ver todas as opções disponíveis de uma vez
4. ✅ **Busca Eficiente**: Filtro em tempo real por nome ou código
5. ✅ **Feedback Visual**: Destaque claro das peças selecionadas
6. ✅ **Responsivo**: Funciona bem em mobile e desktop

## Comparação com CheckIn Técnico

### Semelhanças
- Grid de checkboxes
- Layout responsivo (1 col mobile / 2 cols desktop)
- Feedback visual na seleção
- Label clicável

### Diferenças
- **Diagnóstico**: Inclui campo de busca e informações de estoque/preço
- **CheckIn**: Lista simples de componentes do motor

## Data de Implementação

21 de Janeiro de 2026
