# Período de histórico para importação inicial — Decisão

**ClickUp:** [`86agmy9px`](https://app.clickup.com/t/86agmy9px)
**Status:** in design — decisão pendente
**Owner:** Pedro Henrique (CTO)
**Stakeholders:** Renan (CEO), Fernanda (Favarini), Avelino (Contabilidade)

---

## Decisão pedida

Quanto histórico do sistema atual (Domínio + sistema legado) deve ser **importado para popular a base de teste** antes da virada de chave do ERP?

Opções: **3 meses**, **6 meses** ou **12 meses**.

---

## Recomendação

> **6 meses** com a possibilidade de estender para 12 meses só nas tabelas-base (clientes, fornecedores, peças) onde o custo é baixo.

Justificativa resumida na tabela abaixo.

---

## Análise comparativa

| Critério | 3 meses | 6 meses ✅ | 12 meses |
|---|---|---|---|
| **Cobertura de sazonalidade** | Baixa — não cobre 1 trimestre fiscal completo. | Boa — cobre 2 trimestres, captura sazonalidade de início/meio do ano. | Excelente — ciclo anual completo (Natal, recessos, fechamento). |
| **Volume estimado (CR/CP)** | ~600 duplicatas | ~1.200 duplicatas | ~2.400 duplicatas |
| **Volume estimado (OS)** | ~150 ordens | ~300 ordens | ~600 ordens |
| **Custo de storage (Supabase)** | Desprezível | Desprezível | Desprezível ([DADO]: 12m de OS ainda cabe folgado no plano free.) |
| **Custo de parsing/ETL** | Baixo — 1 batch | Médio — pode precisar paginar | Alto — paginação obrigatória, risco de timeout de função |
| **Risco de carregar erro do legado** | Baixo — janela curta isola problemas. | Médio. | **Alto** — quanto mais histórico, mais chance de inconsistência. |
| **Valor para validação operacional** | Limitado — usuário não sente "naturalidade" no sistema. | Bom — cobre DRE/PMR/PMP com base estatística suficiente. | Excelente para DRE comparativo (YoY). |
| **Valor para fluxo projetado** | Insuficiente — projeção fica com pouco baseline. | Suficiente — média móvel 6m é o padrão dos cenários. | Pouco ganho marginal sobre 6m. |
| **Tempo de migração** | 1-2 dias | 3-5 dias | 1-2 semanas |
| **Risco em caso de bug no importer** | Refazer 3m é barato | Refazer 6m incomoda | Refazer 12m bloqueia 1 semana |

---

## Por que 6 meses

1. **Captura sazonalidade mínima útil** — DRE com ≥6m permite ver dois trimestres, validar margem por linha de serviço, identificar outliers.
2. **Fluxo projetado funcional desde o dia 1** — os cenários otimista/pessimista (commit `96de065`) usam média móvel; com 6m a média é estatisticamente decente.
3. **Custo do erro é proporcional** — se algo der errado no importer, refazer 6m é incômodo mas viável; 12m bloqueia equipe.
4. **Permite estratégia incremental** — importa 6m agora, e à medida que o ERP vai recebendo dados novos, em 6 meses temos 12m no sistema **de qualidade** (sem arrastar lixo do legado).

---

## Estratégia híbrida proposta

Aplicar **janela diferenciada por tipo de dado** — não tudo precisa do mesmo período:

| Tipo de dado | Período | Justificativa |
|---|---|---|
| **Clientes** | 12m+ (tudo que tiver) | Custo trivial; não queremos cliente recorrente "sumir" só porque comprou há 8m. |
| **Fornecedores** | 12m+ (tudo que tiver) | Mesmo motivo. |
| **Peças / Estoque** | Snapshot atual + 6m de movimentações | Snapshot atual é obrigatório; movimentações só pra rastreabilidade. |
| **OS (orders)** | 6m | Histórico operacional; serve pra dashboard e métricas. |
| **CR (accounts_receivable)** | 6m + **todos em aberto** (independente da idade) | Inadimplência antiga precisa entrar — não pode esquecer dívida de 18m só por causa da janela. |
| **CP (accounts_payable)** | 6m + **todos em aberto** | Mesmo motivo. |
| **Folha de pagamento (Domínio)** | 6m | Alinha com o resto da DRE. |
| **Movimentações bancárias** | 6m | Permite conciliação histórica. |

---

## Implicações para [`86agymyc9`](https://app.clickup.com/t/86agymyc9) (importador Domínio)

- O importer precisa aceitar **N arquivos** (6 meses → 6 arquivos de folha + 6 de impostos).
- Deve ser **idempotente** — reimportar o mesmo arquivo não duplica lançamentos.
- Deve permitir **dry-run** (preview) antes do commit.
- Deve gerar **relatório de discrepâncias** (linhas que não casaram com fornecedor cadastrado, valores zerados, datas fora da janela).

---

## Pendências para confirmar

- [ ] **Fernanda**: aceita 6 meses como janela operacional?
- [ ] **Avelino**: consegue exportar os últimos 6 meses do Domínio em lote?
- [ ] **Renan**: aprova estratégia híbrida (cadastros 12m+ / movimentações 6m)?

Quando os 3 marcarem ✅, mover esta task para `shipped` e referenciar esta decisão como input do importer.
