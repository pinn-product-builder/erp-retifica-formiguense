# Sistema de Autenticação e Permissões

## 🔐 Visão Geral

Sistema de autenticação baseado em Supabase Auth com controle granular de permissões por perfil de usuário.

## 🏗️ Arquitetura

```mermaid
graph TB
    User[Usuário] --> Auth[Supabase Auth]
    Auth --> JWT[JWT Token]
    JWT --> RLS[Row Level Security]
    JWT --> Frontend[Frontend Checks]
    
    subgraph "Autenticação"
        Auth --> Login[Login/Password]
        Auth --> Magic[Magic Link]
        Auth --> OAuth[OAuth Providers]
    end
    
    subgraph "Autorização"
        RLS --> Profile[profiles table]
        Profile --> OrgUser[organization_users]
        OrgUser --> Permissions[user_permissions]
    end
    
    style Auth fill:#c8e6c9
    style RLS fill:#fff9c4
