
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  FileText, 
  Users, 
  Package, 
  DollarSign,
  Home,
  Truck,
  ClipboardCheck,
  Kanban,
  Building2,
  UserCheck,
  Clock,
  ShoppingCart,
  TrendingUp,
  Receipt,
  CreditCard,
  PiggyBank,
  Calculator,
  Gavel,
  Settings,
  Shield,
  ClipboardList,
  Wrench,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfilePermissions } from '@/hooks/useProfilePermissions';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'telas' | 'funcionarios' | 'clientes' | 'estoque' | 'orcamentos';
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

// Todas as telas disponíveis no sistema
const allPages = [
  { title: "Dashboard", url: "/dashboard", icon: Home, category: "Dashboard & Visão Geral" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, category: "Dashboard & Visão Geral" },
  { title: "Coleta de Motor", url: "/coleta", icon: Truck, category: "Operações & Serviços" },
  { title: "Check-in Técnico", url: "/checkin", icon: ClipboardCheck, category: "Operações & Serviços" },
  { title: "Diagnósticos", url: "/diagnosticos", icon: ClipboardList, category: "Operações & Serviços" },
  { title: "Orçamentos", url: "/orcamentos", icon: DollarSign, category: "Operações & Serviços" },
  { title: "Workflow Kanban", url: "/workflow", icon: Kanban, category: "Operações & Serviços" },
  { title: "Ordens de Serviço", url: "/ordens-servico", icon: Wrench, category: "Operações & Serviços" },
  { title: "PCP - Produção", url: "/pcp", icon: Calendar, category: "Operações & Serviços" },
  { title: "Configurações Operações", url: "/configuracoes/operacoes", icon: Settings, category: "Operações & Serviços" },
  { title: "Clientes", url: "/clientes", icon: Building2, category: "Gestão de Pessoas" },
  { title: "Consultores", url: "/consultores", icon: UserCheck, category: "Gestão de Pessoas" },
  { title: "Funcionários", url: "/funcionarios", icon: Users, category: "Gestão de Pessoas" },
  { title: "Gestão RH", url: "/gestao-funcionarios", icon: Clock, category: "Gestão de Pessoas" },
  { title: "Estoque/Peças", url: "/estoque", icon: Package, category: "Estoque & Compras" },
  { title: "Compras", url: "/compras", icon: ShoppingCart, category: "Estoque & Compras" },
  { title: "Dashboard Financeiro", url: "/financeiro", icon: TrendingUp, category: "Financeiro" },
  { title: "Contas a Receber", url: "/contas-receber", icon: Receipt, category: "Financeiro" },
  { title: "Contas a Pagar", url: "/contas-pagar", icon: CreditCard, category: "Financeiro" },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: PiggyBank, category: "Financeiro" },
  { title: "DRE Mensal", url: "/dre", icon: Calculator, category: "Financeiro" },
  { title: "Módulo Fiscal", url: "/modulo-fiscal", icon: Gavel, category: "Fiscal" },
  { title: "Gestão de Usuários", url: "/gestao-usuarios", icon: Users, category: "Administração" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, category: "Administração" },
  { title: "Super Admin", url: "/super-admin", icon: Shield, category: "Super Admin" },
];

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const profilePermissions = useProfilePermissions();

  // Filtrar páginas baseado nas permissões do usuário
  const availablePages = useMemo(() => {
    return allPages.filter(page => profilePermissions.canAccessPage(page.url));
  }, [profilePermissions]);

  const categoryColors: Record<string, string> = {
    'telas': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'Dashboard & Visão Geral': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    'Operações & Serviços': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'Gestão de Pessoas': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    'Estoque & Compras': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    'Financeiro': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    'Fiscal': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    'Administração': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    'Super Admin': 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  };

  // Buscar nas páginas disponíveis
  useEffect(() => {
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      const filtered = availablePages
        .filter(page => {
          const titleMatch = page.title.toLowerCase().includes(searchTerm);
          const categoryMatch = page.category.toLowerCase().includes(searchTerm);
          const urlMatch = page.url.toLowerCase().includes(searchTerm);
          return titleMatch || categoryMatch || urlMatch;
        })
        .map(page => ({
          id: page.url,
          title: page.title,
          description: page.category,
          category: 'telas' as const,
          url: page.url,
          icon: page.icon
        }));
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, availablePages]);

  // Função para navegar ao clicar em um resultado
  const handleResultClick = (url: string) => {
    navigate(url);
    onClose();
    setQuery('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Open search (handled by parent)
        } else {
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-start justify-center pt-16 px-4">
        <motion.div
          initial={{ scale: 0.9, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: -20 }}
          className="w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl border-border/50">
            <CardContent className="p-0">
              <div className="flex items-center border-b border-border/50 px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground mr-3" />
                <Input
                  placeholder="Buscar em todo o sistema... (Cmd+K)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="border-0 focus-visible:ring-0 text-base"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {results.length > 0 ? (
                    <div className="p-2">
                      {results.map((result, index) => {
                        const Icon = result.icon;
                        return (
                          <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                            onClick={() => handleResultClick(result.url)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleResultClick(result.url);
                              }
                            }}
                            tabIndex={0}
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {result.title}
                              </h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {result.description}
                              </p>
                            </div>
                            <Badge
                              className={`${categoryColors[result.description] || categoryColors.telas} ml-2 flex-shrink-0`}
                              variant="secondary"
                            >
                              {result.description}
                            </Badge>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : query.trim() ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum resultado encontrado para "{query}"</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Digite para buscar em todo o sistema</p>
                      <p className="text-xs mt-2">
                        Use Cmd+K para abrir a busca
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
