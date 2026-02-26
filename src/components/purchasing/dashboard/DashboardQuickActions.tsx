import { FileText, ShoppingCart, Package, Store, ClipboardCheck, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickActionButtonProps {
  icon: React.ElementType;
  label:    string;
  onClick:  () => void;
}

function QuickActionButton({ icon: Icon, label, onClick }: QuickActionButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="h-16 sm:h-20 flex-col gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-[10px] sm:text-xs font-medium leading-tight text-center">{label}</span>
    </Button>
  );
}

interface DashboardQuickActionsProps {
  onNavigate: (route: string) => void;
}

export function DashboardQuickActions({ onNavigate }: DashboardQuickActionsProps) {
  const actions: QuickActionButtonProps[] = [
    { icon: FileText,      label: 'Nova Cotação',      onClick: () => onNavigate('/cotacoes')      },
    { icon: ShoppingCart,  label: 'Novo Pedido',       onClick: () => onNavigate('/pedidos-compra') },
    { icon: Package,       label: 'Receber Material',  onClick: () => onNavigate('/recebimentos')  },
    { icon: Store,         label: 'Fornecedores',      onClick: () => onNavigate('/fornecedores')  },
    { icon: ClipboardCheck,label: 'Condicionais',      onClick: () => onNavigate('/condicionais')  },
    { icon: BarChart3,     label: 'Relatórios',        onClick: () => onNavigate('/relatorios-compras') },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <CardTitle className="text-sm sm:text-base font-semibold">Ações Rápidas</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Acesso direto às principais funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {actions.map((a) => (
            <QuickActionButton key={a.label} {...a} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
