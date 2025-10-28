# US-CLI-006: Inativar Cliente

**ID:** US-CLI-006  
**Épico:** Clientes  
**Sprint:** 3  
**Prioridade:** 🟡 Média  
**Estimativa:** 2 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** gerente da retífica  
**Quero** inativar clientes que não retornam mais  
**Para** manter lista organizada sem perder histórico

---

## 🎯 Objetivo de Negócio

Permitir "soft delete" de clientes, mantendo dados históricos mas removendo da lista ativa.

---

## ✅ Critérios de Aceitação

**AC01:** Botão "Inativar" é exibido no modal de detalhes do cliente  
**AC02:** Apenas gerentes e admins podem inativar clientes  
**AC03:** Modal de confirmação é exibido: "Deseja inativar [Nome]?"  
**AC04:** Sistema verifica se cliente tem OSs ativas (pending ou in_progress)  
**AC05:** Se houver OSs ativas, exibir erro: "Cliente possui OSs ativas"  
**AC06:** Se não houver OSs ativas, permitir inativação  
**AC07:** Cliente inativado desaparece da lista padrão (filtro "Ativos")  
**AC08:** Cliente inativo pode ser reativado (botão "Reativar")  
**AC09:** Histórico de OSs do cliente permanece acessível  
**AC10:** Toast confirma: "Cliente inativado com sucesso"  

---

## 📐 Regras de Negócio

### RN-CLI-006-A: Validação Antes de Inativar
```typescript
const canInactivateCustomer = async (customerId: string): Promise<{
  canInactivate: boolean;
  reason?: string;
}> => {
  // Verificar OSs ativas
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('customer_id', customerId)
    .in('status', ['pending', 'in_progress'])
    .limit(1);
    
  if (activeOrders && activeOrders.length > 0) {
    return {
      canInactivate: false,
      reason: `Cliente possui OSs ativas (ex: ${activeOrders[0].order_number})`,
    };
  }
  
  // Verificar orçamentos pendentes (opcional)
  const { data: pendingBudgets } = await supabase
    .from('detailed_budgets')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .limit(1);
    
  if (pendingBudgets && pendingBudgets.length > 0) {
    return {
      canInactivate: false,
      reason: 'Cliente possui orçamentos pendentes de aprovação',
    };
  }
  
  return { canInactivate: true };
};
```

### RN-CLI-006-B: Soft Delete
```typescript
// NÃO deletar registro, apenas marcar como inativo
const inactivateCustomer = async (customerId: string) => {
  const { error } = await supabase
    .from('customers')
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);
    
  if (error) throw error;
};

const reactivateCustomer = async (customerId: string) => {
  const { error } = await supabase
    .from('customers')
    .update({
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);
    
  if (error) throw error;
};
```

### RN-CLI-006-C: Permissões
```typescript
const canManageCustomerStatus = (userRole: string): boolean => {
  return ['gerente', 'admin'].includes(userRole);
};
```

---

## 💻 Implementação

### Componente: `InactivateCustomerDialog.tsx`

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useClientes } from "@/hooks/useClientes";
import { Customer } from "@/types/customer";

interface Props {
  customer: Customer;
  open: boolean;
  onClose: () => void;
}

export const InactivateCustomerDialog = ({ customer, open, onClose }: Props) => {
  const { inactivateCliente, isLoading } = useClientes();
  
  const handleInactivate = async () => {
    try {
      // Validar se pode inativar
      const validation = await canInactivateCustomer(customer.id);
      
      if (!validation.canInactivate) {
        toast.error(validation.reason);
        return;
      }
      
      // Inativar
      await inactivateCliente(customer.id);
      toast.success('Cliente inativado com sucesso');
      onClose();
    } catch (error) {
      toast.error('Erro ao inativar cliente');
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Inativar Cliente</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Deseja realmente inativar <strong>{customer.name}</strong>?
            </p>
            <p className="text-sm">
              O cliente será removido da lista ativa, mas seu histórico será mantido.
              Você poderá reativar este cliente a qualquer momento.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleInactivate}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Inativando...' : 'Inativar Cliente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
```

### Hook: `useClientes.ts` (métodos de inativação)

```typescript
export const useClientes = () => {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  
  // Validar se pode inativar
  const canInactivateCustomer = async (customerId: string) => {
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('customer_id', customerId)
      .in('status', ['pending', 'in_progress'])
      .limit(1);
      
    if (activeOrders && activeOrders.length > 0) {
      return {
        canInactivate: false,
        reason: `Cliente possui OSs ativas (ex: ${activeOrders[0].order_number})`,
      };
    }
    
    return { canInactivate: true };
  };
  
  // Inativar
  const inactivateCliente = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)
        .eq('org_id', currentOrg!.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
  
  // Reativar
  const reactivateCliente = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .update({
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)
        .eq('org_id', currentOrg!.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
  
  return {
    canInactivateCustomer,
    inactivateCliente: inactivateCliente.mutateAsync,
    reactivateCliente: reactivateCliente.mutateAsync,
    isLoading: inactivateCliente.isPending || reactivateCliente.isPending,
  };
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve inativar cliente sem OSs ativas', async ({ page }) => {
  await page.goto('/clientes');
  
  // Abrir cliente
  await page.click('table tr:first-child button:has-text("Ver")');
  
  // Clicar em Inativar
  await page.click('button:has-text("Inativar")');
  
  // Confirmar
  await page.click('button:has-text("Inativar Cliente")');
  
  // Verificar sucesso
  await expect(page.locator('.toast')).toContainText('Cliente inativado');
  
  // Cliente some da lista (filtro padrão = ativos)
  await expect(page.locator('table')).not.toContainText('João Silva');
});

test('deve bloquear inativação de cliente com OSs ativas', async ({ page }) => {
  await page.goto('/clientes');
  await page.click('table tr:has-text("Maria Santos") button:has-text("Ver")');
  await page.click('button:has-text("Inativar")');
  await page.click('button:has-text("Inativar Cliente")');
  
  // Verificar erro
  await expect(page.locator('.toast')).toContainText('Cliente possui OSs ativas');
});

test('deve reativar cliente inativo', async ({ page }) => {
  await page.goto('/clientes');
  
  // Filtrar inativos
  await page.click('[data-testid="status-filter"]');
  await page.click('text=Inativos');
  
  // Abrir cliente inativo
  await page.click('table tr:first-child button:has-text("Ver")');
  
  // Reativar
  await page.click('button:has-text("Reativar")');
  
  // Verificar sucesso
  await expect(page.locator('.toast')).toContainText('Cliente reativado');
});

test('apenas gerente pode inativar', async ({ page, context }) => {
  // Login como atendente
  await page.goto('/login');
  await page.fill('[name="email"]', 'atendente@retifica.com');
  await page.fill('[name="password"]', 'senha123');
  await page.click('[type="submit"]');
  
  await page.goto('/clientes');
  await page.click('table tr:first-child button:has-text("Ver")');
  
  // Botão Inativar não deve aparecer
  await expect(page.locator('button:has-text("Inativar")')).not.toBeVisible();
});
```

---

## 📋 Definition of Done

- [x] Validação de OSs ativas implementada
- [x] Soft delete (campo `active`)
- [x] Permissões por role
- [x] Modal de confirmação
- [x] Botão de reativação
- [x] Toast de feedback
- [x] Histórico preservado
- [x] Testes E2E passando
- [x] Documentação atualizada

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
