import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Wrench, 
  Clock, 
  Package, 
  DollarSign,
  Zap,
  ArrowRight,
  Search,
  FileText,
  CreditCard,
  Settings,
  Calculator
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useDashboard } from '@/hooks/useDashboard';
import { useOrganization } from '@/hooks/useOrganization';
import { useAuth } from '@/hooks/useAuth';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';
import { Link } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description?: string;
  icon: string;
  href: string;
  variant: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  permissions: string[];
  count?: number; // Contador dinâmico
}

export function DynamicQuickActions() {
  const { isMobile, isTablet } = useBreakpoint();
  const { quickActions } = useDashboard();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { canAccessPage } = useProfilePermissions();

  // Mapear ícones por string
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Plus, Wrench, Clock, Package, DollarSign, Search, FileText, 
      CreditCard, Settings, Calculator
    };
    return iconMap[iconName] || Plus;
  };

  // Verificar se usuário tem permissão para a ação
  const hasPermission = (action: QuickAction): boolean => {
    // Se não tem permissões específicas definidas, permitir acesso
    if (!action.permissions || action.permissions.length === 0) {
      // Verificar permissão baseada na rota
      return canAccessPage(action.href);
    }
    
    // Se tem permissões específicas, verificar cada uma
    // Por enquanto, usar verificação de rota como padrão
    return canAccessPage(action.href);
  };

  // Filtrar ações ativas e com permissão
  const filteredActions = quickActions
    .filter(action => action.is_active && hasPermission(action))
    .sort((a, b) => a.display_order - b.display_order);

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-1'; // Manter 1 coluna para sidebar, mas mostrar todos os itens
  };

  if (filteredActions.length === 0) {
    return null;
  }


  return (
    <Card className="card-enhanced min-h-0">
      <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Zap className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-primary-foreground`} />
          </div>
          <div>
            <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>Ações Rápidas</span>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-normal`}>
              Acesso direto
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible">
        <div className={`grid ${getGridCols()} gap-2`}>
          {filteredActions.map((action, index) => {
            const Icon = getIconComponent(action.icon);
            const hasCount = action.count && action.count > 0;
            
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  asChild
                  className={`w-full justify-between group transition-all duration-300 ${
                    isMobile ? 'h-12 py-2' : 'h-auto py-3'
                  } ${
                    action.is_featured 
                      ? 'bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary'
                      : 'hover:bg-primary/10 border-primary/20'
                  }`}
                  variant={action.is_featured ? "default" : action.variant as any}
                  size="sm"
                >
                  <Link to={action.href}>
                    <div className="flex items-center gap-2">
                      <div className={`${isMobile ? 'p-1' : 'p-1.5'} rounded-md transition-colors ${
                        action.is_featured 
                          ? 'bg-white/20' 
                          : 'bg-primary/10 group-hover:bg-primary/20'
                      }`}>
                        <Icon className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                      </div>
                      <div className="text-left">
                        <span className={`font-medium block ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {action.title}
                        </span>
                        {!isMobile && (
                          <span className={`text-xs ${
                            action.is_featured ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {action.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasCount && (
                        <Badge 
                          variant="secondary" 
                          className={`${
                            action.is_featured 
                              ? 'bg-white/20 text-primary-foreground hover:bg-white/30' 
                              : 'bg-primary/10 text-primary'
                          } px-2 py-1`}
                        >
                          {action.count}
                        </Badge>
                      )}
                      {action.is_featured && !isMobile && (
                        <Badge className="bg-white/20 text-primary-foreground hover:bg-white/30 px-2 py-1">
                          <ArrowRight className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  </Link>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
