# Separação de Peças e Serviços na Impressão de Orçamentos

## Descrição da Implementação

A impressão de orçamentos foi atualizada para separar claramente **Peças** e **Serviços Adicionais** em dois setores distintos, melhorando a legibilidade e organização do documento.

## Mudanças Implementadas

### 1. Estrutura de Impressão

Antes, peças e serviços eram exibidos em uma única tabela com uma coluna "Tipo" diferenciando-os. Agora:

- **Seção de Peças**: Tabela dedicada com colunas específicas (Item, Código, Quantidade, Preço Unitário, Subtotal)
- **Seção de Serviços Adicionais**: Tabela dedicada com colunas específicas (Descrição, Quantidade, Preço Unitário, Subtotal)
- Cada seção possui seu próprio subtotal destacado

### 2. Layout Visual

#### Seção de Peças
```
PEÇAS
┌─────────────────────────────────────────────────────────┐
│ Item | Código | Quantidade | Preço Unit. | Subtotal   │
├─────────────────────────────────────────────────────────┤
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
Subtotal Peças: R$ X.XXX,XX
```

#### Seção de Serviços Adicionais
```
SERVIÇOS ADICIONAIS
┌──────────────────────────────────────────────────────┐
│ Descrição | Quantidade | Preço Unit. | Subtotal    │
├──────────────────────────────────────────────────────┤
│ ...                                                   │
└──────────────────────────────────────────────────────┘
Subtotal Serviços: R$ X.XXX,XX
```

#### Resumo Financeiro
```
RESUMO FINANCEIRO
┌──────────────────────────────────────┐
│ Subtotal Peças:     R$ X.XXX,XX     │
│ Subtotal Serviços:  R$ X.XXX,XX     │
│ Desconto (X%):     -R$ XXX,XX       │
│ Impostos (X%):      R$ XXX,XX       │
├──────────────────────────────────────┤
│ TOTAL:              R$ X.XXX,XX     │
└──────────────────────────────────────┘
```

### 3. Comportamento

- **Quando há apenas peças**: Exibe apenas a seção de peças
- **Quando há apenas serviços**: Exibe apenas a seção de serviços adicionais
- **Quando há ambos**: Exibe ambas as seções separadamente
- **Quando não há nenhum**: Exibe mensagem "Nenhum item cadastrado"

### 4. Estilos Adicionados

```css
.subtotal-section {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.subtotal-row {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
}
```

## Arquivo Modificado

- `src/hooks/useBudgetPDF.ts`

## Benefícios

1. **Melhor Organização**: Separação clara entre peças e serviços
2. **Facilidade de Leitura**: Cada tipo de item tem sua própria tabela otimizada
3. **Subtotais Claros**: Cada seção mostra seu subtotal imediatamente após a tabela
4. **Resumo Consolidado**: Seção final com todos os valores para fácil conferência
5. **Flexibilidade**: Exibe apenas as seções relevantes baseado nos itens do orçamento

## Compatibilidade

A mudança é totalmente retrocompatível e não requer alterações em outros componentes. O hook `useBudgetPDF` continua com a mesma interface pública.

## Data de Implementação

21 de Janeiro de 2026
