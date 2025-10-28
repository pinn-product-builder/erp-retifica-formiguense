# US-COM-001: Cadastro de Fornecedor

**ID:** US-COM-001  
**Módulo:** Compras  
**Sprint:** 9  
**Prioridade:** 🔴 Alta  
**Estimativa:** 3 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** comprador  
**Quero** cadastrar fornecedores  
**Para** gerenciar base de fornecimento de peças e serviços

---

## 🎯 Objetivo de Negócio

Base de dados centralizada de fornecedores com histórico de compras, avaliações e documentação.

---

## ✅ Critérios de Aceitação

**AC01:** Cadastrar fornecedor PF ou PJ  
**AC02:** Dados: nome, CNPJ/CPF, endereço, contatos  
**AC03:** Categorias de fornecimento (peças, serviços, etc)  
**AC04:** Múltiplos contatos (comercial, financeiro)  
**AC05:** Anexar documentos (contrato, certificações)  
**AC06:** Status: ativo/inativo  
**AC07:** Histórico de compras  
**AC08:** Avaliação e notas

---

## 📐 Regras de Negócio

### RN-COM-001-A: Validação
- CNPJ/CPF obrigatório e único
- Email único por fornecedor
- Pelo menos 1 telefone

### RN-COM-001-B: Categorias
- Peças e Materiais
- Mão de Obra Externa
- Serviços Especializados
- Logística e Transporte

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(3).max(200),
  document: z.string().regex(/^\d{11}$|^\d{14}$/), // CPF ou CNPJ
  type: z.enum(['individual', 'company']),
  
  email: z.string().email().optional(),
  phone: z.string().min(10).max(15),
  
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
  
  categories: z.array(z.string()).min(1),
  
  contacts: z.array(z.object({
    name: z.string(),
    role: z.string(),
    phone: z.string(),
    email: z.string().email().optional()
  })).optional(),
  
  payment_terms: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
});
```

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
