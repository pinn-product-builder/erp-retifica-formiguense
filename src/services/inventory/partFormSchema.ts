import { z } from 'zod';

export function normalizeNcmDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 8);
}

export const partFormNcmSchema = z
  .string()
  .transform((s) => normalizeNcmDigits(s))
  .refine((v) => v === '' || v.length === 8, { message: 'NCM deve ter 8 dígitos' });
