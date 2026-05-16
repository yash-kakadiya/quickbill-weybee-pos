import * as z from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const toggleCategoryStatusSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
});
