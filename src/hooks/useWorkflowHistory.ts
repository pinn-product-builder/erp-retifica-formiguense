// @ts-nocheck
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkflowHistoryEntry {
  id: string;
  order_workflow_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  change_reason?: string;
  changed_at: string;
  user_email?: string;
}

export function useWorkflowHistory() {
  const { toast } = useToast();
  const [history, setHistory] = useState<WorkflowHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (workflowId: string | undefined) => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_status_history')
        .select('*')
        .eq('order_workflow_id', workflowId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data as unknown) || []);
    } catch (error) {
      console.error('Error fetching workflow history:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico do workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearHistory = useCallback(() => setHistory([]), []);

  const getStatusDuration = (entry: WorkflowHistoryEntry, nextEntry?: WorkflowHistoryEntry) => {
    if (!nextEntry) return null;
    
    const current = new Date(entry.changed_at);
    const next = new Date(nextEntry.changed_at);
    const diffMs = current.getTime() - next.getTime();
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getHistorySummary = () => {
    if (history.length === 0) return null;

    const totalTransitions = history.length;
    const firstEntry = history[history.length - 1];
    const lastEntry = history[0];
    
    const totalTime = firstEntry && lastEntry 
      ? new Date(lastEntry.changed_at).getTime() - new Date(firstEntry.changed_at).getTime()
      : 0;
    
    const totalHours = Math.floor(totalTime / (1000 * 60 * 60));
    const totalDays = Math.floor(totalHours / 24);
    
    return {
      totalTransitions,
      totalTimeFormatted: totalDays > 0 
        ? `${totalDays}d ${totalHours % 24}h`
        : `${totalHours}h`,
      firstStatus: firstEntry?.to_status,
      currentStatus: lastEntry?.to_status,
      startDate: firstEntry?.changed_at,
      lastUpdate: lastEntry?.changed_at
    };
  };

  return {
    history,
    loading,
    fetchHistory,
    clearHistory,
    getStatusDuration,
    getHistorySummary
  };
}
