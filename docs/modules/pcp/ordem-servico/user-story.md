# US-PCP-001: Gestão de Ordem de Serviço

**ID:** US-PCP-001  
**Módulo:** PCP (Planejamento e Controle de Produção)  
**Sprint:** 10  
**Prioridade:** 🔴 Alta  
**Estimativa:** 8 pontos  
**Status:** Em Desenvolvimento

---

## 📋 User Story

**Como** gerente de produção  
**Quero** criar e gerenciar ordens de serviço  
**Para** controlar o fluxo de trabalho da oficina

---

## 🎯 Objetivo de Negócio

Sistema completo de OS com workflow configurável, rastreamento de status e integração com diagnóstico, orçamento e estoque.

---

## ✅ Critérios de Aceitação

**AC01:** Criar OS com cliente, equipamento, componentes  
**AC02:** Workflow: Recepção → Diagnóstico → Orçamento → Aprovação → Execução → Entrega  
**AC03:** Vincular checklist de diagnóstico  
**AC04:** Gerar orçamento detalhado  
**AC05:** Aprovar orçamento (parcial/total)  
**AC06:** Atribuir mecânico/responsável  
**AC07:** Registrar tempo de execução  
**AC08:** Consumir peças do estoque  
**AC09:** Finalizar e gerar nota fiscal  
**AC10:** Kanban visual de status

---

## 📐 Regras de Negócio

### RN-PCP-001-A: Workflow
- Transições controladas por permissões
- Não pode pular etapas obrigatórias
- Histórico de mudanças de status

### RN-PCP-001-B: Orçamento
- Múltiplos orçamentos por componente
- Cliente pode aprovar parcialmente
- Requer aprovação para iniciar execução

### RN-PCP-001-C: Execução
- Registrar início e fim de trabalho
- Consumo de peças baixa estoque automaticamente
- Calcular custo real vs orçado

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const orderSchema = z.object({
  customer_id: z.string().uuid(),
  engine_id: z.string().uuid().optional(),
  
  order_number: z.string().min(1),
  
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  
  estimated_delivery: z.date().optional(),
  
  components: z.array(z.enum([
    'bloco', 'eixo', 'biela', 'comando', 
    'cabecote', 'pistao', 'virabrequim'
  ])).min(1),
  
  issue_description: z.string().min(10).max(2000),
  
  consultant_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  
  notes: z.string().max(2000).optional()
});

export const orderStatusTransitionSchema = z.object({
  order_id: z.string().uuid(),
  from_status: z.string(),
  to_status: z.string(),
  reason: z.string().max(500).optional(),
  changed_by: z.string().uuid()
});
```

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
