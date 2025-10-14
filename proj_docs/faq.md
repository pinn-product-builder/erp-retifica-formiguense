# ❓ Perguntas Frequentes (FAQ) - ERP Retífica

## 📋 Índice por Módulo
- [Geral](#geral)
- [Autenticação e Acesso](#autenticação-e-acesso)
- [Dashboard](#dashboard)
- [Ordens de Serviço](#ordens-de-serviço)
- [Workflow Kanban](#workflow-kanban)
- [Orçamentos](#orçamentos)
- [Módulo Fiscal](#módulo-fiscal)
- [Financeiro](#financeiro)
- [Estoque](#estoque)
- [Compras](#compras)
- [Usuários e Permissões](#usuários-e-permissões)
- [Problemas Técnicos](#problemas-técnicos)

---

## 🌐 Geral

### O que é o ERP Retífica?
É um sistema completo de gestão empresarial desenvolvido especificamente para retíficas de motores, com controle de operações, fiscal, financeiro, estoque e compras.

### Quem pode usar o sistema?
Empresas do ramo de retificação de motores (caminhões, máquinas industriais, geradores, etc.).

### O sistema funciona no celular?
**Sim!** O sistema é totalmente responsivo e funciona em:
- 💻 Desktop
- 📱 Tablet
- 📱 Smartphone

### Preciso instalar alguma coisa?
**Não!** O sistema funciona 100% no navegador. Recomendamos:
- Google Chrome (versão 100+)
- Firefox (versão 100+)
- Safari (versão 15+)
- Microsoft Edge (versão 100+)

### Os dados ficam seguros?
**Sim!** O sistema possui:
- ✅ Criptografia SSL/TLS
- ✅ Backup automático diário
- ✅ Isolamento total entre organizações (multi-tenancy)
- ✅ Row Level Security (RLS)
- ✅ Auditoria completa de ações

---

## 🔐 Autenticação e Acesso

### Como faço login pela primeira vez?
1. Você receberá um e-mail de convite
2. Clique no link do e-mail
3. Defina sua senha (mínimo 8 caracteres)
4. Faça login com e-mail e senha

### Esqueci minha senha, o que fazer?
1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu e-mail
3. Verifique seu e-mail (pode cair no spam)
4. Clique no link recebido
5. Defina uma nova senha

### Posso trocar de organização sem fazer logout?
**Sim!** Use o seletor de organizações no topo da tela (ao lado do logo).

### Quanto tempo a sessão fica ativa?
- **Com atividade**: Indefinidamente
- **Sem atividade**: 24 horas
- Você pode fazer logout manual a qualquer momento

---

## 📊 Dashboard

### Os números do dashboard demoram para atualizar?
**Não!** O dashboard usa **WebSocket** para atualizações em tempo real. Qualquer mudança nos dados atualiza automaticamente.

### Posso personalizar os KPIs exibidos?
**Sim!** Administradores podem:
- Adicionar/remover KPIs
- Definir metas
- Configurar cores e ícones
- Reordenar cards

### O que significam as cores dos KPIs?
- 🟢 **Verde**: Meta alcançada ou tendência positiva
- 🟡 **Amarelo**: Atenção, próximo ao limite
- 🔴 **Vermelho**: Abaixo da meta ou tendência negativa
- ⚪ **Cinza**: Sem meta definida

### Como funciona o sistema de notificações?
- **Sino** no topo mostra notificações não lidas
- Clique para ver lista completa
- Marque como lida individualmente ou todas de uma vez
- Notificações críticas aparecem como toast na tela

---

## 📋 Ordens de Serviço

### Como criar uma nova OS?
1. Menu: **Operações > Ordens de Serviço**
2. Clique em **"+ Nova Ordem de Serviço"**
3. Selecione ou cadastre o cliente
4. Preencha dados do motor
5. Clique em **"Criar OS"**

📘 [Guia completo](./quick-start.md#criar-primeira-ordem-de-serviço)

### Por que o número da OS não é sequencial?
O número da OS segue o formato: **OS-ANO-NÚMERO**  
Exemplo: OS-2025-0001

A sequência é **anual** (reinicia a cada ano) e **por organização**.

### Posso editar uma OS depois de criada?
**Sim**, mas com restrições:
- ✅ Dados do cliente: Sempre editável
- ✅ Observações: Sempre editável
- ⚠️ Dados do motor: Apenas antes de iniciar diagnóstico
- ❌ Número da OS: Nunca

### Como deletar uma OS?
**Apenas Admins e Owners** podem deletar:
1. Abra a OS
2. Menu ⋮ no canto superior direito
3. **"Deletar Ordem de Serviço"**
4. Confirme a ação

⚠️ **Atenção**: Deleta todos os dados relacionados (diagnósticos, orçamentos, workflow).

### O que acontece quando uma OS é criada?
Automaticamente:
1. Gera número sequencial
2. Cria 5 workflows (um para cada componente)
3. Status inicial: "Entrada"
4. Aparece no Kanban
5. Gera notificação para equipe

---

## 🔄 Workflow Kanban

### Como mover um card no Kanban?
**Arraste e solte** (drag-and-drop) o card para a coluna desejada.

### Posso mover vários componentes de uma vez?
**Não**, cada componente deve ser movido individualmente, pois cada um pode estar em etapas diferentes.

### O que significa "Checklist obrigatório"?
Algumas etapas exigem preenchimento de checklist de qualidade antes de avançar.  
**Exemplo**: Metrologia requer medições obrigatórias.

### Posso pular etapas?
**Depende da configuração**. Por padrão:
- ✅ Etapas não críticas: Pode pular
- ❌ Etapas com checklist obrigatório: Não pode pular
- ❌ Etapas com pré-requisitos: Não pode pular

### Como saber quais checklists estão pendentes?
1. Dashboard > Tab **"Dashboard"**
2. Card **"Checklists Pendentes"**
3. Clique para ver lista completa

### Posso criar etapas personalizadas?
**Sim!** Admins podem:
- Adicionar novas etapas
- Renomear etapas existentes
- Definir ordem
- Configurar pré-requisitos
- Associar checklists

📘 Menu: **Configurações > Configurações de Operações > Workflow**

---

## 💰 Orçamentos

### Como criar um orçamento?
1. A OS deve ter diagnóstico concluído
2. Menu: **Ordens de Serviço** > Abrir OS
3. Tab **"Orçamentos"**
4. **"+ Novo Orçamento"**
5. Preencha serviços e peças
6. Sistema calcula total automaticamente

### Posso criar mais de um orçamento para a mesma OS?
**Sim!** Você pode criar:
- Orçamento completo
- Orçamento por componente
- Orçamento alternativo (com peças diferentes)

### Como funciona a aprovação parcial?
Cliente aprova apenas **alguns itens** do orçamento:
1. Marque itens aprovados
2. Selecione **"Aprovação Parcial"**
3. Sistema separa aprovado de pendente
4. Contas a Receber gerada apenas para itens aprovados

### O que acontece após aprovação total?
Automaticamente:
1. ✅ Gera **Contas a Receber**
2. ✅ **Reserva peças** do estoque
3. ✅ Cria **necessidades de compra** (se faltar peças)
4. ✅ Atualiza **status da OS** para "Produção"
5. ✅ Notifica equipe de produção

### Como documentar aprovações?
Suporta múltiplas formas:
- 📱 **WhatsApp**: Anexar screenshot/print
- 📧 **E-mail**: Anexar PDF do e-mail
- ✍️ **Assinatura**: Upload de documento assinado
- 🗣️ **Verbal**: Apenas registrar (com responsável)

### Posso editar orçamento após aprovação?
**Não!** Após aprovação, o orçamento fica bloqueado para edição.  
**Solução**: Criar novo orçamento complementar ou de ajuste.

---

## 📑 Módulo Fiscal

### Preciso ser contador para usar o módulo fiscal?
**Não**, mas é **recomendado** que um contador configure:
- Regime tributário
- Classificações fiscais (NCM, CFOP, CST)
- Alíquotas de impostos

Após configurado, o sistema calcula impostos automaticamente.

### Quais regimes tributários são suportados?
- ✅ Simples Nacional
- ✅ Lucro Presumido
- ✅ Lucro Real

### O sistema gera SPED?
**Sim!** O sistema gera arquivo SPED Fiscal e SPED Contribuições.  
📘 Menu: **Módulo Fiscal > Obrigações Acessórias**

### Como fazer apuração mensal?
1. Menu: **Módulo Fiscal > Apuração Fiscal**
2. Selecione mês de referência
3. Clique em **"Calcular Apuração"**
4. Sistema processa todas as notas do período
5. Gera relatório com impostos devidos

### O cálculo de impostos é automático?
**Sim!** Ao criar um orçamento ou nota fiscal:
1. Sistema verifica classificação fiscal do serviço
2. Aplica alíquotas conforme regime tributário
3. Calcula ICMS, IPI, PIS, COFINS, ISS
4. Adiciona ao total

---

## 💵 Financeiro

### Contas a Receber são geradas automaticamente?
**Sim!** Ao aprovar orçamento, sistema:
1. Cria parcela(s) em Contas a Receber
2. Define data de vencimento (padrão: 30 dias)
3. Vincula à OS e cliente
4. Integra ao Fluxo de Caixa

### Como registrar um pagamento recebido?
1. Menu: **Financeiro > Contas a Receber**
2. Localize a conta
3. Clique em **"Registrar Pagamento"**
4. Preencha:
   - Data de pagamento
   - Valor recebido
   - Forma de pagamento
   - Conta bancária
5. Sistema:
   - Atualiza status para "Pago"
   - Registra no Fluxo de Caixa
   - Atualiza DRE

### Como lançar Contas a Pagar?
1. Menu: **Financeiro > Contas a Pagar**
2. **"+ Nova Conta a Pagar"**
3. Preencha:
   - Fornecedor
   - Valor
   - Vencimento
   - Categoria (opcional)
4. Salvar

### Como fazer conciliação bancária?
1. Menu: **Financeiro > Fluxo de Caixa**
2. Filtrar por conta bancária
3. Marcar lançamentos conciliados
4. **"Conciliar Selecionados"**

### O que é DRE e como visualizar?
**DRE** = Demonstração do Resultado do Exercício  
Mostra: Receitas - Despesas = Lucro/Prejuízo

📘 Menu: **Financeiro > DRE**  
Selecione período (mês, trimestre, ano)

---

## 📦 Estoque

### Como dar entrada de peças no estoque?
1. Menu: **Estoque > Movimentações**
2. **"+ Nova Movimentação"**
3. Tipo: **"Entrada"**
4. Preencha:
   - Código da peça
   - Nome
   - Quantidade
   - Valor unitário
   - Fornecedor (opcional)
5. Salvar

### Como dar saída manual de peças?
1. Menu: **Estoque > Movimentações**
2. **"+ Nova Movimentação"**
3. Tipo: **"Saída"**
4. Selecione a peça
5. Informe quantidade
6. Vincule a uma OS (opcional)
7. Salvar

### O que são reservas de peças?
Peças separadas para uma OS específica que ainda não foram usadas.  
**Criação**: Automática após aprovação de orçamento  
**Status**: Peça fica "reservada" (não disponível para outras OS)

### Como liberar uma reserva?
1. Menu: **Estoque > Reservas**
2. Localize a reserva
3. **"Liberar Reserva"**
4. Peça volta ao estoque disponível

### O que significa alerta de estoque baixo?
Sistema monitora:
- **Estoque Mínimo**: Configurado por peça
- **Estoque Atual**: Saldo disponível

Quando **Atual < Mínimo**, gera alerta automático.

📘 Configurar: **Estoque > Configurações de Estoque**

---

## 🛒 Compras

### Como criar uma necessidade de compra?
**Automática**: Gerada ao aprovar orçamento (se faltar peças)  
**Manual**:
1. Menu: **Compras > Necessidades de Compra**
2. **"+ Nova Necessidade"**
3. Preencha:
   - Código/nome da peça
   - Quantidade necessária
   - Prazo desejado
   - Prioridade
4. Salvar

### O que são sugestões de fornecedores?
Sistema analisa histórico de compras e sugere:
- Melhores preços
- Menores prazos
- Melhores avaliações
- Mais confiáveis

**Geração**: Automática ao criar necessidade de compra

### Como criar um pedido de compra?
1. Menu: **Compras > Necessidades**
2. Selecione necessidade
3. Escolha fornecedor sugerido ou outro
4. **"Criar Pedido de Compra"**
5. Revise dados
6. **"Gerar PO"**
7. Sistema envia por e-mail (opcional)

### Como registrar recebimento de compra?
1. Menu: **Compras > Pedidos de Compra**
2. Localize o PO
3. **"Registrar Recebimento"**
4. Confira:
   - Quantidade recebida
   - Qualidade
   - Nota fiscal
5. **"Confirmar Recebimento"**
6. Sistema:
   - Atualiza estoque
   - Gera Conta a Pagar
   - Atualiza status do PO

---

## 👥 Usuários e Permissões

### Como adicionar um novo usuário?
1. Menu: **Configurações > Gestão de Usuários**
2. **"+ Novo Usuário"**
3. Preencha e-mail e nome
4. Selecione perfil
5. **"Enviar Convite"**
6. Usuário recebe e-mail para definir senha

📘 [Guia completo](./quick-start.md#adicionar-usuários)

### Qual a diferença entre perfis?
| Perfil | Acesso |
|--------|--------|
| **Owner** | Total (dentro da organização) |
| **Admin** | Gestão de usuários, configurações |
| **Manager** | Supervisão, aprovações |
| **Operator** | Execução de tarefas |
| **Viewer** | Apenas visualização |

📘 [Matriz completa](./user-flows/permissions-matrix.md)

### Posso criar perfis customizados?
**Sim!**  
1. Menu: **Configurações > Gestão de Perfis de Usuários**
2. **"+ Novo Perfil"**
3. Configure permissões módulo por módulo
4. Salvar

### Como desativar um usuário?
1. Menu: **Configurações > Gestão de Usuários**
2. Localize o usuário
3. **"Desativar"**
4. Usuário não consegue mais fazer login
5. Dados permanecem no sistema

---

## 🔧 Problemas Técnicos

### O sistema está lento, o que fazer?
1. **Limpe o cache do navegador**:
   - Chrome: Ctrl + Shift + Delete
   - Firefox: Ctrl + Shift + Delete
   - Safari: Cmd + Option + E

2. **Verifique sua conexão**:
   - Velocidade mínima recomendada: 5 Mbps
   - Teste: [fast.com](https://fast.com)

3. **Atualize o navegador**:
   - Use sempre a última versão

4. **Tente outro navegador**:
   - Chrome é o mais otimizado

### Não consigo fazer upload de arquivos
Verifique:
- ✅ Tamanho máximo: 10 MB
- ✅ Formatos aceitos: PDF, JPG, PNG, XLSX
- ✅ Conexão estável
- ✅ Navegador atualizado

### Os dados não estão atualizando
1. Pressione **F5** para recarregar
2. Se persistir, **Ctrl + Shift + R** (hard reload)
3. Verifique se WebSocket está conectado (ícone no dashboard)

### Erro "Sem permissão"
Você não tem permissão para essa ação.  
**Solução**: Fale com seu administrador para ajustar suas permissões.

### Esqueci qual organização devo selecionar
Se você tem acesso a múltiplas organizações:
1. Clique no seletor de organizações (topo)
2. Lista mostra todas as que você tem acesso
3. Selecione a correta

**Dica**: Nome da organização aparece no seletor

---

## 🆘 Ainda com Dúvidas?

### Documentação Completa

- 📘 [Sistema Blueprint](./system-blueprint.md) - Arquitetura técnica
- 🚀 [Guia de Início Rápido](./quick-start.md) - Primeiros passos
- 📖 [Glossário](./glossary.md) - Termos técnicos
- 🔄 [Fluxos de Usuários](./user-flows/complete-user-journeys.md) - Jornadas completas
- ✅ [Guia de Validação](./validation/functional-validation-guide.md) - Testes

### Suporte

- 📧 **E-mail**: suporte@erpretifica.com.br
- 💬 **Chat**: Ícone no canto inferior direito
- 📱 **WhatsApp**: (11) 99999-9999
- ⏰ **Horário**: Seg-Sex, 8h-18h

---

**Última Atualização**: 2025-01-14  
**Versão**: 3.0.0
