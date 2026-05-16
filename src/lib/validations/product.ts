import * as z from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be greater than zero'),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
});

export type ProductInput = z.infer<typeof productSchema>;

export const toggleProductStatusSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
});
