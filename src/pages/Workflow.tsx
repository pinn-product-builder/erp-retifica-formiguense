
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
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            Painel de Workflow - Kanban
          </CardTitle>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <KanbanBoard 
            orders={orders} 
            onOrderUpdate={loadOrders}
          />
        </CardContent>
      </Card>
    </div>
  );
}
