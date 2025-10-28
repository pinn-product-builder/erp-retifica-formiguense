# Wireframe: Contas a Receber

## Desktop View (> 1024px)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 📊 Contas a Receber                                  [+ Nova Conta]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │💰 A Receber │  │✅ Recebidas │  │⚠️ Vencidas  │  │📈 Mês       │ │
│  │  R$ 45.500  │  │  R$ 120.000 │  │  R$ 8.200   │  │  R$ 165.500 │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  🔍 [Buscar...] │ Status: [Todos ▼] │ Cliente: [Todos ▼] │ [Filtrar]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Cliente         OS      Vencimento   Valor    Parcela   Status Ações│
│  ──────────────────────────────────────────────────────────────────── │
│  João Silva     #1234   15/02/2025   R$ 1.500  1/3      ⏳ Pendente  │
│                                                          [👁️][💰][✏️] │
│  ──────────────────────────────────────────────────────────────────── │
│  Maria Santos   #1235   10/02/2025   R$ 3.000  2/2      ⚠️ Vencida   │
│                                                          [👁️][💰][✏️] │
│  ──────────────────────────────────────────────────────────────────── │
│  Auto Parts     #1236   20/02/2025   R$ 5.200  -        ⏳ Pendente  │
│                                                          [👁️][💰][✏️] │
│  ──────────────────────────────────────────────────────────────────── │
│                                                                         │
│  📄 Página 1 de 5                       [<] [1][2][3][4][5] [>]       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Mobile View (< 768px)

```
┌──────────────────────────┐
│ 📊 Contas a Receber  ☰  │
├──────────────────────────┤
│                          │
│ ┌──────────────────────┐ │
│ │ 💰 A Receber         │ │
│ │ R$ 45.500            │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ ⚠️ Vencidas          │ │
│ │ R$ 8.200             │ │
│ └──────────────────────┘ │
│                          │
│ [🔍 Buscar...]           │
│ [🔽 Filtros]             │
│                          │
├──────────────────────────┤
│                          │
│ ┌──────────────────────┐ │
│ │ 👤 João Silva        │ │
│ │ OS #1234             │ │
│ │ ⏳ Venc: 15/02/2025  │ │
│ │ 💰 R$ 1.500 (1/3)    │ │
│ │ [Receber] [Detalhes] │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 👤 Maria Santos      │ │
│ │ OS #1235             │ │
│ │ ⚠️ Venc: 10/02/2025  │ │
│ │ 💰 R$ 3.000 (2/2)    │ │
│ │ [Receber] [Detalhes] │ │
│ └──────────────────────┘ │
│                          │
│ [Carregar mais...]       │
│                          │
│ [+ Nova Conta]           │
└──────────────────────────┘
```

## Modal: Registrar Recebimento

```
┌────────────────────────────────────────┐
│  💰 Registrar Recebimento         [✕] │
├────────────────────────────────────────┤
│                                        │
│  Cliente: João Silva                   │
│  OS: #1234                             │
│  Valor Original: R$ 1.500,00           │
│  Parcela: 1/3                          │
│  Vencimento: 15/02/2025                │
│                                        │
│  ───────────────────────────────────── │
│                                        │
│  Data de Recebimento *                 │
│  [📅 01/02/2025            ]           │
│                                        │
│  Valor Recebido *                      │
│  [💵 R$ 1.500,00           ]           │
│                                        │
│  Forma de Pagamento *                  │
│  [💳 PIX                ▼]             │
│                                        │
│  Juros/Multa (calculado)               │
│  [R$ 0,00                  ]           │
│                                        │
│  Desconto                              │
│  [R$ 0,00                  ]           │
│                                        │
│  ───────────────────────────────────── │
│  Total a Receber: R$ 1.500,00          │
│  ───────────────────────────────────── │
│                                        │
│  Observações                           │
│  [____________________________]        │
│  [____________________________]        │
│                                        │
│         [Cancelar] [Confirmar]         │
└────────────────────────────────────────┘
```

## Componentes Shadcn/ui

### Imports
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Table } from "@/components/ui/table"
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
```

### Status Badge
```typescript
<Badge variant={status === 'paid' ? 'success' : status === 'overdue' ? 'destructive' : 'warning'}>
  {status}
</Badge>
```

---

**Versão:** 1.0
