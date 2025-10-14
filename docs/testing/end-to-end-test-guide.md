# 🧪 Guia de Testes End-to-End - ERP Retífica Formiguense

## 📋 Sumário
1. [Preparação do Ambiente](#preparação-do-ambiente)
2. [Fluxos de Teste Principais](#fluxos-de-teste-principais)
3. [Cenários de Teste Detalhados](#cenários-de-teste-detalhados)
4. [Validações Críticas](#validações-críticas)
5. [Checklist de Testes](#checklist-de-testes)

---

## 🔧 Preparação do Ambiente

### **Pré-requisitos**
- [ ] Sistema rodando localmente ou em ambiente de staging
- [ ] Banco de dados Supabase configurado
- [ ] Migrations aplicadas
- [ ] Pelo menos 2 usuários criados (admin e técnico)
- [ ] Organização configurada
- [ ] Tipos de motor cadastrados
- [ ] Status de workflow configurados

### **Dados de Teste Necessários**
```sql
-- Cliente de teste
INSERT INTO customers (name, phone, email, document, org_id)
VALUES ('Cliente Teste', '11999999999', 'teste@email.com', '12345678900', '<org_id>');

-- Motor de teste
INSERT INTO engines (brand, model, type, serial_number, org_id)
VALUES ('Volkswagen', 'AP 1.6', 'gasolina', 'TEST123456', '<org_id>');

-- Peças de teste no estoque
INSERT INTO parts_inventory (part_code, part_name, quantity, unit_cost, org_id)
VALUES 
  ('PISTAO-050', 'Pistão 0.50mm', 10, 150.00, '<org_id>'),
  ('ANEL-STD', 'Jogo de Anéis STD', 5, 80.00, '<org_id>'),
  ('BRONZINA-BIELA', 'Bronzina de Biela', 3, 120.00, '<org_id>');

-- Configurar estoque mínimo
INSERT INTO parts_stock_config (part_code, minimum_stock, reorder_point, auto_reorder_enabled, org_id)
VALUES 
  ('PISTAO-050', 10, 20, true, '<org_id>'),
  ('ANEL-STD', 15, 25, true, '<org_id>'),
  ('BRONZINA-BIELA', 10, 15, true, '<org_id>');
```

---

## 🎯 Fluxos de Teste Principais

### **Fluxo 1: Criação de Ordem de Serviço Completa**
**Objetivo**: Validar todo o ciclo desde criação até entrega

**Duração Estimada**: 30-45 minutos

**Passos**:
1. Login como **Atendente**
2. Criar nova OS
3. Preencher diagnóstico inicial
4. Gerar orçamento
5. Aprovar orçamento
6. Executar workflow (todas as etapas)
7. Finalizar e entregar OS

---

### **Fluxo 2: Gestão de Estoque e Compras**
**Objetivo**: Validar alertas, reservas e necessidades de compra

**Duração Estimada**: 20-30 minutos

**Passos**:
1. Verificar estoque inicial
2. Aprovar orçamento que consome peças
3. Validar reserva automática
4. Validar alertas de estoque baixo
5. Gerar necessidade de compra
6. Processar compra

---

### **Fluxo 3: Workflow com Checklists Obrigatórios**
**Objetivo**: Validar bloqueios e validações de workflow

**Duração Estimada**: 15-20 minutos

**Passos**:
1. Iniciar etapa com checklist obrigatório
2. Tentar avançar sem preencher
3. Validar bloqueio
4. Preencher checklist
5. Avançar workflow
6. Validar relatório automático

---

## 📝 Cenários de Teste Detalhados

### **TESTE 01: Criar Ordem de Serviço**

#### **Configuração Inicial**
- **Usuário**: Atendente ou Admin
- **Tela**: `/ordens`
- **Permissões necessárias**: `operations.write`

#### **Passos Detalhados**

1. **Acessar módulo de Ordens**
   ```
   ✓ Clicar em "Ordens de Serviço" no menu lateral
   ✓ Verificar se a lista de ordens é exibida
   ✓ Verificar filtros disponíveis
   ```

2. **Criar Nova OS**
   ```
   ✓ Clicar em "Nova Ordem"
   ✓ Formulário deve abrir (modal ou página)
   ✓ Campos obrigatórios marcados com *
   ```

3. **Preencher Dados do Cliente**
   ```
   ✓ Buscar cliente existente ou criar novo
   ✓ Campo de busca deve funcionar (autocomplete)
   ✓ Validar CPF/CNPJ
   ✓ Validar telefone (formato)
   ```

4. **Preencher Dados do Motor**
   ```
   ✓ Selecionar tipo de motor
   ✓ Componentes devem ser carregados automaticamente
   ✓ Preencher marca, modelo, série
   ```

5. **Salvar Ordem**
   ```
   ✓ Clicar em "Salvar"
   ✓ Validar campos obrigatórios
   ✓ Toast de sucesso deve aparecer
   ✓ Ordem deve aparecer na lista
   ✓ Status inicial: "ativa"
   ```

#### **Validações Esperadas**
- ✅ Número de ordem gerado automaticamente (formato: `OS-YYYY-XXXX`)
- ✅ Data de criação = data atual
- ✅ Workflows criados para cada componente do motor
- ✅ Status inicial de cada workflow: "entrada"
- ✅ Timeline com evento de criação
- ✅ Notificação para técnicos sobre nova OS

#### **Casos de Erro a Testar**
- ❌ Submeter formulário sem cliente
- ❌ Submeter sem motor
- ❌ CPF/CNPJ inválido
- ❌ Telefone em formato incorreto

---

### **TESTE 02: Check-in Técnico com Fotos**

#### **Configuração Inicial**
- **Usuário**: Técnico
- **Pré-requisito**: OS criada (TESTE 01)
- **Tela**: `/ordens/:id` (detalhes da ordem)

#### **Passos Detalhados**

1. **Acessar Detalhes da OS**
   ```
   ✓ Encontrar OS na lista
   ✓ Clicar para ver detalhes
   ✓ Aba "Geral" deve estar ativa
   ```

2. **Realizar Check-in Técnico**
   ```
   ✓ Verificar se há botão "Check-in Técnico"
   ✓ Clicar no botão
   ✓ Modal deve abrir com formulário
   ```

3. **Upload de Fotos**
   ```
   ✓ Clicar em "Adicionar Foto"
   ✓ Selecionar imagem do computador
   ✓ Preview da imagem deve aparecer
   ✓ Adicionar descrição (opcional)
   ✓ Selecionar tipo de foto: "entrada"
   ✓ Selecionar componente (bloco, biela, etc)
   ```

4. **Preencher Observações Iniciais**
   ```
   ✓ Campo de texto livre
   ✓ Suporta múltiplas linhas
   ✓ Máximo de caracteres (validar)
   ```

5. **Confirmar Check-in**
   ```
   ✓ Clicar em "Confirmar Check-in"
   ✓ Loading durante upload
   ✓ Toast de sucesso
   ✓ Modal fecha automaticamente
   ```

#### **Validações Esperadas**
- ✅ Fotos aparecem na aba "Fotos"
- ✅ Cada foto tem:
  - URL assinada válida (Supabase Storage)
  - Tipo correto (entrada)
  - Componente associado
  - Timestamp de upload
  - Uploader (nome do técnico)
- ✅ Timeline atualizada com evento de check-in
- ✅ Workflows atualizados (se aplicável)

#### **Casos de Erro a Testar**
- ❌ Upload de arquivo muito grande (>5MB)
- ❌ Upload de formato não suportado (.exe, .zip)
- ❌ Sem conexão com internet durante upload
- ❌ Storage cheio (limite de quota)

---

### **TESTE 03: Diagnóstico com Checklist**

#### **Configuração Inicial**
- **Usuário**: Técnico
- **Pré-requisito**: Check-in realizado
- **Tela**: `/diagnosticos` ou detalhes da OS

#### **Passos Detalhados**

1. **Acessar Módulo de Diagnósticos**
   ```
   ✓ Menu lateral > "Diagnósticos"
   ✓ OU aba "Diagnóstico" nos detalhes da OS
   ```

2. **Selecionar Componente para Diagnóstico**
   ```
   ✓ Lista de componentes do motor
   ✓ Cada componente com status
   ✓ Clicar em "Diagnosticar" no componente desejado
   ```

3. **Preencher Checklist**
   ```
   ✓ Checklist carregado com base no tipo de motor + componente
   ✓ Itens agrupados por categoria
   ✓ Cada item com:
     - Descrição clara
     - Tipo de resposta (sim/não, medição, texto)
     - Indicador de obrigatoriedade
   ```

4. **Itens do Checklist de Exemplo (Bloco)**
   ```
   INSPEÇÃO VISUAL
   ✓ Trincas ou rachaduras? [Sim/Não] *
   ✓ Desgaste excessivo? [Sim/Não] *
   ✓ Corrosão? [Sim/Não]
   
   MEDIÇÕES
   ✓ Diâmetro do cilindro (mm): [___] * (range: 80-100)
   ✓ Ovalização (mm): [___] * (max: 0.05)
   ✓ Conicidade (mm): [___] * (max: 0.03)
   
   OBSERVAÇÕES
   ✓ Notas adicionais: [texto livre]
   ```

5. **Adicionar Fotos ao Diagnóstico**
   ```
   ✓ Botão "Adicionar Foto" em cada seção
   ✓ Upload similar ao check-in
   ✓ Associar foto a item específico do checklist
   ```

6. **Definir Status Geral**
   ```
   ✓ Seleção de status:
     - ✅ Aprovado (conforme)
     - ⚠️ Aprovado com ressalvas
     - ❌ Reprovado (não conforme)
   ✓ Status afeta workflow subsequente
   ```

7. **Salvar Diagnóstico**
   ```
   ✓ Botão "Salvar Diagnóstico"
   ✓ Validação de campos obrigatórios
   ✓ Toast de sucesso
   ✓ Redirect para lista/detalhes
   ```

#### **Validações Esperadas**
- ✅ Diagnóstico salvo em `diagnostic_checklist_responses`
- ✅ Responses JSONB com todas as respostas
- ✅ Measurements JSONB com medições
- ✅ Photos array com referências das fotos
- ✅ Timeline atualizada
- ✅ **Notificação para gerente/admin sobre diagnóstico concluído**

#### **Casos de Erro a Testar**
- ❌ Salvar sem preencher campos obrigatórios
- ❌ Medição fora do range permitido
- ❌ Formato de medição inválido (texto em vez de número)

---

### **TESTE 04: Geração de Orçamento**

#### **Configuração Inicial**
- **Usuário**: Atendente ou Admin
- **Pré-requisito**: Diagnóstico concluído
- **Tela**: `/orcamentos` ou detalhes da OS

#### **Passos Detalhados**

1. **Iniciar Orçamento**
   ```
   ✓ Aba "Orçamento" na OS
   ✓ OU lista de orçamentos pendentes
   ✓ Clicar em "Gerar Orçamento"
   ```

2. **Adicionar Serviços**
   ```
   ✓ Botão "Adicionar Serviço"
   ✓ Buscar serviço (autocomplete)
   ✓ Ou criar novo serviço inline
   ✓ Preencher:
     - Descrição do serviço
     - Quantidade (horas/unidades)
     - Valor unitário
   ✓ Valor total calculado automaticamente
   ```

3. **Adicionar Peças/Materiais**
   ```
   ✓ Botão "Adicionar Peça"
   ✓ Buscar peça no estoque
   ✓ Verificar disponibilidade em tempo real
   ✓ Preencher:
     - Código da peça
     - Descrição
     - Quantidade necessária
     - Preço unitário
   ✓ Se indisponível: alerta visual
   ```

4. **Cálculos Automáticos**
   ```
   ✓ Subtotal de serviços
   ✓ Subtotal de peças
   ✓ Descontos (se aplicável)
   ✓ Total geral
   ✓ Atualização em tempo real
   ```

5. **Observações e Condições**
   ```
   ✓ Prazo de execução estimado
   ✓ Condições de pagamento
   ✓ Garantia oferecida
   ✓ Observações gerais
   ```

6. **Salvar Orçamento**
   ```
   ✓ Botão "Salvar Orçamento"
   ✓ Validação de itens mínimos
   ✓ Toast de sucesso
   ✓ Orçamento com status "draft" ou "pending"
   ```

#### **Validações Esperadas**
- ✅ Orçamento salvo em `detailed_budgets`
- ✅ Services JSONB com array de serviços
- ✅ Parts JSONB com array de peças
- ✅ Total calculado corretamente
- ✅ **Notificação para cliente (se e-mail cadastrado)**
- ✅ **Alert criado em `budget_alerts` se não aprovado em X dias**
- ✅ Timeline atualizada

---

### **TESTE 05: Aprovação de Orçamento (Trigger de Automação)**

#### **Configuração Inicial**
- **Usuário**: Cliente ou Admin (simulando aprovação)
- **Pré-requisito**: Orçamento gerado
- **Tela**: `/orcamentos/:id`

#### **Passos Detalhados**

1. **Visualizar Orçamento**
   ```
   ✓ Acesso via link enviado ao cliente
   ✓ OU admin acessando pelo sistema
   ✓ PDF do orçamento disponível
   ✓ Botões de ação visíveis
   ```

2. **Aprovar Orçamento**
   ```
   ✓ Botão "Aprovar Orçamento"
   ✓ Modal de confirmação
   ✓ Método de aprovação:
     - Digital (usuário logado)
     - E-mail
     - WhatsApp
     - Presencial
   ✓ Observações opcionais
   ✓ Confirmar aprovação
   ```

3. **Validar Automações Disparadas** ⚡

   **a) Reserva de Peças Automática**
   ```
   ✓ Abrir `/estoque`
   ✓ Buscar peças do orçamento
   ✓ Verificar quantidade "Reservada"
   ✓ Quantidade "Disponível" deve diminuir
   ✓ Tabela `parts_reservations` deve ter registros
   ```

   **b) Alertas de Estoque Baixo**
   ```
   ✓ Se reserva deixou estoque < mínimo:
     - Alerta criado em `stock_alerts`
     - Nível do alerta (warning/critical)
     - Dashboard de alertas atualizado
     - Notificação enviada
   ```

   **c) Necessidades de Compra**
   ```
   ✓ Se peça não está em estoque ou insuficiente:
     - Registro em `purchase_needs`
     - Tipo: "planned" ou "emergency"
     - Prioridade calculada
     - Dashboard de compras atualizado
   ```

   **d) Contas a Receber**
   ```
   ✓ Registro criado em `accounts_receivable`
   ✓ Valor total do orçamento
   ✓ Data de vencimento (conforme condições)
   ✓ Número de parcelas (se parcelado)
   ✓ Status: "pending"
   ```

   **e) Atualização de Status da OS**
   ```
   ✓ Status da ordem: "ativa" → "aprovada"
   ✓ Histórico de status atualizado
   ✓ Timeline com evento de aprovação
   ```

   **f) Notificações Disparadas**
   ```
   ✓ Notificação para equipe de produção
   ✓ Notificação de estoque baixo (se aplicável)
   ✓ Notificação de compra urgente (se aplicável)
   ```

#### **Validações Esperadas (Checklist Completo)**
- ✅ `budget_approvals` com registro de aprovação
- ✅ `parts_reservations` para cada peça do orçamento
- ✅ `parts_inventory.quantity` reduzido corretamente
- ✅ `stock_alerts` criado se estoque < mínimo
- ✅ `purchase_needs` criado para peças insuficientes
- ✅ `accounts_receivable` criado com parcelas
- ✅ `orders.status` = "aprovada"
- ✅ `order_status_history` com mudança de status
- ✅ `notifications` para stakeholders relevantes
- ✅ **Dashboard de alertas atualizado em tempo real**

---

### **TESTE 06: Workflow - Entrada e Metrologia**

#### **Configuração Inicial**
- **Usuário**: Técnico
- **Pré-requisito**: Orçamento aprovado
- **Tela**: `/workflows` (Kanban)

#### **Passos Detalhados**

1. **Acessar Kanban de Workflows**
   ```
   ✓ Menu > "Workflows"
   ✓ Board Kanban carregado
   ✓ Colunas = status (entrada, metrologia, usinagem, etc)
   ✓ Cards = componentes de cada OS
   ```

2. **Visualizar Card de Componente**
   ```
   ✓ Card mostra:
     - Número da OS
     - Componente (bloco, biela, etc)
     - Status atual
     - Tempo na etapa atual
     - Indicador de checklist pendente (se houver)
   ✓ Cor do card por componente (quando filtro "Todos")
   ```

3. **Iniciar Etapa "Entrada"**
   ```
   ✓ Clicar no card
   ✓ Modal de detalhes abre
   ✓ Botão "Iniciar Etapa" visível
   ✓ Clicar em "Iniciar"
   ✓ `started_at` deve ser setado com timestamp atual
   ✓ Card atualiza mostrando tempo decorrido
   ```

4. **Verificar Checklist Obrigatório**
   ```
   ✓ Se etapa tem checklist obrigatório:
     - Indicador visual no card
     - Badge "Checklist Pendente"
     - Botão "Preencher Checklist" disponível
   ```

5. **Tentar Avançar Sem Checklist** 🔒
   ```
   ✓ Clicar em "Concluir Etapa"
   ✓ Sistema deve BLOQUEAR
   ✓ Toast de erro: "🔒 Checklist Obrigatório Pendente"
   ✓ Mensagem clara sobre qual checklist
   ✓ Workflow NÃO avança
   ```

6. **Preencher Checklist Obrigatório**
   ```
   ✓ Clicar em "Preencher Checklist"
   ✓ Checklist específico da etapa carrega
   ✓ Preencher todos os campos obrigatórios
   ✓ Aprovar checklist (status = 'approved')
   ✓ Salvar
   ```

7. **Concluir Etapa "Entrada"**
   ```
   ✓ Após checklist aprovado
   ✓ Clicar em "Concluir e Avançar"
   ✓ Sistema valida checklist ✅
   ✓ `completed_at` setado
   ✓ Workflow avança para "Metrologia" AUTOMATICAMENTE
   ✓ Toast: "✅ Etapa avançada! Workflow movido para: metrologia"
   ```

8. **Validar Avanço Automático**
   ```
   ✓ Card move para coluna "Metrologia" em tempo real
   ✓ Status atualizado
   ✓ `started_at` da nova etapa = NULL (não iniciada ainda)
   ✓ Timeline com eventos:
     - Conclusão de "Entrada"
     - Avanço para "Metrologia"
   ```

9. **Etapa "Metrologia"** (Repetir fluxo)
   ```
   ✓ Iniciar etapa
   ✓ Preencher checklist de metrologia (medições)
   ✓ Adicionar fotos das medições
   ✓ Aprovar checklist
   ✓ Concluir etapa
   ```

10. **Geração Automática de Relatório Técnico** 📄
    ```
    ✓ Se etapa requer relatório (`technical_report_required = true`)
    ✓ Ao concluir, sistema gera relatório automaticamente
    ✓ Toast: "📄 Relatório Técnico Gerado"
    ✓ Relatório aparece em `/ordens/:id/relatorios`
    ✓ Inclui:
      - Dados do checklist
      - Medições
      - Fotos
      - Status de conformidade
    ✓ `generated_automatically = true`
    ```

#### **Validações Esperadas**
- ✅ Bloqueio funciona corretamente (sem checklist)
- ✅ Avanço automático após conclusão
- ✅ Tempos registrados corretamente (`started_at`, `completed_at`)
- ✅ Timeline completa e cronológica
- ✅ Relatório técnico gerado automaticamente
- ✅ Notificações enviadas em cada etapa
- ✅ Real-time: outro usuário vê mudanças no Kanban instantaneamente

---

### **TESTE 07: Workflow - Usinagem e Montagem**

#### **Passos Resumidos**
- Seguir mesmo fluxo de TESTE 06
- Etapas: "Usinagem" → "Montagem"
- Cada etapa pode ter checklists diferentes
- Validar bloqueios e avanços automáticos
- Testar cenário de **Aprovação Necessária**:
  ```
  ✓ Se transição requer aprovação (`transition_type = 'approval_required'`)
  ✓ Workflow NÃO avança automaticamente
  ✓ Fica pendente de aprovação de supervisor
  ✓ Notificação enviada para supervisor
  ```

---

### **TESTE 08: Finalização e Entrega**

#### **Configuração Inicial**
- **Pré-requisito**: Todas as etapas anteriores concluídas
- **Status atual**: "Pronto" ou "Garantia"

#### **Passos Detalhados**

1. **Concluir Última Etapa do Workflow**
   ```
   ✓ Etapa "Montagem" ou "Garantia"
   ✓ Preencher checklist final
   ✓ Adicionar fotos do produto final
   ✓ Concluir etapa
   ✓ Status da OS: "aprovada" → "em_producao" → "concluida"
   ```

2. **Registrar Entrega**
   ```
   ✓ Acessar detalhes da OS
   ✓ Botão "Registrar Entrega"
   ✓ Confirmar dados:
     - Data/hora de entrega
     - Quem recebeu
     - Observações
   ✓ Confirmar
   ```

3. **Geração Automática de Garantia** 🛡️
   ```
   ✓ Ao mudar status para "entregue"
   ✓ Trigger `trg_order_delivered_warranty` dispara
   ✓ Registro em `order_warranties`:
     - warranty_type: "total"
     - start_date: data de entrega
     - end_date: start_date + warranty_months (ex: 3 meses)
     - is_active: true
   ✓ Notificação criada
   ```

4. **Validar Aba "Garantia"**
   ```
   ✓ Acessar aba "Garantias" na OS
   ✓ Garantia listada
   ✓ Informações exibidas:
     - Tipo: Total
     - Início: DD/MM/YYYY
     - Fim: DD/MM/YYYY
     - Dias restantes
     - Status: Ativa/Expirando/Expirada
   ```

5. **Timeline Completa**
   ```
   ✓ Todos os eventos registrados:
     - Criação da OS
     - Check-in técnico
     - Diagnósticos
     - Orçamento gerado
     - Aprovação
     - Reservas de peças
     - Cada etapa de workflow
     - Relatórios técnicos
     - Entrega
     - Garantia criada
   ✓ Ordem cronológica correta
   ✓ Ícones e cores apropriados
   ```

#### **Validações Esperadas**
- ✅ Status final: "entregue"
- ✅ `actual_delivery` preenchido
- ✅ Garantia criada automaticamente
- ✅ Timeline completa
- ✅ Notificação de conclusão
- ✅ Cliente pode avaliar serviço (se sistema implementado)

---

### **TESTE 09: Dashboard de Alertas**

#### **Objetivo**: Validar central de alertas e notificações

#### **Passos Detalhados**

1. **Acessar Dashboard de Alertas**
   ```
   ✓ Menu > "Alertas" ou rota `/alertas`
   ✓ Dashboard carrega com cards resumidos
   ```

2. **Validar Cards de Resumo**
   ```
   ✓ Card "Alertas de Estoque"
     - Contagem total
     - Contagem de críticos
     - Clicar deve filtrar/navegar
   
   ✓ Card "Orçamentos Pendentes"
     - Contagem total
     - Idade do mais antigo
     - Ação rápida para aprovar
   
   ✓ Card "Necessidades de Compra"
     - Contagem total
     - Urgentes em destaque
     - Link para módulo de compras
   
   ✓ Card "Workflows Pendentes"
     - Workflows com checklist bloqueado
     - Ação rápida para preencher
   ```

3. **Detalhes de Alertas de Estoque**
   ```
   ✓ Lista de alertas
   ✓ Cada alerta com:
     - Nível de severidade (cor)
     - Nome da peça
     - Estoque atual vs mínimo
     - Data do alerta
     - Ação: "Ver Estoque"
   ✓ Filtros: Por nível, por data
   ✓ Ordenação: Por prioridade
   ```

4. **Reconhecer Alerta**
   ```
   ✓ Botão "Reconhecer" em cada alerta
   ✓ Ao clicar:
     - `acknowledged_at` setado
     - `acknowledged_by` = user_id
     - Cor/visual muda
     - Não some da lista (mas muda aparência)
   ```

5. **Resolver Alerta**
   ```
   ✓ Para alertas de estoque:
     - Ir para módulo de compras
     - Criar pedido de compra
     - Ao receber peças: alerta desaparece automaticamente
   ```

6. **Real-time Updates**
   ```
   ✓ Abrir dashboard em 2 navegadores
   ✓ Browser 1: Aprovar orçamento que gera alerta
   ✓ Browser 2: Dashboard deve atualizar automaticamente
   ✓ Notificação toast deve aparecer
   ```

---

### **TESTE 10: Sistema de Notificações**

#### **Objetivo**: Validar notificações em tempo real

#### **Passos Detalhados**

1. **Acessar Painel de Notificações**
   ```
   ✓ Ícone de sino (🔔) no header
   ✓ Badge com contagem de não lidas
   ✓ Clicar abre sheet lateral
   ```

2. **Visualizar Notificações**
   ```
   ✓ Lista de notificações (mais recentes no topo)
   ✓ Cada notificação com:
     - Ícone/emoji
     - Título
     - Mensagem
     - Data/hora
     - Indicador de lida/não lida
     - Botões de ação
   ```

3. **Interagir com Notificação**
   ```
   ✓ Clicar na notificação
   ✓ Marca como lida automaticamente
   ✓ Navega para `action_url` (se definido)
   ✓ Sheet fecha
   ```

4. **Marcar Como Lida**
   ```
   ✓ Botão "✓" em cada notificação
   ✓ Marca individual
   ✓ Badge de não lidas diminui
   ```

5. **Marcar Todas Como Lidas**
   ```
   ✓ Botão "Marcar todas como lidas"
   ✓ Confirmação visual
   ✓ Toast de sucesso
   ✓ Badge vai para 0
   ```

6. **Deletar Notificação**
   ```
   ✓ Botão "🗑️" em cada notificação
   ✓ Remove da lista
   ✓ Não aparece mais
   ```

7. **Tipos de Notificações a Validar**
   ```
   ✅ Nova OS criada
   ✅ Diagnóstico concluído
   ✅ Orçamento gerado
   ✅ Orçamento aprovado
   ✅ Estoque baixo
   ✅ Necessidade de compra urgente
   ✅ Workflow bloqueado por checklist
   ✅ Relatório técnico gerado
   ✅ OS pronta para entrega
   ✅ Garantia expirando
   ```

8. **Notificações Globais vs Específicas**
   ```
   ✓ Notificações globais (`is_global = true`)
     - Visíveis para todos da organização com permissão
     - Ex: "Estoque de Pistões está crítico"
   
   ✓ Notificações específicas (`user_id != null`)
     - Apenas para usuário específico
     - Ex: "Sua OS #1234 foi aprovada"
   ```

---

## ✅ Validações Críticas

### **Segurança**
- [ ] RLS (Row Level Security) funcionando
- [ ] Usuário só vê dados da sua organização
- [ ] Permissões de perfil respeitadas
- [ ] Funções `SECURITY DEFINER` só acessíveis via RPC

### **Performance**
- [ ] Queries com EXPLAIN ANALYZE < 100ms
- [ ] Índices criados em colunas filtradas
- [ ] Real-time não causa lag na UI
- [ ] Imagens carregam com lazy loading

### **Integridade de Dados**
- [ ] Foreign keys funcionando
- [ ] Cascades configurados corretamente
- [ ] Triggers não causam loops infinitos
- [ ] Transactions rollback em caso de erro

### **UX/UI**
- [ ] Loading states em todas as ações
- [ ] Toasts informativos
- [ ] Erros com mensagens claras
- [ ] Responsivo em mobile/tablet/desktop

---

## 📋 Checklist de Testes Completo

### **Módulo: Ordens de Serviço**
- [ ] TESTE 01: Criar OS
- [ ] TESTE 02: Check-in Técnico
- [ ] Editar OS
- [ ] Cancelar OS
- [ ] Filtros e busca
- [ ] Exportar lista

### **Módulo: Diagnósticos**
- [ ] TESTE 03: Preencher checklist
- [ ] Aprovar diagnóstico
- [ ] Reprovar diagnóstico
- [ ] Editar diagnóstico existente

### **Módulo: Orçamentos**
- [ ] TESTE 04: Gerar orçamento
- [ ] TESTE 05: Aprovar orçamento
- [ ] Reprovar orçamento
- [ ] Editar orçamento draft
- [ ] Enviar orçamento por e-mail
- [ ] Gerar PDF

### **Módulo: Workflows**
- [ ] TESTE 06: Entrada e Metrologia
- [ ] TESTE 07: Usinagem e Montagem
- [ ] Bloqueio por checklist ✅
- [ ] Avanço automático ✅
- [ ] Aprovação manual
- [ ] Filtros no Kanban (por componente, status)
- [ ] Filtro "Todos" mantém cores

### **Módulo: Estoque**
- [ ] Consultar estoque
- [ ] Reservar peças (manual)
- [ ] Reserva automática (via orçamento aprovado) ✅
- [ ] Alertas de estoque baixo ✅
- [ ] Entrada de peças (compra)
- [ ] Saída de peças (aplicação)
- [ ] Histórico de movimentações

### **Módulo: Compras**
- [ ] Necessidades de compra geradas automaticamente ✅
- [ ] Criar pedido de compra
- [ ] Aprovar pedido
- [ ] Receber peças
- [ ] Integração com fornecedores

### **Módulo: Financeiro**
- [ ] Contas a receber geradas automaticamente ✅
- [ ] Registrar pagamento
- [ ] Parcelamento
- [ ] Relatórios financeiros

### **Módulo: Relatórios**
- [ ] Relatório técnico gerado automaticamente ✅
- [ ] Visualizar relatório
- [ ] Exportar PDF
- [ ] Imprimir

### **Módulo: Garantias**
- [ ] TESTE 08: Garantia criada automaticamente ✅
- [ ] Registrar acionamento de garantia
- [ ] Garantias expirando (alertas)

### **Módulo: Alertas e Notificações**
- [ ] TESTE 09: Dashboard de alertas
- [ ] TESTE 10: Sistema de notificações
- [ ] Real-time updates ✅
- [ ] Reconhecer/Descartar alertas

---

## 🐛 Registro de Bugs e Issues

### **Template de Bug**
```markdown
### [BUG] Título do bug

**Descrição**: 
Breve descrição do problema

**Passos para Reproduzir**:
1. Passo 1
2. Passo 2
3. ...

**Resultado Esperado**:
O que deveria acontecer

**Resultado Atual**:
O que está acontecendo

**Evidências**:
- Screenshots
- Logs do console
- Mensagens de erro

**Ambiente**:
- Browser: Chrome 120
- OS: Windows 11
- Versão do app: v1.0.0

**Severidade**: 🔴 Crítico | 🟡 Moderado | 🟢 Baixo

**Prioridade**: Alta | Média | Baixa
```

---

## ✅ Conclusão

Este guia cobre **todos os fluxos críticos** do sistema. 

**Priorize testar**:
1. ✅ TESTE 05 (Aprovação com triggers)
2. ✅ TESTE 06 (Bloqueio por checklist)
3. ✅ TESTE 08 (Garantia automática)
4. ✅ TESTE 09 e 10 (Alertas e notificações)

**Após completar todos os testes**, o sistema está pronto para:
- [ ] Homologação com usuários
- [ ] Deploy em produção
- [ ] Treinamento da equipe

---

**Última atualização**: Outubro/2025  
**Versão**: 1.0  
**Autor**: Equipe de Desenvolvimento

