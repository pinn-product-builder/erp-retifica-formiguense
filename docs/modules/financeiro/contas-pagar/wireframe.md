# Wireframes: Contas a Pagar

## 🖥️ Desktop View (> 1024px)

### Tela Principal - Lista de Contas
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 💰 Contas a Pagar                                      [+ Nova Conta] [Filtros▼] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ 📊 A Vencer     │  │ ⚠️ Vencidas     │  │ ✅ Pagas        │                 │
│  │ R$ 25.400,00    │  │ R$ 3.200,00     │  │ R$ 142.500,00   │                 │
│  │ 12 contas       │  │ 3 contas        │  │ 87 contas       │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                   │
│  ┌─ Filtros ──────────────────────┐                                             │
│  │ Período:  [Jan/2025  ▼]        │                                             │
│  │ Status:   [Todos     ▼]        │                                             │
│  │ Categoria:[Todos     ▼]        │                                             │
│  │ Fornecedor:[Todos    ▼]        │                                             │
│  │                                 │                                             │
│  │ [Limpar] [Aplicar]              │                                             │
│  └─────────────────────────────────┘                                             │
│                                                                                   │
│  ┌─ Lista de Contas ──────────────────────────────────────────────────────────┐ │
│  │ Fornecedor        │ Categoria  │ Vencimento │ Valor      │ Status  │ Ações │ │
│  ├───────────────────┼────────────┼────────────┼────────────┼─────────┼───────┤ │
│  │ Peças Brasil Ltda │ Peças      │ 25/01/2025 │ R$ 5.200   │ 🟡 Pend │ [📝💸]│ │
│  │ Energia SP        │ Utilidades │ 15/01/2025 │ R$ 850     │ 🔴 Venc │ [📝💸]│ │
│  │ Aluguel Galpão    │ Aluguel    │ 10/02/2025 │ R$ 8.500   │ 🟡 Pend │ [📝💸]│ │
│  │ Material Oficina  │ Peças      │ 05/01/2025 │ R$ 1.250   │ ✅ Pago │ [👁️] │ │
│  │ ...               │ ...        │ ...        │ ...        │ ...     │ [...] │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  Mostrando 15 de 102 contas                         [◄ 1 2 3 ... 7 ►]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Modal - Nova Conta
```
┌─────────────────────────────────────────────┐
│ ➕ Nova Conta a Pagar                  [✕] │
├─────────────────────────────────────────────┤
│                                             │
│  Fornecedor *                               │
│  [Selecione o fornecedor          ▼]       │
│                                             │
│  Categoria *                                │
│  [Selecione a categoria           ▼]       │
│                                             │
│  Vincular a OS (opcional)                   │
│  [Buscar ordem de serviço...      🔍]      │
│                                             │
│  Valor *                                    │
│  [R$ _______________]                       │
│                                             │
│  Data de Vencimento *                       │
│  [25/01/2025           📅]                  │
│                                             │
│  Descrição *                                │
│  [________________________________]         │
│  [________________________________]         │
│  [________________________________]         │
│                                             │
│  Número da Nota Fiscal                      │
│  [_______________________________]          │
│                                             │
│  Anexar NF-e (PDF, XML)                     │
│  [📎 Escolher arquivo...]                   │
│                                             │
│  Observações                                │
│  [________________________________]         │
│  [________________________________]         │
│                                             │
│           [Cancelar]  [Salvar Conta]        │
└─────────────────────────────────────────────┘
```

### Modal - Registrar Pagamento
```
┌──────────────────────────────────────────────┐
│ 💸 Registrar Pagamento              [✕]     │
├──────────────────────────────────────────────┤
│                                              │
│  📋 Conta: Peças Brasil Ltda                 │
│  💰 Valor Original: R$ 5.200,00              │
│  📅 Vencimento: 25/01/2025                   │
│                                              │
│  ─────────────────────────────────────       │
│                                              │
│  Data do Pagamento *                         │
│  [23/01/2025          📅]                    │
│                                              │
│  Valor Pago *                                │
│  [R$ 5.200,00___________]                    │
│                                              │
│  Forma de Pagamento *                        │
│  ○ Dinheiro                                  │
│  ● PIX                                       │
│  ○ Transferência Bancária                    │
│  ○ Boleto                                    │
│  ○ Cartão de Crédito                         │
│  ○ Cartão de Débito                          │
│                                              │
│  Observações                                 │
│  [_________________________________]         │
│  [_________________________________]         │
│                                              │
│          [Cancelar]  [Confirmar Pagamento]   │
└──────────────────────────────────────────────┘
```

---

## 📱 Mobile View (< 768px)

### Lista de Contas
```
┌─────────────────────────────┐
│ ← 💰 Contas a Pagar    [⋮] │
├─────────────────────────────┤
│                             │
│ [🔍 Buscar...]  [Filtros]   │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊 A Vencer             │ │
│ │ R$ 25.400               │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ⚠️ Vencidas             │ │
│ │ R$ 3.200                │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ✅ Pagas                │ │
│ │ R$ 142.500              │ │
│ └─────────────────────────┘ │
│                             │
│ ─── Contas Pendentes ────   │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🏢 Peças Brasil Ltda    │ │
│ │ 📦 Peças                │ │
│ │ 📅 Vence: 25/01/2025    │ │
│ │ 💰 R$ 5.200,00          │ │
│ │ 🟡 Pendente             │ │
│ │                         │ │
│ │     [Ver] [Pagar]       │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚡ Energia SP           │ │
│ │ 🏢 Utilidades           │ │
│ │ 📅 Vence: 15/01/2025    │ │
│ │ 💰 R$ 850,00            │ │
│ │ 🔴 Vencida              │ │
│ │                         │ │
│ │     [Ver] [Pagar]       │ │
│ └─────────────────────────┘ │
│                             │
│        [+ Nova Conta]       │
└─────────────────────────────┘
```

---

## 🎨 Componentes Shadcn Utilizados

### Formulários
- `Form` + `FormField` + `FormControl` + `FormMessage`
- `Input` (valor, número NF)
- `Textarea` (descrição, observações)
- `Select` (fornecedor, categoria, forma pagamento)
- `Combobox` (busca de OS)
- `DatePicker` (vencimento, data pagamento)
- `RadioGroup` (forma de pagamento)

### Layout
- `Dialog` (modais de criar/editar/pagar)
- `Card` + `CardHeader` + `CardContent` (dashboard cards, mobile cards)
- `Table` + `TableHeader` + `TableBody` + `TableRow` (lista desktop)
- `Badge` (status: pendente/vencida/paga)
- `Button` (ações primárias e secundárias)

### Interação
- `DropdownMenu` (menu de ações)
- `Sheet` (drawer de filtros mobile)
- `Tabs` (filtro rápido por status)
- `AlertDialog` (confirmação de exclusão)
- `Toast` (feedback de ações)

---

## 🎭 Estados da Interface

### Loading
- Skeleton na lista
- Spinner no botão de salvar
- Shimmer nos cards

### Empty State
```
┌────────────────────────────┐
│                            │
│      📭                    │
│   Nenhuma conta            │
│   cadastrada ainda         │
│                            │
│  [+ Cadastrar Primeira]    │
└────────────────────────────┘
```

### Error State
```
┌────────────────────────────┐
│      ⚠️                     │
│  Erro ao carregar contas   │
│  Tente novamente           │
│                            │
│      [Recarregar]          │
└────────────────────────────┘
```

---

## 🔄 Comportamentos Interativos

1. **Filtros**
   - Aplicam em tempo real
   - Persistem na sessão
   - Badge mostrando filtros ativos

2. **Ordenação**
   - Click no header da coluna
   - Indicador visual de ordem

3. **Busca**
   - Debounce de 300ms
   - Busca em fornecedor e descrição
   - Clear button visível quando há texto

4. **Upload NF-e**
   - Drag & drop
   - Preview do arquivo
   - Validação de tamanho/formato
   - Progress bar

5. **Validação em Tempo Real**
   - Campos obrigatórios: borda vermelha
   - Mensagens de erro abaixo do campo
   - Desabilita botão salvar se inválido

---

## ♿ Acessibilidade

- Labels associados a inputs (htmlFor + id)
- ARIA labels em botões de ícone
- Focus visible em todos os interativos
- Navegação por teclado (Tab, Enter, Esc)
- Mensagens de erro anunciadas por screen readers
- Contraste mínimo WCAG AA (4.5:1)

---

## 📐 Responsividade

### Breakpoints
- Mobile: < 768px → Cards empilhados
- Tablet: 768px - 1024px → Tabela compacta
- Desktop: > 1024px → Tabela completa com filtros laterais

### Adaptações Mobile
- Botão flutuante [+] para nova conta
- Filtros em Sheet lateral
- Ações em bottom sheet
- Font-size mínimo 16px (evita zoom iOS)

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
