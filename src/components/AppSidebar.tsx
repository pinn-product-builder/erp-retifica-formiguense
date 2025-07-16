
import { 
  Home, 
  FileText, 
  Users, 
  BarChart3, 
  Package, 
  Settings, 
  Wrench,
  Clock,
  MessageSquare,
  Calculator,
  TrendingUp
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    group: "principal"
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: Calculator,
    group: "servicos"
  },
  {
    title: "Serviços",
    url: "/servicos",
    icon: Wrench,
    group: "servicos"
  },
  {
    title: "Funcionários",
    url: "/funcionarios",
    icon: Users,
    group: "gestao"
  },
  {
    title: "Produtividade",
    url: "/produtividade",
    icon: TrendingUp,
    group: "gestao"
  },
  {
    title: "Apontamentos",
    url: "/apontamentos",
    icon: Clock,
    group: "gestao"
  },
  {
    title: "Peças",
    url: "/pecas",
    icon: Package,
    group: "estoque"
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart3,
    group: "analise"
  },
  {
    title: "WhatsApp",
    url: "/whatsapp",
    icon: MessageSquare,
    group: "comunicacao"
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    group: "sistema"
  }
];

const groups = {
  principal: "Dashboard",
  servicos: "Serviços",
  gestao: "Gestão",
  estoque: "Estoque",
  analise: "Análise",
  comunicacao: "Comunicação",
  sistema: "Sistema"
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent font-medium transition-colors" 
      : "hover:bg-sidebar-accent/50 transition-colors";

  // Group items by their group
  const groupedItems = Object.entries(groups).map(([groupKey, groupLabel]) => ({
    key: groupKey,
    label: groupLabel,
    items: menuItems.filter(item => item.group === groupKey)
  }));

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"}>
      <SidebarContent className="bg-card border-r">
        {groupedItems.map((group, index) => (
          <SidebarGroup key={group.key} className={index > 0 ? "border-t border-border/40 pt-4" : ""}>
            {state !== "collapsed" && (
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild size="sm">
                      <NavLink 
                        to={item.url} 
                        end 
                        className={getNavCls}
                      >
                        <item.icon className={`flex-shrink-0 ${state === "collapsed" ? "w-5 h-5" : "w-4 h-4"}`} />
                        {state !== "collapsed" && <span className="truncate font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}