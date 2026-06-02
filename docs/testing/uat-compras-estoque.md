# UAT — Compras e Estoque

**ClickUp:** [`86agmy9pd`](https://app.clickup.com/t/86agmy9pd)
**Tipo:** Teste de Aceitação do Usuário (UAT) — operação manual da equipe
**Owner técnico:** Pedro Henrique
**Owner de negócio:** Fernanda Silveira (Favarini)
**Período sugerido:** 3 dias úteis (1 Compras / 1 Estoque / 1 cross-module)

---

## Objetivo

Validar que os módulos de **Compras** e **Estoque** atendem aos fluxos diários de trabalho da Favarini antes da homologação final. Foco em telas, integridade de dados e ergonomia operacional.

---

## Pré-requisitos

### Ambiente

- [ ] Apontar para **base de homologação** (não-produção). Confirmar URL no ambiente.
- [ ] Snapshot do banco antes do início (em caso de bug, podemos restaurar).
- [ ] Servidor de e-mail/notificações **desligado ou apontando para inbox de teste** (não enviar para fornecedores reais).

### Usuários

Cadastrar e logar pelo menos 1 usuário por papel:

| Papel | Permissões esperadas | Quem testa |
|---|---|---|
| **Admin** | Tudo | Pedro |
| **Manager** | Aprovações + relatórios | Fernanda |
| **Compras** | Cotação, PO, recebimento, NF | Equipe de compras |
| **Almoxarifado** | Estoque, movimentações, reservas, separação | Equipe de estoque |
| **Operacional** | Visualização OS + peças workshop | Mecânicos |

### Dados base

- [ ] 5 fornecedores cadastrados (mix de PJ tradicional, MEI, fornecedor com prazo, fornecedor à vista).
- [ ] 30 peças no catálogo (mix de motores diesel, comuns, retífica).
- [ ] 3 categorias de motor configuradas.
- [ ] 2 ordens de serviço aprovadas com peças no orçamento (pra testar reserva).

---

## Módulo 1 — Compras

### Fluxo 1.1 — Cadastro de fornecedor

| # | Passo | Esperado | Dados |
|---|---|---|---|
| 1 | Acessar Compras > Fornecedores > Novo | Form abre com campos obrigatórios marcados | — |
| 2 | Cadastrar fornecedor PJ com CNPJ válido | Aceita, salva, lista atualiza | CNPJ: 11.222.333/0001-44 |
| 3 | Tentar cadastrar com CNPJ inválido | Validação bloqueia, mensagem clara | CNPJ: 11.222.333/0001-99 |
| 4 | Editar fornecedor: alterar prazo médio | Salva, refletindo no card | de 30 para 45 dias |
| 5 | Inativar fornecedor | Some das listagens ativas, fica visível em "Inativos" | — |
| 6 | Cadastrar produtos do fornecedor | Lista de produtos com preço + prazo individual | 3 peças |

**Critérios de aceite:**
- ✅ Validação de CNPJ/CPF está correta.
- ✅ Prazo médio é persistido e usado em previsões.
- ✅ Produtos do fornecedor aparecem na cotação ao selecionar o fornecedor.

### Fluxo 1.2 — Solicitação de compra (PurchaseNeed)

| # | Passo | Esperado |
|---|---|---|
| 1 | Acessar Compras > Necessidades > Nova | Form de solicitação abre |
| 2 | Criar solicitação manual com 3 peças | Cria, status "pendente" |
| 3 | Verificar geração automática a partir de estoque baixo | Sistema sugere itens com `quantity < min_stock` |
| 4 | Aprovar solicitação | Status muda para "aprovada", pronta pra cotação |
| 5 | Rejeitar solicitação com motivo | Status "rejeitada", motivo registrado |

### Fluxo 1.3 — Cotação (RFQ)

| # | Passo | Esperado |
|---|---|---|
| 1 | Compras > Cotações > Nova | Form abre |
| 2 | Selecionar peças da necessidade aprovada | Itens copiados |
| 3 | Adicionar 3 fornecedores cotados | Adiciona como linhas |
| 4 | Inserir propostas (preço + prazo) para cada fornecedor | Tabela comparativa atualiza |
| 5 | Acionar "Comparar propostas" | Modal mostra melhor por critério (preço, prazo, total) |
| 6 | Aprovar fornecedor vencedor | Cotação fica "aprovada", PO sugerido |
| 7 | **Edge case:** copiar cotação para outro mês | Nova cotação herda itens, fornecedores limpos |
| 8 | **Edge case:** reabrir cotação aprovada | Permitir reabrir com motivo, status volta para "aberta" |

**Critérios de aceite:**
- ✅ Comparação de propostas é correta matematicamente.
- ✅ Cotação aprovada vira PO com 1 clique.
- ✅ Histórico de revisões é visível.

### Fluxo 1.4 — Pedido de compra (PO)

| # | Passo | Esperado |
|---|---|---|
| 1 | Gerar PO a partir de cotação aprovada | PO criado, vinculado à cotação |
| 2 | Imprimir PO | PDF gerado com cabeçalho da empresa, itens, totais |
| 3 | Enviar PO ao fornecedor por e-mail (se ativo) | E-mail entregue (em inbox de teste) |
| 4 | Editar PO antes do envio | Permite alterar quantidade e preço |
| 5 | Cancelar PO antes do recebimento | Cancela, libera saldo da cotação |
| 6 | **Edge case:** PO com aprovação por valor (threshold) | Bloqueia até aprovação do nível adequado |

### Fluxo 1.5 — Recebimento + NF entrada

| # | Passo | Esperado |
|---|---|---|
| 1 | Compras > Recebimentos > Receber PO | Modal abre com itens do PO |
| 2 | Receber **parcial** (qty < pedida) | Salva, PO fica "parcial", saldo aberto |
| 3 | Receber **total** | PO fica "recebido", estoque incrementado |
| 4 | Registrar NF entrada (Invoice) | Vincula NF ao PO, gera AP automaticamente |
| 5 | Conferir: AP gerada com fornecedor e vencimento corretos | AP aparece em "Contas a pagar" |
| 6 | Conferir: estoque incrementado com `unit_cost` correto | Custo médio recalculado |
| 7 | **Edge case:** receber qty > pedida | Bloqueia com mensagem |
| 8 | **Edge case:** NF com diferença de valor vs PO | Aceita, mas registra divergência |
| 9 | Devolução parcial ao fornecedor | Estoque é decrementado, AP recalcula |

**Critérios de aceite:**
- ✅ Custo médio atualiza corretamente após cada entrada (validar pelo método configurado).
- ✅ AP é criada com vencimento correto (data NF + prazo do fornecedor).
- ✅ Divergência de valor PO×NF é visível em relatório.

### Fluxo 1.6 — Avaliação de fornecedor

| # | Passo | Esperado |
|---|---|---|
| 1 | Avaliar fornecedor após recebimento | Form de avaliação abre (prazo, qualidade, preço) |
| 2 | Visualizar histórico de avaliações | Lista cronológica |
| 3 | Dashboard de fornecedores | Mostra média de avaliações, ranking |

---

## Módulo 2 — Estoque

### Fluxo 2.1 — Cadastro e configuração de peça

| # | Passo | Esperado |
|---|---|---|
| 1 | Estoque > Catálogo > Nova peça | Form abre |
| 2 | Cadastrar peça com código, nome, unidade | Salva, aparece no catálogo |
| 3 | Configurar estoque mínimo/máximo/ponto de pedido | Persiste, aparece em "Alertas" |
| 4 | Vincular fornecedores principais à peça | Lista de fornecedores |
| 5 | Definir custo médio inicial | Salva como `unit_cost` |
| 6 | **Edge case:** código duplicado | Validação bloqueia |
| 7 | Inativar peça | Some de listagens novas, mantém histórico |

### Fluxo 2.2 — Movimentações manuais

| # | Passo | Esperado |
|---|---|---|
| 1 | Estoque > Movimentações > Nova entrada | Form abre |
| 2 | Registrar entrada manual (motivo: ajuste de inventário) | Salva, estoque incrementa, log no histórico |
| 3 | Registrar saída manual com motivo | Estoque decrementa |
| 4 | **Edge case:** saída acima do disponível | Bloqueia |
| 5 | Aprovação obrigatória de movimentação? | Se sim, fluxo de approval funciona |
| 6 | Histórico mostra usuário, data, motivo, qty antes/depois | Visível |

### Fluxo 2.3 — Reservas e separação (vindas de OS)

| # | Passo | Esperado |
|---|---|---|
| 1 | Aprovar OS com peças no orçamento | Reservas são criadas automaticamente |
| 2 | Acessar Estoque > Reservas | Lista mostra reservas pendentes por OS |
| 3 | Separar peça (separation) | Status muda para "separada" |
| 4 | Aplicar peça na OS (release) | Status "aplicada", estoque decrementa, custo da OS atualiza |
| 5 | Cancelar reserva (peça não usada) | Estoque liberado |
| 6 | **Edge case:** OS aprovada + regra desabilitada → almoxarifado tenta adicionar peça extra | Bloqueia conforme task `86agmy9k7` (commit `db1d8e2`) |

**Critérios de aceite:**
- ✅ Reserva nunca permite saída além do reservado.
- ✅ Custo da OS é atualizado com `unit_price_applied` correto.

### Fluxo 2.4 — Contagem e ajuste de inventário

| # | Passo | Esperado |
|---|---|---|
| 1 | Iniciar contagem | Modal abre com lista de peças |
| 2 | Inserir contagem física por peça | Divergência calculada (sistema × físico) |
| 3 | Aplicar ajuste | Movimentação de ajuste gerada por peça divergente |
| 4 | Encerrar contagem | Histórico de contagem persistido |
| 5 | Relatório de divergências da contagem | Exportável |

### Fluxo 2.5 — Rastreabilidade por OS

| # | Passo | Esperado |
|---|---|---|
| 1 | Acessar OS com peças aplicadas | Aba "Peças" mostra rastreabilidade |
| 2 | Clicar em "Trace" de uma peça | Modal mostra origem (NF entrada), custo, fornecedor |
| 3 | Validar mesma peça em múltiplas OS | Cada OS tem sua linha de baixa |

### Fluxo 2.6 — Custo médio (método contábil)

| # | Passo | Esperado |
|---|---|---|
| 1 | Configurar método: custo médio ponderado | Salva |
| 2 | Receber 100un a R$10 | Custo médio = R$10 |
| 3 | Receber 100un a R$12 | Custo médio = R$11 |
| 4 | Sair 50un | Custo médio mantém R$11 |
| 5 | Validar relatório de custo médio | Bate com fórmula |
| 6 | Alternar método para FIFO | Recálculo aplicado nas saídas seguintes |

**Critérios de aceite:**
- ✅ Custo médio é calculado conforme método configurado.
- ✅ Relatório de movimentações mostra custo unitário por linha.

### Fluxo 2.7 — Alertas de estoque

| # | Passo | Esperado |
|---|---|---|
| 1 | Reduzir estoque abaixo do mínimo | Alerta aparece no dashboard |
| 2 | Acessar lista de alertas | Mostra peças com motivo (abaixo do mínimo, sem giro, etc) |
| 3 | Gerar PurchaseNeed a partir de alerta | Cria solicitação pré-preenchida |

---

## Cross-module — integração Compras × Estoque

| # | Cenário | Esperado |
|---|---|---|
| 1 | Receber PO → estoque deve refletir imediato | Quantidade nova visível em < 5s |
| 2 | NF entrada → AP + estoque + custo médio em sincronia | 3 efeitos consistentes |
| 3 | Devolução ao fornecedor → AP é estornada + estoque decrementa + custo médio recalcula | Tudo coerente |
| 4 | OS aprovada → reserva criada → baixa via workshop → custo aplicado na OS | Toda a cadeia funciona |
| 5 | Cancelar OS após baixa parcial → estorno de estoque, custo da OS volta | Sem inconsistência |
| 6 | Conferir log de auditoria de uma peça com várias mudanças | Cada mudança rastreável |

---

## Bug tracking

Cada bug encontrado vai pro ClickUp como **task filha** desta, com:

- **Título:** `[UAT][Compras|Estoque] <descrição curta>`
- **Severidade:** crítica (bloqueia operação) / alta (workaround viável) / média (incômodo) / baixa (cosmético)
- **Reprodução:** passos numerados
- **Esperado vs observado**
- **Print/screencast** anexado
- **Ambiente:** versão do app (commit hash visível no rodapé) + browser

Template inicial:

```
Título: [UAT][Compras] Recebimento parcial não atualiza saldo do PO

Severidade: alta
Ambiente: hml v<commit-hash>, Chrome 129

Passos:
1. Criar PO com 100un peça X
2. Receber 60un
3. Conferir tela do PO

Esperado: PO mostra "40un a receber"
Observado: PO mostra "0un a receber" e status "recebido"
```

---

## Definition of Done UAT

A task `86agmy9pd` só vai para `shipped` quando:

- [ ] Todos os fluxos acima foram executados pelo menos uma vez.
- [ ] Bugs **críticos** = 0 (não há nenhum aberto).
- [ ] Bugs **altos** = 0 ou com workaround documentado e acordado.
- [ ] Bugs **médios/baixos** estão no ClickUp como tasks filhas para próximas iterações.
- [ ] Fernanda + Pedro assinaram (commit no doc com nome + data).

---

## Resultado da execução

> Esta seção é preenchida durante o UAT real. Manter atualizada conforme avança.

### Compras

- Início: __/__/____
- Término: __/__/____
- Bugs encontrados: 0 críticos / 0 altos / 0 médios / 0 baixos
- Observações:

### Estoque

- Início: __/__/____
- Término: __/__/____
- Bugs encontrados: 0 críticos / 0 altos / 0 médios / 0 baixos
- Observações:

### Cross-module

- Início: __/__/____
- Término: __/__/____
- Bugs encontrados: 0 críticos / 0 altos / 0 médios / 0 baixos
- Observações:

---

## Assinaturas

- [ ] **Fernanda Silveira** (negócio) — _____________  Data: __/__/____
- [ ] **Pedro Henrique** (técnico) — _____________  Data: __/__/____
