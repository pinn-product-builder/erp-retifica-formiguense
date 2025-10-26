import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from '@/hooks/use-toast';

export interface ReportCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  template_type: string;
  parameters_schema: unknown;
  permissions?: unknown;
  is_active: boolean;
  display_order: number;
}

export interface Report {
  id: string;
  report_code: string;
  parameters: unknown;
  period_start?: string;
  period_end?: string;
  status: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  size_bytes?: number;
  generated_by?: string;
  generated_at?: string;
  error_message?: string;
  created_at: string;
}

export interface ReportStats {
  totalReports: number;
  pendingReports: number;
  completedToday: number;
  totalSize: number;
}

export const useReports = () => {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<ReportCatalog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    pendingReports: 0,
    completedToday: 0,
    totalSize: 0
  });

  const fetchCatalog = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('report_catalog')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCatalog(data || []);
    } catch (error) {
      console.error('Error fetching report catalog:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar catálogo de relatórios",
        variant: "destructive",
      });
    }
  };

  const fetchReports = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReports(data || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const totalReports = data?.length || 0;
      const pendingReports = data?.filter(r => r.status === 'pending' || r.status === 'processing').length || 0;
      const completedToday = data?.filter(r => 
        r.status === 'success' && 
        r.generated_at?.startsWith(today)
      ).length || 0;
      const totalSize = data?.reduce((acc, r) => acc + (r.size_bytes || 0), 0) || 0;

      setStats({
        totalReports,
        pendingReports,
        completedToday,
        totalSize
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios",
        variant: "destructive",
      });
    }
  };

  const generateReport = async (reportCode: string, parameters: unknown) => {
    if (!currentOrganization) return null;

    setLoading(true);
    try {
      // Create report record
      const { data: reportData, error: insertError } = await supabase
        .from('reports')
        .insert({
          org_id: currentOrganization.id,
          report_code: reportCode,
          parameters,
          period_start: parameters.period?.from,
          period_end: parameters.period?.to,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to generate report
      const { error: functionError } = await supabase.functions.invoke('generate-report', {
        body: { reportId: reportData.id }
      });

      if (functionError) {
        // Update status to error
        await supabase
          .from('reports')
          .update({ 
            status: 'error',
            error_message: functionError.message 
          })
          .eq('id', reportData.id);
        
        throw functionError;
      }

      toast({
        title: "Sucesso",
        description: "Relatório iniciado. Você será notificado quando estiver pronto.",
      });

      // Refresh reports list
      fetchReports();
      
      return reportData;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (report: Report) => {
    if (!report.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('reports')
        .download(report.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name || `report_${report.id}.${report.file_type || 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar relatório",
        variant: "destructive",
      });
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Relatório excluído com sucesso",
      });

      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir relatório",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchCatalog();
      fetchReports();
    }
  }, [currentOrganization]);

  return {
    loading,
    catalog,
    reports,
    stats,
    generateReport,
    downloadReport,
    deleteReport,
    refreshReports: fetchReports,
    refreshCatalog: fetchCatalog
  };
};