
import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, Search } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadNotifications = 2; // This would come from your notification state

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header with improved animations */}
          <motion.header 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="h-16 border-b bg-gradient-to-r from-card via-card to-card/95 flex items-center justify-between px-6 shadow-card backdrop-blur-md relative z-30"
          >
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-primary/10 transition-colors rounded-lg" />
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary transform transition-transform cursor-pointer"
                >
                  <span className="text-sm font-bold text-primary-foreground">RF</span>
                </motion.div>
                <div>
                  <h1 className="font-bold text-foreground text-lg tracking-tight">Retífica Formiguense</h1>
                  <p className="text-xs text-muted-foreground font-medium">Sistema de Gestão Automotiva</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Global Search Button */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-primary/10 transition-colors group"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="sr-only">Buscar (Cmd+K)</span>
                </Button>
              </motion.div>

              {/* Notifications Button */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-primary/10 transition-colors group"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="w-5 h-5 group-hover:animate-bounce" />
                  {unreadNotifications > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-primary rounded-full text-xs text-primary-foreground flex items-center justify-center font-bold animate-pulse-glow"
                    >
                      {unreadNotifications}
                    </motion.span>
                  )}
                </Button>
              </motion.div>

              <div className="w-px h-6 bg-border/50"></div>
              
              {/* User Menu */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
                  <User className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          </motion.header>

          {/* Enhanced Main Content with page transitions */}
          <main className="flex-1 p-6 overflow-auto bg-gradient-to-br from-background via-background to-background/95 custom-scrollbar relative">
            <motion.div 
              className="container-enhanced"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        {/* Global Search Modal */}
        <AnimatePresence>
          {searchOpen && (
            <GlobalSearch 
              isOpen={searchOpen} 
              onClose={() => setSearchOpen(false)} 
            />
          )}
        </AnimatePresence>

        {/* Notification Center */}
        <AnimatePresence>
          {notificationsOpen && (
            <NotificationCenter 
              isOpen={notificationsOpen} 
              onClose={() => setNotificationsOpen(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    </SidebarProvider>
  );
}
