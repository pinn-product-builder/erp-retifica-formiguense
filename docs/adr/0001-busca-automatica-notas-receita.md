# ADR 0001 — Busca automática de notas fiscais na Receita

- **Status:** Proposto (discovery — sem código)
- **Data:** 2026-06-30
- **Decisores:** Pedro Henrique (CTO), Renan (CEO), Favarini (cliente piloto)
- **Demanda original:** "Configurar rotina de busca automática de notas na Receita com intervalo configurável (ex.: 15 minutos) e adicionar botão de atualização manual com alerta quando necessário."

> Este documento é **discovery**. Não há código nesta sprint. O objetivo é alinhar fornecedor, escopo, custo e cronograma antes de comprometer engenharia.

---

## 1. Contexto

O ERP hoje recebe notas fiscais (NF-e e NFC-e) por **upload manual de XML** dentro de `Compras → Registrar nota → Upload XML` (modal `InvoiceRegistrationModal`) e, a partir desta sprint, também por **tela standalone de teste** (`/importar-xml`). O parser local (`NFeXmlService.parseNFeXml`) já extrai cabeçalho, itens e duplicatas corretamente para arquivos válidos.

O fluxo manual tem três falhas operacionais conhecidas:

1. **Janela cega.** Quando o fornecedor emite e não envia o XML, a nota só entra no ERP quando a mercadoria chega — ou pior, quando o fiscal cobra. O cliente perde rastreabilidade de NF-e que cita o seu CNPJ como destinatário.
2. **Dependência de comportamento humano.** Todo recebimento exige que alguém abra o e-mail do fornecedor, salve o XML, abra o ERP, suba o arquivo. Em volume alto (Favarini: ~40-60 NF-e de entrada/mês por filial), isso vira backlog.
3. **Manifestação do destinatário.** A SEFAZ exige que, em até 180 dias, o destinatário "manifeste ciência" das NF-e contra seu CNPJ. Sem rotina automática, isso é feito atrasado, gerando passivo fiscal.

A demanda do cliente é: **buscar automaticamente todas as NF-e contra o CNPJ da empresa**, com agendador configurável (ex.: a cada 15 min) e botão de atualização manual.

---

## 2. Escopo do que "buscar automaticamente" significa

A SEFAZ disponibiliza dois webservices relevantes:

- **NFeDistribuicaoDFe** (federal, ambiente nacional): retorna todos os documentos fiscais eletrônicos (NF-e, NFC-e, CT-e, eventos) emitidos contra um CNPJ destinatário, em qualquer UF. Paginado por NSU (Número Sequencial Único).
- **ManifestacaoDestinatario** (federal): registra eventos de "ciência da operação", "confirmação", "operação não realizada" ou "desconhecimento" — obrigatório para NF-e ≥ R$ 100.000,00 e recomendado para todas.

A rotina mínima viável consome `NFeDistribuicaoDFe` com paginação por NSU e armazena o XML completo. A versão completa também emite eventos de manifestação automáticos.

---

## 3. Opções avaliadas

### 3.1. Opção A — Integração direta SEFAZ via webservice oficial

Construir cliente SOAP que assina requisições com certificado A1 do cliente e consome `NFeDistribuicaoDFe`.

- **Stack:** Edge Function Supabase (Deno) ou serviço Node externo + biblioteca SOAP + assinatura XMLDSig + certificado A1 em pem/pfx.
- **Prós:**
  - Sem custo recorrente por consulta (paga apenas a infraestrutura).
  - Controle total sobre payload, retry, deduplicação.
  - Sem dependência de terceiro (continuidade do negócio).
- **Contras:**
  - **Gestão de certificado A1** em ambiente serverless é dor real (rotação anual, armazenamento seguro, KMS).
  - Assinatura XMLDSig sem libs maduras em Deno — provavelmente precisa de Node container (custo de infra extra).
  - Tratamento de erros SEFAZ (timeout, "consumo indevido", rejeição de schema) é responsabilidade nossa.
  - **Esforço de implementação:** ~3-5 semanas-engenheiro para v1 robusta.

### 3.2. Opção B — API agregadora (NFe.io, Webmania, Migrate, FocusNFe, Tecnospeed)

Contratar fornecedor que já implementou o cliente SOAP, expõe REST + webhook, e cuida de certificado A1 + DFe storage.

| Fornecedor | Modelo | Manifestação automática | Preço aproximado* |
|------------|--------|--------------------------|-------------------|
| **NFe.io** | REST + webhook | sim | a partir de R$ 0,25/NF-e baixada |
| **Webmania** | REST + webhook | sim | planos a partir de R$ 79/mês (até 500 NF-e) |
| **Migrate / Tecnospeed (Plug Notas)** | REST + webhook | sim | enterprise (~R$ 300-800/mês por CNPJ) |
| **FocusNFe** | REST + webhook | sim | R$ 0,15-0,30/NF-e |

\* valores indicativos coletados em pesquisa pública 2026-Q2. Confirmar com fornecedor antes de fechar.

- **Prós:**
  - **Esforço de implementação:** ~3-5 dias-engenheiro (cliente HTTP + processamento de webhook + persistência).
  - Certificado A1 hospedado pelo fornecedor (ou A3 ainda usando hardware do cliente).
  - SLA de uptime contratual e suporte.
  - Migrate/Plug Notas é o padrão de mercado dos ERPs nacionais.
- **Contras:**
  - **Lock-in:** se o fornecedor sair do ar ou subir preço, troca é mês de trabalho.
  - **Custo recorrente** escala com volume (Favarini × 40-60 NF-e/mês ≈ R$ 12-20/mês em FocusNFe; valor irrelevante para piloto, mas relevante em 50 clientes).
  - LGPD: XML de NF-e contém dados pessoais (CPF de transportador, contato emitente) — fornecedor passa a ser **operador de dados** e exige aditivo contratual.

### 3.3. Opção C — Manter apenas import manual (status quo) + lembrete

Não implementar a busca automática. Manter o XML por upload e adicionar um lembrete via cron interno ("você não importou XML há 48 h, verifique").

- **Prós:** custo zero, nada novo a manter.
- **Contras:** não resolve o problema do cliente. Não cumpre manifestação SEFAZ.
- **Quando faz sentido:** se o cliente piloto opera com volume baixíssimo (~10 NF/mês) e está OK com o manual. Não é o caso.

---

## 4. Decisão recomendada

**Opção B com FocusNFe ou Webmania para o piloto.** Justificativa:

1. **Time-to-value:** 3-5 dias contra 3-5 semanas. O cliente Favarini está em homologação ativa, não dá pra parar 5 semanas para construir cliente SOAP.
2. **Risco operacional baixo:** certificado A1 fora do nosso perímetro é menos uma coisa para quebrar e gerar suporte.
3. **Custo elástico:** R$ 12-80/mês por CNPJ se paga com a primeira hora de operação manual evitada.
4. **Saída plausível:** se a base passar de ~30 clientes, vale construir a integração direta (Opção A) como `internal-fallback` mantendo o fornecedor para nichos. A camada de persistência local (DFe staging) é a mesma — só troca o adapter.

A escolha entre FocusNFe e Webmania depende de:
- **Webmania** se o cliente prefere mensalidade fixa previsível (Favarini, perfil PME).
- **FocusNFe** se queremos cobrar por NF processada (preço variável repassável ao cliente).

> Renan precisa decidir entre FocusNFe (variável) e Webmania (fixa) antes de prosseguir. Recomendo **Webmania** para o piloto pela previsibilidade do custo.

---

## 5. Arquitetura proposta (Opção B)

```
┌──────────────────────────┐         ┌────────────────────────┐
│ Webmania / FocusNFe API  │ webhook │  Edge Function Supabase │
│ (cliente SEFAZ deles)    │────────▶│  /nfe-webhook-receiver  │
└──────────────────────────┘         └────────────┬───────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────┐
                                     │  Tabela received_nfe    │
                                     │  (org_id, chave, xml,   │
                                     │   status, fetched_at)   │
                                     └────────────┬────────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────┐
                                     │  pg_cron a cada 15 min  │
                                     │  reconcilia + alerta    │
                                     └─────────────────────────┘
```

- **`received_nfe`** (nova tabela): chave de acesso, XML bruto, JSON parsed, status (`pending_review`, `imported`, `rejected`, `cancelled`), `org_id`, FK opcional para `purchase_orders` quando vinculada.
- **Edge Function `nfe-webhook-receiver`**: valida HMAC do fornecedor, deduplica por chave_acesso, insere em `received_nfe`.
- **Botão "Atualizar agora"** na UI: chama edge function `nfe-pull-now` que dispara consulta forçada no fornecedor, ignorando o ciclo de 15 min.
- **Alerta visual**: badge na sidebar mostrando contagem de NF-e em `pending_review`.
- **Manifestação automática**: edge function `nfe-acknowledge` roda diariamente e envia "ciência da operação" para tudo `pending_review` com mais de 24 h.

---

## 6. Trade-offs explícitos e premortem

**6 meses depois, o que pode ter dado errado:**

1. **"O fornecedor saiu do ar por 6 h em um fechamento fiscal."** Mitigação: status page do fornecedor monitorado + alerta no Slack do CTO; fallback manual com upload XML continua funcionando.
2. **"O cliente recusa contratar Webmania/FocusNFe porque já tem contrato com outra plataforma fiscal."** Mitigação: a camada `received_nfe` é agnóstica; adapter trocável em ~1 dia.
3. **"NF-e contra CNPJ secundário (filial) não aparece."** Cuidado: `NFeDistribuicaoDFe` é por CNPJ — se a empresa tem matriz + filiais, cada CNPJ exige assinatura. Custo escala linear.
4. **"Custo subiu de R$ 80 para R$ 400/mês após o cliente crescer."** Mitigação: cláusula de teto no aditivo contratual; caso ultrapasse, gatilha estudo da Opção A.
5. **"LGPD: cliente é multado porque fornecedor vazou XML."** Mitigação: contrato de operador de dados assinado (Art. 39 LGPD), DPA com cláusula de subprocessador limitado.

---

## 7. Não-objetivos desta decisão

- **Não é** sobre emissão de NF-e (saída) — escopo separado, módulo fiscal já planeja isso.
- **Não é** sobre CT-e (transporte) — fica para fase 2.
- **Não é** sobre integração contábil — `received_nfe` alimenta o módulo contábil já existente.

---

## 8. Próximos passos (caso aprovado)

1. **Renan**: escolher fornecedor (Webmania vs FocusNFe) — *prazo: até 2026-07-07*.
2. **Renan**: contratar e enviar certificado A1 do Favarini para o fornecedor — *prazo: 7 dias após escolha*.
3. **Pedro**: spec técnica detalhada com endpoints e schema de `received_nfe` — *prazo: 3 dias após aprovação*.
4. **Pedro**: implementação v1 (edge function + tabela + botão manual) — *prazo: 5 dias úteis após spec*.
5. **Pedro + Favarini**: UAT em homologação com NF-e reais — *prazo: 3 dias após v1*.
6. **Pedro**: manifestação automática (fase 2) — *prazo: 5 dias úteis após v1 estável*.

**Total para v1 utilizável em produção: ~3 semanas a partir da escolha do fornecedor.**

---

## 9. Decisão pendente

> **Bloqueador:** este ADR fica em status `Proposto` até que Renan confirme o fornecedor. Após confirmação, mover para `Aceito` e abrir spec técnica em `docs/adr/0002-implementacao-nfe-distribuicao.md`.
