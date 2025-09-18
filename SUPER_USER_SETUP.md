# Setup do Sistema de Super Usuários

## Visão Geral

Este guia explica como configurar o sistema de super usuários no ERP Retífica. Com esta implementação, apenas super usuários podem criar organizações, proporcionando maior controle e segurança.

## 🔄 Mudanças Implementadas

### 1. **Estrutura de Banco de Dados**
- ✅ Criado enum `super_user_type` (`platform_admin`, `organization_creator`)
- ✅ Criada tabela `super_users` para gerenciar super usuários
- ✅ Criada tabela `super_user_signup_requests` para solicitações
- ✅ Atualizadas políticas RLS para restringir criação de organizações

### 2. **Interface de Usuário**
- ✅ Página de solicitação: `/super-user-signup`
- ✅ Página de gestão: `/super-user-requests` (apenas platform admins)
- ✅ Link na página de login para solicitar acesso
- ✅ Hook `useSuperUser` para gerenciar funcionalidades

### 3. **Fluxo de Autorização**
- ✅ Verificação automática antes de criar organizações
- ✅ Mensagens de erro claras para usuários não autorizados
- ✅ Processo de aprovação manual para novas solicitações

## 🚀 Primeiros Passos

### Passo 1: Aplicar a Migração

Execute a migração no seu banco Supabase:

```bash
# Se usando Supabase CLI
supabase db push

# Ou execute manualmente o arquivo:
# supabase/migrations/20250918120000_create_super_user_system.sql
```

### Passo 2: Criar o Primeiro Platform Admin

⚠️ **IMPORTANTE**: Você precisa criar manualmente o primeiro platform admin, pois não há interface para isso ainda.

```sql
-- 1. Primeiro, crie uma conta normal no sistema através da interface
-- 2. Depois, execute este SQL no banco (substitua o USER_ID):

INSERT INTO public.super_users (user_id, super_user_type, notes, created_at)
VALUES (
  'SEU_USER_ID_AQUI',  -- Substitua pelo ID do usuário
  'platform_admin',
  'Primeiro administrador da plataforma - criado manualmente',
  NOW()
);
```

**Como encontrar o USER_ID:**
1. Faça login no sistema
2. Abra o console do navegador
3. Execute: `console.log(user.id)` (se tiver acesso ao contexto)
4. Ou consulte a tabela `auth.users` no Supabase Dashboard

### Passo 3: Testar o Sistema

1. **Teste a Restrição**:
   - Tente criar uma organização com usuário normal
   - Deve receber erro: "Apenas super usuários podem criar organizações"

2. **Teste a Solicitação**:
   - Acesse `/super-user-signup`
   - Preencha o formulário
   - Verifique se aparece em `/super-user-requests`

3. **Teste a Aprovação**:
   - Como platform admin, acesse `/super-user-requests`
   - Aprove uma solicitação
   - Crie manualmente o usuário aprovado como super usuário

## 📋 Tipos de Super Usuário

### Platform Admin
- **Pode fazer**: Tudo
- **Responsabilidades**:
  - Aprovar/rejeitar solicitações
  - Criar outros super usuários
  - Gerenciar o sistema
  - Criar organizações

### Organization Creator
- **Pode fazer**: Criar organizações
- **Responsabilidades**:
  - Criar organizações para clientes
  - Gerenciar organizações criadas
  - Não pode gerenciar outros super usuários

## 🔧 Funcionalidades Disponíveis

### Para Usuários Normais
- ✅ Solicitar acesso como super usuário via `/super-user-signup`
- ✅ Receber feedback claro quando tentar criar organizações
- ✅ Interface intuitiva com justificativa da solicitação

### Para Platform Admins
- ✅ Visualizar todas as solicitações em `/super-user-requests`
- ✅ Aprovar/rejeitar solicitações com notas
- ✅ Dashboard com estatísticas das solicitações
- ✅ Filtros por status (pendente, aprovado, rejeitado)

### Para Organization Creators
- ✅ Criar organizações normalmente
- ✅ Tornar-se OWNER das organizações criadas
- ✅ Gerenciar usuários das organizações

## 🔍 Monitoramento e Auditoria

### Logs Automáticos
- ✅ Todas as ações são auditadas na tabela `audit_logs`
- ✅ Criação de super usuários é registrada
- ✅ Solicitações são notificadas automaticamente

### Métricas Disponíveis
- Total de solicitações
- Solicitações pendentes/aprovadas/rejeitadas
- Histórico de aprovações por admin
- Tempo médio de resposta

## 🚨 Considerações de Segurança

### Proteções Implementadas
- ✅ **RLS**: Apenas super usuários veem dados sensíveis
- ✅ **Validação**: Múltiplas camadas de verificação
- ✅ **Auditoria**: Todas as ações são registradas
- ✅ **Isolamento**: Políticas específicas por tipo de usuário

### Recomendações
1. **Limite Platform Admins**: Tenha poucos platform admins
2. **Revise Regularmente**: Monitore solicitações pendentes
3. **Documente Aprovações**: Use o campo de notas
4. **Backup Regular**: Mantenha backups das tabelas de super usuários

## 🔄 Processo de Aprovação

### Fluxo Completo
1. **Usuário** preenche formulário em `/super-user-signup`
2. **Sistema** salva na tabela `super_user_signup_requests`
3. **Platform Admin** recebe notificação (via audit_logs)
4. **Platform Admin** revisa em `/super-user-requests`
5. **Platform Admin** aprova/rejeita com notas
6. **Sistema** atualiza status da solicitação
7. **Usuário aprovado** deve ser criado manualmente como super usuário

### Criação Manual do Super Usuário (Após Aprovação)

```sql
-- Após aprovar uma solicitação, crie o super usuário:
INSERT INTO public.super_users (user_id, super_user_type, notes, created_by)
VALUES (
  'USER_ID_DO_APROVADO',
  'organization_creator', -- ou 'platform_admin'
  'Aprovado via solicitação #REQUEST_ID',
  auth.uid() -- ID do admin que está criando
);
```

## 📞 Suporte

### Problemas Comuns

**Q: Usuário não consegue criar organização**
A: Verifique se é super usuário ativo na tabela `super_users`

**Q: Solicitação não aparece na lista**
A: Verifique se o usuário logado é platform admin

**Q: Erro ao aprovar solicitação**
A: Verifique as políticas RLS e se o usuário tem permissões

**Q: Como criar o primeiro platform admin?**
A: Execute o SQL manual mostrado no Passo 2

### Logs de Debug
```sql
-- Verificar super usuários
SELECT * FROM public.super_users WHERE is_active = true;

-- Verificar solicitações
SELECT * FROM public.super_user_signup_requests ORDER BY created_at DESC;

-- Verificar logs de auditoria
SELECT * FROM public.audit_logs WHERE table_name IN ('super_users', 'super_user_signup_requests') ORDER BY created_at DESC LIMIT 10;
```

## 🎯 Próximos Passos

### Melhorias Futuras
- [ ] Automação da criação de usuário após aprovação
- [ ] Notificações por email para solicitações
- [ ] Dashboard de métricas para platform admins
- [ ] Expiração automática de solicitações antigas
- [ ] Integração com sistema de tickets

### Configurações Opcionais
- [ ] Limitar número de organizações por creator
- [ ] Adicionar aprovação em dois níveis
- [ ] Criar templates de resposta para rejeições
- [ ] Implementar sistema de cotas

---

## 📝 Resumo da Implementação

✅ **Implementado**:
- Sistema de super usuários completo
- Restrição de criação de organizações
- Interface de solicitação
- Interface de gestão para admins
- Auditoria e logs
- Documentação completa

⚠️ **Requer Ação Manual**:
- Aplicar migração no banco
- Criar primeiro platform admin
- Testar o fluxo completo

🔄 **Fluxo Funcional**:
1. Usuário solicita acesso → 2. Admin aprova → 3. Admin cria super usuário → 4. Super usuário pode criar organizações

Este sistema garante controle total sobre quem pode criar organizações, mantendo a segurança e auditabilidade necessárias para um ambiente empresarial.
