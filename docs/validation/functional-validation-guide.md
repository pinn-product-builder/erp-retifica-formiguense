# ✅ Guia de Validação Funcional - ERP Retífica

## 📋 Checklist por Módulo

### ✅ Dashboard
- [ ] KPIs carregam em < 2 segundos
- [ ] WebSocket conectado (ícone verde)
- [ ] Filtros funcionam corretamente
- [ ] Notificações aparecem
- [ ] Tabs navegam sem erro

### ✅ Workflow Kanban
- [ ] Drag-and-drop funciona
- [ ] Status atualizam em tempo real
- [ ] Checklists obrigatórios bloqueiam avanço
- [ ] Cores dos cards corretas por status

### ✅ Orçamentos
- [ ] Cálculos automáticos corretos
- [ ] Aprovação gera Contas a Receber
- [ ] Reserva de peças automática
- [ ] PDF gerado corretamente

### ✅ Fiscal
- [ ] Cálculo de impostos correto
- [ ] Alíquotas aplicadas conforme regime
- [ ] SPED gerado sem erros

### ✅ Financeiro
- [ ] Lançamentos integram corretamente
- [ ] DRE calcula lucro/prejuízo
- [ ] Fluxo de caixa atualiza

### ✅ Estoque
- [ ] Movimentações atualizam saldo
- [ ] Alertas de estoque baixo funcionam
- [ ] Reservas impedem venda

### ✅ Compras
- [ ] Fluxo completo funciona
- [ ] Sugestões de fornecedores aparecem
- [ ] Recebimento atualiza estoque

---

## 🎯 Cenários de Teste Prioritários

### Cenário 1: Fluxo Completo de OS
1. Criar organização
2. Adicionar usuário
3. Criar cliente
4. Criar OS
5. Fazer diagnóstico
6. Criar orçamento
7. Aprovar orçamento
8. Movimentar no Kanban
9. Finalizar OS

**Resultado esperado**: Todos os passos sem erro, dados consistentes

### Cenário 2: Isolamento Multi-tenant
1. Criar 2 organizações
2. Criar OS em cada uma
3. Trocar de org
4. Verificar que vê apenas dados da org atual

**Resultado esperado**: Dados não vazam entre orgs

### Cenário 3: Permissões
1. Criar usuário "Viewer"
2. Tentar criar OS
3. Tentar editar configurações

**Resultado esperado**: Ações bloqueadas, mensagem de erro

---

## 📝 Template de Reporte de Issue

```markdown
## Título do Problema
[Descrição curta e clara]

## Passos para Reproduzir
1. Acesse...
2. Clique em...
3. Preencha...

## Resultado Esperado
[O que deveria acontecer]

## Resultado Obtido
[O que aconteceu de fato]

## Ambiente
- Navegador: Chrome 120
- Sistema: Windows 11
- Perfil: Admin
- Organização: [nome]

## Screenshots
[Anexar prints]
```

---

**Última Atualização**: 2025-01-14
