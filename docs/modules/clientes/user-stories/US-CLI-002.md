# US-CLI-002: Cadastrar Cliente Pessoa Jurídica

**ID:** US-CLI-002  
**Épico:** Clientes  
**Sprint:** 2  
**Prioridade:** 🔴 Alta  
**Estimativa:** 3 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** cadastrar oficinas e empresas (Pessoa Jurídica)  
**Para** diferenciar clientes B2B de clientes finais

---

## 🎯 Objetivo de Negócio

Segmentar clientes empresariais (oficinas, revendedores) com campos específicos e validações de CNPJ.

---

## ✅ Critérios de Aceitação

**AC01:** Opção "Oficina (Pessoa Jurídica)" é selecionável no formulário  
**AC02:** Label muda para "Razão Social" ao invés de "Nome"  
**AC03:** Campo documento aceita CNPJ: 00.000.000/0000-00  
**AC04:** CNPJ é validado em tempo real (algoritmo de validação)  
**AC05:** Sistema verifica se CNPJ já existe  
**AC06:** Campos obrigatórios: Razão Social, CNPJ, Telefone  
**AC07:** E-mail e endereço continuam opcionais  
**AC08:** Campo adicional: "Nome Fantasia" (opcional)  
**AC09:** Toast confirma: "Oficina cadastrada com sucesso"  

---

## 📐 Regras de Negócio

### RN-CLI-002-A: Validação de CNPJ
```typescript
const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  // CNPJ deve ter 14 dígitos
  if (cleaned.length !== 14) return false;
  
  // Rejeitar CNPJs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Pesos para validação
  const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(12))) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
};
```

### RN-CLI-002-B: Formatação de CNPJ
```typescript
const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0,2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5,8)}/${cleaned.slice(8)}`;
  
  return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5,8)}/${cleaned.slice(8,12)}-${cleaned.slice(12,14)}`;
};
```

---

## 🗄️ Database Schema

```sql
-- Adicionar campo nome_fantasia (opcional para PJ)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS trade_name TEXT;

COMMENT ON COLUMN customers.trade_name IS 'Nome fantasia (apenas para PJ)';

-- Constraint para CNPJ
ALTER TABLE customers
ADD CONSTRAINT check_pj_document_length 
CHECK (
  type != 'pj' OR 
  (type = 'pj' AND LENGTH(document) = 14)
);
```

---

## 💻 Implementação

### Schema: `customerPJSchema.ts`

```typescript
import * as z from "zod";
import { validateCNPJ } from "@/lib/utils/validators";

export const customerPJSchema = z.object({
  type: z.literal('pj'),
  name: z.string()
    .min(3, 'Razão Social deve ter no mínimo 3 caracteres')
    .max(150, 'Razão Social muito longa'),
  trade_name: z.string()
    .max(100, 'Nome Fantasia muito longo')
    .optional()
    .or(z.literal('')),
  document: z.string()
    .refine((cnpj) => {
      const cleaned = cnpj.replace(/\D/g, '');
      return cleaned.length === 14;
    }, 'CNPJ deve ter 14 dígitos')
    .refine((cnpj) => validateCNPJ(cnpj), 'CNPJ inválido'),
  phone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido'),
  email: z.string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerPJForm = z.infer<typeof customerPJSchema>;
```

### Componente: `ClienteFormPJ.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerPJSchema, CustomerPJForm } from "@/lib/validations/customerPJSchema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useClientes } from "@/hooks/useClientes";
import { formatCNPJ, formatPhone } from "@/lib/utils/formatters";

export const ClienteFormPJ = ({ onSuccess }: { onSuccess: () => void }) => {
  const { createCliente, isLoading } = useClientes();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerPJForm>({
    resolver: zodResolver(customerPJSchema),
    defaultValues: {
      type: 'pj',
    },
  });
  
  const cnpj = watch('document');
  const phone = watch('phone');
  
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setValue('document', formatted);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };
  
  const onSubmit = async (data: CustomerPJForm) => {
    try {
      await createCliente({
        ...data,
        document: data.document.replace(/\D/g, ''),
      });
      toast.success('Oficina cadastrada com sucesso');
      onSuccess();
    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        toast.error('CNPJ já cadastrado');
      } else {
        toast.error('Erro ao cadastrar oficina');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Razão Social *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Oficina Central Ltda"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="trade_name">Nome Fantasia</Label>
        <Input
          id="trade_name"
          {...register('trade_name')}
          placeholder="Oficina Central"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="document">CNPJ *</Label>
        <Input
          id="document"
          value={cnpj}
          onChange={handleCNPJChange}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
        {errors.document && (
          <p className="text-sm text-destructive">{errors.document.message}</p>
        )}
        {cnpj && !errors.document && (
          <p className="text-sm text-green-600">✓ CNPJ válido</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone *</Label>
        <Input
          id="phone"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(11) 3333-4444"
          maxLength={15}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="contato@oficina.com"
        />
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Endereço (opcional)</h4>
        
        <div className="space-y-3">
          <Input {...register('address')} placeholder="Logradouro" />
          
          <div className="grid grid-cols-2 gap-3">
            <Input {...register('city')} placeholder="Cidade" />
            <Input {...register('state')} placeholder="UF" maxLength={2} />
          </div>
          
          <Input {...register('zip_code')} placeholder="CEP" maxLength={9} />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Oficina'}
        </Button>
      </div>
    </form>
  );
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve cadastrar oficina PJ com sucesso', async ({ page }) => {
  await page.goto('/clientes');
  await page.click('text=Novo Cliente');
  await page.click('input[value="pj"]');
  
  await page.fill('[id="name"]', 'Oficina Central Ltda');
  await page.fill('[id="trade_name"]', 'Oficina Central');
  await page.fill('[id="document"]', '11222333000181');
  await page.fill('[id="phone"]', '1133334444');
  
  await page.click('button:has-text("Salvar")');
  
  await expect(page.locator('.toast')).toContainText('Oficina cadastrada');
  await expect(page.locator('table')).toContainText('Oficina Central');
});

test('deve validar CNPJ inválido', async ({ page }) => {
  await page.goto('/clientes');
  await page.click('text=Novo Cliente');
  await page.click('input[value="pj"]');
  
  await page.fill('[id="document"]', '11111111111111');
  await expect(page.locator('text=CNPJ inválido')).toBeVisible();
});
```

---

## 📋 Definition of Done

- [x] Schema Zod para PJ
- [x] Validação de CNPJ
- [x] Campo Nome Fantasia
- [x] Formatação automática
- [x] Detecção de duplicidade
- [x] Testes E2E
- [x] Documentação

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
