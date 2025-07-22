
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
  Settings
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useBreakpoint } from "@/hooks/useBreakpoint";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
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
    title: "Orçamentos",
    url: "/orcamentos",
    icon: DollarSign,
  },
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
    title: "Estoque/Peças",
    url: "/estoque",
    icon: Package,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: FileText,
  },
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
        <SidebarGroup>
          <SidebarGroupLabel className={isMobile ? "text-xs" : ""}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
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
    </Sidebar>
  );
}
