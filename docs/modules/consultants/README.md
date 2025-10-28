# Módulo de Consultores

## 📋 Visão Geral

Gestão de consultores técnicos responsáveis pelas ordens de serviço, com controle de comissões e ativação/desativação.

## 🎯 Objetivo

Gerenciar equipe de consultores, suas taxas de comissão e facilitar atribuição de responsáveis em OS.

## 📊 Funcionalidades Principais

### Cadastro de Consultores
- Nome completo
- Telefone (opcional, com máscara)
- Email (opcional, validação RFC 5322)
- Taxa de comissão (0-100%)
- Status ativo/inativo

### Gestão
- Edição de dados
- Toggle de status (ativo/inativo)
- Exclusão (com validação)
- Busca por nome, email ou telefone
- Filtro por status

### KPIs
- Total de consultores
- Consultores ativos
- Consultores inativos
- Comissão média

### Validações
- Nome: 2-50 caracteres, obrigatório
- Telefone: 10-11 dígitos (se preenchido)
- Email: formato válido (se preenchido)
- Taxa de comissão: 0-100%

## 🔗 Integração com Outros Módulos

- **Coleta**: Atribuição de consultor responsável
- **Ordens de Serviço**: Consultor vinculado à OS
- **Financeiro**: Cálculo de comissões sobre vendas

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/Consultores.tsx`  
**Hook:** `src/hooks/useConsultants.ts`  
**Tabela:** `consultants`

### Interface TypeScript
```typescript
interface Consultant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  commission_rate: number; // 0.0 - 1.0 (0% - 100%)
  is_active: boolean;
  org_id: string;
  created_at: string;
  updated_at: string;
}
```

### Métodos Disponíveis
- `fetchConsultants(searchTerm?: string)` - Buscar consultores
- `createConsultant(data)` - Criar consultor
- `updateConsultant(id, updates)` - Atualizar consultor
- `deleteConsultant(id)` - Excluir consultor
- `toggleConsultantStatus(id, isActive)` - Ativar/desativar

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
