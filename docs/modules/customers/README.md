# Módulo de Clientes

## 📋 Visão Geral

Sistema CRM para gestão completa de clientes, com suporte a clientes diretos e oficinas, validação de documentos e histórico completo.

## 🎯 Objetivo

Centralizar informações de clientes, facilitar cadastro e busca, e manter histórico de relacionamento.

## 📊 Funcionalidades Principais

### Cadastro de Clientes
- **Cliente Direto**: Pessoa física com CPF
- **Oficina**: Pessoa jurídica com CNPJ
- Validação automática de documentos
- Máscaras de entrada (CPF, CNPJ, telefone)
- Campos opcionais: email, endereço

### Busca e Filtros
- Busca por nome, documento ou telefone
- Filtro por tipo (direto/oficina)
- Resultados em tempo real

### Gestão
- Edição de dados
- Exclusão com validação
- Visualização em tabela responsiva
- KPIs: total, diretos, oficinas

### Validações
- CPF: 11 dígitos, formato válido
- CNPJ: 14 dígitos, formato válido
- Telefone: 10-11 dígitos
- Email: formato RFC 5322
- Nome: 2-50 caracteres
- Endereço: máximo 200 caracteres

## 🔗 Integração com Outros Módulos

- **Coleta**: Seleção de cliente para coleta
- **Ordens de Serviço**: Cliente proprietário
- **Orçamentos**: Destinatário do orçamento
- **Financeiro**: Contas a receber

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/Clientes.tsx`  
**Hook:** `src/hooks/useCustomers.ts`  
**Tabela:** `customers`

### Interface TypeScript
```typescript
interface Customer {
  id: string;
  type: 'direto' | 'oficina';
  name: string;
  document: string; // CPF ou CNPJ (apenas números)
  phone: string;
  email?: string;
  address?: string;
  workshop_name?: string;
  workshop_cnpj?: string;
  workshop_contact?: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}
```

### Métodos Disponíveis
- `fetchCustomers(searchTerm?: string)` - Buscar clientes
- `getCustomerById(id)` - Buscar por ID
- `createCustomer(data)` - Criar cliente
- `updateCustomer(id, updates)` - Atualizar cliente
- `deleteCustomer(id)` - Excluir cliente

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
