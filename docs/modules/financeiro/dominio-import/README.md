# Importação Domínio — Folha de pagamento e impostos

Pasta de discovery + spec para integração com o sistema **Domínio Contábil** usado pela Favarini.

## Documentos

| Arquivo | ClickUp | Status | Conteúdo |
|---|---|---|---|
| [`template-discovery.md`](template-discovery.md) | [`86agmy9tg`](https://app.clickup.com/t/86agmy9tg) | scoping | Perguntas estruturadas para Avelino (contabilidade) sobre o formato do arquivo Domínio. |
| [`historical-period-decision.md`](historical-period-decision.md) | [`86agmy9px`](https://app.clickup.com/t/86agmy9px) | in design | Análise das opções 3/6/12 meses + recomendação (6 meses + estratégia híbrida por tipo de dado). |
| [`implementation-spec.md`](implementation-spec.md) | [`86agymyc9`](https://app.clickup.com/t/86agymyc9) | in design (bloqueado) | Spec técnica completa de implementação — com placeholders `🔲 PENDENTE` que dependem das duas tasks acima. |

## Ordem de execução

1. Conversar com **Avelino** → preencher `template-discovery.md` e anexar amostras reais em `samples/`.
2. Acordar com **Fernanda + Renan** a janela de migração → fechar `historical-period-decision.md`.
3. Implementar o importer seguindo `implementation-spec.md` (preencher placeholders).

## samples/

Anexar aqui os arquivos-exemplo enviados pela contabilidade (ao menos 3: 1 folha mensal, 1 13º, 1 retificação). Manter nomes neutros (sem dados sensíveis no path). Sugestão de naming:

```
samples/
  folha-2026-05.{txt|xls|pdf}
  impostos-2026-05.{txt|xls|pdf}
  folha-2025-12-decimo-terceiro.{...}
  folha-2026-05-retificacao.{...}
```

⚠️ Arquivos com dados reais de funcionários (CPF, salário) — **não commitar** se não estiverem mascarados. Quando em dúvida, manter local apenas.
