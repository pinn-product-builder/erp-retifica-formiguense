import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'invoices';

export class ApInvoiceFileService {
  static async upload(orgId: string, file: File): Promise<{ storagePath: string | null; error: Error | null }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const stamp = Date.now();
    const suffix =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Math.random()).slice(2);
    const objectPath = `${orgId}/${stamp}_${suffix}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) return { storagePath: null, error: new Error(error.message) };
    return { storagePath: objectPath, error: null };
  }

  static async getSignedUrl(
    storagePath: string,
    expiresSec = 3600
  ): Promise<{ url: string | null; error: Error | null }> {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresSec);
    if (error) return { url: null, error: new Error(error.message) };
    return { url: data.signedUrl, error: null };
  }
}
