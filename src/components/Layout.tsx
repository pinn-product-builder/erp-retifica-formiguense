
import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User, Search, Mail, Building2, LogOut, Phone, MapPin, Shield, Briefcase } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useAuth } from "@/hooks/useAuth";
import { useProfilePermissions } from "@/hooks/useProfilePermissions";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: React.ReactNode;
}

interface UserBasicInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export function Layout({ children }: LayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userBasicInfo, setUserBasicInfo] = useState<UserBasicInfo | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const { isMobile } = useBreakpoint();
  const { user, signOut } = useAuth();
  const profilePermissions = useProfilePermissions();
  const { userRole } = useOrganization();
  const permissions = usePermissions();
  const unreadNotifications = 2;

  // Mapear role para texto em português
  const getRoleLabel = (role: string | null): string => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Administrador',
      'owner': 'Proprietário',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário',
      'viewer': 'Visualizador'
    };
    return roleMap[role || ''] || role || 'Sem função';
  };

  // Obter cor da badge baseado na role
  const getRoleColor = (role: string | null): string => {
    const colorMap: Record<string, string> = {
      'super_admin': 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
      'owner': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      'admin': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'manager': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      'user': 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
      'viewer': 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
    };
    return colorMap[role || ''] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  // Buscar informações básicas do usuário
  useEffect(() => {
    const fetchUserBasicInfo = async () => {
      if (!user?.id) {
        setLoadingUserInfo(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_basic_info')
          .select('name, email')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setUserBasicInfo({
            name: data.name || undefined,
            email: data.email || user.email || undefined
          });
        } else {
          // Se não encontrou na tabela, usar email do auth
          setUserBasicInfo({
            name: user.user_metadata?.name || undefined,
            email: user.email || undefined
          });
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        setUserBasicInfo({
          name: user.user_metadata?.name || undefined,
          email: user.email || undefined
        });
      } finally {
        setLoadingUserInfo(false);
      }
    };

    fetchUserBasicInfo();
  }, [user?.id, user?.email]);

  // Obter nome do usuário (prioridade: user_basic_info > profile > email)
  const getUserName = () => {
    if (userBasicInfo?.name) return userBasicInfo.name;
    if (profilePermissions.profileName) return profilePermissions.profileName;
    if (user?.user_metadata?.name) return user.user_metadata.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Usuário';
  };

  // Obter email do usuário
  const getUserEmail = () => {
    return userBasicInfo?.email || user?.email || 'Email não disponível';
  };

  // Obter iniciais do nome do usuário
  const getUserInitials = () => {
    const name = getUserName();
    if (name && name !== getUserEmail()) {
      const names = name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset>
          <header className={`sticky top-0 z-40 flex ${isMobile ? 'h-14' : 'h-16'} shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4`}>
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="hover:bg-accent transition-colors rounded-lg" />
              
              <div className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-primary rounded-lg flex items-center justify-center`}>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-primary-foreground`}>
                    FM
                  </span>
                </div>
                {!isMobile && (
                  <div className="hidden sm:block">
                    <h1 className="font-bold text-foreground text-lg">Favarini Motores</h1>
                    <p className="text-xs text-muted-foreground">Sistema de Gestão Automotiva</p>
                  </div>
                )}
              </div>
              
              {!isMobile && (
                <div className="flex-1 flex justify-center">
                  <OrganizationSelector />
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`relative hover:bg-accent transition-colors ${isMobile ? 'h-8 w-8' : ''}`}
                onClick={() => setSearchOpen(true)}
              >
                <Search className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                <span className="sr-only">Buscar</span>
              </Button>

              {/* Novo painel de notificações */}
              <NotificationsPanel />

              <div className="w-px h-6 bg-border"></div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`hover:bg-accent transition-colors ${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full`}
                  >
                    <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}>
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || 'Usuário'} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserName()} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-none truncate">
                            {getUserName()}
                          </p>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {getUserEmail()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t space-y-2">
                        {/* Role do usuário */}
                        {userRole && (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <Shield className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                              <span className="text-muted-foreground">Função:</span>
                            </div>
                            <Badge className={`${getRoleColor(userRole)} text-xs`}>
                              {getRoleLabel(userRole)}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Informações do perfil */}
                        {profilePermissions.hasUserProfile && (
                          <>
                            {profilePermissions.profileName && (
                              <div className="flex items-center gap-2 text-xs">
                                <Briefcase className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                <span className="text-muted-foreground">Perfil:</span>
                                <span className="font-medium truncate">{profilePermissions.profileName}</span>
                              </div>
                            )}
                            {profilePermissions.profileSector && (
                              <div className="flex items-center gap-2 text-xs">
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: profilePermissions.profileSectorColor || '#3B82F6' }}
                                />
                                <span className="text-muted-foreground">Setor:</span>
                                <span className="truncate">{profilePermissions.profileSector}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-background custom-scrollbar">
            <div className={`container mx-auto ${isMobile ? 'p-4' : 'p-6'}`}>
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
