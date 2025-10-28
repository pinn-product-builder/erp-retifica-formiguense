# US-CLI-001: Cadastrar Cliente Pessoa Física

**ID:** US-CLI-001  
**Épico:** Clientes  
**Sprint:** 2  
**Prioridade:** 🔴 Alta  
**Estimativa:** 3 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** cadastrar clientes pessoa física no sistema  
**Para** manter registro completo de todos os clientes individuais

---

## 🎯 Objetivo de Negócio

Criar base de dados organizada de clientes PF com validações que garantam qualidade e evitem duplicações.

---

## ✅ Critérios de Aceitação

**AC01:** Botão "Novo Cliente" é exibido na página `/clientes`  
**AC02:** Modal abre com formulário de cadastro  
**AC03:** Opção "Pessoa Física" é selecionável  
**AC04:** Campos obrigatórios: Nome, CPF, Telefone  
**AC05:** CPF é validado em tempo real (algoritmo de validação)  
**AC06:** Sistema verifica se CPF já existe na organização  
**AC07:** Telefone aceita máscara automática: (XX) XXXXX-XXXX  
**AC08:** E-mail é validado se preenchido (formato válido)  
**AC09:** Campos de endereço são opcionais  
**AC10:** Ao salvar, toast confirma: "Cliente cadastrado com sucesso"  
**AC11:** Cliente aparece imediatamente na lista  

---

## 📐 Regras de Negócio

### RN-CLI-001-A: Validação de CPF
```typescript
const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  // CPF deve ter 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Rejeitar CPFs com todos os dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
};
```

### RN-CLI-001-B: Verificação de Duplicidade
```typescript
const checkDuplicateCPF = async (cpf: string, orgId: string): Promise<boolean> => {
  const cleaned = cpf.replace(/\D/g, '');
  
  const { data } = await supabase
    .from('customers')
    .select('id, name')
    .eq('org_id', orgId)
    .eq('document', cleaned)
    .eq('type', 'pf')
    .single();
    
  if (data) {
    toast.error(`CPF já cadastrado para: ${data.name}`);
    return true;
  }
  
  return false;
};
```

### RN-CLI-001-C: Formatação Automática
```typescript
const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0,3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9,11)}`;
};

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
  }
  return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7,11)}`;
};
```

---

## 🗄️ Database Schema

```sql
-- Tabela customers já existe, verificar campos específicos para PF
ALTER TABLE customers
ADD CONSTRAINT check_pf_document_length 
CHECK (
  type != 'pf' OR 
  (type = 'pf' AND LENGTH(document) = 11)
);

-- Índice para busca rápida por CPF
CREATE INDEX IF NOT EXISTS idx_customers_pf_document 
ON customers(document) 
WHERE type = 'pf';
```

---

## 💻 Implementação

### Schema Zod: `customerPFSchema.ts`

```typescript
import * as z from "zod";
import { validateCPF } from "@/lib/utils/validators";

export const customerPFSchema = z.object({
  type: z.literal('pf'),
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  document: z.string()
    .refine((cpf) => {
      const cleaned = cpf.replace(/\D/g, '');
      return cleaned.length === 11;
    }, 'CPF deve ter 11 dígitos')
    .refine((cpf) => validateCPF(cpf), 'CPF inválido'),
  phone: z.string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido'),
  email: z.string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, 'UF deve ter 2 letras').optional(),
  zip_code: z.string()
    .regex(/^\d{5}-\d{3}$/, 'CEP inválido')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

export type CustomerPFForm = z.infer<typeof customerPFSchema>;
```

### Componente: `ClienteFormPF.tsx`

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerPFSchema, CustomerPFForm } from "@/lib/validations/customerPFSchema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClientes } from "@/hooks/useClientes";
import { formatCPF, formatPhone } from "@/lib/utils/formatters";

export const ClienteFormPF = ({ onSuccess }: { onSuccess: () => void }) => {
  const { createCliente, isLoading } = useClientes();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerPFForm>({
    resolver: zodResolver(customerPFSchema),
    defaultValues: {
      type: 'pf',
    },
  });
  
  const cpf = watch('document');
  const phone = watch('phone');
  
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue('document', formatted);
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phone', formatted);
  };
  
  const onSubmit = async (data: CustomerPFForm) => {
    try {
      await createCliente({
        ...data,
        document: data.document.replace(/\D/g, ''), // Salvar apenas números
      });
      toast.success('Cliente cadastrado com sucesso');
      onSuccess();
    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        toast.error('CPF já cadastrado');
      } else {
        toast.error('Erro ao cadastrar cliente');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="João Silva"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="document">CPF *</Label>
        <Input
          id="document"
          value={cpf}
          onChange={handleCPFChange}
          placeholder="000.000.000-00"
          maxLength={14}
        />
        {errors.document && (
          <p className="text-sm text-destructive">{errors.document.message}</p>
        )}
        {cpf && !errors.document && (
          <p className="text-sm text-green-600">✓ CPF válido</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone *</Label>
        <Input
          id="phone"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(11) 99999-9999"
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
          placeholder="cliente@email.com"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Endereço (opcional)</h4>
        
        <div className="space-y-3">
          <Input
            {...register('address')}
            placeholder="Logradouro"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              {...register('city')}
              placeholder="Cidade"
            />
            <Input
              {...register('state')}
              placeholder="UF"
              maxLength={2}
            />
          </div>
          
          <Input
            {...register('zip_code')}
            placeholder="CEP: 00000-000"
            maxLength={9}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Informações adicionais sobre o cliente"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Cliente'}
        </Button>
      </div>
    </form>
  );
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve cadastrar cliente PF com sucesso', async ({ page }) => {
  await page.goto('/clientes');
  await page.click('text=Novo Cliente');
  
  // Selecionar Pessoa Física
  await page.click('input[value="pf"]');
  
  // Preencher dados
  await page.fill('[id="name"]', 'João Silva');
  await page.fill('[id="document"]', '12345678909');
  await page.fill('[id="phone"]', '11999998888');
  await page.fill('[id="email"]', 'joao@email.com');
  
  // Salvar
  await page.click('button:has-text("Salvar Cliente")');
  
  // Verificar sucesso
  await expect(page.locator('.toast')).toContainText('Cliente cadastrado');
  await expect(page.locator('table')).toContainText('João Silva');
});

test('deve validar CPF em tempo real', async ({ page }) => {
  await page.goto('/clientes');
  await page.click('text=Novo Cliente');
  await page.click('input[value="pf"]');
  
  // CPF inválido
  await page.fill('[id="document"]', '11111111111');
  await expect(page.locator('text=CPF inválido')).toBeVisible();
  
  // CPF válido
  await page.fill('[id="document"]', '12345678909');
  await expect(page.locator('text=✓ CPF válido')).toBeVisible();
});

test('deve detectar CPF duplicado', async ({ page }) => {
  // CPF já existente
  await page.goto('/clientes');
  await page.click('text=Novo Cliente');
  await page.click('input[value="pf"]');
  
  await page.fill('[id="name"]', 'Maria Silva');
  await page.fill('[id="document"]', '12345678909'); // CPF duplicado
  await page.fill('[id="phone"]', '11988887777');
  await page.click('button:has-text("Salvar")');
  
  await expect(page.locator('.toast')).toContainText('CPF já cadastrado');
});
```

---

## 📋 Definition of Done

- [x] Schema Zod com validações completas
- [x] Formulário com máscaras automáticas
- [x] Validação de CPF em tempo real
- [x] Detecção de duplicidade
- [x] Toast de sucesso/erro
- [x] Cliente aparece na lista imediatamente
- [x] Testes E2E passando
- [x] Documentação atualizada

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
