import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

// Extração de dados de contrato de fornecimento a partir de um arquivo (PDF ou imagem).
// Usa a API da OpenAI (gpt-4o) com function-calling forçado para retornar um objeto estruturado
// que pré-preenche o formulário de novo contrato no frontend.

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

interface RequestBody {
  file_base64: string;
  media_type: string;
  file_name?: string;
}

const extractionFunction = {
  name: 'registrar_dados_contrato',
  description:
    'Registra os dados extraídos de um contrato de fornecimento entre uma retífica e um fornecedor. ' +
    'Preencha apenas os campos que estiverem claramente presentes no documento; use null quando a informação não existir ou for incerta. ' +
    'Datas no formato ISO YYYY-MM-DD. Valores numéricos sem símbolo de moeda (use ponto decimal).',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      supplier_name: {
        type: ['string', 'null'],
        description: 'Nome / razão social do fornecedor (a outra parte, não a retífica contratante).',
      },
      supplier_cnpj: {
        type: ['string', 'null'],
        description: 'CNPJ do fornecedor, apenas dígitos ou no formato 00.000.000/0000-00.',
      },
      start_date: {
        type: ['string', 'null'],
        description: 'Data de início da vigência (YYYY-MM-DD).',
      },
      end_date: {
        type: ['string', 'null'],
        description: 'Data de término da vigência (YYYY-MM-DD).',
      },
      payment_days: {
        type: ['integer', 'null'],
        description: 'Prazo de pagamento em dias (ex.: 30).',
      },
      discount_percentage: {
        type: ['number', 'null'],
        description: 'Percentual de desconto acordado (0 a 100).',
      },
      notes: {
        type: ['string', 'null'],
        description: 'Resumo de condições especiais, cláusulas relevantes ou observações do contrato.',
      },
      items: {
        type: 'array',
        description: 'Itens/peças com preço acordado listados no contrato. Vazio se não houver tabela de preços.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            part_code: { type: ['string', 'null'], description: 'Código da peça, se houver.' },
            part_name: { type: 'string', description: 'Descrição/nome da peça ou item.' },
            agreed_price: { type: 'number', description: 'Preço unitário acordado.' },
          },
          required: ['part_code', 'part_name', 'agreed_price'],
        },
      },
    },
    required: [
      'supplier_name',
      'supplier_cnpj',
      'start_date',
      'end_date',
      'payment_days',
      'discount_percentage',
      'notes',
      'items',
    ],
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada no projeto.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = (await req.json()) as RequestBody;
    if (!body.file_base64 || !body.media_type) {
      return new Response(
        JSON.stringify({ error: 'file_base64 e media_type são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const isPdf = body.media_type === 'application/pdf';
    const dataUrl = `data:${body.media_type};base64,${body.file_base64}`;

    // Bloco de conteúdo: PDF via "file" / imagem via "image_url" (formatos suportados pelo gpt-4o)
    const fileBlock = isPdf
      ? {
          type: 'file',
          file: {
            filename: body.file_name || 'contrato.pdf',
            file_data: dataUrl,
          },
        }
      : {
          type: 'image_url',
          image_url: { url: dataUrl },
        };

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content:
              'Você extrai dados estruturados de contratos de fornecimento. ' +
              'A retífica é a parte CONTRATANTE; o fornecedor é a outra parte. ' +
              'Sempre responda chamando a função registrar_dados_contrato. ' +
              'Se algum campo não estiver claro no documento, use null.',
          },
          {
            role: 'user',
            content: [
              fileBlock,
              {
                type: 'text',
                text:
                  'Extraia os dados deste contrato de fornecimento e registre-os usando a função.',
              },
            ],
          },
        ],
        tools: [{ type: 'function', function: extractionFunction }],
        tool_choice: { type: 'function', function: { name: 'registrar_dados_contrato' } },
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: 'Falha ao processar o contrato com a IA.', detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const result = await openaiResponse.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw = toolCall?.function?.arguments;

    if (!argsRaw) {
      return new Response(
        JSON.stringify({ error: 'A IA não retornou dados estruturados do contrato.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(argsRaw);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Resposta da IA em formato inválido.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ data: parsed }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('extract-contract-data error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro inesperado.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
