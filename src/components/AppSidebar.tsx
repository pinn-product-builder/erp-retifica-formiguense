
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
  Wrench
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
    title: "Ordens de Serviço",
    url: "/ordens-servico",
    icon: Wrench,
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: DollarSign,
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
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { isMobile } = useBreakpoint();
  const { user, signOut } = useAuth();
  const isCollapsed = state === "collapsed";

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
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Dashboard & Visão Geral
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                      className="group transition-colors duration-200"
                      size={isMobile ? "sm" : "default"}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} />
                        {!isCollapsed && (
                          <span className={`truncate ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operações & Serviços */}
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Operações & Serviços
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                      className="group transition-colors duration-200"
                      size={isMobile ? "sm" : "default"}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} />
                        {!isCollapsed && (
                          <span className={`truncate ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestão de Pessoas */}
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Gestão de Pessoas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {peopleItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                      className="group transition-colors duration-200"
                      size={isMobile ? "sm" : "default"}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} />
                        {!isCollapsed && (
                          <span className={`truncate ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Estoque, Compras & Suprimentos */}
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Estoque & Compras
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                      className="group transition-colors duration-200"
                      size={isMobile ? "sm" : "default"}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} />
                        {!isCollapsed && (
                          <span className={`truncate ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financeiro */}
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Financeiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financialItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                      className="group transition-colors duration-200"
                      size={isMobile ? "sm" : "default"}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} />
                        {!isCollapsed && (
                          <span className={`truncate ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Fiscal */}
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Fiscal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fiscalItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                      className="group transition-colors duration-200"
                      size={isMobile ? "sm" : "default"}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} />
                        {!isCollapsed && (
                          <span className={`truncate ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administração */}
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={isCollapsed ? item.title : undefined}
                      isActive={isActive}
                      className="group transition-colors duration-200"
                      size={isMobile ? "sm" : "default"}
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} shrink-0`} />
                        {!isCollapsed && (
                          <span className={`truncate ${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2">
              <div className="text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
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
