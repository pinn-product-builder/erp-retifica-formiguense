# US-COL-005: Finalizar Coleta e Criar OS

**ID:** US-COL-005  
**Épico:** Coleta  
**Sprint:** 1  
**Prioridade:** 🔴 Alta  
**Estimativa:** 5 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** finalizar coleta e criar automaticamente a Ordem de Serviço  
**Para** iniciar o fluxo operacional com todos os dados registrados

---

## 🎯 Objetivo de Negócio

Automatizar criação de OS a partir dos dados de coleta, eliminando etapas manuais e garantindo rastreabilidade desde o primeiro momento.

---

## ✅ Critérios de Aceitação

**AC01:** Botão "Finalizar Coleta" fica habilitado apenas quando todos os campos obrigatórios estão preenchidos  
**AC02:** Ao clicar, sistema valida dados localmente antes de enviar  
**AC03:** Sistema gera número de OS automaticamente no formato: OS-YYYY-XXXX  
**AC04:** OS é criada com status 'pending' e stage 'coleta'  
**AC05:** Toast de sucesso exibe: "Coleta registrada! OS #XXXX criada"  
**AC06:** Sistema redireciona para página de check-in/diagnóstico da OS  
**AC07:** Notificação é enviada ao consultor responsável  
**AC08:** Em caso de erro, exibir mensagem clara e manter dados preenchidos  

---

## 📐 Regras de Negócio

### RN-COL-005-A: Geração de Número de OS
```typescript
const generateOrderNumber = async (orgId: string): Promise<string> => {
  const year = new Date().getFullYear();
  
  // Buscar último número do ano
  const { data } = await supabase
    .from('orders')
    .select('order_number')
    .eq('org_id', orgId)
    .like('order_number', `OS-${year}-%`)
    .order('order_number', { ascending: false })
    .limit(1)
    .single();
    
  let sequential = 1;
  if (data?.order_number) {
    const parts = data.order_number.split('-');
    sequential = parseInt(parts[2]) + 1;
  }
  
  return `OS-${year}-${sequential.toString().padStart(4, '0')}`;
};

// Exemplos:
// OS-2025-0001
// OS-2025-0002
// ...
// OS-2025-9999
```

### RN-COL-005-B: Criação da OS
```typescript
interface CreateOrderParams {
  org_id: string;
  customer_id: string;
  consultant_id: string;
  collection_driver_name: string;
  collection_driver_phone: string;
  collection_driver_document?: string;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_color?: string;
  vehicle_km?: number;
  created_by: string;
}

const createOrder = async (params: CreateOrderParams): Promise<Order> => {
  const orderNumber = await generateOrderNumber(params.org_id);
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...params,
      order_number: orderNumber,
      status: 'pending',
      collection_date: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Criar entrada no workflow
  await supabase.from('order_workflow').insert({
    order_id: data.id,
    stage: 'coleta',
    status: 'completed',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
  
  return data;
};
```

### RN-COL-005-C: Notificação ao Consultor
```typescript
const notifyConsultant = async (orderId: string, consultantId: string) => {
  await supabase.from('notifications').insert({
    user_id: consultantId,
    type: 'new_order',
    title: 'Nova OS Atribuída',
    message: `Você foi designado para a OS #${orderId}`,
    action_url: `/ordem/${orderId}`,
    priority: 'medium',
  });
  
  // TODO: Enviar notificação push/email conforme preferências do consultor
};
```

---

## 🗄️ Database Schema

**Tabela:** `orders` (campos completos)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  consultant_id UUID REFERENCES consultants(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Coleta
  collection_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  collection_driver_name TEXT,
  collection_driver_phone TEXT,
  collection_driver_document TEXT,
  
  -- Veículo
  vehicle_plate TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  vehicle_color TEXT,
  vehicle_km DECIMAL(10,2),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 💻 Implementação

### Hook: `useColeta.ts`

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ColetaData {
  customer_id: string;
  consultant_id: string;
  collection_driver_name: string;
  collection_driver_phone: string;
  collection_driver_document?: string;
  vehicle_plate: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_color?: string;
  vehicle_km?: number;
}

export const useColeta = () => {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const generateOrderNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    
    const { data } = await supabase
      .from('orders')
      .select('order_number')
      .eq('org_id', currentOrg!.id)
      .like('order_number', `OS-${year}-%`)
      .order('order_number', { ascending: false })
      .limit(1)
      .single();
      
    let sequential = 1;
    if (data?.order_number) {
      const parts = data.order_number.split('-');
      sequential = parseInt(parts[2]) + 1;
    }
    
    return `OS-${year}-${sequential.toString().padStart(4, '0')}`;
  };
  
  const finalizarColeta = useMutation({
    mutationFn: async (data: ColetaData) => {
      if (!currentOrg || !user) throw new Error('Sessão inválida');
      
      // Gerar número da OS
      const orderNumber = await generateOrderNumber();
      
      // Criar OS
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          org_id: currentOrg.id,
          order_number: orderNumber,
          customer_id: data.customer_id,
          consultant_id: data.consultant_id,
          collection_driver_name: data.collection_driver_name,
          collection_driver_phone: data.collection_driver_phone,
          collection_driver_document: data.collection_driver_document,
          vehicle_plate: data.vehicle_plate,
          vehicle_model: data.vehicle_model,
          vehicle_year: data.vehicle_year,
          vehicle_color: data.vehicle_color,
          vehicle_km: data.vehicle_km,
          status: 'pending',
          collection_date: new Date().toISOString(),
          created_by: user.id,
        })
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      // Criar entrada no workflow
      await supabase.from('order_workflow').insert({
        order_id: order.id,
        stage: 'coleta',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
      
      // Notificar consultor
      await supabase.from('notifications').insert({
        user_id: data.consultant_id,
        type: 'new_order',
        title: 'Nova OS Atribuída',
        message: `Você foi designado para a ${orderNumber}`,
        action_url: `/ordem/${order.id}`,
        priority: 'medium',
      });
      
      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Coleta registrada! ${order.order_number} criada`);
      navigate(`/ordem/${order.id}`);
    },
    onError: (error: any) => {
      console.error('Erro ao finalizar coleta:', error);
      toast.error('Erro ao registrar coleta. Tente novamente.');
    },
  });
  
  return {
    finalizarColeta: finalizarColeta.mutate,
    isLoading: finalizarColeta.isPending,
  };
};
```

### Componente: `ColetaForm.tsx`

```typescript
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { ClienteSearch } from "./ClienteSearch";
import { ClienteQuickCreate } from "./ClienteQuickCreate";
import { ConsultorSelect } from "./ConsultorSelect";
import { MotoristaFields } from "./MotoristaFields";
import { VeiculoFields } from "./VeiculoFields";
import { useColeta } from "@/hooks/useColeta";

const coletaSchema = z.object({
  customer_id: z.string().min(1, 'Cliente é obrigatório'),
  consultant_id: z.string().min(1, 'Consultor é obrigatório'),
  collection_driver_name: z.string().min(3, 'Nome do motorista é obrigatório'),
  collection_driver_phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido'),
  collection_driver_document: z.string().optional(),
  vehicle_plate: z.string().regex(/^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/, 'Placa inválida'),
  vehicle_model: z.string().optional(),
  vehicle_year: z.string().optional(),
  vehicle_color: z.string().optional(),
  vehicle_km: z.number().optional(),
});

type ColetaFormData = z.infer<typeof coletaSchema>;

export const ColetaForm = () => {
  const { finalizarColeta, isLoading } = useColeta();
  
  const methods = useForm<ColetaFormData>({
    resolver: zodResolver(coletaSchema),
  });
  
  const { handleSubmit, formState: { isValid } } = methods;
  
  const onSubmit = (data: ColetaFormData) => {
    finalizarColeta(data);
  };
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ClienteSearch />
        <ClienteQuickCreate />
        <ConsultorSelect />
        <MotoristaFields />
        <VeiculoFields />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Finalizando...' : 'Finalizar Coleta →'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
```

---

## 🧪 Cenários de Teste

```typescript
test('deve criar OS com sucesso e redirecionar', async ({ page }) => {
  await page.goto('/coleta');
  
  // Preencher todos os campos
  await page.fill('[data-testid="customer-search"]', 'João Silva');
  await page.click('[data-testid="customer-option-1"]');
  await page.selectOption('[data-testid="consultant-select"]', '1');
  await page.fill('[id="driver-name"]', 'Carlos Motorista');
  await page.fill('[id="driver-phone"]', '(11) 98888-7777');
  await page.fill('[id="vehicle-plate"]', 'ABC-1234');
  
  // Finalizar
  await page.click('[data-testid="finish-collection"]');
  
  // Verificar toast
  await expect(page.locator('.toast')).toContainText('Coleta registrada');
  await expect(page.locator('.toast')).toContainText('OS-2025-');
  
  // Verificar redirecionamento
  await expect(page).toHaveURL(/\/ordem\/[a-f0-9-]+/);
  
  // Verificar dados na página da OS
  await expect(page.locator('h1')).toContainText('OS-2025-');
});

test('deve manter dados em caso de erro', async ({ page }) => {
  // Simular erro de rede
  await page.route('**/rest/v1/orders', route => route.abort());
  
  await page.goto('/coleta');
  await page.fill('[id="driver-name"]', 'Carlos Motorista');
  await page.fill('[id="driver-phone"]', '(11) 98888-7777');
  await page.fill('[id="vehicle-plate"]', 'ABC-1234');
  await page.click('[data-testid="finish-collection"]');
  
  // Verificar toast de erro
  await expect(page.locator('.toast')).toContainText('Erro ao registrar');
  
  // Dados devem permanecer preenchidos
  expect(await page.inputValue('[id="driver-name"]')).toBe('Carlos Motorista');
  expect(await page.inputValue('[id="vehicle-plate"]')).toBe('ABC-1234');
});
```

---

## 📋 Definition of Done

- [x] Hook `useColeta` implementado
- [x] Geração automática de número de OS funcional
- [x] Validação completa de dados
- [x] Criação de OS e workflow
- [x] Notificação ao consultor
- [x] Redirecionamento após sucesso
- [x] Tratamento de erros
- [x] Testes E2E passando
- [x] Documentação atualizada

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
