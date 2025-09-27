
import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { KanbanBoard } from '@/components/workflow/KanbanBoard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Workflow() {
  const { getOrders, loading } = useSupabase();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    const data = await getOrders();
    if (data) {
      setOrders(data);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

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
            Atualizar
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
