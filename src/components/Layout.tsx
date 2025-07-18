
import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, Search } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadNotifications = 2;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset>
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="hover:bg-accent transition-colors rounded-lg" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">FM</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-foreground text-lg">Favarini Motores</h1>
                  <p className="text-xs text-muted-foreground">Sistema de Gestão Automotiva</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-accent transition-colors"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
                <span className="sr-only">Buscar</span>
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover:bg-accent transition-colors"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs text-primary-foreground flex items-center justify-center font-bold">
                    {unreadNotifications}
                  </span>
                )}
              </Button>

              <div className="w-px h-6 bg-border"></div>
              
              <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
                <User className="w-5 h-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-background custom-scrollbar">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </SidebarInset>

        {searchOpen && (
          <GlobalSearch 
            isOpen={searchOpen} 
            onClose={() => setSearchOpen(false)} 
          />
        )}

        {notificationsOpen && (
          <NotificationCenter 
            isOpen={notificationsOpen} 
            onClose={() => setNotificationsOpen(false)} 
          />
        )}
      </div>
    </SidebarProvider>
  );
}
