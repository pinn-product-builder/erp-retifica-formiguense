# US-EST-001: Cadastro de Peça

**ID:** US-EST-001  
**Módulo:** Estoque  
**Sprint:** 9  
**Prioridade:** 🔴 Alta  
**Estimativa:** 3 pontos  
**Status:** Backlog

---

## 📋 User Story

**Como** almoxarife  
**Quero** cadastrar peças no sistema  
**Para** controlar inventário e movimentações

---

## 🎯 Objetivo de Negócio

Base de dados de peças com categorização, localização e controle de estoque mínimo/máximo.

---

## ✅ Critérios de Aceitação

**AC01:** Cadastrar peça com código, descrição, categoria  
**AC02:** Foto da peça  
**AC03:** Localização no estoque (prateleira, corredor)  
**AC04:** Estoque mínimo e máximo  
**AC05:** Custo médio e preço de venda  
**AC06:** Múltiplas unidades de medida  
**AC07:** Fornecedor padrão  
**AC08:** Código de barras/QR Code

---

## 📐 Regras de Negócio

### RN-EST-001-A: Validação
- Código único por organização
- Descrição obrigatória
- Estoque mínimo < estoque máximo
- Custo e preço devem ser > 0

### RN-EST-001-B: Categorias
- Predefinidas: Motores, Peças, Óleos, Filtros, Outros
- Usuário pode criar novas

### RN-EST-001-C: Unidades
- UN (unidade), KG (kilo), L (litro), M (metro)

---

## 📊 Validação de Dados

### Zod Schema

```typescript
import { z } from 'zod';

export const partSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  
  category_id: z.string().uuid(),
  
  unit: z.enum(['UN', 'KG', 'L', 'M', 'CX']),
  
  min_stock: z.number().min(0),
  max_stock: z.number().min(0),
  current_stock: z.number().min(0).default(0),
  
  cost_price: z.number().positive(),
  sell_price: z.number().positive(),
  
  location: z.string().max(100).optional(),
  barcode: z.string().max(50).optional(),
  
  supplier_id: z.string().uuid().optional(),
  
  is_active: z.boolean().default(true)
}).refine((data) => data.max_stock >= data.min_stock, {
  message: "Estoque máximo deve ser maior ou igual ao mínimo",
  path: ["max_stock"]
});
```

---

**Última atualização:** 2025-01-28  
**Versão:** 1.0
