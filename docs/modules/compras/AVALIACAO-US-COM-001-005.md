# Avaliação: US-COM-001 a US-COM-005

**Data:** 2025-02-24  
**Objetivo:** Verificar alinhamento das histórias de compras com regras de implementação, UX e layouts do repositório development.

---

## Resumo Executivo

| História | Alinhamento | Pontos de Atenção |
|----------|-------------|-------------------|
| US-COM-001 | ✅ Bom | Abas divergentes entre doc e layout |
| US-COM-002 | ✅ Bom | Referência `parts` vs `parts_inventory` |
| US-COM-003 | ⚠️ Parcial | Status em inglês vs português, RN-PUR vs RN-COM |
| US-COM-004 | ✅ Bom | Justificativa obrigatória bem definida |
| US-COM-005 | ⚠️ Parcial | Fluxo de status incompleto na doc |

---

## 1. Regras de Implementação (custom-rules.mdc)

### Arquitetura
- **Pages → components/[feature] → hooks → services** — Todas as histórias devem seguir
- **Supabase apenas em services** — Nenhuma história viola
- **Paginação no backend** — US-COM-001 (lista fornecedores), US-COM-003 (cotações), US-COM-004 (comparação) devem usar `.range()` e `{ count: 'exact' }`
- **ResponsiveTable** — Listas de fornecedores, cotações, pedidos devem usar
- **Zod para validação** — Todas as histórias já especificam schemas Zod

### Responsividade
- Mobile first, breakpoints Tailwind (sm/md/lg)
- Stats cards: `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- Modais: `max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-2xl`
- Tabelas: ResponsiveTable com `priority` e `minWidth`

---

## 2. US-COM-001: Cadastrar Fornecedores

### Alinhamento com Layout (02-suppliers.md)

| Aspecto | US-COM-001 | Layout Development | Status |
|---------|------------|---------------------|--------|
| Abas do formulário | Dados Gerais, Endereço, Comercial, Produtos | Dados Gerais, Endereço, Contatos, Bancário, Comercial, Documentos | ⚠️ Divergência |
| Categorias | Multi-seleção (RN-COM-003) | Select único | ⚠️ US-COM exige multi |
| Rating | Badge visual (AC06) | Estrelas 1-5 na lista | ✅ Alinhado |
| Histórico | AC08 | Aba Histórico de Pedidos | ✅ Alinhado |
| Produtos | Aba "Produtos" na US-COM-001 | Aba "Produtos/Catálogo" no layout | ✅ Alinhado |

### Recomendações
1. **Unificar abas**: O layout development tem mais abas (Contatos, Bancário, Documentos). US-COM-001 pode ser expandida para incluir essas abas ou manter foco nas 4 principais e tratar as demais como extensão.
2. **Categorias**: Garantir multi-seleção conforme AC03.
3. **Validação CNPJ**: Ambas especificam; implementar em service com Zod.

---

## 3. US-COM-002: Produtos por Fornecedor

### Alinhamento com Layout e US-PUR-002

| Aspecto | US-COM-002 | Layout (aba Produtos) | Status |
|---------|------------|------------------------|--------|
| Localização | Aba "Produtos" ao editar fornecedor | Aba Produtos/Catálogo | ✅ Alinhado |
| Campos | Código fornecedor, preço, qtd mín, prazo | Código, Produto, Preço, Prazo | ✅ Alinhado |
| Fornecedor preferencial | AC04 | Não explícito no wireframe | ⚠️ Incluir no layout |
| Vigência | valid_from/valid_until | Não no wireframe | ⚠️ Opcional na UI |
| Referência de peças | `parts` | `parts_inventory` (US-PUR-002) | ⚠️ Padronizar |

### Recomendações
1. **Tabela de peças**: No erp-retifica-formiguense, verificar se existe `parts` ou `parts_inventory` e padronizar.
2. **Fornecedor preferencial**: Adicionar checkbox na tabela de produtos do fornecedor.
3. **View valid_supplier_prices**: US-COM-002 define; US-PUR-002 não menciona — manter da US-COM-002.

---

## 4. US-COM-003: Criar Cotação

### Alinhamento com Layout (03-quotations.md) e US-PUR-003

| Aspecto | US-COM-003 | Layout Development | Status |
|---------|------------|---------------------|--------|
| Fluxo | Formulário único com itens | Wizard 4 passos | ⚠️ Layout mais detalhado |
| Numeração | COT-YYMMDD-NNN (US-COM) | COT-2026-012 (layout) / COT-AAMMDD-NNN (US-PUR) | ⚠️ Padronizar |
| Status | draft, sent, responded, approved, rejected, cancelled | Rascunho, Enviada, Aguardando, Respondida, Aprovada, Convertida, Cancelada, Expirada | ⚠️ Mapear |
| Finalidade | Não especifica | Para Compra / Para Orçamento | ℹ️ Layout mais rico |
| Export/Import | AC10-AC15 | ExportQuotationDialog, ImportProposalDialog | ✅ Já implementado no dev |
| Edição | AC16 (draft/sent/waiting_proposals) | EditQuotationDialog | ✅ Alinhado |

### Inconsistências de Regras
- **US-COM-003** usa `RN-COM-008`, `RN-COM-009`, `RN-COM-010`
- **US-COM-003** também cita `RN-PUR-011`, `RN-PUR-012`, `RN-PUR-013` — mistura de prefixos
- **US-PUR-003** usa `RN-PUR-008` a `RN-PUR-013`

**Recomendação**: Padronizar para RN-COM ou RN-PUR em todo o módulo de compras.

### Status em inglês vs português
- Banco: usar **inglês** (draft, sent, responded, approved, rejected, cancelled) — padrão técnico
- UI: exibir **português** (Rascunho, Enviada, Respondida, etc.)
- Adicionar `expired` e `converted` se o layout exigir

---

## 5. US-COM-004: Comparar Propostas

### Alinhamento com Layout (03-quotations, Comparação)

| Aspecto | US-COM-004 | Layout Development | Status |
|---------|------------|---------------------|--------|
| Quadro comparativo | Tabela por item, colunas por fornecedor | Matriz similar | ✅ Alinhado |
| Badges | Menor preço, melhor prazo, preferencial | ✓ Verde, 🏆, ⭐ | ✅ Alinhado |
| Justificativa | Obrigatória se não for melhor preço (RN-COM-016) | Não explícito no layout | ⚠️ Implementar modal |
| Gerar pedido | AC07 | Botão "Gerar Pedido de Compra" | ✅ Alinhado |
| Exportar PDF | AC08 | Não no wireframe | ℹ️ Incluir na DoD |
| Opções de aprovação | Seleção por item | Vencedor único / Dividir / Manual | ✅ Layout mais flexível |

### Recomendações
1. **Modal de justificativa**: Exibir quando usuário seleciona proposta mais cara.
2. **View proposal_comparison**: US-COM-004 define; garantir que a função `calculate_proposal_score` exista no banco.
3. **Tabela quotation_selections**: Necessária para rastrear decisões.

---

## 6. US-COM-005: Gerar Pedido de Compra

### Alinhamento com Layout (04-purchase-orders) e Regras

| Aspecto | US-COM-005 | Layout / US-PUR | Status |
|---------|------------|-----------------|--------|
| Origem | Propostas selecionadas da cotação | Manual, Cotação, Necessidade | ✅ Layout cobre |
| Numeração | PC-AAMMDD-NNN (RN-PUR-016) | PC-2401, PC-2026-0045 | ⚠️ Padronizar formato |
| Status | rascunho, sent (AC07) | Rascunho, Pendente, Aprovado, Enviado, Recebendo, Concluído, Cancelado | ⚠️ US-COM-005 incompleto |
| Fluxo RN-PUR-017 | rascunho → pendente → aprovado → enviado → parcial/concluído | — | ✅ Documentar no README |
| Agrupamento | 1 pedido por fornecedor | — | ✅ Alinhado |
| Cálculos | Subtotal, descontos, frete, impostos, total | Passo 3 do wizard | ✅ Alinhado |

### Lacunas na US-COM-005
1. **Aprovação**: Não menciona fluxo de aprovação (pendente → aprovado).
2. **Status intermediários**: Falta `pending` (aguardando aprovação), `partial` (recebimento parcial).
3. **Schema purchase_order_items**: US-COM-005 usa `part_id`; verificar FK para `parts` ou `parts_inventory`.

---

## 7. Mapeamento US-COM ↔ US-PUR ↔ Telas

| US-COM | US-PUR (development) | Tela (development) |
|--------|----------------------|---------------------|
| US-COM-001 | US-PUR-001 | 02-suppliers, Suppliers.tsx |
| US-COM-002 | US-PUR-002 | 02-suppliers (aba Produtos), SupplierProductsModal |
| US-COM-003 | US-PUR-003 | 03-quotations, NewQuotationWizard, EditQuotationDialog |
| US-COM-004 | (US-PUR-004?) | 03-quotations (Comparar), QuotationComparisonModal |
| US-COM-005 | (US-PUR-016?) | 04-purchase-orders, NewOrderWizard |

---

## 8. Checklist de Implementação (erp-retifica-formiguense)

### Antes de implementar
- [ ] Padronizar nomenclatura de status (inglês no banco, português na UI)
- [ ] Padronizar formato de numeração: COT-AAMMDD-NNN, PC-AAMMDD-NNN
- [ ] Definir se `parts` ou `parts_inventory` é a tabela de peças
- [ ] Unificar prefixo de regras (RN-COM ou RN-PUR)

### Durante implementação
- [ ] Services em `src/services/` (SupplierService, QuotationService, PurchaseOrderService)
- [ ] Hooks em `src/hooks/` (useSuppliers, useQuotations, usePurchaseOrders)
- [ ] Componentes em `src/components/purchasing/`
- [ ] Pages em `src/pages/` (composição apenas)
- [ ] Paginação com `.range()` e `count: 'exact'`
- [ ] ResponsiveTable para listas
- [ ] Zod para validação de formulários

### Responsividade
- [ ] Stats cards: grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- [ ] Modais: max-w-[95vw] sm:max-w-md md:max-w-lg
- [ ] Tabelas: ResponsiveTable com priority/minWidth

---

## 9. Conclusão

As histórias **US-COM-001 a US-COM-005** estão **em grande parte alinhadas** com as regras de implementação e com os layouts do repositório development. Os principais ajustes recomendados são:

1. **Unificar documentação** de abas (fornecedor) e status (cotações/pedidos)
2. **Padronizar nomenclatura** (RN-COM vs RN-PUR, parts vs parts_inventory)
3. **Completar US-COM-005** com fluxo de aprovação e status
4. **Garantir** que o código no erp-retifica-formiguense siga a custom-rules.mdc (services, hooks, paginação, ResponsiveTable)

O repositório **erp-retifica-formiguense** já possui componentes de compras (QuotationForm, QuotationService, etc.). A implementação deve **reutilizar** o que existir e **refatorar** conforme as regras (extrair Supabase para services, usar ResponsiveTable, etc.).
