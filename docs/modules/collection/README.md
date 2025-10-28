# Módulo de Coleta

## 📋 Visão Geral

Gestão de solicitações e execução de coleta de motores no endereço do cliente, com integração direta ao check-in técnico.

## 🎯 Objetivo

Facilitar o registro de coletas de motores, cadastro de clientes e transição para o check-in técnico de forma fluida.

## 📊 Funcionalidades Principais

### Dados da Coleta
- Data e hora da coleta
- Local de coleta (endereço completo)
- Motorista/coletor responsável
- Tipo de cliente (direto/oficina)
- Motivo da falha relatado

### Gestão de Clientes
- **Busca de Cliente Existente**: Modal com busca por nome, documento ou telefone
- **Cadastro Rápido**: Criação de novo cliente sem sair do formulário
- **Auto-preenchimento**: Dados do cliente selecionado preenchem o formulário

### Seleção de Consultor
- Lista de consultores ativos
- Atribuição do responsável pela OS

### Fluxo Integrado
- Salva dados no `sessionStorage`
- Redireciona para Check-in Técnico
- Dados persistem entre páginas

## 🔗 Integração com Outros Módulos

- **Clientes**: Busca e criação de clientes
- **Consultores**: Seleção de consultor responsável
- **Check-in**: Recebe dados via sessionStorage
- **Ordens de Serviço**: OS criada após check-in completo

## 🧪 Implementação Atual

**Componente Principal:** `src/pages/Coleta.tsx`  
**Hooks Utilizados:**
- `useCustomers` - Gestão de clientes
- `useConsultants` - Lista de consultores
- `useSupabase` - Operações com banco

### Fluxo de Dados
```typescript
// Dados salvos no sessionStorage
interface ColetaData {
  customer_id: string;
  consultant_id: string;
  collection_date: string;
  collection_time: string;
  collection_location: string;
  driver_name: string;
  failure_reason?: string;
}
```

### Navegação
```
Coleta → sessionStorage → Check-in → Ordem de Serviço
```

## 📋 Validações

- **Data da coleta**: obrigatória
- **Hora da coleta**: obrigatória
- **Local da coleta**: obrigatório
- **Motorista**: obrigatório
- **Tipo de cliente**: obrigatório (direto/oficina)
- **Cliente**: deve ser selecionado ou criado
- **Consultor**: obrigatório

## 📅 Última Atualização

**Data**: 28/10/2025  
**Status**: ✅ Em Produção
