# Guia de Configuração de Desenvolvimento

## Pré-requisitos

### Ferramentas Necessárias

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** v9+ (incluído com Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase CLI** (`npm install -g supabase`)
- **VS Code** (recomendado) com extensões:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter

### Configuração do Sistema

#### Windows
```powershell
# Habilitar execução de scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Instalar Node.js via Chocolatey (opcional)
choco install nodejs
```

#### macOS
```bash
# Instalar Node.js via Homebrew
brew install node

# Instalar Supabase CLI
brew install supabase/tap/supabase
```

#### Linux (Ubuntu/Debian)
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Supabase CLI
curl -fsSL https://github.com/supabase/cli/releases/download/v1.0.0/supabase_1.0.0_linux_amd64.deb -o supabase.deb
sudo dpkg -i supabase.deb
```

## Clonagem e Configuração

### 1. Clonar o Repositório

```bash
# Via HTTPS
git clone https://github.com/your-org/erp-retifica.git

# Via SSH (recomendado para desenvolvimento)
git clone git@github.com:your-org/erp-retifica.git

cd erp-retifica
```

### 2. Instalar Dependências

```bash
# Instalar dependências do projeto
npm install

# Verificar instalação
npm run dev --version
```

### 3. Configuração do Ambiente

#### Arquivo `.env`

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0

# Optional: External APIs
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
VITE_SENTRY_DSN=your-sentry-dsn
```

#### Obtendo Credenciais do Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto ou crie um novo
3. Vá em **Settings > API**
4. Copie a **URL** e **anon public key**

### 4. Configuração do Banco de Dados

#### Setup Local (Desenvolvimento)

```bash
# Inicializar Supabase localmente
supabase init

# Iniciar containers Docker
supabase start

# Aplicar migrações
supabase db push

# Verificar status
supabase status
```

#### Setup com Projeto Remoto

```bash
# Linkar com projeto existente
supabase link --project-ref your-project-ref

# Puxar schema remoto
supabase db pull

# Gerar tipos TypeScript
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Executando o Projeto

### Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# O projeto estará disponível em:
# http://localhost:5173
```

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linter ESLint
npm run type-check   # Verificação de tipos

# Supabase
npm run db:start     # Iniciar banco local
npm run db:stop      # Parar banco local
npm run db:reset     # Reset banco local
npm run db:types     # Gerar tipos TS
```

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn)
│   ├── fiscal/         # Componentes do módulo fiscal
│   ├── financial/      # Componentes financeiros
│   └── workflow/       # Componentes de workflow
├── pages/              # Páginas da aplicação
├── hooks/              # Custom hooks
├── contexts/           # Contextos React
├── lib/               # Utilitários e configurações
├── integrations/      # Integrações (Supabase, etc.)
└── assets/           # Assets estáticos

supabase/
├── functions/         # Edge Functions
├── migrations/        # Migrações do banco
└── config.toml       # Configuração local
```

## Padrões de Desenvolvimento

### Naming Conventions

```typescript
// Componentes - PascalCase
const UserProfile = () => {};

// Hooks - camelCase com prefixo 'use'
const useUserData = () => {};

// Constantes - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Funções - camelCase
const calculateTotal = () => {};

// Tipos/Interfaces - PascalCase
interface UserData {
  id: string;
  name: string;
}
```

### Estrutura de Componentes

```typescript
// Exemplo de componente bem estruturado
import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

export const Component: React.FC<ComponentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('base-classes', className)} {...props}>
      {children}
    </div>
  );
};
```

### Custom Hooks

```typescript
// Exemplo de custom hook
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUserData = (userId?: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { data, loading, error };
};
```

## Configuração do VS Code

### Settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Extensões Recomendadas

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Permissão npm

```bash
# Configurar registry npm
npm config set registry https://registry.npmjs.org/

# Limpar cache
npm cache clean --force
```

#### 2. Erro de Types do Supabase

```bash
# Regenerar tipos
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Verificar conexão com DB
supabase status
```

#### 3. Erro de Build

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar versão do Node
node --version  # Deve ser v18+
```

#### 4. Erro de CORS

```typescript
// Verificar configuração do Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);
```

### Logs e Debug

```bash
# Logs do Supabase local
supabase logs

# Logs específicos de uma função
supabase functions logs function-name --follow

# Debug do Vite
DEBUG=vite:* npm run dev
```

## Workflows de Desenvolvimento

### Feature Development

```bash
# 1. Criar branch
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e testar
npm run dev
npm run lint
npm run type-check

# 3. Commit e push
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade

# 4. Criar Pull Request
```

### Database Changes

```bash
# 1. Criar migração
supabase migration new add_new_table

# 2. Editar arquivo de migração
# supabase/migrations/TIMESTAMP_add_new_table.sql

# 3. Aplicar migração
supabase db push

# 4. Gerar novos tipos
npm run db:types
```

## Performance e Otimização

### Bundle Analysis

```bash
# Instalar bundler analyzer
npm install --save-dev vite-bundle-analyzer

# Analisar bundle
npm run build
npx vite-bundle-analyzer dist/stats.html
```

### Code Splitting

```typescript
// Lazy loading de páginas
const LazyPage = lazy(() => import('./pages/LazyPage'));

// Preload de componentes críticos
const CriticalComponent = lazy(() => 
  import('./components/CriticalComponent').then(module => ({
    default: module.CriticalComponent
  }))
);
```

## Deploy e CI/CD

### Build de Produção

```bash
# Gerar build otimizado
npm run build

# Testar build localmente
npm run preview
```

### Variáveis de Ambiente

```bash
# Produção
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_APP_ENV=production
```

## Recursos Úteis

### Documentação

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Ferramentas

- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Supabase Dashboard](https://app.supabase.com/)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)