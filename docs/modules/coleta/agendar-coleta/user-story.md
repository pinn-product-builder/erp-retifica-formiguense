# US-COL-001: Agendar Coleta

**ID:** US-COL-001  
**Módulo:** Coleta  
**Sprint:** 11  
**Prioridade:** 🟡 Média  
**Estimativa:** 5 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** atendente  
**Quero** agendar coleta de equipamento  
**Para** buscar motor na localização do cliente

---

## 🎯 Objetivo de Negócio

Sistema de agendamento de coletas com roteirização, rastreamento e integração com criação de OS.

---

## ✅ Critérios de Aceitação

**AC01:** Agendar coleta com data/hora  
**AC02:** Informar endereço completo  
**AC03:** Atribuir motorista/coletor  
**AC04:** Gerar OS automaticamente após coleta  
**AC05:** Notificar cliente e motorista  
**AC06:** Rastrear status (agendada, em rota, coletada, entregue)  
**AC07:** Registrar foto do equipamento  
**AC08:** Roteirização otimizada (múltiplas coletas)

---

## 📐 Regras de Negócio

### RN-COL-001-A: Agendamento
- Horário comercial: 8h às 18h
- Mínimo 24h de antecedência
- Máximo 5 coletas por dia por motorista

### RN-COL-001-B: Criação de OS
- OS criada automaticamente ao marcar como "coletada"
- Status inicial: "recepção"
- Vincular fotos da coleta

### RN-COL-001-C: Cancelamento
- Até 2h antes: sem custo
- Menos de 2h: taxa de R$ 50

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const pickupScheduleSchema = z.object({
  customer_id: z.string().uuid(),
  
  scheduled_date: z.date()
    .refine((date) => date > new Date(), {
      message: "Data deve ser futura"
    }),
  
  scheduled_time: z.string().regex(/^\d{2}:\d{2}$/),
  
  address: z.object({
    street: z.string().min(3),
    number: z.string(),
    complement: z.string().optional(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zip_code: z.string().regex(/^\d{5}-?\d{3}$/)
  }),
  
  contact_name: z.string().min(3),
  contact_phone: z.string().min(10).max(15),
  
  equipment_description: z.string().min(10).max(500),
  
  assigned_driver: z.string().uuid().optional(),
  
  notes: z.string().max(1000).optional()
});
```

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
