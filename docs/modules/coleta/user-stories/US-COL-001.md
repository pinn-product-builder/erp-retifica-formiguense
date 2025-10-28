# US-COL-001: Acessar Formulário de Coleta

**ID:** US-COL-001  
**Épico:** Coleta  
**Sprint:** 1  
**Prioridade:** 🔴 Alta  
**Estimativa:** 2 pontos  
**Status:** ✅ Done

---

## 📋 User Story

**Como** atendente da retífica  
**Quero** acessar formulário de registro de coleta  
**Para** iniciar o processo de recebimento de motor do cliente

---

## 🎯 Objetivo de Negócio

Fornecer ponto de entrada rápido e intuitivo para iniciar o processo de coleta, primeira etapa do fluxo operacional.

---

## ✅ Critérios de Aceitação

**AC01:** Menu lateral exibe item "Coleta" na seção "Operações"  
**AC02:** Clicar em "Coleta" redireciona para `/coleta`  
**AC03:** Página exibe título "Registrar Coleta de Motor"  
**AC04:** Formulário é exibido em etapas numeradas (1-4)  
**AC05:** Botão "Finalizar Coleta" fica desabilitado até preenchimento mínimo  
**AC06:** Breadcrumb exibe: Dashboard > Coleta  
**AC07:** Página é responsiva (mobile, tablet, desktop)

---

## 📐 Regras de Negócio

### RN-COL-001-A: Acesso à Página
```typescript
interface AccessControl {
  allowedRoles: UserRole[];      // ['atendente', 'consultor', 'gerente', 'admin']
  requiresAuth: boolean;         // TRUE
  requiresOrganization: boolean; // TRUE - deve estar vinculado a uma org
}
```

### RN-COL-001-B: Campos Obrigatórios Mínimos
```typescript
interface MinimumRequiredFields {
  customer: boolean;         // TRUE - Cliente obrigatório
  consultant: boolean;       // TRUE - Consultor obrigatório
  driverName: boolean;       // TRUE - Nome do motorista obrigatório
  driverPhone: boolean;      // TRUE - Telefone do motorista obrigatório
  vehiclePlate: boolean;     // TRUE - Placa do veículo obrigatória
}
```

---

## 🗄️ Database Schema

**Nenhuma mudança necessária** - Usa tabela `orders` existente.

**Campos Relevantes:**
```sql
orders (
  id,
  org_id,
  customer_id,
  consultant_id,
  collection_driver_name,
  collection_driver_phone,
  vehicle_plate,
  collection_date,
  created_by
)
```

---

## 💻 Implementação

### Componente: `ColetaPage.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColetaForm } from "@/components/coleta/ColetaForm";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const ColetaPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
        <BreadcrumbItem>Coleta</BreadcrumbItem>
      </Breadcrumb>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registrar Coleta de Motor</h1>
          <p className="text-muted-foreground mt-2">
            Preencha os dados de coleta para criar uma nova ordem de serviço
          </p>
        </div>
      </div>
      
      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Coleta</CardTitle>
        </CardHeader>
        <CardContent>
          <ColetaForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ColetaPage;
```

### Hook: `useColetaAccess.ts`

```typescript
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useNavigate } from "react-router-dom";

export const useColetaAccess = () => {
  const { user, profile } = useAuth();
  const { currentOrg } = useOrganization();
  const navigate = useNavigate();
  
  const checkAccess = () => {
    // Verificar autenticação
    if (!user) {
      navigate('/login');
      return false;
    }
    
    // Verificar organização
    if (!currentOrg) {
      toast.error('Você precisa estar vinculado a uma organização');
      navigate('/');
      return false;
    }
    
    // Verificar role
    const allowedRoles = ['atendente', 'consultor', 'gerente', 'admin'];
    if (!allowedRoles.includes(profile?.role)) {
      toast.error('Você não tem permissão para acessar esta página');
      navigate('/');
      return false;
    }
    
    return true;
  };
  
  return { checkAccess };
};
```

---

## 🎨 Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  🏠 Dashboard > Coleta                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  REGISTRAR COLETA DE MOTOR                             │
│  Preencha os dados de coleta para criar uma nova       │
│  ordem de serviço                                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Dados da Coleta                                │   │
│  ├─────────────────────────────────────────────────┤   │
│  │                                                 │   │
│  │  1️⃣ CLIENTE *                                   │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │ 🔍 Buscar cliente...                    │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │  ou [+ Cadastro Rápido]                        │   │
│  │                                                 │   │
│  │  2️⃣ CONSULTOR RESPONSÁVEL *                     │   │
│  │  [ Selecione o consultor... ▼ ]                │   │
│  │                                                 │   │
│  │  3️⃣ MOTORISTA                                   │   │
│  │  Nome: *      [____________________]            │   │
│  │  Telefone: *  [(__)_____-____]                 │   │
│  │  Documento:   [____________________]            │   │
│  │                                                 │   │
│  │  4️⃣ VEÍCULO                                     │   │
│  │  Placa: *     [ABC-1234]                       │   │
│  │  Modelo:      [____________________]            │   │
│  │  Ano:         [____] Cor: [____]               │   │
│  │  KM:          [________] km                     │   │
│  │                                                 │   │
│  │  ℹ️ Campos marcados com * são obrigatórios      │   │
│  │                                                 │   │
│  │  [Cancelar]  [Finalizar Coleta →] (desabilitado)│  │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Cenários de Teste

### Teste E2E: Acesso à Página

```typescript
test('deve exibir formulário de coleta ao acessar /coleta', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'atendente@retiforma.com');
  await page.fill('[name="password"]', 'senha123');
  await page.click('[type="submit"]');
  
  // Acessar coleta
  await page.click('text=Coleta');
  
  // Verificações
  await expect(page).toHaveURL('/coleta');
  await expect(page.locator('h1')).toContainText('Registrar Coleta');
  
  // Verificar breadcrumb
  await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Dashboard');
  await expect(page.locator('nav[aria-label="breadcrumb"]')).toContainText('Coleta');
  
  // Verificar etapas
  await expect(page.locator('text=1️⃣ CLIENTE')).toBeVisible();
  await expect(page.locator('text=2️⃣ CONSULTOR')).toBeVisible();
  await expect(page.locator('text=3️⃣ MOTORISTA')).toBeVisible();
  await expect(page.locator('text=4️⃣ VEÍCULO')).toBeVisible();
  
  // Botão desabilitado inicialmente
  await expect(page.locator('button:has-text("Finalizar Coleta")')).toBeDisabled();
});

test('deve negar acesso a usuário não autenticado', async ({ page }) => {
  await page.goto('/coleta');
  
  // Deve redirecionar para login
  await expect(page).toHaveURL('/login');
});

test('deve negar acesso a usuário sem organização', async ({ page }) => {
  // Login como usuário sem org
  await page.goto('/login');
  await page.fill('[name="email"]', 'sem-org@example.com');
  await page.fill('[name="password"]', 'senha123');
  await page.click('[type="submit"]');
  
  // Tentar acessar coleta
  await page.goto('/coleta');
  
  // Verificar toast de erro
  await expect(page.locator('.toast')).toContainText('vinculado a uma organização');
  
  // Redirecionar para home
  await expect(page).toHaveURL('/');
});
```

---

## 📋 Definition of Done

- [x] Página `/coleta` criada
- [x] Breadcrumb implementado
- [x] Formulário dividido em 4 etapas visuais
- [x] Validação de acesso por role
- [x] Validação de organização ativa
- [x] Botão "Finalizar" desabilitado até dados mínimos
- [x] Responsividade testada
- [x] Testes E2E passando
- [x] Code review aprovado
- [x] Documentação atualizada

---

## 🔗 Dependências

**Bloqueia:**
- US-COL-002 (Cadastro Rápido)
- US-COL-003 (Seleção de Consultor)
- US-COL-004 (Dados do Motorista)
- US-COL-005 (Finalizar Coleta)

**Depende de:**
- Sistema de autenticação (auth)
- Tabela `organizations`
- Tabela `organization_users`

---

**Última atualização:** 2025-10-28  
**Versão:** 1.0
