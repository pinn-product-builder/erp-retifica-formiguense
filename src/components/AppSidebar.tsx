
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Truck, 
  ClipboardCheck, 
  Kanban, 
  DollarSign, 
  Building2, 
  UserCheck, 
  Users, 
  Package, 
  FileText, 
  Settings,
  Receipt,
  CreditCard,
  TrendingUp,
  Calculator,
  PiggyBank,
  Gavel,
  LogOut,
  Calendar,
  ShoppingCart,
  Clock,
  Wrench,
  Shield,
  ClipboardList,
  Store,
  ClipboardCopy,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfilePermissions } from "@/hooks/useProfilePermissions";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";

// Dashboard & Visão Geral
const dashboardItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: FileText,
  },
];

// Operações & Serviços
const operationsItems = [
  {
    title: "Coleta de Motor",
    url: "/coleta",
    icon: Truck,
  },
  {
    title: "Check-in Técnico",
    url: "/checkin",
    icon: ClipboardCheck,
  },
  {
    title: "Motores",
    url: "/motores",
    icon: Settings,
  },
  {
    title: "Ordens de Serviço",
    url: "/ordens-servico",
    icon: Wrench,
  },
  {
    title: "Diagnósticos",
    url: "/diagnosticos",
    icon: ClipboardList,
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: DollarSign,
  },
  {
    title: "Workflow Kanban",
    url: "/workflow",
    icon: Kanban,
  },

  {
    title: "PCP - Produção",
    url: "/pcp",
    icon: Calendar,
  },
  {
    title: "Configurações",
    url: "/configuracoes/operacoes",
    icon: Settings,
  },
];

// Gestão de Pessoas
const peopleItems = [
  {
    title: "Clientes",
    url: "/clientes",
    icon: Building2,
  },
  {
    title: "Consultores",
    url: "/consultores",
    icon: UserCheck,
  },
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: Users,
  },
  {
    title: "Gestão RH",
    url: "/gestao-funcionarios",
    icon: Clock,
  },
];

// Estoque & Inventário
const inventoryItems = [
  {
    title: "Estoque/Peças",
    url: "/estoque",
    icon: Package,
  },
  {
    title: "Fornecedores",
    url: "/fornecedores",
    icon: Store,
  },
  {
    title: "Cotações",
    url: "/cotacoes",
    icon: ClipboardCopy,
  },
  {
    title: "Pedidos de Compra",
    url: "/pedidos-compra",
    icon: ClipboardList,
  },
  {
    title: "Compras",
    url: "/compras",
    icon: ShoppingCart,
  },
];

// Financeiro
const financialItems = [
  {
    title: "Dashboard Financeiro",
    url: "/financeiro",
    icon: TrendingUp,
  },
  {
    title: "Contas a Receber",
    url: "/contas-receber",
    icon: Receipt,
  },
  {
    title: "Contas a Pagar",
    url: "/contas-pagar",
    icon: CreditCard,
  },
  {
    title: "Fluxo de Caixa",
    url: "/fluxo-caixa",
    icon: PiggyBank,
  },
  {
    title: "DRE Mensal",
    url: "/dre",
    icon: Calculator,
  },
];

// Fiscal
const fiscalItems = [
  {
    title: "Módulo Fiscal",
    url: "/modulo-fiscal",
    icon: Gavel,
  },
];

// Administração
const adminItems = [
  {
    title: "Gestão de Usuários",
    url: "/gestao-usuarios",
    icon: Users,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

// Super Admin (apenas para super administradores)
const superAdminItems = [
  {
    title: "Super Admin",
    url: "/super-admin",
    icon: Shield,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { isMobile } = useBreakpoint();
  const { user, signOut } = useAuth();
  const permissions = usePermissions();
  const profilePermissions = useProfilePermissions();
  const { isSuperAdmin } = useSuperAdmin();
  const isCollapsed = state === "collapsed";

  // Função para renderizar itens da sidebar com verificação de permissões
  const renderSidebarItem = (item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }) => {
    // Verificar se pode acessar a página
    if (!profilePermissions.canAccessPage(item.url)) {
      return null;
    }

    const Icon = item.icon;
    const isActive = location.pathname === item.url;

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive}>
          <NavLink to={item.url} className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // Função para renderizar grupo de itens
  const renderSidebarGroup = (items: Array<{ title: string; url: string; icon: React.ComponentType<{ className?: string }> }>, title: string) => {
    const visibleItems = items.filter(item => profilePermissions.canAccessPage(item.url));
    
    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <SidebarGroup key={title}>
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {visibleItems.map(renderSidebarItem)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center gap-3 px-3 ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-primary rounded-lg flex items-center justify-center`}>
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-primary-foreground`}>
              FM
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <h2 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-sidebar-foreground truncate`}>
                Favarini Motores
              </h2>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-sidebar-foreground/70 truncate`}>
                Sistema de Gestão
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard & Visão Geral */}
        {renderSidebarGroup(dashboardItems, "Dashboard & Visão Geral")}

        {/* Operações & Serviços */}
        {renderSidebarGroup(operationsItems, "Operações & Serviços")}

        {/* Gestão de Pessoas */}
        {renderSidebarGroup(peopleItems, "Gestão de Pessoas")}

        {/* Estoque & Compras */}
        {renderSidebarGroup(inventoryItems, "Estoque & Compras")}

        {/* Financeiro */}
        {renderSidebarGroup(financialItems, "Financeiro")}

        {/* Fiscal */}
        {renderSidebarGroup(fiscalItems, "Fiscal")}

        {/* Administração */}
        {renderSidebarGroup(adminItems, "Administração")}

        {/* Super Admin (apenas para super administradores) */}
        {isSuperAdmin && renderSidebarGroup(superAdminItems, "Super Admin")}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2">
              <div className="text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
              
              {/* Informações do perfil */}
              {profilePermissions.hasUserProfile && !isCollapsed && (
                <div className="text-xs bg-muted rounded-lg p-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: profilePermissions.profileSectorColor || '#3B82F6' }}
                    />
                    <span className="font-medium truncate">{profilePermissions.profileName}</span>
                  </div>
                  {profilePermissions.profileSector && (
                    <div className="text-muted-foreground truncate">
                      {profilePermissions.profileSector}
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="w-full justify-start gap-2"
              >
                <LogOut className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                {!isCollapsed && <span className={isMobile ? 'text-xs' : 'text-sm'}>Sair</span>}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
