
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      throw new Error('Invalid authorization')
    }

    const { obligationId, fileType = 'TAX_SUMMARY', format = 'csv' } = await req.json()
    
    if (!obligationId) {
      throw new Error('obligationId is required')
    }

    console.log(`Generating file for obligation ${obligationId}, type: ${fileType}, format: ${format}`)

    // Get obligation details
    const { data: obligation, error: obligationError } = await supabase
      .from('obligations')
      .select(`
        *,
        obligation_kinds (name, code)
      `)
      .eq('id', obligationId)
      .single()

    if (obligationError || !obligation) {
      throw new Error('Obligation not found')
    }

    // Get tax calculations for the period
    const startDate = `${obligation.period_year}-${obligation.period_month.toString().padStart(2, '0')}-01`
    const endDate = new Date(obligation.period_year, obligation.period_month, 0).toISOString().split('T')[0]

    const { data: calculations } = await supabase
      .from('tax_calculations')
      .select(`
        *,
        tax_regimes (name),
        fiscal_classifications (description)
      `)
      .gte('calculated_at', startDate)
      .lte('calculated_at', endDate)
      .order('calculated_at', { ascending: false })

    // Get tax ledgers for the period
    const { data: ledgers } = await supabase
      .from('tax_ledgers')
      .select(`
        *,
        tax_types (name, code)
      `)
      .eq('period_month', obligation.period_month)
      .eq('period_year', obligation.period_year)

    // Generate file content based on type and format
    let fileContent = ''
    let mimeType = ''
    let fileName = ''

    if (format === 'csv') {
      mimeType = 'text/csv'
      fileName = `${fileType}_${obligation.period_year}_${obligation.period_month.toString().padStart(2, '0')}.csv`
      
      if (fileType === 'TAX_SUMMARY') {
        fileContent = generateTaxSummaryCSV(calculations || [], ledgers || [], obligation)
      } else if (fileType === 'TAX_CALCULATIONS') {
        fileContent = generateTaxCalculationsCSV(calculations || [])
      } else {
        fileContent = generateGenericCSV(obligation, calculations || [], ledgers || [])
      }
    } else if (format === 'json') {
      mimeType = 'application/json'
      fileName = `${fileType}_${obligation.period_year}_${obligation.period_month.toString().padStart(2, '0')}.json`
      
      fileContent = JSON.stringify({
        obligation,
        calculations: calculations || [],
        ledgers: ledgers || [],
        generatedAt: new Date().toISOString(),
        generatedBy: user.id
      }, null, 2)
    }

    // Upload file to storage
    const filePath = `${user.id}/${obligationId}/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fiscal-outputs')
      .upload(filePath, new Blob([fileContent], { type: mimeType }), {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Calculate file hash (simplified)
    const encoder = new TextEncoder()
    const data = encoder.encode(fileContent)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Save file record
    const { data: fileRecord, error: fileError } = await supabase
      .from('obligation_files')
      .insert({
        obligation_id: obligationId,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
        mime_type: mimeType,
        size_bytes: data.length,
        hash_sha256: hashHex,
        generated_by: user.id,
        status: 'success'
      })
      .select()
      .single()

    if (fileError) {
      console.error('File record error:', fileError)
      throw new Error(`Failed to save file record: ${fileError.message}`)
    }

    // Update obligation with generated file path
    await supabase
      .from('obligations')
      .update({ 
        generated_file_path: filePath,
        status: 'gerado'
      })
      .eq('id', obligationId)

    console.log(`File generated successfully: ${fileName}`)

    return new Response(
      JSON.stringify({
        success: true,
        file: fileRecord,
        message: 'Arquivo gerado com sucesso'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error generating file:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})

function generateTaxSummaryCSV(calculations: any[], ledgers: any[], obligation: any): string {
  const lines = [
    'Resumo Fiscal - ' + (obligation.obligation_kinds?.name || 'Obrigação'),
    `Período: ${obligation.period_month}/${obligation.period_year}`,
    '',
    'RESUMO DE IMPOSTOS',
    'Tipo,Total Débitos,Total Créditos,Saldo Devedor'
  ]

  ledgers.forEach(ledger => {
    lines.push(`${ledger.tax_types?.name || 'N/A'},${ledger.total_debits || 0},${ledger.total_credits || 0},${ledger.balance_due || 0}`)
  })

  lines.push('')
  lines.push('CÁLCULOS DO PERÍODO')
  lines.push('Data,Operação,Valor Base,Total Impostos,Detalhes')

  calculations.forEach(calc => {
    const date = new Date(calc.calculated_at).toLocaleDateString('pt-BR')
    const taxes = calc.result?.taxes || []
    const taxDetails = taxes.map((t: any) => `${t.tax_type}: ${t.amount?.toFixed(2) || '0.00'}`).join('; ')
    
    lines.push(`${date},${calc.operation},${calc.amount?.toFixed(2) || '0.00'},${calc.result?.total_tax?.toFixed(2) || '0.00'},"${taxDetails}"`)
  })

  return lines.join('\n')
}

function generateTaxCalculationsCSV(calculations: any[]): string {
  const lines = [
    'CÁLCULOS DE IMPOSTOS',
    'Data,ID,Operação,Regime,Classificação,Valor Base,UF Origem,UF Destino,Total Impostos,Status,Observações'
  ]

  calculations.forEach(calc => {
    const date = new Date(calc.calculated_at).toLocaleDateString('pt-BR')
    const regime = calc.tax_regimes?.name || 'N/A'
    const classification = calc.fiscal_classifications?.description || 'N/A'
    
    lines.push([
      date,
      calc.id,
      calc.operation,
      regime,
      classification,
      calc.amount?.toFixed(2) || '0.00',
      calc.origin_uf || 'N/A',
      calc.destination_uf || 'N/A',
      calc.result?.total_tax?.toFixed(2) || '0.00',
      'Calculado',
      `"${calc.notes || ''}"`
    ].join(','))
  })

  return lines.join('\n')
}

function generateGenericCSV(obligation: any, calculations: any[], ledgers: any[]): string {
  const lines = [
    'DADOS FISCAIS - EXPORTAÇÃO COMPLETA',
    `Obrigação: ${obligation.obligation_kinds?.name || 'N/A'}`,
    `Período: ${obligation.period_month}/${obligation.period_year}`,
    `Status: ${obligation.status}`,
    '',
    'Resumo:',
    `- Total de Cálculos: ${calculations.length}`,
    `- Total de Livros Fiscais: ${ledgers.length}`,
    '',
    'Gerado em: ' + new Date().toLocaleString('pt-BR')
  ]

  return lines.join('\n')
}
