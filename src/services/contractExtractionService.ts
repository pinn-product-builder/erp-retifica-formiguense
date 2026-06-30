import { supabase } from '@/integrations/supabase/client';

export interface ExtractedContractItem {
  part_code: string | null;
  part_name: string;
  agreed_price: number;
}

export interface ExtractedContractData {
  supplier_name: string | null;
  supplier_cnpj: string | null;
  start_date: string | null;
  end_date: string | null;
  payment_days: number | null;
  discount_percentage: number | null;
  notes: string | null;
  items: ExtractedContractItem[];
}

const CONTRACTS_BUCKET = 'contracts';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result = "data:<mime>;base64,<data>" — manter apenas a parte base64.
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const ContractExtractionService = {
  /** Envia o arquivo à Edge Function que usa IA para extrair os campos do contrato. */
  async extract(file: File): Promise<ExtractedContractData> {
    const file_base64 = await fileToBase64(file);
    const { data, error } = await supabase.functions.invoke('extract-contract-data', {
      body: {
        file_base64,
        media_type: file.type,
        file_name: file.name,
      },
    });

    if (error) throw new Error(error.message || 'Falha ao extrair dados do contrato.');
    if (!data?.data) throw new Error('A IA não retornou dados do contrato.');
    return data.data as ExtractedContractData;
  },

  /** Faz upload do arquivo do contrato no bucket privado, sob a pasta da organização. */
  async upload(orgId: string, file: File): Promise<{ path: string; name: string }> {
    const ext = file.name.split('.').pop() || 'pdf';
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${orgId}/${Date.now()}_${rand}.${ext}`;

    const { error } = await supabase.storage
      .from(CONTRACTS_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw new Error(error.message || 'Falha ao enviar o arquivo do contrato.');
    return { path, name: file.name };
  },

  /** Gera uma URL assinada (1h) para abrir/baixar o arquivo do contrato. */
  async getSignedUrl(path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from(CONTRACTS_BUCKET)
      .createSignedUrl(path, 3600);
    if (error) return null;
    return data?.signedUrl ?? null;
  },

  /** Remove um arquivo de contrato do storage (ex.: ao trocar o anexo antes de salvar). */
  async remove(path: string): Promise<void> {
    await supabase.storage.from(CONTRACTS_BUCKET).remove([path]);
  },
};
