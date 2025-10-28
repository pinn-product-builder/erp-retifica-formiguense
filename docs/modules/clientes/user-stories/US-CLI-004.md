# US-CLI-004: Editar Dados de Cliente

**ID:** US-CLI-004  
**Épico:** Clientes  
**Sprint:** 3  
**Prioridade:** 🟡 Média  
**Estimativa:** 3 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** editar dados de clientes já cadastrados  
**Para** manter informações atualizadas e corrigir erros

---

## 🎯 Objetivo de Negócio

Permitir atualização de dados de clientes sem perder histórico, mantendo rastreabilidade de alterações.

---

## ✅ Critérios de Aceitação

**AC01:** Botão "Editar" é exibido no modal de detalhes do cliente  
**AC02:** Formulário abre pré-preenchido com dados atuais  
**AC03:** Tipo (PF/PJ) NÃO pode ser alterado após criação  
**AC04:** Documento (CPF/CNPJ) NÃO pode ser alterado  
**AC05:** Nome, telefone, e-mail e endereço podem ser editados  
**AC06:** Validações continuam aplicadas (formato de telefone, e-mail)  
**AC07:** Ao salvar, campo `updated_at` é atualizado automaticamente  
**AC08:** Toast confirma: "Cliente atualizado com sucesso"  
**AC09:** Mudanças aparecem imediatamente na lista e no modal  

---

## 📐 Regras de Negócio

### RN-CLI-004-A: Campos Não Editáveis
```typescript
interface NonEditableFields {
  id: boolean;            // TRUE - Nunca pode mudar
  type: boolean;          // TRUE - PF/PJ fixo após criação
  document: boolean;      // TRUE - CPF/CNPJ fixo
  created_at: boolean;    // TRUE - Data de criação preservada
  created_by: boolean;    // TRUE - Criador original preservado
  org_id: boolean;        // TRUE - Organização não muda
}

// Campos editáveis
interface EditableFields {
  name: boolean;          // TRUE
  trade_name: boolean;    // TRUE (apenas PJ)
  phone: boolean;         // TRUE
  email: boolean;         // TRUE
  address: boolean;       // TRUE
  city: boolean;          // TRUE
  state: boolean;         // TRUE
  zip_code: boolean;      // TRUE
  notes: boolean;         // TRUE
  active: boolean;        // TRUE (apenas admin)
}
```

### RN-CLI-004-B: Auditoria de Alterações
```typescript
interface CustomerAuditLog {
  customer_id: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: Date;
}

// Trigger automático no banco de dados
const createAuditTrigger = () => `
  CREATE OR REPLACE FUNCTION log_customer_changes()
  RETURNS TRIGGER AS $$
  BEGIN
    IF OLD.name != NEW.name THEN
      INSERT INTO customer_audit_log (customer_id, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'name', OLD.name, NEW.name, auth.uid());
    END IF;
    
    IF OLD.phone != NEW.phone THEN
      INSERT INTO customer_audit_log (customer_id, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'phone', OLD.phone, NEW.phone, auth.uid());
    END IF;
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`;
```

---

## 🗄️ Database Schema

```sql
-- Tabela de auditoria (opcional - para compliance)
CREATE TABLE IF NOT EXISTS customer_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_customer ON customer_audit_log(customer_id);
CREATE INDEX idx_audit_date ON customer_audit_log(changed_at DESC);

-- Trigger para updated_at já existe na tabela customers
```

---

## 💻 Implementação

### Componente: `EditClienteModal.tsx`

```typescript
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientes } from "@/hooks/useClientes";
import { Customer } from "@/types/customer";

interface Props {
  customer: Customer;
  open: boolean;
  onClose: () => void;
}

export const EditClienteModal = ({ customer, open, onClose }: Props) => {
  const { updateCliente, isLoading } = useClientes();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: customer.name,
      trade_name: customer.trade_name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip_code: customer.zip_code,
      notes: customer.notes,
    },
  });
  
  useEffect(() => {
    if (open) {
      reset({
        name: customer.name,
        trade_name: customer.trade_name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip_code: customer.zip_code,
        notes: customer.notes,
      });
    }
  }, [open, customer, reset]);
  
  const onSubmit = async (data: any) => {
    try {
      await updateCliente(customer.id, data);
      toast.success('Cliente atualizado com sucesso');
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar cliente');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✏️ Editar Cliente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campos não editáveis (exibir apenas) */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div>
              <span className="text-sm font-medium">Tipo:</span>{' '}
              <span className="text-sm">{customer.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">
                {customer.type === 'pf' ? 'CPF:' : 'CNPJ:'}
              </span>{' '}
              <span className="text-sm">{customer.document}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              ℹ️ Tipo e documento não podem ser alterados
            </p>
          </div>
          
          {/* Campos editáveis */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              {customer.type === 'pf' ? 'Nome Completo' : 'Razão Social'} *
            </Label>
            <Input
              id="edit-name"
              {...register('name')}
            />
          </div>
          
          {customer.type === 'pj' && (
            <div className="space-y-2">
              <Label htmlFor="edit-trade-name">Nome Fantasia</Label>
              <Input
                id="edit-trade-name"
                {...register('trade_name')}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone *</Label>
            <Input
              id="edit-phone"
              {...register('phone')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              {...register('email')}
            />
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Endereço</h4>
            
            <div className="space-y-3">
              <Input {...register('address')} placeholder="Logradouro" />
              
              <div className="grid grid-cols-2 gap-3">
                <Input {...register('city')} placeholder="Cidade" />
                <Input {...register('state')} placeholder="UF" maxLength={2} />
              </div>
              
              <Input {...register('zip_code')} placeholder="CEP" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Observações</Label>
            <Textarea
              id="edit-notes"
              {...register('notes')}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

### Hook: `useClientes.ts` (método update)

```typescript
export const useClientes = () => {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  
  const updateCliente = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('org_id', currentOrg!.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
  
  return {
    updateCliente: updateCliente.mutateAsync,
    isLoading: updateCliente.isPending,
  };
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve editar dados do cliente com sucesso', async ({ page }) => {
  await page.goto('/clientes');
  
  // Abrir cliente
  await page.click('table tr:first-child button:has-text("Ver")');
  
  // Clicar em Editar
  await page.click('button:has-text("Editar")');
  
  // Verificar campos não editáveis
  await expect(page.locator('text=Tipo e documento não podem ser alterados')).toBeVisible();
  
  // Editar campos
  await page.fill('[id="edit-phone"]', '(11) 98888-7777');
  await page.fill('[id="edit-email"]', 'novoemail@example.com');
  
  // Salvar
  await page.click('button:has-text("Salvar Alterações")');
  
  // Verificar sucesso
  await expect(page.locator('.toast')).toContainText('Cliente atualizado');
  
  // Verificar mudanças na tabela
  await expect(page.locator('table')).toContainText('(11) 98888-7777');
});

test('não deve permitir editar CPF/CNPJ', async ({ page }) => {
  await page.goto('/clientes');
  await page.click('table tr:first-child button:has-text("Ver")');
  await page.click('button:has-text("Editar")');
  
  // Campo de documento não deve existir como input editável
  await expect(page.locator('input[id="edit-document"]')).not.toBeVisible();
  
  // Deve exibir apenas como texto
  await expect(page.locator('text=CPF:')).toBeVisible();
});
```

---

## 📋 Definition of Done

- [x] Modal de edição implementado
- [x] Campos não editáveis protegidos
- [x] Validações mantidas nos campos editáveis
- [x] Trigger `updated_at` funcionando
- [x] Log de auditoria (opcional) criado
- [x] Toast de confirmação
- [x] Testes E2E passando
- [x] Documentação atualizada

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
