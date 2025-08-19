import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateCSV(data: any[], headers: string[]): Promise<string> {
  let csv = headers.join(',') + '\n';
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csv += values.join(',') + '\n';
  }
  
  return csv;
}

async function executeReport(reportCode: string, parameters: any, orgId: string) {
  console.log(`Executing report: ${reportCode} for org: ${orgId}`);
  
  let data: any[] = [];
  let headers: string[] = [];
  let filename = `${reportCode}_${new Date().toISOString().split('T')[0]}.csv`;

  switch (reportCode) {
    case 'vendas_geral':
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          order_number,
          collection_date,
          status,
          customers(name, document),
          consultants(name),
          budgets(total_cost)
        `)
        .eq('org_id', orgId);

      if (ordersError) throw ordersError;
      
      data = ordersData?.map(order => ({
        numero_pedido: order.order_number,
        data_coleta: order.collection_date,
        cliente: order.customers?.name,
        consultor: order.consultants?.name,
        valor_total: order.budgets?.[0]?.total_cost || 0,
        status: order.status
      })) || [];
      
      headers = ['numero_pedido', 'data_coleta', 'cliente', 'consultor', 'valor_total', 'status'];
      break;

    case 'produtividade':
      const { data: prodData, error: prodError } = await supabase
        .from('consultants')
        .select(`
          name,
          commission_rate,
          orders(count)
        `)
        .eq('org_id', orgId);

      if (prodError) throw prodError;
      
      data = prodData?.map(consultant => ({
        consultor: consultant.name,
        comissao: consultant.commission_rate,
        total_pedidos: consultant.orders?.length || 0
      })) || [];
      
      headers = ['consultor', 'comissao', 'total_pedidos'];
      break;

    case 'clientes':
      const { data: clientsData, error: clientsError } = await supabase
        .from('customers')
        .select('*')
        .eq('org_id', orgId);

      if (clientsError) throw clientsError;
      
      data = clientsData?.map(customer => ({
        nome: customer.name,
        documento: customer.document,
        telefone: customer.phone,
        email: customer.email,
        tipo: customer.type,
        endereco: customer.address
      })) || [];
      
      headers = ['nome', 'documento', 'telefone', 'email', 'tipo', 'endereco'];
      break;

    case 'estoque':
      const { data: stockData, error: stockError } = await supabase
        .from('parts_inventory')
        .select('*')
        .eq('org_id', orgId);

      if (stockError) throw stockError;
      
      data = stockData?.map(part => ({
        peca: part.part_name,
        codigo: part.part_code,
        quantidade: part.quantity,
        custo_unitario: part.unit_cost,
        fornecedor: part.supplier,
        status: part.status,
        componente: part.component
      })) || [];
      
      headers = ['peca', 'codigo', 'quantidade', 'custo_unitario', 'fornecedor', 'status', 'componente'];
      break;

    default:
      throw new Error(`Report type ${reportCode} not implemented`);
  }

  const csvContent = await generateCSV(data, headers);
  return { content: csvContent, filename, type: 'text/csv' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId } = await req.json();
    
    if (!reportId) {
      return new Response(
        JSON.stringify({ error: 'Report ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get report details
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // Update status to processing
    await supabase
      .from('reports')
      .update({ status: 'processing' })
      .eq('id', reportId);

    console.log(`Processing report ${reportId}: ${report.report_code}`);

    // Generate report content
    const result = await executeReport(report.report_code, report.parameters, report.org_id);
    
    // Upload to storage
    const filePath = `${report.org_id}/${reportId}/${result.filename}`;
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(filePath, result.content, {
        contentType: result.type,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Calculate hash
    const encoder = new TextEncoder();
    const data = encoder.encode(result.content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update report with success status
    await supabase
      .from('reports')
      .update({
        status: 'success',
        file_path: filePath,
        file_name: result.filename,
        file_type: 'csv',
        size_bytes: result.content.length,
        hash_sha256: hashHex,
        generated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    console.log(`Report ${reportId} generated successfully`);

    return new Response(
      JSON.stringify({ success: true, reportId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating report:', error);
    
    // Update report status to error if we have reportId
    const { reportId } = await req.json().catch(() => ({}));
    if (reportId) {
      await supabase
        .from('reports')
        .update({ 
          status: 'error',
          error_message: error.message 
        })
        .eq('id', reportId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});