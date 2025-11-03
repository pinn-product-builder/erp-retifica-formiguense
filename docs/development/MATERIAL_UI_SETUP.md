# Material UI - Guia de Integração

## 📦 Instalação

O Material UI foi instalado e configurado no projeto com as seguintes dependências:

- `@mui/material` - Componentes principais
- `@mui/icons-material` - Ícones do Material Design
- `@emotion/react` - Runtime do Emotion (CSS-in-JS)
- `@emotion/styled` - Styled components do Emotion

## 🎨 Configuração

### Tema Configurado

O tema Material UI está sincronizado com o sistema de temas existente (`next-themes`):

- **Localização**: `src/config/muiTheme.ts`
- **Hook personalizado**: `useMuiTheme()` - retorna o tema MUI sincronizado com o tema atual
- **Suporte a dark mode**: Automático baseado no tema do sistema

### Integração no App

O `ThemeProvider` do Material UI está configurado em `src/App.tsx`:

```tsx
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useMuiTheme } from '@/config/muiTheme';

// O tema é aplicado via MuiThemeWrapper
```

## 🚀 Como Usar

### Importar Componentes

```tsx
import { Button, Card, CardContent, TextField } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
```

### Exemplo Básico

```tsx
import { Button, Card, CardContent, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export function MeuComponente() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">Título</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Sincronização com Tema

O tema MUI automaticamente:
- Detecta se o modo é `light` ou `dark`
- Ajusta cores baseadas no tema do sistema
- Mantém consistência visual com shadcn/ui

## 🎯 Componentes Principais

### Disponíveis

- `Button` - Botões estilizados
- `Card`, `CardContent`, `CardHeader` - Cards
- `TextField` - Campos de texto
- `Typography` - Textos tipográficos
- `Chip` - Badges/tags
- `Alert` - Alertas e notificações
- `CircularProgress`, `LinearProgress` - Indicadores de progresso
- `Dialog`, `DialogContent`, `DialogTitle` - Modais
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` - Tabelas
- E muitos outros...

### Ícones

```tsx
import { Add, Delete, Edit, Save } from '@mui/icons-material';
```

## 🔄 Compatibilidade

### Com shadcn/ui

Você pode usar Material UI e shadcn/ui juntos no mesmo projeto:

- **shadcn/ui**: Para componentes customizáveis e leves
- **Material UI**: Para componentes prontos e robustos

### Exemplo Combinado

```tsx
import { Button } from '@/components/ui/button'; // shadcn/ui
import { Card } from '@mui/material'; // Material UI

export function ComponenteHibrido() {
  return (
    <Card>
      <CardContent>
        <Button>Botão shadcn/ui</Button>
      </CardContent>
    </Card>
  );
}
```

## 📝 Notas Importantes

1. **CssBaseline**: Já está configurado no `App.tsx` para resetar estilos básicos
2. **Tema Dinâmico**: O tema muda automaticamente com o dark/light mode
3. **TypeScript**: Todos os componentes têm tipos completos
4. **Performance**: Os componentes são otimizados e tree-shakeable

## 📚 Recursos

- [Documentação Oficial Material UI](https://mui.com/)
- [Ícones Material](https://mui.com/material-ui/material-icons/)
- [Tema Customizado](https://mui.com/material-ui/customization/theming/)

## 🎨 Customização

Para customizar o tema, edite `src/config/muiTheme.ts`:

```tsx
const themeOptions: ThemeOptions = {
  palette: {
    // Suas cores personalizadas
  },
  typography: {
    // Suas fontes personalizadas
  },
  components: {
    // Customizações de componentes específicos
  }
};
```

