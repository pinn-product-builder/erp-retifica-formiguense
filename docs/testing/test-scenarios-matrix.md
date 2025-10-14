# 📊 Matriz de Cenários de Teste - ERP Retífica

## 🎯 Matriz de Cobertura de Testes

| # | Cenário | Pré-condição | Ação | Resultado Esperado | Tipo | Prioridade | Status |
|---|---------|--------------|------|-------------------|------|------------|--------|
| **ORDENS DE SERVIÇO** |
| 01 | Criar OS com cliente novo | Usuário logado | Preencher formulário completo + criar cliente | OS criada, workflows gerados, status "ativa" | Funcional | 🔴 Alta | ⬜ |
| 02 | Criar OS com cliente existente | Clientes cadastrados | Buscar cliente, preencher dados motor | OS criada com cliente vinculado | Funcional | 🔴 Alta | ⬜ |
| 03 | Criar OS sem campos obrigatórios | Formulário aberto | Tentar salvar sem cliente | Erro de validação exibido | Validação | 🟡 Média | ⬜ |
| 04 | Editar OS em andamento | OS existente (status != "entregue") | Alterar dados e salvar | Alterações salvas, histórico atualizado | Funcional | 🟡 Média | ⬜ |
| 05 | Cancelar OS | OS com status "ativa" | Clicar em "Cancelar OS" | Status = "cancelada", workflows interrompidos | Funcional | 🟡 Média | ⬜ |
| 06 | Filtrar OSs por status | Lista de OSs | Aplicar filtro "em_producao" | Apenas OSs em produção exibidas | UI/UX | 🟢 Baixa | ⬜ |
| 07 | Buscar OS por número | Lista de OSs | Digitar número parcial | Autocomplete funciona, OS encontrada | UI/UX | 🟢 Baixa | ⬜ |
| **CHECK-IN E FOTOS** |
| 08 | Upload de foto no check-in | OS criada | Upload de imagem .jpg | Foto salva, preview exibido, storage OK | Funcional | 🔴 Alta | ⬜ |
| 09 | Upload de arquivo inválido | Modal de check-in | Tentar upload .exe | Erro de validação, arquivo rejeitado | Validação | 🟡 Média | ⬜ |
| 10 | Upload de foto muito grande | Modal de check-in | Upload de arquivo >10MB | Erro de tamanho, sugestão de compressão | Validação | 🟡 Média | ⬜ |
| 11 | Visualizar fotos na aba Fotos | Fotos já enviadas | Navegar para aba "Fotos" | Todas as fotos listadas, URLs válidas | Funcional | 🔴 Alta | ⬜ |
| 12 | Deletar foto | Foto existente | Clicar em deletar + confirmar | Foto removida do storage e banco | Funcional | 🟡 Média | ⬜ |
| **DIAGNÓSTICOS** |
| 13 | Preencher checklist completo | OS com check-in | Preencher todos os campos + aprovar | Diagnóstico salvo, status "approved" | Funcional | 🔴 Alta | ⬜ |
| 14 | Salvar checklist incompleto | Checklist aberto | Salvar sem campos obrigatórios | Erro de validação, campos em destaque | Validação | 🟡 Média | ⬜ |
| 15 | Medição fora do range | Campo de medição com range | Digitar valor > máximo | Erro de validação inline | Validação | 🟡 Média | ⬜ |
| 16 | Adicionar foto ao checklist | Checklist sendo preenchido | Upload de foto em item específico | Foto vinculada ao item correto | Funcional | 🟡 Média | ⬜ |
| 17 | Reprovar diagnóstico | Checklist preenchido | Selecionar status "reprovado" | Status salvo, próximas etapas bloqueadas | Funcional | 🟡 Média | ⬜ |
| **ORÇAMENTOS** |
| 18 | Gerar orçamento com serviços | Diagnóstico concluído | Adicionar serviços, calcular total | Orçamento criado, total correto | Funcional | 🔴 Alta | ⬜ |
| 19 | Gerar orçamento com peças | Lista de peças no estoque | Adicionar peças do estoque | Peças vinculadas, disponibilidade verificada | Funcional | 🔴 Alta | ⬜ |
| 20 | Orçamento com peça indisponível | Estoque de peça = 0 | Adicionar peça sem estoque | Alerta visual, sugestão de compra | UI/UX | 🟡 Média | ⬜ |
| 21 | Cálculo automático de totais | Orçamento em edição | Alterar quantidade/preço | Subtotais e total atualizam em tempo real | Funcional | 🔴 Alta | ⬜ |
| 22 | Exportar orçamento em PDF | Orçamento salvo | Clicar em "Exportar PDF" | PDF gerado corretamente, formatado | Funcional | 🟡 Média | ⬜ |
| **APROVAÇÃO DE ORÇAMENTO (TRIGGERS)** |
| 23 | Aprovar orçamento (trigger completo) | Orçamento pendente | Aprovar orçamento | **TODOS OS TRIGGERS DISPARAM** ⚡ | Integração | 🔴 **CRÍTICO** | ⬜ |
| 23a | - Reserva automática de peças | Orçamento aprovado | Verificar `parts_reservations` | Registros criados para cada peça | Automação | 🔴 Alta | ⬜ |
| 23b | - Redução de estoque disponível | Peças reservadas | Verificar `parts_inventory` | Quantidade reduzida corretamente | Automação | 🔴 Alta | ⬜ |
| 23c | - Alerta de estoque baixo | Estoque < mínimo após reserva | Verificar `stock_alerts` | Alerta criado, nível correto | Automação | 🔴 Alta | ⬜ |
| 23d | - Necessidade de compra | Peça insuficiente | Verificar `purchase_needs` | Necessidade criada, prioridade OK | Automação | 🔴 Alta | ⬜ |
| 23e | - Contas a receber | Orçamento aprovado | Verificar `accounts_receivable` | Parcelas criadas, valores corretos | Automação | 🔴 Alta | ⬜ |
| 23f | - Mudança de status da OS | OS estava "ativa" | Verificar `orders.status` | Status = "aprovada" | Automação | 🔴 Alta | ⬜ |
| 23g | - Histórico de status | Status mudou | Verificar `order_status_history` | Registro de mudança criado | Automação | 🟡 Média | ⬜ |
| 23h | - Notificações disparadas | Aprovação concluída | Verificar `notifications` | Notificações para equipe | Automação | 🔴 Alta | ⬜ |
| 24 | Reprovar orçamento | Orçamento pendente | Reprovar com motivo | Status = "rejeitado", notificação enviada | Funcional | 🟡 Média | ⬜ |
| **WORKFLOWS - KANBAN** |
| 25 | Visualizar Kanban "Todos" | Múltiplas OSs | Selecionar filtro "Todos" | Todos os componentes visíveis, cores preservadas | UI/UX | 🔴 Alta | ⬜ |
| 26 | Filtrar Kanban por componente | Kanban carregado | Selecionar filtro "Bloco" | Apenas workflows de bloco exibidos | UI/UX | 🟡 Média | ⬜ |
| 27 | Card mostra tempo correto | Workflow iniciado | Visualizar card | Tempo decorrido atualiza (minutos/horas/dias) | Funcional | 🔴 Alta | ⬜ |
| 28 | Indicador de checklist pendente | Workflow com checklist obrigatório | Visualizar card | Badge "Checklist Pendente" visível | UI/UX | 🔴 Alta | ⬜ |
| 29 | Iniciar etapa | Workflow em "entrada" | Clicar em "Iniciar Etapa" | `started_at` setado, tempo começa a contar | Funcional | 🔴 Alta | ⬜ |
| **WORKFLOWS - BLOQUEIOS** |
| 30 | **Bloqueio por checklist obrigatório** | Etapa iniciada, checklist não preenchido | Tentar concluir etapa | **BLOQUEIO ATIVO** 🔒, toast de erro | Validação | 🔴 **CRÍTICO** | ⬜ |
| 31 | Avançar após preencher checklist | Checklist aprovado | Concluir e avançar | Workflow avança automaticamente ✅ | Automação | 🔴 **CRÍTICO** | ⬜ |
| 32 | Bloqueio por aprovação necessária | Transição = "approval_required" | Tentar avançar | Bloqueio, notificação para supervisor | Validação | 🔴 Alta | ⬜ |
| 33 | Avanço manual pelo admin | Workflow bloqueado | Admin força avanço | Workflow avança (bypass de validação) | Funcional | 🟡 Média | ⬜ |
| **WORKFLOWS - CHECKLISTS** |
| 34 | Preencher checklist de etapa | Workflow em "metrologia" | Abrir checklist, preencher | Checklist específico da etapa carregado | Funcional | 🔴 Alta | ⬜ |
| 35 | Checklist com medições | Item de medição | Digitar valor numérico | Aceita apenas números, valida range | Validação | 🟡 Média | ⬜ |
| 36 | Aprovar checklist | Checklist preenchido | Selecionar "approved" | Status salvo, bloqueio removido | Funcional | 🔴 Alta | ⬜ |
| 37 | Editar checklist já aprovado | Checklist aprovado | Reabrir e editar | Permite edição (auditoria registrada) | Funcional | 🟡 Média | ⬜ |
| **RELATÓRIOS TÉCNICOS** |
| 38 | **Geração automática de relatório** | Etapa com `technical_report_required = true` | Concluir etapa | **Relatório gerado automaticamente** 📄 | Automação | 🔴 **CRÍTICO** | ⬜ |
| 39 | Conteúdo do relatório | Relatório gerado | Abrir relatório | Inclui checklist, medições, fotos | Funcional | 🔴 Alta | ⬜ |
| 40 | Status de conformidade | Checklist aprovado | Verificar relatório | Conformity_status = "conforming" | Funcional | 🟡 Média | ⬜ |
| 41 | Exportar relatório em PDF | Relatório existente | Clicar em "Exportar PDF" | PDF formatado corretamente | Funcional | 🟡 Média | ⬜ |
| **ENTREGA E GARANTIA** |
| 42 | Registrar entrega | OS concluída | Preencher dados de entrega | Status = "entregue", data registrada | Funcional | 🔴 Alta | ⬜ |
| 43 | **Geração automática de garantia** | Status muda para "entregue" | Trigger dispara | **Garantia criada automaticamente** 🛡️ | Automação | 🔴 **CRÍTICO** | ⬜ |
| 44 | Validar dados da garantia | Garantia criada | Abrir aba "Garantias" | start_date, end_date, dias restantes OK | Funcional | 🔴 Alta | ⬜ |
| 45 | Status de garantia expirando | Garantia com <30 dias | Visualizar garantia | Badge "Expirando", cor laranja | UI/UX | 🟡 Média | ⬜ |
| 46 | Garantia expirada | end_date < hoje | Visualizar garantia | Status "Expirada", cor vermelha | Funcional | 🟡 Média | ⬜ |
| **TIMELINE** |
| 47 | Timeline completa | OS com histórico | Abrir aba "Timeline" | Todos os eventos em ordem cronológica | Funcional | 🔴 Alta | ⬜ |
| 48 | Eventos de workflow | Workflow avançou | Verificar timeline | Eventos de início/conclusão visíveis | Funcional | 🟡 Média | ⬜ |
| 49 | Eventos de relatórios | Relatório gerado | Verificar timeline | Evento de geração de relatório | Funcional | 🟡 Média | ⬜ |
| **ESTOQUE** |
| 50 | Consultar peça no estoque | Peças cadastradas | Buscar por código/nome | Peça encontrada, dados corretos | Funcional | 🔴 Alta | ⬜ |
| 51 | Entrada manual de peças | Tela de movimentação | Registrar entrada | Quantidade aumentada, histórico OK | Funcional | 🔴 Alta | ⬜ |
| 52 | Saída manual de peças | Peças em estoque | Registrar saída | Quantidade diminuída, alerta se < mínimo | Funcional | 🔴 Alta | ⬜ |
| 53 | Histórico de movimentações | Peça com movimentações | Abrir histórico | Todas as entradas/saídas listadas | Funcional | 🟡 Média | ⬜ |
| **ALERTAS** |
| 54 | **Dashboard de alertas carrega** | Alertas existentes | Acessar `/alertas` | Dashboard exibe todos os tipos de alertas | Funcional | 🔴 **CRÍTICO** | ⬜ |
| 55 | Contadores de alertas | Múltiplos alertas ativos | Verificar cards de resumo | Contagens corretas por categoria | Funcional | 🔴 Alta | ⬜ |
| 56 | Alerta de estoque baixo | Estoque < mínimo | Verificar dashboard | Alerta listado, nível de severidade OK | Funcional | 🔴 Alta | ⬜ |
| 57 | Alerta de orçamento pendente | Orçamento há >3 dias | Verificar dashboard | Alerta gerado automaticamente | Automação | 🟡 Média | ⬜ |
| 58 | Alerta de compra urgente | Necessidade crítica | Verificar dashboard | Prioridade "critical", cor vermelha | Funcional | 🔴 Alta | ⬜ |
| 59 | Workflow pendente por checklist | Checklist obrigatório não preenchido | Verificar dashboard | Workflow listado em "Pendentes" | Funcional | 🔴 Alta | ⬜ |
| 60 | Reconhecer alerta | Alerta ativo | Clicar em "Reconhecer" | `acknowledged_at` setado, visual muda | Funcional | 🟡 Média | ⬜ |
| 61 | Real-time update de alertas | 2 browsers abertos | Browser 1: gerar alerta | Browser 2: dashboard atualiza automaticamente | Real-time | 🔴 Alta | ⬜ |
| **NOTIFICAÇÕES** |
| 62 | **Painel de notificações** | Notificações existentes | Clicar no sino 🔔 | Sheet abre, notificações listadas | Funcional | 🔴 **CRÍTICO** | ⬜ |
| 63 | Badge de não lidas | Notificações não lidas | Visualizar header | Badge com contagem correta | UI/UX | 🔴 Alta | ⬜ |
| 64 | Notificação de estoque baixo | Estoque atinge mínimo | Verificar notificações | Notificação criada automaticamente | Automação | 🔴 Alta | ⬜ |
| 65 | Notificação de orçamento aprovado | Orçamento aprovado | Verificar notificações | Notificação para equipe de produção | Automação | 🔴 Alta | ⬜ |
| 66 | Notificação de relatório gerado | Relatório gerado automaticamente | Verificar notificações | Notificação criada | Automação | 🟡 Média | ⬜ |
| 67 | Clicar em notificação | Notificação com action_url | Clicar | Navega para URL, marca como lida | Funcional | 🔴 Alta | ⬜ |
| 68 | Marcar como lida | Notificação não lida | Clicar em "✓" | `is_read = true`, badge diminui | Funcional | 🟡 Média | ⬜ |
| 69 | Marcar todas como lidas | Múltiplas não lidas | Botão "Marcar todas" | Todas marcadas, badge = 0 | Funcional | 🟡 Média | ⬜ |
| 70 | Deletar notificação | Notificação existente | Clicar em "🗑️" | Notificação removida | Funcional | 🟡 Média | ⬜ |
| 71 | Real-time notificações | 2 browsers | Browser 1: gerar evento | Browser 2: notificação aparece + toast | Real-time | 🔴 Alta | ⬜ |
| **PERMISSÕES** |
| 72 | Acesso negado por perfil | Usuário "técnico" | Tentar acessar configurações | Mensagem de acesso negado | Segurança | 🔴 Alta | ⬜ |
| 73 | RLS (dados de outra org) | 2 orgs diferentes | Usuário org A tenta acessar dados org B | Sem acesso, dados invisíveis | Segurança | 🔴 **CRÍTICO** | ⬜ |
| 74 | Permissão de escrita | Usuário "visualizador" | Tentar criar/editar | Botões desabilitados/ocultos | Segurança | 🔴 Alta | ⬜ |
| **PERFORMANCE** |
| 75 | Carga inicial do Kanban | Muitas OSs | Acessar `/workflows` | Carrega em <2s | Performance | 🟡 Média | ⬜ |
| 76 | Busca de clientes | 1000+ clientes | Digitar no autocomplete | Resposta em <500ms | Performance | 🟡 Média | ⬜ |
| 77 | Upload de múltiplas fotos | 10 fotos simultâneas | Upload em batch | Todas sobem sem erros | Performance | 🟡 Média | ⬜ |
| 78 | Real-time com muitos usuários | 10 usuários simultâneos | Ações concorrentes | Sem lag, dados consistentes | Performance | 🔴 Alta | ⬜ |
| **RESPONSIVIDADE** |
| 79 | Layout mobile | Dispositivo mobile | Navegar pelo sistema | UI adaptada, touch-friendly | UI/UX | 🔴 Alta | ⬜ |
| 80 | Kanban em tablet | Tablet | Arrastar cards | Drag-and-drop funciona | UI/UX | 🟡 Média | ⬜ |

---

## 📈 Estatísticas da Matriz

- **Total de cenários**: 80
- **Prioridade CRÍTICA** (🔴): 24 cenários
- **Prioridade Alta** (🟡): 35 cenários
- **Prioridade Baixa** (🟢): 3 cenários

### **Cenários Críticos que DEVEM passar**:
1. #23 - Aprovação de orçamento com todos os triggers
2. #30 - Bloqueio por checklist obrigatório
3. #31 - Avanço automático após checklist
4. #38 - Geração automática de relatórios
5. #43 - Geração automática de garantia
6. #54 - Dashboard de alertas
7. #62 - Painel de notificações
8. #73 - RLS (segurança multi-tenant)

---

## 🎯 Como Usar Esta Matriz

1. **Imprima ou use em planilha**
2. **Marque ✅ conforme testa**
3. **Anote bugs encontrados** (referenciando o #)
4. **Priorize cenários CRÍTICOS primeiro**
5. **Valide automações end-to-end**

---

**Última atualização**: Outubro/2025  
**Versão**: 1.0

