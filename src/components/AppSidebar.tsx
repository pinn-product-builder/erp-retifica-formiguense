
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  ClipboardCheck, 
  Truck, 
  Kanban, 
  DollarSign, 
  Building2, 
  UserCheck, 
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
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: Users,
  },
  {
    title: "Check-in Técnico",
    url: "/checkin",
    icon: ClipboardCheck,
  },
  {
    title: "Coleta de Motor",
    url: "/coleta",
    icon: Truck,
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
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-primary">
            <span className="text-sm font-bold text-primary-foreground">RF</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
                Retífica Formiguense
              </h2>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                Sistema de Gestão
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
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
                      className="group transition-all duration-200"
                    >
                      <NavLink 
                        to={item.url}
                        className="flex items-center gap-3 w-full"
                      >
                        <item.icon className="h-4 w-4 shrink-0 transition-colors" />
                        {!isCollapsed && (
                          <span className="truncate text-sm font-medium">
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
