# Importação Domínio — Discovery do template de folha de pagamento

**ClickUp:** [`86agmy9tg`](https://app.clickup.com/t/86agmy9tg)
**Status:** scoping — aguarda conversa com Avelino (contabilidade)
**Stakeholder externo:** Avelino (Contabilidade Favarini / Sistema Domínio)
**Owner:** Pedro Henrique (CTO)

---

## Contexto

A Favarini Motores usa o sistema **Domínio Contábil** para folha de pagamento e impostos. A contabilidade exporta arquivos (PDF e/ou XLS) que hoje são lançados **linha a linha manualmente** no AP do ERP. O objetivo é importar automaticamente esses arquivos, eliminando o trabalho manual.

A Fernanda Silveira (Favarini) já enviou exemplos para Renan em reunião anterior — esses arquivos precisam ser **anexados a essa pasta** (`docs/modules/financeiro/dominio-import/samples/`) antes da implementação.

Esta nota lista as perguntas estruturadas a serem feitas ao Avelino na próxima reunião com contabilidade. Antes de implementar [`86agymyc9`](https://app.clickup.com/t/86agymyc9), as respostas precisam estar registradas aqui.

---

## Hipóteses iniciais (a confirmar com Avelino)

| # | Hipótese | Confiança | Como confirmar |
|---|---|---|---|
| H1 | Domínio gera 2 arquivos distintos: **folha de pagamento** (resumo + funcionários) e **impostos / encargos** (DARF, GPS, FGTS). | Média | Pedir ambos os exemplos. |
| H2 | O formato canônico é **TXT/CSV** (layout posicional) — PDF/XLS são versões "amigáveis" do mesmo dado. | Média | Domínio costuma ter export TXT padrão. |
| H3 | Há um campo **CNPJ da empresa** no header — permite roteamento multi-org (Favarini Motores, Favarini Logística etc.). | Alta | Confirmar header. |
| H4 | Cada linha de funcionário tem **rubricas separadas** (proventos, descontos, INSS, IRRF, FGTS, líquido). | Alta | Confirmar layout. |
| H5 | Periodicidade do arquivo é **mensal** (folha fechada) com **vencimentos do 5º dia útil + DARF/GPS/FGTS no 7º/20º**. | Alta | Confirmar com Fernanda. |

---

## Perguntas estruturadas para Avelino

### 1. Formato e estrutura do arquivo

- [ ] Qual o **formato exato** exportado pelo Domínio? (TXT posicional / TXT delimitado / CSV / XLS / PDF estruturado)
- [ ] Existe **layout oficial documentado** do Domínio? Se sim, conseguimos o PDF do layout?
- [ ] O arquivo tem **header com identificação** da empresa (CNPJ, razão social, competência)?
- [ ] Qual o **encoding** (UTF-8, ISO-8859-1 / Latin-1, Windows-1252)?
- [ ] Existe **rodapé com totais** (checksum)?

### 2. Conteúdo por tipo de exportação

#### Folha de pagamento
- [ ] Por funcionário, quais **rubricas** vêm separadas? (salário base, horas extras, comissões, INSS retido, IRRF retido, FGTS, líquido a pagar, etc.)
- [ ] **Funcionários** vêm identificados por: CPF / matrícula / nome / código interno?
- [ ] **Vencimento do líquido** vem explícito ou é convenção interna (5º dia útil)?
- [ ] **Adiantamento** (vale) é arquivo separado ou linha dentro da folha?
- [ ] **13º salário** e **férias** vêm no mesmo arquivo da folha mensal ou separado?

#### Impostos / encargos
- [ ] Quais **guias** vêm: DARF (IRRF + IRPJ + PIS/COFINS), GPS (INSS patronal + empregado), FGTS, ISS retido, INSS-PJ?
- [ ] Cada guia vem com **vencimento** explícito?
- [ ] Cada guia vem com **código de receita / barcode**?
- [ ] Os impostos vêm **agregados por mês** ou **discriminados por funcionário/operação**?

### 3. Periodicidade e ciclo

- [ ] Qual o **dia do mês** em que o arquivo de folha é disponibilizado?
- [ ] Qual o **dia do mês** em que o arquivo de impostos é disponibilizado?
- [ ] Há **arquivos extras intra-mês** (folha quinzenal? adiantamento?)
- [ ] Como funciona o **fechamento de competência**? Pode haver retificação após import?

### 4. Conciliação no ERP de destino

- [ ] Cada linha do arquivo deve gerar **uma duplicata em contas a pagar**, ou agrupar por categoria?
- [ ] Devemos vincular cada lançamento a um **fornecedor cadastrado** (funcionário = "fornecedor pessoa física"? União = fornecedor DARF? Caixa Econômica = fornecedor FGTS?)
- [ ] Ou criar **centro de custo "Folha"** com lançamento agregado e detalhamento na descrição?
- [ ] Há expectativa de **rateio por centro de custo** (funcionário → setor)?

### 5. Volume e amostra

- [ ] Quantos **funcionários ativos** hoje? (dimensiona tamanho típico do arquivo)
- [ ] **Volume médio de linhas** por arquivo mensal?
- [ ] Pode nos enviar **3 exemplos**: 1 folha mensal, 1 13º, 1 mês com retificação?

### 6. Operacional

- [ ] **Quem** carrega esses arquivos no ERP (Fernanda? Avelino? auxiliar)?
- [ ] **Frequência esperada** de uso: 1×/mês? 2×/mês?
- [ ] Há necessidade de **revisão prévia** antes do commit (preview + ajustes manuais), ou import direto?
- [ ] Em caso de erro de parsing, o sistema deve **bloquear inteiro** ou **importar o que conseguir + relatório de falhas**?

---

## Output esperado da discovery

Após a conversa, esta página deve ser preenchida com:

1. **Especificação do layout** (TXT fixo: posições; CSV: delimitador, ordem das colunas; XLS: planilhas/colunas; PDF: estratégia de extração).
2. **Amostras reais** anexadas em `samples/` — pelo menos 1 folha + 1 impostos + 1 retificação.
3. **Mapa rubrica → lançamento financeiro** (cada linha do Domínio vira que tipo de AP).
4. **Decisão sobre granularidade** (1 linha = 1 duplicata vs. agregado).
5. **Política de erro** (bloqueio total vs. parcial).

Quando todos os 5 itens estiverem fechados → mover [`86agmy9tg`](https://app.clickup.com/t/86agmy9tg) para `shipped` e iniciar implementação de [`86agymyc9`](https://app.clickup.com/t/86agymyc9) seguindo `implementation-spec.md`.
