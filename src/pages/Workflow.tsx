
import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Workflow() {
  const { getOrders, loading } = useSupabase();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async (showToast = false) => {
    try {
      const data = await getOrders();
      if (data) {
        setOrders(data);
        if (showToast) {
          toast({
            title: "Dados atualizados",
            description: "Workflow atualizado com sucesso",
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as ordens de serviço. Tente novamente.",
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOrders(true); // Mostrar toast no refresh manual
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Função interna para evitar warning de dependência
    const initialLoad = async () => {
      try {
        const data = await getOrders();
        if (data) {
          setOrders(data);
        }
      } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar as ordens de serviço. Tente novamente.",
        });
      }
    };
    
    initialLoad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header fixo */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            Painel de Workflow - Kanban
          </h1>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Área do Kanban com scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-4 sm:p-6">
          <KanbanBoard 
            orders={orders} 
            onOrderUpdate={loadOrders}
          />
        </div>
      </div>
    </div>
  );
}
