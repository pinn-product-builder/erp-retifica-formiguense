# 🔐 Autenticação e Multi-tenancy - Regras de Negócio

## 🔄 Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant S as Supabase Auth
    participant DB as PostgreSQL
    
    U->>F: Digite e-mail e senha
    F->>S: Requisição de login
    S->>DB: Valida credenciais
    DB-->>S: Usuário autenticado
    S->>S: Gera JWT token
    S-->>F: Retorna token
    F->>DB: Busca organizações do usuário
    DB-->>F: Lista de orgs
    F->>U: Exibe seletor de org
    U->>F: Seleciona organização
    F->>F: Armazena org_id no contexto
    F->>U: Dashboard carregado
```

## 🏢 Sistema Multi-tenant

### Isolamento de Dados

Cada organização possui dados **completamente isolados** através de:

1. **Column `org_id` em todas as tabelas**
2. **Row Level Security (RLS)** do PostgreSQL
3. **Validação no backend** via triggers

### Exemplo de Política RLS

```sql
-- Usuários só veem dados da própria organização
CREATE POLICY "users_org_isolation"
ON orders FOR ALL
USING (
  org_id IN (
    SELECT organization_id 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);
```

## 🔑 Gestão de Sessões

- **Duração**: 24 horas de inatividade
- **Renovação**: Automática com atividade
- **Logout**: Manual ou automático por inatividade

---

**Última Atualização**: 2025-01-14
