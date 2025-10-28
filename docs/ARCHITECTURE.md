# Arquitetura do Sistema - ERP Retífica Formiguense

## 📐 Visão Geral da Arquitetura

Sistema ERP multitenancy SaaS para gestão completa de retíficas de motores.

## 🏗️ Arquitetura de Alto Nível

```mermaid
graph TB
    subgraph "Frontend - React SPA"
        UI[Componentes UI<br/>Shadcn/Tailwind]
        Router[React Router]
        State[TanStack Query<br/>State Management]
        Forms[React Hook Form<br/>+ Zod]
    end
    
    subgraph "Backend - Supabase"
        Auth[Supabase Auth<br/>JWT]
        DB[(PostgreSQL<br/>+ RLS)]
        Storage[Supabase Storage<br/>Arquivos/PDFs]
        EdgeFunc[Edge Functions<br/>Deno Runtime]
    end
    
    subgraph "Integrações Externas"
        Email[SendGrid/Resend<br/>E-mails]
        WhatsApp[WhatsApp API<br/>Notificações]
        NFe[API NFe<br/>Fiscal]
    end
    
    UI --> Router
    Router --> State
    State --> Forms
    Forms --> Auth
    Auth --> DB
    DB --> Storage
    DB --> EdgeFunc
    EdgeFunc --> Email
    EdgeFunc --> WhatsApp
    EdgeFunc --> NFe
    
    style UI fill:#e3f2fd
    style DB fill:#c8e6c9
    style EdgeFunc fill:#fff9c4
