import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header */}
          <header className="h-16 border-b bg-gradient-to-r from-card via-card to-card/95 flex items-center justify-between px-6 shadow-card backdrop-blur-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-primary/10 transition-colors rounded-lg" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary transform hover:scale-105 transition-transform">
                  <span className="text-sm font-bold text-primary-foreground">RF</span>
                </div>
                <div>
                  <h1 className="font-bold text-foreground text-lg tracking-tight">Retífica Formiguense</h1>
                  <p className="text-xs text-muted-foreground font-medium">Sistema de Gestão Automotiva</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors group">
                <Bell className="w-5 h-5 group-hover:animate-bounce" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-primary rounded-full text-xs animate-pulse-glow"></span>
              </Button>
              <div className="w-px h-6 bg-border/50"></div>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </header>

          {/* Enhanced Main Content */}
          <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background via-background to-background/95 custom-scrollbar">
            <div className="container-enhanced">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}