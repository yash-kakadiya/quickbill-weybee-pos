import { z } from 'zod';

export const aiSearchSchema = z.object({
  keyword: z.string().optional().describe("A specific product name or generic term (e.g. 'pen', 'notebook'). Leave undefined if no keyword is present."),
  maxPrice: z.number().optional().describe("Maximum price requested."),
  minPrice: z.number().optional().describe("Minimum price requested."),
  category: z.string().optional().describe("Product category requested (e.g. 'electronics', 'stationery')."),
  stockStatus: z.enum(['in_stock', 'low_stock', 'out_of_stock', 'any']).default('any').describe("Requested stock availability."),
  popularity: z.boolean().optional().describe("True if user is looking for top selling, popular, or high momentum products."),
});

export type AISearchParams = z.infer<typeof aiSearchSchema>;
