import { z } from 'zod';

/** Busca por CPF/CNPJ (com ou sem máscara). */
export const customerArPositionSearchSchema = z.object({
  document: z
    .string()
    .min(3, 'Informe documento')
    .max(32, 'Documento inválido'),
});

export type CustomerArPositionSearchInput = z.infer<typeof customerArPositionSearchSchema>;
