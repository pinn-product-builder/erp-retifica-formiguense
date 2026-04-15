import { z } from 'zod';

export const orderNumberSearchSchema = z.object({
  orderNumber: z.string().trim().min(1, 'Informe o código da OS'),
});

export const paginatedCatalogSearchSchema = z.object({
  query: z.string().trim().default(''),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(10),
});

export const addExtraLineSchema = z.object({
  orderId: z.string().uuid(),
  budgetId: z.string().uuid().nullable().optional(),
  partId: z.string().uuid().nullable().optional(),
  partCode: z.string().trim().min(1),
  partName: z.string().trim().min(1),
  sectionName: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  unitPriceApplied: z.number().min(0),
  notes: z.string().trim().max(1000).optional(),
});

export const noteLineSchema = z.object({
  orderId: z.string().uuid(),
  partId: z.string().uuid().nullable().optional(),
  partCode: z.string().trim().min(1),
  partName: z.string().trim().min(1),
  sectionName: z.string().trim().min(1).default('Montagem'),
  quantity: z.number().int().positive(),
  unitPriceApplied: z.number().min(0).default(0),
  source: z.enum(['commercial_json', 'extra', 'substitution']).default('commercial_json'),
  isExtra: z.boolean().default(false),
  commercialLineKey: z.string().trim().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const releaseStockSchema = z.object({
  lineId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().trim().min(1),
  notes: z.string().trim().max(1000).optional(),
});

export const substituteLineSchema = z.object({
  lineId: z.string().uuid(),
  newPartId: z.string().uuid().nullable().optional(),
  newPartCode: z.string().trim().min(1),
  newPartName: z.string().trim().min(1),
  quantity: z.number().int().positive(),
  sectionName: z.string().trim().min(1).default('Montagem'),
  newUnitPrice: z.number().min(0),
  originalUnitPriceSnapshot: z.number().min(0).optional(),
  priceBasis: z.enum(['original', 'substitute', 'manual']),
  notes: z.string().trim().max(1000).optional(),
});

export const cancelPartialSchema = z.object({
  lineId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().trim().min(1),
  issueReceipt: z.boolean().default(false),
  notes: z.string().trim().max(1000).optional(),
});

export type OrderNumberSearchInput = z.infer<typeof orderNumberSearchSchema>;
export type PaginatedCatalogSearchInput = z.infer<typeof paginatedCatalogSearchSchema>;
export type AddExtraLineInput = z.infer<typeof addExtraLineSchema>;
export type NoteLineInput = z.infer<typeof noteLineSchema>;
export type ReleaseStockInput = z.infer<typeof releaseStockSchema>;
export type SubstituteLineInput = z.infer<typeof substituteLineSchema>;
export type CancelPartialInput = z.infer<typeof cancelPartialSchema>;
export type PriceBasis = z.infer<typeof substituteLineSchema>['priceBasis'];
