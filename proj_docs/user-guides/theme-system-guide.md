# 🎨 Guia do Sistema de Temas

## 📋 Visão Geral

O ERP Retífica Formiguense possui um **sistema de temas personalizáveis por organização**, permitindo que cada empresa customize as cores da interface de acordo com sua identidade visual.

---

## 🎯 Como Funciona

### **1. Temas por Organização**
- Cada organização pode ter seu próprio tema personalizado
- As cores são aplicadas automaticamente ao fazer login
- Suporta modo claro e escuro
- Mudanças são aplicadas em tempo real

### **2. Cores Personalizáveis**

| Cor | Uso | Exemplo |
|-----|-----|---------|
| **Primary** | Cor principal, botões, links | Azul da marca |
| **Secondary** | Cor secundária, backgrounds | Cinza claro |
| **Accent** | Destaques, hover states | Laranja |
| **Success** | Sucesso, confirmações | Verde |
| **Warning** | Avisos, atenção | Amarelo |
| **Error** | Erros, alertas críticos | Vermelho |
| **Info** | Informações, dicas | Azul claro |

---

## 🛠️ Como Configurar um Tema

### **Opção 1: Via Banco de Dados (Atual)**

```sql
-- Inserir tema para uma organização
INSERT INTO organization_themes (
  org_id,
  theme_name,
  primary_color,
  secondary_color,
  accent_color,
  success_color,
  warning_color,
  error_color,
  info_color,
  is_active
) VALUES (
  'SEU_ORG_ID',
  'Tema Personalizado',
  '#1e40af',  -- Primary (Azul)
  '#64748b',  -- Secondary (Cinza)
  '#f97316',  -- Accent (Laranja)
  '#10b981',  -- Success (Verde)
  '#f59e0b',  -- Warning (Amarelo)
  '#ef4444',  -- Error (Vermelho)
  '#3b82f6',  -- Info (Azul claro)
  true
);
```

### **Opção 2: Via Interface (Futuro)**

*Em desenvolvimento: Página de configuração de temas em Configurações > Personalização*

---

## 📊 Estrutura do Banco

### **Tabela: `organization_themes`**

```sql
CREATE TABLE organization_themes (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  theme_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  success_color TEXT NOT NULL,
  warning_color TEXT NOT NULL,
  error_color TEXT NOT NULL,
  info_color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## 🎨 Paletas de Cores Sugeridas

### **Tema 1: Azul Profissional**
```typescript
{
  primary: '#1e40af',    // Azul escuro
  secondary: '#64748b',  // Cinza
  accent: '#f97316',     // Laranja
  success: '#10b981',    // Verde
  warning: '#f59e0b',    // Amarelo
  error: '#ef4444',      // Vermelho
  info: '#3b82f6'        // Azul claro
}
```

### **Tema 2: Verde Moderno**
```typescript
{
  primary: '#059669',    // Verde
  secondary: '#6b7280',  // Cinza
  accent: '#8b5cf6',     // Roxo
  success: '#10b981',    // Verde claro
  warning: '#f59e0b',    // Amarelo
  error: '#ef4444',      // Vermelho
  info: '#06b6d4'        // Ciano
}
```

### **Tema 3: Roxo Criativo**
```typescript
{
  primary: '#7c3aed',    // Roxo
  secondary: '#71717a',  // Cinza
  accent: '#ec4899',     // Rosa
  success: '#10b981',    // Verde
  warning: '#f59e0b',    // Amarelo
  error: '#ef4444',      // Vermelho
  info: '#3b82f6'        // Azul
}
```

---

## 💻 Como Usar no Código

### **1. Importar o Hook**

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MeuComponente() {
  const { currentTheme, isLoading, error } = useTheme();
  
  if (isLoading) return <div>Carregando tema...</div>;
  if (error) return <div>Erro: {error}</div>;
  
  return (
    <div>
      <h1>Tema Atual: {currentTheme?.themeName || 'Padrão'}</h1>
      <p>Cor Principal: {currentTheme?.primaryColor}</p>
    </div>
  );
}
```

### **2. Usar Variáveis CSS**

As cores são aplicadas automaticamente como variáveis CSS:

```css
/* Usar no CSS/Tailwind */
.meu-botao {
  background-color: var(--primary);
  color: white;
}

.meu-alerta {
  background-color: var(--warning);
}
```

```tsx
// Usar inline no React
<div style={{ backgroundColor: 'var(--primary)' }}>
  Conteúdo
</div>
```

### **3. Usar com Tailwind CSS**

O sistema já está integrado com as classes do Tailwind:

```tsx
<Button variant="primary">Botão Principal</Button>
<Badge variant="success">Sucesso</Badge>
<Alert variant="warning">Atenção!</Alert>
```

---

## 🔄 Fluxo de Aplicação do Tema

```
1. Usuário faz login
   ↓
2. OrganizationContext carrega organização
   ↓
3. ThemeContext busca tema da organização
   ↓
4. applyTheme() aplica cores nas variáveis CSS
   ↓
5. Interface atualiza automaticamente
```

---

## 🎯 Onde o Tema é Aplicado

### **Componentes que Usam o Tema:**
- ✅ Botões (Button)
- ✅ Cards (Card)
- ✅ Badges (Badge)
- ✅ Alertas (Alert)
- ✅ Progress bars
- ✅ Tabs
- ✅ Inputs
- ✅ Selects
- ✅ Modais
- ✅ Toasts
- ✅ Gráficos
- ✅ Tabelas

### **Páginas que Usam o Tema:**
- ✅ Dashboard
- ✅ Ordens de Serviço
- ✅ Orçamentos
- ✅ Clientes
- ✅ Funcionários
- ✅ Relatórios
- ✅ Configurações

---

## 🚀 Exemplo Completo

### **1. Criar Tema no Banco**

```sql
-- Tema para Retífica Formiguense
INSERT INTO organization_themes (
  org_id,
  theme_name,
  primary_color,
  secondary_color,
  accent_color,
  success_color,
  warning_color,
  error_color,
  info_color,
  is_active
) VALUES (
  'e6a72c5a-afbf-444b-aace-8d2b37eef5c4', -- ID da organização
  'Retífica Formiguense',
  '#dc2626',  -- Vermelho (cor da marca)
  '#64748b',  -- Cinza
  '#f97316',  -- Laranja
  '#10b981',  -- Verde
  '#f59e0b',  -- Amarelo
  '#ef4444',  -- Vermelho escuro
  '#3b82f6',  -- Azul
  true
);
```

### **2. Verificar Tema Aplicado**

```sql
-- Ver tema ativo da organização
SELECT 
  t.*,
  o.name as organization_name
FROM organization_themes t
JOIN organizations o ON o.id = t.org_id
WHERE t.org_id = 'SEU_ORG_ID'
  AND t.is_active = true;
```

### **3. Atualizar Tema**

```sql
-- Atualizar cores do tema
UPDATE organization_themes
SET 
  primary_color = '#1e40af',
  accent_color = '#8b5cf6',
  updated_at = NOW()
WHERE org_id = 'SEU_ORG_ID'
  AND is_active = true;
```

### **4. Desativar Tema (Volta ao Padrão)**

```sql
-- Desativar tema personalizado
UPDATE organization_themes
SET is_active = false
WHERE org_id = 'SEU_ORG_ID';
```

---

## 🎨 Ferramentas para Escolher Cores

### **Geradores de Paletas:**
- [Coolors.co](https://coolors.co/) - Gerador de paletas
- [Adobe Color](https://color.adobe.com/) - Roda de cores
- [Paletton](https://paletton.com/) - Esquemas de cores
- [Material Design Colors](https://materialui.co/colors) - Paletas Material

### **Verificar Acessibilidade:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) - Contraste de cores
- [Colorable](https://colorable.jxnblk.com/) - Verificador de acessibilidade

---

## 📝 Boas Práticas

### **1. Contraste**
- ✅ Garantir contraste mínimo de 4.5:1 para texto
- ✅ Testar em modo claro e escuro
- ✅ Verificar legibilidade em diferentes dispositivos

### **2. Consistência**
- ✅ Usar cores da paleta consistentemente
- ✅ Não criar muitas variações
- ✅ Manter hierarquia visual

### **3. Acessibilidade**
- ✅ Não depender apenas de cor para informação
- ✅ Usar ícones + cores
- ✅ Testar com daltonismo

### **4. Performance**
- ✅ Tema é carregado uma vez por sessão
- ✅ Mudanças são aplicadas via CSS variables
- ✅ Sem re-renders desnecessários

---

## 🐛 Troubleshooting

### **Tema não está sendo aplicado?**

1. **Verificar se tema existe no banco:**
```sql
SELECT * FROM organization_themes 
WHERE org_id = 'SEU_ORG_ID' AND is_active = true;
```

2. **Verificar console do navegador:**
```javascript
// Deve aparecer:
"Loading organization theme for: ORG_ID"
```

3. **Verificar variáveis CSS:**
```javascript
// No console do navegador:
getComputedStyle(document.documentElement).getPropertyValue('--primary')
```

4. **Limpar cache e recarregar:**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **Cores não estão corretas?**

1. Verificar formato hexadecimal: `#RRGGBB`
2. Não usar nomes de cores: `red` ❌ → `#ef4444` ✅
3. Verificar se `is_active = true`

---

## 🔮 Futuras Melhorias

### **Em Desenvolvimento:**
- [ ] Interface de configuração de temas
- [ ] Preview de temas antes de aplicar
- [ ] Temas pré-definidos (templates)
- [ ] Modo escuro automático
- [ ] Exportar/Importar temas
- [ ] Histórico de temas

---

## 📚 Referências

- **ThemeContext**: `src/contexts/ThemeContext.tsx`
- **Tabela**: `organization_themes`
- **Configurações**: `src/pages/Configuracoes.tsx`
- **Tailwind Config**: `tailwind.config.ts`

---

**Sistema de temas totalmente funcional e pronto para personalização!** 🎨✨
