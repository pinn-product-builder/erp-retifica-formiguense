# US-COL-004: Registrar Dados do Motorista e Veículo

**ID:** US-COL-004  
**Épico:** Coleta  
**Sprint:** 1  
**Prioridade:** 🔴 Alta  
**Estimativa:** 3 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** registrar dados do motorista e veículo que trouxe o motor  
**Para** ter rastreabilidade completa da entrega e contato em caso de necessidade

---

## 🎯 Objetivo de Negócio

Garantir informações de contato e rastreamento de quem entregou o motor, essenciais para logística reversa e resolução de problemas.

---

## ✅ Critérios de Aceitação

**AC01:** Seção "Motorista" exibe campos: Nome, Telefone, Documento (CPF/RG/CNH)  
**AC02:** Nome e Telefone são obrigatórios, Documento é opcional  
**AC03:** Telefone aceita máscara automática (XX) XXXXX-XXXX  
**AC04:** Seção "Veículo" exibe campos: Placa, Modelo, Ano, Cor, KM  
**AC05:** Placa é obrigatória e valida formatos: ABC-1234 ou ABC1A23 (Mercosul)  
**AC06:** Campos Modelo, Ano, Cor e KM são opcionais  
**AC07:** Ao preencher placa, sistema formata automaticamente (adiciona hífen)  

---

## 📐 Regras de Negócio

### RN-COL-004-A: Validação de Placa
```typescript
const PLATE_REGEX = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/;

const validatePlate = (plate: string): boolean => {
  const cleaned = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Formato antigo: ABC1234
  const oldFormat = /^[A-Z]{3}[0-9]{4}$/.test(cleaned);
  
  // Formato Mercosul: ABC1A23
  const newFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleaned);
  
  return oldFormat || newFormat;
};

const formatPlate = (plate: string): string => {
  const cleaned = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
};
```

### RN-COL-004-B: Validação de Telefone
```typescript
const PHONE_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/;

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // (XX) XXXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // (XX) XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};
```

---

## 🗄️ Database Schema

**Campos em `orders`:**
```sql
ALTER TABLE orders
ADD COLUMN collection_driver_name TEXT,
ADD COLUMN collection_driver_phone TEXT,
ADD COLUMN collection_driver_document TEXT,
ADD COLUMN vehicle_plate TEXT,
ADD COLUMN vehicle_model TEXT,
ADD COLUMN vehicle_year TEXT,
ADD COLUMN vehicle_color TEXT,
ADD COLUMN vehicle_km DECIMAL(10,2);

-- Constraints
ALTER TABLE orders
ADD CONSTRAINT valid_vehicle_plate 
CHECK (vehicle_plate ~* '^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$');

ALTER TABLE orders
ADD CONSTRAINT valid_driver_phone 
CHECK (collection_driver_phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$');

CREATE INDEX idx_orders_vehicle_plate ON orders(vehicle_plate);
```

---

## 💻 Implementação

### Componente: `MotoristaFields.tsx`

```typescript
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { formatPhone } from "@/lib/utils/formatters";

export const MotoristaFields = () => {
  const { register, setValue, watch } = useFormContext();
  const phone = watch('collection_driver_phone');
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('collection_driver_phone', formatted);
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">3️⃣ MOTORISTA</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driver-name">Nome *</Label>
          <Input
            id="driver-name"
            {...register('collection_driver_name')}
            placeholder="Nome do motorista"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="driver-phone">Telefone *</Label>
          <Input
            id="driver-phone"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="(11) 99999-9999"
            maxLength={15}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="driver-document">CPF/RG/CNH (opcional)</Label>
        <Input
          id="driver-document"
          {...register('collection_driver_document')}
          placeholder="000.000.000-00"
        />
      </div>
    </div>
  );
};
```

### Componente: `VeiculoFields.tsx`

```typescript
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { formatPlate } from "@/lib/utils/formatters";

export const VeiculoFields = () => {
  const { register, setValue, watch } = useFormContext();
  const plate = watch('vehicle_plate');
  
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlate(e.target.value);
    setValue('vehicle_plate', formatted);
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">4️⃣ VEÍCULO</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle-plate">Placa *</Label>
          <Input
            id="vehicle-plate"
            value={plate}
            onChange={handlePlateChange}
            placeholder="ABC-1234"
            maxLength={8}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vehicle-model">Modelo</Label>
          <Input
            id="vehicle-model"
            {...register('vehicle_model')}
            placeholder="Ex: Caminhão Mercedes"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vehicle-year">Ano</Label>
          <Input
            id="vehicle-year"
            {...register('vehicle_year')}
            placeholder="2020"
            maxLength={4}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle-color">Cor</Label>
          <Input
            id="vehicle-color"
            {...register('vehicle_color')}
            placeholder="Branco"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vehicle-km">Quilometragem</Label>
          <Input
            id="vehicle-km"
            type="number"
            {...register('vehicle_km')}
            placeholder="150000"
          />
        </div>
      </div>
    </div>
  );
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve validar placa formato antigo', async ({ page }) => {
  await page.goto('/coleta');
  
  await page.fill('[id="vehicle-plate"]', 'ABC1234');
  await page.blur('[id="vehicle-plate"]');
  
  // Deve formatar com hífen
  const plateValue = await page.inputValue('[id="vehicle-plate"]');
  expect(plateValue).toBe('ABC-1234');
});

test('deve validar placa formato Mercosul', async ({ page }) => {
  await page.goto('/coleta');
  
  await page.fill('[id="vehicle-plate"]', 'ABC1A23');
  await page.blur('[id="vehicle-plate"]');
  
  const plateValue = await page.inputValue('[id="vehicle-plate"]');
  expect(plateValue).toBe('ABC-1A23');
});

test('deve formatar telefone automaticamente', async ({ page }) => {
  await page.goto('/coleta');
  
  await page.fill('[id="driver-phone"]', '11999998888');
  await page.blur('[id="driver-phone"]');
  
  const phoneValue = await page.inputValue('[id="driver-phone"]');
  expect(phoneValue).toBe('(11) 99999-8888');
});

test('deve exigir apenas campos obrigatórios', async ({ page }) => {
  await page.goto('/coleta');
  
  // Preencher apenas obrigatórios
  await page.fill('[id="driver-name"]', 'Carlos Motorista');
  await page.fill('[id="driver-phone"]', '(11) 98888-7777');
  await page.fill('[id="vehicle-plate"]', 'ABC-1234');
  
  // Deve permitir continuar
  await page.click('[data-testid="finish-collection"]');
  
  // Não deve exibir erros de validação
  await expect(page.locator('.toast-error')).not.toBeVisible();
});
```

---

## 📋 Definition of Done

- [x] Componentes `MotoristaFields` e `VeiculoFields` criados
- [x] Máscaras de telefone e placa funcionais
- [x] Validação de formatos implementada
- [x] Apenas campos obrigatórios bloqueiam envio
- [x] Testes E2E passando
- [x] Documentação atualizada

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
