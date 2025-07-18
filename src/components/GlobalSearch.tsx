
import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Users, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'funcionarios' | 'clientes' | 'estoque' | 'orcamentos';
  url: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Mock search data
  const searchData: SearchResult[] = [
    {
      id: '1',
      title: 'João Silva',
      description: 'Funcionário - Mecânico Senior',
      category: 'funcionarios',
      url: '/funcionarios'
    },
    {
      id: '2',
      title: 'Maria Santos',
      description: 'Cliente - Última visita: 15/01/2024',
      category: 'clientes',
      url: '/clientes'
    },
    {
      id: '3',
      title: 'Pistão Motor VW',
      description: 'Estoque: 15 unidades - R$ 245,00',
      category: 'estoque',
      url: '/estoque'
    },
    {
      id: '4',
      title: 'RF-2024-001',
      description: 'Orçamento - Aguardando aprovação',
      category: 'orcamentos',
      url: '/orcamentos'
    }
  ];

  const categoryIcons = {
    funcionarios: Users,
    clientes: Users,
    estoque: Package,
    orcamentos: DollarSign
  };

  const categoryColors = {
    funcionarios: 'bg-blue-100 text-blue-700',
    clientes: 'bg-green-100 text-green-700',
    estoque: 'bg-orange-100 text-orange-700',
    orcamentos: 'bg-purple-100 text-purple-700'
  };

  useEffect(() => {
    if (query.trim()) {
      const filtered = searchData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query]);

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
                        const Icon = categoryIcons[result.category];
                        return (
                          <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
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
                              className={`${categoryColors[result.category]} ml-2`}
                              variant="secondary"
                            >
                              {result.category}
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
