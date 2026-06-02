# Importação Domínio — Spec de implementação

**ClickUp:** [`86agymyc9`](https://app.clickup.com/t/86agymyc9)
**Status:** in design — **bloqueada** por `86agmy9tg` (formato real) e `86agmy9px` (janela)
**Owner:** Pedro Henrique (CTO)

> ⚠️ Esta spec tem **placeholders** marcados como `🔲 PENDENTE` que dependem do output da discovery com Avelino. **Não implementar até preencher.**

---

## Objetivo

Importar automaticamente arquivos do **sistema Domínio Contábil** (folha de pagamento + impostos) para Contas a Pagar do ERP, eliminando lançamento manual linha a linha.

---

## Escopo

**Dentro:**
- Upload de arquivo (UI + service)
- Parser do layout Domínio
- Validação e dry-run (preview)
- Commit em `accounts_payable` (idempotente)
- Relatório de erros e linhas não conciliadas
- Histórico de importações

**Fora (próximas iterações):**
- Integração via API Domínio (não há API pública confirmada — fica como exploração futura)
- Reconciliação automática com extrato bancário (já existe módulo separado)
- Cálculo de folha dentro do ERP (Domínio segue como sistema de origem)

---

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ UI: DominioImport│ ──> │ DominioImportSvc │ ──> │ Parser (factory)│
│   (upload + UI) │     │  (orquestração)  │     │ TXT / CSV / XLS │
└─────────────────┘     └─────────┬────────┘     └────────┬────────┘
                                  │                       │
                                  ▼                       ▼
                        ┌──────────────────┐    ┌──────────────────┐
                        │ DryRunResult     │    │ Mapper           │
                        │ (preview UI)     │    │ rubrica → AP     │
                        └─────────┬────────┘    └──────────────────┘
                                  │
                       (user confirma)
                                  │
                                  ▼
                        ┌──────────────────┐
                        │ commit batch:    │
                        │ - accounts_payable│
                        │ - import_history │
                        │ - audit_log      │
                        └──────────────────┘
```

---

## Schema

### Nova tabela: `dominio_imports`

Registra cada execução de importação para idempotência + auditoria.

```sql
CREATE TABLE public.dominio_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  file_hash TEXT NOT NULL,  -- SHA-256 do conteúdo, dedupe
  file_name TEXT NOT NULL,
  file_kind TEXT NOT NULL CHECK (file_kind IN ('folha', 'impostos')),
  competence_month DATE NOT NULL,  -- mês de competência (ex: 2026-05-01)

  status TEXT NOT NULL CHECK (status IN ('pending', 'dry_run', 'committed', 'failed', 'rolled_back')),
  total_lines INTEGER NOT NULL DEFAULT 0,
  successful_lines INTEGER NOT NULL DEFAULT 0,
  failed_lines INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,

  errors JSONB,
  metadata JSONB,

  imported_by UUID REFERENCES auth.users(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (org_id, file_hash)
);
```

**RLS** na mesma migration (padrão da casa, conforme `feedback_rls_em_tabelas_novas.md`).

### Adição em `accounts_payable`

Vincular cada AP gerada a sua origem de import:

```sql
ALTER TABLE public.accounts_payable
  ADD COLUMN IF NOT EXISTS dominio_import_id UUID
    REFERENCES public.dominio_imports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ap_dominio_import
  ON public.accounts_payable(dominio_import_id)
  WHERE dominio_import_id IS NOT NULL;
```

---

## Parsers

Estratégia: **factory por `file_kind` + extensão**.

```ts
// src/services/financial/dominio/parsers/index.ts
export type ParsedDominioRow = {
  rowNumber: number;
  competenceMonth: string; // YYYY-MM-DD (1º do mês)
  vendorCnpj?: string | null;
  vendorCpf?: string | null;
  vendorName: string;
  category: 'folha_liquido' | 'inss' | 'fgts' | 'irrf' | 'darf' | 'gps' | 'iss' | 'outros';
  description: string;
  amount: number;
  dueDate: string;
  rawLine?: string; // pra debug
};

export interface DominioParser {
  kind: 'folha' | 'impostos';
  formats: Array<'txt' | 'csv' | 'xls' | 'pdf'>;
  parse(buffer: ArrayBuffer): Promise<ParsedDominioRow[]>;
}
```

🔲 **PENDENTE — definir após discovery**:
- Layout do TXT/CSV (posições/delimitadores)
- Estrutura das planilhas XLS (sheets, headers, ordem das colunas)
- Estratégia para PDF (text extraction + regex, ou exigir XLS)

---

## Mapper (rubrica → AP)

Cada linha parsed vira **uma duplicata** em `accounts_payable`. Mapeamento:

| Categoria | `description` template | `supplier_id` lookup | `due_date` default |
|---|---|---|---|
| `folha_liquido` | `Folha {competência} — {nome funcionário}` | Por CPF do funcionário | 5º dia útil do mês seguinte |
| `inss` (GPS) | `GPS {competência}` | Fornecedor: "INSS" / Receita Federal | dia 20 do mês seguinte |
| `fgts` | `FGTS {competência}` | Fornecedor: "Caixa Econômica Federal" | dia 7 do mês seguinte |
| `irrf` | `DARF IRRF {competência}` | Fornecedor: "Receita Federal" | último dia útil do mês seguinte |
| `darf` (genérico) | `DARF {código receita} {competência}` | Fornecedor: "Receita Federal" | conforme guia |
| `iss` | `ISS {competência}` | Fornecedor: "Prefeitura" | conforme município |

🔲 **PENDENTE — confirmar com Avelino:**
- Datas exatas de vencimento (cada uma)
- Como tratar funcionário não cadastrado como fornecedor (criar PJ "Funcionário X"? rejeitar com erro?)

---

## Fluxo de usuário

1. **Página**: `/financeiro/importar-dominio` (route nova).
2. **Upload**: dropzone aceita `.txt`, `.csv`, `.xls`, `.xlsx`, `.pdf`. Usuário seleciona `file_kind` (folha / impostos).
3. **Parsing automático**: SHA-256 do arquivo gera dedupe (se já importado, mostra dialog "já importado em DD/MM, ver lançamentos").
4. **Dry-run**: mostra tabela completa do que será criado (linhas, valores, vencimentos, totais). Linhas com erro destacadas.
5. **Confirmação**: usuário pode:
   - **Confirmar tudo** → batch INSERT em `accounts_payable` + `dominio_imports.status = 'committed'`.
   - **Cancelar** → `dominio_imports.status = 'rolled_back'`.
   - **Editar manualmente** linhas individuais antes de commitar (escopo opcional v1.1).
6. **Histórico**: tab "Importações" mostra arquivos passados com filtro por competência.

---

## Idempotência

- `file_hash` único por (org_id, file_hash) — não permite reimportar mesmo conteúdo.
- Para **retificação**: usuário precisa explicitamente "estornar" o import antigo (gera UPDATE `status='rolled_back'` + reverte cada AP para `voided`) antes de importar versão nova.

---

## Tratamento de erro

Política (a confirmar com Avelino — pergunta 6 da discovery):

**Opção recomendada — "parcial com relatório":**
- Linhas válidas → AP criadas.
- Linhas com erro → ficam em `dominio_imports.errors` (JSONB), AP **não** é criada.
- UI mostra contador "X de Y importadas, ver relatório de erros".

**Alternativa — "tudo ou nada":**
- Qualquer erro → rollback completo, usuário corrige e reenvia.

---

## Testes

Cobrir como **unit**:
- Parser por cada formato (TXT/CSV/XLS/PDF) — fixtures em `samples/`.
- Mapper rubrica → categoria de AP.
- Dedupe por SHA-256.
- Idempotência (reimportar mesmo hash retorna early com mensagem).

Cobrir como **integration** (com supabase local):
- Dry-run não escreve em `accounts_payable`.
- Commit de N linhas resulta em N APs.
- Rollback de import reverte APs corretamente.

---

## Estimativa

| Fase | Esforço | Bloqueado por |
|---|---|---|
| Schema + migrations | 0.5 dia | — |
| Parser TXT/CSV | 1 dia | layout do Domínio |
| Parser XLS | 0.5 dia | estrutura da planilha |
| Parser PDF | 1-2 dias (alta variabilidade) | layout do PDF |
| Mapper + dedupe + commit | 1 dia | — |
| UI (upload + preview + commit) | 1.5 dias | — |
| Testes | 1 dia | fixtures reais |
| **Total** | **6.5-7.5 dias** | discovery |

🔲 Confirmar formato real antes de estimar PDF. Se PDF for inviável, **negociar com Avelino** para gerar export TXT/XLS direto do Domínio.

---

## Checklist pré-implementação

- [ ] [`86agmy9tg`](https://app.clickup.com/t/86agmy9tg) — `shipped` (template definido)
- [ ] [`86agmy9px`](https://app.clickup.com/t/86agmy9px) — `shipped` (janela acordada)
- [ ] 3 arquivos-exemplo do Domínio em `samples/`
- [ ] Mapa rubrica → AP confirmado por Avelino
- [ ] Política de erro definida (parcial vs total)

Quando todos ✅, mover `86agymyc9` para `in development` e implementar nesta ordem: schema → parsers → mapper → UI → testes.
