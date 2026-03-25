import { supabase } from '@/integrations/supabase/client';

export type BankBatchDirection = 'outbound' | 'inbound';

export class BankTransmissionService {
  static async createBatch(
    orgId: string,
    bankAccountId: string,
    direction: BankBatchDirection,
    fileHash: string,
    totalItems: number
  ): Promise<string> {
    const { data, error } = await supabase
      .from('bank_transmission_batches')
      .insert({
        org_id: orgId,
        bank_account_id: bankAccountId,
        direction,
        file_hash: fileHash,
        status: 'draft',
        total_items: totalItems,
        processed_items: 0,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return (data as { id: string }).id;
  }

  static async markProcessed(
    orgId: string,
    id: string,
    processedItems: number,
    status: string
  ): Promise<void> {
    const { error } = await supabase
      .from('bank_transmission_batches')
      .update({ processed_items: processedItems, status })
      .eq('org_id', orgId)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async findByHash(orgId: string, fileHash: string): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from('bank_transmission_batches')
      .select('id')
      .eq('org_id', orgId)
      .eq('file_hash', fileHash)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as { id: string }) ?? null;
  }
}
