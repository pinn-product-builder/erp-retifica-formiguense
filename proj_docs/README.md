# Documentação do Projeto ERP Retífica

Este diretório contém toda a documentação técnica e de usuário do sistema ERP Retífica.

## Estrutura da Documentação

### 📐 [Arquitetura](./architecture/)
Documentação técnica da arquitetura do sistema, multitenancy, banco de dados e segurança.

### 🔧 [Módulos](./modules/)
Documentação detalhada de cada módulo do sistema (fiscal, financeiro, PCP, workflow, etc.).

### 🌐 [API](./api/)
Documentação da API, Supabase, edge functions e políticas de segurança.

### 👥 [Guias do Usuário](./user-guides/)
Manuais e guias para usuários finais e administradores.

### 💻 [Desenvolvimento](./development/)
Guias para desenvolvedores, padrões de código e processo de deploy.

### 📊 [Diagramas](./diagrams/)
Diagramas de arquitetura, fluxos de usuário e ERD do banco de dados.

### 🔒 [Segurança](./security/)
Documentação de segurança, autenticação, autorização e proteção de dados.

### 📝 [Releases](./releases/)
Changelog, roadmap e notas de release do projeto.

## Como Contribuir

Para contribuir com a documentação, consulte o [Guia de Contribuição](./development/contributing.md).

## Navegação Rápida

- [Visão Geral do Sistema](./architecture/system-overview.md)
- [Modelo de Segurança](./architecture/security-model.md)
- [Sistema de Multitenancy](./architecture/multitenancy.md)
- [Sistema de Permissões por Perfis](./architecture/profile-permissions-system.md)
- [Esquema do Banco de Dados](./architecture/database-schema.md)
- [Guia de Início Rápido](./user-guides/getting-started.md)
- [Configuração de Desenvolvimento](./development/setup-guide.md)
- [Manual do Usuário](./user-guides/user-manual.md)

## Atualizações Recentes

### 🆕 Sistema de Permissões por Perfis
- Implementado sistema híbrido que combina RBAC tradicional com permissões granulares por página
- Criação de setores organizacionais para melhor organização de usuários
- Perfis personalizáveis com permissões específicas (visualizar, editar, excluir)
- Interface de gestão completa para administradores

### 🔐 Sistema de Super Usuários
- **Apenas Super Usuários** podem criar organizações
- **Processo de solicitação** com aprovação manual
- **Dois tipos**: Platform Admin e Organization Creator
- **Interface de gestão** para administradores da plataforma
- **Auditoria completa** de todas as solicitações e ações

### 🗄️ Esquema de Banco Atualizado
- Novas tabelas: `user_sectors`, `user_profiles`, `system_pages`, `profile_page_permissions`, `user_profile_assignments`
- Constraints de validação em múltiplas camadas
- Índices otimizados para performance
- Políticas RLS específicas para o sistema de perfis