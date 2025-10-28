# US-CLI-001: Cadastrar Cliente Pessoa Física

**ID:** US-CLI-001  
**Epic:** Clientes  
**Sprint:** 5  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** ✅ Implementado

---

## 📋 User Story

**Como** atendente  
**Quero** cadastrar clientes pessoas físicas com CPF  
**Para** armazenar informações de contato e histórico de atendimento

---

## 🎯 Business Objective

Centralizar cadastro de clientes PF com validação automática de CPF e dados essenciais para atendimento.

---

## ✅ Acceptance Criteria

**AC01:** Formulário com campos: CPF (obrigatório), nome completo, telefone, email, endereço  
**AC02:** Validação automática de CPF (formato e dígitos verificadores)  
**AC03:** Máscara de entrada para CPF: 000.000.000-00  
**AC04:** Telefone com máscara (00) 00000-0000 ou (00) 0000-0000  
**AC05:** Email validado via regex RFC 5322  
**AC06:** Mensagem de erro clara para dados inválidos  
**AC07:** Toast de confirmação após salvar  
**AC08:** Redirecionar para lista de clientes após cadastro

---

## 📐 Business Rules

### RN-CLI-001: Validação de CPF
```typescript
// CPF deve ter exatamente 11 dígitos (sem máscara)
// Não permitir CPFs inválidos conhecidos (111.111.111-11, etc)
// Validar dígitos verificadores

function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Rejeita sequências
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}
```

### RN-CLI-002: Unicidade de CPF
- Não permitir cadastrar mesmo CPF duas vezes na mesma organização
- Constraint única no banco: `UNIQUE (org_id, cpf)`

### RN-CLI-003: Campos Obrigatórios
- CPF: obrigatório
- Nome: obrigatório, mínimo 2 caracteres
- Telefone: obrigatório, 10-11 dígitos
- Email, Endereço: opcionais

---

## 🗄️ Database Schema

Ver arquivo: [`schema.sql`](./schema.sql)

---

## 🧪 Implementation

**Página:** `src/pages/Clientes.tsx`  
**Hook:** `src/hooks/useCustomers.ts`  
**Componente:** `src/components/clientes/ClienteForm.tsx`  
**Schema Zod:** `src/schemas/customerSchema.ts`

### Zod Schema
```typescript
import { z } from 'zod';
import { validateCPF } from '@/utils/validators';

export const customerPFSchema = z.object({
  type: z.literal('direto'),
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .refine(validateCPF, 'CPF inválido'),
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  phone: z.string()
    .min(10, 'Telefone inválido')
    .max(11, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().max(200, 'Endereço muito longo').optional().or(z.literal(''))
});
```

---

## 🔗 Links Relacionados

- [Wireframe da Tela](./wireframe.md)
- [Fluxo de Usuário](./flow-usuario.mmd)
- [Fluxo de Dados](./flow-dados.mmd)
- [Schema SQL](./schema.sql)

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
